from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.consultation import ChatMessage, Consultation
from models.user import User, Patient, Doctor
from app import db
from datetime import datetime

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/consultation/<int:consultation_id>/messages', methods=['GET', 'POST'])
@jwt_required()
def manage_messages(consultation_id):
    """Get messages or send new message for a consultation"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify user has access to this consultation
        consultation = Consultation.query.get(consultation_id)
        if not consultation:
            return jsonify({'error': 'Consultation not found'}), 404
        
        # Check if user is either the patient or doctor in this consultation
        has_access = False
        sender_id = None
        
        if user.user_type == 'patient':
            patient = Patient.query.filter_by(user_id=user_id).first()
            if patient and consultation.patient_id == patient.id:
                has_access = True
                sender_id = patient.id
        elif user.user_type == 'doctor':
            doctor = Doctor.query.filter_by(user_id=user_id).first()
            if doctor and consultation.doctor_id == doctor.id:
                has_access = True
                sender_id = doctor.id
        
        if not has_access:
            return jsonify({'error': 'Access denied to this consultation'}), 403
        
        if request.method == 'GET':
            # Get all messages for this consultation
            messages = ChatMessage.query.filter_by(consultation_id=consultation_id)\
                                      .order_by(ChatMessage.created_at.asc()).all()
            
            # Mark messages as read for the current user
            unread_messages = ChatMessage.query.filter_by(
                consultation_id=consultation_id,
                is_read=False
            ).filter(ChatMessage.sender_type != user.user_type).all()
            
            for message in unread_messages:
                message.is_read = True
            
            db.session.commit()
            
            return jsonify({
                'messages': [msg.to_dict() for msg in messages]
            }), 200
        
        elif request.method == 'POST':
            # Send new message
            data = request.get_json()
            
            if 'message' not in data or not data['message'].strip():
                return jsonify({'error': 'Message content is required'}), 400
            
            message = ChatMessage(
                consultation_id=consultation_id,
                sender_type=user.user_type,
                sender_id=sender_id,
                message=data['message'].strip(),
                message_type=data.get('message_type', 'text')
            )
            
            db.session.add(message)
            db.session.commit()
            
            return jsonify({
                'message': 'Message sent successfully',
                'chat_message': message.to_dict()
            }), 201
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/consultation/<int:consultation_id>/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count(consultation_id):
    """Get unread message count for a consultation"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify access to consultation
        consultation = Consultation.query.get(consultation_id)
        if not consultation:
            return jsonify({'error': 'Consultation not found'}), 404
        
        # Count unread messages from the other party
        unread_count = ChatMessage.query.filter_by(
            consultation_id=consultation_id,
            is_read=False
        ).filter(ChatMessage.sender_type != user.user_type).count()
        
        return jsonify({
            'unread_count': unread_count
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/consultations/unread-summary', methods=['GET'])
@jwt_required()
def get_unread_summary():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get consultations for this user
        if user.user_type == 'patient':
            patient = Patient.query.filter_by(user_id=user_id).first()
            consultations = Consultation.query.filter_by(patient_id=patient.id).all()
        elif user.user_type == 'doctor':
            doctor = Doctor.query.filter_by(user_id=user_id).first()
            consultations = Consultation.query.filter_by(doctor_id=doctor.id).all()
        else:
            return jsonify({'error': 'Invalid user type'}), 400
        
        unread_summary = []
        total_unread = 0
        
        for consultation in consultations:
            unread_count = ChatMessage.query.filter_by(
                consultation_id=consultation.id,
                is_read=False
            ).filter(ChatMessage.sender_type != user.user_type).count()
            
            if unread_count > 0:
                unread_summary.append({
                    'consultation_id': consultation.id,
                    'unread_count': unread_count
                })
                total_unread += unread_count
        
        return jsonify({
            'total_unread': total_unread,
            'consultations': unread_summary
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/consultation/<int:consultation_id>', methods=['GET'])
@jwt_required()
def get_consultation(consultation_id):
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        consultation = Consultation.query.get(consultation_id)
        if not consultation:
            return jsonify({'error': 'Consultation not found'}), 404

        # Access check: allow only the patient or doctor in this consultation
        if user.user_type == 'patient':
            patient = Patient.query.filter_by(user_id=user_id).first()
            if not patient or consultation.patient_id != patient.id:
                return jsonify({'error': 'Access denied to this consultation'}), 403
        elif user.user_type == 'doctor':
            doctor = Doctor.query.filter_by(user_id=user_id).first()
            if not doctor or consultation.doctor_id != doctor.id:
                return jsonify({'error': 'Access denied to this consultation'}), 403
        else:
            return jsonify({'error': 'Invalid user type'}), 400

        return jsonify({'consultation': consultation.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500