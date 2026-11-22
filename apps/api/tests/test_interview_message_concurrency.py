"""Concurrency tests for per-session message sequence allocation.

Uses separate SQLAlchemy sessions/connections against the same PostgreSQL
test schema so ``SELECT … FOR UPDATE`` serialization can be exercised.
"""

from __future__ import annotations

import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from uuid import uuid4

import pytest
from sqlalchemy.orm import sessionmaker

from app.models.interview_message import InterviewMessage
from app.models.interview_session import InterviewSession
from app.models.user import User
from app.schemas.interview import InterviewMessageCreate
from app.services.interview_messages import create_owned_interview_message
from app.services.interview_sessions import SESSION_STATUS_IN_PROGRESS


def _seed_owner_and_session(db_session) -> tuple[User, InterviewSession]:
    user = User(
        id=uuid4(),
        full_name="Concurrency Tester",
        email=f"concurrent-{uuid4().hex}@example.com",
        password_hash="not-used-in-this-test",
    )
    db_session.add(user)
    db_session.flush()
    session = InterviewSession(
        id=uuid4(),
        user_id=user.id,
        category="software_engineering",
        role="Software Engineer",
        experience_level="mid",
        focus_areas=["Programming & Problem Solving"],
        difficulty="medium",
        duration_minutes=30,
        status=SESSION_STATUS_IN_PROGRESS,
        completed_at=None,
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(session)
    return user, session


def test_concurrent_writes_get_unique_ordered_sequences(db_session) -> None:
    """Two connections racing inserts must not share a sequence number."""
    user, interview = _seed_owner_and_session(db_session)
    bind = db_session.get_bind()
    SessionLocal = sessionmaker(bind=bind, autoflush=False, autocommit=False)

    barrier = threading.Barrier(8)
    worker_count = 8

    def worker(index: int) -> int:
        barrier.wait(timeout=5)
        local = SessionLocal()
        try:
            # Re-load user in this session/identity map.
            owner = local.get(User, user.id)
            assert owner is not None
            message = create_owned_interview_message(
                local,
                user=owner,
                session_id=interview.id,
                payload=InterviewMessageCreate(
                    speaker="candidate",
                    content=f"Concurrent answer {index}",
                    client_message_id=uuid4(),
                ),
            )
            return message.sequence
        finally:
            local.close()

    sequences: list[int] = []
    with ThreadPoolExecutor(max_workers=worker_count) as pool:
        futures = [pool.submit(worker, index) for index in range(worker_count)]
        for future in as_completed(futures):
            sequences.append(future.result())

    assert sorted(sequences) == list(range(1, worker_count + 1))
    assert len(set(sequences)) == worker_count

    stored = (
        db_session.query(InterviewMessage)
        .filter(InterviewMessage.session_id == interview.id)
        .order_by(InterviewMessage.sequence.asc())
        .all()
    )
    assert [row.sequence for row in stored] == list(range(1, worker_count + 1))


def test_concurrent_idempotent_retries_share_one_row(db_session) -> None:
    """Same client_message_id under concurrency must collapse to one message."""
    user, interview = _seed_owner_and_session(db_session)
    bind = db_session.get_bind()
    SessionLocal = sessionmaker(bind=bind, autoflush=False, autocommit=False)
    client_message_id = uuid4()
    barrier = threading.Barrier(6)

    def worker() -> str:
        barrier.wait(timeout=5)
        local = SessionLocal()
        try:
            owner = local.get(User, user.id)
            assert owner is not None
            message = create_owned_interview_message(
                local,
                user=owner,
                session_id=interview.id,
                payload=InterviewMessageCreate(
                    speaker="interviewer",
                    content="Stable greeting",
                    client_message_id=client_message_id,
                ),
            )
            return str(message.id)
        finally:
            local.close()

    ids: list[str] = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = [pool.submit(worker) for _ in range(6)]
        for future in as_completed(futures):
            ids.append(future.result())

    assert len(set(ids)) == 1
    count = (
        db_session.query(InterviewMessage)
        .filter(
            InterviewMessage.session_id == interview.id,
            InterviewMessage.client_message_id == client_message_id,
        )
        .count()
    )
    assert count == 1


@pytest.mark.parametrize("speaker", ["interviewer", "candidate"])
def test_locked_create_still_rejects_completed_session(db_session, speaker: str) -> None:
    user, interview = _seed_owner_and_session(db_session)
    interview.status = "completed"
    db_session.add(interview)
    db_session.commit()

    from app.services.interview_messages import InterviewMessageError

    with pytest.raises(InterviewMessageError) as exc:
        create_owned_interview_message(
            db_session,
            user=user,
            session_id=interview.id,
            payload=InterviewMessageCreate(
                speaker=speaker,
                content="Should not persist",
                client_message_id=uuid4(),
            ),
        )
    assert exc.value.code == "completed"
