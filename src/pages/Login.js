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
import loginIllustration from '../assets/aleen-login-illustration.png';

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
  const primary = theme.palette.primary.main;
  const primaryLight = theme.palette.primary.light;
  const secondary = theme.palette.secondary.main;
  const gold = theme.palette.warning.main;
  const canvas = isDark ? theme.palette.background.default : '#FAF8FE';
  const fieldBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF';
  const fieldBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#E6E1F6';

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

  const wordmark = (size) => (
    <Typography
      sx={{
        fontFamily: '"DM Sans", "Inter", sans-serif',
        fontWeight: 900,
        letterSpacing: '0.16em',
        color: 'text.primary',
        textTransform: 'uppercase',
        fontSize: size,
        lineHeight: 1.2
      }}
    >
      Aleen<span style={{ fontWeight: 300 }}>&nbsp;Clothing</span>
    </Typography>
  );

  const illustrationCard = (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: 210, md: 340 },
        mx: 'auto',
        borderRadius: '28px',
        overflow: 'hidden',
        bgcolor: isDark ? '#F6F3FC' : 'transparent',
        boxShadow: isDark ? '0 24px 60px rgba(0, 0, 0, 0.5)' : 'none'
      }}
    >
      <Box
        component="img"
        src={loginIllustration}
        alt="Fashion illustration of a woman in a lavender gown"
        sx={{ display: 'block', width: '100%', height: 'auto' }}
      />
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        bgcolor: canvas,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* flat geometric accents across the canvas */}
      <Box
        sx={{
          position: 'absolute',
          top: -140,
          right: -100,
          width: 380,
          height: 380,
          borderRadius: '50%',
          bgcolor: `${secondary}1F`,
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -120,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: '50%',
          bgcolor: `${primary}14`,
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '18%',
          left: '-30px',
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: `2px solid ${gold}55`,
          pointerEvents: 'none',
          display: { xs: 'none', lg: 'block' }
        }}
      />

      {/* LEFT brand + illustration panel (tablet/desktop) */}
      <Box
        sx={{
          flex: { md: '0 0 44%', xl: '0 0 48%' },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          p: { md: 7, xl: 9 },
          position: 'relative',
          borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#F0ECFA'}`
        }}
      >
        <Box sx={{ mb: 5 }}>{wordmark('1.35rem')}</Box>
        {illustrationCard}
        <Typography
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.92rem',
            mt: 4
          }}
        >
          The boutique terminal for couture retail.
        </Typography>
      </Box>

      {/* RIGHT authentication panel */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
          position: 'relative'
        }}
      >
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* mobile wordmark + compact illustration */}
          <Box sx={{ display: { md: 'none' }, textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${primaryLight} 0%, ${primary} 100%)`,
                boxShadow: `0 8px 20px ${primary}44`,
                color: '#FFFFFF',
                mx: 'auto',
                mb: 1.5
              }}
            >
              <Checkroom sx={{ fontSize: 22 }} />
            </Box>
            {wordmark('1.05rem')}
            <Box sx={{ mt: 3 }}>{illustrationCard}</Box>
          </Box>

          {/* desktop brand mark above form */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${primaryLight} 0%, ${primary} 100%)`,
                boxShadow: `0 8px 20px ${primary}44`,
                color: '#FFFFFF',
                mx: 'auto',
                mb: 2
              }}
            >
              <Checkroom sx={{ fontSize: 23 }} />
            </Box>
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'text.primary',
              textAlign: 'center',
              mb: 0.5,
              fontSize: { xs: '1.6rem', sm: '2rem' }
            }}
          >
            Welcome back
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              fontWeight: 500,
              mb: 3
            }}
          >
            Sign in to your boutique terminal.
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              {error}
            </Alert>
          )}

          {/* login form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              inputProps={{ autoComplete: 'email' }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '999px',
                  bgcolor: fieldBg,
                  px: 1.5,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: fieldBorder },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: primary },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primary, borderWidth: '1.5px' }
                }
              }}
            />

            <TextField
              fullWidth
              placeholder="Password"
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
                      sx={{ color: 'text.secondary' }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '999px',
                  bgcolor: fieldBg,
                  px: 1.5,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: fieldBorder },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: primary },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primary, borderWidth: '1.5px' }
                }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ArrowForward />}
              sx={{
                mt: 1,
                py: 1.5,
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '0.95rem',
                letterSpacing: '0.01em',
                background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
                color: '#FFFFFF',
                boxShadow: `0 10px 24px ${primary}55`,
                transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: `0 14px 30px ${primary}66`
                },
                '&:active': {
                  transform: 'translateY(0) scale(0.99)'
                }
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </Box>

          {/* demo credentials helper */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              size="small"
              variant="text"
              onClick={handleQuickDemoFill}
              sx={{
                color: 'text.secondary',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                '&:hover': { color: primary, backgroundColor: 'transparent' }
              }}
            >
              Auto-Fill Demo Credentials
            </Button>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.secondary',
                fontFamily: 'monospace',
                mt: 0.25,
                opacity: 0.75
              }}
            >
              admin@aleen.com
            </Typography>
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: 'text.secondary',
              mt: 4,
              fontWeight: 500,
              opacity: 0.7
            }}
          >
            © {new Date().getFullYear()} Aleen Clothing
          </Typography>
        </motion.div>
      </Box>
    </Box>
  );
}
