from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.interview import (
    Category,
    EvaluationReport,
    InterviewSession,
    TranscriptTurn,
    UsageEvent,
)
from app.models.user import User
from app.schemas.interview import (
    SessionDetailOut,
    StartInterviewRequest,
    StartInterviewResponse,
    TranscriptTurnOut,
    UsageRecordRequest,
)
from app.services.evaluation import generate_se_evaluation
from app.services.livekit import create_participant_token, ensure_room_and_dispatch

logger = logging.getLogger("interviewx.interviews")


async def start_interview(
    db: Session, user: User, payload: StartInterviewRequest
) -> StartInterviewResponse:
    if payload.category_slug != "software-engineering":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Software Engineering interviews are available right now",
        )

    category = db.scalar(
        select(Category).where(Category.slug == payload.category_slug)
    )
    if category is None or not category.available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category is not available",
        )

    gender = payload.interviewer_gender
    if not gender and user.profile:
        gender = user.profile.preferred_interviewer
    if gender not in ("male", "female"):
        gender = "female"

    session = InterviewSession(
        user_id=user.id,
        category_slug=payload.category_slug,
        status="active",
        interviewer_gender=gender,
        language=payload.language or "en",
        difficulty=payload.difficulty or "mid",
        room_name=f"ix-{uuid4().hex[:16]}",
        config={
            "personality": "professional",
            "category": payload.category_slug,
        },
        started_at=datetime.now(timezone.utc),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    settings = get_settings()
    assert session.room_name is not None

    try:
        await ensure_room_and_dispatch(
            room_name=session.room_name,
            session_id=str(session.id),
            category_slug=session.category_slug,
            interviewer_gender=session.interviewer_gender,
            language=session.language,
            difficulty=session.difficulty,
            candidate_name=user.full_name,
        )
    except Exception as exc:
        session.status = "error"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Could not create LiveKit room or dispatch agent. "
                "Start livekit-server and the agent worker, then try again."
            ),
        ) from exc

    token = create_participant_token(
        room_name=session.room_name,
        identity=f"candidate-{user.id}",
        name=user.full_name,
        metadata={"role": "candidate", "session_id": str(session.id)},
    )

    return StartInterviewResponse(
        session_id=session.id,
        room_name=session.room_name,
        livekit_url=settings.livekit_public_url,
        token=token,
        status=session.status,
        category_slug=session.category_slug,
        interviewer_gender=session.interviewer_gender,
        language=session.language,
    )


def append_transcript(
    db: Session,
    session_id: UUID,
    role: str,
    text: str,
    turn_index: int | None = None,
) -> TranscriptTurnOut:
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if role not in ("candidate", "interviewer"):
        raise HTTPException(status_code=400, detail="Invalid role")

    if turn_index is None:
        current = db.scalar(
            select(func.coalesce(func.max(TranscriptTurn.turn_index), -1)).where(
                TranscriptTurn.session_id == session_id
            )
        )
        turn_index = int(current) + 1

    turn = TranscriptTurn(
        session_id=session_id,
        role=role,
        text=text.strip(),
        turn_index=turn_index,
    )
    db.add(turn)
    db.commit()
    db.refresh(turn)
    return TranscriptTurnOut.model_validate(turn)


def record_usage(db: Session, session_id: UUID, payload: UsageRecordRequest) -> None:
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    db.add(
        UsageEvent(
            session_id=session_id,
            provider=payload.provider,
            metric=payload.metric,
            quantity=payload.quantity,
            unit=payload.unit,
            estimated_cost_usd=payload.estimated_cost_usd,
            meta=payload.meta,
        )
    )
    db.commit()


def get_session_detail(db: Session, session: InterviewSession) -> SessionDetailOut:
    turns = db.scalars(
        select(TranscriptTurn)
        .where(TranscriptTurn.session_id == session.id)
        .order_by(TranscriptTurn.turn_index, TranscriptTurn.created_at)
    ).all()
    report = db.scalar(
        select(EvaluationReport).where(EvaluationReport.session_id == session.id)
    )
    return SessionDetailOut(
        id=session.id,
        category_slug=session.category_slug,
        status=session.status,
        interviewer_gender=session.interviewer_gender,
        language=session.language,
        difficulty=session.difficulty,
        room_name=session.room_name,
        started_at=session.started_at,
        ended_at=session.ended_at,
        created_at=session.created_at,
        transcript=[TranscriptTurnOut.model_validate(t) for t in turns],
        report_id=report.id if report else None,
    )


async def end_interview(
    db: Session, session: InterviewSession, reason: str = "candidate_ended"
) -> SessionDetailOut:
    if session.status in ("completed", "evaluated"):
        return get_session_detail(db, session)

    session.status = "completed"
    session.ended_at = datetime.now(timezone.utc)
    if session.config is None:
        session.config = {}
    session.config = {**session.config, "end_reason": reason}
    db.commit()

    turns = db.scalars(
        select(TranscriptTurn)
        .where(TranscriptTurn.session_id == session.id)
        .order_by(TranscriptTurn.turn_index, TranscriptTurn.created_at)
    ).all()
    transcript = [
        {"role": t.role, "text": t.text, "turn_index": t.turn_index} for t in turns
    ]

    report_data = await generate_se_evaluation(transcript)
    existing = db.scalar(
        select(EvaluationReport).where(EvaluationReport.session_id == session.id)
    )
    if existing is None:
        report = EvaluationReport(
            session_id=session.id,
            user_id=session.user_id,
            summary=report_data.get("summary"),
            qualitative=report_data.get("qualitative"),
            rubric=report_data.get("rubric"),
            overall_score=float(report_data.get("overall_score") or 0),
        )
        db.add(report)
    else:
        existing.summary = report_data.get("summary")
        existing.qualitative = report_data.get("qualitative")
        existing.rubric = report_data.get("rubric")
        existing.overall_score = float(report_data.get("overall_score") or 0)

    session.status = "evaluated"
    db.commit()
    db.refresh(session)
    return get_session_detail(db, session)
