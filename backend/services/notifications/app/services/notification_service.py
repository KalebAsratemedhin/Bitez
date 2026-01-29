from uuid import UUID
from typing import List, Optional
from datetime import datetime

from shared.database import get_database
from shared.logging import get_logger

from app.models.notification import Notification
from app.schemas.notification import NotificationResponse

logger = get_logger("notifications.service")


class NotificationService:
    def __init__(self):
        self.db = get_database()

    def create(self, user_id: UUID, type: str, title: str, body: Optional[str] = None, metadata: Optional[dict] = None) -> NotificationResponse:
        with self.db.get_session() as session:
            n = Notification(
                user_id=user_id,
                type=type,
                title=title,
                body=body,
                metadata_=metadata or {},
            )
            session.add(n)
            session.commit()
            session.refresh(n)
            return self._to_response(n)

    def list_by_user(self, user_id: UUID, limit: int = 50, offset: int = 0, unread_only: bool = False) -> tuple[List[NotificationResponse], int]:
        with self.db.get_session() as session:
            q = session.query(Notification).filter(Notification.user_id == user_id)
            if unread_only:
                q = q.filter(Notification.read_at.is_(None))
            total = q.count()
            rows = q.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()
            return [self._to_response(r) for r in rows], total

    def get_by_id(self, notification_id: UUID, user_id: UUID) -> Optional[NotificationResponse]:
        with self.db.get_session() as session:
            n = session.query(Notification).filter(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            ).first()
            return self._to_response(n) if n else None

    def mark_read(self, notification_id: UUID, user_id: UUID) -> Optional[NotificationResponse]:
        with self.db.get_session() as session:
            n = session.query(Notification).filter(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            ).first()
            if not n:
                return None
            n.read_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(n)
            return self._to_response(n)

    def _to_response(self, n: Notification) -> NotificationResponse:
        return NotificationResponse(
            id=n.id,
            user_id=n.user_id,
            type=n.type,
            title=n.title,
            body=n.body,
            read_at=n.read_at,
            created_at=n.created_at,
            metadata=n.metadata_ or {},
        )
