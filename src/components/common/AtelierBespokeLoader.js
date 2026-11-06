import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { LoaderOne } from '../ui/loader';

/**
 * AtelierBespokeLoader
 * 
 * Signature loading state for Aleen.
 * Integrates LoaderOne with the Mandate quiet cool-gray stage aesthetic:
 * Deep Navy (#080F1C) + Violet (#6F4CED) orbital motion with DM Sans typography.
 */
export default function AtelierBespokeLoader({
  message = 'Preparing Atelier Console...',
  subtitle = 'Aleen Haute Couture & Tailoring',
  compact = false,
  fullScreen = false
}) {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: fullScreen ? '100vh' : (compact ? 160 : '45vh'),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 1.5 : 2.5,
        p: 2,
        position: 'relative'
      }}
    >
      {/* Central LoaderOne Animation */}
      <LoaderOne size={compact ? 44 : 64} color="#080F1C" accentColor="#6F4CED" />

      {/* Typography & Shimmer Progress */}
      <Box sx={{ textAlign: 'center', zIndex: 1, maxWidth: 360 }}>
        <Typography
          sx={{
            fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 700,
            fontSize: compact ? '0.88rem' : '1.05rem',
            letterSpacing: '-0.01em',
            color: '#080F1C',
            lineHeight: 1.25
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
              fontWeight: 650,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: '0.68rem',
              color: '#66707B'
            }}
          >
            {subtitle}
          </Typography>
        )}

        {/* Shimmering Linear Progress Bar */}
        <Box
          sx={{
            width: compact ? 90 : 140,
            height: 3,
            borderRadius: 9999,
            bgcolor: '#E1E4EA',
            overflow: 'hidden',
            mx: 'auto',
            mt: compact ? 1 : 1.75,
            position: 'relative'
          }}
        >
          <Box
            component={motion.div}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            sx={{
              width: '60%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, #080F1C 50%, #6F4CED 85%, transparent 100%)',
              borderRadius: 9999
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
