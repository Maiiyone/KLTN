"""
Payment Services for MoMo and VNPay integration
Handles payment initialization, verification, and callbacks
"""
import logging

import hashlib
import hmac
import json
import uuid
import requests
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from urllib.parse import quote, quote_plus, urlencode
from app.core.config import settings
from app.models.models import (
    Payment, Order, PaymentMethod,
    PaymentStatus, OrderStatus
)
from app.schemas.payment_schemas import PaymentInitRequest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("payment")
logger.setLevel(logging.INFO)
# ======================================================
# ===================== MoMo ===========================
# ======================================================

class MoMoPaymentService:

    # ---------- CREATE SIGNATURE (INIT PAYMENT) ----------
    @staticmethod
    def generate_signature(data: Dict[str, Any]) -> str:
        raw_signature = (
            f"accessKey={data['accessKey']}"
            f"&amount={data['amount']}"
            f"&extraData={data['extraData']}"
            f"&ipnUrl={data['ipnUrl']}"
            f"&orderId={data['orderId']}"
            f"&orderInfo={data['orderInfo']}"
            f"&partnerCode={data['partnerCode']}"
            f"&redirectUrl={data['redirectUrl']}"
            f"&requestId={data['requestId']}"
            f"&requestType={data['requestType']}"
        )

        return hmac.new(
            settings.momo_secret_key.encode(),
            raw_signature.encode(),
            hashlib.sha256
        ).hexdigest()

    # ---------- VERIFY CALLBACK SIGNATURE (RAW DATA) ----------
    @staticmethod
    def verify_callback_signature(callback_data: Dict[str, Any]) -> bool:
        signature = callback_data.get("signature")

        raw_signature = (
            f"accessKey={settings.momo_access_key}"
            f"&amount={callback_data['amount']}"
            f"&extraData={callback_data['extraData']}"
            f"&message={callback_data['message']}"
            f"&orderId={callback_data['orderId']}"
            f"&orderInfo={callback_data['orderInfo']}"
            f"&orderType={callback_data['orderType']}"
            f"&partnerCode={callback_data['partnerCode']}"
            f"&payType={callback_data['payType']}"
            f"&requestId={callback_data['requestId']}"
            f"&responseTime={callback_data['responseTime']}"
            f"&resultCode={callback_data['resultCode']}"
            f"&transId={callback_data['transId']}"
        )

        expected_signature = hmac.new(
            settings.momo_secret_key.encode(),
            raw_signature.encode(),
            hashlib.sha256
        ).hexdigest()

        return signature == expected_signature

    # ---------- INIT PAYMENT ----------
    @staticmethod
    def create_payment(db: Session, payment: Payment, order: Order) -> Dict[str, Any]:
        request_id = payment.request_id
        momo_order_id = f"ORDER_{order.id}_{request_id[:8]}"

        extra_data = json.dumps({
            "payment_id": payment.id,
            "order_id": order.id
        })

        momo_data = {
            "partnerCode": settings.momo_partner_code,
            "accessKey": settings.momo_access_key,
            "requestId": request_id,
            "amount": str(int(payment.amount)),
            "orderId": momo_order_id,
            "orderInfo": f"Payment for Order #{order.order_number}",
            "redirectUrl": payment.return_url,
            "ipnUrl": settings.momo_ipn_url,  # ❗ PHẢI LÀ PUBLIC URL
            "extraData": extra_data,
            "requestType": "payWithMethod",
            "lang": "vi"
        }

        momo_data["signature"] = MoMoPaymentService.generate_signature(momo_data)

        res = requests.post(settings.momo_endpoint, json=momo_data, timeout=30)
        if res.status_code != 200:
            logger.error("[MOMO] status=%s body=%s", res.status_code, res.text)
            res.raise_for_status()
        result = res.json()

        payment.gateway_response = json.dumps(result)
        db.commit()

        if str(result.get("resultCode")) == "0":
            return {
                "success": True,
                "payment_id": payment.id,
                "payment_url": result.get("payUrl"),
                "deep_link": result.get("deeplink")
            }

        payment.status = PaymentStatus.FAILED
        payment.failed_reason = result.get("message")
        db.commit()

        return {"success": False, "payment_id": payment.id,"message": result.get("message")}

    # ---------- HANDLE CALLBACK ----------
    @staticmethod
    def handle_callback(db: Session, callback_data: Dict[str, Any]) -> Dict[str, Any]:

        # ✅ VERIFY SIGNATURE
        if not MoMoPaymentService.verify_callback_signature(callback_data):
            return {"success": False, "message": "Invalid signature"}

        # ✅ PARSE extraData
        extra_data = json.loads(callback_data.get("extraData", "{}"))
        payment_id = extra_data.get("payment_id")

        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            return {"success": False, "message": "Payment not found"}

        if payment.status != PaymentStatus.PENDING:
            return {"success": True, "message": "Already processed"}

        # ❗ resultCode LÀ STRING
        if str(callback_data.get("resultCode")) == "0":
            payment.status = PaymentStatus.PAID
            payment.transaction_id = str(callback_data.get("transId"))
            payment.paid_at = datetime.utcnow()
            payment.gateway_response = json.dumps(callback_data)

            order = payment.order
            order.payment_status = PaymentStatus.PAID
            if order.status == OrderStatus.PENDING:
                order.status = OrderStatus.CONFIRMED
        else:
            payment.status = PaymentStatus.FAILED
            payment.failed_reason = callback_data.get("message")

        db.commit()
        return {"success": True}
