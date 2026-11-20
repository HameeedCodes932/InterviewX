from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class StartInterviewRequest(BaseModel):
    category_slug: str = "software-engineering"
    interviewer_gender: str | None = Field(
        default=None, description="male | female; falls back to profile preference"
    )
    language: str = "en"
    difficulty: str = "mid"


class StartInterviewResponse(BaseModel):
    session_id: UUID
    room_name: str
    livekit_url: str
    token: str
    status: str
    category_slug: str
    interviewer_gender: str | None
    language: str


class TranscriptAppendRequest(BaseModel):
    role: str = Field(description="candidate | interviewer")
    text: str
    turn_index: int | None = None


class TranscriptTurnOut(BaseModel):
    id: UUID
    role: str
    text: str
    turn_index: int
    created_at: datetime

    model_config = {"from_attributes": True}


class UsageRecordRequest(BaseModel):
    provider: str
    metric: str
    quantity: float
    unit: str = "count"
    estimated_cost_usd: float = 0.0
    meta: dict | None = None


class EndInterviewRequest(BaseModel):
    reason: str = "candidate_ended"


class SessionDetailOut(BaseModel):
    id: UUID
    category_slug: str
    status: str
    interviewer_gender: str | None
    language: str
    difficulty: str
    room_name: str | None
    started_at: datetime | None
    ended_at: datetime | None
    created_at: datetime
    transcript: list[TranscriptTurnOut]
    report_id: UUID | None = None

    model_config = {"from_attributes": True}
