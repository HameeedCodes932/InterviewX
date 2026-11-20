from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import Profile, User
from app.schemas.profile import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


def _to_out(user: User) -> ProfileOut:
    profile = user.profile
    return ProfileOut(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        headline=profile.headline if profile else None,
        bio=profile.bio if profile else None,
        interview_goal=profile.interview_goal if profile else None,
        preferred_language=profile.preferred_language if profile else "en",
        preferred_interviewer=profile.preferred_interviewer if profile else None,
        location=profile.location if profile else None,
        target_role=profile.target_role if profile else None,
    )


@router.get("/me", response_model=ProfileOut)
def get_me(user: User = Depends(get_current_user)) -> ProfileOut:
    return _to_out(user)


@router.patch("/me", response_model=ProfileOut)
def update_me(
    payload: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileOut:
    if user.profile is None:
        user.profile = Profile(preferred_language="en")
        db.add(user.profile)

    data = payload.model_dump(exclude_unset=True)
    if "full_name" in data and data["full_name"] is not None:
        user.full_name = data.pop("full_name")

    for key, value in data.items():
        setattr(user.profile, key, value)

    db.commit()
    db.refresh(user)
    return _to_out(user)
