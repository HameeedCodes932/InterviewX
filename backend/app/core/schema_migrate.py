"""Lightweight schema evolve for local/dev (create_all does not ALTER)."""

from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger("interviewx.migrate")

ALTERS = [
    "ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS language VARCHAR(16) DEFAULT 'en'",
    "ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(32) DEFAULT 'mid'",
    "ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS room_name VARCHAR(128)",
    "ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS config JSONB",
    "ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS qualitative TEXT",
    "ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS overall_score DOUBLE PRECISION",
]


def ensure_columns(engine: Engine) -> None:
    with engine.begin() as conn:
        for stmt in ALTERS:
            try:
                conn.execute(text(stmt))
            except Exception:
                logger.exception("Migration statement failed: %s", stmt)
        # Unique index on room_name when present
        try:
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ix_interview_sessions_room_name "
                    "ON interview_sessions (room_name) WHERE room_name IS NOT NULL"
                )
            )
        except Exception:
            logger.exception("Could not create room_name index")
