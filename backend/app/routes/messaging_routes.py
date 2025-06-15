# /backend/app/routes/messaging_routes.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..controllers.messaging_controller import MessagingController

messaging_bp = Blueprint('messaging', __name__)

@messaging_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    return MessagingController.get_conversations()

@messaging_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_messages(user_id):
    return MessagingController.get_messages(user_id)

@messaging_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    return MessagingController.send_message()

@messaging_bp.route('/conversations/<conversation_id>/read', methods=['PUT'])
@jwt_required()
def mark_conversation_as_read(conversation_id):
    return MessagingController.mark_as_read(conversation_id) 