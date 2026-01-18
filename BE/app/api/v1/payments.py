"""
Payment API Endpoints
Handles payment initialization, callbacks, and status checks
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.models.models import User, PaymentStatus
from app.schemas.payment_schemas import (
    PaymentInitRequest,
    PaymentInitResponse,
    PaymentStatusResponse,
    PaymentHistoryResponse,
    PaymentHistoryItem,
    PaymentRefundRequest,
    PaymentRefundResponse,
    MoMoCallbackRequest,
    MoMoCallbackResponse,
    VNPayCallbackResponse,
    PaymentErrorResponse
)
from app.services.payment_services import (
    PaymentService,
    MoMoPaymentService,
    VNPayPaymentService
)
from app.utils.auth import get_current_active_user, is_admin
from app.models.models import Payment
import logging
from urllib.parse import urlencode
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("payment")
logger.setLevel(logging.INFO)
router = APIRouter(prefix="/payments", tags=["Payments"])
def get_client_ip(request: Request) -> str:
    # Ngrok / reverse proxy thường set header này
    xff = request.headers.get("x-forwarded-for")
    if xff:
        # Có thể là "ip1, ip2, ip3" => lấy ip đầu
        return xff.split(",")[0].strip()

    xri = request.headers.get("x-real-ip")
    if xri:
        return xri.strip()

    # fallback
    return request.client.host if request.client else "127.0.0.1"

@router.post("/init", response_model=PaymentInitResponse)
async def initialize_payment(
    payment_request: PaymentInitRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    client_ip = get_client_ip(request)
    logger.info("[INIT] client_ip=%s xff=%s xri=%s", client_ip,request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip"))
    result = PaymentService.create_payment(
        db=db,
        user_id=current_user.id,
        req=payment_request,
        client_ip=client_ip,
    )

    if not result.get("success"):
        raise HTTPException(status_code=400, detail={
            "error_code": result.get("error_code", "PAYMENT_FAILED"),
            "message": result.get("message", "Failed to create payment")
        })

    if "payment_id" not in result:
        raise HTTPException(status_code=500, detail={
            "error_code": "INVALID_RESPONSE",
            "message": "Payment service did not return payment_id"
        })

    return PaymentInitResponse(
        success=True,
        payment_id=result.get("payment_id"),
        payment_url=result.get("payment_url"),
        deep_link=result.get("deep_link"),
        qr_code_url=result.get("qr_code_url"),
        message=result.get("message", "Payment initialized successfully"),
    )
@router.post("/momo/callback", response_model=MoMoCallbackResponse)
async def momo_callback(
    callback_data: MoMoCallbackRequest,
    db: Session = Depends(get_db)
):
    """
    MoMo IPN (Instant Payment Notification) callback endpoint
    
    This endpoint is called by MoMo payment gateway after user completes payment.
    It verifies the signature and updates the payment status accordingly.
    
    **Important:** This endpoint should be publicly accessible (no authentication required)
    as it's called by MoMo servers.
    
    **Security:** Signature verification is performed to ensure request authenticity.
    """
    result = MoMoPaymentService.handle_callback(db, callback_data.dict())
    
    if not result.get("success"):
        print(result)
        # Still return 200 OK to MoMo to avoid retries for invalid requests
        return MoMoCallbackResponse(status="failed")
    
    return MoMoCallbackResponse(status="success")



@router.get("/{payment_id}/status", response_model=PaymentStatusResponse)
async def get_payment_status(payment_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    data = PaymentService.get_payment_status(db, payment_id, current_user.id)

    if not data.get("success"):
        raise HTTPException(status_code=404, detail=data.get("message", "Payment not found"))

    data.pop("success", None)
    data.pop("message", None)

    return PaymentStatusResponse(**data)


@router.get("/history", response_model=PaymentHistoryResponse)
async def get_payment_history(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[PaymentStatus] = Query(None, description="Filter by payment status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get payment history for current user
    
    Returns a paginated list of payments made by the current user.
    Optionally filter by payment status.
    
    **Query Parameters:**
    - page: Page number (default: 1)
    - limit: Items per page (default: 20, max: 100)
    - status: Filter by status (pending, paid, failed, refunded)
    """
    skip = (page - 1) * limit
    payments, total = PaymentService.get_payment_history(
        db, current_user.id, skip, limit, status
    )
    
    payment_items = [
        PaymentHistoryItem(
            payment_id=p.id,
            order_id=p.order_id,
            order_number=p.order.order_number,
            payment_method=p.payment_method,
            amount=p.amount,
            status=p.status,
            transaction_id=p.transaction_id,
            created_at=p.created_at,
            paid_at=p.paid_at
        )
        for p in payments
    ]
    
    return PaymentHistoryResponse(
        total=total,
        page=page,
        limit=limit,
        payments=payment_items
    )


