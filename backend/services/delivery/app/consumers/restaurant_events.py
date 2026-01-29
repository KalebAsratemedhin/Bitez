import threading
from uuid import UUID
from shared.logging import get_logger
from shared.messaging import get_rabbitmq, MessageConsumer
from app.services.ownership_service import OwnershipService

logger = get_logger("delivery.restaurant_consumer")

EXCHANGE_RESTAURANTS = "bitez.restaurants"
QUEUE_RESTAURANT_OWNERSHIP = "delivery.restaurant_ownership"
ROUTING_KEY_ALL = "restaurant.#"


def _handle_message(msg: dict, channel) -> None:
    event = msg.get("event")
    if not event:
        return
    svc = OwnershipService()
    if event == "restaurant.created" or event == "restaurant.updated":
        owner_id = msg.get("owner_id")
        restaurant_id = msg.get("restaurant_id")
        if owner_id and restaurant_id:
            svc.upsert(UUID(owner_id), UUID(restaurant_id))
    elif event == "restaurant.deleted":
        restaurant_id = msg.get("restaurant_id")
        if restaurant_id:
            svc.remove_by_restaurant(UUID(restaurant_id))


def start_restaurant_consumer() -> None:
    def run():
        try:
            conn = get_rabbitmq()
            conn.declare_exchange(EXCHANGE_RESTAURANTS, exchange_type="topic")
            conn.declare_queue(QUEUE_RESTAURANT_OWNERSHIP)
            conn.bind_queue(QUEUE_RESTAURANT_OWNERSHIP, EXCHANGE_RESTAURANTS, ROUTING_KEY_ALL)
            consumer = MessageConsumer(conn)
            consumer.consume(QUEUE_RESTAURANT_OWNERSHIP, _handle_message)
        except Exception as e:
            logger.error("Restaurant events consumer failed", extra={"error": str(e)})

    t = threading.Thread(target=run, daemon=True)
    t.start()
    logger.info("Restaurant events consumer thread started")
