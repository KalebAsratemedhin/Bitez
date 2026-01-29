from uuid import uuid4
from sqlalchemy import Column, DateTime, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from shared.database import Base


class RestaurantOwnership(Base):
    __tablename__ = "restaurant_ownership"
    __table_args__ = (UniqueConstraint("owner_id", "restaurant_id", name="uq_restaurant_ownership_owner_restaurant"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    owner_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    restaurant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
