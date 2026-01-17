import re
from typing import Optional
from passlib.context import CryptContext
from shared.logging import get_logger
from app.config import settings

logger = get_logger("auth.password")

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.bcrypt_rounds
)


def hash_password(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error("Password hashing failed", extra={"error": str(e)})
        raise ValueError("Failed to hash password")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error("Password verification failed", extra={"error": str(e)})
        return False


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    if len(password) < settings.password_min_length:
        return False, f"Password must be at least {settings.password_min_length} characters long"
    
    if settings.password_require_uppercase and not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if settings.password_require_lowercase and not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if settings.password_require_digits and not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    if settings.password_require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, None

