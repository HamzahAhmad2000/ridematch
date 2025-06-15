from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..controllers.safety_controller import SafetyController

safety_bp = Blueprint('safety', __name__)

@safety_bp.route('/report', methods=['POST'])
@jwt_required()
def submit_report():
    return SafetyController.submit_report()

@safety_bp.route('/upload-evidence', methods=['POST'])
@jwt_required()
def upload_evidence():
    return SafetyController.upload_evidence() 