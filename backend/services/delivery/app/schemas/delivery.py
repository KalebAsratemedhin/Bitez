from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.delivery import DeliveryStatus


class DeliveryResponse(BaseModel):
    id: UUID
    order_id: UUID
    restaurant_id: UUID
    customer_id: UUID
    delivery_address: Optional[str]
    delivery_person_id: Optional[UUID]
    status: DeliveryStatus
    assigned_at: Optional[datetime]
    picked_up_at: Optional[datetime]
    delivered_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DeliveryAssign(BaseModel):
    delivery_person_id: UUID


class DeliveryUpdate(BaseModel):
    status: DeliveryStatus
