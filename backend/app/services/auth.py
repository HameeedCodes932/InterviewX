from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import PasswordResetToken, Profile, User
from app.schemas.auth import (
    ForgotPasswordResponse,
    LoginRequest,
    SignupRequest,
    TokenResponse,
)
from app.services.email import send_password_reset_email


def _token_response(user: User) -> TokenResponse:
    token = create_access_token(str(user.id), extra={"email": user.email})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
    )


def signup(db: Session, payload: SignupRequest) -> TokenResponse:
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
    )
    user.profile = Profile(preferred_language="en")
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user)


def login(db: Session, payload: LoginRequest) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return _token_response(user)


def request_password_reset(db: Session, email: str) -> ForgotPasswordResponse:
    settings = get_settings()
    user = db.scalar(select(User).where(User.email == email.lower()))
    generic = ForgotPasswordResponse(
        message="If an account exists for that email, a reset link has been prepared."
    )
    if user is None:
        return generic

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    reset = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db.add(reset)
    db.commit()

    reset_url = f"{settings.password_reset_base_url}?token={raw_token}"
    sent = send_password_reset_email(user.email, reset_url)

    if not sent:
        # TODO: remove reset_token from API once SMTP is configured.
        return ForgotPasswordResponse(
            message=(
                "If an account exists for that email, a reset link has been prepared. "
                "SMTP is not configured — use the returned reset_token for local testing."
            ),
            reset_token=raw_token,
            reset_url=reset_url,
        )
    return generic


def reset_password(db: Session, token: str, new_password: str) -> None:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    reset = db.scalar(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    )
    if reset is None or reset.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    expires = reset.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    user = db.get(User, reset.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    user.hashed_password = hash_password(new_password)
    reset.used_at = datetime.now(timezone.utc)
    db.commit()
