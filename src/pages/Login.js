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
  useTheme,
  Stack
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
        bgcolor: isDark ? '#080F1C' : '#F4F5F7',
        color: isDark ? '#F8FAFC' : '#080F1C'
      }}
    >
      {/* =========================================================================
          LEFT WING: Haute Couture Editorial Showcase (Desktop Only, md+)
          ========================================================================= */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: { md: 1, lg: 1.15 },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { md: 5, lg: 7 },
          bgcolor: '#080F1C',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Subtle geometric architectural watermarks */}
        <Box
          sx={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 440,
            height: 440,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(8, 15, 28, 0) 70%)',
            pointerEvents: 'none'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, rgba(8, 15, 28, 0) 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Top: Authentic Brand Lockup */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Elegant Monogram Medallion */}
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                bgcolor: '#0E1726',
                border: '1.5px solid rgba(212, 175, 55, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontFamily: '"Cinzel", "Playfair Display", "Times New Roman", serif',
                fontWeight: 700,
                fontSize: '1.35rem',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
              }}
            >
              A
            </Box>
            <Box>
              <ScriptWordmark
                name="Aleen Clothing"
                color="#FFFFFF"
                fontSize="28px"
                lineHeight={1.1}
              />
              <TrackedTagline
                text="CONSCIOUSLY CURATED"
                color="rgba(255, 255, 255, 0.7)"
                fontSize="0.58rem"
                tracking="0.34em"
                rules={true}
                ruleColor="rgba(212, 175, 55, 0.5)"
                ruleWidth={18}
                sx={{ mt: 0.2 }}
              />
            </Box>
          </Box>
        </Box>

        {/* Middle: Editorial Narrative & Pillars */}
        <Box sx={{ position: 'relative', zIndex: 1, my: 'auto', py: 6, maxWidth: 520 }}>
          <Typography
            variant="overline"
            sx={{
              color: '#D4AF37',
              letterSpacing: '0.2em',
              fontWeight: 800,
              fontSize: '0.74rem',
              display: 'block',
              mb: 1.5
            }}
          >
            HAUTE COUTURE ATELIER TERMINAL
          </Typography>

          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Playfair Display", "Cinzel", "Inter", serif',
              fontWeight: 600,
              fontSize: { md: '2.1rem', lg: '2.5rem' },
              lineHeight: 1.25,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              mb: 2.5
            }}
          >
            Precision bespoke craft.
            <br />
            Seamless luxury operations.
          </Typography>

          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.72)',
              fontSize: '0.92rem',
              lineHeight: 1.7,
              mb: 4.5
            }}
          >
            Unified workstation for bespoke apparel tailoring, customer-facing dual-screen displays,
            instant digital receipt dispatches, and private clientele relationship management.
          </Typography>

          {/* 3 Pillar Cards */}
          <Stack spacing={2}>
            {[
              {
                number: '01',
                title: 'Bespoke Tailoring & Workshop Kanban',
                desc: 'Job spec sheets, cutting patterns, master artisans, and live trial fitting alerts.'
              },
              {
                number: '02',
                title: 'Omni-Channel POS & Instant Invoicing',
                desc: 'GST tax breakdowns, 80mm/58mm thermal receipts, and 1-click WhatsApp PDF bills.'
              },
              {
                number: '03',
                title: 'Dual-Monitor Customer Facing Display',
                desc: '0ms Firestore cloud mirror with interactive fashion lookbooks and live cart totals.'
              }
            ].map((pillar) => (
              <Box
                key={pillar.number}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    color: '#D4AF37',
                    pt: 0.2
                  }}
                >
                  {pillar.number}
                </Typography>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.86rem', color: '#FFFFFF', mb: 0.2 }}>
                    {pillar.title}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    {pillar.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Bottom: Verified Terminal Status */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            pt: 3,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#10B981',
                boxShadow: '0 0 10px #10B981'
              }}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.76rem', fontWeight: 600 }}>
              End-to-End Encrypted Terminal Session
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.72rem' }}>
            Enterprise Edition · v2.4
          </Typography>
        </Box>
      </Box>

      {/* =========================================================================
          RIGHT WING: Authentication Surface (Clean, Focused, Professional)
          ========================================================================= */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 5, md: 6, lg: 8 },
          bgcolor: isDark ? '#0D1526' : '#FAFCFA',
          minHeight: '100vh'
        }}
      >
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: 420 }}
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
                boxShadow: '0 4px 14px rgba(8, 15, 28, 0.2)'
              }}
            >
              A
            </Box>
            <ScriptWordmark
              name="Aleen Clothing"
              color={isDark ? '#F8FAFC' : '#080F1C'}
              fontSize="30px"
              lineHeight={1.1}
            />
            <TrackedTagline
              text="CONSCIOUSLY CURATED"
              color={isDark ? '#94A3B8' : '#66707B'}
              fontSize="0.6rem"
              tracking="0.32em"
              rules={true}
              ruleColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(8,15,28,0.2)'}
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
                fontSize: { xs: '1.4rem', sm: '1.65rem' },
                color: isDark ? '#F8FAFC' : '#080F1C',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                mb: 1
              }}
            >
              Terminal Sign In
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: isDark ? '#94A3B8' : '#66707B',
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
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2'
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
                    borderRadius: '10px',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                    fontSize: '0.88rem',
                    transition: 'all 0.15s ease',
                    '& fieldset': {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E1E4EA'
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
                    color: isDark ? '#CBD5E1' : '#334155'
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
                    borderRadius: '10px',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                    fontSize: '0.88rem',
                    transition: 'all 0.15s ease',
                    '& fieldset': {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E1E4EA'
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
                boxShadow: '0 4px 14px rgba(8, 15, 28, 0.2)',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  bgcolor: '#1D2531',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 8px 20px rgba(8, 15, 28, 0.28)'
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
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F4F5F7',
              border: '1px solid',
              borderColor: 'divider',
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
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                  color: isDark ? '#FFFFFF' : '#080F1C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <VpnKey sx={{ fontSize: 16 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block', lineHeight: 1.2 }}>
                  Boutique Staff Demo
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: 'block' }}>
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
                color: 'text.primary',
                borderColor: 'divider',
                borderRadius: '9999px',
                px: 1.75,
                py: 0.5,
                bgcolor: 'background.paper',
                flexShrink: 0,
                '&:hover': {
                  borderColor: 'text.primary',
                  bgcolor: 'action.hover'
                }
              }}
            >
              Fill Credentials
            </Button>
          </Box>

          {/* Footer Copyright & Security Notice */}
          <Box sx={{ mt: 5, textAlign: 'center' }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: 'text.secondary', mb: 0.5 }}>
              <Security sx={{ fontSize: 14 }} />
              <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                Secure 256-Bit SSL Encrypted Connection
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.secondary',
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
