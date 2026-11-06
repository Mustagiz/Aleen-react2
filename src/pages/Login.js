import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Checkroom,
  Visibility,
  VisibilityOff,
  ArrowForward
} from '../components/icons';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const reduceMotion = useReducedMotion();

  const isDark = theme.palette.mode === 'dark';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('admin@aleen.com');
    setPassword('admin123');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: isDark ? '#080F1C' : '#D7DBDF', // Quiet cool-gray stage
        p: { xs: 2, sm: 4 },
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle stage ambient glow */}
      <Box
        sx={{
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(111, 76, 237, 0.08) 0%, rgba(8, 15, 28, 0) 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none'
        }}
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        {/* Floating White App Surface Card */}
        <Box
          sx={{
            bgcolor: isDark ? '#111827' : '#FFFFFF',
            borderRadius: '24px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: isDark
              ? '0 24px 60px rgba(0, 0, 0, 0.5)'
              : '0 20px 48px -10px rgba(8, 15, 28, 0.12), 0 1px 3px rgba(8, 15, 28, 0.04)',
            p: { xs: 3.5, sm: 5 },
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header Brand Lockup */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 3.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#080F1C',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: '0 4px 14px rgba(8, 15, 28, 0.25)'
              }}
            >
              <Checkroom sx={{ fontSize: 24 }} />
            </Box>

            <Typography
              sx={{
                fontFamily: '"DM Sans", "Inter", sans-serif',
                fontWeight: 900,
                letterSpacing: '0.14em',
                color: isDark ? '#F8FAFC' : '#080F1C',
                textTransform: 'uppercase',
                fontSize: '1.2rem',
                lineHeight: 1.2
              }}
            >
              Aleen<span style={{ fontWeight: 400, opacity: 0.75 }}>&nbsp;Clothing</span>
            </Typography>

            {/* Violet Pill Chip */}
            <Box
              sx={{
                mt: 1.25,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.4,
                py: 0.35,
                borderRadius: '9999px',
                bgcolor: isDark ? 'rgba(111, 76, 237, 0.15)' : '#F3F0FF',
                color: '#6F4CED',
                fontSize: '0.66rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6F4CED' }} />
              Couture Atelier POS & CRM
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: isDark ? '#94A3B8' : '#66707B',
                fontWeight: 500,
                fontSize: '0.84rem',
                mt: 2
              }}
            >
              Sign in to your boutique terminal
            </Typography>
          </Box>

          {/* Error Notice */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                borderRadius: '14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: '1px solid rgba(239, 68, 68, 0.2)',
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2'
              }}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 0.65,
                  fontWeight: 650,
                  fontSize: '0.74rem',
                  color: isDark ? '#CBD5E1' : '#334155'
                }}
              >
                Email Address
              </Typography>
              <TextField
                fullWidth
                placeholder="name@aleen.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                inputProps={{ autoComplete: 'email' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F7F8FA',
                    fontSize: '0.88rem',
                    transition: 'all 0.18s ease',
                    '& fieldset': {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E1E4EA'
                    },
                    '&:hover fieldset': {
                      borderColor: '#080F1C'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#080F1C',
                      borderWidth: '1.5px'
                    }
                  }
                }}
              />
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 0.65,
                  fontWeight: 650,
                  fontSize: '0.74rem',
                  color: isDark ? '#CBD5E1' : '#334155'
                }}
              >
                Password
              </Typography>
              <TextField
                fullWidth
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                inputProps={{ autoComplete: 'current-password' }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: isDark ? '#94A3B8' : '#969DA7' }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F7F8FA',
                    fontSize: '0.88rem',
                    transition: 'all 0.18s ease',
                    '& fieldset': {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E1E4EA'
                    },
                    '&:hover fieldset': {
                      borderColor: '#080F1C'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#080F1C',
                      borderWidth: '1.5px'
                    }
                  }
                }}
              />
            </Box>

            {/* Signature Dark Navy Ink Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ArrowForward />}
              sx={{
                mt: 1,
                py: 1.4,
                borderRadius: '9999px',
                bgcolor: '#080F1C',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'none',
                letterSpacing: '-0.01em',
                boxShadow: '0 4px 14px rgba(8, 15, 28, 0.22)',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  bgcolor: '#1D2531',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 8px 20px rgba(8, 15, 28, 0.3)'
                },
                '&:active': {
                  transform: 'scale(0.99)'
                }
              }}
            >
              {loading ? 'Authenticating…' : 'Sign In to Boutique'}
            </Button>
          </Box>

          {/* Quick Demo Credentials Pill Button */}
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              onClick={handleQuickDemoFill}
              sx={{
                px: 1.75,
                py: 0.65,
                borderRadius: '9999px',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F4F5F7',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E1E4EA',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.8,
                transition: 'all 0.18s ease',
                '&:hover': {
                  borderColor: '#6F4CED',
                  bgcolor: isDark ? 'rgba(111, 76, 237, 0.12)' : '#F3F0FF'
                }
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6F4CED' }} />
              <Typography
                sx={{
                  fontSize: '0.74rem',
                  fontWeight: 650,
                  color: isDark ? '#E2E8F0' : '#475569'
                }}
              >
                Auto-Fill Demo Credentials (admin@aleen.com)
              </Typography>
            </Box>
          </Box>

          {/* Stage Footer Note */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: isDark ? '#64748B' : '#969DA7',
              mt: 3.5,
              fontWeight: 500,
              fontSize: '0.72rem'
            }}
          >
            © {new Date().getFullYear()} Aleen Clothing · Boutique Atelier Operating System
          </Typography>
        </Box>
      </motion.div>
    </Box>
  );
}
