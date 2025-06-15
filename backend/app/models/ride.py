# /backend/app/models/ride.py
from .. import mongo
from bson.objectid import ObjectId
from datetime import datetime
from ..utils.geo_utils import GeoUtils

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

    @staticmethod
    def update_driver_location(ride_id, location):
        """Update the driver's current location for an active ride"""
        mongo.db.available_rides.update_one(
            {'ride_id': ride_id},
            {
                '$set': {
                    'location': location,
                    'location_updated_at': datetime.utcnow()
                }
            }
        )
        return True

    @staticmethod
    def get_driver_status(ride_id):
        """Get driver's current location and ETA"""
        ride = mongo.db.rides.find_one({'_id': ObjectId(ride_id)})
        if not ride:
            return None

        available = mongo.db.available_rides.find_one({'ride_id': ride_id})
        if available and available.get('location'):
            location = available['location']
        else:
            location = ride.get('pickup_location')

        dropoff = ride.get('dropoff_location', {})
        eta_minutes = None
        if location and dropoff:
            try:
                distance = GeoUtils.calculate_distance(
                    location.get('coordinates'),
                    dropoff.get('coordinates')
                )
                eta_minutes = int((distance / 40) * 60)
            except Exception:
                eta_minutes = None

        return {
            'status': ride.get('status'),
            'location': location,
            'eta_minutes': eta_minutes
        }

    def complete_ride(ride_id):
        """Mark a ride as completed and move it to ride_history"""
        if not ObjectId.is_valid(ride_id):
            return False

        ride = mongo.db.rides.find_one({'_id': ObjectId(ride_id)})
        if not ride:
            return False

        completed_at = datetime.utcnow()
        duration = 0
        if ride.get('created_at'):
            duration = (completed_at - ride['created_at']).total_seconds() // 60

        ride_history = ride.copy()
        ride_history['completed_at'] = completed_at
        ride_history['duration'] = duration
        ride_history['status'] = 'completed'

        mongo.db.ride_history.insert_one(ride_history)
        mongo.db.rides.delete_one({'_id': ObjectId(ride_id)})
        mongo.db.available_rides.update_one({'ride_id': ride_id}, {'$set': {'active': False}})

        return True

    @staticmethod
    def get_route_order(ride_id, start_coords):
        """Return passengers sorted by distance from start_coords"""
        passengers = list(mongo.db.ride_passengers.find({'ride_id': ride_id}))
        if not passengers:
            return []

        remaining = passengers[:]
        route = []
        current = start_coords

        while remaining:
            nearest = min(
                remaining,
                key=lambda p: GeoUtils.calculate_distance(current, p['pickup_location'].get('coordinates', {}))
            )
            route.append(nearest)
            current = nearest['pickup_location'].get('coordinates', current)
            remaining.remove(nearest)

        return route

