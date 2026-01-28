from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from shared.logging import get_logger
from shared.exceptions import NotFoundError, DatabaseError

from app.schemas.menu import MenuCreate, MenuUpdate, MenuResponse
from app.services.menu_service import MenuService
from app.dependencies import require_restaurant_owner

logger = get_logger("restaurants.menus")

router = APIRouter(prefix="/restaurants/{restaurant_id}/menus", tags=["menus"])


@router.post("", response_model=MenuResponse, status_code=status.HTTP_201_CREATED)
def create_menu(
    restaurant_id: UUID,
    data: MenuCreate,
    owner_id: UUID = Depends(require_restaurant_owner),
    service: MenuService = Depends(lambda: MenuService()),
):
    try:
        return service.create(restaurant_id, owner_id, data)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except DatabaseError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)


@router.get("", response_model=list[MenuResponse])
def list_menus(
    restaurant_id: UUID,
    service: MenuService = Depends(lambda: MenuService()),
):
    return service.list_by_restaurant(restaurant_id)


@router.get("/{menu_id}", response_model=MenuResponse)
def get_menu(
    restaurant_id: UUID,
    menu_id: UUID,
    service: MenuService = Depends(lambda: MenuService()),
):
    menu = service.get_by_id(menu_id)
    if not menu or menu.restaurant_id != restaurant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    return menu


@router.put("/{menu_id}", response_model=MenuResponse)
def update_menu(
    restaurant_id: UUID,
    menu_id: UUID,
    data: MenuUpdate,
    owner_id: UUID = Depends(require_restaurant_owner),
    service: MenuService = Depends(lambda: MenuService()),
):
    try:
        return service.update(menu_id, owner_id, data)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except DatabaseError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)


@router.delete("/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu(
    restaurant_id: UUID,
    menu_id: UUID,
    owner_id: UUID = Depends(require_restaurant_owner),
    service: MenuService = Depends(lambda: MenuService()),
):
    try:
        service.delete(menu_id, owner_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except DatabaseError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)
