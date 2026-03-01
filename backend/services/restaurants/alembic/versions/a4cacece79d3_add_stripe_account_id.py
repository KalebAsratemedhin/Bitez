"""add stripe_account_id

Revision ID: a4cacece79d3
Revises: 062ac72cc702
Create Date: 2026-01-29 18:38:07.658096

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a4cacece79d3'
down_revision: Union[str, Sequence[str], None] = '062ac72cc702'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: add stripe_account_id to restaurants only."""
    op.add_column('restaurants', sa.Column('stripe_account_id', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_restaurants_stripe_account_id'), 'restaurants', ['stripe_account_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema: remove stripe_account_id from restaurants only."""
    op.drop_index(op.f('ix_restaurants_stripe_account_id'), table_name='restaurants')
    op.drop_column('restaurants', 'stripe_account_id')
