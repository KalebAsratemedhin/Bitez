from typing import Optional, List
from uuid import UUID
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from shared.database import get_database
from shared.logging import get_logger
from shared.exceptions import NotFoundError, DatabaseError

from app.models.restaurant import Restaurant
from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate, RestaurantResponse

logger = get_logger("restaurants.restaurant_service")


class RestaurantService:
    def __init__(self):
        self.db = get_database()

    def create(self, owner_id: UUID, data: RestaurantCreate) -> RestaurantResponse:
        restaurant = Restaurant(
            owner_id=owner_id,
            name=data.name,
            location=data.location,
            rating=data.rating,
        )
        with self.db.get_session() as session:
            try:
                session.add(restaurant)
                session.commit()
                logger.info("Restaurant created", extra={"restaurant_id": str(restaurant.id), "owner_id": str(owner_id)})
                return RestaurantResponse.model_validate(restaurant)
            except IntegrityError as e:
                session.rollback()
                raise DatabaseError("Failed to create restaurant", details={"error": str(e)})
            except Exception as e:
                session.rollback()
                logger.error("Restaurant creation failed", extra={"error": str(e)})
                raise DatabaseError("Failed to create restaurant", details={"error": str(e)})

    def get_by_id(self, restaurant_id: UUID) -> Optional[RestaurantResponse]:
        with self.db.get_session() as session:
            restaurant = session.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
            if not restaurant:
                return None
            return RestaurantResponse.model_validate(restaurant)

    def get_restaurant_for_stripe(self, restaurant_id: UUID, owner_id: UUID) -> Optional[dict]:
        """Return restaurant dict with stripe_account_id for Stripe Connect. None if not found or not owner."""
        with self.db.get_session() as session:
            r = session.query(Restaurant).filter(
                Restaurant.id == restaurant_id,
                Restaurant.owner_id == owner_id,
            ).first()
            if not r:
                return None
            return {"id": r.id, "stripe_account_id": r.stripe_account_id}

    def set_stripe_account_id(self, restaurant_id: UUID, owner_id: UUID, stripe_account_id: str) -> None:
        with self.db.get_session() as session:
            restaurant = session.query(Restaurant).filter(
                Restaurant.id == restaurant_id,
                Restaurant.owner_id == owner_id,
            ).first()
            if not restaurant:
                raise NotFoundError("Restaurant not found")
            restaurant.stripe_account_id = stripe_account_id
            session.commit()

    def get_by_owner(self, owner_id: UUID) -> List[RestaurantResponse]:
        with self.db.get_session() as session:
            restaurants = session.query(Restaurant).filter(Restaurant.owner_id == owner_id).all()
            return [RestaurantResponse.model_validate(r) for r in restaurants]

    def list_all(
        self,
        search: Optional[str] = None,
        rating_min: Optional[float] = None,
    ) -> List[RestaurantResponse]:
        with self.db.get_session() as session:
            q = session.query(Restaurant)
            if search and search.strip():
                term = f"%{search.strip()}%"
                q = q.filter(
                    or_(
                        Restaurant.name.ilike(term),
                        Restaurant.location.ilike(term),
                    )
                )
            if rating_min is not None:
                q = q.filter(Restaurant.rating >= rating_min)
            restaurants = q.all()
            return [RestaurantResponse.model_validate(r) for r in restaurants]

    def update(self, restaurant_id: UUID, owner_id: UUID, data: RestaurantUpdate) -> RestaurantResponse:
        with self.db.get_session() as session:
            restaurant = session.query(Restaurant).filter(
                Restaurant.id == restaurant_id,
                Restaurant.owner_id == owner_id,
            ).first()
            if not restaurant:
                raise NotFoundError("Restaurant not found")
            update_data = data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(restaurant, field, value)
            session.commit()
            logger.info("Restaurant updated", extra={"restaurant_id": str(restaurant_id)})
            return RestaurantResponse.model_validate(restaurant)

    def delete(self, restaurant_id: UUID, owner_id: UUID) -> None:
        with self.db.get_session() as session:
            restaurant = session.query(Restaurant).filter(
                Restaurant.id == restaurant_id,
                Restaurant.owner_id == owner_id,
            ).first()
            if not restaurant:
                raise NotFoundError("Restaurant not found")
            session.delete(restaurant)
            session.commit()
            logger.info("Restaurant deleted", extra={"restaurant_id": str(restaurant_id)})
