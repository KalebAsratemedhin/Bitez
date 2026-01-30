"""restaurant_reviews initial

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
        "restaurant_reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_restaurant_reviews_id"), "restaurant_reviews", ["id"], unique=False)
    op.create_index(op.f("ix_restaurant_reviews_restaurant_id"), "restaurant_reviews", ["restaurant_id"], unique=False)
    op.create_index(op.f("ix_restaurant_reviews_user_id"), "restaurant_reviews", ["user_id"], unique=False)
    op.create_index(op.f("ix_restaurant_reviews_order_id"), "restaurant_reviews", ["order_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_restaurant_reviews_order_id"), table_name="restaurant_reviews")
    op.drop_index(op.f("ix_restaurant_reviews_user_id"), table_name="restaurant_reviews")
    op.drop_index(op.f("ix_restaurant_reviews_restaurant_id"), table_name="restaurant_reviews")
    op.drop_index(op.f("ix_restaurant_reviews_id"), table_name="restaurant_reviews")
    op.drop_table("restaurant_reviews")
