import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import ChatNotifier from './components/chat/ChatNotifier';

// Components
import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPatient from './components/auth/RegisterPatient';
import RegisterDoctor from './components/auth/RegisterDoctor';
import PatientDashboard from './components/patient/PatientDashboard';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import ChatPage from './components/chat/ChatPage';
import AIChat from './components/ai/AIChat';
import PatientConsultations from './components/patient/PatientConsultations';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#2C5282',
    },
    secondary: {
      main: '#4A5568',
    },
    success: {
      main: '#38A169',
    },
    background: {
      default: '#F7FAFC',
    },
    text: {
      primary: '#2D3748',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  userType?: 'patient' | 'doctor' 
}> = ({ children, userType }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userType && user.user_type !== userType) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/patient" element={<RegisterPatient />} />
            <Route path="/register/doctor" element={<RegisterDoctor />} />
            
            {/* Patient Routes */}
            <Route 
              path="/patient/dashboard" 
              element={
                <ProtectedRoute userType="patient">
                  <PatientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/ai-chat" 
              element={
                <ProtectedRoute userType="patient">
                  <AIChat />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/patient/consultations" 
              element={
                <ProtectedRoute userType="patient">
                  <PatientConsultations />
                </ProtectedRoute>
              } 
            />
            {/* Doctor Routes */}
            <Route 
              path="/doctor/dashboard" 
              element={
                <ProtectedRoute userType="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              } 
            />
            {/* Chat Routes */}
            <Route 
              path="/chat/:consultationId" 
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
