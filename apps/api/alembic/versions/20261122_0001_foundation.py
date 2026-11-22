"""Foundation schema baseline (no domain tables yet).

Revision ID: 20261122_0001
Revises:
Create Date: 2026-11-22
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "20261122_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Domain tables (users, sessions, interviews, etc.) arrive in later tasks.
    pass


def downgrade() -> None:
    pass
