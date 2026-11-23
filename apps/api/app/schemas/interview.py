"""Interview session request and response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

Category = Literal["software_engineering"]
ExperienceLevel = Literal["entry", "junior", "mid", "senior"]
Difficulty = Literal["easy", "medium", "hard", "mixed"]
DurationMinutes = Literal[15, 30, 45, 60]

ALLOWED_ROLES = frozenset(
    {
        "Software Engineer",
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
        "Python Developer",
        "AI/ML Engineer",
    }
)
ALLOWED_FOCUS_AREAS = frozenset(
    {
        "Programming & Problem Solving",
        "Data Structures & Algorithms",
        "System Design",
        "Database & SQL",
        "Software Engineering Fundamentals",
        "Role-Specific Technical Questions",
    }
)


class InterviewSessionCreate(BaseModel):
    category: Category
    role: str = Field(min_length=1, max_length=120)
    experience_level: ExperienceLevel
    focus_areas: Annotated[list[str], Field(min_length=1)]
    difficulty: Difficulty
    duration_minutes: DurationMinutes

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        cleaned = value.strip()
        if cleaned not in ALLOWED_ROLES:
            raise ValueError("Unsupported target role.")
        return cleaned

    @field_validator("focus_areas")
    @classmethod
    def validate_focus_areas(cls, value: list[str]) -> list[str]:
        if not value:
            raise ValueError("Select at least one interview focus.")
        cleaned = [item.strip() for item in value]
        if any(not item for item in cleaned):
            raise ValueError("Focus areas cannot be empty.")
        if len(cleaned) != len(set(cleaned)):
            raise ValueError("Duplicate focus areas are not allowed.")
        unsupported = [item for item in cleaned if item not in ALLOWED_FOCUS_AREAS]
        if unsupported:
            raise ValueError("Unsupported interview focus area.")
        return cleaned


class InterviewSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    category: Category
    role: str
    experience_level: ExperienceLevel
    focus_areas: list[str]
    difficulty: Difficulty
    duration_minutes: DurationMinutes
    status: str
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class InterviewSessionListResponse(BaseModel):
    items: list[InterviewSessionResponse]
    total: int
    limit: int
    offset: int


MessageSpeaker = Literal["interviewer", "candidate"]

MAX_MESSAGE_CONTENT_LENGTH = 8000


class InterviewMessageCreate(BaseModel):
    speaker: MessageSpeaker
    content: str = Field(min_length=1, max_length=MAX_MESSAGE_CONTENT_LENGTH)
    client_message_id: UUID

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Message content cannot be empty.")
        if len(cleaned) > MAX_MESSAGE_CONTENT_LENGTH:
            raise ValueError("Message content is too long.")
        return cleaned


class InterviewMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    speaker: MessageSpeaker
    content: str
    sequence: int
    client_message_id: UUID
    created_at: datetime


class InterviewMessageListResponse(BaseModel):
    items: list[InterviewMessageResponse]


class InterviewRespondRequest(BaseModel):
    """Request an AI interviewer reply for an already-persisted candidate message."""

    candidate_client_message_id: UUID
