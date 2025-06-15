# /backend/app/models/wallet.py
from .. import mongo
from bson.objectid import ObjectId
from datetime import datetime

class Wallet:
    @staticmethod
    def get_wallet_info(user_id):
        """Get wallet information and transaction history for a user"""
        # Get or create wallet
        wallet = mongo.db.wallet.find_one({'user_id': user_id})
        
        if not wallet:
            # Create a new wallet with zero balance
            wallet_id = Wallet.create_wallet(user_id)
            wallet = mongo.db.wallet.find_one({'_id': ObjectId(wallet_id)})
        
        # Get transactions
        transactions = list(mongo.db.transactions.find(
            {'user_id': user_id}
        ).sort('transaction_date', -1))
        
        return {
            'balance': wallet.get('balance', 0),
            'transactions': transactions
        }
    
    @staticmethod
    def create_wallet(user_id):
        """Create a new wallet for a user"""
        wallet = {
            'user_id': user_id,
            'balance': 0,
            'updated_at': datetime.utcnow()
        }
        
        result = mongo.db.wallet.insert_one(wallet)
        return str(result.inserted_id)
    
    @staticmethod
    def top_up_wallet(user_id, amount, payment_method, card_details=None):
        """Add money to wallet"""
        # Get or create wallet
        wallet = mongo.db.wallet.find_one({'user_id': user_id})
        
        if not wallet:
            wallet_id = Wallet.create_wallet(user_id)
            wallet = mongo.db.wallet.find_one({'_id': ObjectId(wallet_id)})
        
        # Create transaction record
        transaction = {
            'user_id': user_id,
            'amount': amount,
            'type': 'topup',
            'description': 'Added money to wallet',
            'payment_method': payment_method,
            'transaction_date': datetime.utcnow(),
            'status': 'completed'
        }
        
        # Add card details if provided
        if card_details:
            transaction['card_details'] = {
                'last_four': card_details.get('card_number', '')[-4:] if card_details.get('card_number') else '',
                'expiry': card_details.get('expiry', ''),
                'name': card_details.get('name_on_card', '')
            }
        
        # Insert transaction
        transaction_result = mongo.db.transactions.insert_one(transaction)
        
        # Update wallet balance
        new_balance = wallet.get('balance', 0) + amount
        
        mongo.db.wallet.update_one(
            {'user_id': user_id},
            {
                '$set': {
                    'balance': new_balance,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        return {
            'success': True,
            'message': 'Successfully added money to wallet',
            'transaction_id': str(transaction_result.inserted_id)
        }
    
    @staticmethod
    def pay_for_ride(user_id, ride_id, amount):
        """Process payment for a ride from wallet"""
        # Get wallet
        wallet = mongo.db.wallet.find_one({'user_id': user_id})
        
        if not wallet:
            return {
                'success': False,
                'message': 'Wallet not found'
            }
        
        # Check if sufficient balance
        current_balance = wallet.get('balance', 0)
        
        if current_balance < amount:
            return {
                'success': False,
                'message': 'Insufficient balance'
            }
        
        # Create transaction record
        transaction = {
            'user_id': user_id,
            'ride_id': ride_id,
            'amount': -amount,  # Negative for payment
            'type': 'payment',
            'description': 'Payment for ride',
            'payment_method': 'wallet',
            'transaction_date': datetime.utcnow(),
            'status': 'completed'
        }
        
        # Insert transaction
        transaction_result = mongo.db.transactions.insert_one(transaction)
        
        # Update wallet balance
        new_balance = current_balance - amount
        
        mongo.db.wallet.update_one(
            {'user_id': user_id},
            {
                '$set': {
                    'balance': new_balance,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        return {
            'success': True,
            'message': 'Payment successful',
            'transaction_id': str(transaction_result.inserted_id)
        }