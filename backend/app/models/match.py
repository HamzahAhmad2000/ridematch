# /backend/app/models/match.py
from .. import mongo
from ..utils.nlp_processor import NLPProcessor
from bson.objectid import ObjectId
from datetime import datetime

class Match:
    @staticmethod
    def store_hobbies(user_id, description):
        """Extract keywords from user's description and store as hobbies"""
        # Extract keywords using NLP
        keywords = NLPProcessor.extract_keywords(description)
        categories = NLPProcessor.categorize_keywords(keywords)

        # Store as CSV
        keywords_csv = ','.join(keywords)
        categories_csv = ','.join(categories)
        
        # Check if entry already exists
        existing = mongo.db.user_hobbies.find_one({'user_id': user_id})
        
        if existing:
            mongo.db.user_hobbies.update_one(
                {'user_id': user_id},
                {
                    '$set': {
                        'raw_description': description,
                        'extracted_keywords': keywords,
                        'extracted_csv': keywords_csv,
                        'categories': categories,
                        'categories_csv': categories_csv,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
        else:
            mongo.db.user_hobbies.insert_one({
                'user_id': user_id,
                'raw_description': description,
                'extracted_keywords': keywords,
                'extracted_csv': keywords_csv,
                'categories': categories,
                'categories_csv': categories_csv,
                'created_at': datetime.utcnow()
            })
        
        return keywords
    
    @staticmethod
    def compute_matches(user_id):
        """Compute top 50 best matches for a user based on hobbies"""
        # Get the user's hobbies
        user_hobbies = mongo.db.user_hobbies.find_one({'user_id': user_id})
        
        if not user_hobbies or 'extracted_keywords' not in user_hobbies:
            return []
        
        user_keywords = set(user_hobbies.get('extracted_keywords', []))
        
        # Get all other users' hobbies
        all_user_hobbies = list(mongo.db.user_hobbies.find({'user_id': {'$ne': user_id}}))
        
        # Compute similarity scores
        matches = []
        
        for other_user in all_user_hobbies:
            other_keywords = set(other_user.get('extracted_keywords', []))
            
            # Skip if no keywords
            if not other_keywords:
                continue
            
            # Calculate Jaccard similarity
            intersection = user_keywords.intersection(other_keywords)
            union = user_keywords.union(other_keywords)
            
            similarity = len(intersection) / len(union) if union else 0
            
            # Prepare match data
            match = {
                'matched_user_id': other_user.get('user_id'),
                'similarity_score': similarity,
                'common_interests': list(intersection)
            }
            
            matches.append(match)
        
        # Sort by similarity score and take top 50
        matches.sort(key=lambda x: x['similarity_score'], reverse=True)
        top_matches = matches[:50]
        
        # Store in user_best_matches
        existing = mongo.db.user_best_matches.find_one({'user_id': user_id})
        
        if existing:
            mongo.db.user_best_matches.update_one(
                {'user_id': user_id},
                {
                    '$set': {
                        'matches': top_matches,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
        else:
            mongo.db.user_best_matches.insert_one({
                'user_id': user_id,
                'matches': top_matches,
                'updated_at': datetime.utcnow()
            })
        
        return top_matches
    
    @staticmethod
    def get_best_matches(user_id):
        """Get the precomputed best matches for a user"""
        user_matches = mongo.db.user_best_matches.find_one({'user_id': user_id})

        if not user_matches:
            return []

        return user_matches.get('matches', [])

    @staticmethod
    def update_all_user_hobbies():
        """Reprocess stored hobby descriptions for all users"""
        all_hobbies = list(mongo.db.user_hobbies.find())

        for entry in all_hobbies:
            user_id = entry.get('user_id')
            description = entry.get('raw_description', '')
            if not user_id or not description:
                continue

            # Re-extract keywords and categories
            keywords = NLPProcessor.extract_keywords(description)
            categories = NLPProcessor.categorize_keywords(keywords)

            keywords_csv = ','.join(keywords)
            categories_csv = ','.join(categories)

            mongo.db.user_hobbies.update_one(
                {'user_id': user_id},
                {
                    '$set': {
                        'extracted_keywords': keywords,
                        'extracted_csv': keywords_csv,
                        'categories': categories,
                        'categories_csv': categories_csv,
                        'updated_at': datetime.utcnow()
                    }
                }
            )

            # Recompute matches for the user
            Match.compute_matches(user_id)

