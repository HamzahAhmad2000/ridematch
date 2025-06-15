# /backend/app/config.py
import os
from datetime import timedelta

class Config:
    """Base configuration for the application"""
    # Secret key for signing cookies and session data
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    
    # MongoDB connection URI
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/ridematch'
    
    # JWT authentication settings - Extended for long-term usage
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)  # 30 days instead of 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=180)  # 6 months instead of 30 days
    
    # CORS settings - More permissive for development
    CORS_HEADERS = 'Content-Type'
    CORS_ORIGINS = ['*']  # Allow all origins in development
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']
    
    # File upload settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max file size

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    # More permissive CORS for development
    CORS_ORIGINS = ['*']
    CORS_SUPPORTS_CREDENTIALS = True

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    MONGO_URI = 'mongodb://localhost:27017/ridematch_test'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    
    # In production, these should be set as environment variables
    SECRET_KEY = os.environ.get('SECRET_KEY')
    MONGO_URI = os.environ.get('MONGO_URI') 
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    
    # Long-term tokens in production as well
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)  # 30 days
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=180)  # 6 months
    
    # Restrict CORS in production
    CORS_ORIGINS = ['https://yourdomain.com']

# Map environment names to config classes
config_map = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}