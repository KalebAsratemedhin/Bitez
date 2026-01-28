from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from shared.database import get_database
from shared.logging import get_logger
from shared.exceptions import ValidationError, NotFoundError, DatabaseError

from app.models.user_profile import UserProfile
from app.schemas.user_profile import UserProfileCreate, UserProfileUpdate, UserProfileResponse

logger = get_logger("users.profile_service")


class ProfileService:
    def __init__(self):
        self.db = get_database()
    
    def create_profile(
        self, 
        user_id: UUID, 
        profile_data: UserProfileCreate
    ) -> UserProfileResponse:
        existing_profile = self.get_profile(user_id)
        if existing_profile:
            raise ValidationError("Profile already exists for this user")
        
        new_profile = UserProfile(
            user_id=user_id,
            first_name=profile_data.first_name,
            last_name=profile_data.last_name,
            phone_number=profile_data.phone_number,
            avatar_url=profile_data.avatar_url,
            bio=profile_data.bio,
            date_of_birth=profile_data.date_of_birth,
            preferences=profile_data.preferences or {}
        )
        
        with self.db.get_session() as session:
            try:
                session.add(new_profile)
                session.commit()
                
                logger.info("Profile created successfully", extra={
                    "profile_id": str(new_profile.id),
                    "user_id": str(user_id)
                })
                
                return UserProfileResponse.model_validate(new_profile)
                
            except IntegrityError as e:
                if "unique constraint" in str(e).lower() or "duplicate key" in str(e).lower():
                    logger.warning("Profile creation failed: duplicate user_id", extra={
                        "user_id": str(user_id)
                    })
                    raise ValidationError("Profile already exists for this user")
                raise DatabaseError("Failed to create profile", details={"error": str(e)})
            except Exception as e:
                logger.error("Profile creation failed", extra={
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "user_id": str(user_id)
                })
                raise
    
    def get_profile(self, user_id: UUID) -> Optional[UserProfileResponse]:
        with self.db.get_session() as session:
            profile = session.query(UserProfile).filter(
                UserProfile.user_id == user_id
            ).first()
            
            if not profile:
                return None
            
            return UserProfileResponse.model_validate(profile)
    
    def update_profile(
        self,
        user_id: UUID,
        profile_data: UserProfileUpdate
    ) -> UserProfileResponse:
        with self.db.get_session() as session:
            profile = session.query(UserProfile).filter(
                UserProfile.user_id == user_id
            ).first()
            
            if not profile:
                raise NotFoundError("Profile not found")
            
            update_data = profile_data.model_dump(exclude_unset=True)
            
            for field, value in update_data.items():
                if field == "preferences" and value is not None:
                    current_prefs = profile.preferences or {}
                    current_prefs.update(value)
                    setattr(profile, field, current_prefs)
                elif value is not None:
                    setattr(profile, field, value)
            
            session.commit()
            
            logger.info("Profile updated successfully", extra={
                "profile_id": str(profile.id),
                "user_id": str(user_id)
            })
            
            return UserProfileResponse.model_validate(profile)
    
    def delete_profile(self, user_id: UUID) -> None:
        with self.db.get_session() as session:
            profile = session.query(UserProfile).filter(
                UserProfile.user_id == user_id
            ).first()
            
            if not profile:
                raise NotFoundError("Profile not found")
            
            session.delete(profile)
            session.commit()
            
            logger.info("Profile deleted successfully", extra={
                "profile_id": str(profile.id),
                "user_id": str(user_id)
            })