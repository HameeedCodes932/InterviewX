"""Interview conversation message persistence service."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.interview_message import InterviewMessage
from app.models.interview_session import InterviewSession
from app.models.user import User
from app.schemas.interview import InterviewMessageCreate
from app.services.interview_sessions import SESSION_STATUS_COMPLETED

# Bounded retries only for rare sequence unique-constraint races after a lock
# was released by rollback. Per-session FOR UPDATE is the primary serialization.
_MAX_WRITE_ATTEMPTS = 5


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
    session = db.scalar(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user.id,
        )
    )
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


def _lock_owned_session(
    db: Session,
    *,
    user: User,
    session_id: UUID,
) -> InterviewSession | None:
    """Lock the owned session row so message sequence allocation is serialized."""
    return db.scalar(
        select(InterviewSession)
        .where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user.id,
        )
        .with_for_update()
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

    Ownership is established (and the session row locked) before any
    idempotency lookup or message payload is returned. Sequence numbers are
    allocated under that lock so concurrent writers cannot collide.
    """
    last_error: Exception | None = None
    for _ in range(_MAX_WRITE_ATTEMPTS):
        try:
            session = _lock_owned_session(db, user=user, session_id=session_id)
            if session is None:
                raise InterviewMessageError(
                    "not_found",
                    "Interview session not found.",
                )

            if session.status == SESSION_STATUS_COMPLETED:
                raise InterviewMessageError(
                    "completed",
                    "Cannot add messages to a completed interview session.",
                )

            # Idempotency only after ownership is confirmed under the lock.
            existing = _existing_by_client_id(
                db,
                session_id=session_id,
                client_message_id=payload.client_message_id,
            )
            if existing is not None:
                db.commit()
                return existing

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
        except InterviewMessageError:
            db.rollback()
            raise
        except IntegrityError as exc:
            db.rollback()
            last_error = exc
            # Re-establish ownership before returning any raced row.
            session = _lock_owned_session(db, user=user, session_id=session_id)
            if session is None:
                raise InterviewMessageError(
                    "not_found",
                    "Interview session not found.",
                ) from exc
            raced = _existing_by_client_id(
                db,
                session_id=session_id,
                client_message_id=payload.client_message_id,
            )
            if raced is not None:
                db.commit()
                return raced
            db.rollback()
            # Sequence unique violation under rare timing — retry with a fresh lock.
            continue

    raise InterviewMessageError(
        "conflict",
        "Unable to save the message due to a concurrent update. Please retry.",
    ) from last_error
