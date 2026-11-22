"""Interview message persistence ownership and validation tests."""

from __future__ import annotations

from uuid import uuid4

from tests.test_interviews import VALID_PAYLOAD, _auth_headers, _create_session, _register


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


def test_unauthenticated_cannot_list_messages(client) -> None:
    auth = _register(client, email="msg-list-unauth@example.com")
    created = _create_session(client, auth["access_token"])
    response = client.get(f"/api/v1/interviews/{created['id']}/messages")
    assert response.status_code == 401


def test_unauthenticated_cannot_create_message(client) -> None:
    auth = _register(client, email="msg-create-unauth@example.com")
    created = _create_session(client, auth["access_token"])
    response = client.post(
        f"/api/v1/interviews/{created['id']}/messages",
        json=_message_payload(),
    )
    assert response.status_code == 401


def test_list_returns_empty_for_new_session(client) -> None:
    auth = _register(client, email="msg-empty@example.com")
    created = _create_session(client, auth["access_token"])
    response = client.get(
        f"/api/v1/interviews/{created['id']}/messages",
        headers=_auth_headers(auth["access_token"]),
    )
    assert response.status_code == 200
    assert response.json() == {"items": []}


def test_other_user_cannot_list_or_create_messages(client) -> None:
    owner = _register(client, email="msg-owner@example.com")
    other = _register(client, email="msg-other@example.com")
    created = _create_session(client, owner["access_token"])

    listed = client.get(
        f"/api/v1/interviews/{created['id']}/messages",
        headers=_auth_headers(other["access_token"]),
    )
    assert listed.status_code == 404

    created_msg = client.post(
        f"/api/v1/interviews/{created['id']}/messages",
        json=_message_payload(),
        headers=_auth_headers(other["access_token"]),
    )
    assert created_msg.status_code == 404


def test_missing_session_returns_404_for_messages(client) -> None:
    auth = _register(client, email="msg-missing@example.com")
    missing = uuid4()
    listed = client.get(
        f"/api/v1/interviews/{missing}/messages",
        headers=_auth_headers(auth["access_token"]),
    )
    assert listed.status_code == 404
    created_msg = client.post(
        f"/api/v1/interviews/{missing}/messages",
        json=_message_payload(),
        headers=_auth_headers(auth["access_token"]),
    )
    assert created_msg.status_code == 404


def test_can_save_interviewer_and_candidate_messages(client) -> None:
    auth = _register(client, email="msg-save@example.com")
    created = _create_session(client, auth["access_token"])
    headers = _auth_headers(auth["access_token"])

    interviewer = client.post(
        f"/api/v1/interviews/{created['id']}/messages",
        json=_message_payload(
            speaker="interviewer",
            content="Tell me about a recent project.",
        ),
        headers=headers,
    )
    assert interviewer.status_code == 201
    interviewer_body = interviewer.json()
    assert interviewer_body["speaker"] == "interviewer"
    assert interviewer_body["session_id"] == created["id"]
    assert interviewer_body["sequence"] == 1
    assert interviewer_body["id"]
    assert interviewer_body["created_at"]

    candidate = client.post(
        f"/api/v1/interviews/{created['id']}/messages",
        json=_message_payload(
            speaker="candidate",
            content="I built a FastAPI service for interview practice.",
        ),
        headers=headers,
    )
    assert candidate.status_code == 201
    candidate_body = candidate.json()
    assert candidate_body["speaker"] == "candidate"
    assert candidate_body["sequence"] == 2


def test_messages_return_in_chronological_order(client) -> None:
    auth = _register(client, email="msg-order@example.com")
    created = _create_session(client, auth["access_token"])
    headers = _auth_headers(auth["access_token"])

    first = client.post(
        f"/api/v1/interviews/{created['id']}/messages",
        json=_message_payload(speaker="interviewer", content="Question one"),
        headers=headers,
    ).json()
    second = client.post(
        f"/api/v1/interviews/{created['id']}/messages",
        json=_message_payload(speaker="candidate", content="Answer one"),
        headers=headers,
    ).json()
    third = client.post(
        f"/api/v1/interviews/{created['id']}/messages",
        json=_message_payload(speaker="interviewer", content="Question two"),
        headers=headers,
    ).json()

    listed = client.get(
        f"/api/v1/interviews/{created['id']}/messages",
        headers=headers,
    )
    assert listed.status_code == 200
    items = listed.json()["items"]
    assert [item["id"] for item in items] == [first["id"], second["id"], third["id"]]
    assert [item["sequence"] for item in items] == [1, 2, 3]


def test_client_message_id_is_idempotent(client) -> None:
    auth = _register(client, email="msg-idempotent@example.com")
    created = _create_session(client, auth["access_token"])
    headers = _auth_headers(auth["access_token"])
    client_message_id = str(uuid4())
    payload = _message_payload(
        content="Stable candidate answer",
        client_message_id=client_message_id,
    )

    first = client.post(
        f"/api/v1/interviews/{created['id']}/messages",
        json=payload,
        headers=headers,
    )
    second = client.post(
        f"/api/v1/interviews/{created['id']}/messages",
        json=payload,
        headers=headers,
    )
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] == second.json()["id"]
    assert first.json()["sequence"] == second.json()["sequence"]

    listed = client.get(
        f"/api/v1/interviews/{created['id']}/messages",
        headers=headers,
    )
    assert len(listed.json()["items"]) == 1


def test_rejects_invalid_message_payloads(client) -> None:
    auth = _register(client, email="msg-invalid@example.com")
    created = _create_session(client, auth["access_token"])
    headers = _auth_headers(auth["access_token"])

    empty = client.post(
        f"/api/v1/interviews/{created['id']}/messages",
        json=_message_payload(content="   "),
        headers=headers,
    )
    assert empty.status_code == 422

    bad_speaker = client.post(
        f"/api/v1/interviews/{created['id']}/messages",
        json=_message_payload(speaker="moderator"),
        headers=headers,
    )
    assert bad_speaker.status_code == 422

    too_long = client.post(
        f"/api/v1/interviews/{created['id']}/messages",
        json=_message_payload(content="x" * 8001),
        headers=headers,
    )
    assert too_long.status_code == 422


def test_cannot_write_messages_to_completed_session(client) -> None:
    auth = _register(client, email="msg-completed@example.com")
    created = _create_session(client, auth["access_token"])
    headers = _auth_headers(auth["access_token"])
    complete = client.post(
        f"/api/v1/interviews/{created['id']}/complete",
        headers=headers,
    )
    assert complete.status_code == 200

    response = client.post(
        f"/api/v1/interviews/{created['id']}/messages",
        json=_message_payload(),
        headers=headers,
    )
    assert response.status_code == 409

    listed = client.get(
        f"/api/v1/interviews/{created['id']}/messages",
        headers=headers,
    )
    assert listed.status_code == 200
    assert listed.json()["items"] == []


def test_existing_session_endpoints_still_work(client) -> None:
    auth = _register(client, email="msg-regression@example.com")
    headers = _auth_headers(auth["access_token"])
    created = client.post(
        "/api/v1/interviews",
        json=VALID_PAYLOAD,
        headers=headers,
    )
    assert created.status_code == 201
    session_id = created.json()["id"]

    fetched = client.get(f"/api/v1/interviews/{session_id}", headers=headers)
    assert fetched.status_code == 200

    listed = client.get("/api/v1/interviews", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["total"] == 1

    completed = client.post(
        f"/api/v1/interviews/{session_id}/complete",
        headers=headers,
    )
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"
