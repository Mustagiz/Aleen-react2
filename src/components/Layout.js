import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, Box, useMediaQuery, useTheme, Avatar, Divider, Chip, ListSubheader, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Menu, Dashboard, Inventory, Receipt, Assessment, Logout, Store, TrendingUp, Settings, Brightness4, Brightness7 } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useThemeContext } from '../contexts/ThemeContext';

const Layout = () => {
  const { logout } = useAuth();
  const { profile } = useData();
  const { mode, toggleTheme } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AC';
  };

  const menuSections = [
    {
      title: 'Main',
      items: [
        { text: 'Dashboard', icon: <Dashboard />, path: '/' },
        { text: 'Inventory', icon: <Inventory />, path: '/inventory' },
        { text: 'Invoices', icon: <Receipt />, path: '/invoices' }
      ]
    },
    {
      title: 'Reports',
      items: [
        { text: 'Profit & Loss', icon: <TrendingUp />, path: '/profit-loss' },
        { text: 'Sales Reports', icon: <Assessment />, path: '/sales-reports' },
        { text: 'Inventory Reports', icon: <Assessment />, path: '/inventory-reports' }
      ]
    },
    {
      title: 'System',
      items: [
        { text: 'Settings', icon: <Settings />, path: '/settings' }
      ]
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const mainNavItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'Inventory', icon: <Inventory />, path: '/inventory' },
    { text: 'Invoices', icon: <Receipt />, path: '/invoices' },
    { text: 'P&L', icon: <TrendingUp />, path: '/profit-loss' },
    { text: 'Sales', icon: <Assessment />, path: '/sales-reports' },
    { text: 'Stock', icon: <Assessment />, path: '/inventory-reports' },
    { text: 'Settings', icon: <Settings />, path: '/settings' }
  ];

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: '100vh',
      overflow: isMobile ? 'auto' : 'hidden',
      bgcolor: 'background.default'
    }}>
      <AppBar
        position={isMobile ? 'static' : 'fixed'}
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          backdropFilter: 'blur(8px)',
          borderBottom: mode === 'light' ? '1px solid rgba(136, 14, 79, 0.08)' : '1px solid rgba(255, 255, 255, 0.1)',
          color: 'text.primary'
        }}
      >
        <Toolbar sx={{ py: 1.5, px: { sx: 2, md: 4 } }}>
          {!isMobile && (
            <IconButton
              edge="start"
              onClick={() => setOpen(!open)}
              sx={{
                mr: 2,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                width: 40,
                height: 40
              }}
            >
              <Menu />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Box sx={{
              bgcolor: 'primary.main',
              background: 'linear-gradient(135deg, #880e4f 0%, #ad1457 100%)',
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Store sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1.2,
                fontSize: { xs: '1rem', md: '1.25rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: { xs: 160, sm: 'auto' }
              }}>
                {profile.businessName}
              </Typography>
              {!isMobile && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  Inventory & Sales Management
                </Typography>
              )}
            </Box>
          </Box>
          {!isMobile && (
            <Chip
              label="Administrator"
              size="small"
              sx={{
                mr: 2,
                bgcolor: 'rgba(245, 127, 23, 0.1)',
                color: 'secondary.dark',
                fontWeight: 700,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderRadius: 1
              }}
            />
          )}
          <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 1 }}>
            {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
          </IconButton>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 36,
              height: 36,
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(136, 14, 79, 0.2)'
            }}
          >
            {getInitials(profile.businessName)}
          </Avatar>
          {isMobile && (
            <IconButton
              onClick={handleLogout}
              sx={{
                ml: 1,
                bgcolor: 'rgba(211, 47, 47, 0.1)',
                color: 'error.main',
                width: 36,
                height: 36
              }}
            >
              <Logout fontSize="small" />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        variant={isMobile ? 'temporary' : 'persistent'}
        sx={{
          display: 'block',
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            bgcolor: '#ffffff',
            borderRight: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: 'none'
          }
        }}
      >
        <Toolbar />
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 2,
              bgcolor: 'primary.light',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 700,
              boxShadow: '0 8px 16px rgba(136, 14, 79, 0.15)'
            }}
          >
            {getInitials(profile.businessName)}
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em' }}>
            {profile.businessName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Management Portal
          </Typography>
        </Box>
        <List sx={{ px: 2.5, py: 2 }}>
          {menuSections.map((section, sectionIndex) => (
            <Box key={section.title}>
              <ListSubheader
                sx={{
                  bgcolor: 'transparent',
                  color: '#6b7280',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  px: 2,
                  py: 1,
                  lineHeight: '1.5rem'
                }}
              >
                {section.title}
              </ListSubheader>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <ListItem
                    button
                    key={item.text}
                    onClick={() => { navigate(item.path); setOpen(false); }}
                    sx={{
                      borderRadius: '12px',
                      mb: 1,
                      py: 1.25,
                      px: 2,
                      bgcolor: isActive ? 'rgba(136, 14, 79, 0.04)' : 'transparent',
                      color: isActive ? 'primary.main' : 'text.secondary',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: isActive ? 'rgba(136, 14, 79, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                        color: 'primary.main',
                        '& .MuiListItemIcon-root': { color: 'primary.main' }
                      },
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': isActive ? {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '20%',
                        bottom: '20%',
                        width: '4px',
                        bgcolor: 'primary.main',
                        borderRadius: '0 4px 4px 0'
                      } : {}
                    }}
                  >
                    <ListItemIcon sx={{
                      minWidth: 38,
                      color: isActive ? 'primary.main' : 'inherit',
                      transition: 'color 0.2s'
                    }}>
                      {React.cloneElement(item.icon, { sx: { fontSize: 22 } })}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.875rem',
                        letterSpacing: '0.01em'
                      }}
                    />
                  </ListItem>
                );
              })}
              {sectionIndex < menuSections.length - 1 && <Divider sx={{ my: 2, mx: 2 }} />}
            </Box>
          ))}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Divider sx={{ mx: 2.5 }} />
        <List sx={{ px: 2.5, py: 2 }}>
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              borderRadius: '12px',
              py: 1.25,
              px: 2,
              color: 'error.main',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'rgba(211, 47, 47, 0.04)',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: 'error.main' }}><Logout sx={{ fontSize: 22 }} /></ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }} />
          </ListItem>
        </List>
      </Drawer>
      <Box component="main" sx={{
        flexGrow: 1,
        p: { xs: 2, sm: 3, md: 4 },
        mt: isMobile ? 0 : 8,
        mb: isMobile ? 10 : 0,
        ml: { xs: 0, md: open ? '300px' : 0 },
        height: isMobile ? 'auto' : 'calc(100vh - 64px)',
        overflow: isMobile ? 'visible' : 'auto',
        transition: 'margin 0.3s ease'
      }}>
        <Outlet />
      </Box>

      {isMobile && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            bgcolor: mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 30, 30, 0.9)',
            backdropFilter: 'blur(10px)',
            borderTop: mode === 'light' ? '1px solid rgba(136, 14, 79, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar for cleaner look
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}
          elevation={3}
        >
          <BottomNavigation
            value={location.pathname}
            onChange={(event, newValue) => {
              navigate(newValue);
            }}
            showLabels
            sx={{
              height: 64,
              minWidth: 560, // Ensure items have enough space to be scrollable
              justifyContent: 'flex-start',
              bgcolor: 'transparent',
              '& .MuiBottomNavigationAction-root': {
                minWidth: 80,
                color: 'text.secondary',
                px: 1,
                '&.Mui-selected': {
                  color: 'primary.main',
                  '& .MuiSvgIcon-root': {
                    transform: 'translateY(-2px)',
                    transition: 'transform 0.2s'
                  }
                }
              }
            }}
          >
            {mainNavItems.map((item) => (
              <BottomNavigationAction
                key={item.text}
                label={item.text}
                value={item.path}
                icon={item.icon}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
};

export default Layout;
