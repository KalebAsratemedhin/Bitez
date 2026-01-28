"""Add bio to user_profiles and first_name, last_name, role to users

Revision ID: 000000000002
Revises: 60c924f4ffe8
Create Date: 2026-01-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '000000000002'
down_revision: Union[str, Sequence[str], None] = '60c924f4ffe8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)"
    ))
    conn.execute(sa.text(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)"
    ))
    conn.execute(sa.text(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'customer'"
    ))
    op.add_column('user_profiles', sa.Column('bio', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('user_profiles', 'bio')
