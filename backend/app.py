from app import create_app, db
from models.user import User, Patient, Doctor
from models.consultation import Consultation, ChatMessage, Document

app = create_app()

def create_tables():
    """Create database tables"""
    with app.app_context():
        db.create_all()

@app.route('/')
def health_check():
    return {'message': 'HealthXpert API is running', 'status': 'healthy'}

if __name__ == '__main__':
    # Create tables before running the app
    create_tables()
    app.run(debug=True, host='0.0.0.0', port=5001)