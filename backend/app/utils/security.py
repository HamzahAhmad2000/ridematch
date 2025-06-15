# /backend/app/utils/security.py
from werkzeug.security import generate_password_hash, check_password_hash
import re
from datetime import datetime, timedelta

class SecurityUtils:
    @staticmethod
    def hash_password(password):
        """Hash a password using Werkzeug's generate_password_hash"""
        return generate_password_hash(password)
    
    @staticmethod
    def check_password(password_hash, password):
        """Verify a password against its hash using Werkzeug's check_password_hash"""
        return check_password_hash(password_hash, password)
    
    @staticmethod
    def validate_password_strength(password):
        """
        Validate that a password meets strength requirements
        
        Requirements:
        - At least 8 characters long
        - Contains at least one lowercase letter
        - Contains at least one uppercase letter
        - Contains at least one digit
        """
        if len(password) < 8:
            return False
        if not re.search("[a-z]", password):
            return False
        if not re.search("[A-Z]", password):
            return False
        if not re.search("[0-9]", password):
            return False
        return True
    
    @staticmethod
    def validate_phone_number(phone):
        """
        Validate that a phone number is in a valid format
        
        Valid formats:
        - +1234567890
        - 1234567890
        - Must be between 9 and 15 digits
        """
        pattern = re.compile(r'^\+?[0-9]{9,15}$')
        return bool(pattern.match(phone))
    
    @staticmethod
    def validate_email(email):
        """Validate that an email is in a valid format"""
        pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        return bool(pattern.match(email))
    
    @staticmethod
    def is_token_expired(token_timestamp, expiry_hours=24):
        """
        Check if a token is expired based on its timestamp
        
        Args:
            token_timestamp: Datetime object when the token was created
            expiry_hours: Number of hours until token expiry (default: 24)
            
        Returns:
            True if token is expired, False otherwise
        """
        expiry_time = token_timestamp + timedelta(hours=expiry_hours)
        return datetime.utcnow() > expiry_time