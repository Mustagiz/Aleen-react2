import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Chip } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../../contexts/ThemeContext';

export default function PageHeader({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  actions, 
  badge 
}) {
  const navigate = useNavigate();
  const { designSystem, activeSystemConfig } = useThemeContext() || {};

  const getSystemHeaderStyle = () => {
    switch (designSystem) {
      case 'microsoft':
        return {
          borderLeft: '4px solid #0078D4',
          pl: 1.75,
          fontFamily: 'Segoe UI, Aptos, sans-serif'
        };
      case 'zoho':
        return {
          borderLeft: '4px solid #EA580C',
          pl: 1.5,
          fontFamily: 'Open Sans, sans-serif'
        };
      case 'linear':
        return {
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '-0.03em'
        };
      case 'material':
        return {
          fontFamily: 'Roboto, sans-serif',
          letterSpacing: '-0.01em'
        };
      case 'stripe':
        return {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          letterSpacing: '-0.02em'
        };
      case 'salesforce':
        return {
          borderLeft: '4px solid #0176D3',
          pl: 1.5,
          fontFamily: 'Inter, sans-serif'
        };
      case 'atelier':
      default:
        return {
          fontFamily: 'Playfair Display, Cormorant Garamond, serif'
        };
    }
  };

  const headerStyle = getSystemHeaderStyle();

  return (
    <Box sx={{ 
      mb: 3.5,
      pb: designSystem === 'zoho' || designSystem === 'microsoft' ? 1.5 : 0,
      borderBottom: (designSystem === 'zoho' || designSystem === 'microsoft') ? '1px solid rgba(0,0,0,0.06)' : 'none'
    }}>
      {/* Breadcrumbs Navigation */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs 
          separator={<NavigateNext fontSize="small" sx={{ color: 'text.secondary', opacity: 0.6 }} />} 
          aria-label="breadcrumb"
          sx={{ mb: 1, '& .MuiBreadcrumbs-li': { fontSize: '0.825rem' } }}
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return isLast ? (
              <Typography 
                key={idx} 
                sx={{ 
                  color: 'primary.main', 
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  fontFamily: headerStyle.fontFamily
                }}
              >
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={idx}
                underline="hover"
                color="inherit"
                sx={{ 
                  cursor: 'pointer', 
                  color: 'text.secondary',
                  fontSize: '0.825rem',
                  fontWeight: 500,
                  fontFamily: headerStyle.fontFamily,
                  transition: 'color 0.15s ease',
                  '&:hover': { color: 'primary.main' }
                }}
                onClick={() => crumb.path && navigate(crumb.path)}
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      {/* Title & Action Buttons Row */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        justifyContent: 'space-between', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, md: 2.5 }
      }}>
        <Box sx={{ minWidth: 0, flex: 1, ...headerStyle }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {designSystem === 'linear' && (
              <Chip
                label="LINEAR VIEW"
                size="small"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  height: 20,
                  borderRadius: '4px',
                  bgcolor: 'rgba(139, 92, 246, 0.15)',
                  color: '#A78BFA',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}
              />
            )}
            {designSystem === 'stripe' && (
              <Chip
                label="STRIPE ENGINE"
                size="small"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  height: 20,
                  borderRadius: '4px',
                  bgcolor: 'rgba(99, 91, 255, 0.12)',
                  color: '#635BFF',
                  border: '1px solid rgba(99, 91, 255, 0.25)'
                }}
              />
            )}
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: designSystem === 'microsoft' ? 700 : 800, 
                color: 'text.primary',
                letterSpacing: designSystem === 'linear' ? '-0.03em' : (designSystem === 'material' ? '0' : '-0.025em'),
                fontSize: { xs: '1.4rem', sm: '1.75rem' },
                fontFamily: 'inherit'
              }}
            >
              {title}
            </Typography>
            {badge}
          </Box>
          {subtitle && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary', 
                mt: 0.5,
                fontWeight: 500,
                fontSize: designSystem === 'microsoft' ? '0.8rem' : '0.84rem'
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && (
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center', 
              flexWrap: 'wrap',
              gap: 1.25,
              width: { xs: '100%', md: 'auto' },
              justifyContent: { xs: 'flex-start', md: 'flex-end' }
            }}
          >
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
}
