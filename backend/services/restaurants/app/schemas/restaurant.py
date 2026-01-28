from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class RestaurantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    location: Optional[str] = Field(None, max_length=500)
    rating: Optional[float] = Field(None, ge=0, le=5)


class RestaurantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    location: Optional[str] = Field(None, max_length=500)
    rating: Optional[float] = Field(None, ge=0, le=5)


class RestaurantResponse(BaseModel):
    id: UUID
    owner_id: UUID
    name: str
    location: Optional[str]
    rating: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
