from uuid import uuid4
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from shared.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    type = Column(String(64), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    metadata_ = Column("metadata", JSON, nullable=True, default=dict)
