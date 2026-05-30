import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { LocalHospital } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const RegisterDoctor: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    specialization: '',
    license_number: '',
    experience_years: '',
    consultation_fee: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.experience_years && parseInt(formData.experience_years) < 0) {
      setError('Please enter valid years of experience');
      setLoading(false);
      return;
    }

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        specialization: formData.specialization,
        license_number: formData.license_number,
        experience_years: parseInt(formData.experience_years),
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : 0,
      };

      await register(userData, 'doctor');
      navigate('/doctor/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <LocalHospital sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              HealthXpert
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Register as Doctor
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="name"
                  label="Full Name"
                  id="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="specialization"
                  label="Specialization"
                  id="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="e.g., Cardiology, Dermatology, General Medicine"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="license_number"
                  label="Medical License Number"
                  id="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="experience_years"
                  label="Years of Experience"
                  type="number"
                  id="experience_years"
                  value={formData.experience_years}
                  onChange={handleChange}
                  disabled={loading}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="consultation_fee"
                  label="Consultation Fee (Optional)"
                  type="number"
                  id="consultation_fee"
                  value={formData.consultation_fee}
                  onChange={handleChange}
                  disabled={loading}
                  inputProps={{ min: 0, step: 0.01 }}
                  placeholder="Enter fee in USD"
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Register as Doctor'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link to="/login" style={{ textDecoration: 'none', color: '#2C5282' }}>
                  Sign in here
                </Link>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Are you a patient?{' '}
                <Link to="/register/patient" style={{ textDecoration: 'none', color: '#2C5282' }}>
                  Register as Patient
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterDoctor;