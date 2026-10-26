import React from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import {
  Checkroom,
  DryCleaning,
  AccessibilityNew,
  Face3
} from '@mui/icons-material';

const SILHOUETTES = {
  suit: { label: 'Bespoke Suit', icon: DryCleaning, color: '#0284C7' },
  tuxedo: { label: 'Tuxedo', icon: DryCleaning, color: '#0F172A' },
  sherwani: { label: 'Royal Sherwani', icon: AccessibilityNew, color: '#D97706' },
  gown: { label: 'Evening Gown', icon: Face3, color: '#E11D48' },
  kurta: { label: 'Kurta Set', icon: Checkroom, color: '#059669' },
  abaya: { label: 'Haute Abaya', icon: Checkroom, color: '#7C3AED' },
  blazer: { label: 'Couture Blazer', icon: DryCleaning, color: '#0F766E' },
  shirt: { label: 'Tailored Shirt', icon: Checkroom, color: '#2563EB' }
};

export default function GarmentSilhouetteBadge({
  type = 'suit',
  customLabel,
  showLabel = true,
  size = 'small',
  sx = {}
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const normalized = String(type || '').toLowerCase().trim();
  const matchedKey = Object.keys(SILHOUETTES).find(k => normalized.includes(k)) || 'suit';
  const config = SILHOUETTES[matchedKey];
  const IconComponent = config.icon;
  const displayLabel = customLabel || config.label;

  const isSmall = size === 'small';

  return (
    <Tooltip title={displayLabel} arrow placement="top">
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.6,
          px: isSmall ? 0.9 : 1.2,
          py: isSmall ? 0.3 : 0.45,
          borderRadius: '8px',
          background: isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(15, 118, 110, 0.04)',
          border: '1px solid',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(15, 118, 110, 0.15)',
          ...sx
        }}
      >
        <IconComponent
          sx={{
            fontSize: isSmall ? 14 : 17,
            color: isDark ? '#2DD4BF' : '#0F766E'
          }}
        />
        {showLabel && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: isSmall ? '0.68rem' : '0.74rem',
              color: isDark ? 'rgba(241, 245, 249, 0.9)' : '#1E293B',
              letterSpacing: '0.02em',
              textTransform: 'capitalize'
            }}
          >
            {displayLabel}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}
