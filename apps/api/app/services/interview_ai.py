"""Generate and persist AI interviewer turns for owned sessions."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.models.interview_message import InterviewMessage
from app.models.interview_session import InterviewSession
from app.models.user import User
from app.schemas.interview import InterviewMessageCreate
from app.services.interview_messages import (
    InterviewMessageError,
    create_owned_interview_message,
    list_owned_interview_messages,
)
from app.services.interview_sessions import SESSION_STATUS_COMPLETED
from app.services.llm.interview_prompt import (
    build_interview_chat_messages,
    interviewer_response_client_message_id,
)
from app.services.llm.provider import LlmProviderError, complete_chat


class InterviewAiError(Exception):
    """Domain error for AI interview turns."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def _get_owned_session(
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


def _get_message_by_client_id(
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


def generate_owned_interview_response(
    db: Session,
    *,
    user: User,
    session_id: UUID,
    candidate_client_message_id: UUID,
    settings: Settings | None = None,
) -> InterviewMessage:
    """Generate (or return existing) interviewer reply for a candidate turn.

    Ownership and message validation happen before any provider call. The
    database transaction is not held open during the external LLM request.
    Persistence reuses the existing idempotent message writer so concurrent
    retries cannot create duplicate interviewer rows.
    """
    cfg = settings or get_settings()

    session = _get_owned_session(db, user=user, session_id=session_id)
    if session is None:
        raise InterviewAiError("not_found", "Interview session not found.")

    if session.status == SESSION_STATUS_COMPLETED:
        raise InterviewAiError(
            "completed",
            "Cannot generate AI responses for a completed interview session.",
        )

    candidate = _get_message_by_client_id(
        db,
        session_id=session_id,
        client_message_id=candidate_client_message_id,
    )
    if candidate is None:
        raise InterviewAiError(
            "candidate_not_found",
            "Candidate message not found for this interview session.",
        )
    if candidate.speaker != "candidate":
        raise InterviewAiError(
            "invalid_candidate",
            "AI responses can only be generated for candidate messages.",
        )

    response_client_id = interviewer_response_client_message_id(
        session_id=session_id,
        candidate_client_message_id=candidate_client_message_id,
    )

    existing = _get_message_by_client_id(
        db,
        session_id=session_id,
        client_message_id=response_client_id,
    )
    if existing is not None:
        # End the read transaction cleanly before returning.
        db.commit()
        return existing

    transcript = list_owned_interview_messages(
        db,
        user=user,
        session_id=session_id,
    )
    if transcript is None:
        raise InterviewAiError("not_found", "Interview session not found.")

    chat_messages = build_interview_chat_messages(
        session=session,
        messages=transcript,
        latest_candidate_message=candidate,
    )

    # Release any DB resources before the external provider call.
    # Detach needed ORM data into plain values already captured above.
    db.commit()

    try:
        completion = complete_chat(
            settings=cfg,
            messages=[item.as_dict() for item in chat_messages],
        )
    except LlmProviderError as exc:
        raise InterviewAiError(exc.code, exc.message) from exc

    try:
        return create_owned_interview_message(
            db,
            user=user,
            session_id=session_id,
            payload=InterviewMessageCreate(
                speaker="interviewer",
                content=completion.content,
                client_message_id=response_client_id,
            ),
        )
    except InterviewMessageError as exc:
        # Concurrent writer may have persisted the same client_message_id.
        if exc.code == "not_found":
            raise InterviewAiError("not_found", exc.message) from exc
        if exc.code == "completed":
            raced = _get_message_by_client_id(
                db,
                session_id=session_id,
                client_message_id=response_client_id,
            )
            if raced is not None:
                db.commit()
                return raced
            raise InterviewAiError("completed", exc.message) from exc
        if exc.code == "conflict":
            raced = _get_message_by_client_id(
                db,
                session_id=session_id,
                client_message_id=response_client_id,
            )
            if raced is not None:
                db.commit()
                return raced
            raise InterviewAiError("conflict", exc.message) from exc
        raise InterviewAiError(exc.code, exc.message) from exc
