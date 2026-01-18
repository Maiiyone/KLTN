from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import ProductResponse
from app.services.services import ProductService

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=list[ProductResponse])
async def get_products(
    page: int = 1,
    limit: int = 20,
    search: str = None,
    db: Session = Depends(get_db)
):
    """Get products with pagination and search"""
    skip = (page - 1) * limit
    products, total = ProductService.get_products(db, skip, limit, search)
    return products

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get single product by ID"""
    product = ProductService.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
