"""Health check response schemas."""

from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    service: str = Field(description="Service name")
    environment: str = Field(description="Configured application environment")


class DatabaseHealthResponse(BaseModel):
    status: Literal["ok", "error"]
    database: Literal["connected", "unreachable"]
    detail: str | None = None
