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
  QrCodeScanner,
  Close,
  ViewHeadline
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
  const { mode, toggleTheme, density, toggleDensity } = useThemeContext();
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
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 118, 110, 0.1)',
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
                  borderRadius: '12px',
                  objectFit: 'contain',
                  border: '1.5px solid rgba(217, 119, 6, 0.4)',
                  boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)',
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
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                border: '1.5px solid rgba(217, 119, 6, 0.4)',
                boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)',
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
                  fontFamily: '"Plus Jakarta Sans", sans-serif', 
                  fontWeight: 800, 
                  color: '#F59E0B', 
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
                  fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                  fontWeight: 800,
                  color: 'text.primary',
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
                  color: '#D97706',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {profile?.tagline || 'Haute Couture CRM'}
                </Typography>
              </Box>
            )}
          </Box>

          {isMobile && (
            <IconButton
              size="small"
              onClick={() => setMobileOpen(false)}
              sx={{
                color: 'text.secondary',
                p: 0.75,
                borderRadius: '9px',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,118,110,0.15)',
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,118,110,0.06)' }
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
                        py: { xs: 1.1, sm: 1 },
                        minHeight: { xs: 44, sm: 40 },
                        px: showCollapsed ? 1 : 1.5,
                        justifyContent: showCollapsed ? 'center' : 'flex-start',
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
                          transform: showCollapsed ? 'none' : 'translateX(3px)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{
                        minWidth: showCollapsed ? 'auto' : 34,
                        justifyContent: 'center',
                        color: isActive ? (isDark ? '#14B8A6' : '#0F766E') : 'inherit',
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
                            color: isActive ? (isDark ? '#F8FAFC' : '#042F2E') : 'inherit'
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
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 118, 110, 0.1)',
          bgcolor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(15, 118, 110, 0.02)'
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
                boxShadow: '0 2px 8px rgba(15, 118, 110, 0.3)'
              }}>
                {getInitials(user?.email || profile.businessName)}
              </Avatar>

              {!showCollapsed && (
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
            bgcolor: 'background.paper',
            borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 118, 110, 0.1)',
            transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
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
              bgcolor: 'background.paper',
              backgroundImage: 'none',
              borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 118, 110, 0.1)',
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
            bgcolor: isDark ? 'rgba(15, 30, 29, 0.88)' : 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 118, 110, 0.1)',
            zIndex: 10,
            flexShrink: 0,
            gap: 1
          }}
        >
          {/* Left: Collapse Toggle + Breadcrumbs */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, minWidth: 0 }}>
            <IconButton
              onClick={isMobile ? () => setMobileOpen(true) : toggleSidebarCollapse}
              size="small"
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: '9px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(15, 118, 110, 0.15)',
                color: 'text.primary',
                '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 118, 110, 0.06)' }
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
                color: 'text.primary',
                letterSpacing: '-0.015em',
                maxWidth: { xs: 150, xxs: 110 }
              }}
            >
              {getBreadcrumbTitle()}
            </Typography>

            {/* Tablet / iPad / Desktop Breadcrumbs */}
            <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600, lineHeight: 1.2 }} noWrap>
                {profile?.businessName || 'Aleen Clothing'}{profile?.tagline ? ` • ${profile.tagline}` : ' • Atelier CRM'}
              </Typography>
              <Typography sx={{ fontSize: '0.95rem', color: 'text.primary', fontWeight: 800, letterSpacing: '-0.015em', lineHeight: 1.2 }} noWrap>
                {getBreadcrumbTitle()}
              </Typography>
            </Box>
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
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(15, 118, 110, 0.15)',
                color: 'text.secondary',
                '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 118, 110, 0.06)' }
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

            {/* Live Register & Cash Drawer Quick Console */}
            <Tooltip title="View Cash Drawer & Close Shift (Z-Report)">
              <Button
                size="small"
                variant="outlined"
                startIcon={<PointOfSale sx={{ fontSize: '15px !important', color: '#10B981' }} />}
                onClick={() => setCashDrawerOpen(true)}
                sx={{
                  height: 32,
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#DCFCE7',
                  color: '#047857',
                  borderColor: 'rgba(16, 185, 129, 0.35)',
                  borderRadius: '20px',
                  px: 1.5,
                  display: { xs: 'none', lg: 'inline-flex' },
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#BBF7D0',
                    borderColor: '#10B981'
                  }
                }}
              >
                Drawer & Z-Report
              </Button>
            </Tooltip>

            {/* Champagne Gold "+ Quick Bill" CTA */}
            {canQuickBill && (
              <Tooltip title="Quick POS Bill (Alt + N or F2)">
                <IconButton
                  onClick={handleQuickBill}
                  size="small"
                  sx={{
                    width: 36,
                    height: 36,
                    display: { xs: 'inline-flex', sm: 'none' },
                    borderRadius: '9px',
                    background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.35)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #B45309 0%, #92400E 100%)'
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
                color="secondary"
                size="small"
                startIcon={<Add fontSize="small" />}
                onClick={handleQuickBill}
                title="Create Retail Invoice (Alt + N or F2)"
                sx={{
                  height: 36,
                  px: 2,
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: { xs: 'none', sm: 'inline-flex' }
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
                  borderRadius: '9px',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(15, 118, 110, 0.15)',
                  color: density === 'compact' ? (isDark ? '#2DD4BF' : '#0F766E') : 'text.secondary',
                  bgcolor: density === 'compact' ? (isDark ? 'rgba(20, 184, 166, 0.14)' : 'rgba(15, 118, 110, 0.08)') : 'transparent',
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(20, 184, 166, 0.22)' : 'rgba(15, 118, 110, 0.12)'
                  }
                }}
              >
                <ViewHeadline fontSize="small" />
              </IconButton>
            </Tooltip>

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

            {/* Top Right Logout Button - Hidden on phone screens to eliminate clutter; accessible via drawer */}
            <Tooltip title="Log out of Aleen Clothing">
              <Button
                onClick={handleLogout}
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Logout fontSize="small" />}
                sx={{
                  height: 36,
                  borderRadius: '9999px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.25)',
                  color: isDark ? '#FCA5A5' : '#DC2626',
                  bgcolor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(254, 242, 242, 0.7)',
                  px: { xs: 1, sm: 1.6 },
                  display: { xs: 'none', sm: 'inline-flex' },
                  '& .MuiButton-startIcon': {
                    mr: { xs: 0, sm: 1 },
                    ml: { xs: 0, sm: -0.5 }
                  },
                  '&:hover': {
                    borderColor: 'error.main',
                    bgcolor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2'
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
          <Box sx={{ flex: 1 }}>
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
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 118, 110, 0.12)',
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
                color: isActive ? '#0F766E' : 'text.secondary',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  color: isActive ? (isDark ? '#2DD4BF' : '#0F766E') : 'inherit',
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
                  color: isActive ? (isDark ? '#2DD4BF' : '#0F766E') : 'text.secondary',
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
                    bgcolor: isDark ? '#2DD4BF' : '#0F766E'
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
