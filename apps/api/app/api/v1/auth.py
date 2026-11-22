"""Authentication HTTP endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.auth import (
    AuthTokenResponse,
    LoginRequest,
    RegisterRequest,
    UserPublic,
)
from app.services.auth import AuthServiceError, authenticate_user, register_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> AuthTokenResponse:
    try:
        return register_user(db, payload)
    except AuthServiceError as exc:
        if exc.code == "duplicate_email":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=exc.message,
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exc.message,
        ) from exc


@router.post("/login", response_model=AuthTokenResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> AuthTokenResponse:
    try:
        return authenticate_user(db, payload)
    except AuthServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.message,
        ) from exc


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
