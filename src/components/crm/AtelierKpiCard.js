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
  showJewelBadge = false,
  onClick
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary?.main || '#D97706';
  const primaryLight = theme.palette.primary.light;
  const primaryDark = theme.palette.primary.dark;
  const cardRadius = theme.custom?.designSystem?.shape?.cardRadius ?? (theme.shape?.borderRadius || 12);

  // Safely extract trend label and positive state
  const trendLabel = (typeof trend === 'object' && trend !== null)
    ? String(trend.value || trend.label || '')
    : (trend !== undefined && trend !== null ? String(trend) : '');

  const isTrendPositive = (typeof trend === 'object' && trend !== null && trend.isPositive !== undefined)
    ? Boolean(trend.isPositive)
    : Boolean(trendPositive);

  const getBorderColor = () => {
    if (redAccent) return isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(239, 68, 68, 0.22)';
    if (goldAccent) return isDark ? `1px solid ${secondaryColor}59` : `1px solid ${secondaryColor}38`;
    if (sapphireAccent) return isDark ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(2, 132, 199, 0.22)';
    return isDark ? '1px solid rgba(255, 255, 255, 0.08)' : `1px solid ${primaryColor}24`;
  };

  const getTopGradient = () => {
    if (redAccent) return 'linear-gradient(90deg, #991B1B 0%, #DC2626 35%, #F87171 70%, #EF4444 100%)';
    if (goldAccent) return `linear-gradient(90deg, ${secondaryColor}99 0%, ${secondaryColor} 50%, #FBBF24 100%)`;
    if (sapphireAccent) return 'linear-gradient(90deg, #0F172A 0%, #0284C7 35%, #38BDF8 70%, #2563EB 100%)';
    return `linear-gradient(90deg, ${primaryDark} 0%, ${primaryColor} 50%, ${primaryLight} 100%)`;
  };

  const getAmbientGlow = () => {
    if (redAccent) {
      return isDark
        ? 'radial-gradient(circle at 92% 82%, rgba(239, 68, 68, 0.16) 0%, rgba(220, 38, 38, 0.05) 38%, transparent 70%)'
        : 'radial-gradient(circle at 92% 82%, rgba(239, 68, 68, 0.10) 0%, rgba(254, 226, 226, 0.45) 42%, transparent 70%)';
    }
    if (goldAccent) {
      return isDark
        ? `radial-gradient(circle at 92% 82%, ${secondaryColor}26 0%, ${secondaryColor}0D 38%, transparent 70%)`
        : `radial-gradient(circle at 92% 82%, ${secondaryColor}1A 0%, rgba(254, 243, 199, 0.45) 42%, transparent 70%)`;
    }
    if (sapphireAccent) {
      return isDark
        ? 'radial-gradient(circle at 92% 82%, rgba(56, 189, 248, 0.16) 0%, rgba(2, 132, 199, 0.05) 38%, transparent 70%)'
        : 'radial-gradient(circle at 92% 82%, rgba(56, 189, 248, 0.10) 0%, rgba(224, 242, 254, 0.45) 42%, transparent 70%)';
    }
    return isDark
      ? `radial-gradient(circle at 92% 82%, ${primaryColor}26 0%, ${primaryColor}0D 38%, transparent 70%)`
      : `radial-gradient(circle at 92% 82%, ${primaryColor}1A 0%, rgba(255, 255, 255, 0.7) 42%, transparent 70%)`;
  };

  const getHoverBorderColor = () => {
    if (redAccent) return isDark ? '#F87171' : '#DC2626';
    if (goldAccent) return secondaryColor;
    if (sapphireAccent) return isDark ? '#38BDF8' : '#0284C7';
    return primaryColor;
  };

  const getHoverShadow = () => {
    if (redAccent) {
      return isDark
        ? '0 20px 44px -4px rgba(0, 0, 0, 0.7), 0 0 32px rgba(239, 68, 68, 0.35)'
        : '0 18px 40px -4px rgba(239, 68, 68, 0.25), 0 0 24px rgba(248, 113, 113, 0.2)';
    }
    if (goldAccent) {
      return isDark
        ? `0 20px 44px -4px rgba(0, 0, 0, 0.7), 0 0 32px ${secondaryColor}59`
        : `0 18px 40px -4px ${secondaryColor}40, 0 0 24px ${secondaryColor}33`;
    }
    if (sapphireAccent) {
      return isDark
        ? '0 20px 44px -4px rgba(0, 0, 0, 0.7), 0 0 32px rgba(2, 132, 199, 0.35)'
        : '0 18px 40px -4px rgba(2, 132, 199, 0.25), 0 0 24px rgba(56, 189, 248, 0.2)';
    }
    return isDark
      ? `0 20px 44px -4px rgba(0, 0, 0, 0.7), 0 0 32px ${primaryColor}59`
      : `0 18px 40px -4px ${primaryColor}38, 0 0 24px ${primaryColor}29`;
  };

  const getIconBg = () => {
    if (redAccent) return isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(254, 226, 226, 0.85)';
    if (goldAccent) return isDark ? `${secondaryColor}26` : `${secondaryColor}1A`;
    if (sapphireAccent) return isDark ? 'rgba(2, 132, 199, 0.16)' : 'rgba(224, 242, 254, 0.85)';
    return isDark ? `${primaryColor}26` : `${primaryColor}14`;
  };

  const getIconBorder = () => {
    if (redAccent) return isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.15)';
    if (goldAccent) return isDark ? `1px solid ${secondaryColor}4D` : `1px solid ${secondaryColor}29`;
    if (sapphireAccent) return isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(2, 132, 199, 0.15)';
    return isDark ? `1px solid ${primaryColor}4D` : `1px solid ${primaryColor}26`;
  };

  const getIconColor = () => {
    if (redAccent) return isDark ? '#F87171' : '#DC2626';
    if (goldAccent) return secondaryColor;
    if (sapphireAccent) return isDark ? '#38BDF8' : '#0284C7';
    return primaryColor;
  };

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
          background: `${getAmbientGlow()}, ${isDark
            ? 'linear-gradient(145deg, rgba(17, 24, 39, 0.98) 0%, rgba(13, 27, 27, 0.96) 100%)'
            : 'linear-gradient(145deg, #FFFFFF 0%, #FAFCFC 100%)'}`,
          border: getBorderColor(),
          boxShadow: isDark
            ? 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 8px 26px rgba(0, 0, 0, 0.45)'
            : `inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 20px -2px ${primaryColor}14, 0 1px 3px rgba(0, 0, 0, 0.02)`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '60%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent)',
            transform: 'skewX(-25deg)',
            transition: 'left 0.75s ease',
            zIndex: 1,
            pointerEvents: 'none'
          },
          '&:hover': {
            boxShadow: getHoverShadow(),
            borderColor: getHoverBorderColor(),
            '&::before': {
              left: '180%'
            },
            '& .kpi-icon-jewel': {
              transform: 'scale(1.08) rotate(3deg)'
            },
            '& .kpi-bg-watermark-icon': {
              transform: 'rotate(-4deg) scale(1.15)',
              opacity: isDark ? 0.22 : 0.15
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
            background: getTopGradient(),
            borderRadius: `${cardRadius}px ${cardRadius}px 0 0`,
            zIndex: 2
          }}
        />

        {/* Ambient Oversized Watermark Icon in Card Background */}
        {icon && (
          <Box
            className="kpi-bg-watermark-icon"
            sx={{
              position: 'absolute',
              right: { xs: -14, sm: -16, md: -20 },
              bottom: { xs: -14, sm: -16, md: -20 },
              zIndex: 0,
              pointerEvents: 'none',
              userSelect: 'none',
              color: getIconColor(),
              opacity: isDark ? 0.12 : 0.08,
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: 'rotate(-10deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: isDark
                ? 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.6))'
                : 'drop-shadow(0 4px 10px rgba(15, 118, 110, 0.12))',
              '& .MuiSvgIcon-root, & svg': {
                width: { xs: 90, sm: 108, md: 126 },
                height: { xs: 90, sm: 108, md: 126 },
                fontSize: { xs: '5.8rem !important', sm: '7rem !important', md: '8.2rem !important' },
                display: 'block'
              }
            }}
          >
            {icon}
          </Box>
        )}

        <CardContent sx={{
          p: { xs: '14px 15px !important', sm: '18px 20px !important', md: '22px 24px !important' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Header: Title with glowing jewel dot indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, mb: 0.6 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: getIconColor(),
                boxShadow: `0 0 6px ${getIconColor()}`,
                flexShrink: 0
              }}
            />
            <Typography
              variant="subtitle2"
              noWrap
              sx={{
                color: isDark ? 'rgba(203, 213, 225, 0.9)' : '#475569',
                fontWeight: 800,
                fontSize: { xs: '0.67rem', sm: '0.74rem', md: '0.78rem' },
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {title}
            </Typography>

            {icon && showJewelBadge && (
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
                    borderRadius: '8px',
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
