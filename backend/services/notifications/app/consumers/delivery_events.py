import threading
from uuid import UUID

from shared.logging import get_logger
from shared.messaging import get_rabbitmq, MessageConsumer

from app.services.notification_service import NotificationService
from shared.messaging import RabbitMQConnection
from app.config import settings

logger = get_logger("notifications.delivery_consumer")

EXCHANGE_DELIVERIES = "bitez.deliveries"
QUEUE = "notifications.delivery_events"
ROUTING_KEYS = ["delivery.assigned", "delivery.delivered"]


def _handle_message(msg: dict, channel) -> None:
    event = msg.get("event")
    if event not in ("delivery.assigned", "delivery.delivered"):
        return
    try:
        svc = NotificationService()
        if event == "delivery.assigned":
            customer_id = msg.get("customer_id")
            delivery_person_id = msg.get("delivery_person_id")
            meta = {"event": event, "order_id": msg.get("order_id")}
            if customer_id:
                svc.create(UUID(customer_id), "delivery.assigned", "Delivery assigned", "A delivery person has been assigned to your order.", meta)
            if delivery_person_id:
                svc.create(UUID(delivery_person_id), "delivery.assigned", "New delivery", "You have been assigned a new delivery.", meta)
        elif event == "delivery.delivered":
            customer_id = msg.get("customer_id")
            if customer_id:
                meta = {"event": event, "order_id": msg.get("order_id")}
                svc.create(UUID(customer_id), "delivery.delivered", "Order delivered", "Your order has been delivered.", meta)
    except Exception as e:
        logger.warning("Failed to create notification", extra={"event": event, "error": str(e)})


def start_delivery_consumer() -> None:
    def run():
        try:
            conn = RabbitMQConnection(
                host=settings.rabbitmq_host,
                port=settings.rabbitmq_port,
                username=settings.rabbitmq_user,
                password=settings.rabbitmq_password,
                virtual_host=settings.rabbitmq_vhost,
            )
            conn.connect(retries=10, retry_delay=3.0)
        
            conn.declare_exchange(EXCHANGE_DELIVERIES, exchange_type="topic")
            conn.declare_queue(QUEUE)
            for rk in ROUTING_KEYS:
                conn.bind_queue(QUEUE, EXCHANGE_DELIVERIES, rk)
            consumer = MessageConsumer(conn)
            consumer.consume(QUEUE, _handle_message)
        except Exception as e:
            logger.error("Delivery events consumer failed", extra={"error": str(e)})

    t = threading.Thread(target=run, daemon=True)
    t.start()
    logger.info("Delivery events consumer started")
