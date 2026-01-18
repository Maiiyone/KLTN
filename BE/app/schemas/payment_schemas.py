from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from app.models.models import PaymentMethod, PaymentStatus

# Request Schemas
class PaymentInitRequest(BaseModel):
    """Request schema for initializing a payment"""
    order_id: int = Field(..., description="ID of the order to pay for")
    payment_method: PaymentMethod = Field(..., description="Payment method (momo, vnpay, cod)")
    return_url: str = Field(..., description="URL to redirect after payment success")
    cancel_url: Optional[str] = Field(None, description="URL to redirect if payment cancelled")
    
    @validator('return_url', 'cancel_url')
    def validate_url(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        return v

class PaymentRefundRequest(BaseModel):
    """Request schema for refunding a payment"""
    amount: Optional[float] = Field(None, description="Amount to refund, None for full refund")
    reason: str = Field(..., description="Reason for refund")
    
    @validator('amount')
    def validate_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Refund amount must be positive')
        return v

# Response Schemas
class PaymentInitResponse(BaseModel):
    success: bool
    payment_id: Optional[int] = None
    payment_url: Optional[str] = None
    deep_link: Optional[str] = None
    qr_code_url: Optional[str] = None
    message: Optional[str] = None

    
    class Config:
        from_attributes = True

class PaymentStatusResponse(BaseModel):
    """Response schema for payment status check"""
    payment_id: int
    order_id: int
    payment_method: PaymentMethod
    amount: float
    status: PaymentStatus
    transaction_id: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None
    failed_reason: Optional[str] = None
    refund_amount: float = 0
    refund_reason: Optional[str] = None
    refunded_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PaymentHistoryItem(BaseModel):
    """Schema for payment history item"""
    payment_id: int
    order_id: int
    order_number: str
    payment_method: PaymentMethod
    amount: float
    status: PaymentStatus
    transaction_id: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PaymentHistoryResponse(BaseModel):
    """Response schema for payment history"""
    total: int
    page: int
    limit: int
    payments: list[PaymentHistoryItem]

class PaymentRefundResponse(BaseModel):
    """Response schema for payment refund"""
    success: bool
    payment_id: int
    refund_amount: float
    message: str
    
    class Config:
        from_attributes = True

# MoMo specific schemas
class MoMoCallbackRequest(BaseModel):
    """Schema for MoMo IPN callback"""
    partnerCode: str
    orderId: str
    requestId: str
    amount: int
    orderInfo: str
    orderType: str
    transId: int
    resultCode: int
    message: str
    payType: str
    responseTime: int
    extraData: str
    signature: str

class MoMoCallbackResponse(BaseModel):
    """Response schema for MoMo callback"""
    status: str = "success"

# VNPay specific schemas
class VNPayCallbackResponse(BaseModel):
    """Response schema for VNPay callback"""
    RspCode: str
    Message: str

# Error Response Schema
class PaymentErrorResponse(BaseModel):
    """Error response schema"""
    error_code: str
    message: str
    status_code: int

