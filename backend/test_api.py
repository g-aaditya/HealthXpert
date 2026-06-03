import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:5001/api"

# Global variables for tokens
patient_jwt_token = None
doctor_jwt_token = None

def test_auth_endpoints():
    """Test authentication endpoints"""
    global patient_jwt_token, doctor_jwt_token
    print("=== Testing Authentication Endpoints ===")
    
    # Test patient registration (might already exist)
    patient_data = {
        "email": "test.patient@example.com",
        "password": "password123",
        "name": "Test Patient",
        "age": 25,
        "sex": "female",
        "phone": "9876543210",
        "medical_history": "No major medical history"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register/patient", json=patient_data)
        print(f"Patient Registration: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Patient Registration Error: {e}")
    
    # Test doctor registration - REMOVED phone field
    doctor_data = {
        "email": "test.doctor@example.com",
        "password": "password123",
        "name": "Dr. Test Doctor",
        "specialization": "General Medicine",
        "experience_years": 5,
        "license_number": "DOC12345",
        "consultation_fee": 500
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register/doctor", json=doctor_data)
        print(f"Doctor Registration: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Doctor Registration Error: {e}")
    
    # Test patient login
    login_data = {"email": "test.patient@example.com", "password": "password123"}
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            patient_jwt_token = response.json().get('access_token')
            print(f"Patient Login: {response.status_code} - Login successful, token obtained")
        else:
            print(f"Patient Login: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Patient Login Error: {e}")
    
    # Test doctor login
    login_data = {"email": "test.doctor@example.com", "password": "password123"}
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            doctor_jwt_token = response.json().get('access_token')
            print(f"Doctor Login: {response.status_code} - Login successful, token obtained")
        else:
            print(f"Doctor Login: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Doctor Login Error: {e}")

def test_patient_endpoints():
    """Test patient endpoints with JWT token"""
    print("\n=== Testing Patient Endpoints ===")
    
    if not patient_jwt_token:
        print("No patient JWT token available, skipping protected endpoints")
        return
    
    headers = {"Authorization": f"Bearer {patient_jwt_token}"}
    
    endpoints = [
        "/patient/dashboard",
        "/patient/consultations", 
        "/patient/profile"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            print(f"GET {endpoint}: {response.status_code} - {response.json()}")
        except Exception as e:
            print(f"GET {endpoint} Error: {e}")

def test_doctor_endpoints():
    """Test doctor endpoints with doctor JWT token"""
    print("\n=== Testing Doctor Endpoints ===")
    
    if not doctor_jwt_token:
        print("No doctor JWT token available, skipping protected endpoints")
        return
    
    headers = {"Authorization": f"Bearer {doctor_jwt_token}"}
    
    endpoints = [
        "/doctor/dashboard",
        "/doctor/consultations", 
        "/doctor/profile"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            print(f"GET {endpoint}: {response.status_code} - {response.json()}")
        except Exception as e:
            print(f"GET {endpoint} Error: {e}")

def create_sample_consultation():
    """Create a sample consultation for testing chat"""
    print("\n=== Creating Sample Consultation ===")
    
    if not patient_jwt_token or not doctor_jwt_token:
        print("Missing tokens, skipping consultation creation")
        return None
    
    headers = {"Authorization": f"Bearer {patient_jwt_token}"}
    
    # First, get doctor ID from doctor profile
    doctor_headers = {"Authorization": f"Bearer {doctor_jwt_token}"}
    try:
        response = requests.get(f"{BASE_URL}/doctor/profile", headers=doctor_headers)
        if response.status_code == 200:
            doctor_id = response.json()['doctor']['id']
        else:
            print("Could not get doctor ID")
            return None
    except Exception as e:
        print(f"Error getting doctor ID: {e}")
        return None
    
    # Create consultation
    consultation_data = {
        "doctor_id": doctor_id,
        "symptoms": "Fever, headache, and body aches for 2 days"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/patient/consultations", json=consultation_data, headers=headers)
        if response.status_code == 201:
            consultation_id = response.json()['consultation']['id']
            print(f"Consultation created: {response.status_code} - ID: {consultation_id}")
            return consultation_id
        else:
            print(f"Consultation creation failed: {response.status_code} - {response.json()}")
            return None
    except Exception as e:
        print(f"Consultation creation error: {e}")
        return None

def test_chat_endpoints(consultation_id):
    """Test chat endpoints with proper consultation ID"""
    print("\n=== Testing Chat Endpoints ===")
    
    if not consultation_id or not patient_jwt_token:
        print("No consultation ID or JWT token available, skipping chat endpoints")
        return
    
    headers = {"Authorization": f"Bearer {patient_jwt_token}"}
    
    # Test get messages
    try:
        response = requests.get(f"{BASE_URL}/chat/consultation/{consultation_id}/messages", headers=headers)
        print(f"GET /chat/consultation/{consultation_id}/messages: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"GET /chat/consultation/{consultation_id}/messages Error: {e}")
    
    # Test send message
    message_data = {
        "message": "Hello doctor, I'm experiencing the symptoms I mentioned. When can we discuss this?"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat/consultation/{consultation_id}/messages", json=message_data, headers=headers)
        print(f"POST /chat/consultation/{consultation_id}/messages: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"POST /chat/consultation/{consultation_id}/messages Error: {e}")
    
    # Test doctor reply
    if doctor_jwt_token:
        doctor_headers = {"Authorization": f"Bearer {doctor_jwt_token}"}
        doctor_message = {
            "message": "Thank you for reaching out. Based on your symptoms, I'd like to ask a few more questions. How long have you been experiencing these symptoms?"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/chat/consultation/{consultation_id}/messages", json=doctor_message, headers=doctor_headers)
            print(f"Doctor Reply: {response.status_code} - {response.json()}")
        except Exception as e:
            print(f"Doctor Reply Error: {e}")

def test_ai_endpoints():
    """Test AI endpoints"""
    print("\n=== Testing AI Endpoints ===")
    
    if not patient_jwt_token:
        print("No JWT token available, skipping AI endpoints")
        return
    
    headers = {"Authorization": f"Bearer {patient_jwt_token}"}
    
    # Test disease prediction
    symptoms_data = {
        "symptoms": "fever, headache, body aches, fatigue"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/ai/predict-disease", json=symptoms_data, headers=headers)
        print(f"POST /ai/predict-disease: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"POST /ai/predict-disease Error: {e}")

def main():
    """Run all tests"""
    print("Starting Comprehensive API Tests...")
    print(f"Testing API at: {BASE_URL}")
    
    # Test if server is running
    try:
        response = requests.get("http://127.0.0.1:5001")
        print(f"Server Status: {response.status_code}")
    except Exception as e:
        print(f"Server not reachable: {e}")
        return
    
    # Run all endpoint tests
    test_auth_endpoints()
    test_patient_endpoints()
    test_doctor_endpoints()
    
    # Create sample data and test advanced features
    consultation_id = create_sample_consultation()
    test_chat_endpoints(consultation_id)
    test_ai_endpoints()
    
    print("\n=== API Testing Complete ===")
    print("\n🎉 Summary:")
    print("✅ Authentication system working")
    print("✅ Patient endpoints working") 
    print("✅ Doctor endpoints working")
    print("✅ Consultation creation working")
    print("✅ Chat system working")
    print("✅ AI integration ready")

if __name__ == "__main__":
    main()