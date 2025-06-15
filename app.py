import os
import stripe
from flask import Flask, redirect, request, render_template, jsonify
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
YOUR_DOMAIN = 'http://localhost:5000'

app = Flask(__name__, static_folder='static', template_folder='templates')

@app.route('/')
def index():
    public_key = os.getenv('STRIPE_PUBLIC_KEY')
    return render_template('index.html', public_key=public_key)

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'pkr',
                        'product_data': {'name': 'Test Payment'},
                        'unit_amount': 20000,
                    },
                    'quantity': 1,
                },
            ],
            mode='payment',
            success_url=YOUR_DOMAIN + '/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=YOUR_DOMAIN + '/cancel',
        )
        return jsonify({'id': checkout_session.id})
    except Exception as e:
        print(f"Error creating checkout session: {e}")
        return jsonify(error={'message': 'Could not create checkout session'}), 500

@app.route('/success')
def success():
    session_id = request.args.get('session_id')
    return f"<h1>Thanks for your order!</h1><p>Checkout Session ID: {session_id}</p><p><a href='/'>Go Home</a></p>"

@app.route('/cancel')
def cancel():
    return "<h1>Payment Cancelled.</h1><p>Your order was not processed.</p><p><a href='/'>Go Home</a></p>"

if __name__ == '__main__':
    app.run(port=5000, debug=True)
