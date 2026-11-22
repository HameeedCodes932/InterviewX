"""Interview session HTTP endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.interview import (
    InterviewSessionCreate,
    InterviewSessionListResponse,
    InterviewSessionResponse,
)
from app.services.interview_sessions import (
    DEFAULT_LIST_LIMIT,
    MAX_LIST_LIMIT,
    complete_owned_interview_session,
    create_interview_session,
    get_owned_interview_session,
    list_owned_interview_sessions,
)

router = APIRouter(prefix="/interviews", tags=["interviews"])


# Register GET before POST on the collection path so list is always present in
# the route table / OpenAPI alongside create (avoids POST-only 405 regressions).
@router.get(
    "",
    response_model=InterviewSessionListResponse,
    summary="List interview sessions",
)
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT),
    offset: int = Query(default=0, ge=0),
) -> InterviewSessionListResponse:
    items, total = list_owned_interview_sessions(
        db,
        user=current_user,
        limit=limit,
        offset=offset,
    )
    return InterviewSessionListResponse(
        items=[InterviewSessionResponse.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "",
    response_model=InterviewSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create interview session",
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


@router.post(
    "/{session_id}/complete",
    response_model=InterviewSessionResponse,
)
def complete_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewSessionResponse:
    session = complete_owned_interview_session(
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
