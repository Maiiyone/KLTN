from uuid import uuid4
from typing import Any

from pydantic import BaseModel, Field


def new_session_id() -> str:
    return str(uuid4())


class SessionCreateRequest(BaseModel):
    """Request to create a new chat session."""
    user_id: int | None = Field(None, description="Optional user ID to associate with the session")


class SessionCreateResponse(BaseModel):
    """Response containing the created session ID."""
    session_id: str = Field(default_factory=new_session_id, description="Unique session identifier (UUID)")


class MessageRequest(BaseModel):
    """Request to send a message to the chatbot."""
    session_id: str = Field(..., description="Session ID from create_session endpoint")
    message: str = Field(..., description="User message text")
    user_id: int | None = Field(None, description="Optional user ID for personalized responses")


class ProductInfo(BaseModel):
    """Product information returned from search."""
    product_id: str | None = Field(None, description="Product ID (from Qdrant)")
    product_code: str | None = Field(None, description="Product barcode/code")
    product_name: str = Field(..., description="Product name/title")
    price: float = Field(..., description="Current price in VND")
    price_text: str | None = Field(None, description="Formatted price string (e.g., '16.000đ/Gói 50g')")
    unit: str | None = Field(None, description="Product unit (e.g., '50g', 'gam')")
    product_url: str | None = Field(None, description="Product detail page URL")
    image_url: str | None = Field(None, description="Product image URL")
    discount_percent: int | None = Field(None, description="Discount percentage (0-100)")
    score: float | None = Field(None, description="Semantic similarity score (0-1) when using Qdrant RAG")


class OrderInfo(BaseModel):
    """Order information for user order history."""
    order_number: str = Field(..., description="Unique order number")
    status: str = Field(..., description="Order status: pending, confirmed, shipping, delivered, cancelled")
    total_amount: float = Field(..., description="Total order amount in VND")


class UserProfileInfo(BaseModel):
    """User profile information."""
    full_name: str | None = Field(None, description="User full name")
    email: str | None = Field(None, description="User email address")
    phone: str | None = Field(None, description="User phone number")


class MessageContext(BaseModel):
    """Context data returned with chatbot response."""
    products: list[ProductInfo] | None = Field(
        None,
        description="List of products found (when intent is product_search). "
        "Contains full product details when using Qdrant RAG, or basic info when using SQL fallback."
    )
    suggested_products: list[ProductInfo] | None = Field(
        None,
        description="List of suggested products when no products found (when intent is product_search). "
        "Contains 3 most recent active products as recommendations."
    )
    orders: list[OrderInfo] | None = Field(
        None,
        description="List of user orders (when intent is orders). Maximum 5 most recent orders."
    )
    profile: UserProfileInfo | None = Field(
        None,
        description="User profile information (when intent is profile)"
    )


class MessageResponse(BaseModel):
    """Response from chatbot message endpoint."""
    reply: str = Field(
        ...,
        description="Chatbot reply in Vietnamese (when AI available) or English (fallback). "
        "For product_search intent, this is an AI-generated summary of found products."
    )
    session_id: str = Field(..., description="Session ID (same as request)")
    context: MessageContext = Field(
        ...,
        description="Structured context data from tools. "
        "Contains products/orders/profile based on detected intent. "
        "Empty lists/None values indicate no results found."
    )
