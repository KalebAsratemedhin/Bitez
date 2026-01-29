import threading
from uuid import UUID
from shared.logging import get_logger
from shared.messaging import get_rabbitmq, MessageConsumer
from app.services.order_service import OrderService
from app.schemas.order import OrderUpdate
from app.models.order import OrderStatus

logger = get_logger("orders.delivery_consumer")

EXCHANGE_DELIVERIES = "bitez.deliveries"
QUEUE_DELIVERY_DELIVERED = "orders.delivery_delivered"
ROUTING_KEY_DELIVERED = "delivery.delivered"


def _handle_message(msg: dict, channel) -> None:
    event = msg.get("event")
    if event != "delivery.delivered":
        return
    order_id_str = msg.get("order_id")
    if not order_id_str:
        return
    try:
        order_id = UUID(order_id_str)
        svc = OrderService()
        svc.update_status(order_id, OrderUpdate(status=OrderStatus.DELIVERED))
    except Exception as e:
        logger.warning("Failed to process delivery.delivered", extra={"order_id": order_id_str, "error": str(e)})


def start_delivery_delivered_consumer() -> None:
    def run():
        try:
            conn = get_rabbitmq()
            conn.declare_exchange(EXCHANGE_DELIVERIES, exchange_type="topic")
            conn.declare_queue(QUEUE_DELIVERY_DELIVERED)
            conn.bind_queue(QUEUE_DELIVERY_DELIVERED, EXCHANGE_DELIVERIES, ROUTING_KEY_DELIVERED)
            consumer = MessageConsumer(conn)
            consumer.consume(QUEUE_DELIVERY_DELIVERED, _handle_message)
        except Exception as e:
            logger.error("Delivery delivered consumer failed", extra={"error": str(e)})

    t = threading.Thread(target=run, daemon=True)
    t.start()
    logger.info("Delivery delivered consumer thread started")
