from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.db.database import get_db
from app.models.models import User, UserRole, OrderStatus, PaymentStatus, Product, Review, OrderItem, Order
from app.schemas.admin_schemas import (
    AdminUserResponse, AdminUserUpdate, AdminProductResponse, AdminProductCreate, 
    AdminProductUpdate, AdminOrderResponse, AdminOrderUpdate, DashboardStats,
    AdminPaginationParams, AdminPaginatedResponse
)
from sqlalchemy.orm import selectinload
from app.services.admin_services import AdminUserService, AdminProductService, AdminOrderService, AdminDashboardService
from app.utils.admin_auth import get_admin_user

router = APIRouter(prefix="/admin", tags=["Admin"])

# Dashboard endpoints
@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    return AdminDashboardService.get_dashboard_stats(db)

# User Management endpoints
@router.get("/users", response_model=AdminPaginatedResponse)
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users with filters"""
    skip = (page - 1) * limit
    users, total = AdminUserService.get_users(db, skip, limit, search, role, is_active)
    
    return AdminPaginatedResponse(
        items=[AdminUserResponse.from_orm(user) for user in users],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit,
        has_next=page * limit < total,
        has_prev=page > 1
    )

@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get single user by ID"""
    user = AdminUserService.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: int,
    user_update: AdminUserUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update user"""
    user = AdminUserService.update_user(db, user_id, user_update)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Soft delete user"""
    success = AdminUserService.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# Product Management endpoints
@router.get("/products", response_model=AdminPaginatedResponse)
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    low_stock: bool = Query(False),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all products with filters"""
    skip = (page - 1) * limit
    products, total = AdminProductService.get_products(db, skip, limit, search, is_active, low_stock)
    
    return AdminPaginatedResponse(
        items=[AdminProductResponse.from_orm(product) for product in products],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit,
        has_next=page * limit < total,
        has_prev=page > 1
    )

@router.post("/products", response_model=AdminProductResponse)
async def create_product(
    product: AdminProductCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create new product"""
    # Check if product code already exists
    existing_product = db.query(Product).filter(Product.product_code == product.product_code).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product code already exists")
    
    return AdminProductService.create_product(db, product)

@router.get("/products/{product_id}", response_model=AdminProductResponse)
async def get_product(
    product_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get single product by ID"""
    product = AdminProductService.get_products(db, 0, 1)
    # Get single product with stats
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Add stats
    rating_data = db.query(
        func.avg(Review.rating).label('avg_rating'),
        func.count(Review.id).label('review_count')
    ).filter(Review.product_id == product.id).first()
    
    product.average_rating = float(rating_data.avg_rating) if rating_data.avg_rating else None
    product.review_count = rating_data.review_count or 0
    
    total_sold = db.query(func.sum(OrderItem.quantity)).join(Order).filter(
        OrderItem.product_id == product.id,
        Order.payment_status == PaymentStatus.PAID
    ).scalar() or 0
    product.total_sold = int(total_sold)
    
    return product

@router.put("/products/{product_id}", response_model=AdminProductResponse)
async def update_product(
    product_id: int,
    product_update: AdminProductUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update product"""
    product = AdminProductService.update_product(db, product_id, product_update)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Soft delete product"""
    success = AdminProductService.delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# Order Management endpoints
@router.get("/orders", response_model=AdminPaginatedResponse)
async def get_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[OrderStatus] = Query(None),
    payment_status: Optional[PaymentStatus] = Query(None),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all orders with filters"""
    skip = (page - 1) * limit
    orders, total = AdminOrderService.get_orders(db, skip, limit, search, status, payment_status)
    
    return AdminPaginatedResponse(
        items=[AdminOrderResponse.model_validate(order) for order in orders],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit,
        has_next=page * limit < total,
        has_prev=page > 1
    )

@router.get("/orders/{order_id}", response_model=AdminOrderResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get single order by ID"""
    order = AdminOrderService.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
@router.put("/orders/{order_id}", response_model=AdminOrderResponse)
async def update_order(
    order_id: int,
    order_update: AdminOrderUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    order = AdminOrderService.update_order(db, order_id, order_update)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Load đầy đủ relationship trước khi trả
    order = (
        db.query(Order)
        .options(
            selectinload(Order.user),
            selectinload(Order.order_items).selectinload(OrderItem.product)
        )
        .filter(Order.id == order.id)
        .first()
    )

    return AdminOrderResponse.model_validate(order)

