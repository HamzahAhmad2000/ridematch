# /backend/app/controllers/safety_controller.py
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from ..models.safety import SafetyReport
from datetime import datetime
import os
import uuid
from werkzeug.utils import secure_filename

class SafetyController:
    @staticmethod
    def submit_report():
        """Submit a safety report"""
        try:
            data = request.get_json()
            user_id = get_jwt_identity()
            
            # Extract report data
            category = data.get('category')
            description = data.get('description')
            anonymous = data.get('anonymous', False)
            evidence_url = data.get('evidenceUrl')
            ride_id = data.get('rideId')
            
            if not category or not description:
                return jsonify({'error': 'Category and description are required'}), 400
            
            # Create the report
            report = SafetyReport.create_report(
                user_id=user_id if not anonymous else None,
                category=category,
                description=description,
                evidence_url=evidence_url,
                ride_id=ride_id,
                anonymous=anonymous
            )
            
            return jsonify({
                'success': True,
                'message': 'Report submitted successfully',
                'reportId': str(report['_id'])
            }), 201
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': str(e)
            }), 500
    
    @staticmethod
    def upload_evidence():
        """Upload evidence file for a safety report"""
        try:
            if 'evidence' not in request.files:
                return jsonify({'error': 'No file provided'}), 400
            
            file = request.files['evidence']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            # Generate unique filename
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            
            # Create uploads directory if it doesn't exist
            upload_dir = os.path.join(os.getcwd(), 'uploads', 'evidence')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Save the file
            file_path = os.path.join(upload_dir, unique_filename)
            file.save(file_path)
            
            # Return the URL (in production, this would be a proper URL)
            file_url = f"/uploads/evidence/{unique_filename}"
            
            return jsonify({
                'url': file_url,
                'message': 'File uploaded successfully'
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500 