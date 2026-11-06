import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * LoaderOne
 * High-performance, luxury animated loader component.
 * Follows the Mandate design system:
 * Deep Navy (#080F1C) outer orbital arc, Violet (#6F4CED) inner counter-arc,
 * subtle stage glow and smooth rotational physics.
 */
export function LoaderOne({
  size = 48,
  text,
  compact = false,
  color = '#080F1C',
  accentColor = '#6F4CED',
  className = ''
}) {
  const outerSize = typeof size === 'number' ? size : 48;
  const innerSize = Math.round(outerSize * 0.68);

  return (
    <Box
      className={`loader-one-container ${className}`}
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 1 : 1.75,
        p: 1
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: outerSize,
          height: outerSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Soft background pulse aura */}
        <Box
          component={motion.div}
          animate={{
            scale: [0.92, 1.08, 0.92],
            opacity: [0.18, 0.32, 0.18]
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          sx={{
            position: 'absolute',
            width: outerSize,
            height: outerSize,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
            filter: 'blur(8px)',
            pointerEvents: 'none'
          }}
        />

        {/* Outer orbital track */}
        <Box
          sx={{
            position: 'absolute',
            width: outerSize,
            height: outerSize,
            borderRadius: '50%',
            border: '2px solid rgba(8, 15, 28, 0.08)'
          }}
        />

        {/* Outer orbital spinning arc */}
        <Box
          component={motion.div}
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1.1,
            ease: 'linear'
          }}
          sx={{
            position: 'absolute',
            width: outerSize,
            height: outerSize,
            borderRadius: '50%',
            border: '2.5px solid transparent',
            borderTopColor: color,
            borderRightColor: color,
            filter: 'drop-shadow(0 2px 4px rgba(8, 15, 28, 0.15))'
          }}
        />

        {/* Inner counter-rotating violet arc */}
        <Box
          component={motion.div}
          animate={{ rotate: -360 }}
          transition={{
            repeat: Infinity,
            duration: 0.85,
            ease: 'linear'
          }}
          sx={{
            position: 'absolute',
            width: innerSize,
            height: innerSize,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderBottomColor: accentColor,
            borderLeftColor: accentColor,
            filter: 'drop-shadow(0 1px 3px rgba(111, 76, 237, 0.25))'
          }}
        />

        {/* Central pulse dot */}
        <Box
          component={motion.div}
          animate={{
            scale: [0.75, 1.15, 0.75],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            repeat: Infinity,
            duration: 1.2,
            ease: 'easeInOut'
          }}
          sx={{
            width: Math.max(5, Math.round(outerSize * 0.12)),
            height: Math.max(5, Math.round(outerSize * 0.12)),
            borderRadius: '50%',
            bgcolor: color
          }}
        />
      </Box>

      {text && (
        <Typography
          sx={{
            fontSize: '0.78rem',
            fontWeight: 650,
            color: '#66707B',
            letterSpacing: '0.01em',
            mt: 0.5
          }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );
}

export function LoaderOneDemo() {
  return <LoaderOne />;
}

export default LoaderOne;
