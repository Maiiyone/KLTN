from sqlalchemy import or_
from sqlalchemy.orm import Session

from chatbot.prompts import TOOL_PROMPTS
from chatbot.rag import QdrantRAG
from models.models import Order, Product, User

SEARCH_PRODUCTS_PROMPT = TOOL_PROMPTS["search_products_by_keyword"]
GET_ORDERS_PROMPT = TOOL_PROMPTS["get_user_orders"]
GET_PROFILE_PROMPT = TOOL_PROMPTS["get_user_profile"]


def search_products_by_keyword(
    db: Session,
    keywords: list[str] | None,
    *,
    min_price: float | None = None,
    max_price: float | None = None,
) -> list[dict]:
    clean_terms = [term.lower() for term in (keywords or []) if term]
    print(f"[Tools] search_products_by_keyword terms={clean_terms}, min={min_price}, max={max_price}")

    print("[Tools] Using SQL search")
    query = db.query(Product).filter(Product.is_active.is_(True))
    if clean_terms:
        like_clauses = [Product.product_name.ilike(f"%{term}%") for term in clean_terms]
        query = query.filter(or_(*like_clauses))
    else:
        print("[Tools] No keyword provided, returning latest active products.")

    if min_price is not None:
        query = query.filter(Product.current_price >= min_price)
    if max_price is not None:
        query = query.filter(Product.current_price <= max_price)

    products = query.order_by(Product.created_at.desc()).limit(5).all()

    return [
        {
            "product_id": str(product.id),
            "product_code": product.product_code,
            "product_name": product.product_name or "",
            "price": float(product.current_price or 0),
            "price_text": product.current_price_text,
            "unit": product.unit,
            "product_url": product.product_url,
            "image_url": product.image_url,
            "discount_percent": product.discount_percent,
            "score": None,
        }
        for product in products
    ]


def get_user_orders(db: Session, user_id: int) -> list[dict]:
    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).limit(5)
    return [
        {
            "order_number": order.order_number,
            "status": order.status,
            "total_amount": float(order.total_amount),
        }
        for order in orders
    ]


def suggest_products(db: Session, limit: int = 3) -> list[dict]:
    """Suggest popular products when search returns no results."""
    products = (
        db.query(Product)
        .filter(Product.is_active.is_(True))
        .order_by(Product.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "product_id": product.product_id,
            "product_code": product.product_code,
            "product_name": product.product_name or "",
            "price": float(product.current_price or 0),
            "price_text": product.current_price_text,
            "unit": product.unit,
            "product_url": product.product_url,
            "image_url": product.image_url,
            "discount_percent": product.discount_percent,
            "score": None,
        }
        for product in products
    ]


def get_user_profile(db: Session, user_id: int) -> dict | None:
    print(f"Get user profile for user_id={user_id}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    return {
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
    }


search_products_by_keyword.__doc__ = SEARCH_PRODUCTS_PROMPT
get_user_orders.__doc__ = GET_ORDERS_PROMPT
get_user_profile.__doc__ = GET_PROFILE_PROMPT
