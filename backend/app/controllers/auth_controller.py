# /backend/app/controllers/auth_controller.py
from flask import jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity
from ..models.user import User
from ..models.match import Match
from ..schemas.auth_schema import RegisterSchema, LoginSchema, ProfileSchema
from ..utils.security import SecurityUtils
from marshmallow import ValidationError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AuthController:
    @staticmethod
    def register():
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
                
            # Validate input data
            schema = RegisterSchema()
            # try:
            #     validated_data = schema.load(data)
            # except ValidationError as err:
            #     return jsonify({'error': 'Validation error', 'details': err.messages}), 400
            
            # Check if email already exists
            existing_user = User.get_by_email(data.get('email'))
            if existing_user:
                return jsonify({'error': 'Email already in use'}), 400
            
            # Validate password strength
            if not SecurityUtils.validate_password_strength(data.get('password')):
                return jsonify({'error': 'Password is too weak. It must be at least 8 characters and include uppercase, lowercase, and numbers.'}), 400
            
            # Create the user
            user_id = User.create(data)
            
            # Process hobbies & likes for match recommendation if available
            description = data.get('likes', '') + ' ' + data.get('dislikes', '')
            if description.strip():
                Match.store_hobbies(user_id, description)
            
            return jsonify({
                'message': 'User registered successfully',
                'user_id': user_id
            }), 201
            
        except Exception as e:
            logger.error(f"Error registering user: {str(e)}")
            return jsonify({'error': 'Failed to register user', 'details': str(e)}), 500
    
    @staticmethod
    def register_profile():
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
                
            # Validate input data
            schema = ProfileSchema()
            # try:
            #     validated_data = schema.load(data)
            # except ValidationError as err:
            #     return jsonify({'error': 'Validation error', 'details': err.messages}), 400
            
            user_id = data.get('user_id')or data.get('userId')
            
            # Check if user exists
            user = User.get_by_id(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Create user profile
            profile_id = User.create_profile(user_id, data)
            
            # Process hobbies for matching
            description = data.get('likes', '') + ' ' + data.get('dislikes', '')
            if description.strip():
                keywords = Match.store_hobbies(user_id, description)
                
                # Only compute matches if we have keywords to match on
                if keywords and len(keywords) > 0:
                    # Compute initial matches
                    Match.compute_matches(user_id)
            
            return jsonify({
                'message': 'Profile created successfully',
                'profile_id': profile_id
            }), 201
            
        except Exception as e:
            logger.error(f"Error creating profile: {str(e)}")
            return jsonify({'error': 'Failed to create profile', 'details': str(e)}), 500
    
    @staticmethod
    def login():
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
                
            # Validate input data
            schema = LoginSchema()
            try:
                validated_data = schema.load(data)
            except ValidationError as err:
                return jsonify({'error': 'Validation error', 'details': err.messages}), 400
            
            email = validated_data.get('email')
            password = validated_data.get('password')
            
            # Get user by email
            user = User.get_by_email(email)
            
            # Verify credentials
            if not user or not User.check_password(user, password):
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Create tokens
            user_id = str(user.get('_id'))
            access_token = create_access_token(identity=user_id)
            refresh_token = create_refresh_token(identity=user_id)
            
            return jsonify({
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user_id': user_id,
                'name': user.get('name')
            }), 200
            
        except Exception as e:
            logger.error(f"Error during login: {str(e)}")
            return jsonify({'error': 'Login failed', 'details': str(e)}), 500

    @staticmethod
    def refresh_token():
        # Get identity from JWT
        current_user_id = get_jwt_identity()
        
        # Create new access token
        access_token = create_access_token(identity=current_user_id)
        
        return jsonify({
            'access_token': access_token
        }), 200