from typing import Optional, List
from uuid import UUID
from sqlalchemy.exc import IntegrityError

from shared.database import get_database
from shared.logging import get_logger
from shared.exceptions import NotFoundError, DatabaseError

from app.models.restaurant import Restaurant
from app.models.menu import Menu
from app.models.menu_item import MenuItem
from app.schemas.menu_item import MenuItemCreate, MenuItemUpdate, MenuItemResponse

logger = get_logger("restaurants.menu_item_service")


class MenuItemService:
    def __init__(self):
        self.db = get_database()

    def create(self, menu_id: UUID, owner_id: UUID, data: MenuItemCreate) -> MenuItemResponse:
        with self.db.get_session() as session:
            menu = session.query(Menu).join(Restaurant).filter(
                Menu.id == menu_id,
                Restaurant.owner_id == owner_id,
            ).first()
            if not menu:
                raise NotFoundError("Menu not found")
            item = MenuItem(menu_id=menu_id, name=data.name, description=data.description, price=data.price)
            try:
                session.add(item)
                session.commit()
                logger.info("MenuItem created", extra={"item_id": str(item.id), "menu_id": str(menu_id)})
                return MenuItemResponse.model_validate(item)
            except IntegrityError as e:
                session.rollback()
                raise DatabaseError("Failed to create menu item", details={"error": str(e)})
            except Exception as e:
                session.rollback()
                logger.error("MenuItem creation failed", extra={"error": str(e)})
                raise DatabaseError("Failed to create menu item", details={"error": str(e)})

    def create_many(self, menu_id: UUID, owner_id: UUID, items: list[MenuItemCreate]) -> list[MenuItemResponse]:
        with self.db.get_session() as session:
            menu = session.query(Menu).join(Restaurant).filter(
                Menu.id == menu_id,
                Restaurant.owner_id == owner_id,
            ).first()
            if not menu:
                raise NotFoundError("Menu not found")
            created = []
            try:
                for data in items:
                    item = MenuItem(menu_id=menu_id, name=data.name, description=data.description, price=data.price)
                    session.add(item)
                    session.flush()
                    created.append(MenuItemResponse.model_validate(item))
                session.commit()
                logger.info("MenuItems bulk created", extra={"menu_id": str(menu_id), "count": len(created)})
                return created
            except IntegrityError as e:
                session.rollback()
                raise DatabaseError("Failed to create menu items", details={"error": str(e)})
            except Exception as e:
                session.rollback()
                logger.error("MenuItems bulk create failed", extra={"error": str(e)})
                raise DatabaseError("Failed to create menu items", details={"error": str(e)})

    def get_by_id(self, item_id: UUID) -> Optional[MenuItemResponse]:
        with self.db.get_session() as session:
            item = session.query(MenuItem).filter(MenuItem.id == item_id).first()
            if not item:
                return None
            return MenuItemResponse.model_validate(item)

    def list_by_menu(self, menu_id: UUID) -> List[MenuItemResponse]:
        with self.db.get_session() as session:
            items = session.query(MenuItem).filter(MenuItem.menu_id == menu_id).all()
            return [MenuItemResponse.model_validate(i) for i in items]

    def update(self, item_id: UUID, owner_id: UUID, data: MenuItemUpdate) -> MenuItemResponse:
        with self.db.get_session() as session:
            item = session.query(MenuItem).join(Menu).join(Restaurant).filter(
                MenuItem.id == item_id,
                Restaurant.owner_id == owner_id,
            ).first()
            if not item:
                raise NotFoundError("Menu item not found")
            update_data = data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(item, field, value)
            session.commit()
            logger.info("MenuItem updated", extra={"item_id": str(item_id)})
            return MenuItemResponse.model_validate(item)

    def delete(self, item_id: UUID, owner_id: UUID) -> None:
        with self.db.get_session() as session:
            item = session.query(MenuItem).join(Menu).join(Restaurant).filter(
                MenuItem.id == item_id,
                Restaurant.owner_id == owner_id,
            ).first()
            if not item:
                raise NotFoundError("Menu item not found")
            session.delete(item)
            session.commit()
            logger.info("MenuItem deleted", extra={"item_id": str(item_id)})
