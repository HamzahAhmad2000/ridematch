# /backend/app/routes/user_routes.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.user import User

user_bp = Blueprint('user', __name__)

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.get_by_id(user_id)
    profile = User.get_profile(user_id)
    
    if not user or not profile:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user_id': user_id,
        'name': user.get('name'),
        'email': user.get('email'),
        'university': profile.get('university'),
        'gender': user.get('gender'),
        'gender_preference': profile.get('gender_preference'),
        'emergency_contact': profile.get('emergency_contact'),
        'likes': profile.get('likes'),
        'dislikes': profile.get('dislikes')
    }), 200

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    User.update_profile(user_id, data)
    
    return jsonify({
        'message': 'Profile updated successfully'
    }), 200