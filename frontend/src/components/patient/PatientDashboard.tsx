import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  AccountCircle,
  Psychology,
  Chat,
  History,
  LocalHospital,
  Add,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

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

interface DashboardData {
  patient: any;
  recent_consultations: Consultation[];
  stats: {
    total_consultations: number;
    pending_consultations: number;
  };
}

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, logout, token } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/patient/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(response.data);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        if (error?.response?.status === 401) {
          logout();
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };
    if (user && token) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            HealthXpert - Patient Dashboard
          </Typography>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome back, {dashboardData?.patient?.name || profile?.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's your health overview and recent activity.
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <LocalHospital color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Consultations
                    </Typography>
                    <Typography variant="h4">
                      {dashboardData?.stats?.total_consultations || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/patient/ai-chat')}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Psychology sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  AI Health Assistant
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Get instant health insights and symptom analysis
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/patient/ai-chat')}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Add sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  New Consultation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start a new consultation with a doctor
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/patient/consultations')}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <History sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Medical History
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View your complete medical records
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Consultations */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Consultations
            </Typography>
            {!dashboardData?.recent_consultations || dashboardData.recent_consultations.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No consultations yet. Start your first consultation with our AI assistant!
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {dashboardData.recent_consultations.map((consultation: Consultation) => (
                  <Grid item xs={12} key={consultation.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6">Doctor ID: {consultation.doctor_id}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {consultation.symptoms}
                            </Typography>
                          </Box>
                          <Chip
                            label={consultation.status}
                            color={getStatusColor(consultation.status) as any}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Date:</strong> {new Date(consultation.created_at).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          <strong>Diagnosis:</strong> {consultation.diagnosis || consultation.predicted_disease || 'Pending'}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Chat />}
                          onClick={() => navigate(`/chat/${consultation.id}`)}
                        >
                          View Chat
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default PatientDashboard;