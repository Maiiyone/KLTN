from pydantic import BaseModel, Field


class PaymentInitRequest(BaseModel):
    order_number: str
    payment_method: str = Field(pattern="^(momo|vnpay|cod)$")
    amount: float


class PaymentInitResponse(BaseModel):
    request_id: str
    status: str
    redirect_url: str | None = None
