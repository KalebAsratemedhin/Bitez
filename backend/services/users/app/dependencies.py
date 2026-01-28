from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from uuid import UUID
from shared.logging import get_logger
from app.services.auth_service import AuthService
from app.services.profile_service import ProfileService
from app.schemas.user import UserResponse

logger = get_logger("users.dependencies")

security = HTTPBearer()


def get_auth_service() -> AuthService:
    return AuthService()


def get_profile_service() -> ProfileService:
    return ProfileService()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    token = credentials.credentials
    user = auth_service.validate_access_token(token)
    if not user:
        logger.warning("Invalid access token in request")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_current_user_id(
    current_user: UserResponse = Depends(get_current_user)
) -> UUID:
    return current_user.id


async def get_current_active_user(
    current_user: UserResponse = Depends(get_current_user)
) -> UserResponse:
    if not current_user.is_active:
        logger.warning("Inactive user attempted access", extra={"user_id": str(current_user.id)})
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    return current_user
