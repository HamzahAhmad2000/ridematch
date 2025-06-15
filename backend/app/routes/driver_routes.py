from flask import Blueprint
from flask_jwt_extended import jwt_required
from ..controllers.driver_controller import DriverController
from ..utils.decorators import admin_required

driver_bp = Blueprint('driver', __name__)

@driver_bp.route('/apply', methods=['POST'])
@jwt_required()
def apply_for_driver():
    """Submit a driver application"""
    return DriverController.submit_application()

@driver_bp.route('/status', methods=['GET'])
@jwt_required()
def get_application_status():
    """Get the status of user's driver application"""
    return DriverController.get_application_status()

@driver_bp.route('/applications', methods=['GET'])
@admin_required
def get_pending_applications():
    """Get all pending driver applications for admin review"""
    return DriverController.get_pending_applications()

@driver_bp.route('/applications/<application_id>', methods=['PUT'])
@admin_required
def review_application(application_id):
    """Review a driver application (approve/reject)"""
    return DriverController.review_application(application_id) 