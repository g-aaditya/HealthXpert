from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User, Doctor
from models.consultation import Consultation
from app import db
from datetime import datetime

doctor_bp = Blueprint('doctor', __name__)

@doctor_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get doctor dashboard data"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'doctor':
            return jsonify({'error': 'Access denied'}), 403
        
        doctor = Doctor.query.filter_by(user_id=user_id).first()
        if not doctor:
            return jsonify({'error': 'Doctor profile not found'}), 404
        
        # Get pending consultations
        pending_consultations = Consultation.query.filter_by(
            doctor_id=doctor.id, 
            status='pending'
        ).order_by(Consultation.created_at.desc()).all()
        
        # Get consultation statistics
        total_consultations = Consultation.query.filter_by(doctor_id=doctor.id).count()
        completed_consultations = Consultation.query.filter_by(
            doctor_id=doctor.id, 
            status='completed'
        ).count()
        
        return jsonify({
            'doctor': doctor.to_dict(),
            'pending_consultations': [c.to_dict() for c in pending_consultations],
            'stats': {
                'total_consultations': total_consultations,
                'completed_consultations': completed_consultations,
                'pending_consultations': len(pending_consultations)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@doctor_bp.route('/consultations', methods=['GET'])
@jwt_required()
def get_consultations():
    """Get all consultations for doctor"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'doctor':
            return jsonify({'error': 'Access denied'}), 403
        
        doctor = Doctor.query.filter_by(user_id=user_id).first()
        if not doctor:
            return jsonify({'error': 'Doctor profile not found'}), 404
        
        # Get consultations with optional status filter
        status = request.args.get('status')
        query = Consultation.query.filter_by(doctor_id=doctor.id)
        
        if status:
            query = query.filter_by(status=status)
        
        consultations = query.order_by(Consultation.created_at.desc()).all()
        
        return jsonify({
            'consultations': [c.to_dict() for c in consultations]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@doctor_bp.route('/consultations/<int:consultation_id>', methods=['GET', 'PUT'])
@jwt_required()
def manage_consultation(consultation_id):
    """View or update specific consultation"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'doctor':
            return jsonify({'error': 'Access denied'}), 403
        
        doctor = Doctor.query.filter_by(user_id=user_id).first()
        if not doctor:
            return jsonify({'error': 'Doctor profile not found'}), 404
        
        consultation = Consultation.query.filter_by(
            id=consultation_id, 
            doctor_id=doctor.id
        ).first()
        
        if not consultation:
            return jsonify({'error': 'Consultation not found'}), 404
        
        if request.method == 'GET':
            return jsonify({
                'consultation': consultation.to_dict()
            }), 200
        
        elif request.method == 'PUT':
            data = request.get_json()
            
            # Update consultation fields
            if 'diagnosis' in data:
                consultation.diagnosis = data['diagnosis']
            if 'prescription' in data:
                consultation.prescription = data['prescription']
            if 'status' in data:
                consultation.status = data['status']
            
            consultation.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'message': 'Consultation updated successfully',
                'consultation': consultation.to_dict()
            }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@doctor_bp.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
def manage_profile():
    """Get or update doctor profile"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'doctor':
            return jsonify({'error': 'Access denied'}), 403
        
        doctor = Doctor.query.filter_by(user_id=user_id).first()
        if not doctor:
            return jsonify({'error': 'Doctor profile not found'}), 404
        
        if request.method == 'GET':
            return jsonify({
                'user': user.to_dict(),
                'doctor': doctor.to_dict()
            }), 200
        
        elif request.method == 'PUT':
            data = request.get_json()
            
            # Update doctor fields
            if 'name' in data:
                doctor.name = data['name']
            if 'specialization' in data:
                doctor.specialization = data['specialization']
            if 'experience_years' in data:
                doctor.experience_years = int(data['experience_years'])
            if 'consultation_fee' in data:
                doctor.consultation_fee = float(data['consultation_fee'])
            
            db.session.commit()
            
            return jsonify({
                'message': 'Profile updated successfully',
                'doctor': doctor.to_dict()
            }), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@doctor_bp.route('/list', methods=['GET'])
@jwt_required()
def list_doctors():
    try:
        specialization = request.args.get('specialization', type=str)
        verified = request.args.get('verified', type=str)

        query = Doctor.query
        if specialization:
            query = query.filter(Doctor.specialization.ilike(f'%{specialization}%'))
        if verified is not None:
            val = verified.lower() == 'true'
            query = query.filter(Doctor.is_verified == val)

        doctors = query.order_by(Doctor.rating.desc(), Doctor.experience_years.desc()).all()
        return jsonify({'doctors': [d.to_dict() for d in doctors]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500