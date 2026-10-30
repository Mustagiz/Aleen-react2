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
  Button,
  Fab
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
  QrCodeScanner,
  Close,
  ViewHeadline,
  Palette,
  Apps
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useThemeContext } from '../contexts/ThemeContext';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';
import NetworkStatus from './NetworkStatus';
import AtelierFooter from './crm/AtelierFooter';
import CashDrawerShiftModal from './crm/CashDrawerShiftModal';

const SIDEBAR_EXPANDED_WIDTH = 265;
const SIDEBAR_COLLAPSED_WIDTH = 74;

export default function Layout() {
  const { logout, user } = useAuth();
  const { profile } = useData();
  const { mode, toggleTheme, density, toggleDensity, designSystem, activeSystemConfig } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = mode === 'dark';

  const getSystemSubtitle = () => {
    if (profile?.tagline && profile.tagline.trim()) {
      return profile.tagline.trim();
    }
    return 'Haute Couture Atelier';
  };

  const getLinearShortcut = (path) => {
    switch (path) {
      case '/': return 'G D';
      case '/invoices': return 'G B';
      case '/orders': return 'G O';
      case '/customers': return 'G C';
      case '/tailoring': return 'G T';
      case '/inventory': return 'G I';
      case '/settings': return 'G S';
      default: return null;
    }
  };

  const getItemBorderRadius = () => {
    return `${activeSystemConfig?.shape?.buttonRadius || 9}px`;
  };

  const sidebarConfig = theme.custom?.sidebar || {
    bg: isDark ? '#0F1E1D' : '#FFFFFF',
    isDark: isDark,
    textColor: isDark ? '#CBD5E1' : '#334155',
    textActiveColor: '#FFFFFF',
    subheadColor: isDark ? '#94A3B8' : '#64748B',
    activePillBg: theme.palette.primary.main,
    activePillText: '#FFFFFF',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
  };

  const topBarConfig = theme.custom?.topBar || {
    bg: isDark ? 'rgba(15, 30, 29, 0.88)' : 'rgba(255, 255, 255, 0.92)',
    textColor: isDark ? '#F8FAFC' : '#0F172A',
    isColored: false,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
  };

  // Desktop sidebar collapsed state with local storage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('aleen_sidebar_collapsed') === 'true';
  });

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cashDrawerOpen, setCashDrawerOpen] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('aleen_sidebar_collapsed', String(next));
      return next;
    });
  };

  const canQuickBill = !user || user.role === 'admin' || user.role === 'cashier' || !user.permissions || user.permissions.invoices;

  const handleQuickBill = () => {
    if (!canQuickBill) return;
    if (location.pathname === '/invoices') {
      window.dispatchEvent(new CustomEvent('open-quick-bill'));
    } else {
      navigate('/invoices?action=new', { state: { openNewBill: true, timestamp: Date.now() } });
    }
  };

  // Global keyboard shortcuts: Search (Ctrl/Cmd+K) & Quick Bill (Alt+N or F2)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if ((e.altKey && e.key?.toLowerCase() === 'n') || e.key === 'F2') {
        e.preventDefault();
        handleQuickBill();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname, canQuickBill]);

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
    items: section.items.filter(item => {
      if (user?.role === 'admin') return true;
      if (user?.permissions) {
        if (item.path === '/' && user.permissions.dashboard === false) return false;
        if (item.path === '/invoices' && !user.permissions.invoices) return false;
        if (item.path === '/barcodes' && !user.permissions.inventory) return false;
        if (item.path === '/devices' && !user.permissions.invoices) return false;
        if (item.path === '/customers' && !user.permissions.customers) return false;
        if (item.path === '/loyalty' && !user.permissions.customers) return false;
        if (item.path === '/marketing' && !user.permissions.customers) return false;
        if (item.path === '/inventory' && !user.permissions.inventory) return false;
        if (item.path === '/tailoring' && !user.permissions.tailoring) return false;
        if ((item.path === '/purchases' || item.path === '/vendors') && !user.permissions.purchases) return false;
        if ((item.path === '/payment-summary' || item.path === '/profit-loss' || item.path === '/expenses' || item.path === '/advanced-reports' || item.path === '/sales-reports' || item.path === '/inventory-reports') && !user.permissions.reports) return false;
        if (item.path === '/settings' && !user.permissions.settings) return false;
        return true;
      }
      return !item.adminOnly || user?.role === 'admin';
    })
  })).filter(section => section.items.length > 0);

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
  const renderSidebarContent = () => {
    // Collapsed state only applies to desktop sidebar; mobile/tablet drawer is always full width
    const showCollapsed = isCollapsed && !isMobile;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>


        {/* Brand Header with Luxury Monogram & Mobile Close Button */}
        <Box sx={{
          p: showCollapsed ? 2 : 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: showCollapsed ? 'center' : 'space-between',
          borderBottom: sidebarConfig.borderColor,
          minHeight: 70
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
            {/* Emerald & Gold Crest Monogram or Custom Logo */}
            {profile?.logoUrl ? (
              <Box
                component="img"
                src={profile.logoUrl}
                alt={profile.businessName || 'Logo'}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: designSystem === 'material' ? '50%' : (designSystem === 'microsoft' ? '4px' : '12px'),
                  objectFit: 'contain',
                  border: '1.5px solid rgba(217, 119, 6, 0.4)',
                  boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                  flexShrink: 0,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  navigate('/');
                  if (isMobile) setMobileOpen(false);
                }}
              />
            ) : (
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: designSystem === 'material' ? '50%' : (designSystem === 'microsoft' ? '4px' : '12px'),
                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`,
                border: '1.5px solid rgba(217, 119, 6, 0.4)',
                boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: 'pointer'
              }} onClick={() => {
                navigate('/');
                if (isMobile) setMobileOpen(false);
              }}>
                <Typography sx={{ 
                  fontFamily: 'inherit', 
                  fontWeight: 800, 
                  color: '#FFFFFF', 
                  fontSize: '1.2rem',
                  lineHeight: 1
                }}>
                  {(profile?.businessName || 'A').charAt(0).toUpperCase()}
                </Typography>
              </Box>
            )}

            {!showCollapsed && (
              <Box sx={{ overflow: 'hidden' }}>
                <Typography sx={{
                  fontFamily: 'inherit',
                  fontWeight: 800,
                  color: sidebarConfig.isDark ? '#FFFFFF' : 'text.primary',
                  fontSize: '1.05rem',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {profile?.businessName || 'Aleen Clothing'}
                </Typography>
                <Typography sx={{ 
                  fontSize: '0.68rem', 
                  fontWeight: 700, 
                  color: sidebarConfig.isDark ? '#F59E0B' : theme.palette.secondary.main,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {getSystemSubtitle()}
                </Typography>
              </Box>
            )}
          </Box>

          {isMobile && (
            <IconButton
              size="small"
              onClick={() => setMobileOpen(false)}
              sx={{
                color: sidebarConfig.isDark ? '#FFFFFF' : 'text.secondary',
                p: 0.75,
                borderRadius: 'var(--radius-control, 9px)',
                border: sidebarConfig.borderColor,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
              }}
              title="Close navigation"
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Navigation List */}
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          py: 1.5,
          px: showCollapsed ? 1 : 1.5
        }}>
          {workflowSections.map((section) => (
            <Box key={section.title} sx={{ mb: 1.5 }}>
              {!showCollapsed && (
                <ListSubheader sx={{
                  bgcolor: 'transparent',
                  color: sidebarConfig.subheadColor,
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
                        borderRadius: getItemBorderRadius(),
                        mb: 0.5,
                        py: { xs: 1.1, sm: 1 },
                        minHeight: { xs: 44, sm: 40 },
                        px: showCollapsed ? 1 : 1.5,
                        justifyContent: showCollapsed ? 'center' : 'flex-start',
                        bgcolor: isActive 
                          ? sidebarConfig.activePillBg 
                          : 'transparent',
                        color: isActive 
                          ? sidebarConfig.activePillText 
                          : (sidebarConfig.isDark ? '#CBD5E1' : 'text.secondary'),
                        borderLeft: (isActive && !sidebarConfig.isDark) 
                          ? `3px solid ${theme.palette.primary.main}` 
                          : '3px solid transparent',
                        boxShadow: isActive && sidebarConfig.isDark
                          ? `0 2px 10px ${theme.palette.primary.main}40`
                          : 'none',
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': {
                          bgcolor: isActive 
                            ? sidebarConfig.activePillBg 
                            : (sidebarConfig.isDark ? 'rgba(255, 255, 255, 0.08)' : `${theme.palette.primary.main}12`),
                          color: isActive ? sidebarConfig.activePillText : (sidebarConfig.isDark ? '#FFFFFF' : 'primary.main'),
                          transform: showCollapsed ? 'none' : 'translateX(3px)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{
                        minWidth: showCollapsed ? 'auto' : 34,
                        justifyContent: 'center',
                        color: isActive ? sidebarConfig.activePillText : (sidebarConfig.isDark ? '#94A3B8' : 'inherit'),
                        '& .MuiSvgIcon-root': {
                          fontSize: 20
                        }
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      {!showCollapsed && (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: isActive ? 800 : 500,
                            fontSize: '0.84rem',
                            letterSpacing: '-0.01em',
                            color: isActive ? sidebarConfig.activePillText : (sidebarConfig.isDark ? '#F8FAFC' : 'text.primary')
                          }}
                        />
                      )}
                    </ListItem>
                  );

                  return showCollapsed ? (
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
          p: showCollapsed ? 1.5 : 2,
          borderTop: sidebarConfig.borderColor,
          bgcolor: sidebarConfig.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.03)'
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: showCollapsed ? 'center' : 'space-between',
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
                boxShadow: `0 2px 8px ${theme.palette.primary.main}40`
              }}>
                {getInitials(user?.email || profile.businessName)}
              </Avatar>

              {!showCollapsed && (
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography sx={{ 
                    fontSize: '0.825rem', 
                    fontWeight: 700, 
                    color: sidebarConfig.isDark ? '#F8FAFC' : 'text.primary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user?.displayName || (user?.role === 'admin' ? 'Store Manager' : 'Sales Stylist')}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: sidebarConfig.isDark ? '#94A3B8' : 'text.secondary', fontWeight: 500 }}>
                    {user?.role === 'admin' ? 'Administrator' : 'Staff Access'}
                  </Typography>
                </Box>
              )}
            </Box>

            {!showCollapsed && (
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
  };

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
            bgcolor: sidebarConfig.bg,
            borderRight: `1px solid ${sidebarConfig.borderColor}`,
            transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease',
            zIndex: (theme) => theme.zIndex.drawer + 1
          }}
        >
          {renderSidebarContent()}
        </Box>
      )}

      {/* Mobile & Tablet Drawer */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{
            keepMounted: true // Improves performance on mobile and tablets
          }}
          PaperProps={{
            sx: {
              width: { xs: 280, sm: 300 },
              maxWidth: '85vw',
              bgcolor: sidebarConfig.bg,
              backgroundImage: 'none',
              borderRight: `1px solid ${sidebarConfig.borderColor}`,
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)'
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
            height: { xs: 58, sm: 64 },
            px: { xs: 1.5, sm: 2.5, md: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: topBarConfig.bg,
            background: designSystem === 'microsoft' && !isDark ? 'linear-gradient(90deg, #0B5A9E 0%, #0F6CBD 60%, #115EA3 100%)' : undefined,
            color: topBarConfig.textColor,
            backdropFilter: topBarConfig.isTranslucent ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: topBarConfig.isTranslucent ? 'blur(20px)' : 'none',
            borderBottom: designSystem === 'microsoft' ? '1px solid rgba(255, 255, 255, 0.14)' : `1px solid ${topBarConfig.borderColor}`,
            transition: 'background-color 0.25s ease, border-color 0.25s ease',
            zIndex: 10,
            flexShrink: 0,
            gap: 1
          }}
        >
          {/* Left: Collapse Toggle + Breadcrumbs */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, minWidth: 0 }}>
            {/* Microsoft 365 Waffle Icon */}
            {designSystem === 'microsoft' && (
              <Tooltip title="Microsoft 365 Apps">
                <IconButton
                  size="small"
                  sx={{
                    width: 34,
                    height: 34,
                    color: '#FFFFFF',
                    p: 0.5,
                    borderRadius: '4px',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.14)' }
                  }}
                >
                  <Apps fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <IconButton
              onClick={isMobile ? () => setMobileOpen(true) : toggleSidebarCollapse}
              size="small"
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: designSystem === 'microsoft' ? '4px' : (designSystem === 'material' ? '50%' : '9px'),
                border: topBarConfig.isColored ? '1px solid rgba(255, 255, 255, 0.25)' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)'),
                color: topBarConfig.textColor,
                '&:hover': { bgcolor: topBarConfig.isColored ? 'rgba(255, 255, 255, 0.15)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)') }
              }}
              title={isMobile ? "Open menu" : (isCollapsed ? "Expand sidebar" : "Collapse sidebar")}
            >
              {isMobile ? <Menu fontSize="small" /> : (isCollapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />)}
            </IconButton>

            {/* Mobile View: Compact active page title */}
            <Typography
              noWrap
              sx={{
                display: { xs: 'block', sm: 'none' },
                fontSize: '0.86rem',
                fontWeight: 800,
                color: topBarConfig.textColor,
                letterSpacing: '-0.015em',
                maxWidth: { xs: 150, xxs: 110 }
              }}
            >
              {getBreadcrumbTitle()}
            </Typography>

            {/* Tablet / iPad / Desktop Breadcrumbs */}
            <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.72rem', color: topBarConfig.isColored ? 'rgba(255, 255, 255, 0.75)' : 'text.secondary', fontWeight: 600, lineHeight: 1.2 }} noWrap>
                {profile?.businessName || 'Aleen Clothing'} • {getSystemSubtitle()}
              </Typography>
              <Typography sx={{ fontSize: '0.95rem', color: topBarConfig.textColor, fontWeight: 800, letterSpacing: '-0.015em', lineHeight: 1.2 }} noWrap>
                {getBreadcrumbTitle()}
              </Typography>
            </Box>

            {/* Zoho CRM Module Navigation Bar */}
            {designSystem === 'zoho' && (
              <Box sx={{ display: { xs: 'none', xl: 'flex' }, alignItems: 'center', gap: 0.5, ml: 2, pl: 2, borderLeft: '1px solid rgba(0,0,0,0.1)' }}>
                {[
                  { label: 'Sales & Invoices', path: '/invoices' },
                  { label: 'Customers', path: '/customers' },
                  { label: 'Workshop', path: '/tailoring' },
                  { label: 'Inventory', path: '/inventory' },
                  { label: 'Analytics', path: '/advanced-reports' }
                ].map(tab => (
                  <Button
                    key={tab.label}
                    onClick={() => navigate(tab.path)}
                    size="small"
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      fontWeight: location.pathname === tab.path ? 700 : 500,
                      color: location.pathname === tab.path ? '#EA580C' : (isDark ? '#CBD5E1' : '#475569'),
                      borderBottom: location.pathname === tab.path ? '2px solid #EA580C' : '2px solid transparent',
                      borderRadius: 0,
                      px: 1,
                      py: 0.5,
                      minWidth: 0,
                      '&:hover': { bgcolor: 'rgba(234, 88, 12, 0.08)' }
                    }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </Box>
            )}

            {/* Stripe FinTech Live Badge */}
            {designSystem === 'stripe' && (
              <Box sx={{ display: { xs: 'none', lg: 'inline-flex' }, alignItems: 'center', gap: 0.75, ml: 1.5, px: 1.2, py: 0.35, borderRadius: '6px', bgcolor: 'rgba(99, 91, 255, 0.1)', border: '1px solid rgba(99, 91, 255, 0.25)' }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#00D924', boxShadow: '0 0 6px #00D924' }} />
                <Typography sx={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 700, color: '#635BFF' }}>
                  FINTECH API • v2.4 LIVE
                </Typography>
              </Box>
            )}
          </Box>

          {/* Right: Actions, Search Capsule, Register Status, Quick Bill, Theme Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.25, md: 1.5 }, flexShrink: 0 }}>
            {/* Mobile / Tablet Quick Search Icon Button (<900px) */}
            <IconButton
              onClick={() => setSearchOpen(true)}
              size="small"
              sx={{
                display: { xs: 'inline-flex', md: 'none' },
                width: 36,
                height: 36,
                borderRadius: '9px',
                border: topBarConfig.isColored ? '1px solid rgba(255, 255, 255, 0.25)' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)'),
                color: topBarConfig.isColored ? 'rgba(255, 255, 255, 0.9)' : 'text.secondary',
                '&:hover': { bgcolor: topBarConfig.isColored ? 'rgba(255, 255, 255, 0.15)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)') }
              }}
              title="Search CRM (⌘K)"
            >
              <Search fontSize="small" />
            </IconButton>

            {/* Desktop Cmd+K Global Search Capsule (>=900px) */}
            <Button
              onClick={() => setSearchOpen(true)}
              variant="outlined"
              size="small"
              startIcon={<Search fontSize="small" sx={{ color: designSystem === 'microsoft' ? '#616161 !important' : (topBarConfig.isColored ? '#FFFFFF !important' : 'text.secondary') }} />}
              sx={{
                borderRadius: designSystem === 'microsoft' ? '4px !important' : `${activeSystemConfig?.shape?.buttonRadius || 9}px !important`,
                borderColor: designSystem === 'microsoft'
                  ? 'transparent !important'
                  : (topBarConfig.isColored ? 'rgba(255, 255, 255, 0.45) !important' : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)')),
                color: designSystem === 'microsoft'
                  ? '#242424 !important'
                  : (topBarConfig.isColored ? '#FFFFFF !important' : 'text.secondary'),
                px: 1.75,
                py: 0.5,
                height: 36,
                bgcolor: designSystem === 'microsoft'
                  ? '#FFFFFF !important'
                  : (topBarConfig.isColored ? 'rgba(255, 255, 255, 0.18) !important' : (isDark ? 'rgba(0, 0, 0, 0.2)' : '#F8FAFC')),
                boxShadow: designSystem === 'microsoft' ? '0 1.6px 3.6px 0 rgba(0,0,0,0.13), 0 0.3px 0.9px 0 rgba(0,0,0,0.11)' : 'none',
                display: { xs: 'none', md: 'inline-flex' },
                '&:hover': {
                  borderColor: designSystem === 'microsoft' ? '#0F6CBD !important' : (topBarConfig.isColored ? '#FFFFFF !important' : 'primary.main'),
                  bgcolor: designSystem === 'microsoft' ? '#FFFFFF !important' : (topBarConfig.isColored ? 'rgba(255, 255, 255, 0.28) !important' : (isDark ? 'rgba(20, 184, 166, 0.08)' : '#F0FDFA')),
                  boxShadow: designSystem === 'microsoft' ? '0 3.2px 7.2px 0 rgba(0,0,0,0.13), 0 0.6px 1.8px 0 rgba(0,0,0,0.11)' : 'none'
                }
              }}
            >
              <Typography sx={{ fontSize: '0.8rem', fontWeight: designSystem === 'microsoft' ? 500 : 700, mr: 1, color: designSystem === 'microsoft' ? '#424242 !important' : (topBarConfig.isColored ? '#FFFFFF !important' : 'inherit') }}>
                Search CRM...
              </Typography>
              <Chip 
                label="⌘K" 
                size="small" 
                sx={{ 
                  height: 18, 
                  fontSize: '0.65rem', 
                  fontWeight: 700,
                  borderRadius: designSystem === 'microsoft' ? '3px !important' : '7px !important',
                  bgcolor: designSystem === 'microsoft' ? '#F3F2F1 !important' : (topBarConfig.isColored ? 'rgba(255, 255, 255, 0.28) !important' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0')),
                  color: designSystem === 'microsoft' ? '#616161 !important' : (topBarConfig.isColored ? '#FFFFFF !important' : 'text.secondary')
                }} 
              />
            </Button>

            {/* Live Register & Cash Drawer Quick Console */}
            <Tooltip title="View Cash Drawer & Close Shift (Z-Report)">
              <Button
                size="small"
                variant="outlined"
                startIcon={<PointOfSale sx={{ fontSize: '15px !important', color: topBarConfig.isColored ? '#FFFFFF !important' : (isDark ? '#34D399 !important' : '#059669 !important') }} />}
                onClick={() => setCashDrawerOpen(true)}
                sx={{
                  height: 32,
                  fontSize: '0.74rem',
                  fontWeight: designSystem === 'microsoft' ? 600 : 800,
                  bgcolor: designSystem === 'microsoft' ? 'rgba(255, 255, 255, 0.14) !important' : (topBarConfig.isColored ? 'rgba(255, 255, 255, 0.18) !important' : (isDark ? 'rgba(16, 185, 129, 0.12)' : '#DCFCE7')),
                  color: topBarConfig.isColored ? '#FFFFFF !important' : (isDark ? '#34D399' : '#047857'),
                  borderColor: designSystem === 'microsoft' ? 'rgba(255, 255, 255, 0.35) !important' : (topBarConfig.isColored ? 'rgba(255, 255, 255, 0.5) !important' : 'rgba(16, 185, 129, 0.35)'),
                  borderRadius: designSystem === 'microsoft' ? '4px !important' : `${activeSystemConfig?.shape?.buttonRadius || 6}px !important`,
                  px: 1.5,
                  display: { xs: 'none', lg: 'inline-flex' },
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: designSystem === 'microsoft' ? 'rgba(255, 255, 255, 0.24) !important' : (topBarConfig.isColored ? 'rgba(255, 255, 255, 0.28) !important' : (isDark ? 'rgba(16, 185, 129, 0.2)' : '#BBF7D0')),
                    borderColor: 'rgba(255, 255, 255, 0.7) !important'
                  }
                }}
              >
                Drawer & Z-Report
              </Button>
            </Tooltip>

            {/* Quick Bill CTA */}
            {canQuickBill && (
              <Tooltip title="Quick POS Bill (Alt + N or F2)">
                <IconButton
                  onClick={handleQuickBill}
                  size="small"
                  sx={{
                    width: 36,
                    height: 36,
                    display: { xs: 'inline-flex', sm: 'none' },
                    borderRadius: designSystem === 'microsoft' ? '4px' : `${activeSystemConfig?.shape?.buttonRadius || 6}px`,
                    bgcolor: topBarConfig.isColored ? '#FFFFFF' : theme.palette.secondary.main,
                    color: topBarConfig.isColored ? theme.palette.primary.main : '#FFFFFF',
                    boxShadow: topBarConfig.isColored ? '0 2px 8px rgba(0,0,0,0.2)' : `0 2px 8px ${theme.palette.secondary.main}59`,
                    '&:hover': {
                      filter: 'brightness(0.92)'
                    }
                  }}
                >
                  <Add fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canQuickBill && (
              <Button
                variant="contained"
                size="small"
                startIcon={<Add fontSize="small" sx={{ color: designSystem === 'microsoft' ? '#0F6CBD !important' : (topBarConfig.isColored ? `${theme.palette.primary.main} !important` : '#FFFFFF !important') }} />}
                onClick={handleQuickBill}
                title="INVOICE (Alt + N or F2)"
                sx={{
                  height: 34,
                  px: 2,
                  borderRadius: designSystem === 'microsoft' ? '4px !important' : `${activeSystemConfig?.shape?.buttonRadius || 6}px !important`,
                  fontWeight: designSystem === 'microsoft' ? 600 : 800,
                  fontSize: '0.825rem',
                  textTransform: 'none',
                  bgcolor: '#FFFFFF !important',
                  color: designSystem === 'microsoft' ? '#0F6CBD !important' : (topBarConfig.isColored ? `${theme.palette.primary.main} !important` : '#FFFFFF !important'),
                  boxShadow: designSystem === 'microsoft' ? '0 1.6px 3.6px 0 rgba(0,0,0,0.13), 0 0.3px 0.9px 0 rgba(0,0,0,0.11)' : (topBarConfig.isColored ? '0 2px 10px rgba(0, 0, 0, 0.25)' : `0 4px 14px ${theme.palette.secondary.main}4D`),
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': {
                    bgcolor: '#F3F2F1 !important',
                    boxShadow: designSystem === 'microsoft' ? '0 3.2px 7.2px 0 rgba(0,0,0,0.13), 0 0.6px 1.8px 0 rgba(0,0,0,0.11)' : (topBarConfig.isColored ? '0 4px 14px rgba(0, 0, 0, 0.3)' : `0 6px 18px ${theme.palette.secondary.main}66`)
                  }
                }}
              >
                Quick Bill
              </Button>
            )}

            {/* Notification Center */}
            <NotificationCenter />

            {/* Table Density Toggle (Comfortable vs Compact) */}
            <Tooltip title={density === 'compact' ? "Table Layout: Compact (Click for Comfortable)" : "Table Layout: Comfortable (Click for Compact)"}>
              <IconButton 
                onClick={toggleDensity} 
                size="small"
                sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: designSystem === 'microsoft' ? '4px' : `${activeSystemConfig?.shape?.buttonRadius || 6}px`,
                  border: topBarConfig.isColored ? '1px solid rgba(255, 255, 255, 0.35)' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)'),
                  color: density === 'compact' ? (topBarConfig.isColored ? '#FFFFFF' : (isDark ? '#2DD4BF' : theme.palette.primary.main)) : (topBarConfig.isColored ? '#FFFFFF' : 'text.secondary'),
                  bgcolor: density === 'compact' ? (topBarConfig.isColored ? 'rgba(255, 255, 255, 0.25)' : (isDark ? 'rgba(20, 184, 166, 0.14)' : `${theme.palette.primary.main}14`)) : 'transparent',
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': {
                    bgcolor: topBarConfig.isColored ? 'rgba(255, 255, 255, 0.2)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)')
                  }
                }}
              >
                <ViewHeadline fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Quick CRM Color Palette Switcher */}
            <Tooltip title="CRM Color Themes & Appearance">
              <IconButton 
                onClick={() => navigate('/settings?tab=colors')} 
                size="small"
                sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: designSystem === 'microsoft' ? '4px' : `${activeSystemConfig?.shape?.buttonRadius || 6}px`,
                  border: topBarConfig.isColored ? '1px solid rgba(255, 255, 255, 0.35)' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : `1px solid ${theme.palette.primary.main}26`),
                  color: topBarConfig.isColored ? '#FFFFFF' : 'primary.main',
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': {
                    bgcolor: topBarConfig.isColored ? 'rgba(255, 255, 255, 0.2)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : `${theme.palette.primary.main}0E`)
                  }
                }}
              >
                <Palette fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Theme Toggle (Porcelain / Dark Mode) */}
            <IconButton 
                onClick={toggleTheme} 
                size="small"
                sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: designSystem === 'microsoft' ? '4px' : `${activeSystemConfig?.shape?.buttonRadius || 6}px`,
                  border: topBarConfig.isColored ? '1px solid rgba(255, 255, 255, 0.35)' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : `1px solid ${theme.palette.primary.main}26`),
                  color: topBarConfig.textColor,
                  '&:hover': {
                    bgcolor: topBarConfig.isColored ? 'rgba(255, 255, 255, 0.2)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)')
                  }
                }}
                title={mode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {mode === 'dark' ? <Brightness7 fontSize="small" sx={{ color: '#F59E0B' }} /> : <Brightness4 fontSize="small" sx={{ color: topBarConfig.isColored ? '#FFFFFF' : theme.palette.primary.main }} />}
            </IconButton>

            {/* Top Right Logout Button */}
            <Tooltip title="Log out of Aleen Clothing">
              <Button
                onClick={handleLogout}
                size="small"
                variant={topBarConfig.isColored ? "contained" : "outlined"}
                startIcon={<Logout fontSize="small" sx={{ color: topBarConfig.isColored ? '#FFFFFF !important' : 'inherit' }} />}
                sx={{
                  height: 34,
                  borderRadius: `${activeSystemConfig?.shape?.buttonRadius || 6}px !important`,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  borderColor: topBarConfig.isColored ? 'rgba(255, 255, 255, 0.45) !important' : (isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.25)'),
                  color: topBarConfig.isColored ? '#FFFFFF !important' : (isDark ? '#FCA5A5' : '#DC2626'),
                  bgcolor: topBarConfig.isColored ? 'rgba(255, 255, 255, 0.2) !important' : (isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(254, 242, 242, 0.7)'),
                  px: { xs: 1, sm: 1.6 },
                  display: { xs: 'none', sm: 'inline-flex' },
                  '& .MuiButton-startIcon': {
                    mr: { xs: 0, sm: 1 },
                    ml: { xs: 0, sm: -0.5 }
                  },
                  '&:hover': {
                    borderColor: topBarConfig.isColored ? '#FFFFFF !important' : 'error.main',
                    bgcolor: topBarConfig.isColored ? 'rgba(255, 255, 255, 0.3) !important' : (isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2')
                  }
                }}
              >
                <span>Logout</span>
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* Scrollable Viewport Content Area */}
        <Box 
          component="main" 
          sx={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            p: { xs: 1.5, sm: 2.5, md: 3.5 },
            pb: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 72px)', sm: 3, md: 3.5 },
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ flex: 1, position: 'relative' }}>
            <Outlet />
          </Box>
          <AtelierFooter />
        </Box>
      </Box>

      {/* Mobile Haute Couture Bottom Navigation Dock (Phones Only <600px) */}
      <Box
        component="nav"
        aria-label="Mobile Navigation"
        sx={{
          display: { xs: 'flex', sm: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          bgcolor: isDark ? 'rgba(8, 20, 20, 0.94)' : 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(14px)',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : `1px solid ${theme.palette.divider}`,
          zIndex: (theme) => theme.zIndex.appBar,
          alignItems: 'center',
          justifyContent: 'space-around',
          px: 1,
          pb: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {[
          { label: 'Overview', icon: <Dashboard sx={{ fontSize: 20 }} />, path: '/' },
          { label: 'Billing', icon: <Receipt sx={{ fontSize: 20 }} />, path: '/invoices' },
          { label: 'Workshop', icon: <Straighten sx={{ fontSize: 20 }} />, path: '/tailoring' },
          { label: 'Inventory', icon: <Inventory sx={{ fontSize: 20 }} />, path: '/inventory' },
          { label: 'Guests', icon: <People sx={{ fontSize: 20 }} />, path: '/customers' }
        ].map((tab) => {
          const isActive = location.pathname === tab.path ||
            (tab.path === '/tailoring' && (location.pathname === '/kanban' || location.pathname === '/workshop'));
          return (
            <Box
              key={tab.path}
              onClick={() => navigate(tab.path)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                py: 0.5,
                cursor: 'pointer',
                color: isActive ? theme.palette.primary.main : 'text.secondary',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  color: isActive ? theme.palette.primary.main : 'inherit',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.15s ease'
                }}
              >
                {tab.icon}
              </Box>
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? theme.palette.primary.main : 'text.secondary',
                  letterSpacing: '-0.01em',
                  mt: 0.25
                }}
              >
                {tab.label}
              </Typography>
              {isActive && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 2,
                    width: 18,
                    height: 2.5,
                    borderRadius: '2px',
                    bgcolor: theme.palette.primary.main
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Global Dialogs & Alerts */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CashDrawerShiftModal open={cashDrawerOpen} onClose={() => setCashDrawerOpen(false)} />
      <NetworkStatus />
    </Box>
  );
}
