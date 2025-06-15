from .. import mongo
from bson.objectid import ObjectId
from datetime import datetime

class DriverApplication:
    @staticmethod
    def create_application(user_id, data):
        """Creates a new driver application."""
        application = {
            "user_id": user_id,
            "license_number": data.get("license_number"),
            "license_expiry": datetime.strptime(data.get("license_expiry"), "%Y-%m-%d"),
            "license_image_url": data.get("license_image_url"),
            "vehicle_make": data.get("vehicle_make"),
            "vehicle_model": data.get("vehicle_model"),
            "vehicle_year": data.get("vehicle_year"),
            "license_plate": data.get("license_plate"),
            "vehicle_reg_url": data.get("vehicle_reg_url"),
            "status": "pending",  # Can be 'pending', 'approved', 'rejected'
            "submitted_at": datetime.utcnow(),
            "reviewed_at": None,
            "admin_notes": ""
        }
        result = mongo.db.driver_applications.insert_one(application)
        return str(result.inserted_id)

    @staticmethod
    def get_application_by_user(user_id):
        """Gets a user's driver application."""
        application = mongo.db.driver_applications.find_one({"user_id": user_id})
        return application

    @staticmethod
    def get_pending_applications():
        """Gets all pending driver applications for admin review."""
        applications = list(mongo.db.driver_applications.find({"status": "pending"}))
        return applications

    @staticmethod
    def update_application_status(application_id, status, admin_notes=""):
        """Updates the status of a driver application."""
        if not ObjectId.is_valid(application_id):
            return None
            
        update_data = {
            "status": status,
            "reviewed_at": datetime.utcnow(),
            "admin_notes": admin_notes
        }
        
        result = mongo.db.driver_applications.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            # If approved, update the user's role to driver
            if status == "approved":
                application = mongo.db.driver_applications.find_one({"_id": ObjectId(application_id)})
                if application:
                    user_id = application.get("user_id")
                    mongo.db.users.update_one(
                        {"_id": ObjectId(user_id)}, 
                        {"$set": {"role": "driver"}}
                    )
            return True
        return False

    @staticmethod
    def get_application_by_id(application_id):
        """Gets a driver application by its ID."""
        if not ObjectId.is_valid(application_id):
            return None
        return mongo.db.driver_applications.find_one({"_id": ObjectId(application_id)}) 