from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class ProfileOut(BaseModel):
    user_id: UUID
    email: EmailStr
    full_name: str
    headline: str | None = None
    bio: str | None = None
    interview_goal: str | None = None
    preferred_language: str = "en"
    preferred_interviewer: str | None = None
    location: str | None = None
    target_role: str | None = None

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    headline: str | None = Field(default=None, max_length=240)
    bio: str | None = None
    interview_goal: str | None = None
    preferred_language: str | None = Field(default=None, max_length=16)
    preferred_interviewer: str | None = Field(default=None, max_length=32)
    location: str | None = Field(default=None, max_length=120)
    target_role: str | None = Field(default=None, max_length=160)
