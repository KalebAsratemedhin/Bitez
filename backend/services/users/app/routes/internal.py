"""Internal API for other services (e.g. resolve user_id -> email). Not exposed via gateway."""

from uuid import UUID
from fastapi import APIRouter, HTTPException, status

from shared.database import get_database
from app.models.user import User

router = APIRouter(prefix="/internal/users", tags=["internal"])


@router.get("/{user_id}/contact")
def get_user_contact(user_id: UUID):
    """Return email for a user. Used by Notifications service. Internal only."""
    db = get_database()
    with db.get_session() as session:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return {"email": user.email}
