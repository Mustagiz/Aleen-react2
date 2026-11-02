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

  // Safely extract trend label and positive state
  const trendLabel = (typeof trend === 'object' && trend !== null)
    ? String(trend.value || trend.label || '')
    : (trend !== undefined && trend !== null ? String(trend) : '');

  const isTrendPositive = (typeof trend === 'object' && trend !== null && trend.isPositive !== undefined)
    ? Boolean(trend.isPositive)
    : Boolean(trendPositive);

  // Horizon-style circular pastel icon tile
  const getIconBg = () => {
    if (redAccent) return isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(220, 38, 38, 0.08)';
    if (goldAccent) return isDark ? `${secondaryColor}26` : 'rgba(45, 212, 191, 0.12)';
    if (sapphireAccent) return isDark ? 'rgba(59, 130, 246, 0.16)' : 'rgba(37, 99, 235, 0.08)';
    return isDark ? `${primaryColor}26` : '#F1EFFC';
  };

  const getIconColor = () => {
    if (redAccent) return isDark ? '#F87171' : '#DC2626';
    if (goldAccent) return isDark ? secondaryColor : '#0D9488';
    if (sapphireAccent) return isDark ? '#60A5FA' : '#2563EB';
    return isDark ? '#9B8FF5' : '#5B4BD1';
  };

  const trendColor = isTrendPositive
    ? (isDark ? '#34D399' : '#059669')
    : (isDark ? '#F87171' : '#DC2626');

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
          borderRadius: '20px',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          background: isDark ? '#1D1A2E' : '#FFFFFF',
          border: '1px solid transparent',
          boxShadow: isDark
            ? '0 4px 20px rgba(0, 0, 0, 0.4)'
            : '14px 17px 40px 4px rgba(112, 114, 176, 0.10)',
          '&:hover': {
            boxShadow: isDark
              ? '0 12px 32px rgba(0, 0, 0, 0.55)'
              : '14px 17px 40px 4px rgba(112, 114, 176, 0.16)'
          }
        }}
      >
        <CardContent sx={{
          p: { xs: '13px 14px !important', sm: '14px 18px !important' },
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.25 },
          height: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
          '&:last-child': { pb: { xs: '13px !important', sm: '14px !important' } }
        }}>
          {/* Horizon-style circular pastel icon tile */}
          {icon && (
            <Box
              sx={{
                width: { xs: 32, sm: 36, md: 38 },
                height: { xs: 32, sm: 36, md: 38 },
                borderRadius: '50%',
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

          {/* Stat column: label above value, growth line below (Horizon MiniStatistics) */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                color: isDark ? 'rgba(203, 213, 225, 0.9)' : '#5B5B66',
                fontWeight: 600,
                fontSize: { xs: '0.66rem', sm: '0.7rem', md: '0.72rem' },
                lineHeight: 1.25,
                letterSpacing: '0.01em',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {title}
            </Typography>
            <Typography
              noWrap
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.12rem', sm: '1.22rem', md: '1.3rem' },
                lineHeight: 1.2,
                fontVariantNumeric: 'tabular-nums',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                mt: { xs: 0.3, md: 0.35 },
                mb: { xs: 0.3, md: 0.35 }
              }}
            >
              {value}
            </Typography>
            {(trendLabel || subtitle) && (
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, minWidth: 0 }}>
                {trendLabel && (
                  <Typography
                    noWrap
                    sx={{
                      fontSize: { xs: '0.6rem', sm: '0.63rem' },
                      fontWeight: 700,
                      color: trendColor,
                      flexShrink: 0
                    }}
                  >
                    {trendLabel}
                  </Typography>
                )}
                {subtitle && (
                  <Typography
                    sx={{
                      fontSize: { xs: '0.6rem', sm: '0.63rem' },
                      fontWeight: 400,
                      color: isDark ? 'rgba(148, 163, 184, 0.85)' : '#9A9AA6',
                      flex: 1,
                      minWidth: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Optional right-aligned action (Horizon endContent slot) */}
          {headerAction && (
            <Box sx={{ flexShrink: 0, alignSelf: 'flex-start' }}>
              {headerAction}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
