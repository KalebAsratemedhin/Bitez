from uuid import UUID
from shared.logging import get_logger
from shared.messaging import get_rabbitmq, MessagePublisher
from app.config import settings

logger = get_logger("restaurants.events")

EXCHANGE_RESTAURANTS = "bitez.restaurants"
ROUTING_KEY_CREATED = "restaurant.created"
ROUTING_KEY_UPDATED = "restaurant.updated"
ROUTING_KEY_DELETED = "restaurant.deleted"


def _publish(routing_key: str, payload: dict) -> None:
    try:
        conn = get_rabbitmq()
        publisher = MessagePublisher(conn)
        publisher.publish(EXCHANGE_RESTAURANTS, routing_key, payload)
    except Exception as e:
        logger.warning("Failed to publish restaurant event", extra={"routing_key": routing_key, "error": str(e)})


def publish_restaurant_created(owner_id: UUID, restaurant_id: UUID, name: str, location: str | None, rating: float | None) -> None:
    _publish(ROUTING_KEY_CREATED, {
        "event": "restaurant.created",
        "owner_id": str(owner_id),
        "restaurant_id": str(restaurant_id),
        "name": name,
        "location": location,
        "rating": rating,
    })


def publish_restaurant_updated(owner_id: UUID, restaurant_id: UUID, name: str, location: str | None, rating: float | None) -> None:
    _publish(ROUTING_KEY_UPDATED, {
        "event": "restaurant.updated",
        "owner_id": str(owner_id),
        "restaurant_id": str(restaurant_id),
        "name": name,
        "location": location,
        "rating": rating,
    })


def publish_restaurant_deleted(restaurant_id: UUID) -> None:
    _publish(ROUTING_KEY_DELETED, {"event": "restaurant.deleted", "restaurant_id": str(restaurant_id)})
