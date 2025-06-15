# /backend/app/routes/ride_routes.py
from flask import Blueprint
from flask_jwt_extended import jwt_required
from ..controllers.ride_controller import RideController

ride_bp = Blueprint('ride', __name__)

@ride_bp.route('/create', methods=['POST'])
@jwt_required()
def create_ride():
    return RideController.create_ride()

@ride_bp.route('/available', methods=['GET'])
@jwt_required()
def get_available_rides():
    return RideController.get_available_rides()

@ride_bp.route('/join', methods=['POST'])
@jwt_required()
def join_ride():
    return RideController.join_ride()

@ride_bp.route('/arrival', methods=['POST'])
@jwt_required()
def set_arrival_status():
    return RideController.set_arrival_status()

@ride_bp.route('/status', methods=['POST'])
@jwt_required()
def update_ride_status():
    return RideController.update_ride_status()

@ride_bp.route('/<ride_id>', methods=['GET'])
@jwt_required()
def get_ride_details(ride_id):
    return RideController.get_ride_details(ride_id)