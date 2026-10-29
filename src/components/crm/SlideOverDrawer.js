import React from 'react';
import { Drawer, Box, Typography, IconButton, Divider, useTheme } from '@mui/material';
import { Close } from '@mui/icons-material';

export default function SlideOverDrawer({
  open,
  onClose,
  title,
  subtitle,
  actions,
  children,
  width = 480
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: width },
          maxWidth: '100vw',
          background: isDark ? '#102020' : '#FFFFFF',
          borderLeft: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.15)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
      ModalProps={{
        BackdropProps: {
          sx: {
            backdropFilter: 'blur(3px)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)'
          }
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.1)',
          background: isDark ? 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)' : '#F8FAFC'
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {actions}
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ 
              color: 'text.secondary',
              '&:hover': { color: 'text.primary', background: 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)' } 
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Body Content */}
      <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
        {children}
      </Box>
    </Drawer>
  );
}
