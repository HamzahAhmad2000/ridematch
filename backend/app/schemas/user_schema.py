from marshmallow import Schema, fields, validate

class UserProfileSchema(Schema):
    university = fields.Str(required=True)
    emergency_contact = fields.Str(required=True)
    gender_preference = fields.List(fields.Str(), validate=validate.ContainsOnly(['male', 'female', 'any']))
    likes = fields.Str(required=True)
    dislikes = fields.Str(required=True)
    student_card_url = fields.Str(required=True, validate=validate.URL())
    sector = fields.Str(missing='')
