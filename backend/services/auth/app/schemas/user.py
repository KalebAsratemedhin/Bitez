"""User-related Pydantic schemas."""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """User creation schema for internal use."""
    
    email: EmailStr
    password_hash: str
    is_active: bool = True
    is_verified: bool = False


class UserResponse(BaseModel):
    """User response schema."""
    
    id: UUID
    email: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "is_active": True,
                "is_verified": False,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        }
