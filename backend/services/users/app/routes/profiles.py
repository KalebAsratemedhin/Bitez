from fastapi import APIRouter, HTTPException, status, Depends
from uuid import UUID
from shared.logging import get_logger
from shared.exceptions import ValidationError, NotFoundError, DatabaseError

from app.schemas.user_profile import (
    UserProfileCreate,
    UserProfileUpdate,
    UserProfileResponse
)
from app.services.profile_service import ProfileService
from app.dependencies import get_current_user_id, get_profile_service

logger = get_logger("users.profiles")

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
async def get_my_profile(
    current_user_id: UUID = Depends(get_current_user_id),
    profile_service: ProfileService = Depends(get_profile_service)
):
    try:
        profile = profile_service.get_profile(current_user_id)
        
        if not profile:
            raise NotFoundError("Profile not found")
        
        return profile
        
    except NotFoundError as e:
        logger.warning("Profile not found", extra={
            "error": e.message,
            "user_id": str(current_user_id)
        })
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except Exception as e:
        logger.error("Error retrieving profile", extra={
            "error": str(e),
            "user_id": str(current_user_id)
        })
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )


@router.post(
    "",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_profile(
    profile_data: UserProfileCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    profile_service: ProfileService = Depends(get_profile_service)
):
    try:
        profile = profile_service.create_profile(current_user_id, profile_data)
        
        return profile
        
    except ValidationError as e:
        logger.warning("Profile creation failed", extra={
            "error": e.message,
            "user_id": str(current_user_id)
        })
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except DatabaseError:
        raise  # Let BitezException handler return 500 with underlying error message
    except Exception as e:
        logger.error("Profile creation error", extra={
            "error": str(e),
            "user_id": str(current_user_id)
        })
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create profile"
        )


@router.put("/me", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
async def update_my_profile(
    profile_data: UserProfileUpdate,
    current_user_id: UUID = Depends(get_current_user_id),
    profile_service: ProfileService = Depends(get_profile_service)
):
    try:
        profile = profile_service.update_profile(current_user_id, profile_data)
        
        return profile
        
    except NotFoundError as e:
        logger.warning("Profile not found for update", extra={
            "error": e.message,
            "user_id": str(current_user_id)
        })
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except ValidationError as e:
        logger.warning("Profile update failed", extra={
            "error": e.message,
            "user_id": str(current_user_id)
        })
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        logger.error("Profile update error", extra={
            "error": str(e),
            "user_id": str(current_user_id)
        })
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_profile(
    current_user_id: UUID = Depends(get_current_user_id),
    profile_service: ProfileService = Depends(get_profile_service)
):
    try:
        profile_service.delete_profile(current_user_id)
        
        return None
        
    except NotFoundError as e:
        logger.warning("Profile not found for deletion", extra={
            "error": e.message,
            "user_id": str(current_user_id)
        })
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except Exception as e:
        logger.error("Profile deletion error", extra={
            "error": str(e),
            "user_id": str(current_user_id)
        })
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete profile"
        )