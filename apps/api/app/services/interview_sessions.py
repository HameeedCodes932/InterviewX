"""Interview session persistence service."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.interview_session import InterviewSession
from app.models.user import User
from app.schemas.interview import InterviewSessionCreate


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
        status="created",
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
