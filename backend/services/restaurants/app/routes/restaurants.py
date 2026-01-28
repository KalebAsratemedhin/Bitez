from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from shared.logging import get_logger
from shared.exceptions import NotFoundError, DatabaseError

from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate, RestaurantResponse
from app.services.restaurant_service import RestaurantService
from app.dependencies import get_current_user_id, require_restaurant_owner

logger = get_logger("restaurants.routes")

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.post("", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED)
def create_restaurant(
    data: RestaurantCreate,
    owner_id: UUID = Depends(require_restaurant_owner),
    service: RestaurantService = Depends(lambda: RestaurantService()),
):
    try:
        return service.create(owner_id, data)
    except DatabaseError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)


@router.get("", response_model=list[RestaurantResponse])
def list_restaurants(
    service: RestaurantService = Depends(lambda: RestaurantService()),
):
    return service.list_all()


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
        return service.update(restaurant_id, owner_id, data)
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
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except DatabaseError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)
