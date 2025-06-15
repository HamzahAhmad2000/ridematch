# /backend/app/controllers/friends_controller.py
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from ..models.friends import Friendship, Companion
import logging

logger = logging.getLogger(__name__)

class FriendsController:
    @staticmethod
    def send_friend_request():
        """Send a friend request to another user"""
        try:
            data = request.get_json()
            sender_id = get_jwt_identity()
            receiver_id = data.get('receiver_id')
            
            if not receiver_id:
                return jsonify({'error': 'Receiver ID is required'}), 400
            
            request_id = Friendship.send_friend_request(sender_id, receiver_id)
            
            return jsonify({
                'message': 'Friend request sent successfully',
                'request_id': request_id
            }), 201
            
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            logger.error(f"Error sending friend request: {str(e)}")
            return jsonify({'error': 'Failed to send friend request'}), 500
    
    @staticmethod
    def get_friend_requests():
        """Get pending friend requests for the current user"""
        try:
            user_id = get_jwt_identity()
            
            # Get both received and sent requests
            received_requests = Friendship.get_pending_requests(user_id)
            sent_requests = Friendship.get_sent_requests(user_id)
            
            return jsonify({
                'received_requests': received_requests,
                'sent_requests': sent_requests
            }), 200
            
        except Exception as e:
            logger.error(f"Error getting friend requests: {str(e)}")
            return jsonify({'error': 'Failed to get friend requests'}), 500
    
    @staticmethod
    def respond_to_friend_request(request_id):
        """Accept or decline a friend request"""
        try:
            data = request.get_json()
            user_id = get_jwt_identity()
            response = data.get('response')  # 'accepted' or 'declined'
            
            if response not in ['accepted', 'declined']:
                return jsonify({'error': 'Response must be "accepted" or "declined"'}), 400
            
            friendship_id = Friendship.respond_to_friend_request(request_id, user_id, response)
            
            if response == 'accepted':
                return jsonify({
                    'message': 'Friend request accepted',
                    'friendship_id': friendship_id
                }), 200
            else:
                return jsonify({
                    'message': 'Friend request declined'
                }), 200
                
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            logger.error(f"Error responding to friend request: {str(e)}")
            return jsonify({'error': 'Failed to respond to friend request'}), 500
    
    @staticmethod
    def get_friends_list():
        """Get the current user's friends list"""
        try:
            user_id = get_jwt_identity()
            friends = Friendship.get_friends_list(user_id)
            
            return jsonify({
                'friends': friends,
                'count': len(friends)
            }), 200
            
        except Exception as e:
            logger.error(f"Error getting friends list: {str(e)}")
            return jsonify({'error': 'Failed to get friends list'}), 500
    
    @staticmethod
    def remove_friend(friend_id):
        """Remove a friend"""
        try:
            user_id = get_jwt_identity()
            
            success = Friendship.remove_friend(user_id, friend_id)
            
            if success:
                return jsonify({'message': 'Friend removed successfully'}), 200
            else:
                return jsonify({'error': 'Friendship not found'}), 404
                
        except Exception as e:
            logger.error(f"Error removing friend: {str(e)}")
            return jsonify({'error': 'Failed to remove friend'}), 500
    
    @staticmethod
    def search_users():
        """Search for users to add as friends"""
        try:
            user_id = get_jwt_identity()
            search_query = request.args.get('q', '').strip()
            
            if len(search_query) < 2:
                return jsonify({'error': 'Search query must be at least 2 characters'}), 400
            
            search_results = Friendship.search_users_for_friends(user_id, search_query)
            
            return jsonify({
                'results': search_results,
                'count': len(search_results)
            }), 200
            
        except Exception as e:
            logger.error(f"Error searching users: {str(e)}")
            return jsonify({'error': 'Failed to search users'}), 500

class CompanionsController:
    @staticmethod
    def get_companions_list():
        """Get companions list (friends available for rides)"""
        try:
            user_id = get_jwt_identity()
            companions = Companion.get_companions_list(user_id)
            
            return jsonify({
                'companions': companions,
                'count': len(companions)
            }), 200
            
        except Exception as e:
            logger.error(f"Error getting companions list: {str(e)}")
            return jsonify({'error': 'Failed to get companions list'}), 500
    
    @staticmethod
    def invite_companion_to_ride():
        """Invite a companion to a ride"""
        try:
            data = request.get_json()
            user_id = get_jwt_identity()
            companion_id = data.get('companion_id')
            ride_id = data.get('ride_id')
            
            if not companion_id or not ride_id:
                return jsonify({'error': 'Companion ID and Ride ID are required'}), 400
            
            invitation_id = Companion.invite_companion_to_ride(user_id, companion_id, ride_id)
            
            return jsonify({
                'message': 'Companion invited successfully',
                'invitation_id': invitation_id
            }), 201
            
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            logger.error(f"Error inviting companion: {str(e)}")
            return jsonify({'error': 'Failed to invite companion'}), 500
    
    @staticmethod
    def get_ride_invitations():
        """Get ride invitations for the current user"""
        try:
            user_id = get_jwt_identity()
            invitations = Companion.get_ride_invitations(user_id)
            
            return jsonify({
                'invitations': invitations,
                'count': len(invitations)
            }), 200
            
        except Exception as e:
            logger.error(f"Error getting ride invitations: {str(e)}")
            return jsonify({'error': 'Failed to get ride invitations'}), 500
    
    @staticmethod
    def respond_to_ride_invitation(invitation_id):
        """Accept or decline a ride invitation"""
        try:
            data = request.get_json()
            user_id = get_jwt_identity()
            response = data.get('response')  # 'accepted' or 'declined'
            
            if response not in ['accepted', 'declined']:
                return jsonify({'error': 'Response must be "accepted" or "declined"'}), 400
            
            success = Companion.respond_to_ride_invitation(invitation_id, user_id, response)
            
            if response == 'accepted':
                return jsonify({
                    'message': 'Ride invitation accepted',
                    'joined_ride': success
                }), 200
            else:
                return jsonify({
                    'message': 'Ride invitation declined'
                }), 200
                
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            logger.error(f"Error responding to ride invitation: {str(e)}")
            return jsonify({'error': 'Failed to respond to ride invitation'}), 500 