import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * WaxSealStamp
 * An animated couture wax seal or retro rubber-stamp watermark ("PAID", "BESPOKE", "APPROVED", "DISPATCHED")
 * Provides a tactile, satisfying seal of craftsmanship and vintage accounting authority.
 */
export default function WaxSealStamp({
  label = 'PAID',
  subtitle = 'ATELIER ALEEN',
  variant = 'emerald', // 'crimson' | 'gold' | 'emerald'
  size = 72,
  animate = true,
  isWatermark = false,
  sx = {}
}) {
  const watermarkColors = {
    crimson: {
      ink: '#991B1B',
      border: '#B91C1C',
      innerRing: '#DC2626'
    },
    gold: {
      ink: '#92400E',
      border: '#B45309',
      innerRing: '#D97706'
    },
    emerald: {
      ink: '#064E3B',
      border: '#0F766E',
      innerRing: '#14B8A6'
    },
    sapphire: {
      ink: '#1E3A8A',
      border: '#1D4ED8',
      innerRing: '#3B82F6'
    },
    plum: {
      ink: '#701A75',
      border: '#86198F',
      innerRing: '#A21CAF'
    },
    slate: {
      ink: '#1E293B',
      border: '#334155',
      innerRing: '#475569'
    }
  };

  if (isWatermark) {
    const wmScheme = watermarkColors[variant] || watermarkColors.emerald;
    return (
      <Box
        component={animate ? motion.div : 'div'}
        {...(animate ? {
          initial: { scale: 1.25, opacity: 0, rotate: -18 },
          animate: { scale: 1, opacity: 0.52, rotate: -13 },
          transition: { type: 'spring', stiffness: 220, damping: 18 }
        } : {})}
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: `2.5px solid ${wmScheme.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          position: 'relative',
          boxSizing: 'border-box',
          opacity: 0.52,
          mixBlendMode: 'multiply',
          transform: 'rotate(-13deg)',
          pointerEvents: 'none',
          ...sx
        }}
      >
        {/* Outer subtle concentric decorative dashed border */}
        <Box
          sx={{
            position: 'absolute',
            inset: '3.5px',
            borderRadius: '50%',
            border: `1.5px dashed ${wmScheme.innerRing}`,
            pointerEvents: 'none'
          }}
        />

        {/* Vintage Top Subtitle Ribbon */}
        {subtitle && (
          <Typography
            sx={{
              fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif',
              fontWeight: 800,
              fontSize: `${Math.max(7.5, size * 0.082)}px`,
              letterSpacing: '0.18em',
              color: wmScheme.ink,
              textTransform: 'uppercase',
              lineHeight: 1,
              mb: 0.3
            }}
          >
            ★ {subtitle} ★
          </Typography>
        )}

        {/* Vintage Top Divider Rule */}
        <Box
          sx={{
            width: `${size * 0.62}px`,
            height: '1.2px',
            backgroundColor: wmScheme.innerRing,
            opacity: 0.85,
            mb: 0.3
          }}
        />

        {/* Center Main PAID Stamp */}
        <Typography
          sx={{
            fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif',
            fontWeight: 900,
            fontSize: `${size * 0.27}px`,
            letterSpacing: '0.14em',
            lineHeight: 1,
            color: wmScheme.ink,
            textTransform: 'uppercase'
          }}
        >
          {label}
        </Typography>

        {/* Vintage Bottom Divider Rule */}
        <Box
          sx={{
            width: `${size * 0.62}px`,
            height: '1.2px',
            backgroundColor: wmScheme.innerRing,
            opacity: 0.85,
            mt: 0.3
          }}
        />

        {/* Bottom Vintage Verification Text */}
        <Typography
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 800,
            fontSize: `${Math.max(6.5, size * 0.068)}px`,
            letterSpacing: '0.15em',
            color: wmScheme.ink,
            textTransform: 'uppercase',
            mt: 0.35
          }}
        >
          AUTHENTICATED
        </Typography>
      </Box>
    );
  }

  // Original solid wax seal stamp
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
