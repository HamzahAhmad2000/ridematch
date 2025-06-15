# /backend/app/__init__.py
from flask import Flask, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from .config import Config
import os

mongo = PyMongo()
jwt = JWTManager()
socketio = SocketIO()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions with more permissive CORS
    CORS(app, 
         origins=app.config.get('CORS_ORIGINS', ['*']),
         methods=app.config.get('CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
         allow_headers=app.config.get('CORS_ALLOW_HEADERS', ['Content-Type', 'Authorization']),
         supports_credentials=app.config.get('CORS_SUPPORTS_CREDENTIALS', True))
    
    mongo.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", logger=True, engineio_logger=True)
    
    # JWT error handlers for better token expiration handling
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Authentication expired',
            'message': 'Token has expired. Please log in again.'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'error': 'Invalid token',
            'message': 'Token is invalid. Please log in again.'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'error': 'Authorization required',
            'message': 'Request does not contain an access token.'
        }), 401

    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Fresh token required',
            'message': 'The token is not fresh.'
        }), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Token revoked',
            'message': 'The token has been revoked.'
        }), 401
    
    # Configure static file serving for uploads
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        from flask import send_from_directory
        return send_from_directory(os.path.join(app.root_path, '..', 'uploads'), filename)
    
    # Add a simple health check endpoint with CORS headers
    @app.route('/api/health', methods=['GET', 'OPTIONS'])
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'RideMatch API is running'})
    
    # Register blueprints
    from .routes.auth_routes import auth_bp
    from .routes.user_routes import user_bp
    from .routes.ride_routes import ride_bp
    from .routes.match_routes import match_bp
    from .routes.wallet_routes import wallet_bp
    from .routes.ride_history_routes import ride_history_bp
    from .routes.health_routes import health_bp
    from .routes.messaging_routes import messaging_bp
    from .routes.safety_routes import safety_bp
    from .routes.driver_routes import driver_bp
    from .routes.friends_routes import friends_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(ride_bp, url_prefix='/api/rides')
    app.register_blueprint(match_bp, url_prefix='/api/matches')
    app.register_blueprint(wallet_bp, url_prefix='/api/wallet')
    app.register_blueprint(ride_history_bp, url_prefix='/api/ride-history')
    app.register_blueprint(health_bp, url_prefix='/api/health')
    app.register_blueprint(messaging_bp, url_prefix='/api/messaging')
    app.register_blueprint(safety_bp, url_prefix='/api/safety')
    app.register_blueprint(driver_bp, url_prefix='/api/drivers')
    app.register_blueprint(friends_bp, url_prefix='/api/friends')
    
    # Import messaging events to register socket handlers
    from . import messaging_events

    return app