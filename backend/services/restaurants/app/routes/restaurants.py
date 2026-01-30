from typing import Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends, Query
import stripe
from shared.logging import get_logger
from shared.exceptions import NotFoundError, DatabaseError

from app.config import settings
from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate, RestaurantResponse
from app.schemas.stripe_connect import StripeConnectLinkRequest, StripeConnectLinkResponse
from app.services.restaurant_service import RestaurantService
from app.dependencies import get_current_user_id, require_restaurant_owner
from app.events import publish_restaurant_created, publish_restaurant_updated, publish_restaurant_deleted

logger = get_logger("restaurants.routes")

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.post("", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED)
def create_restaurant(
    data: RestaurantCreate,
    owner_id: UUID = Depends(require_restaurant_owner),
    service: RestaurantService = Depends(lambda: RestaurantService()),
):
    try:
        out = service.create(owner_id, data)
        publish_restaurant_created(out.owner_id, out.id, out.name, out.location, out.rating)
        return out
    except DatabaseError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)


@router.get("", response_model=list[RestaurantResponse])
def list_restaurants(
    search: Optional[str] = Query(None, description="Filter by restaurant name or location"),
    rating_min: Optional[float] = Query(None, ge=0, le=5, description="Minimum rating (0–5)"),
    service: RestaurantService = Depends(lambda: RestaurantService()),
):
    return service.list_all(search=search, rating_min=rating_min)


@router.get("/my", response_model=list[RestaurantResponse])
def list_my_restaurants(
    owner_id: UUID = Depends(require_restaurant_owner),
    service: RestaurantService = Depends(lambda: RestaurantService()),
):
    return service.get_by_owner(owner_id)


@router.get("/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant(
    restaurant_id: UUID,
    service: RestaurantService = Depends(lambda: RestaurantService()),
):
    restaurant = service.get_by_id(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    return restaurant


@router.put("/{restaurant_id}", response_model=RestaurantResponse)
def update_restaurant(
    restaurant_id: UUID,
    data: RestaurantUpdate,
    owner_id: UUID = Depends(require_restaurant_owner),
    service: RestaurantService = Depends(lambda: RestaurantService()),
):
    try:
        out = service.update(restaurant_id, owner_id, data)
        publish_restaurant_updated(out.owner_id, out.id, out.name, out.location, out.rating)
        return out
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except DatabaseError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)


@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_restaurant(
    restaurant_id: UUID,
    owner_id: UUID = Depends(require_restaurant_owner),
    service: RestaurantService = Depends(lambda: RestaurantService()),
):
    try:
        service.delete(restaurant_id, owner_id)
        publish_restaurant_deleted(restaurant_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except DatabaseError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)


@router.post("/{restaurant_id}/connect-stripe", response_model=StripeConnectLinkResponse)
def connect_stripe(
    restaurant_id: UUID,
    data: StripeConnectLinkRequest,
    owner_id: UUID = Depends(require_restaurant_owner),
    service: RestaurantService = Depends(lambda: RestaurantService()),
):
    """Create or refresh Stripe Connect Express onboarding link. Money from orders goes to the restaurant's Stripe account."""
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe is not configured")
    try:
        restaurant = service.get_restaurant_for_stripe(restaurant_id, owner_id)
        if not restaurant:
            raise NotFoundError("Restaurant not found")
        stripe.api_key = settings.stripe_secret_key
        account_id = restaurant.get("stripe_account_id")
        if not account_id:
            account = stripe.Account.create(type="express")
            account_id = account.id
            service.set_stripe_account_id(restaurant_id, owner_id, account_id)
        link = stripe.AccountLink.create(
            account=account_id,
            refresh_url=data.refresh_url,
            return_url=data.return_url,
            type="account_onboarding",
        )
        return StripeConnectLinkResponse(url=link.url)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except stripe.StripeError as e:
        logger.warning("Stripe error", extra={"error": str(e)})
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Stripe error")
    except DatabaseError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)
