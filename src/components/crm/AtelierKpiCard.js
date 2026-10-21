import React from 'react';
import { Card, CardContent, Box, Typography, Chip, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export default function AtelierKpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive = true,
  goldAccent = false,
  onClick
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Safely extract trend label and positive state if trend is an object or string
  const trendLabel = (typeof trend === 'object' && trend !== null)
    ? String(trend.value || trend.label || '')
    : (trend !== undefined && trend !== null ? String(trend) : '');

  const isTrendPositive = (typeof trend === 'object' && trend !== null && trend.isPositive !== undefined)
    ? Boolean(trend.isPositive)
    : Boolean(trendPositive);

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        background: isDark
          ? 'linear-gradient(135deg, rgba(16, 32, 32, 0.95) 0%, rgba(8, 18, 18, 0.98) 100%)'
          : '#FFFFFF',
        border: goldAccent
          ? '1px solid rgba(217, 119, 6, 0.3)'
          : isDark
            ? '1px solid rgba(20, 184, 166, 0.15)'
            : '1px solid rgba(15, 118, 110, 0.12)',
        boxShadow: isDark
          ? '0 4px 20px rgba(0, 0, 0, 0.5)'
          : '0 4px 20px -2px rgba(15, 118, 110, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
        '&:hover': onClick ? {
          transform: 'translateY(-3px)',
          boxShadow: goldAccent
            ? '0 8px 25px rgba(217, 119, 6, 0.18)'
            : '0 8px 25px rgba(15, 118, 110, 0.14)',
          borderColor: goldAccent ? '#D97706' : '#0F766E'
        } : {}
      }}
    >
      {/* Decorative top accent border */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: goldAccent
            ? 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)'
            : 'linear-gradient(90deg, #0F766E 0%, #14B8A6 100%)'
        }}
      />

      <CardContent sx={{ p: '20px 22px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.secondary',
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {title}
          </Typography>

          {icon && (
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: goldAccent
                  ? isDark ? 'rgba(217, 119, 6, 0.15)' : '#FEF3C7'
                  : isDark ? 'rgba(15, 118, 110, 0.18)' : '#F0FDFA',
                color: goldAccent ? '#D97706' : '#0F766E'
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: 'text.primary',
            letterSpacing: '-0.02em',
            mb: 0.75,
            fontSize: '1.75rem'
          }}
        >
          {value}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {trendLabel ? (
            <Chip
              size="small"
              icon={isTrendPositive ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
              label={trendLabel}
              sx={{
                height: 22,
                fontSize: '0.725rem',
                fontWeight: 700,
                backgroundColor: isTrendPositive
                  ? isDark ? 'rgba(16, 185, 129, 0.18)' : '#DCFCE7'
                  : isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
                color: isTrendPositive ? '#059669' : '#DC2626',
                '& .MuiChip-icon': {
                  color: 'inherit',
                  fontSize: '0.875rem'
                }
              }}
            />
          ) : null}

          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 500
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
