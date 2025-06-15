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