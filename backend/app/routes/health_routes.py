# /backend/app/routes/health_routes.py
from flask import Blueprint, jsonify
import datetime

health_bp = Blueprint('health', __name__)

@health_bp.route('', methods=['GET'])
def health_check():
    """
    Health check endpoint to verify the API is running
    """
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.datetime.utcnow().isoformat(),
        'service': 'RideMatch API',
        'message': 'API is running correctly'
    }), 200