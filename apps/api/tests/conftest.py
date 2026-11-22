"""Pytest fixtures for API authentication tests."""

from __future__ import annotations

import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

# Configure settings before importing the app.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://interviewx:CHANGE_ME@127.0.0.1:5432/interviewx",
)
os.environ["JWT_SECRET_KEY"] = "test-secret-key-not-for-production"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"
os.environ["APP_ENV"] = "test"

from app.config import get_settings  # noqa: E402
from app.core.database import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Base  # noqa: E402

get_settings.cache_clear()


@pytest.fixture(scope="session")
def database_url() -> str:
    settings = get_settings()
    return settings.database_url


@pytest.fixture()
def db_session(database_url: str):
    schema = f"test_{uuid.uuid4().hex}"
    admin_engine = create_engine(database_url, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as connection:
        connection.execute(text(f'CREATE SCHEMA "{schema}"'))

    engine = create_engine(
        database_url,
        poolclass=NullPool,
        connect_args={"options": f'-csearch_path="{schema}"'},
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        with admin_engine.connect() as connection:
            connection.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))
        admin_engine.dispose()


@pytest.fixture()
def client(db_session: Session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
