from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status

from shared.logging import get_logger
from shared.exceptions import NotFoundError

from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse
from app.schemas.payment import OrderPayRequest, OrderPayResponse
from app.services.order_service import OrderService, OrderServiceError
from app.services.ownership_service import OwnershipService
from app.services.payment_service import (
    create_payment_intent_for_order,
    confirm_payment_with_method,
)
from app.dependencies import get_current_user_id, require_restaurant_owner, get_order_service, get_ownership_service
from app.events import publish_order_ready_for_delivery
from app.models.order import OrderStatus

logger = get_logger("orders.routes")

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    data: OrderCreate,
    customer_id: UUID = Depends(get_current_user_id),
    service: OrderService = Depends(get_order_service),
):
    try:
        return service.create(customer_id, data)
    except Exception as e:
        logger.warning("Order create failed", extra={"error": str(e)})
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/my", response_model=list[OrderResponse])
def list_my_orders(
    customer_id: UUID = Depends(get_current_user_id),
    service: OrderService = Depends(get_order_service),
):
    return service.list_by_customer(customer_id)


@router.get("/my-restaurant-orders", response_model=list[OrderResponse])
def list_my_restaurant_orders(
    owner_id: UUID = Depends(require_restaurant_owner),
    order_service: OrderService = Depends(get_order_service),
    ownership_service: OwnershipService = Depends(get_ownership_service),
):
    restaurant_ids = ownership_service.get_restaurant_ids_by_owner(owner_id)
    return order_service.list_by_restaurant_ids(restaurant_ids)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: OrderService = Depends(get_order_service),
    ownership_service: OwnershipService = Depends(get_ownership_service),
):
    order = service.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.customer_id != user_id:
        my_restaurant_ids = ownership_service.get_restaurant_ids_by_owner(user_id)
        if order.restaurant_id not in my_restaurant_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this order")
    return order


@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: UUID,
    customer_id: UUID = Depends(get_current_user_id),
    service: OrderService = Depends(get_order_service),
):
    try:
        return service.cancel_by_customer(order_id, customer_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except OrderServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.warning("Order cancel failed", extra={"error": str(e)})
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{order_id}/pay", response_model=OrderPayResponse)
def pay_order(
    order_id: UUID,
    data: OrderPayRequest,
    customer_id: UUID = Depends(get_current_user_id),
    service: OrderService = Depends(get_order_service),
):
    """Create or confirm payment. Money goes to the restaurant's Stripe Connect account. Returns client_secret for Stripe Elements."""
    try:
        if data.payment_method_id:
            confirm_payment_with_method(order_id, customer_id, data.payment_method_id)
            order = service.get_by_id(order_id)
            return OrderPayResponse(
                client_secret="",
                payment_intent_id=order.stripe_payment_intent_id or "",
            )
        client_secret, payment_intent_id = create_payment_intent_for_order(order_id, customer_id)
        return OrderPayResponse(client_secret=client_secret, payment_intent_id=payment_intent_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.warning("Payment failed", extra={"order_id": str(order_id), "error": str(e)})
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/{order_id}", response_model=OrderResponse)
def update_order_status(
    order_id: UUID,
    data: OrderUpdate,
    owner_id: UUID = Depends(require_restaurant_owner),
    order_service: OrderService = Depends(get_order_service),
    ownership_service: OwnershipService = Depends(get_ownership_service),
):
    order = order_service.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.restaurant_id not in ownership_service.get_restaurant_ids_by_owner(owner_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this order")
    try:
        out = order_service.update_status(order_id, data)
        if data.status == OrderStatus.READY:
            publish_order_ready_for_delivery(out.restaurant_id, out.customer_id, out.id, out.delivery_address)
        return out
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except Exception as e:
        logger.warning("Order update failed", extra={"error": str(e)})
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
