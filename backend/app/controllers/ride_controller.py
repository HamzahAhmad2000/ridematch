# /backend/app/controllers/ride_controller.py
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from ..models.ride import Ride
from ..models.user import User
from ..schemas.ride_schema import CreateRideSchema, JoinRideSchema, ArrivalStatusSchema, RideStatusSchema
from ..utils.geo_utils import GeoUtils
from marshmallow import ValidationError
from bson import ObjectId
from .. import mongo
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RideController:
    @staticmethod
    def create_ride():
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
                
            # Validate input data
            schema = CreateRideSchema()
            try:
                validated_data = schema.load(data)
            except ValidationError as err:
                return jsonify({'error': 'Validation error', 'details': err.messages}), 400
            
            user_id = get_jwt_identity()
            
            # Add user ID to the data
            validated_data['creator_user_id'] = user_id
            
            # Add sector information if not provided
            if not validated_data.get('sector') and 'pickup_location' in validated_data:
                pickup_coords = validated_data['pickup_location'].get('coordinates', {})
                if pickup_coords:
                    sector = GeoUtils.get_sector_from_coordinates(pickup_coords)
                    validated_data['sector'] = sector
            
            # Create the ride
            ride_id = Ride.create(validated_data)
            
            return jsonify({
                'message': 'Ride created successfully',
                'ride_id': ride_id
            }), 201
            
        except Exception as e:
            logger.error(f"Error creating ride: {str(e)}")
            return jsonify({'error': 'Failed to create ride', 'details': str(e)}), 500
    
    @staticmethod
    def get_available_rides():
        sector = request.args.get('sector', '')
        rides = Ride.get_available_rides(sector)
        
        # Enhance ride data with creator details
        enhanced_rides = []
        for ride in rides:
            ride_id = ride.get('ride_id')
            creator_id = ride.get('creator_user_id')
            
            # Get ride details
            if ObjectId.is_valid(ride_id):
                ride_details = Ride.get_by_id(ride_id)
            else:
                ride_details = {}
            
            # Get creator details
            if creator_id and ObjectId.is_valid(creator_id):
                creator = User.get_by_id(creator_id)
                creator_name = creator.get('name') if creator else 'Unknown Driver'
            else:
                creator_name = 'Unknown Driver'
            
            # Add details to the ride
            ride['creator_name'] = creator_name
            ride['fare'] = ride_details.get('fare') if ride_details else None
            ride['distance'] = ride_details.get('distance') if ride_details else None
            ride['_id'] = str(ride.get('_id'))  # Convert ObjectId to string
            
            enhanced_rides.append(ride)
        
        return jsonify(enhanced_rides), 200
    
    @staticmethod
    def join_ride():
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
                
            # Validate input data
            schema = JoinRideSchema()
            try:
                validated_data = schema.load(data)
            except ValidationError as err:
                return jsonify({'error': 'Validation error', 'details': err.messages}), 400
            
            user_id = get_jwt_identity()
            ride_id = validated_data.get('ride_id')
            pickup_location = validated_data.get('pickup_location')
            group_join = validated_data.get('group_join', False)
            seat_count = int(validated_data.get('seat_count', 1))
            
            # Check if ride exists
            ride = Ride.get_by_id(ride_id)
            if not ride:
                return jsonify({'error': 'Ride not found'}), 404
                
            # Check if user is already joined
            existing_passenger = Ride.get_passenger(ride_id, user_id)
            if existing_passenger:
                return jsonify({'error': 'You have already joined this ride'}), 400
                
            # Check if enough seats are available
            available_ride = mongo.db.available_rides.find_one({'ride_id': ride_id})
            if available_ride and available_ride.get('passenger_slots', 0) < seat_count:
                return jsonify({'error': 'Not enough seats available'}), 400
            
            # Add the passenger to the ride
            passenger_id = Ride.join_ride(ride_id, user_id, pickup_location, group_join, seat_count)
            
            return jsonify({
                'message': 'Ride joined successfully',
                'passenger_id': passenger_id
            }), 200
            
        except Exception as e:
            logger.error(f"Error joining ride: {str(e)}")
            return jsonify({'error': 'Failed to join ride', 'details': str(e)}), 500
    
    @staticmethod
    def set_arrival_status():
        data = request.get_json()
        user_id = get_jwt_identity()
        ride_id = data.get('ride_id')
        has_arrived = data.get('has_arrived', True)
        
        # Update arrival status
        Ride.update_arrival_status(ride_id, user_id, has_arrived)
        
        return jsonify({
            'message': 'Arrival status updated successfully'
        }), 200
    
    @staticmethod
    def update_ride_status():
        data = request.get_json()
        ride_id = data.get('ride_id')
        status = data.get('status')
        
        # Update ride status
        Ride.update_ride_status(ride_id, status)
        
        return jsonify({
            'message': 'Ride status updated successfully'
        }), 200

    @staticmethod
    def complete_ride():
        data = request.get_json()
        ride_id = data.get('ride_id')
        if not ride_id:
            return jsonify({'error': 'ride_id required'}), 400

        success = Ride.complete_ride(ride_id)
        if not success:
            return jsonify({'error': 'Ride not found'}), 404

        return jsonify({'message': 'Ride completed successfully'}), 200

    @staticmethod
    def get_ride_route(ride_id):
        try:
            lat = float(request.args.get('lat'))
            lng = float(request.args.get('lng'))
        except (TypeError, ValueError):
            return jsonify({'error': 'lat and lng query params required'}), 400

        route = Ride.get_route_order(ride_id, {'latitude': lat, 'longitude': lng})

        formatted_route = []
        for p in route:
            user = User.get_by_id(p.get('user_id'))
            formatted_route.append({
                'user_id': p.get('user_id'),
                'name': user.get('name') if user else 'Unknown',
                'pickup_location': p.get('pickup_location'),
                'has_arrived': p.get('has_arrived', False)
            })

        return jsonify(formatted_route), 200
    
    @staticmethod
    def get_ride_details(ride_id):
        ride = Ride.get_by_id(ride_id)

        if not ride:
            return jsonify({'error': 'Ride not found'}), 404

        user_id = get_jwt_identity()

        passengers = Ride.get_ride_passengers(ride_id)

        passenger_list = []
        for p in passengers:
            user = User.get_by_id(p.get('user_id'))
            passenger_list.append({
                'user_id': p.get('user_id'),
                'name': user.get('name') if user else 'Unknown',
                'pickup_location': p.get('pickup_location'),
                'status': p.get('status'),
                'has_arrived': p.get('has_arrived')
            })

        ride_data = {
            'ride_id': str(ride.get('_id')),
            'pickup_location': ride.get('pickup_location'),
            'dropoff_location': ride.get('dropoff_location'),
            'car_type': ride.get('car_type'),
            'payment_method': ride.get('payment_method'),
            'fare': ride.get('fare'),
            'distance': ride.get('distance'),
            'status': ride.get('status'),
            'created_at': ride.get('created_at').isoformat() if ride.get('created_at') else None,
            'passengers': passenger_list,
            'is_driver': ride.get('creator_user_id') == user_id
        }

        
        return jsonify(ride_data), 200

    @staticmethod
    def update_driver_location():
        data = request.get_json()
        schema = DriverLocationSchema()
        try:
            validated = schema.load(data)
        except ValidationError as err:
            return jsonify({'error': 'Validation error', 'details': err.messages}), 400

        ride_id = validated.get('ride_id')
        location = validated.get('location')

        Ride.update_driver_location(ride_id, location)
        return jsonify({'message': 'Location updated'}), 200

    @staticmethod
    def get_driver_status(ride_id):
        status = Ride.get_driver_status(ride_id)
        if not status:
            return jsonify({'error': 'Ride not found'}), 404
        return jsonify(status), 200


