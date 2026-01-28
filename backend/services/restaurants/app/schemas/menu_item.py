from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class MenuItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: Decimal = Field(..., ge=0)


class MenuItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)


class MenuItemResponse(BaseModel):
    id: UUID
    menu_id: UUID
    name: str
    description: Optional[str]
    price: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        
class MenuItemsBulkCreate(BaseModel):
    items: list[MenuItemCreate] = Field(..., min_length=1)