# ======================================================
# ===================== VNPay ==========================
# ======================================================


class VNPayPaymentService:
    # Múi giờ Việt Nam
    VN_TZ = timezone(timedelta(hours=7))

    @staticmethod
    def _only_vnp_params(data: Dict[str, Any]) -> Dict[str, str]:
        out: Dict[str, str] = {}
        for k, v in data.items():
            if not k.startswith("vnp_"):
                continue
            if v is None:
                continue
            s = str(v)
            if s.strip() == "":
                continue
            out[k] = s
        return out

    @staticmethod
    def _build_hash_data(params: Dict[str, str]) -> str:
        items = []
        # Sắp xếp tham số a-z rồi encode
        for k, v in sorted(params.items()):
            items.append(f"{quote_plus(k)}={quote_plus(v)}")
        return "&".join(items)

    @staticmethod
    def generate_signature(data: Dict[str, Any], secret_key: str) -> str:
        # 1. Lọc tham số vnp_
        vnp_params = VNPayPaymentService._only_vnp_params(data)
        
        # 2. Loại bỏ tham số hash cũ nếu có (để tính lại)
        vnp_params.pop("vnp_SecureHash", None)
        vnp_params.pop("vnp_SecureHashType", None)

        # 3. Tạo chuỗi dữ liệu hash
        hash_data = VNPayPaymentService._build_hash_data(vnp_params)
        
        # 4. Ký (HMACSHA512)
        return hmac.new(
            secret_key.encode("utf-8"),
            hash_data.encode("utf-8"),
            hashlib.sha512,
        ).hexdigest()
    @staticmethod
    def verify_signature(data: Dict[str, Any]) -> bool:
        # 1. Lấy SecureHash từ dữ liệu trả về
        vnp_secure_hash = data.get("vnp_SecureHash")
        if not vnp_secure_hash:
            return False
            
        # 2. Tính toán lại hash từ dữ liệu nhận được (dùng Secret Key trong settings)
        # Hàm generate_signature đã tự động loại bỏ vnp_SecureHash ra khỏi dữ liệu trước khi tính
        my_secure_hash = VNPayPaymentService.generate_signature(data, settings.vnpay_hash_secret)
        
        # 3. So sánh (không phân biệt hoa thường)
        return vnp_secure_hash.lower() == my_secure_hash.lower()
    @staticmethod
    def handle_callback(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        # 1. Xác thực chữ ký
        if not VNPayPaymentService.verify_signature(data):
            return {"success": False, "message": "Invalid Signature"}

        # 2. Lấy thông tin giao dịch
        vnp_txn_ref = data.get("vnp_TxnRef")       # Mã đơn hàng (RequestId)
        vnp_response_code = data.get("vnp_ResponseCode") # 00 là thành công
        vnp_transaction_no = data.get("vnp_TransactionNo") # Mã giao dịch tại VNPay

        # 3. Tìm Payment trong DB
        payment = db.query(Payment).filter(Payment.request_id == vnp_txn_ref).first()
        if not payment:
            return {"success": False, "message": "Payment not found"}

        # 4. Kiểm tra trạng thái hiện tại (Tránh xử lý lại đơn đã xong)
        if payment.status == PaymentStatus.PAID:
            return {"success": True, "message": "Payment already confirmed"}

        # 5. Cập nhật trạng thái
        payment.gateway_response = json.dumps(data) # Lưu log phản hồi
        
        if vnp_response_code == "00":
            # --- THANH TOÁN THÀNH CÔNG ---
            payment.status = PaymentStatus.PAID
            payment.transaction_id = vnp_transaction_no
            payment.paid_at = datetime.utcnow()
            
            # Cập nhật đơn hàng
            if payment.order:
                payment.order.payment_status = PaymentStatus.PAID
                # Nếu đơn hàng đang chờ, chuyển sang đã xác nhận
                if payment.order.status == OrderStatus.PENDING:
                    payment.order.status = OrderStatus.CONFIRMED
        else:
            # --- THANH TOÁN THẤT BẠI ---
            payment.status = PaymentStatus.FAILED
            payment.failed_reason = f"VNPay Error Code: {vnp_response_code}"

        db.commit()
        
        return {
            "success": True if vnp_response_code == "00" else False,
            "payment_id": payment.id,
            "message": "Success" if vnp_response_code == "00" else "Payment Failed"
        }
    @staticmethod
    def create_payment(db: Session, payment: Payment, order: Order, client_ip: str) -> Dict[str, Any]:
        # --- CẤU HÌNH (LẤY TỪ SETTINGS HOẶC HARDCODE ĐỂ TEST) ---
        # Bạn có thể dùng settings.vnpay_tmn_code nếu config đã đúng
        VNP_TMN_CODE = settings.vnpay_tmn_code 
        VNP_HASH_SECRET = settings.vnpay_hash_secret 
        VNP_URL = settings.vnpay_url  # "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
        VNP_RETURN_URL = settings.vnpay_return_url

        # 1. Lấy thời gian hiện tại (VN Time)
        now = datetime.now(VNPayPaymentService.VN_TZ)
        create_date = now.strftime("%Y%m%d%H%M%S")
        
        # 2. Tạo Mã giao dịch (TxnRef) theo chuẩn Node.js (DDHHmmss)
        # Ví dụ: 28173015 (Ngày 28, 17h 30p 15s) -> Đảm bảo duy nhất trong ngày
        txn_ref = now.strftime("%d%H%M%S")
        
        # Cập nhật lại request_id trong database để khớp với cái gửi đi VNPay
        payment.request_id = txn_ref 

        # 3. Bộ tham số chuẩn (GIỐNG HỆT NODE.JS)
        vnp_params: Dict[str, Any] = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": VNP_TMN_CODE,
            "vnp_Amount": str(int(payment.amount * 100)), # Số tiền * 100
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": txn_ref,
            "vnp_OrderInfo": f"Thanh toan don hang {order.id}",
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": VNP_RETURN_URL,
            # --- QUAN TRỌNG: Ép cứng IP và BankCode để tránh lỗi ---
            "vnp_IpAddr": "113.160.1.1",  # Dùng IP Public giả định (Node.js hay dùng cách này)
            "vnp_CreateDate": create_date,
        }

        # 4. Tạo chữ ký
        secure_hash = VNPayPaymentService.generate_signature(vnp_params, VNP_HASH_SECRET)
        vnp_params["vnp_SecureHash"] = secure_hash

        # 5. Tạo URL thanh toán
        # Lưu ý: generate_signature đã lọc và sort rồi, nhưng để tạo URL query string 
        # ta cần sort lại một lần nữa cho chắc chắn bao gồm cả vnp_SecureHash
        query_params = VNPayPaymentService._only_vnp_params(vnp_params)
        query_string = VNPayPaymentService._build_hash_data(query_params)
        
        pay_url = f"{VNP_URL}?{query_string}"

        # 6. Log và Lưu DB
        logger.info(f"[VNPAY] Created URL: {pay_url}")
        
        payment.gateway_response = json.dumps({"vnp_request": vnp_params}, ensure_ascii=False)
        db.commit()

        return {"success": True, "payment_url": pay_url, "payment_id": payment.id}
