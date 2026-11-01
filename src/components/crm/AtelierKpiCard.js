import React from 'react';
import { Card, CardContent, Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

export default function AtelierKpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive = true,
  goldAccent = false,
  redAccent = false,
  sapphireAccent = false,
  headerAction,
  onClick
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary?.main || '#2DD4BF';
  const cardRadius = theme.custom?.designSystem?.shape?.cardRadius ?? (theme.shape?.borderRadius || 14);

  // Safely extract trend label and positive state
  const trendLabel = (typeof trend === 'object' && trend !== null)
    ? String(trend.value || trend.label || '')
    : (trend !== undefined && trend !== null ? String(trend) : '');

  const isTrendPositive = (typeof trend === 'object' && trend !== null && trend.isPositive !== undefined)
    ? Boolean(trend.isPositive)
    : Boolean(trendPositive);

  const getIconBg = () => {
    if (redAccent) return isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(220, 38, 38, 0.07)';
    if (goldAccent) return isDark ? `${secondaryColor}26` : 'rgba(45, 212, 191, 0.1)';
    if (sapphireAccent) return isDark ? 'rgba(59, 130, 246, 0.16)' : 'rgba(37, 99, 235, 0.07)';
    return isDark ? `${primaryColor}26` : '#F1EFFC';
  };

  const getIconColor = () => {
    if (redAccent) return isDark ? '#F87171' : '#DC2626';
    if (goldAccent) return isDark ? secondaryColor : '#0D9488';
    if (sapphireAccent) return isDark ? '#60A5FA' : '#2563EB';
    return isDark ? '#9B8FF5' : '#5B4BD1';
  };

  const statusColor = isTrendPositive
    ? (isDark ? '#34D399' : '#059669')
    : (isDark ? '#F87171' : '#DC2626');

  const statusBg = isTrendPositive
    ? (isDark ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5')
    : (isDark ? 'rgba(239, 68, 68, 0.14)' : '#FEF2F2');

  const statusBorder = isTrendPositive
    ? (isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(16, 185, 129, 0.25)')
    : (isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.25)');

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 420, damping: 26 } }}
      whileTap={{ scale: 0.985 }}
      sx={{ height: '100%', transform: 'translateZ(0)' }}
    >
      <Card
        onClick={onClick}
        sx={{
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: `${cardRadius}px`,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease',
          background: isDark ? '#1D1A2E' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EFEFF4',
          boxShadow: isDark
            ? '0 4px 20px rgba(0, 0, 0, 0.4)'
            : '0 1px 2px rgba(31, 27, 46, 0.04), 0 4px 16px -4px rgba(31, 27, 46, 0.06)',
          '&:hover': {
            boxShadow: isDark
              ? '0 12px 32px rgba(0, 0, 0, 0.55)'
              : '0 12px 28px -6px rgba(124, 111, 232, 0.16), 0 1px 2px rgba(31, 27, 46, 0.05)',
            borderColor: isDark ? 'rgba(155, 143, 245, 0.35)' : '#7C6FE8'
          }
        }}
      >
        <CardContent sx={{
          p: { xs: '12px 12px !important', sm: '12px 14px !important', md: '14px 16px !important' },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Header: Icon Tile Left + Label + Optional Action */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1, md: 1.25 } }}>
            {icon && (
              <Box
                sx={{
                  width: { xs: 30, sm: 32, md: 34 },
                  height: { xs: 30, sm: 32, md: 34 },
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: getIconBg(),
                  color: getIconColor(),
                  transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '& svg': {
                    fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' }
                  }
                }}
              >
                {icon}
              </Box>
            )}
            <Typography
              variant="subtitle2"
              noWrap
              sx={{
                color: isDark ? 'rgba(203, 213, 225, 0.9)' : '#5B5B66',
                fontWeight: 600,
                fontSize: { xs: '0.68rem', sm: '0.72rem', md: '0.74rem' },
                letterSpacing: '0.01em',
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.3
              }}
            >
              {title}
            </Typography>
            {headerAction}
          </Box>

          {/* Numeric Value */}
          <Typography
            variant="h3"
            noWrap
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.25rem', sm: '1.35rem', md: '1.45rem' },
              lineHeight: 1.15,
              fontVariantNumeric: 'tabular-nums',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              mb: { xs: 0.9, md: 1 }
            }}
          >
            {value}
          </Typography>

          {/* Footer: Subtitle & Status Pill */}
          <Box
            sx={{
              mt: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 0.75,
              minHeight: 20
            }}
          >
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: isDark ? 'rgba(148, 163, 184, 0.85)' : '#9A9AA6',
                fontWeight: 500,
                fontSize: { xs: '0.66rem', sm: '0.7rem' },
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {subtitle || ''}
            </Typography>

            {trendLabel && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.4,
                  px: 0.8,
                  py: '1.5px',
                  borderRadius: '999px',
                  bgcolor: statusBg,
                  border: statusBorder,
                  flexShrink: 0,
                  maxWidth: '55%'
                }}
              >
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: statusColor, flexShrink: 0 }} />
                <Typography
                  sx={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: statusColor,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.4
                  }}
                >
                  {trendLabel}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
