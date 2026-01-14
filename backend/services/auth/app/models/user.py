from uuid import UUID
from shared.database import Base
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from enum import Enum
from datetime import datetime
from sqlalchemy.types import String, Boolean, DateTime

class UserRole(str, Enum):
    CUSTOMER = "customer"
    COURIER = "courier"
    RESTAURANT_OWNER = "restaurant_owner"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    name = Column(
        String(255),
        nullable=False
    )

    role = Column(
        Enum(UserRole),
        nullable=False,
        default=UserRole.CUSTOMER
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.now
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        onupdate=datetime.now
    )