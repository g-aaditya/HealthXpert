import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  useTheme,
} from '@mui/material';
import {
  LocalHospital,
  Psychology,
  Chat,
  Security,
  Speed,
  HealthAndSafety,
} from '@mui/icons-material';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      icon: <Psychology color="primary" sx={{ fontSize: 40 }} />,
      title: 'AI-Powered Diagnosis',
      description: 'Advanced machine learning algorithms analyze symptoms and medical data to provide accurate preliminary diagnoses.',
    },
    {
      icon: <Chat color="primary" sx={{ fontSize: 40 }} />,
      title: 'Secure Communication',
      description: 'HIPAA-compliant chat system enabling secure communication between patients and healthcare providers.',
    },
    {
      icon: <LocalHospital color="primary" sx={{ fontSize: 40 }} />,
      title: 'Expert Doctors',
      description: 'Connect with verified healthcare professionals across various specializations with ratings and reviews.',
    },
    {
      icon: <Speed color="primary" sx={{ fontSize: 40 }} />,
      title: 'Quick Consultations',
      description: 'Get medical advice quickly without the need for physical visits for non-emergency conditions.',
    },
    {
      icon: <Security color="primary" sx={{ fontSize: 40 }} />,
      title: 'Data Security',
      description: 'Your medical data is encrypted and stored securely with industry-standard security protocols.',
    },
    {
      icon: <HealthAndSafety color="primary" sx={{ fontSize: 40 }} />,
      title: 'Preventive Care',
      description: 'Receive personalized health recommendations and preventive care guidance based on your health profile.',
    },
  ];

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main' }}>
            HealthXpert
          </Typography>
          <Button color="inherit" onClick={() => navigate('/login')} sx={{ mr: 2 }}>
            Login
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: 12,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Transform Healthcare with AI
              </Typography>
              <Typography variant="h5" paragraph sx={{ opacity: 0.9, mb: 4 }}>
                Connect with healthcare professionals, get AI-powered health insights, and manage your health journey with confidence.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register/patient')}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'grey.100',
                    },
                  }}
                >
                  I'm a Patient
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/register/doctor')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  I'm a Doctor
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 400,
                }}
              >
                <LocalHospital sx={{ fontSize: 200, opacity: 0.3 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ mb: 6 }}>
          Why Choose HealthXpert?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ backgroundColor: 'grey.50', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to Transform Your Healthcare Experience?
          </Typography>
          <Typography variant="h6" paragraph color="text.secondary" sx={{ mb: 4 }}>
            Join thousands of patients and healthcare providers who trust HealthXpert for their medical needs.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register/patient')}
            sx={{ mr: 2 }}
          >
            Get Started Today
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: 'primary.main', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" textAlign="center">
            © 2024 HealthXpert. All rights reserved. | This platform is for informational purposes only and does not replace professional medical advice.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;