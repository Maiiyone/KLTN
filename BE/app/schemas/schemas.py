from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models.models import OrderStatus, PaymentStatus

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username_or_email: str  # Allow login with username or email
    password: str

class ChangePasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

# Product Schemas
class ProductBase(BaseModel):
    product_name: str
    current_price: int
    unit: str
    description: Optional[str] = None
    stock_quantity: int = 0

class ProductCreate(ProductBase):
    product_code: str
    product_id: Optional[str] = None
    title: Optional[str] = None
    current_price_text: Optional[str] = None
    original_price: Optional[int] = None
    original_price_text: Optional[str] = None
    discount_percent: Optional[int] = None
    discount_text: Optional[str] = None
    product_url: Optional[str] = None
    image_url: Optional[str] = None
    image_alt: Optional[str] = None

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    current_price: Optional[int] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    stock_quantity: Optional[int] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    product_code: str
    product_id: Optional[str]
    title: Optional[str]
    current_price_text: Optional[str]
    original_price: Optional[int]
    original_price_text: Optional[str]
    discount_percent: Optional[int]
    discount_text: Optional[str]
    product_url: Optional[str]
    image_url: Optional[str]
    image_alt: Optional[str]
    is_active: bool
    created_at: datetime
    average_rating: Optional[float] = None
    review_count: Optional[int] = None
    
    class Config:
        from_attributes = True

# Order Schemas
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    shipping_address: str
    customer_phone: str  # Required for payment and delivery
    customer_email: Optional[EmailStr] = None  # Optional for notifications
    customer_name: Optional[str] = None  # Optional, will use user's full_name if not provided
    notes: Optional[str] = None
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product: ProductResponse
    quantity: int
    unit_price: float
    total_price: float

    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: int
    order_number: str
    total_amount: float
    status: OrderStatus
    payment_status: PaymentStatus
    shipping_address: str
    customer_phone: str
    customer_email: Optional[str]
    customer_name: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    # Map 'order_items' from SQLAlchemy model to 'items' for API response
    items: List[OrderItemResponse] = Field(alias="order_items")
    
    class Config:
        from_attributes = True
        populate_by_name = True  # Accept both 'items' and 'order_items' as input

# Review Schemas
class ReviewCreate(BaseModel):
    product_id: int
    rating: int
    comment: Optional[str] = None

class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: int
    user_id: int
    username: str
    product_id: int
    rating: int
    comment: Optional[str]
    is_verified_purchase: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Pagination
class PaginationParams(BaseModel):
    page: int = 1
    limit: int = 20
    
class PaginatedResponse(BaseModel):
    items: List[dict]
    total: int
    page: int
    limit: int
    pages: int

# Chatbot Schemas
class ChatSessionCreate(BaseModel):
    user_id: Optional[int] = None

class ChatSessionResponse(BaseModel):
    session_id: str
    user_id: Optional[int] = None
    expires_in: int

class ChatMessageRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    user_id: Optional[int] = None

class ChatMessageResponse(BaseModel):
    session_id: str
    user_id: Optional[int] = None
    reply: str
    sources: Optional[List[dict]] = None
