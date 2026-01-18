"""
Database Migration Script
Run this script to create/update all database tables including:
- Payments table (new)
- Orders table with customer contact fields (updated)
"""

from sqlalchemy import text
from app.db.database import engine, Base, SessionLocal
from app.models.models import User, Product, Order, OrderItem, Review, Payment

def add_customer_fields_to_orders():
    """Add customer contact fields to existing orders table if they don't exist"""
    db = SessionLocal()
    try:
        print("\n📝 Checking if orders table needs migration...")
        
        # Check if customer_phone column exists
        result = db.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'orders' 
            AND COLUMN_NAME = 'customer_phone'
        """))
        
        exists = result.scalar() > 0
        
        if not exists:
            print("   Adding customer contact fields to orders table...")
            
            # Add customer_phone (required)
            db.execute(text("""
                ALTER TABLE orders 
                ADD COLUMN customer_phone VARCHAR(20) DEFAULT '' AFTER notes
            """))
            
            # Add customer_email (optional)
            db.execute(text("""
                ALTER TABLE orders 
                ADD COLUMN customer_email VARCHAR(255) NULL AFTER customer_phone
            """))
            
            # Add customer_name (optional)
            db.execute(text("""
                ALTER TABLE orders 
                ADD COLUMN customer_name VARCHAR(255) NULL AFTER customer_email
            """))
            
            # Update existing records with default values
            db.execute(text("""
                UPDATE orders o
                JOIN users u ON o.user_id = u.id
                SET o.customer_phone = COALESCE(u.phone, '0000000000'),
                    o.customer_email = u.email,
                    o.customer_name = COALESCE(u.full_name, u.username)
                WHERE o.customer_phone = '' OR o.customer_phone IS NULL
            """))
            
            # Make customer_phone NOT NULL after setting defaults
            db.execute(text("""
                ALTER TABLE orders 
                MODIFY COLUMN customer_phone VARCHAR(20) NOT NULL
            """))
            
            db.commit()
            print("   ✅ Customer contact fields added to orders table")
        else:
            print("   ✅ Orders table already has customer contact fields")
            
    except Exception as e:
        db.rollback()
        print(f"   ⚠️  Migration error (might be okay if table doesn't exist yet): {e}")
    finally:
        db.close()

def create_all_tables():
    """Create all tables in the database"""
    print("\n🔨 Creating/updating all database tables...")
    
    try:
        # Create all tables (will skip existing ones)
        Base.metadata.create_all(bind=engine)
        
        print("✅ All tables created successfully!")
        print("\n📋 Tables in database:")
        for table_name in Base.metadata.tables.keys():
            print(f"  - {table_name}")
        
        # Run migration for existing orders table
        add_customer_fields_to_orders()
            
    except Exception as e:
        print(f"\n❌ Error creating tables: {e}")
        raise

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Database Migration Script")
    print("=" * 60)
    create_all_tables()
    print("\n" + "=" * 60)
    print("✅ Migration completed!")
    print("=" * 60)

