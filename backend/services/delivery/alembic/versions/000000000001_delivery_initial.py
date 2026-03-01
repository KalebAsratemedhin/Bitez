"""delivery initial: restaurant_ownership and deliveries

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
        "delivery_restaurant_ownership",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_id", "restaurant_id", name="uq_delivery_restaurant_ownership_owner_restaurant"),
    )
    op.create_index(op.f("ix_delivery_restaurant_ownership_id"), "delivery_restaurant_ownership", ["id"], unique=False)
    op.create_index(op.f("ix_delivery_restaurant_ownership_owner_id"), "delivery_restaurant_ownership", ["owner_id"], unique=False)
    op.create_index(op.f("ix_delivery_restaurant_ownership_restaurant_id"), "delivery_restaurant_ownership", ["restaurant_id"], unique=False)

    op.create_table(
        "deliveries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("delivery_address", sa.String(length=500), nullable=True),
        sa.Column("delivery_person_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "PENDING_ASSIGNMENT", "ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED",
                name="deliverystatus",
            ),
            nullable=False,
        ),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("picked_up_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_deliveries_id"), "deliveries", ["id"], unique=False)
    op.create_index(op.f("ix_deliveries_order_id"), "deliveries", ["order_id"], unique=False)
    op.create_index(op.f("ix_deliveries_restaurant_id"), "deliveries", ["restaurant_id"], unique=False)
    op.create_index(op.f("ix_deliveries_customer_id"), "deliveries", ["customer_id"], unique=False)
    op.create_index(op.f("ix_deliveries_delivery_person_id"), "deliveries", ["delivery_person_id"], unique=False)
    op.create_index(op.f("ix_deliveries_status"), "deliveries", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_deliveries_status"), table_name="deliveries")
    op.drop_index(op.f("ix_deliveries_delivery_person_id"), table_name="deliveries")
    op.drop_index(op.f("ix_deliveries_customer_id"), table_name="deliveries")
    op.drop_index(op.f("ix_deliveries_restaurant_id"), table_name="deliveries")
    op.drop_index(op.f("ix_deliveries_order_id"), table_name="deliveries")
    op.drop_index(op.f("ix_deliveries_id"), table_name="deliveries")
    op.drop_table("deliveries")
    op.execute("DROP TYPE deliverystatus")
    op.drop_index(op.f("ix_delivery_restaurant_ownership_restaurant_id"), table_name="delivery_restaurant_ownership")
    op.drop_index(op.f("ix_delivery_restaurant_ownership_owner_id"), table_name="delivery_restaurant_ownership")
    op.drop_index(op.f("ix_delivery_restaurant_ownership_id"), table_name="delivery_restaurant_ownership")
    op.drop_table("delivery_restaurant_ownership")
