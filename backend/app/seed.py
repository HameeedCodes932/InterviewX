"""Seed default interview categories."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.interview import Category

DEFAULT_CATEGORIES = [
    {
        "slug": "software-engineering",
        "name": "Software Engineering",
        "description": "Technical interviews covering system design, coding reasoning, and collaboration.",
        "available": True,
        "sort_order": 1,
        "disclaimer": None,
    },
    {
        "slug": "issb",
        "name": "ISSB Preparation",
        "description": "Practice for ISSB-style interviews. Preparation tool only — not an official endorsement.",
        "available": False,
        "sort_order": 2,
        "disclaimer": "Preparation tool only. Not affiliated with or endorsed by ISSB.",
    },
    {
        "slug": "ai-ml",
        "name": "AI / Machine Learning",
        "description": "ML system design, model trade-offs, and applied AI interview practice.",
        "available": False,
        "sort_order": 3,
        "disclaimer": None,
    },
    {
        "slug": "css-pms",
        "name": "CSS / PMS",
        "description": "Civil service interview preparation. Preparation tool only — not an official endorsement.",
        "available": False,
        "sort_order": 4,
        "disclaimer": "Preparation tool only. Not affiliated with or endorsed by CSS/PMS boards.",
    },
    {
        "slug": "scholarship",
        "name": "Scholarship Interviews",
        "description": "University and scholarship panel-style interview practice.",
        "available": False,
        "sort_order": 5,
        "disclaimer": None,
    },
    {
        "slug": "hr-behavioural",
        "name": "HR / Behavioural",
        "description": "Behavioural storytelling, leadership, and workplace judgment practice.",
        "available": False,
        "sort_order": 6,
        "disclaimer": None,
    },
]


def seed_categories(db: Session) -> None:
    existing = {c.slug for c in db.scalars(select(Category)).all()}
    for item in DEFAULT_CATEGORIES:
        if item["slug"] in existing:
            continue
        db.add(Category(**item))
    db.commit()
