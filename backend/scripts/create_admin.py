"""
Create admin user script
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
import getpass


def create_admin():
    """Create admin user"""
    db = SessionLocal()
    
    try:
        print("=== Create Admin User ===")
        username = input("Username: ")
        
        # Check if user exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"Error: User '{username}' already exists")
            return
        
        email = input("Email (optional): ")
        password = getpass.getpass("Password: ")
        password_confirm = getpass.getpass("Confirm Password: ")
        
        if password != password_confirm:
            print("Error: Passwords do not match")
            return
        
        # Create user
        user = User(
            username=username,
            email=email if email else None,
            hashed_password=get_password_hash(password),
            is_active=True,
            is_superuser=True
        )
        
        db.add(user)
        db.commit()
        
        print(f"\nSuccess: Admin user '{username}' created")
    
    except Exception as e:
        print(f"Error: {str(e)}")
        db.rollback()
    
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()

