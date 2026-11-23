"""AI interviewer respond endpoint tests (LLM mocked)."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from uuid import UUID, uuid4
from unittest.mock import patch

from app.services.llm.interview_prompt import interviewer_response_client_message_id
from app.services.llm.provider import LlmCompletionResult, LlmProviderError
from tests.test_interviews import _auth_headers, _create_session, _register


def _message_payload(
    *,
    speaker: str = "candidate",
    content: str = "I have five years of backend experience.",
    client_message_id: str | None = None,
) -> dict:
    return {
        "speaker": speaker,
        "content": content,
        "client_message_id": client_message_id or str(uuid4()),
    }


def _save_candidate(client, token: str, session_id: str, *, content: str = "My answer") -> dict:
    payload = _message_payload(content=content)
    response = client.post(
        f"/api/v1/interviews/{session_id}/messages",
        json=payload,
        headers=_auth_headers(token),
    )
    assert response.status_code == 201
    return response.json()


def test_respond_requires_auth(client) -> None:
    auth = _register(client, email="ai-unauth@example.com")
    created = _create_session(client, auth["access_token"])
    candidate = _save_candidate(client, auth["access_token"], created["id"])
    response = client.post(
        f"/api/v1/interviews/{created['id']}/respond",
        json={"candidate_client_message_id": candidate["client_message_id"]},
    )
    assert response.status_code == 401


def test_foreign_user_cannot_respond(client) -> None:
    owner = _register(client, email="ai-owner@example.com")
    other = _register(client, email="ai-other@example.com")
    created = _create_session(client, owner["access_token"])
    candidate = _save_candidate(client, owner["access_token"], created["id"])

    response = client.post(
        f"/api/v1/interviews/{created['id']}/respond",
        json={"candidate_client_message_id": candidate["client_message_id"]},
        headers=_auth_headers(other["access_token"]),
    )
    assert response.status_code == 404


def test_missing_candidate_message_returns_404(client) -> None:
    auth = _register(client, email="ai-missing-cand@example.com")
    created = _create_session(client, auth["access_token"])
    response = client.post(
        f"/api/v1/interviews/{created['id']}/respond",
        json={"candidate_client_message_id": str(uuid4())},
        headers=_auth_headers(auth["access_token"]),
    )
    assert response.status_code == 404


def test_rejects_interviewer_message_as_candidate_turn(client) -> None:
    auth = _register(client, email="ai-bad-speaker@example.com")
    created = _create_session(client, auth["access_token"])
    interviewer = client.post(
        f"/api/v1/interviews/{created['id']}/messages",
        json=_message_payload(speaker="interviewer", content="Hello"),
        headers=_auth_headers(auth["access_token"]),
    ).json()

    response = client.post(
        f"/api/v1/interviews/{created['id']}/respond",
        json={"candidate_client_message_id": interviewer["client_message_id"]},
        headers=_auth_headers(auth["access_token"]),
    )
    assert response.status_code == 400


def test_rejects_completed_session(client) -> None:
    auth = _register(client, email="ai-completed@example.com")
    created = _create_session(client, auth["access_token"])
    candidate = _save_candidate(client, auth["access_token"], created["id"])
    complete = client.post(
        f"/api/v1/interviews/{created['id']}/complete",
        headers=_auth_headers(auth["access_token"]),
    )
    assert complete.status_code == 200

    with patch(
        "app.services.interview_ai.complete_chat",
        return_value=LlmCompletionResult(content="Should not run", model="test"),
    ) as mocked:
        response = client.post(
            f"/api/v1/interviews/{created['id']}/respond",
            json={"candidate_client_message_id": candidate["client_message_id"]},
            headers=_auth_headers(auth["access_token"]),
        )
    assert response.status_code == 409
    mocked.assert_not_called()


def test_not_configured_returns_503(client) -> None:
    auth = _register(client, email="ai-noconfig@example.com")
    created = _create_session(client, auth["access_token"])
    candidate = _save_candidate(client, auth["access_token"], created["id"])

    with patch(
        "app.services.interview_ai.complete_chat",
        side_effect=LlmProviderError(
            "not_configured",
            "AI interviewer is not configured. Set LLM_API_KEY on the API server.",
        ),
    ):
        response = client.post(
            f"/api/v1/interviews/{created['id']}/respond",
            json={"candidate_client_message_id": candidate["client_message_id"]},
            headers=_auth_headers(auth["access_token"]),
        )
    assert response.status_code == 503
    assert "not configured" in response.json()["detail"].lower()

    listed = client.get(
        f"/api/v1/interviews/{created['id']}/messages",
        headers=_auth_headers(auth["access_token"]),
    )
    assert listed.status_code == 200
    assert len(listed.json()["items"]) == 1
    assert listed.json()["items"][0]["speaker"] == "candidate"


def test_timeout_and_rate_limit_mapping(client) -> None:
    auth = _register(client, email="ai-errors@example.com")
    created = _create_session(client, auth["access_token"])
    candidate = _save_candidate(client, auth["access_token"], created["id"])
    headers = _auth_headers(auth["access_token"])

    with patch(
        "app.services.interview_ai.complete_chat",
        side_effect=LlmProviderError("timeout", "timed out"),
    ):
        timeout = client.post(
            f"/api/v1/interviews/{created['id']}/respond",
            json={"candidate_client_message_id": candidate["client_message_id"]},
            headers=headers,
        )
    assert timeout.status_code == 502

    with patch(
        "app.services.interview_ai.complete_chat",
        side_effect=LlmProviderError("rate_limited", "slow down"),
    ):
        limited = client.post(
            f"/api/v1/interviews/{created['id']}/respond",
            json={"candidate_client_message_id": candidate["client_message_id"]},
            headers=headers,
        )
    assert limited.status_code == 429


def test_successful_response_is_persisted(client) -> None:
    auth = _register(client, email="ai-success@example.com")
    created = _create_session(client, auth["access_token"])
    candidate = _save_candidate(client, auth["access_token"], created["id"])
    expected_client_id = str(
        interviewer_response_client_message_id(
            session_id=UUID(created["id"]),
            candidate_client_message_id=UUID(candidate["client_message_id"]),
        )
    )

    with patch(
        "app.services.interview_ai.complete_chat",
        return_value=LlmCompletionResult(
            content="Thanks. How would you design a rate limiter?",
            model="test-model",
        ),
    ) as mocked:
        response = client.post(
            f"/api/v1/interviews/{created['id']}/respond",
            json={"candidate_client_message_id": candidate["client_message_id"]},
            headers=_auth_headers(auth["access_token"]),
        )

    assert response.status_code == 201
    body = response.json()
    assert body["speaker"] == "interviewer"
    assert "rate limiter" in body["content"].lower()
    assert body["client_message_id"] == expected_client_id
    assert body["sequence"] == 2
    mocked.assert_called_once()

    listed = client.get(
        f"/api/v1/interviews/{created['id']}/messages",
        headers=_auth_headers(auth["access_token"]),
    )
    items = listed.json()["items"]
    assert [item["speaker"] for item in items] == ["candidate", "interviewer"]


def test_repeated_respond_returns_same_message_without_second_llm_call(client) -> None:
    auth = _register(client, email="ai-idempotent@example.com")
    created = _create_session(client, auth["access_token"])
    candidate = _save_candidate(client, auth["access_token"], created["id"])
    headers = _auth_headers(auth["access_token"])
    payload = {"candidate_client_message_id": candidate["client_message_id"]}

    with patch(
        "app.services.interview_ai.complete_chat",
        return_value=LlmCompletionResult(
            content="Follow-up about caching.",
            model="test-model",
        ),
    ) as mocked:
        first = client.post(
            f"/api/v1/interviews/{created['id']}/respond",
            json=payload,
            headers=headers,
        )
        second = client.post(
            f"/api/v1/interviews/{created['id']}/respond",
            json=payload,
            headers=headers,
        )

    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] == second.json()["id"]
    assert mocked.call_count == 1

    listed = client.get(
        f"/api/v1/interviews/{created['id']}/messages",
        headers=headers,
    )
    interviewers = [
        item for item in listed.json()["items"] if item["speaker"] == "interviewer"
    ]
    assert len(interviewers) == 1


def test_provider_failure_does_not_create_interviewer_message(client) -> None:
    auth = _register(client, email="ai-fail-persist@example.com")
    created = _create_session(client, auth["access_token"])
    candidate = _save_candidate(client, auth["access_token"], created["id"])

    with patch(
        "app.services.interview_ai.complete_chat",
        side_effect=LlmProviderError("unavailable", "down"),
    ):
        response = client.post(
            f"/api/v1/interviews/{created['id']}/respond",
            json={"candidate_client_message_id": candidate["client_message_id"]},
            headers=_auth_headers(auth["access_token"]),
        )
    assert response.status_code == 502

    listed = client.get(
        f"/api/v1/interviews/{created['id']}/messages",
        headers=_auth_headers(auth["access_token"]),
    )
    assert len(listed.json()["items"]) == 1


def test_concurrent_respond_requests_do_not_duplicate(db_session) -> None:
    """Overlapping respond calls must not create duplicate interviewer rows."""
    import threading
    from concurrent.futures import as_completed

    from sqlalchemy.orm import sessionmaker

    from app.models.interview_message import InterviewMessage
    from app.models.interview_session import InterviewSession
    from app.models.user import User
    from app.schemas.interview import InterviewMessageCreate
    from app.services.interview_ai import generate_owned_interview_response
    from app.services.interview_messages import create_owned_interview_message
    from app.services.interview_sessions import SESSION_STATUS_IN_PROGRESS

    user = User(
        id=uuid4(),
        full_name="AI Concurrent Tester",
        email=f"ai-concurrent-{uuid4().hex}@example.com",
        password_hash="not-used",
    )
    db_session.add(user)
    db_session.flush()
    interview = InterviewSession(
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
    db_session.add(interview)
    db_session.commit()

    candidate_client_id = uuid4()
    create_owned_interview_message(
        db_session,
        user=user,
        session_id=interview.id,
        payload=InterviewMessageCreate(
            speaker="candidate",
            content="Concurrent candidate answer",
            client_message_id=candidate_client_id,
        ),
    )

    bind = db_session.get_bind()
    SessionLocal = sessionmaker(bind=bind, autoflush=False, autocommit=False)
    call_count = {"n": 0}
    barrier = threading.Barrier(2, timeout=5)

    def slow_complete(**_kwargs):
        call_count["n"] += 1
        barrier.wait()
        return LlmCompletionResult(
            content="Concurrent-safe follow-up question?",
            model="test-model",
        )

    def worker(_: int) -> UUID:
        local = SessionLocal()
        try:
            owner = local.get(User, user.id)
            assert owner is not None
            with patch(
                "app.services.interview_ai.complete_chat",
                side_effect=slow_complete,
            ):
                message = generate_owned_interview_response(
                    local,
                    user=owner,
                    session_id=interview.id,
                    candidate_client_message_id=candidate_client_id,
                )
            return message.id
        finally:
            local.close()

    ids: list[UUID] = []
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(worker, index) for index in range(2)]
        for future in as_completed(futures):
            ids.append(future.result())

    assert len(set(ids)) == 1
    assert call_count["n"] == 2

    stored = (
        db_session.query(InterviewMessage)
        .filter(
            InterviewMessage.session_id == interview.id,
            InterviewMessage.speaker == "interviewer",
        )
        .all()
    )
    assert len(stored) == 1
