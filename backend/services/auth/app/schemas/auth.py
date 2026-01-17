"""Authentication-related Pydantic schemas."""

from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.schemas.user import UserResponse


class UserRegister(BaseModel):
    """User registration request schema."""
    
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    password_confirm: str = Field(..., min_length=8, max_length=128, description="Password confirmation")
    
    @field_validator("password_confirm")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate that passwords match."""
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePassword123",
                "password_confirm": "SecurePassword123"
            }
        }


class UserLogin(BaseModel):
    """User login request schema."""
    
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePassword123"
            }
        }


class TokenRefresh(BaseModel):
    """Token refresh request schema."""
    
    refresh_token: str = Field(..., description="Refresh token")
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }


class TokenResponse(BaseModel):
    """Token response schema."""
    
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration time in seconds")
    user: Optional[UserResponse] = Field(None, description="User information")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 3600,
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "user@example.com",
                    "is_active": True,
                    "is_verified": False
                }
            }
        }


class TokenValidationResponse(BaseModel):
    """Token validation response schema."""
    
    valid: bool = Field(..., description="Whether token is valid")
    user_id: Optional[UUID] = Field(None, description="User ID if token is valid")
    email: Optional[str] = Field(None, description="User email if token is valid")
    is_active: Optional[bool] = Field(None, description="User active status if token is valid")
    is_verified: Optional[bool] = Field(None, description="User verified status if token is valid")
    error: Optional[str] = Field(None, description="Error message if token is invalid")
    
    class Config:
        json_schema_extra = {
            "example": {
                "valid": True,
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "is_active": True,
                "is_verified": False
            }
        }
