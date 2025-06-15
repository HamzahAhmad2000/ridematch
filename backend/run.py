# /backend/run.py
import os
import sys
import logging
from app import create_app, socketio
from app.config import config_map
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

try:
    # Determine which configuration to use
    config_name = os.environ.get('FLASK_ENV', 'development')
    if config_name not in config_map:
        logger.warning(f"Invalid FLASK_ENV: {config_name}, using default (development)")
        config_name = 'development'
    
    # Get the appropriate configuration class
    selected_config = config_map[config_name]
    logger.info(f"Starting RideMatch API with {config_name} configuration")
    
    # Create the Flask application with the correct configuration
    app = create_app(selected_config)
    
    if __name__ == '__main__':
        port = int(os.environ.get("PORT", 5000))
        
        # Only enable debug mode in development
        debug_mode = config_name == 'development'
        
        logger.info(f"Server running on http://0.0.0.0:{port}/ (Press CTRL+C to quit)")
        socketio.run(app, host='0.0.0.0', port=port, debug=debug_mode)
        
except Exception as e:
    logger.error(f"Failed to start application: {str(e)}")
    sys.exit(1)