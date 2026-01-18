import uuid

from db.database import get_db
from models.models import Order, Payment


def initiate_payment(order_number: str, method: str, amount: float) -> dict:
    with get_db() as db:
        order = db.query(Order).filter(Order.order_number == order_number).first()
        if not order:
            raise ValueError("Order not found")

        request_id = str(uuid.uuid4())
        payment = Payment(
            order_id=order.id,
            user_id=order.user_id,
            payment_method=method,
            amount=amount,
            status="pending",
            request_id=request_id,
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

        return {
            "request_id": request_id,
            "status": payment.status,
            "redirect_url": f"https://payments.example.com/{request_id}",
        }
