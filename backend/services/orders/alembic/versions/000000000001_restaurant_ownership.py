"""restaurant_ownership table

Revision ID: 000000000001
Revises:
Create Date: 2026-01-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "000000000001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "restaurant_ownership",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_id", "restaurant_id", name="uq_restaurant_ownership_owner_restaurant"),
    )
    op.create_index(op.f("ix_restaurant_ownership_id"), "restaurant_ownership", ["id"], unique=False)
    op.create_index(op.f("ix_restaurant_ownership_owner_id"), "restaurant_ownership", ["owner_id"], unique=False)
    op.create_index(op.f("ix_restaurant_ownership_restaurant_id"), "restaurant_ownership", ["restaurant_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_restaurant_ownership_restaurant_id"), table_name="restaurant_ownership")
    op.drop_index(op.f("ix_restaurant_ownership_owner_id"), table_name="restaurant_ownership")
    op.drop_index(op.f("ix_restaurant_ownership_id"), table_name="restaurant_ownership")
    op.drop_table("restaurant_ownership")
