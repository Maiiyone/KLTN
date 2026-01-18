from fastapi import APIRouter
from app.api.v1 import (
    admin,
    admin_dashboard,
    auth,
    orders,
    payments,
    products,
    reviews,
)

api_router = APIRouter()

# Include all routers
api_router.include_router(auth.router)
api_router.include_router(products.router)
api_router.include_router(orders.router)
api_router.include_router(reviews.router)
api_router.include_router(admin.router)
api_router.include_router(admin_dashboard.router)
api_router.include_router(payments.router)
