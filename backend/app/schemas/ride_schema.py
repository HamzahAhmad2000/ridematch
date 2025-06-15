# /backend/app/schemas/ride_schema.py
from marshmallow import Schema, fields, validate

class LocationSchema(Schema):
    """Schema for location data"""
    address = fields.Str(required=True)
    coordinates = fields.Dict(keys=fields.Str(), values=fields.Float(), required=True)

class CreateRideSchema(Schema):
    """Schema for creating a new ride"""
    pickup_location = fields.Nested(LocationSchema, required=True)
    dropoff_location = fields.Nested(LocationSchema, required=True)
    car_type = fields.Str(required=True, validate=validate.OneOf(['Basic', 'Premium', 'Premium+', 'SUV']))
    passenger_slots = fields.Int(required=True, validate=validate.Range(min=1, max=4))
    match_social = fields.Bool(missing=False)
    time_to_reach = fields.Str(required=True)
    payment_method = fields.Str(required=True, validate=validate.OneOf(['cash', 'card', 'wallet']))
    promo_code = fields.Str(missing='')
    group_join = fields.Bool(missing=False)
    fare = fields.Float(required=True, validate=validate.Range(min=0))
    distance = fields.Float(required=True, validate=validate.Range(min=0))
    sector = fields.Str(missing='')

class JoinRideSchema(Schema):
    """Schema for joining an existing ride"""
    ride_id = fields.Str(required=True)
    pickup_location = fields.Nested(LocationSchema, required=True)
    group_join = fields.Bool(missing=False)
    seat_count = fields.Int(missing=1, validate=validate.Range(min=1, max=4))

class ArrivalStatusSchema(Schema):
    """Schema for updating arrival status"""
    ride_id = fields.Str(required=True)
    has_arrived = fields.Bool(missing=True)

class DriverLocationSchema(Schema):
    """Schema for updating driver location"""
    ride_id = fields.Str(required=True)
    location = fields.Nested(LocationSchema, required=True)

class RideStatusSchema(Schema):
    """Schema for updating ride status"""
    ride_id = fields.Str(required=True)
    status = fields.Str(required=True, validate=validate.OneOf(['created', 'in_progress', 'completed', 'cancelled']))