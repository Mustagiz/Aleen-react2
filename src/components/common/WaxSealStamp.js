import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * WaxSealStamp
 * An animated couture wax seal / atelier stamp ("PAID", "BESPOKE", "APPROVED", "DISPATCHED")
 * Provides a tactile, satisfying seal of craftsmanship.
 */
export default function WaxSealStamp({
  label = 'PAID',
  subtitle = 'ATELIER ALEEN',
  variant = 'crimson', // 'crimson' | 'gold' | 'emerald'
  size = 72,
  animate = true,
  sx = {}
}) {
  const colorMap = {
    crimson: {
      bg: 'radial-gradient(circle at 35% 35%, #EF4444 0%, #B91C1C 65%, #7F1D1D 100%)',
      border: '#DC2626',
      shadow: '0 8px 20px -2px rgba(185, 28, 28, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.35)',
      ring: 'rgba(254, 202, 202, 0.6)',
      textColor: '#FFFFFF'
    },
    gold: {
      bg: 'radial-gradient(circle at 35% 35%, #FBBF24 0%, #D97706 65%, #92400E 100%)',
      border: '#B45309',
      shadow: '0 8px 20px -2px rgba(217, 119, 6, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.45)',
      ring: 'rgba(254, 243, 199, 0.7)',
      textColor: '#FFFFFF'
    },
    emerald: {
      bg: 'radial-gradient(circle at 35% 35%, #14B8A6 0%, #0F766E 65%, #042F2E 100%)',
      border: '#0F766E',
      shadow: '0 8px 20px -2px rgba(15, 118, 110, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.35)',
      ring: 'rgba(204, 251, 241, 0.65)',
      textColor: '#FFFFFF'
    }
  };

  const scheme = colorMap[variant] || colorMap.crimson;

  return (
    <Box
      component={animate ? motion.div : 'div'}
      {...(animate ? {
        initial: { scale: 1.5, opacity: 0, rotate: -15 },
        animate: { scale: 1, opacity: 1, rotate: -8 },
        transition: { type: 'spring', stiffness: 260, damping: 20 }
      } : {})}
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: scheme.bg,
        boxShadow: scheme.shadow,
        border: `2px solid ${scheme.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...sx
      }}
    >
      {/* Outer concentric stamped rim */}
      <Box
        sx={{
          position: 'absolute',
          inset: '3px',
          borderRadius: '50%',
          border: `1px dashed ${scheme.ring}`,
          pointerEvents: 'none'
        }}
      />

      <Typography
        sx={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontWeight: 800,
          fontSize: `${size * 0.22}px`,
          letterSpacing: '0.12em',
          lineHeight: 1,
          color: scheme.textColor,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
          textTransform: 'uppercase'
        }}
      >
        {label}
      </Typography>

      {subtitle && (
        <Typography
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 700,
            fontSize: `${size * 0.1}px`,
            letterSpacing: '0.08em',
            color: scheme.textColor,
            opacity: 0.88,
            mt: 0.3,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
            textTransform: 'uppercase'
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
