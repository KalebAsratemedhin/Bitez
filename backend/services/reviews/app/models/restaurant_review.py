from uuid import uuid4
from sqlalchemy import Column, String, Integer, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID
from shared.database import Base


class RestaurantReview(Base):
    __tablename__ = "restaurant_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    restaurant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
