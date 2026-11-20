from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_agent_api_key
from app.core.database import get_db
from app.models.interview import InterviewSession
from app.models.user import User
from app.schemas.interview import (
    EndInterviewRequest,
    SessionDetailOut,
    StartInterviewRequest,
    StartInterviewResponse,
    TranscriptAppendRequest,
    TranscriptTurnOut,
    UsageRecordRequest,
)
from app.schemas.auth import MessageResponse
from app.services import interviews as interview_service

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.post("/start", response_model=StartInterviewResponse)
async def start_interview(
    payload: StartInterviewRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StartInterviewResponse:
    return await interview_service.start_interview(db, user, payload)


@router.get("/{session_id}", response_model=SessionDetailOut)
def get_interview(
    session_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SessionDetailOut:
    session = db.get(InterviewSession, session_id)
    if session is None or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    return interview_service.get_session_detail(db, session)


@router.post("/{session_id}/end", response_model=SessionDetailOut)
async def end_interview(
    session_id: UUID,
    payload: EndInterviewRequest | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SessionDetailOut:
    session = db.get(InterviewSession, session_id)
    if session is None or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    reason = payload.reason if payload else "candidate_ended"
    return await interview_service.end_interview(db, session, reason)


@router.post(
    "/{session_id}/transcript",
    response_model=TranscriptTurnOut,
    dependencies=[Depends(require_agent_api_key)],
)
def append_transcript(
    session_id: UUID,
    payload: TranscriptAppendRequest,
    db: Session = Depends(get_db),
) -> TranscriptTurnOut:
    return interview_service.append_transcript(
        db,
        session_id,
        role=payload.role,
        text=payload.text,
        turn_index=payload.turn_index,
    )


@router.post(
    "/{session_id}/usage",
    response_model=MessageResponse,
    dependencies=[Depends(require_agent_api_key)],
)
def record_usage(
    session_id: UUID,
    payload: UsageRecordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    interview_service.record_usage(db, session_id, payload)
    return MessageResponse(message="Usage recorded")


@router.post(
    "/{session_id}/agent-end",
    response_model=SessionDetailOut,
    dependencies=[Depends(require_agent_api_key)],
)
async def agent_end_interview(
    session_id: UUID,
    payload: EndInterviewRequest | None = None,
    db: Session = Depends(get_db),
) -> SessionDetailOut:
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    reason = payload.reason if payload else "agent_ended"
    return await interview_service.end_interview(db, session, reason)


@router.get(
    "/{session_id}/bootstrap",
    dependencies=[Depends(require_agent_api_key)],
)
def agent_bootstrap(session_id: UUID, db: Session = Depends(get_db)) -> dict:
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": str(session.id),
        "category_slug": session.category_slug,
        "interviewer_gender": session.interviewer_gender,
        "language": session.language,
        "difficulty": session.difficulty,
        "status": session.status,
        "config": session.config or {},
    }
