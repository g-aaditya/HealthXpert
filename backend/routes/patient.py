from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User, Patient, Doctor
from models.consultation import Consultation
from app import db
from datetime import datetime

patient_bp = Blueprint('patient', __name__)

@patient_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get patient dashboard data"""
    try:
        user_id = int(get_jwt_identity())  # Convert string to int
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'patient':
            return jsonify({'error': 'Access denied'}), 403
        
        patient = Patient.query.filter_by(user_id=user_id).first()
        if not patient:
            return jsonify({'error': 'Patient profile not found'}), 404
        
        # Get recent consultations
        consultations = Consultation.query.filter_by(patient_id=patient.id)\
                                        .order_by(Consultation.created_at.desc())\
                                        .limit(5).all()
        
        # Get consultation statistics
        total_consultations = Consultation.query.filter_by(patient_id=patient.id).count()
        pending_consultations = Consultation.query.filter_by(
            patient_id=patient.id, 
            status='pending'
        ).count()
        
        return jsonify({
            'patient': patient.to_dict(),
            'recent_consultations': [c.to_dict() for c in consultations],
            'stats': {
                'total_consultations': total_consultations,
                'pending_consultations': pending_consultations
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@patient_bp.route('/consultations', methods=['GET', 'POST'])
@jwt_required()
def manage_consultations():
    """Get or create consultations"""
    try:
        user_id = int(get_jwt_identity())  # Convert string to int
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'patient':
            return jsonify({'error': 'Access denied'}), 403
        
        patient = Patient.query.filter_by(user_id=user_id).first()
        if not patient:
            return jsonify({'error': 'Patient profile not found'}), 404
        
        if request.method == 'GET':
            # Get all consultations for this patient
            consultations = Consultation.query.filter_by(patient_id=patient.id)\
                                            .order_by(Consultation.created_at.desc()).all()
            
            return jsonify({
                'consultations': [c.to_dict() for c in consultations]
            }), 200
        
        elif request.method == 'POST':
            # Create new consultation
            data = request.get_json()
            
            # Only symptoms required; doctor_id optional
            if 'symptoms' not in data or not str(data['symptoms']).strip():
                return jsonify({'error': 'symptoms is required'}), 400
            
            doctor_id = data.get('doctor_id')
            if not doctor_id:
                # Auto-assign first available doctor
                from models.user import Doctor  # ensure Doctor is imported
                auto_doctor = Doctor.query.first()
                if not auto_doctor:
                    return jsonify({'error': 'No doctors available'}), 400
                doctor_id = auto_doctor.id
            
            consultation = Consultation(
                patient_id=patient.id,
                doctor_id=doctor_id,
                symptoms=str(data['symptoms']).strip(),
                predicted_disease=data.get('predicted_disease'),
                status='pending'
            )
            
            db.session.add(consultation)
            db.session.commit()
            
            return jsonify({
                'message': 'Consultation created successfully',
                'consultation': consultation.to_dict()
            }), 201
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@patient_bp.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
def manage_profile():
    """Get or update patient profile"""
    try:
        user_id = int(get_jwt_identity())  # Convert string to int
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'patient':
            return jsonify({'error': 'Access denied'}), 403
        
        patient = Patient.query.filter_by(user_id=user_id).first()
        if not patient:
            return jsonify({'error': 'Patient profile not found'}), 404
        
        if request.method == 'GET':
            return jsonify({
                'user': user.to_dict(),
                'patient': patient.to_dict()
            }), 200
        
        elif request.method == 'PUT':
            # Update patient profile
            data = request.get_json()
            
            # Update user fields
            if 'email' in data:
                # Check if email is already taken by another user
                existing_user = User.query.filter_by(email=data['email']).first()
                if existing_user and existing_user.id != user_id:
                    return jsonify({'error': 'Email already registered'}), 400
                user.email = data['email']
            
            # Update patient fields
            if 'name' in data:
                patient.name = data['name']
            if 'phone' in data:
                patient.phone = data['phone']
            if 'age' in data:
                patient.age = int(data['age'])
            if 'sex' in data:
                patient.sex = data['sex']
            if 'medical_history' in data:
                patient.medical_history = data['medical_history']
            
            db.session.commit()
            
            return jsonify({
                'message': 'Profile updated successfully',
                'user': user.to_dict(),
                'patient': patient.to_dict()
            }), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500