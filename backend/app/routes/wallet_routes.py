# /backend/app/routes/wallet_routes.py
from flask import Blueprint
from flask_jwt_extended import jwt_required
from ..controllers.wallet_controller import WalletController

wallet_bp = Blueprint('wallet', __name__)

@wallet_bp.route('/info', methods=['GET'])
@jwt_required()
def get_wallet_info():
    return WalletController.get_wallet_info()

@wallet_bp.route('/topup', methods=['POST'])
@jwt_required()
def top_up_wallet():
    return WalletController.top_up_wallet()

@wallet_bp.route('/pay', methods=['POST'])
@jwt_required()
def pay_for_ride():
    return WalletController.pay_for_ride()

@wallet_bp.route('/transfer', methods=['POST'])
@jwt_required()
def transfer_balance():
    return WalletController.transfer_balance()

@wallet_bp.route('/statement', methods=['GET'])
@jwt_required()
def get_statement():
    return WalletController.get_statement()
