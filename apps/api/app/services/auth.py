"""Authentication service: register, login, token issuance."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import AuthTokenResponse, LoginRequest, RegisterRequest, UserPublic


class AuthServiceError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def _to_token_response(user: User) -> AuthTokenResponse:
    token = create_access_token(subject=user.id, email=user.email)
    return AuthTokenResponse(
        access_token=token,
        user=UserPublic.model_validate(user),
    )


def register_user(db: Session, payload: RegisterRequest) -> AuthTokenResponse:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise AuthServiceError(
            "duplicate_email",
            "An account with this email already exists.",
        )

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise AuthServiceError(
            "duplicate_email",
            "An account with this email already exists.",
        ) from exc
    db.refresh(user)
    return _to_token_response(user)


def authenticate_user(db: Session, payload: LoginRequest) -> AuthTokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise AuthServiceError(
            "invalid_credentials",
            "Incorrect email or password.",
        )
    return _to_token_response(user)
