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

      <CardContent sx={{
        p: { xs: '12px 14px !important', sm: '16px 18px !important', md: '20px 22px !important' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              color: 'text.secondary',
              fontWeight: 700,
              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {title}
          </Typography>

          {icon && (
            <Box
              sx={{
                width: { xs: 30, sm: 34, md: 38 },
                height: { xs: 30, sm: 34, md: 38 },
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
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
          noWrap
          sx={{
            fontWeight: 800,
            color: 'text.primary',
            letterSpacing: '-0.02em',
            my: { xs: 0.25, sm: 0.5 },
            fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.75rem' },
            fontVariantNumeric: 'tabular-nums',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {value}
        </Typography>

        <Box sx={{ mt: 'auto', pt: 0.75 }}>
          {subtitle ? (
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: { xs: '0.68rem', sm: '0.72rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
                mb: 0.5
              }}
            >
              {subtitle}
            </Typography>
          ) : (
            <Box sx={{ height: '1.1rem', mb: 0.5 }} />
          )}

          <Box sx={{ minHeight: 22, display: 'flex', alignItems: 'center' }}>
            {trendLabel ? (
              <Chip
                size="small"
                icon={isTrendPositive ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                label={trendLabel}
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  backgroundColor: isTrendPositive
                    ? isDark ? 'rgba(16, 185, 129, 0.18)' : '#DCFCE7'
                    : isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
                  color: isTrendPositive ? '#059669' : '#DC2626',
                  '& .MuiChip-icon': {
                    color: 'inherit',
                    fontSize: '0.78rem'
                  }
                }}
              />
            ) : null}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
