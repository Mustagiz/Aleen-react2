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
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ArrowForward,
  VpnKey,
  Security
} from '../components/icons';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ScriptWordmark, TrackedTagline } from '../components/brand/BrandLockup';
import AtelierDoodles from '../components/illustrations/AtelierDoodles';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

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
        bgcolor: '#FFFFFF',
        color: '#080F1C'
      }}
    >
      {/* =========================================================================
          LEFT WING: Complete White Canvas with Haute Couture Atelier Doodles
          (Desktop Only, md+)
          ========================================================================= */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: { md: 1, lg: 1.15 },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { md: 4.5, lg: 6 },
          bgcolor: '#FFFFFF',
          color: '#080F1C',
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid #F1F5F9'
        }}
      >
        {/* Top: Authentic Brand Lockup */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Elegant Monogram Medallion */}
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: '#080F1C',
                border: '1.5px solid rgba(212, 175, 55, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontFamily: '"Cinzel", "Playfair Display", "Times New Roman", serif',
                fontWeight: 700,
                fontSize: '1.3rem',
                boxShadow: '0 4px 14px rgba(8, 15, 28, 0.12)'
              }}
            >
              A
            </Box>
            <Box>
              <ScriptWordmark
                name="Aleen Clothing"
                color="#080F1C"
                fontSize="27px"
                lineHeight={1.1}
              />
              <TrackedTagline
                text="CONSCIOUSLY CURATED"
                color="#64748B"
                fontSize="0.58rem"
                tracking="0.32em"
                rules={true}
                ruleColor="rgba(212, 175, 55, 0.55)"
                ruleWidth={18}
                sx={{ mt: 0.2 }}
              />
            </Box>
          </Box>
        </Box>

        {/* Center: Hand-Drawn Atelier Doodles Canvas (Replaces dense marketing text) */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            my: 'auto',
            py: 2,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <AtelierDoodles />
          <Typography
            sx={{
              fontFamily: '"Cinzel", "Playfair Display", serif',
              letterSpacing: '0.22em',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#94A3B8',
              textAlign: 'center',
              mt: 2,
              textTransform: 'uppercase'
            }}
          >
            Haute Couture Atelier · Craft &amp; Point of Sale
          </Typography>
        </Box>

        {/* Bottom: Subtle System Status */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            pt: 2.5,
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: '#10B981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
              }}
            />
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.74rem', fontWeight: 600 }}>
              Encrypted Boutique Terminal Session
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
            Enterprise Edition · v2.4
          </Typography>
        </Box>
      </Box>

      {/* =========================================================================
          RIGHT WING: Complete White Authentication Surface (Clean & Focused)
          ========================================================================= */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 5, md: 6, lg: 8 },
          bgcolor: '#FFFFFF',
          minHeight: '100vh'
        }}
      >
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: 410 }}
        >
          {/* Mobile-Only Header Brand Lockup */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              mb: 4
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#080F1C',
                border: '1.5px solid rgba(212, 175, 55, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontFamily: '"Cinzel", "Playfair Display", serif',
                fontWeight: 700,
                fontSize: '1.4rem',
                mb: 1.5,
                boxShadow: '0 4px 14px rgba(8, 15, 28, 0.15)'
              }}
            >
              A
            </Box>
            <ScriptWordmark
              name="Aleen Clothing"
              color="#080F1C"
              fontSize="30px"
              lineHeight={1.1}
            />
            <TrackedTagline
              text="CONSCIOUSLY CURATED"
              color="#64748B"
              fontSize="0.6rem"
              tracking="0.32em"
              rules={true}
              ruleColor="rgba(8,15,28,0.2)"
              ruleWidth={22}
              sx={{ mt: 0.25 }}
            />
          </Box>

          {/* Form Header */}
          <Box sx={{ mb: 3.5 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.35rem', sm: '1.6rem' },
                color: '#080F1C',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                mb: 0.75
              }}
            >
              Terminal Sign In
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#64748B',
                fontSize: '0.86rem',
                lineHeight: 1.5
              }}
            >
              Enter authorized boutique credentials to access inventory, client fitting kanban, and point of sale.
            </Typography>
          </Box>

          {/* Error Message */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: '1px solid rgba(239, 68, 68, 0.25)',
                bgcolor: '#FEF2F2'
              }}
            >
              {error}
            </Alert>
          )}

          {/* Credentials Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 0.75,
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#334155'
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
                    borderRadius: '10px',
                    bgcolor: '#FFFFFF',
                    fontSize: '0.88rem',
                    transition: 'all 0.15s ease',
                    '& fieldset': {
                      borderColor: '#E2E8F0'
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#334155'
                  }}
                >
                  Password
                </Typography>
              </Box>
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
                        sx={{ color: '#94A3B8' }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    bgcolor: '#FFFFFF',
                    fontSize: '0.88rem',
                    transition: 'all 0.15s ease',
                    '& fieldset': {
                      borderColor: '#E2E8F0'
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

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ArrowForward />}
              sx={{
                mt: 1,
                py: 1.35,
                borderRadius: '9999px',
                bgcolor: '#080F1C',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'none',
                letterSpacing: '-0.01em',
                boxShadow: '0 4px 14px rgba(8, 15, 28, 0.15)',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  bgcolor: '#1E293B',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 8px 20px rgba(8, 15, 28, 0.22)'
                },
                '&:active': {
                  transform: 'scale(0.99)'
                }
              }}
            >
              {loading ? 'Verifying Terminal Access…' : 'Sign In to Atelier'}
            </Button>
          </Box>

          {/* Quick Demo Staff Access (Refined Utility Card) */}
          <Box
            sx={{
              mt: 3.5,
              p: 1.75,
              borderRadius: '12px',
              bgcolor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  bgcolor: '#FFFFFF',
                  color: '#080F1C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid #E2E8F0'
                }}
              >
                <VpnKey sx={{ fontSize: 16 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#080F1C', display: 'block', lineHeight: 1.2 }}>
                  Boutique Staff Demo
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem', display: 'block' }}>
                  admin@aleen.com · admin123
                </Typography>
              </Box>
            </Box>

            <Button
              size="small"
              variant="outlined"
              onClick={handleQuickDemoFill}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.74rem',
                color: '#080F1C',
                borderColor: '#CBD5E1',
                borderRadius: '9999px',
                px: 1.75,
                py: 0.5,
                bgcolor: '#FFFFFF',
                flexShrink: 0,
                '&:hover': {
                  borderColor: '#080F1C',
                  bgcolor: '#F1F5F9'
                }
              }}
            >
              Fill Credentials
            </Button>
          </Box>

          {/* Footer Copyright & Security Notice */}
          <Box sx={{ mt: 5, textAlign: 'center' }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: '#64748B', mb: 0.5 }}>
              <Security sx={{ fontSize: 14 }} />
              <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                Secure 256-Bit SSL Encrypted Connection
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: '#94A3B8',
                fontSize: '0.7rem'
              }}
            >
              © {new Date().getFullYear()} Aleen Clothing. All rights reserved.
            </Typography>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
}
