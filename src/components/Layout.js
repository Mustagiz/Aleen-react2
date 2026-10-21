import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  useMediaQuery, 
  useTheme, 
  Avatar, 
  Divider, 
  Chip, 
  ListSubheader, 
  Tooltip,
  Paper,
  Button
} from '@mui/material';
import { 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  Dashboard, 
  Inventory, 
  Receipt, 
  Assessment, 
  Logout, 
  Store, 
  TrendingUp, 
  Settings, 
  Brightness4, 
  Brightness7, 
  People, 
  AccountBalanceWallet, 
  QrCode, 
  Campaign, 
  Stars, 
  Search,
  PointOfSale,
  Add,
  Circle,
  Straighten,
  ReceiptLong,
  Insights,
  BarChart,
  FactCheck,
  QrCodeScanner
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useThemeContext } from '../contexts/ThemeContext';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';
import NetworkStatus from './NetworkStatus';
import AtelierFooter from './crm/AtelierFooter';

const SIDEBAR_EXPANDED_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 74;

export default function Layout() {
  const { logout, user } = useAuth();
  const { profile } = useData();
  const { mode, toggleTheme } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = mode === 'dark';

  // Desktop sidebar collapsed state with local storage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('aleen_sidebar_collapsed') === 'true';
  });

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('aleen_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Global search keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AL';
  };

  // Grouped Boutique Workflows
  const workflowSections = [
    {
      title: 'Sales & POS',
      items: [
        { text: 'Dashboard', icon: <Dashboard />, path: '/' },
        { text: 'Invoices & Billing', icon: <Receipt />, path: '/invoices' },
        { text: 'Barcode Studio', icon: <QrCode />, path: '/barcodes' },
        { text: 'Device', icon: <QrCodeScanner />, path: '/devices' }
      ]
    },
    {
      title: 'Clientele & CRM',
      items: [
        { text: 'Guests & Customers', icon: <People />, path: '/customers' },
        { text: 'VIP Loyalty', icon: <Stars />, path: '/loyalty' },
        { text: 'Marketing Hub', icon: <Campaign />, path: '/marketing' }
      ]
    },
    {
      title: 'Merchandise & Craft',
      items: [
        { text: 'Atelier Inventory', icon: <Inventory />, path: '/inventory' },
        { text: 'Tailoring & Craft', icon: <Straighten />, path: '/tailoring' },
        { text: 'Purchase Orders', icon: <Receipt />, path: '/purchases', adminOnly: true },
        { text: 'Fabric & Vendors', icon: <Store />, path: '/vendors', adminOnly: true }
      ]
    },
    {
      title: 'Finance & Audit',
      items: [
        { text: 'Daily Cash Ledger', icon: <AccountBalanceWallet />, path: '/payment-summary', adminOnly: true },
        { text: 'Profit & Loss', icon: <TrendingUp />, path: '/profit-loss', adminOnly: true },
        { text: 'Expenses Register', icon: <ReceiptLong />, path: '/expenses', adminOnly: true },
        { text: 'Advanced Analytics', icon: <Insights />, path: '/advanced-reports', adminOnly: true },
        { text: 'Sales Reports', icon: <BarChart />, path: '/sales-reports' },
        { text: 'Stock Audit', icon: <FactCheck />, path: '/inventory-reports' }
      ]
    },
    {
      title: 'Settings',
      items: [
        { text: 'Boutique Settings', icon: <Settings />, path: '/settings', adminOnly: true }
      ]
    }
  ].map(section => ({
    ...section,
    items: section.items.filter(item => !item.adminOnly || user?.role === 'admin')
  }));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Derive active breadcrumb text from route
  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path === '/invoices') return 'Sales & Invoices';
    if (path === '/customers') return 'Clientele Directory';
    if (path === '/inventory') return 'Atelier Inventory';
    if (path === '/loyalty') return 'VIP Loyalty Club';
    if (path === '/marketing') return 'Marketing & Broadcasts';
    if (path === '/purchases') return 'Purchase Orders';
    if (path === '/vendors') return 'Fabric & Vendors';
    if (path === '/barcodes') return 'Barcode Label Studio';
    if (path === '/devices') return 'Device & Scanner Hub';
    if (path === '/profit-loss') return 'Financial Profit & Loss';
    if (path === '/payment-summary') return 'Cash Ledger & Register';
    if (path === '/expenses') return 'Operating Expenses';
    if (path === '/advanced-reports') return 'Executive Analytics';
    if (path === '/sales-reports') return 'Sales Performance Reports';
    if (path === '/inventory-reports') return 'Stock Audit Reports';
    if (path === '/settings') return 'Boutique Configuration';
    return 'Atelier CRM';
  };

  const sidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  // Sidebar Content Component
  const renderSidebarContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Brand Header with Luxury Monogram */}
      <Box sx={{
        p: isCollapsed ? 2 : 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 118, 110, 0.1)',
        minHeight: 70
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          {/* Emerald & Gold Crest Monogram */}
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
            border: '1.5px solid rgba(217, 119, 6, 0.4)',
            boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer'
          }} onClick={() => navigate('/')}>
            <Typography sx={{ 
              fontFamily: 'var(--font-serif, "Playfair Display", serif)', 
              fontWeight: 800, 
              color: '#F59E0B', 
              fontSize: '1.15rem',
              lineHeight: 1
            }}>
              A
            </Typography>
          </Box>

          {!isCollapsed && (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography sx={{
                fontFamily: 'var(--font-serif, "Playfair Display", serif)',
                fontWeight: 800,
                color: 'text.primary',
                fontSize: '1.05rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {profile.businessName || 'Aleen Clothing'}
              </Typography>
              <Typography sx={{ 
                fontSize: '0.68rem', 
                fontWeight: 700, 
                color: '#D97706',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                Haute Couture CRM
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Navigation List */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        py: 1.5,
        px: isCollapsed ? 1 : 1.5
      }}>
        {workflowSections.map((section, sIdx) => (
          <Box key={section.title} sx={{ mb: 1.5 }}>
            {!isCollapsed && (
              <ListSubheader sx={{
                bgcolor: 'transparent',
                color: isDark ? '#14B8A6' : '#0F766E',
                fontSize: '0.7rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                px: 1.5,
                py: 0.5,
                lineHeight: '1.6rem'
              }}>
                {section.title}
              </ListSubheader>
            )}

            <List disablePadding>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const linkButton = (
                  <ListItem
                    button
                    key={item.text}
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) setMobileOpen(false);
                    }}
                    sx={{
                      borderRadius: '10px',
                      mb: 0.5,
                      py: 1,
                      px: isCollapsed ? 1 : 1.5,
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      bgcolor: isActive 
                        ? (isDark ? 'rgba(20, 184, 166, 0.16)' : '#F0FDFA') 
                        : 'transparent',
                      color: isActive ? 'primary.main' : 'text.secondary',
                      borderLeft: isActive ? '3px solid #0F766E' : '3px solid transparent',
                      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        bgcolor: isActive 
                          ? (isDark ? 'rgba(20, 184, 166, 0.22)' : '#E6FFFA') 
                          : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 118, 110, 0.04)'),
                        color: 'primary.main',
                        transform: isCollapsed ? 'none' : 'translateX(3px)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{
                      minWidth: isCollapsed ? 'auto' : 34,
                      justifyContent: 'center',
                      color: isActive ? (isDark ? '#14B8A6' : '#0F766E') : 'inherit',
                      '& .MuiSvgIcon-root': {
                        fontSize: 20
                      }
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    {!isCollapsed && (
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontWeight: isActive ? 800 : 500,
                          fontSize: '0.84rem',
                          letterSpacing: '-0.01em',
                          color: isActive ? (isDark ? '#F8FAFC' : '#042F2E') : 'inherit'
                        }}
                      />
                    )}
                  </ListItem>
                );

                return isCollapsed ? (
                  <Tooltip key={item.text} title={item.text} placement="right" arrow>
                    {linkButton}
                  </Tooltip>
                ) : linkButton;
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Footer Profile Capsule */}
      <Box sx={{
        p: isCollapsed ? 1.5 : 2,
        borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 118, 110, 0.1)',
        bgcolor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(15, 118, 110, 0.02)'
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: 1.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden' }}>
            <Avatar sx={{
              width: 34,
              height: 34,
              fontSize: '0.8rem',
              fontWeight: 800,
              bgcolor: 'primary.main',
              color: 'white',
              boxShadow: '0 2px 8px rgba(15, 118, 110, 0.3)'
            }}>
              {getInitials(user?.email || profile.businessName)}
            </Avatar>

            {!isCollapsed && (
              <Box sx={{ overflow: 'hidden' }}>
                <Typography sx={{ 
                  fontSize: '0.825rem', 
                  fontWeight: 700, 
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user?.displayName || (user?.role === 'admin' ? 'Store Manager' : 'Sales Stylist')}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500 }}>
                  {user?.role === 'admin' ? 'Administrator' : 'Staff Access'}
                </Typography>
              </Box>
            )}
          </Box>

          {!isCollapsed && (
            <Tooltip title="Log out">
              <IconButton 
                onClick={handleLogout} 
                size="small"
                sx={{ 
                  color: 'error.main',
                  p: 0.75,
                  '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
                }}
              >
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      {/* Desktop Collapsible Sidebar */}
      {!isMobile && (
        <Box
          component="aside"
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            height: '100vh',
            bgcolor: 'background.paper',
            borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 118, 110, 0.1)',
            transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: (theme) => theme.zIndex.drawer + 1
          }}
        >
          {renderSidebarContent()}
        </Box>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{
            sx: {
              width: 280,
              bgcolor: 'background.paper',
              borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 118, 110, 0.1)'
            }
          }}
        >
          {renderSidebarContent()}
        </Drawer>
      )}

      {/* Main App Workspace */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {/* Top Navigation Bar */}
        <Box
          component="header"
          sx={{
            height: 64,
            px: { xs: 2, sm: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'background.paper',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 118, 110, 0.1)',
            zIndex: 10,
            flexShrink: 0
          }}
        >
          {/* Left: Collapse Toggle + Breadcrumbs */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={isMobile ? () => setMobileOpen(true) : toggleSidebarCollapse}
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: '9px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(15, 118, 110, 0.15)',
                color: 'text.primary',
                '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 118, 110, 0.06)' }
              }}
              title={isMobile ? "Open menu" : (isCollapsed ? "Expand sidebar" : "Collapse sidebar")}
            >
              {isMobile ? <Menu fontSize="small" /> : (isCollapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />)}
            </IconButton>

            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                Aleen Clothing CRM
              </Typography>
              <Typography sx={{ fontSize: '0.95rem', color: 'text.primary', fontWeight: 800, letterSpacing: '-0.015em' }}>
                {getBreadcrumbTitle()}
              </Typography>
            </Box>
          </Box>

          {/* Right: Actions, Search Capsule, Register Status, Quick Bill, Theme Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Cmd+K Global Search Capsule */}
            <Button
              onClick={() => setSearchOpen(true)}
              variant="outlined"
              size="small"
              startIcon={<Search fontSize="small" sx={{ color: 'text.secondary' }} />}
              sx={{
                borderRadius: '9999px',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 118, 110, 0.15)',
                color: 'text.secondary',
                px: 1.75,
                py: 0.5,
                height: 36,
                bgcolor: isDark ? 'rgba(0, 0, 0, 0.2)' : '#F8FAFC',
                display: { xs: 'none', md: 'inline-flex' },
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: isDark ? 'rgba(20, 184, 166, 0.08)' : '#F0FDFA'
                }
              }}
            >
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mr: 1 }}>
                Search CRM...
              </Typography>
              <Chip 
                label="⌘K" 
                size="small" 
                sx={{ 
                  height: 18, 
                  fontSize: '0.65rem', 
                  fontWeight: 800,
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                  color: 'text.secondary'
                }} 
              />
            </Button>

            {/* Live Register Active Pill */}
            <Chip
              icon={<Circle sx={{ fontSize: '8px !important', color: '#10B981 !important' }} />}
              label="Register: Active"
              size="small"
              sx={{
                height: 28,
                fontSize: '0.72rem',
                fontWeight: 700,
                bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#DCFCE7',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: { xs: 'none', lg: 'inline-flex' }
              }}
            />

            {/* Champagne Gold "+ Quick Bill" CTA */}
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<Add fontSize="small" />}
              onClick={() => navigate('/invoices')}
              sx={{
                height: 36,
                px: 2,
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '0.825rem',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
              }}
            >
              Quick Bill
            </Button>

            {/* Notification Center */}
            <NotificationCenter />

            {/* Theme Toggle (Porcelain / Midnight Emerald) */}
            <IconButton 
              onClick={toggleTheme} 
              size="small"
              sx={{ 
                width: 36, 
                height: 36, 
                borderRadius: '9px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(15, 118, 110, 0.15)',
                color: 'text.primary'
              }}
              title={mode === 'dark' ? "Switch to Porcelain Light" : "Switch to Midnight Emerald Dark"}
            >
              {mode === 'dark' ? <Brightness7 fontSize="small" sx={{ color: '#F59E0B' }} /> : <Brightness4 fontSize="small" sx={{ color: '#0F766E' }} />}
            </IconButton>
          </Box>
        </Box>

        {/* Scrollable Viewport Content Area */}
        <Box 
          component="main" 
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: { xs: 2, sm: 3, md: 3.5 },
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Outlet />
          </Box>
          <AtelierFooter />
        </Box>
      </Box>

      {/* Global Dialogs & Alerts */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NetworkStatus />
    </Box>
  );
}
