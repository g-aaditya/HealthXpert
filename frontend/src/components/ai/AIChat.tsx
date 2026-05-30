import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  Avatar,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  Send,
  Psychology,
  LocalHospital,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface Message {
  id: number;
  sender: 'user' | 'ai';
  message: string;
  timestamp: string;
}

interface PredictionResult {
  prediction?: {
    predicted_diseases?: Array<{
      disease: string;
      probability: number;
      description: string;
      recommended_specialization: string;
    }>;
    general_advice?: string;
    urgency_level?: string;
    disclaimer?: string;
  };
  symptoms?: string;
}

const AIChat: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      message: 'Hello! I\'m your AI health assistant. Please describe your symptoms, and I\'ll help analyze them.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendSymptoms = async () => {
    if (!symptoms.trim()) return;

    setLoading(true);
    setError(null);
    
    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      message: symptoms,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMessage]);

    // Guard: require token to call protected AI endpoint
    if (!token) {
      setError('Please login to use AI predictions.');
      const errorMessage: Message = {
        id: messages.length + 2,
        sender: 'ai',
        message: 'Authentication required. Please login and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
      setSymptoms('');
      return;
    }

    try {
      // Call AI prediction API with explicit auth header
      const response = await axios.post('/ai/predict-disease', {
        symptoms: symptoms.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } });

      const predictionData = response.data;
      setPrediction(predictionData);

      // Extract the main disease prediction
      const mainDisease = predictionData.prediction?.predicted_diseases?.[0];
      const urgencyLevel = predictionData.prediction?.urgency_level || 'unknown';
      const advice = predictionData.prediction?.general_advice || 'Please consult with a healthcare professional';

      // Add AI response message
      const aiMessage: Message = {
        id: messages.length + 2,
        sender: 'ai',
        message: `Based on your symptoms, I predict you might have: **${mainDisease?.disease || 'Unable to determine'}** (Confidence: ${mainDisease ? Math.round(mainDisease.probability * 100) : 0}%)\n\nUrgency Level: ${urgencyLevel.toUpperCase()}\n\nAdvice: ${advice}\n\nDisclaimer: ${predictionData.prediction?.disclaimer || 'This is not a substitute for professional medical advice'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      console.error('Error getting AI prediction:', error);
      setError('Failed to get AI prediction. Please try again.');
      
      // Add error message
      const errorMessage: Message = {
        id: messages.length + 2,
        sender: 'ai',
        message: 'I apologize, but I encountered an error while analyzing your symptoms. Please try again or consult with a doctor directly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setSymptoms('');
    }
  };

  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');
  const [doctors, setDoctors] = useState<Array<{
    id: number;
    name: string;
    specialization: string;
    rating: number;
    consultation_fee: number;
  }>>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorFetchError, setDoctorFetchError] = useState<string | null>(null);

  const fetchDoctors = React.useCallback(async () => {
    try {
      setLoadingDoctors(true);
      setDoctorFetchError(null);

      if (!token) {
        setDoctorFetchError('Please login to view doctors');
        setDoctors([]);
        return;
      }

      const recommended = prediction?.prediction?.predicted_diseases?.[0]?.recommended_specialization || '';

      const respAll = await axios.get('/doctor/list', { headers: { Authorization: `Bearer ${token}` } });
      let list = respAll.data?.doctors || [];

      if (recommended) {
        const rec = recommended.toLowerCase();
        list = list.sort((a: any, b: any) => {
          const aMatch = String(a.specialization || '').toLowerCase().includes(rec) ? 1 : 0;
          const bMatch = String(b.specialization || '').toLowerCase().includes(rec) ? 1 : 0;
          return bMatch - aMatch;
        });
      }

      setDoctors(list);
    } catch (err: any) {
      console.error('Failed to fetch doctors', err);
      setDoctorFetchError(err?.response?.data?.error || 'Failed to load doctors');
    } finally {
      setLoadingDoctors(false);
    }
  }, [prediction, token]);

  useEffect(() => {
    if (user && token) {
      fetchDoctors();
    }
  }, [user, token, fetchDoctors]);

  const handleCreateConsultation = async () => {
    if (!prediction || !user) return;

    try {
      const mainDisease = prediction.prediction?.predicted_diseases?.[0];
      const consultationData: any = {
        symptoms: (prediction.symptoms || symptoms || '').trim(),
        predicted_disease: mainDisease?.disease || 'Unable to determine',
      };
      if (selectedDoctorId) {
        consultationData.doctor_id = selectedDoctorId;
      }

      const response = await axios.post('/patient/consultations', consultationData, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      const consultationId = response.data?.consultation?.id || response.data?.consultation_id;

      if (consultationId) {
        navigate(`/chat/${consultationId}`);
      } else {
        throw new Error('Consultation ID missing in response');
      }
    } catch (error: any) {
      console.error('Error creating consultation:', error);
      setError(error?.response?.data?.error || 'Failed to create consultation. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendSymptoms();
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Psychology sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AI Health Assistant
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Chat Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <List>
          {messages.map((msg) => (
            <ListItem
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: msg.sender === 'ai' ? 'primary.main' : 'secondary.main',
                  }}
                >
                  {msg.sender === 'ai' ? <Psychology /> : 'U'}
                </Avatar>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: msg.sender === 'user' ? 'primary.main' : 'grey.100',
                    color: msg.sender === 'user' ? 'white' : 'text.primary',
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ whiteSpace: 'pre-line' }}
                  >
                    {msg.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1,
                      opacity: 0.7,
                    }}
                  >
                    {msg.timestamp}
                  </Typography>
                </Paper>
              </Box>
            </ListItem>
          ))}
          {loading && (
            <ListItem sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Psychology />
                </Avatar>
                <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2">Analyzing your symptoms...</Typography>
                  </Box>
                </Paper>
              </Box>
            </ListItem>
          )}
        </List>
      </Box>

      {/* Prediction Results */}
      {prediction && prediction.prediction && (
        <Paper sx={{ m: 2, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            AI Analysis Complete
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Predicted Condition
                  </Typography>
                  <Typography variant="h6">
                    {prediction.prediction.predicted_diseases?.[0]?.disease || 'Unable to determine'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Confidence: {prediction.prediction.predicted_diseases?.[0] ? Math.round(prediction.prediction.predicted_diseases[0].probability * 100) : 0}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Urgency Level
                  </Typography>
                  <Chip
                    label={prediction.prediction.urgency_level?.toUpperCase() || 'UNKNOWN'}
                    color={prediction.prediction.urgency_level === 'high' ? 'error' : prediction.prediction.urgency_level === 'medium' ? 'warning' : 'success'}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              General Advice
            </Typography>
            <Typography variant="body2">
              {prediction.prediction.general_advice || 'Please consult with a healthcare professional'}
            </Typography>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {prediction.prediction.disclaimer || 'This AI prediction is not a substitute for professional medical advice'}
            </Typography>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleCreateConsultation}
              startIcon={<LocalHospital />}
            >
              Consult with Doctor
            </Button>
          </Box>
        </Paper>
      )}
      {/* Doctor selection (always visible) */}
      <Paper sx={{ m: 2, p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Choose a Doctor
        </Typography>
        {prediction?.prediction?.predicted_diseases?.[0]?.recommended_specialization && (
          <Typography variant="caption" color="text.secondary">
            Recommended specialization: {prediction.prediction.predicted_diseases[0].recommended_specialization}
          </Typography>
        )}
        {doctorFetchError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {doctorFetchError}
          </Alert>
        )}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <Select
              fullWidth
              displayEmpty
              value={selectedDoctorId || ''}
              onChange={(e) => {
                const v = e.target.value as number | '';
                setSelectedDoctorId(v === '' ? '' : Number(v));
              }}
              disabled={loadingDoctors}
            >
              <MenuItem value="">
                Auto-assign any available doctor
              </MenuItem>
              {doctors.length === 0 && (
                <MenuItem disabled value="no-doctors">No doctors available</MenuItem>
              )}
              {doctors.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name} — {d.specialization} • Rating {d.rating} • Fee ₹{d.consultation_fee}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              onClick={() => fetchDoctors()}
              disabled={loadingDoctors}
              startIcon={<LocalHospital />}
            >
              Refresh doctors
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {/* Message Input */}
      <Paper sx={{ p: 2, m: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Describe your symptoms in detail..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleSendSymptoms}
            disabled={!symptoms.trim() || loading}
            sx={{ minWidth: 'auto', p: 1 }}
          >
            {loading ? <CircularProgress size={20} /> : <Send />}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AIChat;