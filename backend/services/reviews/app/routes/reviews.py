from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.schemas.review import ReviewCreate, ReviewResponse, ReviewListResponse
from app.services.review_service import ReviewService
from app.dependencies import get_current_user_id, get_review_service

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    data: ReviewCreate,
    user_id: UUID = Depends(get_current_user_id),
    service: ReviewService = Depends(get_review_service),
):
    return service.create(user_id, data)


@router.get("", response_model=ReviewListResponse)
def list_reviews_by_restaurant(
    restaurant_id: UUID = Query(...),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: ReviewService = Depends(get_review_service),
):
    items, total = service.list_by_restaurant(restaurant_id, limit=limit, offset=offset)
    return ReviewListResponse(items=items, total=total)


@router.get("/my", response_model=ReviewListResponse)
def list_my_reviews(
    user_id: UUID = Depends(get_current_user_id),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: ReviewService = Depends(get_review_service),
):
    items, total = service.list_my_reviews(user_id, limit=limit, offset=offset)
    return ReviewListResponse(items=items, total=total)


@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(
    review_id: UUID,
    service: ReviewService = Depends(get_review_service),
):
    r = service.get_by_id(review_id)
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return r
