import threading
from uuid import UUID
from typing import Optional
from shared.logging import get_logger
from shared.messaging import get_rabbitmq, MessageConsumer
from app.services.delivery_service import DeliveryService

logger = get_logger("delivery.order_consumer")

EXCHANGE_ORDERS = "bitez.orders"
QUEUE_READY_FOR_DELIVERY = "delivery.order_ready_for_delivery"
ROUTING_KEY_READY = "order.ready_for_delivery"


def _handle_message(msg: dict, channel) -> None:
    event = msg.get("event")
    if event != "order.ready_for_delivery":
        return
    order_id = msg.get("order_id")
    restaurant_id = msg.get("restaurant_id")
    customer_id = msg.get("customer_id")
    delivery_address: Optional[str] = msg.get("delivery_address")
    if not order_id or not restaurant_id or not customer_id:
        return
    try:
        svc = DeliveryService()
        svc.create_from_order(
            UUID(order_id),
            UUID(restaurant_id),
            UUID(customer_id),
            delivery_address,
        )
    except Exception as e:
        logger.warning("Failed to create delivery from order", extra={"order_id": order_id, "error": str(e)})


def start_order_consumer() -> None:
    def run():
        try:
            conn = get_rabbitmq()
            conn.declare_exchange(EXCHANGE_ORDERS, exchange_type="topic")
            conn.declare_queue(QUEUE_READY_FOR_DELIVERY)
            conn.bind_queue(QUEUE_READY_FOR_DELIVERY, EXCHANGE_ORDERS, ROUTING_KEY_READY)
            consumer = MessageConsumer(conn)
            consumer.consume(QUEUE_READY_FOR_DELIVERY, _handle_message)
        except Exception as e:
            logger.error("Order ready_for_delivery consumer failed", extra={"error": str(e)})

    t = threading.Thread(target=run, daemon=True)
    t.start()
    logger.info("Order ready_for_delivery consumer thread started")
