"""Interview session HTTP endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.interview import InterviewSessionCreate, InterviewSessionResponse
from app.services.interview_sessions import (
    create_interview_session,
    get_owned_interview_session,
)

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.post(
    "",
    response_model=InterviewSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    payload: InterviewSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewSessionResponse:
    session = create_interview_session(db, user=current_user, payload=payload)
    return InterviewSessionResponse.model_validate(session)


@router.get("/{session_id}", response_model=InterviewSessionResponse)
def get_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewSessionResponse:
    session = get_owned_interview_session(
        db,
        user=current_user,
        session_id=session_id,
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found.",
        )
    return InterviewSessionResponse.model_validate(session)
