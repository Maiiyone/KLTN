from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import datetime, timedelta
from app.db.database import get_db
from app.models.models import User, UserRole, Product, Order, OrderStatus, PaymentStatus, Review, OrderItem
from app.schemas.admin_schemas import DashboardStats, UserStats, ProductStats, OrderStats
from app.services.admin_services import AdminDashboardService
from app.utils.admin_auth import get_admin_user

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])

@router.get("/public-stats")
async def get_public_stats(db: Session = Depends(get_db)):
    """Get public dashboard statistics - no auth required
    
    Returns basic stats: total users, products, orders, and revenue
    """
    # Total users
    total_users = db.query(User).count()
    
    # Total products
    total_products = db.query(Product).filter(Product.is_active == True).count()
    
    # Total orders
    total_orders = db.query(Order).count()
    
    # Total revenue (only paid orders)
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.payment_status == PaymentStatus.PAID
    ).scalar() or 0
    
    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue)
    }

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard statistics"""
    return AdminDashboardService.get_dashboard_stats(db)

@router.get("/user-stats", response_model=UserStats)
async def get_user_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get user statistics"""
    # Total users
    total_users = db.query(User).count()
    
    # Active users (users with at least one order)
    active_users = db.query(User).join(Order).distinct().count()
    
    # New users this month
    this_month = datetime.now().replace(day=1)
    new_users_this_month = db.query(User).filter(User.created_at >= this_month).count()
    
    # Users by role
    users_by_role = db.query(
        User.role,
        func.count(User.id).label('count')
    ).group_by(User.role).all()
    
    # role is already a string from database, not enum object
    users_by_role_dict = {str(role): count for role, count in users_by_role}
    
    return UserStats(
        total_users=total_users,
        active_users=active_users,
        new_users_this_month=new_users_this_month,
        users_by_role=users_by_role_dict
    )

@router.get("/product-stats", response_model=ProductStats)
async def get_product_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get product statistics"""
    # Total products
    total_products = db.query(Product).count()
    
    # Active products
    active_products = db.query(Product).filter(Product.is_active == True).count()
    
    # Out of stock
    out_of_stock = db.query(Product).filter(Product.stock_quantity == 0).count()
    
    # Low stock (<= 10)
    low_stock = db.query(Product).filter(Product.stock_quantity <= 10).count()
    
    # Total categories (assuming we have categories in the future)
    total_categories = 1  # Placeholder for now
    
    return ProductStats(
        total_products=total_products,
        active_products=active_products,
        out_of_stock=out_of_stock,
        low_stock=low_stock,
        total_categories=total_categories
    )

@router.get("/order-stats", response_model=OrderStats)
async def get_order_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get order statistics"""
    # Total orders
    total_orders = db.query(Order).count()
    
    # Orders by status
    pending_orders = db.query(Order).filter(Order.status == OrderStatus.PENDING).count()
    completed_orders = db.query(Order).filter(Order.status == OrderStatus.DELIVERED).count()
    cancelled_orders = db.query(Order).filter(Order.status == OrderStatus.CANCELLED).count()
    
    # Revenue
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.payment_status == PaymentStatus.PAID
    ).scalar() or 0
    
    # Average order value
    avg_order_value = db.query(func.avg(Order.total_amount)).filter(
        Order.payment_status == PaymentStatus.PAID
    ).scalar() or 0
    
    return OrderStats(
        total_orders=total_orders,
        pending_orders=pending_orders,
        completed_orders=completed_orders,
        cancelled_orders=cancelled_orders,
        total_revenue=float(total_revenue),
        average_order_value=float(avg_order_value)
    )

@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get recent activity (orders, users, reviews)"""
    # Recent orders
    recent_orders = db.query(Order).join(User).order_by(desc(Order.created_at)).limit(limit).all()
    recent_orders_data = []
    for order in recent_orders:
        recent_orders_data.append({
            "type": "order",
            "id": order.id,
            "description": f"New order #{order.order_number} from {order.user.username}",
            "amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at
        })
    
    # Recent reviews
    recent_reviews = db.query(Review).join(User).order_by(desc(Review.created_at)).limit(limit).all()
    recent_reviews_data = []
    for review in recent_reviews:
        recent_reviews_data.append({
            "type": "review",
            "id": review.id,
            "description": f"New {review.rating}-star review from {review.user.username}",
            "rating": review.rating,
            "created_at": review.created_at
        })
    
    # Recent users
    recent_users = db.query(User).order_by(desc(User.created_at)).limit(limit).all()
    recent_users_data = []
    for user in recent_users:
        recent_users_data.append({
            "type": "user",
            "id": user.id,
            "description": f"New user registered: {user.username}",
            "email": user.email,
            "created_at": user.created_at
        })
    
    # Combine and sort by created_at
    all_activities = recent_orders_data + recent_reviews_data + recent_users_data
    all_activities.sort(key=lambda x: x['created_at'], reverse=True)
    
    return all_activities[:limit]

@router.get("/sales-analytics")
async def get_sales_analytics(
    days: int = Query(30, ge=7, le=365),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get sales analytics for the specified period"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Daily sales
    daily_sales = db.query(
        func.date(Order.created_at).label('date'),
        func.count(Order.id).label('orders'),
        func.sum(Order.total_amount).label('revenue')
    ).filter(
        Order.payment_status == PaymentStatus.PAID,
        Order.created_at >= start_date,
        Order.created_at <= end_date
    ).group_by('date').order_by('date').all()
    
    daily_sales_data = []
    for day in daily_sales:
        daily_sales_data.append({
            "date": day.date.strftime('%Y-%m-%d'),
            "orders": day.orders,
            "revenue": float(day.revenue or 0)
        })
    
    # Top selling products
    top_products = db.query(
        Product.id,
        Product.product_name,
        func.sum(OrderItem.quantity).label('total_sold'),
        func.sum(OrderItem.total_price).label('total_revenue')
    ).join(OrderItem).join(Order).filter(
        Order.payment_status == PaymentStatus.PAID,
        Order.created_at >= start_date,
        Order.created_at <= end_date
    ).group_by(Product.id, Product.product_name).order_by(desc('total_sold')).limit(10).all()
    
    top_products_data = []
    for product in top_products:
        top_products_data.append({
            "id": product.id,
            "product_name": product.product_name,
            "total_sold": product.total_sold,
            "total_revenue": float(product.total_revenue or 0)
        })
    
    return {
        "period_days": days,
        "start_date": start_date.strftime('%Y-%m-%d'),
        "end_date": end_date.strftime('%Y-%m-%d'),
        "daily_sales": daily_sales_data,
        "top_products": top_products_data
    }
