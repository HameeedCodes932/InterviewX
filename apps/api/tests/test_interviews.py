"""Interview session API ownership and validation tests."""

from __future__ import annotations

from uuid import uuid4

VALID_PAYLOAD = {
    "category": "software_engineering",
    "role": "Software Engineer",
    "experience_level": "mid",
    "focus_areas": ["Programming & Problem Solving", "System Design"],
    "difficulty": "medium",
    "duration_minutes": 30,
}


def _register(client, *, email: str, password: str = "StrongPass1"):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Interview Tester",
            "email": email,
            "password": password,
        },
    )
    assert response.status_code == 201
    return response.json()


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_unauthenticated_cannot_create_session(client) -> None:
    response = client.post("/api/v1/interviews", json=VALID_PAYLOAD)
    assert response.status_code == 401


def test_authenticated_can_create_valid_session(client, db_session) -> None:
    auth = _register(client, email="owner@example.com")
    response = client.post(
        "/api/v1/interviews",
        json=VALID_PAYLOAD,
        headers=_auth_headers(auth["access_token"]),
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["user_id"] == auth["user"]["id"]
    assert payload["category"] == "software_engineering"
    assert payload["role"] == "Software Engineer"
    assert payload["experience_level"] == "mid"
    assert payload["focus_areas"] == VALID_PAYLOAD["focus_areas"]
    assert payload["difficulty"] == "medium"
    assert payload["duration_minutes"] == 30
    assert payload["status"] == "created"
    assert "id" in payload

    from app.models.interview_session import InterviewSession
    from uuid import UUID

    stored = db_session.get(InterviewSession, UUID(payload["id"]))
    assert stored is not None
    assert str(stored.user_id) == auth["user"]["id"]
    assert stored.role == "Software Engineer"


def test_unauthenticated_cannot_retrieve_session(client) -> None:
    auth = _register(client, email="owner2@example.com")
    created = client.post(
        "/api/v1/interviews",
        json=VALID_PAYLOAD,
        headers=_auth_headers(auth["access_token"]),
    ).json()
    response = client.get(f"/api/v1/interviews/{created['id']}")
    assert response.status_code == 401


def test_owner_can_retrieve_own_session(client) -> None:
    auth = _register(client, email="owner3@example.com")
    created = client.post(
        "/api/v1/interviews",
        json=VALID_PAYLOAD,
        headers=_auth_headers(auth["access_token"]),
    ).json()
    response = client.get(
        f"/api/v1/interviews/{created['id']}",
        headers=_auth_headers(auth["access_token"]),
    )
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_other_user_cannot_retrieve_foreign_session(client) -> None:
    owner = _register(client, email="session-owner@example.com")
    other = _register(client, email="session-other@example.com")
    created = client.post(
        "/api/v1/interviews",
        json=VALID_PAYLOAD,
        headers=_auth_headers(owner["access_token"]),
    ).json()
    response = client.get(
        f"/api/v1/interviews/{created['id']}",
        headers=_auth_headers(other["access_token"]),
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Interview session not found."


def test_nonexistent_session_returns_404(client) -> None:
    auth = _register(client, email="missing@example.com")
    response = client.get(
        f"/api/v1/interviews/{uuid4()}",
        headers=_auth_headers(auth["access_token"]),
    )
    assert response.status_code == 404


def test_invalid_role_rejected(client) -> None:
    auth = _register(client, email="bad-role@example.com")
    payload = {**VALID_PAYLOAD, "role": "Product Manager"}
    response = client.post(
        "/api/v1/interviews",
        json=payload,
        headers=_auth_headers(auth["access_token"]),
    )
    assert response.status_code == 422


def test_invalid_difficulty_rejected(client) -> None:
    auth = _register(client, email="bad-diff@example.com")
    payload = {**VALID_PAYLOAD, "difficulty": "extreme"}
    response = client.post(
        "/api/v1/interviews",
        json=payload,
        headers=_auth_headers(auth["access_token"]),
    )
    assert response.status_code == 422


def test_empty_focus_list_rejected(client) -> None:
    auth = _register(client, email="empty-focus@example.com")
    payload = {**VALID_PAYLOAD, "focus_areas": []}
    response = client.post(
        "/api/v1/interviews",
        json=payload,
        headers=_auth_headers(auth["access_token"]),
    )
    assert response.status_code == 422


def test_duplicate_focus_areas_rejected(client) -> None:
    auth = _register(client, email="dup-focus@example.com")
    payload = {
        **VALID_PAYLOAD,
        "focus_areas": [
            "System Design",
            "System Design",
        ],
    }
    response = client.post(
        "/api/v1/interviews",
        json=payload,
        headers=_auth_headers(auth["access_token"]),
    )
    assert response.status_code == 422


def test_invalid_duration_rejected(client) -> None:
    auth = _register(client, email="bad-duration@example.com")
    payload = {**VALID_PAYLOAD, "duration_minutes": 20}
    response = client.post(
        "/api/v1/interviews",
        json=payload,
        headers=_auth_headers(auth["access_token"]),
    )
    assert response.status_code == 422
