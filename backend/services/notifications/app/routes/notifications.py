from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.services.notification_service import NotificationService
from app.dependencies import get_current_user_id, get_notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
def list_my_notifications(
    user_id: UUID = Depends(get_current_user_id),
    service: NotificationService = Depends(get_notification_service),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    unread_only: bool = Query(False),
):
    items, total = service.list_by_user(user_id, limit=limit, offset=offset, unread_only=unread_only)
    return NotificationListResponse(items=items, total=total)


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: NotificationService = Depends(get_notification_service),
):
    n = service.get_by_id(notification_id, user_id)
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return n


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: NotificationService = Depends(get_notification_service),
):
    n = service.mark_read(notification_id, user_id)
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return n
