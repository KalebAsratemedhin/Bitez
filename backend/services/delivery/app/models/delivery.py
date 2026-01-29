import enum
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, func
from sqlalchemy.dialects.postgresql import UUID
from shared.database import Base


class DeliveryStatus(str, enum.Enum):
    PENDING_ASSIGNMENT = "pending_assignment"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    order_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    restaurant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    delivery_address = Column(String(500), nullable=True)
    delivery_person_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    status = Column(SQLEnum(DeliveryStatus), nullable=False, default=DeliveryStatus.PENDING_ASSIGNMENT, index=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    picked_up_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
