from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from ..models.messaging import Message, Conversation
from datetime import datetime

class MessagingController:
    @staticmethod
    def get_conversations():
        """Get all conversations for the current user"""
        try:
            user_id = get_jwt_identity()
            conversations = Conversation.get_user_conversations(user_id)
            
            return jsonify(conversations), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @staticmethod
    def get_messages(user_id):
        """Get messages between current user and specified user"""
        try:
            current_user_id = get_jwt_identity()
            messages = Message.get_conversation_messages(current_user_id, user_id)
            
            return jsonify(messages), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @staticmethod
    def send_message():
        """Send a message to another user"""
        try:
            data = request.get_json()
            sender_id = get_jwt_identity()
            receiver_id = data.get('receiver_id')
            content = data.get('content')
            
            if not receiver_id or not content:
                return jsonify({'error': 'Receiver ID and content are required'}), 400
            
            message = Message.create_message(sender_id, receiver_id, content)
            
            return jsonify({
                'id': str(message['_id']),
                'text': message['content'],
                'sent': True,
                'timestamp': message['timestamp']
            }), 201
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @staticmethod
    def mark_as_read(conversation_id):
        """Mark a conversation as read for the current user"""
        try:
            user_id = get_jwt_identity()
            Conversation.mark_conversation_as_read(conversation_id, user_id)
            
            return jsonify({"message": "Conversation marked as read"}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500 