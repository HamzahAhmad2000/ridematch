from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from ..models.driver import DriverApplication
from ..models.user import User
from marshmallow import ValidationError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DriverController:
    @staticmethod
    def submit_application():
        """Submit a driver application"""
        try:
            user_id = get_jwt_identity()
            data = request.get_json()
            
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            # Check if user exists
            user = User.get_by_id(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Prevent duplicate applications
            existing_application = DriverApplication.get_application_by_user(user_id)
            if existing_application:
                return jsonify({"error": "You have already submitted an application."}), 400
            
            # Validate required fields
            required_fields = ["license_number", "license_expiry", "license_image_url", 
                             "vehicle_make", "vehicle_model", "vehicle_year", "license_plate", "vehicle_reg_url"]
            
            for field in required_fields:
                if not data.get(field):
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            # Create the application
            app_id = DriverApplication.create_application(user_id, data)
            
            return jsonify({
                "message": "Application submitted successfully", 
                "application_id": app_id
            }), 201
            
        except ValueError as e:
            logger.error(f"Date validation error in driver application: {str(e)}")
            return jsonify({"error": "Invalid date format. Please use YYYY-MM-DD format."}), 400
        except Exception as e:
            logger.error(f"Error submitting driver application: {str(e)}")
            return jsonify({"error": "Failed to submit application", "details": str(e)}), 500

    @staticmethod
    def get_application_status():
        """Get the status of user's driver application"""
        try:
            user_id = get_jwt_identity()
            application = DriverApplication.get_application_by_user(user_id)
            
            if not application:
                return jsonify({"status": "not_submitted"}), 200
            
            return jsonify({
                "status": application.get("status"),
                "submitted_at": application.get("submitted_at").isoformat() if application.get("submitted_at") else None,
                "reviewed_at": application.get("reviewed_at").isoformat() if application.get("reviewed_at") else None,
                "admin_notes": application.get("admin_notes", "")
            }), 200
            
        except Exception as e:
            logger.error(f"Error getting application status: {str(e)}")
            return jsonify({"error": "Failed to get application status", "details": str(e)}), 500

    @staticmethod
    def get_pending_applications():
        """Get all pending driver applications for admin review"""
        try:
            applications = DriverApplication.get_pending_applications()
            
            # Format applications with user information
            formatted_applications = []
            for app in applications:
                user = User.get_by_id(app.get("user_id"))
                
                formatted_app = {
                    "id": str(app["_id"]),
                    "user_id": app.get("user_id"),
                    "user_name": user.get("name") if user else "Unknown",
                    "user_email": user.get("email") if user else "Unknown",
                    "license_number": app.get("license_number"),
                    "license_expiry": app.get("license_expiry").isoformat() if app.get("license_expiry") else None,
                    "license_image_url": app.get("license_image_url"),
                    "vehicle_make": app.get("vehicle_make"),
                    "vehicle_model": app.get("vehicle_model"),
                    "vehicle_year": app.get("vehicle_year"),
                    "license_plate": app.get("license_plate"),
                    "vehicle_reg_url": app.get("vehicle_reg_url"),
                    "status": app.get("status"),
                    "submitted_at": app.get("submitted_at").isoformat() if app.get("submitted_at") else None
                }
                formatted_applications.append(formatted_app)
            
            return jsonify(formatted_applications), 200
            
        except Exception as e:
            logger.error(f"Error getting pending applications: {str(e)}")
            return jsonify({"error": "Failed to get pending applications", "details": str(e)}), 500

    @staticmethod
    def review_application(application_id):
        """Review a driver application (approve/reject)"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            status = data.get("status")
            admin_notes = data.get("admin_notes", "")
            
            if status not in ["approved", "rejected"]:
                return jsonify({"error": "Invalid status. Must be 'approved' or 'rejected'"}), 400
            
            # Check if application exists
            application = DriverApplication.get_application_by_id(application_id)
            if not application:
                return jsonify({"error": "Application not found"}), 404
            
            # Update application status
            success = DriverApplication.update_application_status(application_id, status, admin_notes)
            
            if success:
                return jsonify({"message": f"Application {status} successfully"}), 200
            else:
                return jsonify({"error": "Failed to update application status"}), 500
                
        except Exception as e:
            logger.error(f"Error reviewing application: {str(e)}")
            return jsonify({"error": "Failed to review application", "details": str(e)}), 500 