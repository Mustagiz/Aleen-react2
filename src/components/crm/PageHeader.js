import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Stack, useTheme } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  actions, 
  badge 
}) {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 3.5 }}>
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
                  fontSize: '0.825rem'
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
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        justifyContent: 'space-between', 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 800, 
                color: 'text.primary',
                letterSpacing: '-0.025em',
                fontSize: { xs: '1.4rem', sm: '1.75rem' }
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
                fontWeight: 500
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && (
          <Stack 
            direction="row" 
            spacing={1.5} 
            sx={{ 
              alignItems: 'center', 
              flexWrap: 'wrap',
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'flex-start', sm: 'flex-end' }
            }}
          >
            {actions}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
