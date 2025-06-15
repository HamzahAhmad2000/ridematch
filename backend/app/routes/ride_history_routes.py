# /backend/app/routes/ride_history_routes.py
from flask import Blueprint
from flask_jwt_extended import jwt_required
from ..controllers.ride_history_controller import RideHistoryController

ride_history_bp = Blueprint('ride_history', __name__)

@ride_history_bp.route('/history', methods=['GET'])
@jwt_required()
def get_ride_history():
    return RideHistoryController.get_ride_history()

@ride_history_bp.route('/<ride_id>', methods=['GET'])
@jwt_required()
def get_ride_details(ride_id):
    return RideHistoryController.get_ride_details(ride_id)

@ride_history_bp.route('/<ride_id>/rate', methods=['POST'])
@jwt_required()
def rate_ride(ride_id):
    return RideHistoryController.rate_ride(ride_id)

@ride_history_bp.route('/<ride_id>/receipt', methods=['GET'])
@jwt_required()
def get_receipt(ride_id):
    return RideHistoryController.get_ride_receipt(ride_id)

@ride_history_bp.route('/<ride_id>/reuse', methods=['POST'])
@jwt_required()
def reuse_ride(ride_id):
    return RideHistoryController.reuse_ride(ride_id)

@ride_history_bp.route('/history/statistics', methods=['GET'])
@jwt_required()
def ride_statistics():
    return RideHistoryController.get_statistics()
