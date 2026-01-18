from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User
from app.utils.auth import get_current_active_user

def get_admin_user(current_user: User = Depends(get_current_active_user)):
    """Get current user and verify admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user

def get_admin_or_self_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get user if admin or if requesting own data"""
    if current_user.role == "admin" or current_user.id == user_id:
        return current_user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not enough permissions"
    )
