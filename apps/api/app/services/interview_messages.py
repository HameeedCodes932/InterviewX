"""Interview conversation message persistence service."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.interview_message import InterviewMessage
from app.models.user import User
from app.schemas.interview import InterviewMessageCreate
from app.services.interview_sessions import (
    SESSION_STATUS_COMPLETED,
    get_owned_interview_session,
)


class InterviewMessageError(Exception):
    """Domain error for message writes."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def list_owned_interview_messages(
    db: Session,
    *,
    user: User,
    session_id: UUID,
) -> list[InterviewMessage] | None:
    """Return messages for an owned session, or None if the session is missing."""
    session = get_owned_interview_session(db, user=user, session_id=session_id)
    if session is None:
        return None

    return list(
        db.scalars(
            select(InterviewMessage)
            .where(InterviewMessage.session_id == session_id)
            .order_by(
                InterviewMessage.sequence.asc(),
                InterviewMessage.created_at.asc(),
                InterviewMessage.id.asc(),
            )
        ).all()
    )


def _next_sequence(db: Session, *, session_id: UUID) -> int:
    current = db.scalar(
        select(func.coalesce(func.max(InterviewMessage.sequence), 0)).where(
            InterviewMessage.session_id == session_id
        )
    )
    return int(current or 0) + 1


def _existing_by_client_id(
    db: Session,
    *,
    session_id: UUID,
    client_message_id: UUID,
) -> InterviewMessage | None:
    return db.scalar(
        select(InterviewMessage).where(
            InterviewMessage.session_id == session_id,
            InterviewMessage.client_message_id == client_message_id,
        )
    )


def create_owned_interview_message(
    db: Session,
    *,
    user: User,
    session_id: UUID,
    payload: InterviewMessageCreate,
) -> InterviewMessage:
    """Persist a message for an owned in-progress session.

    Idempotent on ``client_message_id``: a retry with the same client id returns
    the already-persisted row without creating a duplicate.
    """
    session = get_owned_interview_session(db, user=user, session_id=session_id)
    if session is None:
        raise InterviewMessageError("not_found", "Interview session not found.")

    if session.status == SESSION_STATUS_COMPLETED:
        raise InterviewMessageError(
            "completed",
            "Cannot add messages to a completed interview session.",
        )

    existing = _existing_by_client_id(
        db,
        session_id=session_id,
        client_message_id=payload.client_message_id,
    )
    if existing is not None:
        return existing

    message = InterviewMessage(
        session_id=session.id,
        speaker=payload.speaker,
        content=payload.content,
        sequence=_next_sequence(db, session_id=session.id),
        client_message_id=payload.client_message_id,
    )
    db.add(message)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # Concurrent retry with the same client_message_id, or a rare sequence
        # collision — re-read by client id when present, otherwise retry once.
        raced = _existing_by_client_id(
            db,
            session_id=session_id,
            client_message_id=payload.client_message_id,
        )
        if raced is not None:
            return raced
        message = InterviewMessage(
            session_id=session.id,
            speaker=payload.speaker,
            content=payload.content,
            sequence=_next_sequence(db, session_id=session.id),
            client_message_id=payload.client_message_id,
        )
        db.add(message)
        db.commit()

    db.refresh(message)
    return message
