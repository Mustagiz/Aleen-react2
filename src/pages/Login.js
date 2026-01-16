import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Box, Alert } from '@mui/material';
import { Store, Login as LoginIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials. Use admin@aleen.com / admin123');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container maxWidth="sm">
        <Paper elevation={4} sx={{ p: 5, borderRadius: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Store sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Aleen Clothing
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Inventory & Sales Management
            </Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              size="large"
              startIcon={<LoginIcon />}
              sx={{ mt: 3, py: 1.5 }}
            >
              Sign In
            </Button>
          </Box>
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
              Demo Credentials:<br />
              <strong>admin@aleen.com</strong> / <strong>admin123</strong>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