# ======================================================
# ================= MAIN SERVICE =======================
# ======================================================

class PaymentService:
    @staticmethod
    def get_payment_status(db: Session, payment_id: int, user_id: int) -> Dict[str, Any]:
        payment = (
            db.query(Payment)
            .filter(Payment.id == payment_id, Payment.user_id == user_id)
            .first()
        )
        if not payment:
            return {"success": False, "message": "Payment not found"}

        return {
            "success": True,
            "payment_id": payment.id,
            "order_id": payment.order_id,
            "payment_method": payment.payment_method.value if payment.payment_method else None,
            "amount": float(payment.amount),
            "status": payment.status.value if payment.status else None,
            "transaction_id": payment.transaction_id,
            "created_at": payment.created_at.isoformat() if getattr(payment, "created_at", None) else None,
            "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
            "failed_reason": payment.failed_reason,
            "refund_amount": float(payment.refund_amount) if getattr(payment, "refund_amount", None) is not None else None,
            "refund_reason": getattr(payment, "refund_reason", None),
            "refunded_at": payment.refunded_at.isoformat() if getattr(payment, "refunded_at", None) else None,
        }
    @staticmethod
    def create_payment(
        db: Session,
        user_id: int,
        req: PaymentInitRequest,
        client_ip: str = "127.0.0.1",
    ):
        order = db.query(Order).filter(
            Order.id == req.order_id,
            Order.user_id == user_id
        ).first()

        if not order:
            return {"success": False, "message": "Order not found"}

        payment = Payment(
            order_id=order.id,
            user_id=user_id,
            payment_method=req.payment_method,
            amount=order.total_amount,
            status=PaymentStatus.PENDING,
            request_id=uuid.uuid4().hex,     # không dấu '-'
            return_url=req.return_url,
            cancel_url=req.cancel_url,
        )

        db.add(payment)
        db.commit()
        db.refresh(payment)

        if req.payment_method == PaymentMethod.MOMO:
            return MoMoPaymentService.create_payment(db, payment, order)

        if req.payment_method == PaymentMethod.VNPAY:
            return VNPayPaymentService.create_payment(db, payment, order, client_ip=client_ip)

        return {"success": False, "message": "Unsupported payment method"}