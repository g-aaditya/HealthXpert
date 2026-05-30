from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import User, Patient, Doctor
from app import db
import re

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@auth_bp.route('/register/patient', methods=['POST'])
def register_patient():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'name', 'phone', 'age', 'sex']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create user
        user = User(
            email=data['email'],
            user_type='patient'
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Create patient profile
        patient = Patient(
            user_id=user.id,
            name=data['name'],
            phone=data['phone'],
            age=int(data['age']),
            sex=data['sex'],
            medical_history=data.get('medical_history', '')
        )
        
        db.session.add(patient)
        db.session.commit()
        
        return jsonify({
            'message': 'Patient registered successfully',
            'user_id': user.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/register/doctor', methods=['POST'])
def register_doctor():
    try:
        data = request.get_json()
        
        # Validate required fields - REMOVED 'phone' since Doctor model doesn't have it
        required_fields = ['email', 'password', 'name', 'specialization', 'license_number', 'consultation_fee', 'experience_years']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create user
        user = User(
            email=data['email'],
            user_type='doctor'
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Create doctor profile - REMOVED phone field
        doctor = Doctor(
            user_id=user.id,
            name=data['name'],
            specialization=data['specialization'],
            license_number=data['license_number'],
            consultation_fee=float(data['consultation_fee']),
            experience_years=int(data['experience_years'])
        )
        
        db.session.add(doctor)
        db.session.commit()
        
        return jsonify({
            'message': 'Doctor registered successfully',
            'user_id': user.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Create access token with string identity to avoid JWT issues
        access_token = create_access_token(identity=str(user.id))
        
        # Get profile data
        profile = None
        if user.user_type == 'patient':
            profile = user.patient_profile.to_dict() if user.patient_profile else None
        elif user.user_type == 'doctor':
            profile = user.doctor_profile.to_dict() if user.doctor_profile else None
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict(),
            'profile': profile
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = int(get_jwt_identity())  # Convert back to int
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get profile data
        profile = None
        if user.user_type == 'patient':
            profile = user.patient_profile.to_dict() if user.patient_profile else None
        elif user.user_type == 'doctor':
            profile = user.doctor_profile.to_dict() if user.doctor_profile else None
        
        return jsonify({
            'user': user.to_dict(),
            'profile': profile
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500