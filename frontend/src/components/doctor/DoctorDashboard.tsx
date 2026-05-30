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
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  AccountCircle,
  Notifications,
  People,
  Schedule,
  LocalHospital,
  Chat,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface Consultation {
  id: number;
  patient_id: number;
  symptoms: string;
  predicted_disease?: string;
  diagnosis?: string;
  prescription?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DashboardData {
  doctor: any;
  pending_consultations: Consultation[];
  stats: {
    total_consultations: number;
    pending_consultations: number;
    completed_consultations: number;
  };
}

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, logout, token } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/doctor/dashboard', {
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
            HealthXpert - Doctor Dashboard
          </Typography>
          <IconButton color="inherit">
            <Badge badgeContent={dashboardData?.stats?.pending_consultations || 0} color="error">
              <Notifications />
            </Badge>
          </IconButton>
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
            Welcome, {dashboardData?.doctor?.name || profile?.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {dashboardData?.doctor?.specialization} • {dashboardData?.doctor?.experience_years} years experience
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <People color="primary" sx={{ mr: 2 }} />
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
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Schedule color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Pending
                    </Typography>
                    <Typography variant="h4">
                      {dashboardData?.stats?.pending_consultations || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <LocalHospital color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Completed
                    </Typography>
                    <Typography variant="h4">
                      {dashboardData?.stats?.completed_consultations || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Pending Consultations */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pending Consultations
            </Typography>
            {dashboardData?.pending_consultations?.length === 0 ? (
              <Typography color="text.secondary">
                No pending consultations at the moment.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {dashboardData?.pending_consultations?.map((consultation) => (
                  <Grid item xs={12} key={consultation.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start">
                          <Box>
                            <Typography variant="subtitle1" gutterBottom>
                              Patient ID: {consultation.patient_id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Symptoms: {consultation.symptoms}
                            </Typography>
                            {consultation.predicted_disease && (
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                AI Prediction: {consultation.predicted_disease}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {new Date(consultation.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Box display="flex" flexDirection="column" alignItems="end">
                            <Chip
                              label="Pending"
                              color="warning"
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Chat />}
                              onClick={() => navigate(`/chat/${consultation.id}`)}
                            >
                              Start Chat
                            </Button>
                          </Box>
                        </Box>
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

export default DoctorDashboard;