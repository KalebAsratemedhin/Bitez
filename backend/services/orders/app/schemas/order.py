from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.order import OrderStatus, PaymentStatus


class OrderItemCreate(BaseModel):
    menu_item_id: UUID
    item_name: str = Field(..., min_length=1, max_length=255)
    unit_price: Decimal = Field(..., ge=0)
    quantity: int = Field(..., ge=1)


class OrderItemResponse(BaseModel):
    id: UUID
    order_id: UUID
    menu_item_id: Optional[UUID]
    item_name: str
    unit_price: Decimal
    quantity: int
    created_at: datetime

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    restaurant_id: UUID
    delivery_address: Optional[str] = Field(None, max_length=500)
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    id: UUID
    customer_id: UUID
    restaurant_id: UUID
    delivery_address: Optional[str]
    status: OrderStatus
    payment_status: PaymentStatus
    stripe_payment_intent_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse] = []

    class Config:
        from_attributes = True
