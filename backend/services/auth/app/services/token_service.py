from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from shared.logging import get_logger
from app.config import settings

logger = get_logger("auth.token_service")


class TokenService:
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(seconds=settings.jwt_access_token_expires_in)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(seconds=settings.jwt_refresh_token_expires_in)
        
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, settings.jwt_refresh_secret, algorithm=settings.jwt_algorithm)
        return encoded_jwt
    
    @staticmethod
    def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
            if payload.get("type") != "access":
                logger.warning("Invalid token type for access token", extra={"token_type": payload.get("type")})
                return None
            
            return payload
        except JWTError as e:
            logger.debug("Access token decode failed", extra={"error": str(e)})
            return None
    
    @staticmethod
    def decode_refresh_token(token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(token, settings.jwt_refresh_secret, algorithms=[settings.jwt_algorithm])
            if payload.get("type") != "refresh":
                logger.warning("Invalid token type for refresh token", extra={"token_type": payload.get("type")})
                return None
            
            return payload
        except JWTError as e:
            logger.debug("Refresh token decode failed", extra={"error": str(e)})
            return None
    
    @staticmethod
    def get_token_expiry_delta() -> timedelta:
        return timedelta(seconds=settings.jwt_access_token_expires_in)
    
    @staticmethod
    def get_refresh_token_expiry_delta() -> timedelta:
        return timedelta(seconds=settings.jwt_refresh_token_expires_in)
