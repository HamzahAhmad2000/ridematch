# /backend/app/schemas/wallet_schema.py
from marshmallow import Schema, fields, validate

class CardDetailsSchema(Schema):
    """Schema for card details"""
    card_number = fields.Str(required=True, validate=validate.Length(min=13, max=19))
    expiry = fields.Str(required=True)
    cvv = fields.Str(required=True, validate=validate.Length(min=3, max=4))
    name_on_card = fields.Str(required=True)

class TopUpSchema(Schema):
    """Schema for wallet top-up"""
    amount = fields.Float(required=True, validate=validate.Range(min=1))
    payment_method = fields.Str(required=True, validate=validate.OneOf(['card', 'cash', 'bank_transfer']))
    card_details = fields.Nested(CardDetailsSchema, required=False)

class PaymentSchema(Schema):
    """Schema for ride payment"""
    ride_id = fields.Str(required=True)
    amount = fields.Float(required=True, validate=validate.Range(min=1))

class TransferSchema(Schema):
    """Schema for wallet balance transfer"""
    to_user_id = fields.Str(required=True)
    amount = fields.Float(required=True, validate=validate.Range(min=1))