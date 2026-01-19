from datetime import datetime, timedelta
from typing import Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from shared.database import get_database
from shared.logging import get_logger
from shared.exceptions import ValidationError, NotFoundError, DatabaseError

from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.auth import UserRegister, UserLogin
from app.schemas.user import UserResponse
from app.services.token_service import TokenService
from app.utils.password import hash_password, verify_password, validate_password_strength

logger = get_logger("auth.auth_service")


class AuthService:
    def __init__(self):
        self.token_service = TokenService()
        self.db = get_database()
    
    def register_user(self, user_data: UserRegister) -> Tuple[UserResponse, str, str]:
        is_valid, error_message = validate_password_strength(user_data.password)
        if not is_valid:
            raise ValidationError(f"Password validation failed: {error_message}")
        
        password_hash = hash_password(user_data.password)
        
        new_user = User(
            email=user_data.email.lower(),
            password_hash=password_hash,
            is_active=True,
            is_verified=False
        )
        
        try:
            with self.db.get_session() as session:
                session.add(new_user)
                session.flush()
                
                access_token = self.token_service.create_access_token(
                    {"sub": str(new_user.id), "email": new_user.email}
                )
                refresh_token = self.token_service.create_refresh_token(
                    {"sub": str(new_user.id)}
                )
                
                refresh_token_record = RefreshToken(
                    user_id=new_user.id,
                    token=refresh_token,
                    expires_at=datetime.utcnow() + self.token_service.get_refresh_token_expiry_delta(),
                    is_revoked=False
                )
                session.add(refresh_token_record)
                session.commit()
                
                logger.info("User registered successfully", extra={
                    "user_id": str(new_user.id),
                    "email": new_user.email
                })
                
                user_response = UserResponse.model_validate(new_user)
                return user_response, access_token, refresh_token
                
        except IntegrityError as e:
            session.rollback()
            if "unique constraint" in str(e).lower() or "duplicate key" in str(e).lower():
                logger.warning("Registration failed: email already exists", extra={"email": user_data.email})
                raise ValidationError("Email already registered")
            raise DatabaseError("Failed to register user", details={"error": str(e)})
        except Exception as e:
            session.rollback()
            logger.error("User registration failed", extra={"error": str(e), "email": user_data.email})
            raise DatabaseError("Failed to register user", details={"error": str(e)})
    
    def login_user(self, login_data: UserLogin) -> Tuple[UserResponse, str, str]:
        with self.db.get_session() as session:
            user = session.query(User).filter(
                User.email.ilike(login_data.email.lower())
            ).first()
            
            if not user:
                logger.warning("Login failed: user not found", extra={"email": login_data.email})
                raise ValidationError("Invalid email or password")
            
            if not verify_password(login_data.password, user.password_hash):
                logger.warning("Login failed: invalid password", extra={"user_id": str(user.id)})
                raise ValidationError("Invalid email or password")
            
            if not user.is_active:
                logger.warning("Login failed: user inactive", extra={"user_id": str(user.id)})
                raise ValidationError("User account is inactive")
            
            access_token = self.token_service.create_access_token(
                {"sub": str(user.id), "email": user.email}
            )
            refresh_token = self.token_service.create_refresh_token(
                {"sub": str(user.id)}
            )
            
            refresh_token_record = RefreshToken(
                user_id=user.id,
                token=refresh_token,
                expires_at=datetime.utcnow() + self.token_service.get_refresh_token_expiry_delta(),
                is_revoked=False
            )
            session.add(refresh_token_record)
            session.commit()
            
            logger.info("User logged in successfully", extra={
                "user_id": str(user.id),
                "email": user.email
            })
            
            user_response = UserResponse.model_validate(user)
            return user_response, access_token, refresh_token
    
    def refresh_access_token(self, refresh_token: str) -> str:
        payload = self.token_service.decode_refresh_token(refresh_token)
        if not payload:
            raise ValidationError("Invalid refresh token")
        
        user_id = payload.get("sub")
        if not user_id:
            raise ValidationError("Invalid refresh token payload")

        try:
            user_uuid = UUID(user_id)
        except (ValueError, TypeError) as e:
            logger.warning("Invalid user ID format in refresh token", extra={"user_id": user_uuid})
            raise ValidationError("Invalid refresh token payload")
    
       
        with self.db.get_session() as session:
            token_record = session.query(RefreshToken).filter(
                RefreshToken.token == refresh_token,
                RefreshToken.user_id == UUID(user_id)
            ).first()

            
            if not token_record:
                logger.warning("Refresh token not found in database", extra={"user_id": user_id})
                raise ValidationError("Invalid refresh token")
            
            if token_record.is_revoked:
                logger.warning("Refresh token revoked", extra={"user_id": user_id})
                raise ValidationError("Refresh token has been revoked")
            
            
            user = session.query(User).filter(User.id == UUID(user_id)).first()
            if not user or not user.is_active:
                raise ValidationError("User account is inactive")
            
            access_token = self.token_service.create_access_token(
                {"sub": str(user.id), "email": user.email}
            )

            print(access_token, ' here is the access_token')
            
            logger.info("Access token refreshed", extra={"user_id": user_id})
            return access_token
    
    def logout_user(self, refresh_token: str) -> None:
        payload = self.token_service.decode_refresh_token(refresh_token)
        if not payload:
            raise ValidationError("Invalid refresh token")
        
        user_id = payload.get("sub")
        if not user_id:
            raise ValidationError("Invalid refresh token payload")
        
        with self.db.get_session() as session:
            token_record = session.query(RefreshToken).filter(
                RefreshToken.token == refresh_token,
                RefreshToken.user_id == UUID(user_id),
                RefreshToken.is_revoked == False
            ).first()
            
            if token_record:
                token_record.is_revoked = True
                session.commit()
                logger.info("User logged out", extra={"user_id": user_id})
            else:
                logger.warning("Refresh token not found or already revoked", extra={"user_id": user_id})
    
    def validate_access_token(self, access_token: str) -> Optional[UserResponse]:
        payload = self.token_service.decode_access_token(access_token)
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        with self.db.get_session() as session:
            user = session.query(User).filter(User.id == UUID(user_id)).first()
            
            if not user or not user.is_active:
                return None
            
            return UserResponse.model_validate(user)
    
    def get_user_by_id(self, user_id: UUID) -> Optional[UserResponse]:
        with self.db.get_session() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return None
            return UserResponse.model_validate(user)
