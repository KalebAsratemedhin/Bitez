from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status

from shared.logging import get_logger
from shared.exceptions import NotFoundError

from app.schemas.delivery import DeliveryResponse, DeliveryAssign, DeliveryUpdate
from app.services.delivery_service import DeliveryService
from app.services.ownership_service import OwnershipService
from app.dependencies import get_current_user_id, require_restaurant_owner, require_delivery_person, get_delivery_service, get_ownership_service
from app.events import publish_delivery_assigned, publish_delivery_delivered
from app.models.delivery import DeliveryStatus

logger = get_logger("delivery.routes")

router = APIRouter(prefix="/deliveries", tags=["deliveries"])


def _to_response(d):
    return DeliveryResponse.model_validate(d)


@router.get("/my", response_model=list[DeliveryResponse])
def list_my_deliveries(
    delivery_person_id: UUID = Depends(require_delivery_person),
    service: DeliveryService = Depends(get_delivery_service),
):
    deliveries = service.list_by_delivery_person(delivery_person_id)
    return [_to_response(d) for d in deliveries]


@router.get("/pending", response_model=list[DeliveryResponse])
def list_pending_deliveries(
    owner_id: UUID = Depends(require_restaurant_owner),
    delivery_service: DeliveryService = Depends(get_delivery_service),
    ownership_service: OwnershipService = Depends(get_ownership_service),
):
    restaurant_ids = ownership_service.get_restaurant_ids_by_owner(owner_id)
    deliveries = delivery_service.list_pending_by_restaurant_ids(restaurant_ids)
    return [_to_response(d) for d in deliveries]


@router.get("/{delivery_id}", response_model=DeliveryResponse)
def get_delivery(
    delivery_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    delivery_service: DeliveryService = Depends(get_delivery_service),
    ownership_service: OwnershipService = Depends(get_ownership_service),
):
    d = delivery_service.get_by_id(delivery_id)
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    if d.delivery_person_id == user_id:
        return _to_response(d)
    if d.customer_id == user_id:
        return _to_response(d)
    restaurant_ids = ownership_service.get_restaurant_ids_by_owner(user_id)
    if d.restaurant_id in restaurant_ids:
        return _to_response(d)
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this delivery")


@router.patch("/{delivery_id}/assign", response_model=DeliveryResponse)
def assign_delivery(
    delivery_id: UUID,
    data: DeliveryAssign,
    owner_id: UUID = Depends(require_restaurant_owner),
    delivery_service: DeliveryService = Depends(get_delivery_service),
    ownership_service: OwnershipService = Depends(get_ownership_service),
):
    d = delivery_service.get_by_id(delivery_id)
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    if d.restaurant_id not in ownership_service.get_restaurant_ids_by_owner(owner_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to assign this delivery")
    try:
        out = delivery_service.assign(delivery_id, data.delivery_person_id)
        publish_delivery_assigned(out.order_id, out.delivery_person_id, out.customer_id)
        return _to_response(out)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{delivery_id}", response_model=DeliveryResponse)
def update_delivery_status(
    delivery_id: UUID,
    data: DeliveryUpdate,
    delivery_person_id: UUID = Depends(require_delivery_person),
    service: DeliveryService = Depends(get_delivery_service),
):
    d = service.get_by_id(delivery_id)
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    if d.delivery_person_id != delivery_person_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not assigned to this delivery")
    try:
        out = service.update_status(delivery_id, data.status, delivery_person_id)
        if data.status == DeliveryStatus.DELIVERED:
            publish_delivery_delivered(out.order_id, out.customer_id)
        return _to_response(out)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
