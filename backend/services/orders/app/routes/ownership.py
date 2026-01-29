from uuid import UUID
from fastapi import APIRouter, Depends
from app.dependencies import get_ownership_service, require_restaurant_owner
from app.services.ownership_service import OwnershipService

router = APIRouter(tags=["ownership"])


@router.get("/my-restaurants")
def list_my_restaurant_ids(
    owner_id: UUID = Depends(require_restaurant_owner),
    service: OwnershipService = Depends(get_ownership_service),
):
    ids = service.get_restaurant_ids_by_owner(owner_id)
    return {"restaurant_ids": [str(i) for i in ids]}
