from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, and_
from typing import List, Optional, Tuple
from datetime import datetime, timedelta
from app.models.models import User, Product, Order, OrderItem, Review, UserRole, OrderStatus, PaymentStatus
from app.schemas.admin_schemas import AdminUserUpdate, AdminProductCreate, AdminProductUpdate, AdminOrderUpdate

class AdminUserService:
    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 20, search: Optional[str] = None, 
                  role: Optional[UserRole] = None, is_active: Optional[bool] = None):
        """Get all users with filters"""
        query = db.query(User)
        
        if search:
            query = query.filter(
                User.username.contains(search) |
                User.email.contains(search) |
                User.full_name.contains(search)
            )
        
        if role:
            query = query.filter(User.role == role)
            
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        total = query.count()
        users = query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()
        
        # Add user statistics
        for user in users:
            # Total orders
            total_orders = db.query(Order).filter(Order.user_id == user.id).count()
            user.total_orders = total_orders
            
            # Total spent
            total_spent = db.query(func.sum(Order.total_amount)).filter(
                Order.user_id == user.id,
                Order.payment_status == PaymentStatus.PAID
            ).scalar() or 0
            user.total_spent = float(total_spent)
        
        return users, total
    
    @staticmethod
    def get_user(db: Session, user_id: int):
        """Get single user by ID"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            # Add user statistics
            total_orders = db.query(Order).filter(Order.user_id == user.id).count()
            user.total_orders = total_orders
            
            total_spent = db.query(func.sum(Order.total_amount)).filter(
                Order.user_id == user.id,
                Order.payment_status == PaymentStatus.PAID
            ).scalar() or 0
            user.total_spent = float(total_spent)
        
        return user
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_update: AdminUserUpdate):
        """Update user"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def delete_user(db: Session, user_id: int):
        """Soft delete user"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        user.is_active = False
        db.commit()
        return True

class AdminProductService:
    @staticmethod
    def get_products(db: Session, skip: int = 0, limit: int = 20, search: Optional[str] = None,
                     is_active: Optional[bool] = None, low_stock: bool = False):
        """Get all products with filters"""
        query = db.query(Product)
        
        if search:
            query = query.filter(
                Product.product_name.contains(search) |
                Product.title.contains(search) |
                Product.product_code.contains(search)
            )
        
        if is_active is not None:
            query = query.filter(Product.is_active == is_active)
            
        if low_stock:
            query = query.filter(Product.stock_quantity <= 10)  # Low stock threshold
        
        total = query.count()
        products = query.order_by(desc(Product.created_at)).offset(skip).limit(limit).all()
        
        # Add product statistics
        for product in products:
            # Average rating and review count
            rating_data = db.query(
                func.avg(Review.rating).label('avg_rating'),
                func.count(Review.id).label('review_count')
            ).filter(Review.product_id == product.id).first()
            
            product.average_rating = float(rating_data.avg_rating) if rating_data.avg_rating else None
            product.review_count = rating_data.review_count or 0
            
            # Total sold
            total_sold = db.query(func.sum(OrderItem.quantity)).join(Order).filter(
                OrderItem.product_id == product.id,
                Order.payment_status == PaymentStatus.PAID
            ).scalar() or 0
            product.total_sold = int(total_sold)
        
        return products, total
    
    @staticmethod
    def create_product(db: Session, product: AdminProductCreate):
        """Create new product"""
        db_product = Product(**product.dict())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product
    
    @staticmethod
    def update_product(db: Session, product_id: int, product_update: AdminProductUpdate):
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

class AdminOrderService:
    @staticmethod
    def get_orders(db: Session, skip: int = 0, limit: int = 20,
                search: Optional[str] = None,
                status: Optional[OrderStatus] = None,
                payment_status: Optional[PaymentStatus] = None):

        query = db.query(Order).join(User)

        if search:
            query = query.filter(
                Order.order_number.contains(search) |
                User.username.contains(search) |
                User.email.contains(search)
            )

        if status:
            query = query.filter(Order.status == status)

        if payment_status:
            query = query.filter(Order.payment_status == payment_status)

        total = query.count()

        orders = (
            query
            .order_by(desc(Order.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

        return orders, total

    
    @staticmethod
    def get_order(db: Session, order_id: int):
        """Get single order by ID"""
        order = db.query(Order).filter(Order.id == order_id).first()
        if order:
            order.items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            order.username = order.user.username
            order.user_email = order.user.email
        return order
    
    @staticmethod
    def update_order(db: Session, order_id: int, order_update: AdminOrderUpdate):
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return None

        update_data = order_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(order, field, value)

        db.commit()
        db.refresh(order)
        return order

class AdminDashboardService:
    @staticmethod
    def get_dashboard_stats(db: Session):
        """Get dashboard statistics"""
        # Basic counts
        total_users = db.query(User).count()
        total_products = db.query(Product).count()
        total_orders = db.query(Order).count()
        
        # Revenue
        total_revenue = db.query(func.sum(Order.total_amount)).filter(
            Order.payment_status == PaymentStatus.PAID
        ).scalar() or 0
        
        # Pending orders
        pending_orders = db.query(Order).filter(Order.status == OrderStatus.PENDING).count()
        
        # Low stock products
        low_stock_products = db.query(Product).filter(Product.stock_quantity <= 10).count()
        
        # Recent orders (last 10)
        recent_orders = db.query(Order).join(User).order_by(desc(Order.created_at)).limit(10).all()
        recent_orders_data = []
        for order in recent_orders:
            recent_orders_data.append({
                "id": order.id,
                "order_number": order.order_number,
                "username": order.user.username,
                "total_amount": order.total_amount,
                "status": order.status,
                "created_at": order.created_at
            })
        
        # Top products (by sales)
        top_products = db.query(
            Product.id,
            Product.product_name,
            func.sum(OrderItem.quantity).label('total_sold')
        ).join(OrderItem).join(Order).filter(
            Order.payment_status == PaymentStatus.PAID
        ).group_by(Product.id).order_by(desc('total_sold')).limit(5).all()
        
        top_products_data = []
        for product in top_products:
            top_products_data.append({
                "id": product.id,
                "product_name": product.product_name,
                "total_sold": product.total_sold
            })
        
        # Monthly revenue (last 6 months)
        six_months_ago = datetime.now() - timedelta(days=180)
        # MySQL compatible: use DATE_FORMAT instead of date_trunc
        monthly_revenue = db.query(
            func.date_format(Order.created_at, '%Y-%m').label('month'),
            func.sum(Order.total_amount).label('revenue')
        ).filter(
            Order.payment_status == PaymentStatus.PAID,
            Order.created_at >= six_months_ago
        ).group_by(func.date_format(Order.created_at, '%Y-%m')).order_by('month').all()
        
        monthly_revenue_data = []
        for month in monthly_revenue:
            monthly_revenue_data.append({
                "month": month.month,  # Already in 'YYYY-MM' format
                "revenue": float(month.revenue)
            })
        
        return {
            "total_users": total_users,
            "total_products": total_products,
            "total_orders": total_orders,
            "total_revenue": float(total_revenue),
            "pending_orders": pending_orders,
            "low_stock_products": low_stock_products,
            "recent_orders": recent_orders_data,
            "top_products": top_products_data,
            "monthly_revenue": monthly_revenue_data
        }
