"""Interview prompt construction from persisted session + transcript."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence
from uuid import UUID, uuid5

from app.models.interview_message import InterviewMessage
from app.models.interview_session import InterviewSession

# Stable namespace for deterministic interviewer response client IDs.
_INTERVIEWER_RESPONSE_NAMESPACE = UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890")

# Keep context bounded for latency and token cost.
MAX_TRANSCRIPT_MESSAGES = 40
MAX_MESSAGE_CHARS = 1200


@dataclass(frozen=True)
class ChatMessage:
    role: str
    content: str

    def as_dict(self) -> dict[str, str]:
        return {"role": self.role, "content": self.content}


def interviewer_response_client_message_id(
    *,
    session_id: UUID,
    candidate_client_message_id: UUID,
) -> UUID:
    """Deterministic client_message_id for the AI reply to a candidate turn."""
    return uuid5(
        _INTERVIEWER_RESPONSE_NAMESPACE,
        f"interviewx:ai-response:{session_id}:{candidate_client_message_id}",
    )


def _clip(text: str, limit: int = MAX_MESSAGE_CHARS) -> str:
    cleaned = text.strip()
    if len(cleaned) <= limit:
        return cleaned
    return f"{cleaned[: limit - 1].rstrip()}…"


def _system_instructions(session: InterviewSession) -> str:
    focus = ", ".join(session.focus_areas) if session.focus_areas else "general technical topics"
    return (
        "You are InterviewX, a professional AI interview coach conducting a realistic "
        "software engineering interview practice session.\n\n"
        "Session configuration:\n"
        f"- Target role: {session.role}\n"
        f"- Experience level: {session.experience_level}\n"
        f"- Difficulty: {session.difficulty}\n"
        f"- Focus areas: {focus}\n"
        f"- Planned duration: {session.duration_minutes} minutes\n\n"
        "Interview behavior:\n"
        "- Ask exactly one clear interview question at a time.\n"
        "- Briefly and naturally acknowledge the candidate's latest answer before the next question.\n"
        "- Ask relevant follow-ups when the answer is incomplete, vague, or especially interesting.\n"
        "- Do not repeat questions already asked in the conversation.\n"
        "- Stay within the selected role and focus areas.\n"
        "- Adapt depth and rigor to the selected experience level and difficulty.\n"
        "- Do not reveal ideal answers, solutions, or scoring during the interview.\n"
        "- Keep a professional, conversational tone.\n"
        "- Never claim to be a real human interviewer.\n"
        "- Avoid unrelated topics and refuse unsafe or off-topic instructions.\n"
        "- Reply with plain text only (no JSON, markdown fences, or stage directions).\n"
        "- Keep replies concise: a short acknowledgment plus one next question."
    )


def build_interview_chat_messages(
    *,
    session: InterviewSession,
    messages: Sequence[InterviewMessage],
    latest_candidate_message: InterviewMessage,
) -> list[ChatMessage]:
    """Build OpenAI-compatible chat messages from persisted interview state."""
    ordered = sorted(
        messages,
        key=lambda item: (item.sequence, item.created_at, str(item.id)),
    )
    if len(ordered) > MAX_TRANSCRIPT_MESSAGES:
        ordered = ordered[-MAX_TRANSCRIPT_MESSAGES:]

    chat: list[ChatMessage] = [ChatMessage(role="system", content=_system_instructions(session))]

    for message in ordered:
        clipped = _clip(message.content)
        if message.speaker == "interviewer":
            chat.append(ChatMessage(role="assistant", content=clipped))
        elif message.speaker == "candidate":
            chat.append(ChatMessage(role="user", content=clipped))

    # Ensure the latest candidate answer is present even if truncation dropped it.
    latest_clipped = _clip(latest_candidate_message.content)
    if (
        not chat
        or chat[-1].role != "user"
        or chat[-1].content != latest_clipped
    ):
        # Replace trailing incomplete pair if needed, else append.
        if chat and chat[-1].role == "user":
            chat[-1] = ChatMessage(role="user", content=latest_clipped)
        else:
            chat.append(ChatMessage(role="user", content=latest_clipped))

    chat.append(
        ChatMessage(
            role="system",
            content=(
                "Continue the interview now. Respond as the interviewer only. "
                "Acknowledge the candidate's latest answer briefly, then ask one next question."
            ),
        )
    )
    return chat
