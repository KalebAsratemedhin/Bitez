from datetime import datetime, timezone
from uuid import UUID
from typing import List, Optional

from shared.database import get_database
from shared.logging import get_logger
from shared.exceptions import NotFoundError

from app.models.delivery import Delivery, DeliveryStatus

logger = get_logger("delivery.delivery_service")


class DeliveryService:
    def __init__(self):
        self.db = get_database()

    def create_from_order(
        self,
        order_id: UUID,
        restaurant_id: UUID,
        customer_id: UUID,
        delivery_address: Optional[str],
    ) -> "Delivery":
        with self.db.get_session() as session:
            existing = session.query(Delivery).filter(Delivery.order_id == order_id).first()
            if existing:
                return existing
            d = Delivery(
                order_id=order_id,
                restaurant_id=restaurant_id,
                customer_id=customer_id,
                delivery_address=delivery_address,
                status=DeliveryStatus.PENDING_ASSIGNMENT,
            )
            session.add(d)
            session.flush()
            session.refresh(d)
            logger.info("Delivery created", extra={"delivery_id": str(d.id), "order_id": str(order_id)})
            return d

    def get_by_id(self, delivery_id: UUID) -> Optional[Delivery]:
        with self.db.get_session() as session:
            return session.query(Delivery).filter(Delivery.id == delivery_id).first()

    def list_by_delivery_person(self, delivery_person_id: UUID) -> List[Delivery]:
        with self.db.get_session() as session:
            return (
                session.query(Delivery)
                .filter(Delivery.delivery_person_id == delivery_person_id)
                .order_by(Delivery.created_at.desc())
                .all()
            )

    def list_pending_by_restaurant_ids(self, restaurant_ids: List[UUID]) -> List[Delivery]:
        if not restaurant_ids:
            return []
        with self.db.get_session() as session:
            return (
                session.query(Delivery)
                .filter(
                    Delivery.restaurant_id.in_(restaurant_ids),
                    Delivery.status == DeliveryStatus.PENDING_ASSIGNMENT,
                )
                .order_by(Delivery.created_at.desc())
                .all()
            )

    def assign(self, delivery_id: UUID, delivery_person_id: UUID) -> Delivery:
        with self.db.get_session() as session:
            d = session.query(Delivery).filter(Delivery.id == delivery_id).first()
            if not d:
                raise NotFoundError("Delivery not found")
            if d.status != DeliveryStatus.PENDING_ASSIGNMENT:
                raise ValueError("Delivery is already assigned")
            d.delivery_person_id = delivery_person_id
            d.status = DeliveryStatus.ASSIGNED
            d.assigned_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(d)
            logger.info("Delivery assigned", extra={"delivery_id": str(delivery_id), "delivery_person_id": str(delivery_person_id)})
            return d

    def update_status(self, delivery_id: UUID, status: DeliveryStatus, delivery_person_id: UUID) -> Delivery:
        with self.db.get_session() as session:
            d = session.query(Delivery).filter(Delivery.id == delivery_id).first()
            if not d:
                raise NotFoundError("Delivery not found")
            if d.delivery_person_id != delivery_person_id:
                raise ValueError("Not assigned to this delivery")
            d.status = status
            if status == DeliveryStatus.PICKED_UP:
                d.picked_up_at = datetime.now(timezone.utc)
            elif status == DeliveryStatus.DELIVERED:
                d.delivered_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(d)
            logger.info("Delivery status updated", extra={"delivery_id": str(delivery_id), "status": status.value})
            return d
