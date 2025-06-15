# /backend/app/messaging_events.py
from flask import request
from flask_jwt_extended import decode_token
from flask_socketio import emit, join_room, leave_room
from . import socketio
from .models.messaging import Message, Conversation
import logging

logger = logging.getLogger(__name__)

# Store active connections
active_connections = {}

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f'Client connected: {request.sid}')
    emit('connection_status', {'status': 'connected', 'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f'Client disconnected: {request.sid}')
    # Remove from active connections
    user_id = None
    for uid, sid in active_connections.items():
        if sid == request.sid:
            user_id = uid
            break
    
    if user_id:
        del active_connections[user_id]

@socketio.on('authenticate')
def handle_authenticate(data):
    """Authenticate user with JWT token"""
    try:
        token = data.get('token')
        if not token:
            emit('auth_error', {'error': 'No token provided'})
            return
        
        # Decode JWT token to get user ID
        decoded_token = decode_token(token)
        user_id = decoded_token['sub']
        
        # Store the connection
        active_connections[user_id] = request.sid
        
        # Join user to their personal room
        join_room(f"user_{user_id}")
        
        emit('authenticated', {'user_id': user_id})
        logger.info(f'User {user_id} authenticated and joined room')
        
    except Exception as e:
        logger.error(f'Authentication error: {str(e)}')
        emit('auth_error', {'error': 'Invalid token'})

@socketio.on('join_conversation')
def handle_join_conversation(data):
    """Join a conversation room"""
    try:
        conversation_id = data.get('conversation_id')
        if not conversation_id:
            emit('error', {'message': 'Conversation ID required'})
            return
        
        join_room(f"conversation_{conversation_id}")
        emit('joined_conversation', {'conversation_id': conversation_id})
        logger.info(f'Client {request.sid} joined conversation {conversation_id}')
        
    except Exception as e:
        logger.error(f'Error joining conversation: {str(e)}')
        emit('error', {'message': 'Failed to join conversation'})

@socketio.on('send_message')
def handle_send_message(data):
    """Handle new message"""
    try:
        # Get user from active connections
        sender_id = None
        for uid, sid in active_connections.items():
            if sid == request.sid:
                sender_id = uid
                break
        
        if not sender_id:
            emit('error', {'message': 'User not authenticated'})
            return
        
        receiver_id = data.get('receiver_id')
        content = data.get('content')
        
        if not receiver_id or not content:
            emit('error', {'message': 'Receiver ID and content required'})
            return
        
        # Create message in database
        message_data = Message.create_message(sender_id, receiver_id, content)
        
        # Get or create conversation
        conversation = Conversation.get_or_create_conversation(sender_id, receiver_id)
        conversation_id = str(conversation['_id'])
        
        # Format message for clients
        formatted_message = {
            'id': str(message_data['_id']),
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'content': content,
            'timestamp': message_data['timestamp'].isoformat(),
            'conversation_id': conversation_id
        }
        
        # Emit to conversation room
        socketio.emit('new_message', formatted_message, room=f"conversation_{conversation_id}")
        
        # Also emit to both users' personal rooms
        socketio.emit('message_notification', {
            'conversation_id': conversation_id,
            'message': formatted_message
        }, room=f"user_{receiver_id}")
        
        logger.info(f'Message sent from {sender_id} to {receiver_id}')
        
    except Exception as e:
        logger.error(f'Error sending message: {str(e)}')
        emit('error', {'message': 'Failed to send message'})

@socketio.on('mark_conversation_read')
def handle_mark_read(data):
    """Mark conversation as read"""
    try:
        # Get user from active connections
        user_id = None
        for uid, sid in active_connections.items():
            if sid == request.sid:
                user_id = uid
                break
        
        if not user_id:
            emit('error', {'message': 'User not authenticated'})
            return
        
        conversation_id = data.get('conversation_id')
        if not conversation_id:
            emit('error', {'message': 'Conversation ID required'})
            return
        
        # Mark conversation as read
        Conversation.mark_conversation_as_read(conversation_id, user_id)
        
        emit('conversation_marked_read', {'conversation_id': conversation_id})
        logger.info(f'Conversation {conversation_id} marked as read by {user_id}')
        
    except Exception as e:
        logger.error(f'Error marking conversation as read: {str(e)}')
        emit('error', {'message': 'Failed to mark conversation as read'})

@socketio.on('typing')
def handle_typing(data):
    """Handle typing indicators"""
    try:
        conversation_id = data.get('conversation_id')
        is_typing = data.get('is_typing', False)
        
        # Get user from active connections
        user_id = None
        for uid, sid in active_connections.items():
            if sid == request.sid:
                user_id = uid
                break
        
        if not user_id or not conversation_id:
            return
        
        # Emit typing status to conversation room (excluding sender)
        socketio.emit('user_typing', {
            'user_id': user_id,
            'is_typing': is_typing,
            'conversation_id': conversation_id
        }, room=f"conversation_{conversation_id}", include_self=False)
        
    except Exception as e:
        logger.error(f'Error handling typing: {str(e)}') 