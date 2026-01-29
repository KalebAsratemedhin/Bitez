import threading
from uuid import UUID

from shared.logging import get_logger
from shared.messaging import get_rabbitmq, MessageConsumer

from app.services.notification_service import NotificationService

logger = get_logger("notifications.order_consumer")

EXCHANGE_ORDERS = "bitez.orders"
QUEUE = "notifications.order_events"
ROUTING_KEYS = ["order.created", "order.ready_for_delivery"]


def _handle_message(msg: dict, channel) -> None:
    event = msg.get("event")
    if event not in ("order.created", "order.ready_for_delivery"):
        return
    customer_id = msg.get("customer_id")
    if not customer_id:
        return
    try:
        svc = NotificationService()
        meta = {"event": event, "order_id": msg.get("order_id")}
        if event == "order.created":
            svc.create(UUID(customer_id), "order.created", "Order placed", "Your order has been placed.", meta)
        elif event == "order.ready_for_delivery":
            svc.create(UUID(customer_id), "order.ready_for_delivery", "Order ready", "Your order is ready for delivery.", meta)
    except Exception as e:
        logger.warning("Failed to create notification", extra={"event": event, "error": str(e)})


def start_order_consumer() -> None:
    def run():
        try:
            conn = get_rabbitmq()
            conn.declare_exchange(EXCHANGE_ORDERS, exchange_type="topic")
            conn.declare_queue(QUEUE)
            for rk in ROUTING_KEYS:
                conn.bind_queue(QUEUE, EXCHANGE_ORDERS, rk)
            consumer = MessageConsumer(conn)
            consumer.consume(QUEUE, _handle_message)
        except Exception as e:
            logger.error("Order events consumer failed", extra={"error": str(e)})

    t = threading.Thread(target=run, daemon=True)
    t.start()
    logger.info("Order events consumer started")
