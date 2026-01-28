from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from shared.logging import get_logger
from shared.exceptions import NotFoundError, DatabaseError

from app.schemas.menu_item import MenuItemCreate, MenuItemUpdate, MenuItemResponse, MenuItemsBulkCreate
from app.services.menu_item_service import MenuItemService
from app.services.menu_service import MenuService
from app.dependencies import require_restaurant_owner

logger = get_logger("restaurants.menu_items")

router = APIRouter(prefix="/restaurants/{restaurant_id}/menus/{menu_id}/items", tags=["menu_items"])


@router.post("", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
def create_menu_item(
    restaurant_id: UUID,
    menu_id: UUID,
    data: MenuItemCreate,
    owner_id: UUID = Depends(require_restaurant_owner),
    item_service: MenuItemService = Depends(lambda: MenuItemService()),
    menu_service: MenuService = Depends(lambda: MenuService()),
):
    menu = menu_service.get_by_id(menu_id)
    if not menu or menu.restaurant_id != restaurant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    try:
        return item_service.create(menu_id, owner_id, data)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except DatabaseError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.post("/bulk", response_model=list[MenuItemResponse], status_code=status.HTTP_201_CREATED)
def create_menu_items_bulk(
    restaurant_id: UUID,
    menu_id: UUID,
    data: MenuItemsBulkCreate,
    owner_id: UUID = Depends(require_restaurant_owner),
    item_service: MenuItemService = Depends(lambda: MenuItemService()),
    menu_service: MenuService = Depends(lambda: MenuService()),
):
    menu = menu_service.get_by_id(menu_id)
    if not menu or menu.restaurant_id != restaurant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    try:
        return item_service.create_many(menu_id, owner_id, data.items)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except DatabaseError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("", response_model=list[MenuItemResponse])
def list_menu_items(
    restaurant_id: UUID,
    menu_id: UUID,
    item_service: MenuItemService = Depends(lambda: MenuItemService()),
    menu_service: MenuService = Depends(lambda: MenuService()),
):
    menu = menu_service.get_by_id(menu_id)
    if not menu or menu.restaurant_id != restaurant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    return item_service.list_by_menu(menu_id)


@router.get("/{item_id}", response_model=MenuItemResponse)
def get_menu_item(
    restaurant_id: UUID,
    menu_id: UUID,
    item_id: UUID,
    item_service: MenuItemService = Depends(lambda: MenuItemService()),
    menu_service: MenuService = Depends(lambda: MenuService()),
):
    menu = menu_service.get_by_id(menu_id)
    if not menu or menu.restaurant_id != restaurant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    item = item_service.get_by_id(item_id)
    if not item or item.menu_id != menu_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    return item


@router.put("/{item_id}", response_model=MenuItemResponse)
def update_menu_item(
    restaurant_id: UUID,
    menu_id: UUID,
    item_id: UUID,
    data: MenuItemUpdate,
    owner_id: UUID = Depends(require_restaurant_owner),
    item_service: MenuItemService = Depends(lambda: MenuItemService()),
    menu_service: MenuService = Depends(lambda: MenuService()),
):
    menu = menu_service.get_by_id(menu_id)
    if not menu or menu.restaurant_id != restaurant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    try:
        return item_service.update(item_id, owner_id, data)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except DatabaseError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(
    restaurant_id: UUID,
    menu_id: UUID,
    item_id: UUID,
    owner_id: UUID = Depends(require_restaurant_owner),
    item_service: MenuItemService = Depends(lambda: MenuItemService()),
    menu_service: MenuService = Depends(lambda: MenuService()),
):
    menu = menu_service.get_by_id(menu_id)
    if not menu or menu.restaurant_id != restaurant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    try:
        item_service.delete(item_id, owner_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except DatabaseError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)
