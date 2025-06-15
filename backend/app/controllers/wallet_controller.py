# /backend/app/controllers/wallet_controller.py
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from ..models.wallet import Wallet
from ..models.ride import Ride
from ..schemas.wallet_schema import TopUpSchema, PaymentSchema, TransferSchema
from marshmallow import ValidationError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WalletController:
    @staticmethod
    def get_wallet_info():
        user_id = get_jwt_identity()
        wallet_info = Wallet.get_wallet_info(user_id)
        
        # Format transactions for response
        formatted_transactions = []
        
        for tx in wallet_info.get('transactions', []):
            formatted_tx = {
                'id': str(tx.get('_id')),
                'user_id': tx.get('user_id'),
                'amount': tx.get('amount'),
                'type': tx.get('type'),
                'description': tx.get('description'),
                'payment_method': tx.get('payment_method', ''),
                'ride_id': tx.get('ride_id', ''),
                'timestamp': tx.get('transaction_date').isoformat() if tx.get('transaction_date') else '',
                'status': tx.get('status')
            }
            
            formatted_transactions.append(formatted_tx)
        
        return jsonify({
            'balance': wallet_info.get('balance', 0),
            'transactions': formatted_transactions
        }), 200
    
    @staticmethod
    def top_up_wallet():
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
                
            # Validate input data
            schema = TopUpSchema()
            try:
                validated_data = schema.load(data)
            except ValidationError as err:
                return jsonify({'error': 'Validation error', 'details': err.messages}), 400
            
            user_id = get_jwt_identity()
            
            amount = validated_data.get('amount')
            payment_method = validated_data.get('payment_method')
            card_details = validated_data.get('card_details')
            
            # Additional validation for card payments
            if payment_method == 'card' and not card_details:
                return jsonify({'error': 'Card details are required for card payments'}), 400
            
            result = Wallet.top_up_wallet(user_id, amount, payment_method, card_details)
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"Error topping up wallet: {str(e)}")
            return jsonify({'error': 'Failed to top up wallet', 'details': str(e)}), 500
    
    @staticmethod
    def pay_for_ride():
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
                
            # Validate input data
            schema = PaymentSchema()
            try:
                validated_data = schema.load(data)
            except ValidationError as err:
                return jsonify({'error': 'Validation error', 'details': err.messages}), 400
            
            user_id = get_jwt_identity()
            
            ride_id = validated_data.get('ride_id')
            amount = validated_data.get('amount')
            
            # Verify the ride exists
            ride = Ride.get_by_id(ride_id)
            if not ride:
                return jsonify({'error': 'Ride not found'}), 404
                
            # Verify the user is part of the ride
            is_creator = ride.get('creator_user_id') == user_id
            is_passenger = bool(Ride.get_passenger(ride_id, user_id))
            
            if not (is_creator or is_passenger):
                return jsonify({'error': 'You are not part of this ride'}), 403
            
            result = Wallet.pay_for_ride(user_id, ride_id, amount)
            
            return jsonify(result), 200 if result.get('success') else 400
            
        except Exception as e:
            logger.error(f"Error processing payment: {str(e)}")
            return jsonify({'error': 'Failed to process payment', 'details': str(e)}), 500

    @staticmethod
    def transfer_balance():
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            schema = TransferSchema()
            try:
                validated = schema.load(data)
            except ValidationError as err:
                return jsonify({'error': 'Validation error', 'details': err.messages}), 400

            from_user = get_jwt_identity()
            to_user = validated.get('to_user_id')
            amount = validated.get('amount')

            result = Wallet.transfer_balance(from_user, to_user, amount)
            return jsonify(result), 200 if result.get('success') else 400

        except Exception as e:
            logger.error(f"Error transferring balance: {str(e)}")
            return jsonify({'error': 'Failed to transfer balance', 'details': str(e)}), 500

    @staticmethod
    def get_statement():
        try:
            user_id = get_jwt_identity()
            transactions = Wallet.get_statement(user_id)
            formatted = [
                {
                    'id': str(tx.get('_id')),
                    'amount': tx.get('amount'),
                    'type': tx.get('type'),
                    'description': tx.get('description'),
                    'payment_method': tx.get('payment_method', ''),
                    'ride_id': tx.get('ride_id', ''),
                    'timestamp': tx.get('transaction_date').isoformat() if tx.get('transaction_date') else '',
                    'status': tx.get('status')
                } for tx in transactions
            ]
            low_balance = Wallet.is_low_balance(user_id)
            return jsonify({'transactions': formatted, 'low_balance': low_balance}), 200
        except Exception as e:
            logger.error(f"Error generating statement: {str(e)}")
            return jsonify({'error': 'Failed to get statement', 'details': str(e)}), 500
