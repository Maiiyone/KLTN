from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List, Union
from datetime import datetime
from app.schemas.schemas import OrderItemResponse
from app.models.models import UserRole, OrderStatus, PaymentStatus

# Admin User Management Schemas
class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class AdminUserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    total_orders: Optional[int] = None
    total_spent: Optional[float] = None
    
    class Config:
        from_attributes = True

# Admin Product Management Schemas
class AdminProductCreate(BaseModel):
    product_code: str
    product_id: Optional[str] = None
    title: Optional[str] = None
    product_name: str
    current_price: int
    current_price_text: Optional[str] = None
    unit: str = "gam"
    original_price: Optional[int] = None
    original_price_text: Optional[str] = None
    discount_percent: Optional[int] = None
    discount_text: Optional[str] = None
    product_url: Optional[str] = None
    image_url: Optional[str] = None
    image_alt: Optional[str] = None
    product_position: Optional[int] = None
    description: Optional[str] = None
    stock_quantity: int = 0

class AdminProductUpdate(BaseModel):
    product_name: Optional[str] = None
    current_price: Optional[int] = None
    current_price_text: Optional[str] = None
    unit: Optional[str] = None
    original_price: Optional[int] = None
    original_price_text: Optional[str] = None
    discount_percent: Optional[int] = None
    discount_text: Optional[str] = None
    product_url: Optional[str] = None
    image_url: Optional[str] = None
    image_alt: Optional[str] = None
    product_position: Optional[int] = None
    description: Optional[str] = None
    stock_quantity: Optional[int] = None
    is_active: Optional[bool] = None

class AdminProductResponse(BaseModel):
    id: int
    product_code: str
    product_id: Optional[str]
    title: Optional[str]
    product_name: str
    current_price: int
    current_price_text: Optional[str]
    unit: str
    original_price: Optional[int]
    original_price_text: Optional[str]
    discount_percent: Optional[int]
    discount_text: Optional[str]
    product_url: Optional[str]
    image_url: Optional[str]
    image_alt: Optional[str]
    product_position: Optional[int]
    description: Optional[str]
    stock_quantity: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    average_rating: Optional[float] = None
    review_count: Optional[int] = None
    total_sold: Optional[int] = None
    
    class Config:
        from_attributes = True

# Admin Order Management Schemas
class AdminOrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    notes: Optional[str] = None

class AdminOrderResponse(BaseModel):
    id: int
    user_id: int
    username: str
    user_email: str
    order_number: str
    total_amount: float
    status: OrderStatus
    payment_status: PaymentStatus
    shipping_address: str
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)

# Admin Dashboard Schemas
class DashboardStats(BaseModel):
    total_users: int
    total_products: int
    total_orders: int
    total_revenue: float
    pending_orders: int
    low_stock_products: int
    recent_orders: List[dict]
    top_products: List[dict]
    monthly_revenue: List[dict]

class UserStats(BaseModel):
    total_users: int
    active_users: int
    new_users_this_month: int
    users_by_role: dict

class ProductStats(BaseModel):
    total_products: int
    active_products: int
    out_of_stock: int
    low_stock: int
    total_categories: int

class OrderStats(BaseModel):
    total_orders: int
    pending_orders: int
    completed_orders: int
    cancelled_orders: int
    total_revenue: float
    average_order_value: float

# Pagination for admin
class AdminPaginationParams(BaseModel):
    page: int = 1
    limit: int = 20
    search: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: Optional[str] = "desc"  # asc or desc

class AdminPaginatedResponse(BaseModel):
    items: List[Union[AdminUserResponse, AdminProductResponse, AdminOrderResponse, dict]]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool
