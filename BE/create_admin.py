#!/usr/bin/env python3
"""
Script to create the first admin user
"""

import sys
import os
from sqlalchemy.orm import Session

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.database import SessionLocal
from app.models.models import User
from app.utils.auth import get_password_hash

def create_admin_user():
    """Create or update admin user"""
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.role == "admin").first()
        
        if existing_admin:
            print("\n=== Admin user already exists! ===")
            print(f"Current admin info:")
            print(f"  - ID: {existing_admin.id}")
            print(f"  - Email: {existing_admin.email}")
            print(f"  - Username: {existing_admin.username}")
            print(f"  - Full name: {existing_admin.full_name}")
            print(f"  - Active: {existing_admin.is_active}")
            print()
            
            update_choice = input("Do you want to update this admin? (y/n): ").strip().lower()
            if update_choice != 'y':
                print("Operation cancelled.")
                return
            
            print("\n=== Updating admin user ===")
            print("(Leave blank to keep current value)")
            
            # Get new details
            email = input(f"Enter new email [{existing_admin.email}]: ").strip()
            username = input(f"Enter new username [{existing_admin.username}]: ").strip()
            password = input("Enter new password (leave blank to keep current): ").strip()
            full_name = input(f"Enter new full name [{existing_admin.full_name}]: ").strip()
            
            # Update fields if provided
            if email:
                # Check if new email already used by another user
                email_exists = db.query(User).filter(
                    User.email == email,
                    User.id != existing_admin.id
                ).first()
                if email_exists:
                    print(f"Error: Email '{email}' is already used by another user!")
                    return
                existing_admin.email = email
            
            if username:
                # Check if new username already used by another user
                username_exists = db.query(User).filter(
                    User.username == username,
                    User.id != existing_admin.id
                ).first()
                if username_exists:
                    print(f"Error: Username '{username}' is already used by another user!")
                    return
                existing_admin.username = username
            
            if password:
                existing_admin.hashed_password = get_password_hash(password)
            
            if full_name:
                existing_admin.full_name = full_name
            
            db.commit()
            db.refresh(existing_admin)
            
            print("\n=== Admin user updated successfully! ===")
            print(f"ID: {existing_admin.id}")
            print(f"Email: {existing_admin.email}")
            print(f"Username: {existing_admin.username}")
            print(f"Full name: {existing_admin.full_name}")
            print(f"Role: {existing_admin.role}")
            print(f"Active: {existing_admin.is_active}")
            
        else:
            # Create new admin user
            print("\n=== Creating first admin user ===")
            email = input("Enter admin email: ").strip()
            username = input("Enter admin username: ").strip()
            password = input("Enter admin password: ").strip()
            full_name = input("Enter admin full name: ").strip()
            
            if not all([email, username, password, full_name]):
                print("Error: All fields are required!")
                return
            
            # Check if email or username already exists
            if db.query(User).filter(User.email == email).first():
                print(f"Error: Email '{email}' already exists!")
                return
                
            if db.query(User).filter(User.username == username).first():
                print(f"Error: Username '{username}' already exists!")
                return
            
            # Create admin user
            hashed_password = get_password_hash(password)
            admin_user = User(
                email=email,
                username=username,
                hashed_password=hashed_password,
                full_name=full_name,
                role="admin",
                is_active=True
            )
            
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            
            print("\n=== Admin user created successfully! ===")
            print(f"ID: {admin_user.id}")
            print(f"Email: {admin_user.email}")
            print(f"Username: {admin_user.username}")
            print(f"Full name: {admin_user.full_name}")
            print(f"Role: {admin_user.role}")
            print(f"Active: {admin_user.is_active}")
        
    except Exception as e:
        print(f"\nError: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
