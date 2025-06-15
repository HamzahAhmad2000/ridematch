# /backend/app/models/user.py
from .. import mongo
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
from datetime import datetime

class User:
    @staticmethod
    def create(data):
        """Create a new user with basic info"""
        user = {
            'name': data.get('name'),
            'email': data.get('email'),
            'password_hash': generate_password_hash(data.get('password')),
            'gender': data.get('gender', ''),
            'date_of_birth': data.get('dateOfBirth', ''),
            'role': 'user',  # Default role
            'created_at': datetime.utcnow(),
            'is_verified': False
        }
        
        result = mongo.db.users.insert_one(user)
        return str(result.inserted_id)
    
    @staticmethod
    def create_profile(user_id, data):
        """Create or update user profile with additional information"""
        profile = {
            'user_id': user_id,
            'university': data.get('university', ''),
            'emergency_contact': data.get('emergencyContact', ''),
            'gender_preference': data.get('genderPreference', ''),
            'likes': data.get('likes', ''),
            'dislikes': data.get('dislikes', ''),
            'student_card_url': data.get('studentCardURL', ''),
            'is_student_verified': False,
            'created_at': datetime.utcnow(),
            'sector': data.get('sector', '')
        }
        
        # Check if profile already exists
        existing_profile = mongo.db.user_profiles.find_one({'user_id': user_id})
        
        if existing_profile:
            mongo.db.user_profiles.update_one(
                {'user_id': user_id},
                {'$set': profile}
            )
            return str(existing_profile['_id'])
        else:
            result = mongo.db.user_profiles.insert_one(profile)
            return str(result.inserted_id)
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        if not ObjectId.is_valid(user_id):
            return None
        
        user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        return user
    
    @staticmethod
    def get_by_email(email):
        """Get user by email"""
        user = mongo.db.users.find_one({'email': email})
        return user
    
    @staticmethod
    def get_profile(user_id):
        """Get user profile by user ID"""
        if not ObjectId.is_valid(user_id):
            return None
        
        profile = mongo.db.user_profiles.find_one({'user_id': user_id})
        return profile
    
    @staticmethod
    def update_profile(user_id, data):
        """Update user profile"""
        # Update user data
        if 'name' in data or 'gender' in data:
            update_data = {}
            if 'name' in data:
                update_data['name'] = data['name']
            if 'gender' in data:
                update_data['gender'] = data['gender']
            
            mongo.db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_data}
            )
        
        # Update profile data
        profile_update = {}
        profile_fields = ['university', 'emergency_contact', 'gender_preference', 'likes', 'dislikes']
        
        for field in profile_fields:
            if field in data:
                profile_update[field] = data[field]
        
        if profile_update:
            mongo.db.user_profiles.update_one(
                {'user_id': user_id},
                {'$set': profile_update}
            )
        
        return True
    
    @staticmethod
    def check_password(user, password):
        """Verify password for user"""
        if not user or 'password_hash' not in user:
            return False
        
        return check_password_hash(user['password_hash'], password)