from datetime import datetime
from bson import ObjectId
from .. import mongo

class Friendship:
    @staticmethod
    def send_friend_request(sender_id, receiver_id):
        """Send a friend request"""
        # Check if users are the same
        if sender_id == receiver_id:
            raise ValueError("Cannot send friend request to yourself")
        
        # Check if request already exists
        existing_request = mongo.db.friend_requests.find_one({
            '$or': [
                {'sender_id': sender_id, 'receiver_id': receiver_id},
                {'sender_id': receiver_id, 'receiver_id': sender_id}
            ]
        })
        
        if existing_request:
            raise ValueError("Friend request already exists")
        
        # Check if already friends
        existing_friendship = mongo.db.friendships.find_one({
            'participants': {'$all': [sender_id, receiver_id]}
        })
        
        if existing_friendship:
            raise ValueError("Users are already friends")
        
        # Create friend request
        request_data = {
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'status': 'pending',
            'created_at': datetime.utcnow()
        }
        
        result = mongo.db.friend_requests.insert_one(request_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_pending_requests(user_id):
        """Get pending friend requests for a user"""
        requests = mongo.db.friend_requests.find({
            'receiver_id': user_id,
            'status': 'pending'
        }).sort('created_at', -1)
        
        formatted_requests = []
        for req in requests:
            # Get sender info
            sender_info = mongo.db.users.find_one({'_id': ObjectId(req['sender_id'])})
            
            if sender_info:
                formatted_requests.append({
                    'id': str(req['_id']),
                    'sender_id': req['sender_id'],
                    'sender_name': sender_info.get('name', 'Unknown User'),
                    'sender_email': sender_info.get('email', ''),
                    'created_at': req['created_at'].isoformat(),
                    'status': req['status']
                })
        
        return formatted_requests
    
    @staticmethod
    def get_sent_requests(user_id):
        """Get friend requests sent by a user"""
        requests = mongo.db.friend_requests.find({
            'sender_id': user_id,
            'status': 'pending'
        }).sort('created_at', -1)
        
        formatted_requests = []
        for req in requests:
            # Get receiver info
            receiver_info = mongo.db.users.find_one({'_id': ObjectId(req['receiver_id'])})
            
            if receiver_info:
                formatted_requests.append({
                    'id': str(req['_id']),
                    'receiver_id': req['receiver_id'],
                    'receiver_name': receiver_info.get('name', 'Unknown User'),
                    'receiver_email': receiver_info.get('email', ''),
                    'created_at': req['created_at'].isoformat(),
                    'status': req['status']
                })
        
        return formatted_requests
    
    @staticmethod
    def respond_to_friend_request(request_id, user_id, response):
        """Accept or decline a friend request"""
        if response not in ['accepted', 'declined']:
            raise ValueError("Response must be 'accepted' or 'declined'")
        
        # Get the friend request
        friend_request = mongo.db.friend_requests.find_one({
            '_id': ObjectId(request_id),
            'receiver_id': user_id,
            'status': 'pending'
        })
        
        if not friend_request:
            raise ValueError("Friend request not found or not pending")
        
        # Update request status
        mongo.db.friend_requests.update_one(
            {'_id': ObjectId(request_id)},
            {
                '$set': {
                    'status': response,
                    'responded_at': datetime.utcnow()
                }
            }
        )
        
        # If accepted, create friendship
        if response == 'accepted':
            friendship_data = {
                'participants': sorted([friend_request['sender_id'], friend_request['receiver_id']]),
                'created_at': datetime.utcnow(),
                'status': 'active'
            }
            
            result = mongo.db.friendships.insert_one(friendship_data)
            return str(result.inserted_id)
        
        return None
    
    @staticmethod
    def get_friends_list(user_id):
        """Get all friends for a user"""
        friendships = mongo.db.friendships.find({
            'participants': user_id,
            'status': 'active'
        })
        
        friends_list = []
        for friendship in friendships:
            # Get the other participant (friend)
            friend_id = None
            for participant in friendship['participants']:
                if participant != user_id:
                    friend_id = participant
                    break
            
            if friend_id:
                # Get friend info
                friend_info = mongo.db.users.find_one({'_id': ObjectId(friend_id)})
                
                if friend_info:
                    friends_list.append({
                        'friendship_id': str(friendship['_id']),
                        'user_id': friend_id,
                        'name': friend_info.get('name', 'Unknown User'),
                        'email': friend_info.get('email', ''),
                        'created_at': friendship['created_at'].isoformat()
                    })
        
        return friends_list
    
    @staticmethod
    def remove_friend(user_id, friend_id):
        """Remove a friend/end friendship"""
        result = mongo.db.friendships.delete_one({
            'participants': {'$all': [user_id, friend_id]},
            'status': 'active'
        })
        
        return result.deleted_count > 0
    
    @staticmethod
    def search_users_for_friends(user_id, search_query):
        """Search for users to add as friends"""
        # Search by name or email (case insensitive)
        search_regex = {'$regex': search_query, '$options': 'i'}
        
        users = mongo.db.users.find({
            '$and': [
                {'_id': {'$ne': ObjectId(user_id)}},  # Exclude current user
                {
                    '$or': [
                        {'name': search_regex},
                        {'email': search_regex}
                    ]
                }
            ]
        }).limit(10)
        
        # Get current friends and pending requests to filter them out
        current_friends = set()
        friendships = mongo.db.friendships.find({
            'participants': user_id,
            'status': 'active'
        })
        
        for friendship in friendships:
            for participant in friendship['participants']:
                if participant != user_id:
                    current_friends.add(participant)
        
        # Get pending requests
        pending_requests = set()
        requests = mongo.db.friend_requests.find({
            '$or': [
                {'sender_id': user_id, 'status': 'pending'},
                {'receiver_id': user_id, 'status': 'pending'}
            ]
        })
        
        for req in requests:
            if req['sender_id'] != user_id:
                pending_requests.add(req['sender_id'])
            if req['receiver_id'] != user_id:
                pending_requests.add(req['receiver_id'])
        
        search_results = []
        for user in users:
            user_id_str = str(user['_id'])
            
            # Skip if already friends or has pending request
            if user_id_str not in current_friends and user_id_str not in pending_requests:
                search_results.append({
                    'user_id': user_id_str,
                    'name': user.get('name', 'Unknown User'),
                    'email': user.get('email', ''),
                    'can_add': True
                })
        
        return search_results

class Companion:
    @staticmethod
    def get_companions_list(user_id):
        """Get companions list (friends available for ride invites)"""
        return Friendship.get_friends_list(user_id)
    
    @staticmethod
    def invite_companion_to_ride(user_id, companion_id, ride_id):
        """Invite a companion to a ride"""
        # Check if they are friends
        friendship = mongo.db.friendships.find_one({
            'participants': {'$all': [user_id, companion_id]},
            'status': 'active'
        })
        
        if not friendship:
            raise ValueError("Can only invite friends as companions")
        
        # Check if ride exists
        ride = mongo.db.rides.find_one({'_id': ObjectId(ride_id)})
        if not ride:
            raise ValueError("Ride not found")
        
        # Check if invitation already exists
        existing_invite = mongo.db.ride_invitations.find_one({
            'ride_id': ride_id,
            'invitee_id': companion_id,
            'status': 'pending'
        })
        
        if existing_invite:
            raise ValueError("Invitation already sent")
        
        # Create invitation
        invitation_data = {
            'ride_id': ride_id,
            'inviter_id': user_id,
            'invitee_id': companion_id,
            'status': 'pending',
            'created_at': datetime.utcnow()
        }
        
        result = mongo.db.ride_invitations.insert_one(invitation_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_ride_invitations(user_id):
        """Get ride invitations for a user"""
        invitations = mongo.db.ride_invitations.find({
            'invitee_id': user_id,
            'status': 'pending'
        }).sort('created_at', -1)
        
        formatted_invitations = []
        for invite in invitations:
            # Get ride info
            ride_info = mongo.db.rides.find_one({'_id': ObjectId(invite['ride_id'])})
            # Get inviter info
            inviter_info = mongo.db.users.find_one({'_id': ObjectId(invite['inviter_id'])})
            
            if ride_info and inviter_info:
                formatted_invitations.append({
                    'id': str(invite['_id']),
                    'ride_id': invite['ride_id'],
                    'inviter_name': inviter_info.get('name', 'Unknown User'),
                    'ride_from': ride_info.get('from_location', ''),
                    'ride_to': ride_info.get('to_location', ''),
                    'ride_date': ride_info.get('date', ''),
                    'ride_time': ride_info.get('time', ''),
                    'created_at': invite['created_at'].isoformat()
                })
        
        return formatted_invitations
    
    @staticmethod
    def respond_to_ride_invitation(invitation_id, user_id, response):
        """Accept or decline a ride invitation"""
        if response not in ['accepted', 'declined']:
            raise ValueError("Response must be 'accepted' or 'declined'")
        
        # Get invitation
        invitation = mongo.db.ride_invitations.find_one({
            '_id': ObjectId(invitation_id),
            'invitee_id': user_id,
            'status': 'pending'
        })
        
        if not invitation:
            raise ValueError("Invitation not found or not pending")
        
        # Update invitation status
        mongo.db.ride_invitations.update_one(
            {'_id': ObjectId(invitation_id)},
            {
                '$set': {
                    'status': response,
                    'responded_at': datetime.utcnow()
                }
            }
        )
        
        # If accepted, add user to ride (implement ride joining logic)
        if response == 'accepted':
            # This would integrate with the ride joining system
            # For now, just return success
            return True
        
        return False 