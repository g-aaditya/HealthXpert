from app import db
from datetime import datetime

class Consultation(db.Model):
    __tablename__ = 'consultations'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    symptoms = db.Column(db.Text, nullable=False)
    predicted_disease = db.Column(db.String(200))
    diagnosis = db.Column(db.Text)
    prescription = db.Column(db.Text)
    status = db.Column(db.Enum('pending', 'in_progress', 'completed', 'cancelled'), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('ChatMessage', backref='consultation', lazy=True)
    documents = db.relationship('Document', backref='consultation', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'doctor_id': self.doctor_id,
            'symptoms': self.symptoms,
            'predicted_disease': self.predicted_disease,
            'diagnosis': self.diagnosis,
            'prescription': self.prescription,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    consultation_id = db.Column(db.Integer, db.ForeignKey('consultations.id'), nullable=False)
    sender_type = db.Column(db.Enum('patient', 'doctor'), nullable=False)
    sender_id = db.Column(db.Integer, nullable=False)
    message = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.Enum('text', 'document', 'prescription'), default='text')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'consultation_id': self.consultation_id,
            'sender_type': self.sender_type,
            'sender_id': self.sender_id,
            'message': self.message,
            'message_type': self.message_type,
            'created_at': self.created_at.isoformat(),
            'is_read': self.is_read
        }

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    consultation_id = db.Column(db.Integer, db.ForeignKey('consultations.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    uploaded_by = db.Column(db.Enum('patient', 'doctor'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'consultation_id': self.consultation_id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'uploaded_by': self.uploaded_by,
            'created_at': self.created_at.isoformat()
        }