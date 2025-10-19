"""
Test script to verify PostgreSQL connection and table creation
"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from database import test_connection, init_db, engine
from config import settings
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    print("\n" + "=" * 80)
    print("PostgreSQL Database Connection Test")
    print("=" * 80)
    
    # Print configuration
    print("\n📋 Database Configuration:")
    print(f"   Host: {settings.PGHOST}")
    print(f"   Port: {settings.PGPORT}")
    print(f"   Database: {settings.PGDATABASE}")
    print(f"   User: {settings.PGUSER}")
    print(f"   Password: {'*' * len(settings.PGPASSWORD)}")
    
    # Test connection
    print("\n🔌 Testing database connection...")
    try:
        test_connection()
        print("   ✓ Connection successful!")
    except Exception as e:
        print(f"   ✗ Connection failed: {e}")
        return False
    
    # Initialize database (create tables)
    print("\n🏗️  Creating database tables...")
    try:
        init_db()
        print("   ✓ Tables created successfully!")
    except Exception as e:
        print(f"   ✗ Failed to create tables: {e}")
        return False
    
    # Verify tables
    print("\n📊 Verifying tables...")
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"   Found {len(tables)} tables:")
        for table in tables:
            print(f"   - {table}")
            columns = inspector.get_columns(table)
            for col in columns:
                print(f"      • {col['name']}: {col['type']}")
        
        print("\n   ✓ All tables verified!")
    except Exception as e:
        print(f"   ✗ Failed to verify tables: {e}")
        return False
    
    # Test database operations
    print("\n🧪 Testing database operations...")
    try:
        from database import SessionLocal, UserDB
        from datetime import datetime
        
        db = SessionLocal()
        
        # Count existing users
        user_count = db.query(UserDB).count()
        print(f"   Current users in database: {user_count}")
        
        # Test query
        users = db.query(UserDB).all()
        if users:
            print(f"   ✓ Found {len(users)} user(s)")
            for user in users[:5]:  # Show first 5
                print(f"      - {user.email} ({user.name})")
        else:
            print("   ℹ️  No users in database yet")
        
        db.close()
        print("   ✓ Database operations test passed!")
        
    except Exception as e:
        print(f"   ✗ Database operations failed: {e}")
        return False
    
    print("\n" + "=" * 80)
    print("✅ All tests passed! Database is ready to use.")
    print("=" * 80)
    print("\nYou can now start the application with:")
    print("   python main.py")
    print("\n")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
