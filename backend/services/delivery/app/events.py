from uuid import UUID
from shared.logging import get_logger
from shared.messaging import get_rabbitmq, MessagePublisher

logger = get_logger("delivery.events")

EXCHANGE_DELIVERIES = "bitez.deliveries"
ROUTING_KEY_ASSIGNED = "delivery.assigned"
ROUTING_KEY_DELIVERED = "delivery.delivered"


def _publish(routing_key: str, payload: dict) -> None:
    try:
        conn = get_rabbitmq()
        publisher = MessagePublisher(conn)
        publisher.publish(EXCHANGE_DELIVERIES, routing_key, payload)
    except Exception as e:
        logger.warning("Failed to publish delivery event", extra={"routing_key": routing_key, "error": str(e)})


def publish_delivery_assigned(order_id: UUID, delivery_person_id: UUID, customer_id: UUID) -> None:
    _publish(ROUTING_KEY_ASSIGNED, {
        "event": "delivery.assigned",
        "order_id": str(order_id),
        "delivery_person_id": str(delivery_person_id),
        "customer_id": str(customer_id),
    })


def publish_delivery_delivered(order_id: UUID, customer_id: UUID) -> None:
    _publish(ROUTING_KEY_DELIVERED, {
        "event": "delivery.delivered",
        "order_id": str(order_id),
        "customer_id": str(customer_id),
    })
