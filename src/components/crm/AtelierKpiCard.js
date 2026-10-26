import React from 'react';
import { Card, CardContent, Box, Typography, Chip, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
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
    if (sapphireAccent) return isDark ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(2, 132, 199, 0.22)';
    return isDark ? '1px solid rgba(20, 184, 166, 0.2)' : '1px solid rgba(15, 118, 110, 0.12)';
  };

  const getTopGradient = () => {
    if (redAccent) return 'linear-gradient(90deg, #DC2626 0%, #EF4444 50%, #F87171 100%)';
    if (goldAccent) return 'linear-gradient(90deg, #B45309 0%, #D97706 50%, #F59E0B 100%)';
    if (sapphireAccent) return 'linear-gradient(90deg, #0F172A 0%, #1E3A8A 50%, #38BDF8 100%)';
    return 'linear-gradient(90deg, #042F2E 0%, #0F766E 50%, #14B8A6 100%)';
  };

  const getHoverBorderColor = () => {
    if (redAccent) return isDark ? '#F87171' : '#DC2626';
    if (goldAccent) return isDark ? '#F59E0B' : '#D97706';
    if (sapphireAccent) return isDark ? '#38BDF8' : '#0284C7';
    return isDark ? '#2DD4BF' : '#0F766E';
  };

  const getHoverShadow = () => {
    if (redAccent) {
      return isDark
        ? '0 18px 40px -4px rgba(0, 0, 0, 0.65), 0 0 32px rgba(239, 68, 68, 0.42)'
        : '0 16px 36px -4px rgba(239, 68, 68, 0.28), 0 0 24px rgba(248, 113, 113, 0.24)';
    }
    if (goldAccent) {
      return isDark
        ? '0 18px 40px -4px rgba(0, 0, 0, 0.65), 0 0 32px rgba(217, 119, 6, 0.42)'
        : '0 16px 36px -4px rgba(217, 119, 6, 0.28), 0 0 24px rgba(245, 158, 11, 0.24)';
    }
    if (sapphireAccent) {
      return isDark
        ? '0 18px 40px -4px rgba(0, 0, 0, 0.65), 0 0 32px rgba(2, 132, 199, 0.42)'
        : '0 16px 36px -4px rgba(2, 132, 199, 0.28), 0 0 24px rgba(56, 189, 248, 0.24)';
    }
    return isDark
      ? '0 18px 40px -4px rgba(0, 0, 0, 0.65), 0 0 32px rgba(20, 184, 166, 0.4)'
      : '0 16px 36px -4px rgba(15, 118, 110, 0.28), 0 0 24px rgba(15, 118, 110, 0.22)';
  };

  const getIconBg = () => {
    if (redAccent) return isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(254, 226, 226, 0.85)';
    if (goldAccent) return isDark ? 'rgba(217, 119, 6, 0.16)' : 'rgba(254, 243, 199, 0.85)';
    if (sapphireAccent) return isDark ? 'rgba(2, 132, 199, 0.16)' : 'rgba(224, 242, 254, 0.85)';
    return isDark ? 'rgba(15, 118, 110, 0.2)' : 'rgba(240, 253, 250, 0.9)';
  };

  const getIconBorder = () => {
    if (redAccent) return isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.15)';
    if (goldAccent) return isDark ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid rgba(217, 119, 6, 0.15)';
    if (sapphireAccent) return isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(2, 132, 199, 0.15)';
    return isDark ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid rgba(15, 118, 110, 0.15)';
  };

  const getIconColor = () => {
    if (redAccent) return isDark ? '#F87171' : '#DC2626';
    if (goldAccent) return isDark ? '#FBBF24' : '#D97706';
    if (sapphireAccent) return isDark ? '#38BDF8' : '#0284C7';
    return isDark ? '#2DD4BF' : '#0F766E';
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5, transition: { duration: 0.2, ease: 'easeOut' } }}
      sx={{ height: '100%' }}
    >
      <Card
        onClick={onClick}
        sx={{
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease',
          background: isDark
            ? 'radial-gradient(ellipse at 85% 0%, rgba(20, 184, 166, 0.08) 0%, rgba(13, 27, 27, 0.96) 75%)'
            : 'radial-gradient(ellipse at 85% 0%, rgba(15, 118, 110, 0.035) 0%, #FFFFFF 75%)',
          border: getBorderColor(),
          boxShadow: isDark
            ? 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 24px rgba(0, 0, 0, 0.45)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 4px 20px -2px rgba(15, 118, 110, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
          '&:hover': {
            boxShadow: getHoverShadow(),
            borderColor: getHoverBorderColor(),
            '& .kpi-icon-jewel': {
              transform: 'scale(1.08) rotate(3deg)'
            }
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
          p: { xs: '12px 13px !important', sm: '18px 20px !important', md: '22px 24px !important' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Header: Title and Icon Jewel */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
            <Typography
              variant="subtitle2"
              noWrap
              sx={{
                color: isDark ? 'rgba(203, 213, 225, 0.85)' : '#475569',
                fontWeight: 700,
                fontSize: { xs: '0.64rem', sm: '0.74rem', md: '0.78rem' },
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {title}
            </Typography>

            {icon && (
              <Box
                className="kpi-icon-jewel"
                sx={{
                  width: { xs: 28, sm: 36, md: 40 },
                  height: { xs: 28, sm: 36, md: 40 },
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: getIconBg(),
                  border: getIconBorder(),
                  color: getIconColor(),
                  boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(15, 118, 110, 0.08)',
                  transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '& svg': {
                    fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
                  }
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
              my: { xs: 0.2, sm: 0.5 },
              fontSize: { xs: '1.15rem', sm: '1.45rem', md: '1.85rem' },
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
    </Box>
  );
}
