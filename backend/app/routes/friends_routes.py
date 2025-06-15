from flask import Blueprint
from flask_jwt_extended import jwt_required
from ..controllers.friends_controller import FriendsController, CompanionsController

friends_bp = Blueprint('friends', __name__)

# Friend request endpoints
@friends_bp.route('/requests/send', methods=['POST'])
@jwt_required()
def send_friend_request():
    return FriendsController.send_friend_request()

@friends_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_friend_requests():
    return FriendsController.get_friend_requests()

@friends_bp.route('/requests/<request_id>/respond', methods=['PUT'])
@jwt_required()
def respond_to_friend_request(request_id):
    return FriendsController.respond_to_friend_request(request_id)

# Friends management endpoints
@friends_bp.route('/', methods=['GET'])
@jwt_required()
def get_friends_list():
    return FriendsController.get_friends_list()

@friends_bp.route('/<friend_id>', methods=['DELETE'])
@jwt_required()
def remove_friend(friend_id):
    return FriendsController.remove_friend(friend_id)

@friends_bp.route('/search', methods=['GET'])
@jwt_required()
def search_users():
    return FriendsController.search_users()

# Companions endpoints
@friends_bp.route('/companions', methods=['GET'])
@jwt_required()
def get_companions_list():
    return CompanionsController.get_companions_list()

@friends_bp.route('/companions/invite', methods=['POST'])
@jwt_required()
def invite_companion_to_ride():
    return CompanionsController.invite_companion_to_ride()

@friends_bp.route('/invitations', methods=['GET'])
@jwt_required()
def get_ride_invitations():
    return CompanionsController.get_ride_invitations()

@friends_bp.route('/invitations/<invitation_id>/respond', methods=['PUT'])
@jwt_required()
def respond_to_ride_invitation(invitation_id):
    return CompanionsController.respond_to_ride_invitation(invitation_id) 