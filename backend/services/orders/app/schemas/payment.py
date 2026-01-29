from typing import Optional
from pydantic import BaseModel, Field


class OrderPayResponse(BaseModel):
    client_secret: str  # For Stripe Elements; empty if already confirmed with payment_method_id
    payment_intent_id: str


class OrderPayRequest(BaseModel):
    payment_method_id: Optional[str] = Field(None, description="If provided, payment is confirmed on server and order is marked paid")
