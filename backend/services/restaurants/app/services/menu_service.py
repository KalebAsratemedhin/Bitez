from typing import Optional, List
from uuid import UUID
from sqlalchemy.exc import IntegrityError

from shared.database import get_database
from shared.logging import get_logger
from shared.exceptions import NotFoundError, DatabaseError

from app.models.restaurant import Restaurant
from app.models.menu import Menu
from app.schemas.menu import MenuCreate, MenuUpdate, MenuResponse

logger = get_logger("restaurants.menu_service")


class MenuService:
    def __init__(self):
        self.db = get_database()

    def create(self, restaurant_id: UUID, owner_id: UUID, data: MenuCreate) -> MenuResponse:
        with self.db.get_session() as session:
            restaurant = session.query(Restaurant).filter(
                Restaurant.id == restaurant_id,
                Restaurant.owner_id == owner_id,
            ).first()
            if not restaurant:
                raise NotFoundError("Restaurant not found")
            menu = Menu(restaurant_id=restaurant_id, kind=data.kind)
            try:
                session.add(menu)
                session.commit()
                logger.info("Menu created", extra={"menu_id": str(menu.id), "restaurant_id": str(restaurant_id)})
                return MenuResponse.model_validate(menu)
            except IntegrityError as e:
                session.rollback()
                raise DatabaseError("Failed to create menu", details={"error": str(e)})
            except Exception as e:
                session.rollback()
                logger.error("Menu creation failed", extra={"error": str(e)})
                raise DatabaseError("Failed to create menu", details={"error": str(e)})

    def get_by_id(self, menu_id: UUID) -> Optional[MenuResponse]:
        with self.db.get_session() as session:
            menu = session.query(Menu).filter(Menu.id == menu_id).first()
            if not menu:
                return None
            return MenuResponse.model_validate(menu)

    def list_by_restaurant(self, restaurant_id: UUID) -> List[MenuResponse]:
        with self.db.get_session() as session:
            menus = session.query(Menu).filter(Menu.restaurant_id == restaurant_id).all()
            return [MenuResponse.model_validate(m) for m in menus]

    def update(self, menu_id: UUID, owner_id: UUID, data: MenuUpdate) -> MenuResponse:
        with self.db.get_session() as session:
            menu = session.query(Menu).join(Restaurant).filter(
                Menu.id == menu_id,
                Restaurant.owner_id == owner_id,
            ).first()
            if not menu:
                raise NotFoundError("Menu not found")
            update_data = data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(menu, field, value)
            session.commit()
            logger.info("Menu updated", extra={"menu_id": str(menu_id)})
            return MenuResponse.model_validate(menu)

    def delete(self, menu_id: UUID, owner_id: UUID) -> None:
        with self.db.get_session() as session:
            menu = session.query(Menu).join(Restaurant).filter(
                Menu.id == menu_id,
                Restaurant.owner_id == owner_id,
            ).first()
            if not menu:
                raise NotFoundError("Menu not found")
            session.delete(menu)
            session.commit()
            logger.info("Menu deleted", extra={"menu_id": str(menu_id)})
