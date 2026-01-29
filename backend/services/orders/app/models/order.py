from uuid import uuid4
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Integer, Enum as SQLEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from shared.database import Base
import enum


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    customer_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    restaurant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    delivery_address = Column(String(500), nullable=True)
    status = Column(SQLEnum(OrderStatus), nullable=False, default=OrderStatus.PENDING, index=True)
    payment_status = Column(SQLEnum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING, index=True)
    stripe_payment_intent_id = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    menu_item_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    item_name = Column(String(255), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    order = relationship("Order", back_populates="items")
