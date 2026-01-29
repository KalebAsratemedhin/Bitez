from uuid import UUID
from typing import Optional
from shared.logging import get_logger
from shared.messaging import get_rabbitmq, MessagePublisher

logger = get_logger("orders.events")

EXCHANGE_ORDERS = "bitez.orders"
ROUTING_KEY_CREATED = "order.created"
ROUTING_KEY_READY_FOR_DELIVERY = "order.ready_for_delivery"


def publish_order_created(order_id: UUID, customer_id: UUID, restaurant_id: UUID) -> None:
    try:
        conn = get_rabbitmq()
        publisher = MessagePublisher(conn)
        publisher.publish(
            EXCHANGE_ORDERS,
            ROUTING_KEY_CREATED,
            {
                "event": "order.created",
                "order_id": str(order_id),
                "customer_id": str(customer_id),
                "restaurant_id": str(restaurant_id),
            },
        )
    except Exception as e:
        logger.warning("Failed to publish order.created", extra={"order_id": str(order_id), "error": str(e)})


def publish_order_ready_for_delivery(
    restaurant_id: UUID,
    customer_id: UUID,
    order_id: UUID,
    delivery_address: Optional[str],
) -> None:
    try:
        conn = get_rabbitmq()
        publisher = MessagePublisher(conn)
        publisher.publish(
            EXCHANGE_ORDERS,
            ROUTING_KEY_READY_FOR_DELIVERY,
            {
                "event": "order.ready_for_delivery",
                "order_id": str(order_id),
                "restaurant_id": str(restaurant_id),
                "customer_id": str(customer_id),
                "delivery_address": delivery_address,
            },
        )
    except Exception as e:
        logger.warning("Failed to publish order.ready_for_delivery", extra={"order_id": str(order_id), "error": str(e)})
