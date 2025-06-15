# /backend/app/routes/match_routes.py
from flask import Blueprint
from flask_jwt_extended import jwt_required
from ..controllers.match_controller import MatchController

match_bp = Blueprint('match', __name__)

@match_bp.route('/companions', methods=['GET'])
@jwt_required()
def get_companions():
    return MatchController.get_companions()

@match_bp.route('/process-hobbies', methods=['POST'])
@jwt_required()
def process_hobbies():
    return MatchController.process_hobbies()
