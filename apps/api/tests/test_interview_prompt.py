"""Interview prompt builder unit tests."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.models.interview_message import InterviewMessage
from app.models.interview_session import InterviewSession
from app.services.llm.interview_prompt import (
    build_interview_chat_messages,
    interviewer_response_client_message_id,
)


def _session() -> InterviewSession:
    return InterviewSession(
        id=uuid4(),
        user_id=uuid4(),
        category="software_engineering",
        role="Software Engineer",
        experience_level="mid",
        focus_areas=["System Design", "Programming & Problem Solving"],
        difficulty="medium",
        duration_minutes=30,
        status="in_progress",
    )


def _message(
    *,
    session_id,
    speaker: str,
    content: str,
    sequence: int,
) -> InterviewMessage:
    return InterviewMessage(
        id=uuid4(),
        session_id=session_id,
        speaker=speaker,
        content=content,
        sequence=sequence,
        client_message_id=uuid4(),
        created_at=datetime.now(timezone.utc),
    )


def test_interviewer_response_client_id_is_deterministic() -> None:
    session_id = uuid4()
    candidate_id = uuid4()
    first = interviewer_response_client_message_id(
        session_id=session_id,
        candidate_client_message_id=candidate_id,
    )
    second = interviewer_response_client_message_id(
        session_id=session_id,
        candidate_client_message_id=candidate_id,
    )
    assert first == second
    assert first != candidate_id


def test_prompt_includes_session_config_and_transcript_order() -> None:
    session = _session()
    messages = [
        _message(
            session_id=session.id,
            speaker="interviewer",
            content="Welcome. Tell me about yourself.",
            sequence=1,
        ),
        _message(
            session_id=session.id,
            speaker="candidate",
            content="I build APIs with FastAPI.",
            sequence=2,
        ),
    ]
    chat = build_interview_chat_messages(
        session=session,
        messages=messages,
        latest_candidate_message=messages[1],
    )
    assert chat[0].role == "system"
    assert "Software Engineer" in chat[0].content
    assert "System Design" in chat[0].content
    assert "mid" in chat[0].content
    assert chat[1].role == "assistant"
    assert "Welcome" in chat[1].content
    assert chat[2].role == "user"
    assert "FastAPI" in chat[2].content
    assert chat[-1].role == "system"
    assert "one next question" in chat[-1].content.lower()
