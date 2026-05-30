// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE || 'http://127.0.0.1:5001/api';

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REGISTER_PATIENT: '/auth/register/patient',
  REGISTER_DOCTOR: '/auth/register/doctor',
  PROFILE: '/auth/profile',
  
  // Patient endpoints
  PATIENT_DASHBOARD: '/patient/dashboard',
  PATIENT_CONSULTATIONS: '/patient/consultations',
  PATIENT_PROFILE: '/patient/profile',
  
  // Doctor endpoints
  DOCTOR_DASHBOARD: '/doctor/dashboard',
  DOCTOR_CONSULTATIONS: '/doctor/consultations',
  DOCTOR_PROFILE: '/doctor/profile',
  
  // Chat endpoints
  CHAT_MESSAGES: (consultationId: number) => `/chat/consultation/${consultationId}/messages`,
  
  // AI endpoints
  AI_PREDICT: '/ai/predict-disease',
};