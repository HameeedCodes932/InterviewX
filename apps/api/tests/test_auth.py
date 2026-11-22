"""Authentication API and security tests."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt

from app.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password


def test_password_hashing_and_verification() -> None:
    password = "StrongPass1"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPass1", hashed) is False


def test_register_success(client) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Fazal Hameed",
            "email": "fazal@example.com",
            "password": "StrongPass1",
        },
    )
    assert response.status_code == 201
    payload = response.json()
    assert "access_token" in payload
    assert payload["token_type"] == "bearer"
    assert payload["user"]["email"] == "fazal@example.com"
    assert payload["user"]["full_name"] == "Fazal Hameed"
    assert "password" not in payload["user"]
    assert "password_hash" not in payload["user"]


def test_register_duplicate_email(client) -> None:
    body = {
        "full_name": "Fazal Hameed",
        "email": "dup@example.com",
        "password": "StrongPass1",
    }
    first = client.post("/api/v1/auth/register", json=body)
    assert first.status_code == 201
    second = client.post("/api/v1/auth/register", json=body)
    assert second.status_code == 409
    assert "already exists" in second.json()["detail"].lower()


def test_login_success(client) -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Login User",
            "email": "login@example.com",
            "password": "StrongPass1",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "StrongPass1"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["access_token"]
    assert payload["user"]["email"] == "login@example.com"


def test_login_invalid_credentials(client) -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Login User",
            "email": "badlogin@example.com",
            "password": "StrongPass1",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "badlogin@example.com", "password": "WrongPass1"},
    )
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


def test_me_requires_authentication(client) -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_with_valid_token(client) -> None:
    register = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Token User",
            "email": "token@example.com",
            "password": "StrongPass1",
        },
    )
    token = register.json()["access_token"]
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["email"] == "token@example.com"
    assert "password_hash" not in payload


def test_me_rejects_invalid_jwt(client) -> None:
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert response.status_code == 401


def test_jwt_payload_contains_subject(client) -> None:
    register = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Jwt User",
            "email": "jwt@example.com",
            "password": "StrongPass1",
        },
    )
    user_id = register.json()["user"]["id"]
    token = create_access_token(
        subject=__import__("uuid").UUID(user_id),
        email="jwt@example.com",
    )
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["id"] == user_id


def test_expired_jwt_rejected(client) -> None:
    settings = get_settings()
    now = datetime.now(UTC)
    token = jwt.encode(
        {
            "sub": str(uuid4()),
            "email": "expired@example.com",
            "iat": now - timedelta(hours=2),
            "exp": now - timedelta(hours=1),
            "type": "access",
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401
