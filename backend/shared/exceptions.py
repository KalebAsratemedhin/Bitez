"""Common exception classes for error handling."""

from typing import Optional


class BitezException(Exception):
    """Base exception for all Bitez application errors."""
    
    def __init__(self, message: str, status_code: int = 500, details: Optional[dict] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class DatabaseError(BitezException):
    """Database operation errors."""
    
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(message, status_code=500, details=details)


class MessagingError(BitezException):
    """Message queue operation errors."""
    
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(message, status_code=500, details=details)


class ValidationError(BitezException):
    """Data validation errors."""
    
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(message, status_code=400, details=details)


class NotFoundError(BitezException):
    """Resource not found errors."""
    
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(message, status_code=404, details=details)