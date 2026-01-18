from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import ReviewCreate, ReviewResponse
from app.services.services import ReviewService
from app.utils.auth import get_current_active_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.post("", response_model=dict)
async def create_review(
    review: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new review"""
    new_review = ReviewService.create_review(db, current_user.id, review)
    return {"message": "Review created successfully", "review_id": new_review.id}

@router.get("/products/{product_id}")
async def get_product_reviews(
    product_id: int,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get reviews for a product"""
    skip = (page - 1) * limit
    reviews, total = ReviewService.get_product_reviews(db, product_id, skip, limit)
    return {
        "reviews": reviews,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/my-reviews")
async def get_my_reviews(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's reviews"""
    skip = (page - 1) * limit
    reviews, total = ReviewService.get_user_reviews(db, current_user.id, skip, limit)
    return {
        "reviews": reviews,
        "total": total,
        "page": page,
        "limit": limit
    }
