from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CategoryOut(BaseModel):
    slug: str
    name: str
    description: str
    available: bool
    disclaimer: str | None = None
    sort_order: int

    model_config = {"from_attributes": True}


class InterviewSessionOut(BaseModel):
    id: UUID
    category_slug: str
    status: str
    interviewer_gender: str | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    created_at: datetime
    has_report: bool = False

    model_config = {"from_attributes": True}


class EvaluationReportOut(BaseModel):
    id: UUID
    session_id: UUID
    summary: str | None = None
    qualitative: str | None = None
    rubric: dict | None = None
    overall_score: float | None = None
    created_at: datetime
    category_slug: str | None = None

    model_config = {"from_attributes": True}


class DashboardOut(BaseModel):
    full_name: str
    email: str
    preferred_interviewer: str | None = None
    categories: list[CategoryOut]
    recent_sessions: list[InterviewSessionOut]
    performance_overview: dict
