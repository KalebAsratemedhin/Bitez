from datetime import datetime
from typing import Optional, Any, Dict
from uuid import UUID
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    title: str
    body: Optional[str] = None
    read_at: Optional[datetime] = None
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    items: list
    total: int
