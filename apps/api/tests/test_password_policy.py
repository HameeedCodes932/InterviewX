"""Password byte-limit and bcrypt policy tests."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.password_policy import (
    BCRYPT_MAX_PASSWORD_BYTES,
    password_utf8_byte_length,
    validate_password_byte_length,
)
from app.schemas.auth import LoginRequest, RegisterRequest


def test_boundary_password_accepted_at_72_utf8_bytes() -> None:
    # 70 'a's + "A1" = 72 ASCII bytes, meets strength rules.
    password = ("a" * 70) + "A1"
    assert password_utf8_byte_length(password) == BCRYPT_MAX_PASSWORD_BYTES
    assert validate_password_byte_length(password) == password
    payload = RegisterRequest(
        full_name="Boundary User",
        email="boundary@example.com",
        password=password,
    )
    assert payload.password == password


def test_oversized_password_rejected_on_register() -> None:
    password = ("a" * 71) + "A1"  # 73 bytes
    assert password_utf8_byte_length(password) == 73
    with pytest.raises(ValidationError) as exc:
        RegisterRequest(
            full_name="Oversize User",
            email="oversize@example.com",
            password=password,
        )
    assert "72 UTF-8 bytes" in str(exc.value)


def test_oversized_multibyte_password_rejected() -> None:
    # 'é' is 2 UTF-8 bytes; 40 of them = 80 bytes.
    password = "É" + ("é" * 39) + "1aA"
    assert password_utf8_byte_length(password) > BCRYPT_MAX_PASSWORD_BYTES
    with pytest.raises(ValidationError) as exc:
        RegisterRequest(
            full_name="Unicode User",
            email="unicode@example.com",
            password=password,
        )
    assert "72 UTF-8 bytes" in str(exc.value)


def test_login_rejects_oversized_password() -> None:
    password = "x" * 73
    with pytest.raises(ValidationError) as exc:
        LoginRequest(email="login@example.com", password=password)
    assert "72 UTF-8 bytes" in str(exc.value)


def test_register_endpoint_rejects_oversized_password(client) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "API Oversize",
            "email": "api-oversize@example.com",
            "password": ("a" * 71) + "A1",
        },
    )
    assert response.status_code == 422


def test_register_endpoint_accepts_72_byte_password(client) -> None:
    password = ("b" * 70) + "A1"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "API Boundary",
            "email": "api-boundary@example.com",
            "password": password,
        },
    )
    assert response.status_code == 201
