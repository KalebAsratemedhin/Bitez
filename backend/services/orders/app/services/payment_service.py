"""Stripe Connect payment: charge goes to restaurant's connected account."""

from decimal import Decimal
from uuid import UUID
from typing import Optional, Tuple

import httpx
import stripe

from shared.database import get_database
from shared.logging import get_logger

from app.config import settings
from app.models.order import Order, PaymentStatus

logger = get_logger("orders.payment_service")


def get_restaurant_stripe_account(restaurant_id: UUID) -> Optional[str]:
    """Fetch restaurant's Stripe Connect account id from Restaurants service (internal call)."""
    base = settings.restaurants_service_url.rstrip("/")
    url = f"{base}/restaurants/{restaurant_id}"
    try:
        with httpx.Client(timeout=10.0) as client:
            r = client.get(url)
            if r.status_code != 200:
                return None
            data = r.json()
            return data.get("stripe_account_id")
    except Exception as e:
        logger.warning("Failed to get restaurant stripe account", extra={"restaurant_id": str(restaurant_id), "error": str(e)})
        return None


def order_total_cents(order: Order) -> int:
    total = sum(
        (Decimal(str(item.unit_price)) * item.quantity for item in order.items),
        Decimal("0"),
    )
    return int(round(total * 100))


def create_payment_intent_for_order(order_id: UUID, customer_id: UUID) -> Tuple[str, str]:
    """
    Create Stripe PaymentIntent with destination to restaurant's Stripe account.
    Returns (client_secret, payment_intent_id). Raises ValueError on failure.
    """
    if not settings.stripe_secret_key:
        raise ValueError("Stripe is not configured")

    db = get_database()
    with db.get_session() as session:
        order = session.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValueError("Order not found")
        if order.customer_id != customer_id:
            raise ValueError("Order not found")

        stripe_account_id = get_restaurant_stripe_account(order.restaurant_id)
        if not stripe_account_id:
            raise ValueError("Restaurant has not connected Stripe")
        if order.payment_status == PaymentStatus.PAID:
            raise ValueError("Order is already paid")
        if order.stripe_payment_intent_id:
            # Reuse existing PaymentIntent
            stripe.api_key = settings.stripe_secret_key
            pi = stripe.PaymentIntent.retrieve(order.stripe_payment_intent_id)
            if pi.status == "succeeded":
                order.payment_status = PaymentStatus.PAID
                session.commit()
                raise ValueError("Order is already paid")
            return (pi.client_secret, pi.id)

        amount_cents = order_total_cents(order)
        if amount_cents < 50:
            raise ValueError("Order total must be at least $0.50")

        stripe.api_key = settings.stripe_secret_key
        pi = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            transfer_data={"destination": stripe_account_id},
            metadata={"order_id": str(order_id)},
        )
        order.stripe_payment_intent_id = pi.id
        session.commit()
        return (pi.client_secret, pi.id)


def confirm_payment_with_method(order_id: UUID, customer_id: UUID, payment_method_id: str) -> None:
    """Confirm PaymentIntent with payment_method and mark order paid on success."""
    if not settings.stripe_secret_key:
        raise ValueError("Stripe is not configured")
    db = get_database()
    with db.get_session() as session:
        order = session.query(Order).filter(Order.id == order_id).first()
        if not order or order.customer_id != customer_id:
            raise ValueError("Order not found")
        if order.payment_status == PaymentStatus.PAID:
            raise ValueError("Order is already paid")
        if not order.stripe_payment_intent_id:
            raise ValueError("Create payment first")

        stripe.api_key = settings.stripe_secret_key
        stripe.PaymentIntent.modify(
            order.stripe_payment_intent_id,
            payment_method=payment_method_id,
        )
        pi = stripe.PaymentIntent.confirm(order.stripe_payment_intent_id)
        if pi.status == "succeeded":
            order.payment_status = PaymentStatus.PAID
            session.commit()


def mark_order_paid_by_payment_intent_id(payment_intent_id: str) -> bool:
    """Mark order as paid by Stripe payment_intent_id (for webhook). Returns True if updated."""
    db = get_database()
    with db.get_session() as session:
        order = session.query(Order).filter(Order.stripe_payment_intent_id == payment_intent_id).first()
        if not order:
            return False
        if order.payment_status == PaymentStatus.PAID:
            return True
        order.payment_status = PaymentStatus.PAID
        session.commit()
        return True
