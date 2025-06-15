# /backend/app/controllers/match_controller.py
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from ..models.match import Match
from ..models.user import User
from ..utils.nlp_processor import NLPProcessor
from marshmallow import Schema, fields, ValidationError
from .. import mongo
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Schema for process hobbies request
class ProcessHobbiesSchema(Schema):
    description = fields.Str(required=True)

class MatchController:
    @staticmethod
    def get_companions():
        try:
            user_id = get_jwt_identity()
            
            # Check if user exists
            user = User.get_by_id(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
                
            # Get the best matches for the user
            matches = Match.get_best_matches(user_id)
            
            # If no matches found, compute them now
            if not matches:
                # Get user hobbies
                hobbies = mongo.db.user_hobbies.find_one({'user_id': user_id})
                if hobbies and 'extracted_keywords' in hobbies and hobbies['extracted_keywords']:
                    # Compute matches if we have hobbies data
                    matches = Match.compute_matches(user_id)
                else:
                    # Return empty list if no hobby data to match on
                    return jsonify([]), 200
            
            # Enhance with user details
            enhanced_matches = []
            for match in matches:
                match_user_id = match.get('matched_user_id')
                match_user = User.get_by_id(match_user_id)
                profile = User.get_profile(match_user_id)
                
                if match_user and profile:
                    enhanced_match = {
                        'user_id': match_user_id,
                        'name': match_user.get('name'),
                        'university': profile.get('university'),
                        'gender': match_user.get('gender'),
                        'similarity_score': match.get('similarity_score'),
                        'common_interests': match.get('common_interests')
                    }
                    enhanced_matches.append(enhanced_match)
            
            return jsonify(enhanced_matches), 200
            
        except Exception as e:
            logger.error(f"Error getting companions: {str(e)}")
            return jsonify({'error': 'Failed to get companions', 'details': str(e)}), 500
    
    @staticmethod
    def process_hobbies():
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
                
            # Validate input data
            schema = ProcessHobbiesSchema()
            try:
                validated_data = schema.load(data)
            except ValidationError as err:
                return jsonify({'error': 'Validation error', 'details': err.messages}), 400
            
            user_id = get_jwt_identity()
            description = validated_data.get('description', '')
            
            # Check if user exists
            user = User.get_by_id(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if not description or not description.strip():
                return jsonify({'error': 'Description cannot be empty'}), 400
            
            # Process and store hobbies
            keywords = Match.store_hobbies(user_id, description)
            categories = NLPProcessor.categorize_keywords(keywords)
            
            if not keywords or len(keywords) == 0:
                return jsonify({
                    'message': 'No keywords extracted from description',
                    'keywords': []
                }), 200
            
            # Compute matches
            Match.compute_matches(user_id)

            return jsonify({
                'message': 'Hobbies processed successfully',
                'keywords': keywords,
                'categories': categories
            }), 200
            
        except Exception as e:
            logger.error(f"Error processing hobbies: {str(e)}")
            return jsonify({'error': 'Failed to process hobbies', 'details': str(e)}), 500