from uuid import UUID
from typing import List, Optional

from shared.database import get_database
from shared.logging import get_logger
from shared.exceptions import NotFoundError, DatabaseError

from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse, OrderItemResponse


class OrderServiceError(Exception):
    pass

logger = get_logger("orders.order_service")


class OrderService:
    def __init__(self):
        self.db = get_database()

    def create(self, customer_id: UUID, data: OrderCreate) -> OrderResponse:
        with self.db.get_session() as session:
            order = Order(
                customer_id=customer_id,
                restaurant_id=data.restaurant_id,
                delivery_address=data.delivery_address,
                status=OrderStatus.PENDING,
            )
            session.add(order)
            session.flush()
            for it in data.items:
                session.add(
                    OrderItem(
                        order_id=order.id,
                        menu_item_id=it.menu_item_id,
                        item_name=it.item_name,
                        unit_price=it.unit_price,
                        quantity=it.quantity,
                    )
                )
            session.refresh(order)
            logger.info("Order created", extra={"order_id": str(order.id), "customer_id": str(customer_id)})
            return self._to_response(order)

    def get_by_id(self, order_id: UUID) -> Optional[OrderResponse]:
        with self.db.get_session() as session:
            order = session.query(Order).filter(Order.id == order_id).first()
            if not order:
                return None
            return self._to_response(order)

    def list_by_customer(self, customer_id: UUID) -> List[OrderResponse]:
        with self.db.get_session() as session:
            orders = session.query(Order).filter(Order.customer_id == customer_id).order_by(Order.created_at.desc()).all()
            return [self._to_response(o) for o in orders]

    def list_by_restaurant_ids(self, restaurant_ids: List[UUID]) -> List[OrderResponse]:
        if not restaurant_ids:
            return []
        with self.db.get_session() as session:
            orders = session.query(Order).filter(Order.restaurant_id.in_(restaurant_ids)).order_by(Order.created_at.desc()).all()
            return [self._to_response(o) for o in orders]

    def update_status(self, order_id: UUID, data: OrderUpdate) -> OrderResponse:
        with self.db.get_session() as session:
            order = session.query(Order).filter(Order.id == order_id).first()
            if not order:
                raise NotFoundError("Order not found")
            order.status = data.status
            session.commit()
            session.refresh(order)
            logger.info("Order status updated", extra={"order_id": str(order_id), "status": data.status.value})
            return self._to_response(order)

    def cancel_by_customer(self, order_id: UUID, customer_id: UUID) -> OrderResponse:
        with self.db.get_session() as session:
            order = session.query(Order).filter(Order.id == order_id).first()
            if not order:
                raise NotFoundError("Order not found")
            if order.customer_id != customer_id:
                raise NotFoundError("Order not found")
            if order.status != OrderStatus.PENDING:
                raise OrderServiceError("Only pending orders can be cancelled")
            order.status = OrderStatus.CANCELLED
            session.commit()
            session.refresh(order)
            logger.info("Order cancelled by customer", extra={"order_id": str(order_id)})
            return self._to_response(order)

    def _to_response(self, order: Order) -> OrderResponse:
        items = [OrderItemResponse.model_validate(i) for i in order.items]
        return OrderResponse(
            id=order.id,
            customer_id=order.customer_id,
            restaurant_id=order.restaurant_id,
            delivery_address=order.delivery_address,
            status=order.status,
            created_at=order.created_at,
            updated_at=order.updated_at,
            items=items,
        )
