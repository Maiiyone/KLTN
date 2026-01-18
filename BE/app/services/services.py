from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from app.models.models import Product, User, Order, OrderItem, Review
from app.schemas.schemas import ProductCreate, ProductUpdate, OrderCreate, ReviewCreate
from datetime import datetime
import uuid

class ProductService:
    @staticmethod
    def get_products(db: Session, skip: int = 0, limit: int = 20, search: Optional[str] = None):
        """Get products with pagination and search"""
        query = db.query(Product).filter(Product.is_active == True)
        
        if search:
            query = query.filter(
                Product.product_name.contains(search) |
                Product.title.contains(search) |
                Product.description.contains(search)
            )
        
        total = query.count()
        products = query.offset(skip).limit(limit).all()
        
        # Add average rating and review count
        for product in products:
            rating_data = db.query(
                func.avg(Review.rating).label('avg_rating'),
                func.count(Review.id).label('review_count')
            ).filter(Review.product_id == product.id).first()
            
            product.average_rating = float(rating_data.avg_rating) if rating_data.avg_rating else None
            product.review_count = rating_data.review_count or 0
        
        return products, total
    
    @staticmethod
    def get_product(db: Session, product_id: int):
        """Get single product by ID"""
        product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
        
        if product:
            # Add average rating and review count
            rating_data = db.query(
                func.avg(Review.rating).label('avg_rating'),
                func.count(Review.id).label('review_count')
            ).filter(Review.product_id == product.id).first()
            
            product.average_rating = float(rating_data.avg_rating) if rating_data.avg_rating else None
            product.review_count = rating_data.review_count or 0
        
        return product
    
    @staticmethod
    def create_product(db: Session, product: ProductCreate):
        """Create new product"""
        db_product = Product(**product.dict())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product
    
    @staticmethod
    def update_product(db: Session, product_id: int, product_update: ProductUpdate):
        """Update product"""
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            return None
        
        update_data = product_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_product, field, value)
        
        db.commit()
        db.refresh(db_product)
        return db_product
    
    @staticmethod
    def delete_product(db: Session, product_id: int):
        """Soft delete product"""
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            return False
        
        db_product.is_active = False
        db.commit()
        return True

class OrderService:
    @staticmethod
    def create_order(db: Session, user_id: int, order_data: OrderCreate):
        """Create new order"""
        # Get user info
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # Generate order number
        order_number = f"BHX{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
        
        # Calculate total amount
        total_amount = 0
        order_items = []
        
        for item in order_data.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise ValueError(f"Product with ID {item.product_id} not found")
            
            if product.stock_quantity < item.quantity:
                raise ValueError(f"Insufficient stock for product {product.product_name}")
            
            unit_price = product.current_price
            item_total = unit_price * item.quantity
            total_amount += item_total
            
            order_items.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": unit_price,
                "total_price": item_total
            })
        
        # Determine customer name (use provided or fallback to user's full_name)
        customer_name = order_data.customer_name or user.full_name or user.username
        
        # Create order with customer contact info
        db_order = Order(
            user_id=user_id,
            order_number=order_number,
            total_amount=total_amount,
            shipping_address=order_data.shipping_address,
            customer_phone=order_data.customer_phone,
            customer_email=order_data.customer_email,
            customer_name=customer_name,
            notes=order_data.notes
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        
        # Create order items
        for item_data in order_items:
            order_item = OrderItem(
                order_id=db_order.id,
                **item_data
            )
            db.add(order_item)
            
            # Update stock
            product = db.query(Product).filter(Product.id == item_data["product_id"]).first()
            product.stock_quantity -= item_data["quantity"]
        
        db.commit()
        db.refresh(db_order)
        
        # Load order items with product info for response
        # SQLAlchemy will auto-load via relationship
        for item in db_order.order_items:
            # Add product_name dynamically for response
            product = db.query(Product).filter(Product.id == item.product_id).first()
            item.product_name = product.product_name if product else "Unknown Product"
        
        return db_order
    
    @staticmethod
    def get_user_orders(db: Session, user_id: int, skip: int = 0, limit: int = 20):
        """Get user's orders"""
        query = db.query(Order).filter(Order.user_id == user_id)
        total = query.count()
        orders = query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
        
        # Load order items with product info for each order
        for order in orders:
            order.order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            
            # Add product_name for each item
            for item in order.order_items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                item.product_name = product.product_name if product else "Unknown Product"
        
        return orders, total
    
    @staticmethod
    def get_order(db: Session, order_id: int, user_id: int):
        """Get single order by ID"""
        order = db.query(Order).filter(Order.id == order_id, Order.user_id == user_id).first()
        if order:
            order.order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            
            # Add product_name for each item
            for item in order.order_items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                item.product_name = product.product_name if product else "Unknown Product"
        return order
    
    @staticmethod
    def update_order_status(db: Session, order_id: int, status: str):
        """Update order status (admin only)"""
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return None
        
        order.status = status
        db.commit()
        db.refresh(order)
        return order

class ReviewService:
    @staticmethod
    def create_review(db: Session, user_id: int, review_data: ReviewCreate):
        """Create new review"""
        # Check if user has purchased this product
        has_purchased = db.query(OrderItem).join(Order).filter(
            Order.user_id == user_id,
            OrderItem.product_id == review_data.product_id,
            Order.payment_status == "paid"
        ).first() is not None
        
        db_review = Review(
            user_id=user_id,
            product_id=review_data.product_id,
            rating=review_data.rating,
            comment=review_data.comment,
            is_verified_purchase=has_purchased
        )
        db.add(db_review)
        db.commit()
        db.refresh(db_review)
        return db_review
    
    @staticmethod
    def get_product_reviews(db: Session, product_id: int, skip: int = 0, limit: int = 20):
        """Get reviews for a product"""
        query = db.query(Review).filter(Review.product_id == product_id)
        total = query.count()
        reviews = query.order_by(desc(Review.created_at)).offset(skip).limit(limit).all()
        
        # Load user info for each review
        for review in reviews:
            review.user = db.query(User).filter(User.id == review.user_id).first()
        
        return reviews, total
    
    @staticmethod
    def get_user_reviews(db: Session, user_id: int, skip: int = 0, limit: int = 20):
        """Get user's reviews"""
        query = db.query(Review).filter(Review.user_id == user_id)
        total = query.count()
        reviews = query.order_by(desc(Review.created_at)).offset(skip).limit(limit).all()
        
        # Load product info for each review
        for review in reviews:
            review.product = db.query(Product).filter(Product.id == review.product_id).first()
        
        return reviews, total
