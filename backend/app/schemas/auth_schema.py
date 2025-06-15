# /backend/app/schemas/auth_schema.py
from marshmallow import Schema, fields, validate

class RegisterSchema(Schema):
    """Schema for user registration"""
    name = fields.Str(required=True, validate=validate.Length(min=2))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))
    dateOfBirth = fields.Date(required=True)
    gender = fields.Str(required=True, validate=validate.OneOf(['male', 'female', 'other']))

class LoginSchema(Schema):
    """Schema for user login"""
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class ProfileSchema(Schema):
    """Schema for user profile registration"""
    university = fields.Str(required=True)
    emergencyContact = fields.Str(required=True)
    genderPreference = fields.Str(required=True, validate=validate.OneOf(['male', 'female', 'any']))
    likes = fields.Str(required=True)
    dislikes = fields.Str(required=True)
    studentCardURL = fields.Str(allow_none=True)
    user_id = fields.Str(required=True)