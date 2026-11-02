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
      ink: '#4A130F',
      border: '#93261F',
      innerRing: '#C2554A'
    },
    gold: {
      ink: '#3D2C10',
      border: '#8A6A27',
      innerRing: '#C9A227'
    },
    emerald: {
      ink: '#08281F',
      border: '#155D46',
      innerRing: '#2E8B6A'
    },
    sapphire: {
      ink: '#06263C',
      border: '#0F5C8B',
      innerRing: '#4FB4E8'
    },
    plum: {
      ink: '#3F2340',
      border: '#8A4A76',
      innerRing: '#C97BA6'
    },
    slate: {
      ink: '#232220',
      border: '#4B4A47',
      innerRing: '#7A766F'
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
            fontFamily: '"DM Sans", sans-serif',
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
      bg: 'radial-gradient(circle at 35% 35%, #C2554A 0%, #93261F 65%, #4A130F 100%)',
      border: '#93261F',
      shadow: '0 8px 20px -2px rgba(147, 38, 31, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.35)',
      ring: 'rgba(245, 215, 210, 0.6)',
      textColor: '#FFFFFF'
    },
    gold: {
      bg: 'radial-gradient(circle at 35% 35%, #C9A227 0%, #8A6A27 65%, #3D2C10 100%)',
      border: '#8A6A27',
      shadow: '0 8px 20px -2px rgba(138, 106, 39, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.45)',
      ring: 'rgba(250, 245, 233, 0.7)',
      textColor: '#FFFFFF'
    },
    emerald: {
      bg: 'radial-gradient(circle at 35% 35%, #2E8B6A 0%, #155D46 65%, #08281F 100%)',
      border: '#155D46',
      shadow: '0 8px 20px -2px rgba(21, 93, 70, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.35)',
      ring: 'rgba(200, 230, 215, 0.65)',
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
            fontFamily: '"DM Sans", sans-serif',
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
