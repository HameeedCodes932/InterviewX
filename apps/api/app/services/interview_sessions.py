"""Interview session persistence service."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.interview_session import InterviewSession
from app.models.user import User
from app.schemas.interview import InterviewSessionCreate

SESSION_STATUS_IN_PROGRESS = "in_progress"
SESSION_STATUS_COMPLETED = "completed"


def create_interview_session(
    db: Session,
    *,
    user: User,
    payload: InterviewSessionCreate,
) -> InterviewSession:
    session = InterviewSession(
        user_id=user.id,
        category=payload.category,
        role=payload.role,
        experience_level=payload.experience_level,
        focus_areas=list(payload.focus_areas),
        difficulty=payload.difficulty,
        duration_minutes=payload.duration_minutes,
        # Start Interview creates the session and enters the room immediately.
        status=SESSION_STATUS_IN_PROGRESS,
        completed_at=None,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_owned_interview_session(
    db: Session,
    *,
    user: User,
    session_id: UUID,
) -> InterviewSession | None:
    return db.scalar(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user.id,
        )
    )


def complete_owned_interview_session(
    db: Session,
    *,
    user: User,
    session_id: UUID,
) -> InterviewSession | None:
    """Mark an owned session completed.

    Idempotent: already-completed sessions are returned unchanged and keep
    their original completed_at timestamp.
    """
    session = get_owned_interview_session(db, user=user, session_id=session_id)
    if session is None:
        return None

    if session.status == SESSION_STATUS_COMPLETED and session.completed_at is not None:
        return session

    now = datetime.now(UTC)
    if session.completed_at is None:
        session.completed_at = now
    session.status = SESSION_STATUS_COMPLETED
    db.add(session)
    db.commit()
    db.refresh(session)
    return session
