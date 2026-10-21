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
  Chip,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  EmailOutlined,
  LockOutlined,
  Visibility,
  VisibilityOff,
  Diamond,
  ShieldOutlined,
  AutoAwesome,
  Straighten,
  PointOfSale,
  ArrowForward
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
        width: '100vw',
        display: 'flex',
        bgcolor: '#042F2E',
        overflow: 'hidden'
      }}
    >
      {/* LEFT SHOWCASE PANEL (Desktop only) */}
      <Box
        sx={{
          flex: { xs: 0, lg: '0 0 52%' },
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { lg: 7, xl: 9 },
          position: 'relative',
          background: 'radial-gradient(circle at 15% 20%, rgba(15, 118, 110, 0.45) 0%, rgba(4, 47, 46, 0.95) 75%), #042F2E',
          borderRight: '1px solid rgba(217, 119, 6, 0.2)',
          color: '#F8FAFC',
          overflow: 'hidden'
        }}
      >
        {/* Decorative Golden Ambient Glows */}
        <Box
          sx={{
            position: 'absolute',
            top: '-15%',
            left: '-10%',
            width: 450,
            height: 450,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(217, 119, 6, 0.15) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none',
            filter: 'blur(40px)'
          }}
        />

        {/* Top Branding */}
        <Box sx={{ zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(217, 119, 6, 0.35)',
                border: '1px solid rgba(254, 243, 199, 0.3)'
              }}
            >
              <Diamond sx={{ color: '#FFFFFF', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  color: '#FFFFFF',
                  textTransform: 'uppercase'
                }}
              >
                Aleen Atelier
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#D97706',
                  letterSpacing: '0.15em',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  display: 'block'
                }}
              >
                Haute Couture POS & CRM
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Middle Value Proposition */}
        <Box sx={{ zIndex: 2, my: 'auto', py: 4 }}>
          <Chip
            icon={<AutoAwesome sx={{ color: '#D97706 !important', fontSize: '14px !important' }} />}
            label="Boutique Terminal v2.4 Enterprise"
            size="small"
            sx={{
              bgcolor: 'rgba(217, 119, 6, 0.15)',
              color: '#F59E0B',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              fontWeight: 700,
              mb: 3,
              px: 1
            }}
          />

          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 800,
              lineHeight: 1.15,
              mb: 2.5,
              color: '#FFFFFF'
            }}
          >
            Elegance in design.<br />
            <span style={{ color: '#F59E0B' }}>Mastery</span> in operations.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'rgba(240, 253, 250, 0.75)',
              maxWidth: 480,
              lineHeight: 1.7,
              mb: 4,
              fontSize: '1.05rem'
            }}
          >
            The dedicated retail intelligence suite crafted for luxury fashion ateliers, bridal salons, and bespoke garment boutiques.
          </Typography>

          {/* Feature Highlights Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, maxWidth: 500 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'rgba(15, 118, 110, 0.25)',
                border: '1px solid rgba(15, 118, 110, 0.4)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <PointOfSale sx={{ color: '#F59E0B', fontSize: 20, mb: 0.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                Multi-Tender POS
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(240, 253, 250, 0.65)' }}>
                Cash, UPI QR, EMI, & Customer Credit Khata
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'rgba(15, 118, 110, 0.25)',
                border: '1px solid rgba(15, 118, 110, 0.4)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <Straighten sx={{ color: '#F59E0B', fontSize: 20, mb: 0.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                Tailoring Kanban
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(240, 253, 250, 0.65)' }}>
                Bespoke measurements, cutting & trial tracking
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Bottom Trust & Security */}
        <Box sx={{ zIndex: 2, display: 'flex', alignItems: 'center', gap: 1.5, color: 'rgba(240, 253, 250, 0.5)' }}>
          <ShieldOutlined sx={{ fontSize: 18, color: '#D97706' }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Cloud-Synchronized Ledger • End-to-End Encrypted Atelier Terminal
          </Typography>
        </Box>
      </Box>

      {/* RIGHT AUTHENTICATION PANEL */}
      <Box
        sx={{
          flex: { xs: '1 1 100%', lg: '0 0 48%' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 6, md: 8 },
          bgcolor: { xs: '#042F2E', lg: '#F8FAFC' },
          position: 'relative'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 440 }}
        >
          {/* Main Login Card */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3.5, sm: 5 },
              borderRadius: 4,
              bgcolor: '#FFFFFF',
              border: '1px solid',
              borderColor: { xs: 'rgba(15, 118, 110, 0.3)', lg: 'rgba(226, 232, 240, 0.9)' },
              boxShadow: {
                xs: '0 20px 40px rgba(0, 0, 0, 0.4)',
                lg: '0 20px 50px -10px rgba(4, 47, 46, 0.08)'
              }
            }}
          >
            {/* Header Icon & Titles */}
            <Box sx={{ textAlign: 'center', mb: 3.5 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 6px 16px rgba(15, 118, 110, 0.25)',
                  border: '1px solid rgba(217, 119, 6, 0.3)'
                }}
              >
                <Diamond sx={{ color: '#D97706', fontSize: 26 }} />
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 900,
                  color: '#042F2E',
                  letterSpacing: '-0.02em',
                  mb: 0.5
                }}
              >
                Atelier Terminal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Sign in to manage sales, bespoke tailoring & client accounts
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}
              >
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.75, display: 'block' }}>
                  Atelier User Email
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="admin@aleen.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined sx={{ color: '#0F766E', fontSize: 18 }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#F8FAFC',
                      '&:hover fieldset': { borderColor: '#0F766E' },
                      '&.Mui-focused fieldset': { borderColor: '#0F766E', borderWidth: '1.5px' }
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.75, display: 'block' }}>
                  Secure Terminal Password
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ color: '#0F766E', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: 'text.secondary' }}
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#F8FAFC',
                      '&:hover fieldset': { borderColor: '#0F766E' },
                      '&.Mui-focused fieldset': { borderColor: '#0F766E', borderWidth: '1.5px' }
                    }
                  }}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ArrowForward />}
                sx={{
                  mt: 1.5,
                  py: 1.35,
                  borderRadius: 2.5,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  letterSpacing: '0.02em',
                  background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 20px rgba(15, 118, 110, 0.35)',
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #042F2E 0%, #0F766E 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 10px 24px rgba(15, 118, 110, 0.45)'
                  }
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Terminal'}
              </Button>
            </Box>

            {/* Quick Demo Credentials Pill */}
            <Box
              sx={{
                mt: 3.5,
                p: 2,
                borderRadius: 2.5,
                bgcolor: '#F0FDFA',
                border: '1px dashed rgba(15, 118, 110, 0.35)',
                textAlign: 'center'
              }}
            >
              <Typography variant="caption" sx={{ color: '#042F2E', fontWeight: 700, display: 'block', mb: 0.5 }}>
                Boutique Demo Credentials:
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontFamily: 'monospace', mb: 1.5 }}>
                admin@aleen.com / admin123
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={handleQuickDemoFill}
                sx={{
                  borderColor: '#0F766E',
                  color: '#0F766E',
                  borderRadius: 1.5,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  py: 0.5,
                  px: 2,
                  '&:hover': {
                    bgcolor: 'rgba(15, 118, 110, 0.08)',
                    borderColor: '#0F766E'
                  }
                }}
              >
                Auto-Fill Demo Credentials
              </Button>
            </Box>
          </Paper>

          {/* Copyright & Subtitle */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: { xs: 'rgba(240, 253, 250, 0.5)', lg: 'text.secondary' },
              mt: 3,
              fontWeight: 500
            }}
          >
            © {new Date().getFullYear()} Aleen Atelier. All rights reserved.
          </Typography>
        </motion.div>
      </Box>
    </Box>
  );
}
