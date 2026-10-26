import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

/**
 * AtelierStitchDivider
 * A couture basting stitch divider inspired by master tailoring chalk & thread hairlines.
 */
export default function AtelierStitchDivider({
  label,
  gold = true,
  sx = {},
  icon
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const threadColor = gold
    ? (isDark ? 'rgba(217, 119, 6, 0.45)' : 'rgba(217, 119, 6, 0.35)')
    : (isDark ? 'rgba(20, 184, 166, 0.4)' : 'rgba(15, 118, 110, 0.3)');

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        my: 2,
        ...sx
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          borderBottom: '1.5px dashed',
          borderColor: threadColor
        }}
      />
      {(label || icon) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            px: 1.5,
            py: 0.25,
            borderRadius: '9999px',
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.85)',
            border: '1px solid',
            borderColor: threadColor,
            backdropFilter: 'blur(8px)'
          }}
        >
          {icon}
          {label && (
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontSize: '0.68rem',
                color: gold
                  ? (isDark ? '#FBBF24' : '#D97706')
                  : (isDark ? '#2DD4BF' : '#0F766E')
              }}
            >
              {label}
            </Typography>
          )}
        </Box>
      )}
      <Box
        sx={{
          flexGrow: 1,
          borderBottom: '1.5px dashed',
          borderColor: threadColor
        }}
      />
    </Box>
  );
}
