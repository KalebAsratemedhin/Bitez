from uuid import UUID
from typing import List, Optional

from shared.database import get_database
from shared.logging import get_logger
from shared.exceptions import NotFoundError

from app.models.restaurant_review import RestaurantReview
from app.schemas.review import ReviewCreate, ReviewResponse

logger = get_logger("reviews.service")


class ReviewService:
    def __init__(self):
        self.db = get_database()

    def create(self, user_id: UUID, data: ReviewCreate) -> ReviewResponse:
        with self.db.get_session() as session:
            r = RestaurantReview(
                restaurant_id=data.restaurant_id,
                user_id=user_id,
                order_id=data.order_id,
                rating=data.rating,
                comment=data.comment,
            )
            session.add(r)
            session.commit()
            session.refresh(r)
            logger.info("Review created", extra={"review_id": str(r.id), "restaurant_id": str(data.restaurant_id)})
            return ReviewResponse.model_validate(r)

    def get_by_id(self, review_id: UUID) -> Optional[ReviewResponse]:
        with self.db.get_session() as session:
            r = session.query(RestaurantReview).filter(RestaurantReview.id == review_id).first()
            return ReviewResponse.model_validate(r) if r else None

    def list_by_restaurant(self, restaurant_id: UUID, limit: int = 50, offset: int = 0) -> tuple[List[ReviewResponse], int]:
        with self.db.get_session() as session:
            q = session.query(RestaurantReview).filter(RestaurantReview.restaurant_id == restaurant_id)
            total = q.count()
            rows = q.order_by(RestaurantReview.created_at.desc()).offset(offset).limit(limit).all()
            return [ReviewResponse.model_validate(x) for x in rows], total

    def list_my_reviews(self, user_id: UUID, limit: int = 50, offset: int = 0) -> tuple[List[ReviewResponse], int]:
        with self.db.get_session() as session:
            q = session.query(RestaurantReview).filter(RestaurantReview.user_id == user_id)
            total = q.count()
            rows = q.order_by(RestaurantReview.created_at.desc()).offset(offset).limit(limit).all()
            return [ReviewResponse.model_validate(x) for x in rows], total
