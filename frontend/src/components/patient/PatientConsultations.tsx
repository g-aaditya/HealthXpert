import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
} from '@mui/material';
import { Chat, LocalHospital } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface Consultation {
  id: number;
  doctor_id: number;
  symptoms: string;
  predicted_disease?: string;
  diagnosis?: string;
  prescription?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const PatientConsultations: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const resp = await axios.get('/patient/consultations');
        setConsultations(resp.data?.consultations || []);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load consultations');
        if (err?.response?.status === 401) {
          logout();
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchConsultations();
    } else {
      setLoading(false);
    }
  }, [user, token, logout, navigate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Medical History</Typography>
          <Button variant="contained" startIcon={<LocalHospital />} onClick={() => navigate('/patient/ai-chat')}>
            New Consultation
          </Button>
        </Box>

        {error && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography color="error">{error}</Typography>
            </CardContent>
          </Card>
        )}

        {consultations.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                No consultations found. Start your first consultation.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {consultations.map((c) => (
              <Grid item xs={12} key={c.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">Doctor ID: {c.doctor_id}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {c.symptoms}
                        </Typography>
                      </Box>
                      <Chip label={c.status} color={getStatusColor(c.status) as any} size="small" />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Date:</strong> {new Date(c.created_at).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Diagnosis:</strong> {c.diagnosis || c.predicted_disease || 'Pending'}
                    </Typography>
                    <Button variant="outlined" size="small" startIcon={<Chat />} onClick={() => navigate(`/chat/${c.id}`)}>
                      View Chat
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default PatientConsultations;