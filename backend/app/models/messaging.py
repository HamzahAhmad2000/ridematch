from datetime import datetime
from bson import ObjectId
from .. import mongo

class Message:
    @staticmethod
    def create_message(sender_id, receiver_id, content):
        """Create a new message"""
        message_data = {
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'content': content,
            'timestamp': datetime.utcnow(),
            'read': False
        }
        
        result = mongo.db.messages.insert_one(message_data)
        message_data['_id'] = result.inserted_id
        
        # Update or create conversation
        Conversation.update_conversation(sender_id, receiver_id, content)
        
        return message_data
    
    @staticmethod
    def get_conversation_messages(user1_id, user2_id, limit=50):
        """Get messages between two users"""
        messages = mongo.db.messages.find({
            '$or': [
                {'sender_id': user1_id, 'receiver_id': user2_id},
                {'sender_id': user2_id, 'receiver_id': user1_id}
            ]
        }).sort('timestamp', 1).limit(limit)
        
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                'id': str(msg['_id']),
                'text': msg['content'],
                'sent': msg['sender_id'] == user1_id,
                'timestamp': msg['timestamp']
            })
        
        return formatted_messages
    
    @staticmethod
    def mark_as_read(message_id):
        """Mark a message as read"""
        mongo.db.messages.update_one(
            {'_id': ObjectId(message_id)},
            {'$set': {'read': True}}
        )

class Conversation:
    @staticmethod
    def get_user_conversations(user_id):
        """Get all conversations for a user"""
        conversations = mongo.db.conversations.find({
            'participants': user_id
        }).sort('last_message_time', -1)
        
        formatted_conversations = []
        for conv in conversations:
            # Get the other participant
            other_user_id = None
            for participant in conv['participants']:
                if participant != user_id:
                    other_user_id = participant
                    break
            
            if other_user_id:
                # Get user info
                user_info = mongo.db.users.find_one({'_id': ObjectId(other_user_id)})
                
                formatted_conversations.append({
                    'id': str(conv['_id']),
                    'user_id': other_user_id,
                    'name': user_info.get('name', 'Unknown User') if user_info else 'Unknown User',
                    'lastMessage': conv.get('last_message', ''),
                    'timestamp': conv.get('last_message_time', datetime.utcnow()).isoformat(),
                    'unread': conv.get('unread_count', {}).get(user_id, 0) > 0
                })
        
        return formatted_conversations
    
    @staticmethod
    def update_conversation(user1_id, user2_id, last_message):
        """Update or create a conversation"""
        participants = sorted([user1_id, user2_id])
        
        mongo.db.conversations.update_one(
            {'participants': participants},
            {
                '$set': {
                    'participants': participants,
                    'last_message': last_message,
                    'last_message_time': datetime.utcnow()
                },
                '$inc': {f'unread_count.{user2_id}': 1}
            },
            upsert=True
        )
    
    @staticmethod
    def get_or_create_conversation(user1_id, user2_id):
        """Get or create a conversation between two users"""
        participants = sorted([user1_id, user2_id])
        
        conversation = mongo.db.conversations.find_one({'participants': participants})
        
        if not conversation:
            # Create new conversation
            conversation_data = {
                'participants': participants,
                'last_message': '',
                'last_message_time': datetime.utcnow(),
                'unread_count': {user1_id: 0, user2_id: 0}
            }
            result = mongo.db.conversations.insert_one(conversation_data)
            conversation_data['_id'] = result.inserted_id
            return conversation_data
        
        return conversation
    
    @staticmethod
    def mark_conversation_as_read(conversation_id, user_id):
        """Reset the unread count for a specific user in a conversation"""
        mongo.db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {f"unread_count.{user_id}": 0}}
        ) 