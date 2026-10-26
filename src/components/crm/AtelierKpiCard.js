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
  redAccent = false,
  onClick
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Safely extract trend label and positive state
  const trendLabel = (typeof trend === 'object' && trend !== null)
    ? String(trend.value || trend.label || '')
    : (trend !== undefined && trend !== null ? String(trend) : '');

  const isTrendPositive = (typeof trend === 'object' && trend !== null && trend.isPositive !== undefined)
    ? Boolean(trend.isPositive)
    : Boolean(trendPositive);

  const getBorderColor = () => {
    if (redAccent) return isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(239, 68, 68, 0.22)';
    if (goldAccent) return isDark ? '1px solid rgba(217, 119, 6, 0.35)' : '1px solid rgba(217, 119, 6, 0.22)';
    return isDark ? '1px solid rgba(20, 184, 166, 0.2)' : '1px solid rgba(15, 118, 110, 0.12)';
  };

  const getTopGradient = () => {
    if (redAccent) return 'linear-gradient(90deg, #DC2626 0%, #EF4444 50%, #F87171 100%)';
    if (goldAccent) return 'linear-gradient(90deg, #B45309 0%, #D97706 50%, #F59E0B 100%)';
    return 'linear-gradient(90deg, #042F2E 0%, #0F766E 50%, #14B8A6 100%)';
  };

  const getHoverBorderColor = () => {
    if (redAccent) return isDark ? '#EF4444' : '#DC2626';
    if (goldAccent) return isDark ? '#F59E0B' : '#D97706';
    return isDark ? '#2DD4BF' : '#0F766E';
  };

  const getHoverShadow = () => {
    if (redAccent) return isDark ? '0 12px 32px rgba(239, 68, 68, 0.25)' : '0 10px 28px rgba(239, 68, 68, 0.16)';
    if (goldAccent) return isDark ? '0 12px 32px rgba(217, 119, 6, 0.25)' : '0 10px 28px rgba(217, 119, 6, 0.16)';
    return isDark ? '0 12px 32px rgba(20, 184, 166, 0.2)' : '0 10px 28px rgba(15, 118, 110, 0.14)';
  };

  const getIconBg = () => {
    if (redAccent) return isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(254, 226, 226, 0.85)';
    if (goldAccent) return isDark ? 'rgba(217, 119, 6, 0.16)' : 'rgba(254, 243, 199, 0.85)';
    return isDark ? 'rgba(15, 118, 110, 0.2)' : 'rgba(240, 253, 250, 0.9)';
  };

  const getIconBorder = () => {
    if (redAccent) return isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.15)';
    if (goldAccent) return isDark ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid rgba(217, 119, 6, 0.15)';
    return isDark ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid rgba(15, 118, 110, 0.15)';
  };

  const getIconColor = () => {
    if (redAccent) return isDark ? '#F87171' : '#DC2626';
    if (goldAccent) return isDark ? '#FBBF24' : '#D97706';
    return isDark ? '#2DD4BF' : '#0F766E';
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.22s ease',
        background: isDark
          ? 'radial-gradient(ellipse at 85% 0%, rgba(20, 184, 166, 0.08) 0%, rgba(13, 27, 27, 0.96) 75%)'
          : 'radial-gradient(ellipse at 85% 0%, rgba(15, 118, 110, 0.035) 0%, #FFFFFF 75%)',
        border: getBorderColor(),
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 24px rgba(0, 0, 0, 0.45)'
          : 'inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 4px 20px -2px rgba(15, 118, 110, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
        '&:hover': onClick ? {
          transform: 'translateY(-3px)',
          boxShadow: getHoverShadow(),
          borderColor: getHoverBorderColor()
        } : {
          borderColor: isDark ? 'rgba(20, 184, 166, 0.3)' : 'rgba(15, 118, 110, 0.22)'
        }
      }}
    >
      {/* Decorative top accent metallic hairline */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3.5px',
          background: getTopGradient()
        }}
      />

      <CardContent sx={{
        p: { xs: '14px 16px !important', sm: '18px 20px !important', md: '22px 24px !important' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Header: Title and Icon Jewel */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, mb: 1 }}>
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              color: isDark ? 'rgba(203, 213, 225, 0.8)' : '#475569',
              fontWeight: 700,
              fontSize: { xs: '0.7rem', sm: '0.74rem', md: '0.78rem' },
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
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
                width: { xs: 32, sm: 36, md: 40 },
                height: { xs: 32, sm: 36, md: 40 },
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: getIconBg(),
                border: getIconBorder(),
                color: getIconColor(),
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(15, 118, 110, 0.08)'
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        {/* Primary Metric Value */}
        <Typography
          variant="h3"
          noWrap
          sx={{
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
            fontWeight: 800,
            color: 'text.primary',
            letterSpacing: '-0.025em',
            my: { xs: 0.25, sm: 0.5 },
            fontSize: { xs: '1.25rem', sm: '1.45rem', md: '1.85rem' },
            fontVariantNumeric: 'tabular-nums',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {value}
        </Typography>

        {/* Footer: Subtitle & Micro-Trend Badge */}
        <Box sx={{ mt: 'auto', pt: 0.75 }}>
          {subtitle ? (
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: isDark ? 'rgba(148, 163, 184, 0.85)' : '#64748B',
                fontWeight: 500,
                fontSize: { xs: '0.68rem', sm: '0.73rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
                mb: 0.75
              }}
            >
              {subtitle}
            </Typography>
          ) : (
            <Box sx={{ height: '1.1rem', mb: 0.75 }} />
          )}

          <Box sx={{ minHeight: 22, display: 'flex', alignItems: 'center' }}>
            {trendLabel ? (
              <Chip
                size="small"
                icon={isTrendPositive ? <TrendingUp style={{ fontSize: '0.85rem' }} /> : <TrendingDown style={{ fontSize: '0.85rem' }} />}
                label={trendLabel}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  backgroundColor: isTrendPositive
                    ? isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5'
                    : isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEF2F2',
                  color: isTrendPositive
                    ? isDark ? '#34D399' : '#059669'
                    : isDark ? '#F87171' : '#DC2626',
                  border: isTrendPositive
                    ? isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(16, 185, 129, 0.25)'
                    : isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.25)',
                  '& .MuiChip-icon': {
                    color: 'inherit',
                    marginLeft: '4px',
                    marginRight: '-2px'
                  },
                  '& .MuiChip-label': {
                    paddingLeft: '6px',
                    paddingRight: '8px'
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
