from fastapi import APIRouter, HTTPException, status, Depends
from shared.logging import get_logger
from shared.exceptions import ValidationError

from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenRefresh,
    TokenResponse,
    TokenValidationResponse
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from app.dependencies import get_current_user
from app.config import settings

logger = get_logger("auth.routes")

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    try:
        auth_service = AuthService()
        user, access_token, refresh_token = auth_service.register_user(user_data)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.jwt_access_token_expires_in,
            user=user
        )
    except ValidationError as e:
        logger.warning("Registration failed", extra={"error": e.message, "email": user_data.email})
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        logger.error("Registration error", extra={"error": str(e), "email": user_data.email})
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to register user")


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(login_data: UserLogin):
    try:
        auth_service = AuthService()
        user, access_token, refresh_token = auth_service.login_user(login_data)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.jwt_access_token_expires_in,
            user=user
        )
    except ValidationError as e:
        logger.warning("Login failed", extra={"error": e.message, "email": login_data.email})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message)
    except Exception as e:
        logger.error("Login error", extra={"error": str(e), "email": login_data.email})
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to authenticate user")


@router.post("/refresh", response_model=dict, status_code=status.HTTP_200_OK)
async def refresh_token(token_data: TokenRefresh):
    try:
        auth_service = AuthService()
        access_token = auth_service.refresh_access_token(token_data.refresh_token)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.jwt_access_token_expires_in
        }
    except ValidationError as e:
        logger.warning("Token refresh failed", extra={"error": e.message})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message)
    except Exception as e:
        logger.error("Token refresh error", extra={"error": str(e)})
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to refresh token")


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(token_data: TokenRefresh):
    try:
        auth_service = AuthService()
        auth_service.logout_user(token_data.refresh_token)
        return {"message": "Logged out successfully"}
    except ValidationError as e:
        logger.warning("Logout failed", extra={"error": e.message})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message)
    except Exception as e:
        logger.error("Logout error", extra={"error": str(e)})
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to logout user")


@router.get("/validate", response_model=TokenValidationResponse, status_code=status.HTTP_200_OK)
async def validate_token(current_user: UserResponse = Depends(get_current_user)):
    return TokenValidationResponse(
        valid=True,
        user_id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified
    )


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    return current_user
