import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * AtelierBespokeLoader
 * 
 * Signature haute couture loading state for Aleen.
 * Features an animated golden needle & thread monogram ring,
 * radial emerald caustics, and elegant luxury serif typography.
 */
export default function AtelierBespokeLoader({
  message = 'Preparing Atelier Console...',
  subtitle = 'Aleen Haute Couture & Tailoring',
  compact = false,
  fullScreen = false
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: fullScreen ? '100vh' : (compact ? 160 : '50vh'),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 1.5 : 2.5,
        p: 2,
        position: 'relative'
      }}
    >
      {/* Radiant Caustic Glow Behind Loader */}
      <Box
        sx={{
          position: 'absolute',
          width: compact ? 120 : 220,
          height: compact ? 120 : 220,
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(20, 184, 166, 0.18) 0%, rgba(217, 119, 6, 0.08) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(15, 118, 110, 0.12) 0%, rgba(245, 158, 11, 0.08) 50%, transparent 70%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
          animation: 'atelierPulse 3s ease-in-out infinite'
        }}
      />

      {/* Animated Haute Couture Monogram Ring */}
      <Box
        component={motion.div}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
        sx={{
          width: compact ? 52 : 76,
          height: compact ? 52 : 76,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg
          width={compact ? 52 : 76}
          height={compact ? 52 : 76}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Outer Track */}
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(10, 77, 70, 0.1)'}
            strokeWidth="3"
            strokeDasharray="4 4"
          />

          {/* Golden Thread Arc */}
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="url(#goldGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="75 180"
          />

          {/* Emerald Accent Arc */}
          <circle
            cx="50"
            cy="50"
            r="34"
            stroke="url(#emeraldGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="45 150"
          />

          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#78350F" />
              <stop offset="35%" stopColor="#D97706" />
              <stop offset="70%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#042F2E" />
              <stop offset="50%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#2DD4BF" />
            </linearGradient>
          </defs>
        </svg>

        {/* Central Bespoke Needle & Diamond Monogram */}
        <Box
          sx={{
            position: 'absolute',
            width: compact ? 26 : 38,
            height: compact ? 26 : 38,
            borderRadius: '50%',
            background: isDark
              ? 'linear-gradient(135deg, #042F2E 0%, #0F1E1D 100%)'
              : 'linear-gradient(135deg, #0A4D46 0%, #0F766E 100%)',
            border: isDark ? '1.5px solid #F59E0B' : '1.5px solid #C28D4B',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FDE68A',
            fontSize: compact ? '0.75rem' : '0.95rem',
            fontWeight: 800,
            fontFamily: '"Cormorant Garamond", Georgia, serif'
          }}
        >
          ⚜
        </Box>
      </Box>

      {/* Typography & Shimmer Progress */}
      <Box sx={{ textAlign: 'center', zIndex: 1, maxWidth: 320 }}>
        <Typography
          sx={{
            fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
            fontWeight: 700,
            fontSize: compact ? '0.95rem' : '1.18rem',
            letterSpacing: '0.04em',
            color: isDark ? '#F8FAFC' : '#0F172A',
            lineHeight: 1.2
          }}
        >
          {message}
        </Typography>

        {subtitle && !compact && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontSize: '0.68rem',
              color: isDark ? '#2DD4BF' : '#0F766E',
              opacity: 0.9
            }}
          >
            {subtitle}
          </Typography>
        )}

        {/* Shimmering Linear Progress Bar */}
        <Box
          sx={{
            width: compact ? 100 : 160,
            height: 3,
            borderRadius: 9999,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(10, 77, 70, 0.1)',
            overflow: 'hidden',
            mx: 'auto',
            mt: compact ? 1 : 1.75,
            position: 'relative'
          }}
        >
          <Box
            component={motion.div}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            sx={{
              width: '60%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, #14B8A6 35%, #F59E0B 70%, transparent 100%)',
              borderRadius: 9999
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
