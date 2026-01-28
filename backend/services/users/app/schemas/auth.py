from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.schemas.user import UserResponse


class UserRegister(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr = Field(...)
    password: str = Field(..., min_length=8, max_length=128)
    password_confirm: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="customer")

    @field_validator("password_confirm")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("role")
    @classmethod
    def role_valid(cls, v: str) -> str:
        allowed = ("customer", "restaurant_owner", "delivery_person")
        if v not in allowed:
            raise ValueError(f"Role must be one of {allowed}")
        return v


class UserLogin(BaseModel):
    email: EmailStr = Field(...)
    password: str = Field(...)


class TokenRefresh(BaseModel):
    refresh_token: str = Field(...)


class TokenResponse(BaseModel):
    access_token: str = Field(...)
    refresh_token: str = Field(...)
    token_type: str = Field(default="bearer")
    expires_in: int = Field(...)
    user: Optional[UserResponse] = Field(None)


class TokenValidationResponse(BaseModel):
    valid: bool = Field(...)
    user_id: Optional[UUID] = Field(None)
    email: Optional[str] = Field(None)
    is_active: Optional[bool] = Field(None)
    is_verified: Optional[bool] = Field(None)
    error: Optional[str] = Field(None)
