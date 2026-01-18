#!/usr/bin/env python3
"""
Script to list all admin users in the database
"""

import sys
import os
from sqlalchemy.orm import Session

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.database import SessionLocal
from app.models.models import User

def list_admin_users():
    """List all admin users"""
    db = SessionLocal()
    
    try:
        # Get all admin users
        admins = db.query(User).filter(User.role == "admin").all()
        
        if not admins:
            print("\n❌ No admin users found in the database.")
            print("   Run 'python create_admin.py' to create one.\n")
            return
        
        print(f"\n{'='*60}")
        print(f"Found {len(admins)} admin user(s):")
        print(f"{'='*60}\n")
        
        for idx, admin in enumerate(admins, 1):
            status = "✅ Active" if admin.is_active else "❌ Inactive"
            print(f"Admin #{idx}")
            print(f"  ID:         {admin.id}")
            print(f"  Email:      {admin.email}")
            print(f"  Username:   {admin.username}")
            print(f"  Full name:  {admin.full_name}")
            print(f"  Status:     {status}")
            print(f"  Created:    {admin.created_at}")
            print(f"  Updated:    {admin.updated_at}")
            print()
        
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
    finally:
        db.close()

if __name__ == "__main__":
    list_admin_users()

