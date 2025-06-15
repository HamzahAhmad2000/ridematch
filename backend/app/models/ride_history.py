# /backend/app/models/ride_history.py
from .. import mongo
from bson.objectid import ObjectId
from datetime import datetime

class RideHistory:
    @staticmethod
    def get_ride_history(user_id, filters=None):
        """Get ride history for a user with optional filters"""
        if filters is None:
            filters = {}
        
        # Build query
        query = {'$or': [
            {'creator_user_id': user_id},  # Rides created by user (as driver)
            {'user_id': user_id}  # Rides joined by user (as passenger)
        ]}
        
        # Apply status filter
        if 'status' in filters and filters['status'] != 'all':
            query['status'] = filters['status']
        
        # Apply date filters
        if 'startDate' in filters or 'endDate' in filters:
            date_query = {}
            
            if 'startDate' in filters:
                date_query['$gte'] = filters['startDate']
            
            if 'endDate' in filters:
                date_query['$lte'] = filters['endDate']
            
            if date_query:
                query['created_at'] = date_query
        
        # Get rides from both rides and ride_history collections
        active_rides = list(mongo.db.rides.find(query))
        past_rides = list(mongo.db.ride_history.find(query))
        
        # Combine and format results
        ride_history = []
        
        # Process active rides
        for ride in active_rides:
            # Get driver info
            driver_id = ride.get('creator_user_id')
            driver = mongo.db.users.find_one({'_id': ObjectId(driver_id)}) if ObjectId.is_valid(driver_id) else None
            
            # Format ride data
            ride_data = {
                'id': str(ride.get('_id')),
                'date': ride.get('created_at').isoformat() if 'created_at' in ride else '',
                'pickup_location': ride.get('pickup_location', {}),
                'dropoff_location': ride.get('dropoff_location', {}),
                'status': ride.get('status', 'unknown'),
                'driver': {
                    'id': str(driver.get('_id')) if driver else '',
                    'name': driver.get('name', 'Unknown Driver') if driver else 'Unknown Driver',
                    'rating': 0  # No rating available for ongoing rides
                },
                'fare': ride.get('fare', 0),
                'distance': ride.get('distance', 0),
                'duration': 0,  # Duration not available for ongoing rides
                'car_type': ride.get('car_type', ''),
                'payment_status': 'pending',
                'payment_method': ride.get('payment_method', '')
            }
            
            ride_history.append(ride_data)
        
        # Process past rides
        for ride in past_rides:
            # Get driver info
            driver_id = ride.get('creator_user_id')
            driver = mongo.db.users.find_one({'_id': ObjectId(driver_id)}) if ObjectId.is_valid(driver_id) else None
            
            # Format ride data
            ride_data = {
                'id': str(ride.get('_id')),
                'date': ride.get('completed_at').isoformat() if 'completed_at' in ride else '',
                'pickup_location': ride.get('pickup_location', {}),
                'dropoff_location': ride.get('dropoff_location', {}),
                'status': 'completed',
                'driver': {
                    'id': str(driver.get('_id')) if driver else '',
                    'name': driver.get('name', 'Unknown Driver') if driver else 'Unknown Driver',
                    'rating': ride.get('driver_rating', 0)
                },
                'fare': ride.get('fare', 0),
                'distance': ride.get('distance', 0),
                'duration': ride.get('duration', 0),
                'car_type': ride.get('car_type', ''),
                'payment_status': 'paid',
                'payment_method': ride.get('payment_method', ''),
                'rating': ride.get('user_rating'),
                'user_feedback': ride.get('user_feedback')
            }
            
            ride_history.append(ride_data)
        
        # Apply payment method filter
        if 'paymentMethod' in filters and filters['paymentMethod'] != 'all':
            ride_history = [ride for ride in ride_history if ride['payment_method'] == filters['paymentMethod']]
        
        # Sort by date, newest first
        ride_history.sort(key=lambda x: x['date'], reverse=True)
        
        return ride_history
    
    @staticmethod
    def get_ride_details(ride_id, user_id=None):
        """Get detailed information about a specific ride"""
        # Check in both active and history collections
        ride = None
        
        if ObjectId.is_valid(ride_id):
            ride = mongo.db.rides.find_one({'_id': ObjectId(ride_id)})
            
            if not ride:
                ride = mongo.db.ride_history.find_one({'_id': ObjectId(ride_id)})
        
        if not ride:
            return None
        
        # Get driver info
        driver_id = ride.get('creator_user_id')
        driver = mongo.db.users.find_one({'_id': ObjectId(driver_id)}) if ObjectId.is_valid(driver_id) else None
        
        # Format ride data
        ride_data = {
            'id': str(ride.get('_id')),
            'date': ride.get('created_at').isoformat() if 'created_at' in ride else '',
            'pickup_location': ride.get('pickup_location', {}),
            'dropoff_location': ride.get('dropoff_location', {}),
            'status': ride.get('status', 'unknown'),
            'driver': {
                'id': str(driver.get('_id')) if driver else '',
                'name': driver.get('name', 'Unknown Driver') if driver else 'Unknown Driver',
                'rating': ride.get('driver_rating', 0)
            },
            'fare': ride.get('fare', 0),
            'distance': ride.get('distance', 0),
            'duration': ride.get('duration', 0),
            'car_type': ride.get('car_type', ''),
            'payment_status': 'paid' if ride.get('status') == 'completed' else 'pending',
            'payment_method': ride.get('payment_method', ''),
            'rating': ride.get('user_rating'),
            'user_feedback': ride.get('user_feedback')
        }
        
        return ride_data
    
    @staticmethod
    def rate_ride(ride_id, user_id, rating, feedback=None):
        """Submit a rating for a completed ride"""
        if not ObjectId.is_valid(ride_id):
            return False
        
        # Check if ride exists and user was part of it
        ride = mongo.db.rides.find_one({
            '_id': ObjectId(ride_id),
            '$or': [
                {'creator_user_id': user_id},  # User was driver
                {'user_id': user_id}  # User was passenger
            ]
        })
        
        if not ride:
            ride = mongo.db.ride_history.find_one({
                '_id': ObjectId(ride_id),
                '$or': [
                    {'creator_user_id': user_id},  # User was driver
                    {'user_id': user_id}  # User was passenger
                ]
            })
        
        if not ride:
            return False
        
        # Update rating in ride_history
        update_data = {'user_rating': rating}
        
        if feedback:
            update_data['user_feedback'] = feedback
        
        if ride.get('status') == 'completed':
            # Ride already in history
            mongo.db.ride_history.update_one(
                {'_id': ObjectId(ride_id)},
                {'$set': update_data}
            )
        else:
            # Ride still active, move to history first
            ride_data = ride.copy()
            ride_data['_id'] = ObjectId(ride_id)
            ride_data.update(update_data)
            
            mongo.db.ride_history.insert_one(ride_data)
            mongo.db.rides.delete_one({'_id': ObjectId(ride_id)})
        
        return True

    @staticmethod
    def get_ride_receipt(ride_id, user_id=None):
        """Return a ride receipt with passenger fare share"""
        ride = RideHistory.get_ride_details(ride_id, user_id)
        if not ride:
            return None
        passengers = list(mongo.db.ride_passengers.find({'ride_id': ride_id}))
        ride['passengers'] = []
        total_seats = 0
        for p in passengers:
            seat_count = p.get('seat_count', 1)
            ride['passengers'].append({
                'user_id': p.get('user_id'),
                'seat_count': seat_count
            })
            total_seats += seat_count
        if total_seats <= 0:
            total_seats = 1
        for p in ride['passengers']:
            share = round(ride['fare'] * p['seat_count'] / total_seats, 2)
            p['fare_share'] = share
        return ride

    @staticmethod
    def reuse_ride(ride_id, user_id):
        """Create a new ride from a past ride"""
        if not ObjectId.is_valid(ride_id):
            return None
        old = mongo.db.ride_history.find_one({'_id': ObjectId(ride_id)})
        if not old:
            return None
        data = {
            'creator_user_id': user_id,
            'pickup_location': old.get('pickup_location'),
            'dropoff_location': old.get('dropoff_location'),
            'car_type': old.get('car_type'),
            'passenger_slots': old.get('passenger_slots', 1),
            'payment_method': old.get('payment_method'),
            'promo_code': '',
            'group_join': False,
            'fare': old.get('fare', 0),
            'distance': old.get('distance', 0),
            'sector': old.get('sector', ''),
            'match_social': False,
            'time_to_reach': old.get('time_to_reach', '')
        }
        from .ride import Ride
        return Ride.create(data)

    @staticmethod
    def get_statistics(user_id):
        """Return ride statistics for a user"""
        query = {'$or': [
            {'creator_user_id': user_id},
            {'user_id': user_id}
        ]}
        active = list(mongo.db.rides.find(query))
        past = list(mongo.db.ride_history.find(query))
        all_rides = active + past
        total_rides = len(all_rides)
        completed = [r for r in past]
        total_distance = sum(r.get('distance', 0) for r in all_rides)
        total_spent = sum(r.get('fare', 0) for r in completed)
        avg_fare = total_spent / len(completed) if completed else 0
        ratings = [r.get('user_rating') for r in past if r.get('user_rating')]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        return {
            'total_rides': total_rides,
            'completed_rides': len(completed),
            'total_distance': total_distance,
            'total_spent': total_spent,
            'average_fare': avg_fare,
            'average_rating': avg_rating
        }
