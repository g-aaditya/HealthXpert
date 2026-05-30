# module: ai.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User, Patient
from models.consultation import Consultation
from utils.sambanova_client import SambaNovaClient
from app import db
import json
from datetime import datetime

ai_bp = Blueprint('ai', __name__)

def _extract_json(text):
    try:
        return json.loads(text)
    except Exception:
        pass
    if not isinstance(text, str):
        return None
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        candidate = text[start:end + 1]
        try:
            return json.loads(candidate)
        except Exception:
            return None
    return None

def _rule_based_prediction(symptoms: str):
    s = symptoms.lower()
    rules = [
        {"keywords": ["fever", "cough", "sore throat"], "disease": "Viral Upper Respiratory Infection", "specialization": "General Medicine"},
        {"keywords": ["fever", "body ache", "chills", "fatigue"], "disease": "Influenza", "specialization": "General Medicine"},
        {"keywords": ["chest pain", "pressure", "radiating", "arm pain"], "disease": "Angina (Possible Cardiac Ischemia)", "specialization": "Cardiology"},
        {"keywords": ["shortness of breath", "wheezing", "tightness", "cough"], "disease": "Asthma Exacerbation", "specialization": "Pulmonology"},
        {"keywords": ["abdominal pain", "diarrhea", "vomiting", "nausea"], "disease": "Gastroenteritis", "specialization": "Gastroenterology"},
        {"keywords": ["headache", "nausea", "sensitivity to light", "throbbing"], "disease": "Migraine", "specialization": "Neurology"},
        {"keywords": ["back pain", "stiffness", "limited movement"], "disease": "Musculoskeletal Strain", "specialization": "Orthopedics"},
        {"keywords": ["burning urination", "urinary frequency", "urgency", "lower abdominal pain"], "disease": "Urinary Tract Infection", "specialization": "Urology"},
        {"keywords": ["rash", "itching", "redness"], "disease": "Dermatitis", "specialization": "Dermatology"},
    ]

    matches = []
    for rule in rules:
        matched = sum(1 for kw in rule["keywords"] if kw in s)
        total = len(rule["keywords"])
        if matched > 0:
            prob = max(0.4, min(0.95, 0.55 + 0.1 * matched + 0.05 * (matched / max(1, total))))
            matches.append({
                "disease": rule["disease"],
                "probability": round(prob, 2),
                "description": "Preliminary assessment based on reported symptoms",
                "recommended_specialization": rule["specialization"]
            })

    urgent_triggers = ["chest pain", "shortness of breath", "confusion", "blood", "severe", "high fever"]
    urgency_level = "low"
    if any(k in s for k in urgent_triggers):
        urgency_level = "high"
    elif any(k in s for k in ["fever", "pain", "vomiting", "diarrhea"]):
        urgency_level = "medium"

    if not matches:
        matches = [{
            "disease": "Unable to determine",
            "probability": 0.0,
            "description": "Symptoms are nonspecific; consider consulting a healthcare professional",
            "recommended_specialization": "General Medicine"
        }]

    return {
        "predicted_diseases": sorted(matches, key=lambda x: x["probability"], reverse=True)[:3],
        "general_advice": "Stay hydrated, rest, and seek professional care if symptoms worsen.",
        "urgency_level": urgency_level,
        "disclaimer": "AI output is not a substitute for professional medical advice."
    }

@ai_bp.route('/predict-disease', methods=['POST'])
@jwt_required()
def predict_disease():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'patient':
            return jsonify({'error': 'Only patients can use disease prediction'}), 403
        
        data = request.get_json()
        symptoms = data.get('symptoms', '')
        
        if not symptoms:
            return jsonify({'error': 'Symptoms are required'}), 400
        
        sambanova_client = SambaNovaClient()
        prompt = f"""
        You are a medical AI assistant. Based on the following symptoms, provide a preliminary disease prediction.
        Respond with ONLY valid JSON, no markdown, no surrounding text, using this exact structure:
        {{
            "predicted_diseases": [
                {{
                    "disease": "Disease Name",
                    "probability": 0.85,
                    "description": "Brief description",
                    "recommended_specialization": "Specialization"
                }}
            ],
            "general_advice": "General health advice",
            "urgency_level": "low/medium/high",
            "disclaimer": "Medical disclaimer"
        }}
        
        Symptoms: {symptoms}
        
        Important: Output must be strictly valid JSON. Do not include explanations.
        """
        response_text = sambanova_client.generate_response(prompt)
        parsed = _extract_json(response_text)
        is_valid = (
            isinstance(parsed, dict) and
            'predicted_diseases' in parsed and
            isinstance(parsed.get('predicted_diseases'), list) and
            'error' not in parsed
        )
        prediction_data = parsed if is_valid else _rule_based_prediction(symptoms)
        return jsonify({
            'prediction': prediction_data,
            'symptoms': symptoms
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/analyze-document', methods=['POST'])
@jwt_required()
def analyze_document():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.user_type != 'patient':
            return jsonify({'error': 'Only patients can analyze documents'}), 403
        
        # Check if file is uploaded
        if 'document' not in request.files:
            return jsonify({'error': 'No document uploaded'}), 400
        
        file = request.files['document']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # For now, we'll simulate document analysis
        # In a real implementation, you would:
        # 1. Save the file
        # 2. Extract text using OCR (if image) or PDF reader
        # 3. Send extracted text to SambaNova for analysis
        
        sambanova_client = SambaNovaClient()
        
        prompt = f"""
        You are a medical AI assistant analyzing a medical document. 
        Based on the document content, provide insights in JSON format:
        {{
            "document_type": "Blood Test/X-Ray/MRI/etc",
            "key_findings": ["finding1", "finding2"],
            "abnormal_values": [
                {{
                    "parameter": "Parameter name",
                    "value": "Actual value",
                    "normal_range": "Normal range",
                    "significance": "Clinical significance"
                }}
            ],
            "recommendations": ["recommendation1", "recommendation2"],
            "urgency_level": "low/medium/high",
            "suggested_followup": "Follow-up recommendations"
        }}
        
        Document filename: {file.filename}
        Note: Provide general analysis based on common medical document patterns.
        """
        
        response = sambanova_client.generate_response(prompt)
        
        try:
            analysis_data = json.loads(response)
        except json.JSONDecodeError:
            analysis_data = {
                "document_type": "Medical Document",
                "key_findings": ["Document uploaded successfully"],
                "abnormal_values": [],
                "recommendations": ["Please consult with a healthcare professional for detailed analysis"],
                "urgency_level": "medium",
                "suggested_followup": "Schedule appointment with appropriate specialist"
            }
        
        return jsonify({
            'analysis': analysis_data,
            'filename': file.filename
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
def ai_chat():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        message = data.get('message', '')
        context = data.get('context', '')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        sambanova_client = SambaNovaClient()
        
        # Create context-aware prompt
        prompt = f"""
        You are a helpful medical AI assistant. Respond to the user's question in a professional and informative manner.
        
        Context: {context}
        User Question: {message}
        
        Please provide a helpful response while always recommending professional medical consultation for serious concerns.
        Keep responses concise and easy to understand.
        """
        
        response = sambanova_client.generate_response(prompt)
        
        return jsonify({
            'response': response,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500