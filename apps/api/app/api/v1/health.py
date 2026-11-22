"""Health endpoints for API and database readiness."""

from fastapi import APIRouter, Response, status

from app.config import get_settings
from app.core.database import engine
from app.schemas.health import DatabaseHealthResponse, HealthResponse
from app.services.health import check_database

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def api_health() -> HealthResponse:
    """Confirm the API process is running."""
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        environment=settings.app_env,
    )


@router.get(
    "/health/database",
    response_model=DatabaseHealthResponse,
    responses={
        503: {"model": DatabaseHealthResponse, "description": "Database unreachable"},
    },
)
def database_health(response: Response) -> DatabaseHealthResponse:
    """Verify PostgreSQL connectivity for this deployment."""
    result = check_database(engine)
    if result.status != "ok":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return result
