"""Health check service helpers."""

from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError

from app.schemas.health import DatabaseHealthResponse


def check_database(engine: Engine) -> DatabaseHealthResponse:
    """Run a trivial query to confirm PostgreSQL connectivity."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return DatabaseHealthResponse(
            status="ok",
            database="connected",
            detail="PostgreSQL accepted a connectivity probe.",
        )
    except SQLAlchemyError as exc:
        return DatabaseHealthResponse(
            status="error",
            database="unreachable",
            detail=str(exc.__class__.__name__),
        )
    except Exception as exc:  # noqa: BLE001 — surface unexpected driver failures clearly
        return DatabaseHealthResponse(
            status="error",
            database="unreachable",
            detail=str(exc.__class__.__name__),
        )
