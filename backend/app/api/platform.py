from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.interview import Category, EvaluationReport, InterviewSession
from app.models.user import User
from app.schemas.platform import (
    CategoryOut,
    DashboardOut,
    EvaluationReportOut,
    InterviewSessionOut,
)

router = APIRouter(tags=["platform"])


def _session_out(session: InterviewSession, has_report: bool) -> InterviewSessionOut:
    return InterviewSessionOut(
        id=session.id,
        category_slug=session.category_slug,
        status=session.status,
        interviewer_gender=session.interviewer_gender,
        started_at=session.started_at,
        ended_at=session.ended_at,
        created_at=session.created_at,
        has_report=has_report,
    )


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> list[CategoryOut]:
    rows = db.scalars(select(Category).order_by(Category.sort_order)).all()
    return [CategoryOut.model_validate(r) for r in rows]


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DashboardOut:
    categories = db.scalars(select(Category).order_by(Category.sort_order)).all()
    sessions = db.scalars(
        select(InterviewSession)
        .where(InterviewSession.user_id == user.id)
        .order_by(InterviewSession.created_at.desc())
        .limit(5)
    ).all()
    report_ids = {
        r.session_id
        for r in db.scalars(
            select(EvaluationReport).where(EvaluationReport.user_id == user.id)
        ).all()
    }

    preferred = user.profile.preferred_interviewer if user.profile else None
    return DashboardOut(
        full_name=user.full_name,
        email=user.email,
        preferred_interviewer=preferred,
        categories=[CategoryOut.model_validate(c) for c in categories],
        recent_sessions=[_session_out(s, s.id in report_ids) for s in sessions],
        performance_overview={
            "interviews_completed": len(sessions),
            "average_score": None,
            "message": "Complete your first Software Engineering interview to unlock insights.",
        },
    )


@router.get("/interviews", response_model=list[InterviewSessionOut])
def list_interviews(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[InterviewSessionOut]:
    sessions = db.scalars(
        select(InterviewSession)
        .where(InterviewSession.user_id == user.id)
        .order_by(InterviewSession.created_at.desc())
    ).all()
    report_ids = {
        r.session_id
        for r in db.scalars(
            select(EvaluationReport).where(EvaluationReport.user_id == user.id)
        ).all()
    }
    return [_session_out(s, s.id in report_ids) for s in sessions]


@router.get("/reports/{report_id}", response_model=EvaluationReportOut)
def get_report(
    report_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> EvaluationReportOut:
    report = db.get(EvaluationReport, report_id)
    if report is None or report.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    session = db.get(InterviewSession, report.session_id)
    return EvaluationReportOut(
        id=report.id,
        session_id=report.session_id,
        summary=report.summary,
        rubric=report.rubric,
        created_at=report.created_at,
        category_slug=session.category_slug if session else None,
    )


@router.get("/reports", response_model=list[EvaluationReportOut])
def list_reports(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[EvaluationReportOut]:
    reports = db.scalars(
        select(EvaluationReport)
        .where(EvaluationReport.user_id == user.id)
        .order_by(EvaluationReport.created_at.desc())
    ).all()
    out: list[EvaluationReportOut] = []
    for report in reports:
        session = db.get(InterviewSession, report.session_id)
        out.append(
            EvaluationReportOut(
                id=report.id,
                session_id=report.session_id,
                summary=report.summary,
                rubric=report.rubric,
                created_at=report.created_at,
                category_slug=session.category_slug if session else None,
            )
        )
    return out
