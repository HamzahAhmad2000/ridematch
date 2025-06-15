# /backend/app/controllers/ride_history_controller.py
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from ..models.ride_history import RideHistory
from ..models.ride import Ride
from marshmallow import Schema, fields, ValidationError
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Schema for rating a ride
class RateRideSchema(Schema):
    ride_id = fields.Str(required=True)
    rating = fields.Int(required=True, validate=lambda n: 1 <= n <= 5)
    feedback = fields.Str(required=False)

class RideHistoryController:
    @staticmethod
    def get_ride_history():
        user_id = get_jwt_identity()
        
        # Parse filter parameters
        filters = {}
        
        status = request.args.get('status')
        if status and status != 'all':
            filters['status'] = status
        
        start_date_str = request.args.get('startDate')
        if start_date_str:
            try:
                filters['startDate'] = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
            except ValueError:
                pass
        
        end_date_str = request.args.get('endDate')
        if end_date_str:
            try:
                filters['endDate'] = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
            except ValueError:
                pass
        
        payment_method = request.args.get('paymentMethod')
        if payment_method and payment_method != 'all':
            filters['paymentMethod'] = payment_method
        
        ride_history = RideHistory.get_ride_history(user_id, filters)
        
        return jsonify(ride_history), 200
    
    @staticmethod
    def get_ride_details(ride_id):
        user_id = get_jwt_identity()
        
        ride = RideHistory.get_ride_details(ride_id, user_id)
        
        if not ride:
            return jsonify({'error': 'Ride not found'}), 404
        
        return jsonify(ride), 200
    
    @staticmethod
    def rate_ride(ride_id):
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
                
            user_id = get_jwt_identity()
            
            rating = data.get('rating')
            feedback = data.get('feedback')
            
            if not rating:
                return jsonify({'error': 'Rating is required'}), 400
            
            # Check if rating is within valid range
            if rating < 1 or rating > 5:
                return jsonify({'error': 'Rating must be between 1 and 5'}), 400
            
            # Check if ride exists
            ride = Ride.get_by_id(ride_id)
            if not ride and not RideHistory.get_ride_details(ride_id):
                return jsonify({'error': 'Ride not found'}), 404
            
            # Check if user was part of the ride
            passenger = Ride.get_passenger(ride_id, user_id)
            is_creator = ride and ride.get('creator_user_id') == user_id
            
            if not (passenger or is_creator):
                return jsonify({'error': 'You were not part of this ride'}), 403
            
            success = RideHistory.rate_ride(ride_id, user_id, rating, feedback)
            
            if not success:
                return jsonify({'error': 'Failed to rate ride'}), 400
            
            return jsonify({'success': True}), 200
            
        except Exception as e:
            logger.error(f"Error rating ride: {str(e)}")
            return jsonify({'error': 'Failed to rate ride', 'details': str(e)}), 500