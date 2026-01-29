"""Stripe webhooks: mark order paid when payment_intent.succeeded."""

from fastapi import APIRouter, Request, HTTPException, status
import stripe

from shared.logging import get_logger

from app.config import settings
from app.services.payment_service import mark_order_paid_by_payment_intent_id

logger = get_logger("orders.webhooks")

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def stripe_webhook(request: Request):
    """Stripe sends payment_intent.succeeded; we mark the order as paid."""
    if not settings.stripe_secret_key or not settings.stripe_webhook_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Webhook not configured")
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")
    except stripe.SignatureVerificationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")

    if event["type"] == "payment_intent.succeeded":
        pi = event["data"]["object"]
        pid = pi.get("id")
        if pid:
            updated = mark_order_paid_by_payment_intent_id(pid)
            logger.info("Order marked paid from webhook", extra={"payment_intent_id": pid, "updated": updated})

    return {"received": True}
