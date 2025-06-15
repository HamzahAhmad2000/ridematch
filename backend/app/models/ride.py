# /backend/app/models/ride.py
from .. import mongo
from bson.objectid import ObjectId
from datetime import datetime

class Ride:
    @staticmethod
    def create(data):
        """Create a new ride"""
        ride = {
            'creator_user_id': data.get('creator_user_id'),
            'pickup_location': data.get('pickup_location'),
            'dropoff_location': data.get('dropoff_location'),
            'car_type': data.get('car_type'),
            'passenger_slots': data.get('passenger_slots', 1),
            'payment_method': data.get('payment_method'),
            'promo_code': data.get('promo_code', ''),
            'group_join': data.get('group_join', False),
            'fare': data.get('fare', 0),
            'distance': data.get('distance', 0),
            'sector': data.get('sector', ''),
            'status': 'created',
            'created_at': datetime.utcnow(),
            'match_social': data.get('match_social', False)
        }
        
        result = mongo.db.rides.insert_one(ride)
        ride_id = str(result.inserted_id)
        
        # Add to available rides
        available_ride = {
            'ride_id': ride_id,
            'creator_user_id': data.get('creator_user_id'),
            'location': data.get('pickup_location'),
            'sector': data.get('sector', ''),
            'car_type': data.get('car_type'),
            'passenger_slots': data.get('passenger_slots', 1),
            'group_join': data.get('group_join', False),
            'created_at': datetime.utcnow(),
            'active': True
        }
        
        mongo.db.available_rides.insert_one(available_ride)
        
        return ride_id
    
    @staticmethod
    def get_available_rides(sector=''):
        """Get available rides, optionally filtered by sector"""
        query = {'active': True}
        
        if sector:
            query['sector'] = sector
        
        rides = list(mongo.db.available_rides.find(query).sort('created_at', -1))
        return rides
    
    @staticmethod
    def join_ride(ride_id, user_id, pickup_location, group_join=False, seat_count=1):
        """Add a passenger to a ride"""
        passenger = {
            'ride_id': ride_id,
            'user_id': user_id,
            'pickup_location': pickup_location,
            'has_arrived': False,
            'group_join': group_join,
            'seat_count': seat_count,
            'status': 'awaiting_pickup',
            'joined_at': datetime.utcnow()
        }
        
        result = mongo.db.ride_passengers.insert_one(passenger)
        passenger_id = str(result.inserted_id)
        
        # Update available slots in available_rides
        available_ride = mongo.db.available_rides.find_one({'ride_id': ride_id})
        
        if available_ride:
            updated_slots = max(0, available_ride.get('passenger_slots', 0) - seat_count)
            
            mongo.db.available_rides.update_one(
                {'ride_id': ride_id},
                {'$set': {'passenger_slots': updated_slots}}
            )
            
            # If no slots left, mark as inactive
            if updated_slots == 0:
                mongo.db.available_rides.update_one(
                    {'ride_id': ride_id},
                    {'$set': {'active': False}}
                )
        
        return passenger_id
    
    @staticmethod
    def update_arrival_status(ride_id, user_id, has_arrived):
        """Update passenger arrival status"""
        mongo.db.ride_passengers.update_one(
            {'ride_id': ride_id, 'user_id': user_id},
            {'$set': {'has_arrived': has_arrived}}
        )
        return True
    
    @staticmethod
    def update_ride_status(ride_id, status):
        """Update ride status"""
        mongo.db.rides.update_one(
            {'_id': ObjectId(ride_id)},
            {'$set': {'status': status}}
        )
        
        if status in ['completed', 'cancelled']:
            # Mark as inactive in available rides
            mongo.db.available_rides.update_one(
                {'ride_id': ride_id},
                {'$set': {'active': False}}
            )
        
        return True
    
    @staticmethod
    def get_by_id(ride_id):
        """Get ride by ID"""
        if not ObjectId.is_valid(ride_id):
            return None
        
        ride = mongo.db.rides.find_one({'_id': ObjectId(ride_id)})
        return ride
    
    @staticmethod
    def get_ride_passengers(ride_id):
        """Get all passengers for a ride"""
        passengers = list(mongo.db.ride_passengers.find({'ride_id': ride_id}))
        return passengers
        
    @staticmethod
    def get_passenger(ride_id, user_id):
        """Check if a specific user is a passenger on a ride"""
        passenger = mongo.db.ride_passengers.find_one({'ride_id': ride_id, 'user_id': user_id})
        return passenger