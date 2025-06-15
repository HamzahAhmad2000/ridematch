from datetime import datetime
from bson import ObjectId
from .. import mongo

class SafetyReport:
    @staticmethod
    def create_report(user_id, category, description, evidence_url=None, ride_id=None, anonymous=False):
        """Create a new safety report"""
        report_data = {
            'user_id': user_id if not anonymous else None,
            'category': category,
            'description': description,
            'evidence_url': evidence_url,
            'ride_id': ride_id,
            'anonymous': anonymous,
            'status': 'pending',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = mongo.db.safety_reports.insert_one(report_data)
        report_data['_id'] = result.inserted_id
        
        return report_data
    
    @staticmethod
    def get_report_by_id(report_id):
        """Get a safety report by ID"""
        return mongo.db.safety_reports.find_one({'_id': ObjectId(report_id)})
    
    @staticmethod
    def get_user_reports(user_id):
        """Get all reports submitted by a user"""
        return list(mongo.db.safety_reports.find({'user_id': user_id}).sort('created_at', -1))
    
    @staticmethod
    def update_report_status(report_id, status, admin_notes=None):
        """Update the status of a safety report"""
        update_data = {
            'status': status,
            'updated_at': datetime.utcnow()
        }
        
        if admin_notes:
            update_data['admin_notes'] = admin_notes
        
        return mongo.db.safety_reports.update_one(
            {'_id': ObjectId(report_id)},
            {'$set': update_data}
        )
    
    @staticmethod
    def get_all_reports(status=None, limit=50, skip=0):
        """Get all safety reports (for admin use)"""
        query = {}
        if status:
            query['status'] = status
        
        return list(mongo.db.safety_reports.find(query)
                   .sort('created_at', -1)
                   .limit(limit)
                   .skip(skip)) 