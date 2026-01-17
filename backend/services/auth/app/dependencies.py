from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from shared.logging import get_logger
from app.services.auth_service import AuthService
from app.schemas.user import UserResponse

logger = get_logger("auth.dependencies")

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserResponse:
    token = credentials.credentials
    auth_service = AuthService()
    
    user = auth_service.validate_access_token(token)
    if not user:
        logger.warning("Invalid access token in request")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


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
