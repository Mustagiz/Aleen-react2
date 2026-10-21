import React from 'react';
import { Box, Typography, Divider, Chip, Link, useTheme } from '@mui/material';
import { Diamond, ShieldOutlined, CloudDone, Keyboard, Speed } from '@mui/icons-material';
import { useData } from '../../contexts/DataContext';

export default function AtelierFooter() {
  const { profile } = useData();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        pt: 3,
        pb: 2.5,
        borderTop: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 118, 110, 0.12)',
        color: 'text.secondary',
        fontSize: '0.8rem',
        '@media print': { display: 'none' }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 2
        }}
      >
        {/* Left: Branding & Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Diamond sx={{ fontSize: 16, color: '#D97706' }} />
            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '0.02em' }}>
              {profile?.businessName || 'Aleen Clothing'}
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: 'text.disabled' }}>•</Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CloudDone sx={{ fontSize: 14, color: '#059669' }} />
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
              Cloud Sync: Active
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: 'text.disabled' }}>•</Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ShieldOutlined sx={{ fontSize: 14, color: '#D97706' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              256-Bit SSL Encrypted
            </Typography>
          </Box>
        </Box>

        {/* Right: Atelier Hotkey Badges */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Keyboard sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Hotkeys:
            </Typography>
          </Box>

          <Chip
            label="Cmd + K : Search"
            size="small"
            sx={{
              height: 20,
              fontSize: '0.68rem',
              fontWeight: 700,
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,118,110,0.06)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,118,110,0.15)'
            }}
          />

          <Chip
            label="Cmd + B : Sidebar"
            size="small"
            sx={{
              height: 20,
              fontSize: '0.68rem',
              fontWeight: 700,
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,118,110,0.06)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,118,110,0.15)'
            }}
          />

          <Chip
            label="Alt + N : Quick Bill"
            size="small"
            sx={{
              height: 20,
              fontSize: '0.68rem',
              fontWeight: 700,
              bgcolor: 'rgba(217, 119, 6, 0.08)',
              color: '#D97706',
              border: '1px solid rgba(217, 119, 6, 0.25)'
            }}
          />
        </Box>
      </Box>

      {/* Bottom Sub-footer */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          pt: 1.5,
          borderTop: '1px dashed',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
          fontSize: '0.72rem'
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          © {new Date().getFullYear()} {profile?.businessName || 'Aleen Clothing'}. Tailored for luxury boutiques and bespoke salons.
        </Typography>

        <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace' }}>
          Terminal v2.4-enterprise • Build #4348
        </Typography>
      </Box>
    </Box>
  );
}