@router.post("/{payment_id}/refund", response_model=PaymentRefundResponse)
async def refund_payment(
    payment_id: int,
    refund_request: PaymentRefundRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Refund a payment (Admin only)
    
    Refund a payment partially or fully. This endpoint is restricted to admin users.
    
    **Important:** This is a simplified refund implementation. In production,
    you should call the payment gateway's refund API.
    
    **Request Body:**
    - amount: Amount to refund (optional, defaults to full amount)
    - reason: Reason for refund (required)
    """
    # Check admin permission
    if not is_admin(current_user):
        raise HTTPException(
            status_code=403,
            detail="Only admin users can refund payments"
        )
    
    result = PaymentService.refund_payment(
        db,
        payment_id,
        refund_request.amount,
        refund_request.reason
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": result.get("error_code", "REFUND_FAILED"),
                "message": result.get("message", "Failed to refund payment")
            }
        )
    
    return PaymentRefundResponse(
        success=True,
        payment_id=result["payment_id"],
        refund_amount=result["refund_amount"],
        message=result["message"]
    )


@router.get("/test/momo")
async def test_momo_config():
    """
    Test endpoint to verify MoMo configuration
    
    **Note:** Remove this endpoint in production!
    """
    from app.core.config import settings
    
    return {
        "partner_code": settings.momo_partner_code,
        "endpoint": settings.momo_endpoint,
        "has_access_key": bool(settings.momo_access_key),
        "has_secret_key": bool(settings.momo_secret_key),
        "ipn_url": settings.momo_ipn_url
    }


@router.get("/test/vnpay")
async def test_vnpay_config():
    """
    Test endpoint to verify VNPay configuration
    
    **Note:** Remove this endpoint in production!
    """
    from app.core.config import settings
    
    return {
        "tmn_code": settings.vnpay_tmn_code,
        "url": settings.vnpay_url,
        "has_hash_secret": bool(settings.vnpay_hash_secret),
        "return_url": settings.vnpay_return_url,
        "ipn_url": settings.vnpay_ipn_url
    }



def _build_fe_redirect_url(success: bool, payment_id: int | None, order_id: int | None, message: str | None, extra: dict):
    """
    Redirect về FE theo settings.vnpay_frontend_return_url
    Ví dụ: http://localhost:3000/payment/result
    Gắn query string để FE hiện kết quả.
    """
    from app.core.config import settings
    base = getattr(settings, "vnpay_frontend_return_url", None) or "http://localhost:3000/payment/result"

    params = {
        "success": "1" if success else "0",
        "payment_id": payment_id or "",
        "order_id": order_id or "",
        "message": message or "",
        **{k: ("" if v is None else str(v)) for k, v in extra.items()}
    }
    return f"{base}?{urlencode(params)}"


@router.get("/vnpay/ipn")
def vnpay_ipn(request: Request, db: Session = Depends(get_db)):
    """
    VNPay IPN: VNPay server gọi về (GET).
    - Verify signature
    - Update DB
    - Return RspCode theo chuẩn VNPay
    """
    data = dict(request.query_params)

    # 1) Verify chữ ký
    if not VNPayPaymentService.verify_signature(data):
        return JSONResponse({"RspCode": "97", "Message": "Invalid signature"})

    # 2) Handle & update DB
    # handle_callback của mày phải trả {"RspCode":"00","Message":"Success"} khi ok
    resp = VNPayPaymentService.handle_callback(db, data)

    # 3) Trả đúng format VNPay yêu cầu
    # (đừng trả {"success": true} kiểu internal)
    return JSONResponse(resp)


@router.get("/vnpay/return")
def vnpay_return(request: Request, db: Session = Depends(get_db)):
    """
    Return URL: user được VNPay redirect về.
    - Verify signature
    - Có thể update DB (an toàn thì gọi handle_callback luôn, vì có lúc IPN chậm/không tới)
    - Redirect về FE (không bắt user nhìn JSON)
    """
    data = dict(request.query_params)

    # Verify signature
    if not VNPayPaymentService.verify_signature(data):
        url = _build_fe_redirect_url(
            success=False,
            payment_id=None,
            order_id=None,
            message="Invalid signature",
            extra={"rsp": "97"}
        )
        return RedirectResponse(url, status_code=302)

    # Lấy trạng thái từ VNPay
    vnp_response_code = data.get("vnp_ResponseCode")  # "00" là ok
    txn_ref = data.get("vnp_TxnRef")

    # Update DB giống IPN (để phòng IPN không tới)
    # handle_callback của mày đã có check "Already processed" rồi nên gọi lại không sao
    resp = VNPayPaymentService.handle_callback(db, data)

    # Nếu cần lấy payment/order để redirect đẹp thì query nhẹ
    payment_id = None
    order_id = None
    try:
        payment = db.query(Payment).filter(Payment.request_id == txn_ref).first()
        if payment:
            payment_id = payment.id
            order_id = payment.order_id
    except Exception:
        # nếu mày không expose model trong service thì bỏ đoạn query này cũng được
        pass

    success = (vnp_response_code == "00")
    message = "Thanh toan thanh cong" if success else f"Thanh toan that bai ({vnp_response_code})"

    url = _build_fe_redirect_url(
        success=success,
        payment_id=payment_id,
        order_id=order_id,
        message=message,
        extra={
            "vnp_ResponseCode": vnp_response_code,
            "vnp_TransactionNo": data.get("vnp_TransactionNo"),
            "vnp_Amount": data.get("vnp_Amount"),
            "vnp_BankCode": data.get("vnp_BankCode"),
        }
    )
    return RedirectResponse(url, status_code=302)