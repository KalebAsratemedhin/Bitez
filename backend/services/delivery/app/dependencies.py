from uuid import UUID
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from shared.logging import get_logger
from app.config import settings
from app.services.ownership_service import OwnershipService
from app.services.delivery_service import DeliveryService

logger = get_logger("delivery.dependencies")
security = HTTPBearer()


def get_ownership_service() -> OwnershipService:
    return OwnershipService()


def get_delivery_service() -> DeliveryService:
    return DeliveryService()


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UUID:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token", headers={"WWW-Authenticate": "Bearer"})
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload", headers={"WWW-Authenticate": "Bearer"})
    try:
        return UUID(sub)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload", headers={"WWW-Authenticate": "Bearer"})


async def require_restaurant_owner(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UUID:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token", headers={"WWW-Authenticate": "Bearer"})
    if payload.get("role") != "restaurant_owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Restaurant owner role required")
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload", headers={"WWW-Authenticate": "Bearer"})
    try:
        return UUID(sub)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload", headers={"WWW-Authenticate": "Bearer"})


async def require_delivery_person(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UUID:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token", headers={"WWW-Authenticate": "Bearer"})
    if payload.get("role") != "delivery_person":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Delivery person role required")
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload", headers={"WWW-Authenticate": "Bearer"})
    try:
        return UUID(sub)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload", headers={"WWW-Authenticate": "Bearer"})
