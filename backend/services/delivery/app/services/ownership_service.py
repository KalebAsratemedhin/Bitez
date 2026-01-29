from uuid import UUID
from typing import List

from shared.database import get_database
from shared.logging import get_logger
from app.models.restaurant_ownership import RestaurantOwnership

logger = get_logger("delivery.ownership_service")


class OwnershipService:
    def __init__(self):
        self.db = get_database()

    def upsert(self, owner_id: UUID, restaurant_id: UUID) -> None:
        with self.db.get_session() as session:
            existing = session.query(RestaurantOwnership).filter(
                RestaurantOwnership.owner_id == owner_id,
                RestaurantOwnership.restaurant_id == restaurant_id,
            ).first()
            if existing:
                return
            row = RestaurantOwnership(owner_id=owner_id, restaurant_id=restaurant_id)
            session.add(row)

    def remove_by_restaurant(self, restaurant_id: UUID) -> None:
        with self.db.get_session() as session:
            session.query(RestaurantOwnership).filter(
                RestaurantOwnership.restaurant_id == restaurant_id,
            ).delete()

    def get_restaurant_ids_by_owner(self, owner_id: UUID) -> List[UUID]:
        with self.db.get_session() as session:
            rows = session.query(RestaurantOwnership.restaurant_id).filter(
                RestaurantOwnership.owner_id == owner_id,
            ).all()
            return [r[0] for r in rows]
