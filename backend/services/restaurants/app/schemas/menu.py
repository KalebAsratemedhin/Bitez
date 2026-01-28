from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class MenuCreate(BaseModel):
    kind: str = Field(..., min_length=1, max_length=100)


class MenuUpdate(BaseModel):
    kind: Optional[str] = Field(None, min_length=1, max_length=100)


class MenuResponse(BaseModel):
    id: UUID
    restaurant_id: UUID
    kind: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
