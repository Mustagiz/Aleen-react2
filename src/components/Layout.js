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
  ListSubheader, 
  Tooltip,
  Fab,
  Menu as MuiMenu,
  MenuItem
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
  Circle,
  Straighten,
  ReceiptLong,
  Insights,
  BarChart,
  FactCheck,
  QrCodeScanner,
  Close,
  Palette,
  ExpandMore
} from './icons';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useThemeContext } from '../contexts/ThemeContext';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';
import NetworkStatus from './NetworkStatus';
import AtelierFooter from './crm/AtelierFooter';
import { ScriptWordmark } from './brand/BrandLockup';
import {
  getHeaderFont,
  getFontWeight,
  getFontStyle,
  DEFAULT_NAME_FONT,
  DEFAULT_NAME_SIZE,
  DEFAULT_TAGLINE_FONT,
  DEFAULT_TAGLINE_SIZE
} from './brand/headerFonts';
import CashDrawerShiftModal from './crm/CashDrawerShiftModal';

const SIDEBAR_EXPANDED_WIDTH = 265;
const SIDEBAR_COLLAPSED_WIDTH = 74;

export default function Layout() {
  const { logout, user } = useAuth();
  const { profile } = useData();
  const { mode, toggleTheme, designSystem, activeSystemConfig } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = mode === 'dark';
  const isAtelier = designSystem === 'atelier';
  const isMandate = designSystem === 'mandate';
  const [reportsAnchor, setReportsAnchor] = useState(null);
  const [settingsAnchor, setSettingsAnchor] = useState(null);

  // Live header clock (date + time)
  const [clockNow, setClockNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    return '10px';
  };

  const sidebarConfig = theme.custom?.sidebar || {
    bg: isDark ? '#0F1E1D' : '#FFFFFF',
    isDark: isDark,
    textColor: isDark ? '#CBD5E1' : '#334155',
    textActiveColor: '#FFFFFF',
    subheadColor: isDark ? '#94A3B8' : '#64748B',
    activePillBg: theme.palette.primary.main,
    activePillText: '#FFFFFF',
    borderColor: isDark ? 'transparent' : 'rgba(0, 0, 0, 0.08)'
  };

  // Brand lockup colours are configurable in Settings → Atelier Brand Identity.
  // With no override the wordmark keeps the rose-gold metallic house style.
  const brandNameColor = profile?.headerNameColor || '';
  const brandTaglineColor = profile?.headerTaglineColor
    || (sidebarConfig.isDark ? theme.palette.secondary.light : theme.palette.secondary.main);

  const brandNameFont = getHeaderFont(profile?.headerNameFont || DEFAULT_NAME_FONT);
  const brandTaglineFont = getHeaderFont(profile?.headerTaglineFont || DEFAULT_TAGLINE_FONT);
  const brandNameSize = Number(profile?.headerNameSize) || DEFAULT_NAME_SIZE;
  const brandTaglineSize = Number(profile?.headerTaglineSize) || DEFAULT_TAGLINE_SIZE;
  const brandNameWeight = getFontWeight(brandNameFont, !!profile?.headerNameBold);
  const brandNameStyle = getFontStyle(brandNameFont, !!profile?.headerNameItalic);
  const brandTaglineWeight = getFontWeight(brandTaglineFont, !!profile?.headerTaglineBold);
  const brandTaglineStyle = getFontStyle(brandTaglineFont, !!profile?.headerTaglineItalic);
  const taglineIsScript = brandTaglineFont.kind === 'script';
  const brandInitial = (profile?.businessName || 'A').trim().charAt(0).toUpperCase();

  const topBarConfig = theme.custom?.topBar || {
    bg: isDark ? 'rgba(15, 30, 29, 0.88)' : 'rgba(255, 255, 255, 0.92)',
    textColor: isDark ? '#F8FAFC' : '#0F172A',
    isColored: false,
    borderColor: isDark ? 'transparent' : 'rgba(0, 0, 0, 0.08)'
  };

  // Desktop sidebar collapsed state with local storage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('aleen_sidebar_collapsed') === 'true';
  });

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cashDrawerOpen, setCashDrawerOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

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
    if (path === '/') return 'Main Dashboard';
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


        {/* Brand Header — wordmark only; logo artwork stays on printed stationery */}
        <Box sx={{
          p: showCollapsed ? 1.5 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: sidebarConfig.borderColor,
          minHeight: 64
        }}>
          <Box
            onClick={() => {
              navigate('/');
              if (isMobile) setMobileOpen(false);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              minWidth: 0,
              cursor: 'pointer',
              ...(showCollapsed ? { justifyContent: 'center' } : {})
            }}
          >
            {showCollapsed ? (
              <Typography sx={{
                fontFamily: brandNameFont.stack,
                fontWeight: brandNameWeight,
                fontStyle: brandNameStyle,
                fontSize: `${Math.min(brandNameSize, 30)}px`,
                lineHeight: 1,
                ...(brandNameColor
                  ? { color: brandNameColor }
                  : {
                      background: 'linear-gradient(96deg, #A85E3F 0%, #D89A72 24%, #F5DCC6 44%, #C97F5C 66%, #E9B694 84%, #B76E4F 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent'
                    })
              }}>
                {brandInitial}
              </Typography>
            ) : (
              <Box sx={{ overflow: 'hidden', minWidth: 0, width: '100%' }}>
                <ScriptWordmark
                  name={profile?.businessName || 'Aleen Clothing'}
                  metallic={!brandNameColor}
                  color={brandNameColor}
                  fontSize={`${brandNameSize}px`}
                  lineHeight={1.15}
                  sx={{
                    mt: '-2px',
                    fontFamily: brandNameFont.stack,
                    fontWeight: brandNameWeight,
                    fontStyle: brandNameStyle,
                    letterSpacing: brandNameFont.kind === 'script' ? '0.015em' : '0.02em',
                    textOverflow: 'ellipsis'
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25, minWidth: 0 }}>
                  <Box sx={{
                    width: 14,
                    height: 2,
                    borderRadius: '999px',
                    bgcolor: brandTaglineColor,
                    flexShrink: 0
                  }} />
                  <Typography sx={{
                    fontFamily: brandTaglineFont.stack,
                    fontSize: `${brandTaglineSize}px`,
                    fontWeight: brandTaglineWeight,
                    fontStyle: brandTaglineStyle,
                    color: brandTaglineColor,
                    textTransform: taglineIsScript ? 'none' : 'uppercase',
                    letterSpacing: taglineIsScript ? '0.04em' : '0.3em',
                    lineHeight: 1.35,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {getSystemSubtitle()}
                  </Typography>
                </Box>
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
          py: 1.25,
          px: showCollapsed ? 1 : 1.5,
          scrollbarWidth: 'thin',
          scrollbarColor: `${sidebarConfig.isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.14)'} transparent`,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: sidebarConfig.isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.14)',
            borderRadius: 2
          }
        }}>
          {workflowSections.map((section) => (
            <Box key={section.title} sx={{ mb: 1 }}>
              {!showCollapsed && (
                <ListSubheader sx={{
                  bgcolor: 'transparent',
                  color: sidebarConfig.subheadColor,
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  px: 1.5,
                  py: 0.25,
                  lineHeight: '1.5rem'
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
                        mb: 0.35,
                        py: { xs: 0.85, sm: 0.75 },
                        minHeight: { xs: 38, sm: 34 },
                        px: showCollapsed ? 1 : 1.5,
                        justifyContent: showCollapsed ? 'center' : 'flex-start',
                        bgcolor: isActive
                          ? (isAtelier && sidebarConfig.isDark ? 'rgba(124, 111, 232, 0.16)' : sidebarConfig.activePillBg)
                          : 'transparent',
                        color: isActive
                          ? (isAtelier && sidebarConfig.isDark ? theme.palette.primary.light : sidebarConfig.activePillText)
                          : (sidebarConfig.isDark ? '#CBD5E1' : 'text.secondary'),
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': {
                          bgcolor: isActive
                            ? (isAtelier && sidebarConfig.isDark ? 'rgba(124, 111, 232, 0.16)' : sidebarConfig.activePillBg)
                            : (sidebarConfig.isDark ? 'rgba(255, 255, 255, 0.08)' : `${theme.palette.primary.main}12`),
                          color: isActive
                            ? (isAtelier && sidebarConfig.isDark ? theme.palette.primary.light : sidebarConfig.activePillText)
                            : (sidebarConfig.isDark ? '#FFFFFF' : 'primary.main'),
                          transform: showCollapsed ? 'none' : 'translateX(2px)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{
                        minWidth: showCollapsed ? 'auto' : 30,
                        justifyContent: 'center',
                        color: isActive
                          ? (isAtelier && sidebarConfig.isDark ? theme.palette.primary.light : sidebarConfig.activePillText)
                          : (sidebarConfig.isDark ? '#94A3B8' : 'inherit'),
                        '& .MuiSvgIcon-root': {
                          fontSize: 18
                        }
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      {!showCollapsed && (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: isActive ? 700 : 500,
                            fontSize: '0.78rem',
                            letterSpacing: '-0.01em',
                            color: isActive
                              ? (isAtelier && sidebarConfig.isDark ? theme.palette.primary.light : sidebarConfig.activePillText)
                              : (sidebarConfig.isDark ? '#F8FAFC' : 'text.primary')
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

  // Horizon-style icon button shell for the Atelier top bar
  const horizonIconBtnSx = (active = false) => ({
    width: 34,
    height: 34,
    borderRadius: '10px',
    border: isDark ? '1px solid transparent' : '1px solid #EFEFF4',
    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
    color: active ? theme.palette.primary.main : 'text.secondary',
    flexShrink: 0,
    '&:hover': {
      bgcolor: isDark ? 'rgba(124, 111, 232, 0.16)' : '#F1EFFC',
      color: theme.palette.primary.main
    }
  });

  // Horizon FREE-style top bar: breadcrumb + title on the left,
  // single utility capsule (search, bell, info, moon, avatar) on the right
  const renderHorizonTopBar = () => (
    <>
      {/* Left: Collapse Toggle + Breadcrumb + Page Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.75 }, minWidth: 0, flex: 1 }}>
        <IconButton
          onClick={isMobile ? () => setMobileOpen(true) : toggleSidebarCollapse}
          size="small"
          sx={horizonIconBtnSx()}
          title={isMobile ? "Open menu" : (isCollapsed ? "Expand sidebar" : "Collapse sidebar")}
        >
          {isMobile ? <Menu fontSize="small" /> : (isCollapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />)}
        </IconButton>

        <Box sx={{ display: { xs: 'none', md: 'block' }, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.02em', lineHeight: 1.3 }} noWrap>
            Pages / <Box component="span" sx={{ color: 'primary.main' }}>{getBreadcrumbTitle()}</Box>
          </Typography>
          <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: 'text.primary', letterSpacing: '-0.015em', lineHeight: 1.25 }} noWrap>
            {getBreadcrumbTitle()}
          </Typography>
        </Box>

        <Typography
          noWrap
          sx={{
            display: { xs: 'block', md: 'none' },
            fontSize: '0.9rem',
            fontWeight: 800,
            color: 'text.primary',
            letterSpacing: '-0.015em',
            flex: 1,
            minWidth: 0
          }}
        >
          {getBreadcrumbTitle()}
        </Typography>
      </Box>

      {/* Center: Live Date & Time */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          alignItems: 'baseline',
          gap: 0.75,
          flexShrink: 0,
          px: 1.5,
          py: 0.5,
          borderRadius: '999px',
          whiteSpace: 'nowrap'
        }}
      >
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'text.primary', letterSpacing: '0.01em' }}>
          {clockNow.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'text.secondary' }}>
          · {clockNow.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </Typography>
      </Box>

      {/* Right: Horizon utility capsule */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.25, sm: 0.5 },
          flexShrink: 0,
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
          border: '1px solid transparent',
          borderRadius: '999px',
          px: { xs: 0.5, sm: 1 },
          py: 0.5,
          boxShadow: isDark
            ? '0 10px 28px rgba(0, 0, 0, 0.4)'
            : '0 10px 28px rgba(112, 114, 176, 0.14), 0 1px 3px rgba(31, 27, 46, 0.05)'
        }}
      >
        {/* Search (gray inset field, icon-only on phones) */}
        <Box
          onClick={() => setSearchOpen(true)}
          title="Search CRM (⌘K)"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            height: 30,
            px: { xs: 0.75, sm: 1.5 },
            borderRadius: '999px',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.07)' : '#F3F4F6',
            color: 'text.secondary',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#EBECF1' }
          }}
        >
          <Search sx={{ fontSize: '1rem' }} />
          <Typography noWrap sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '0.76rem', fontWeight: 600 }}>
            Search...
          </Typography>
        </Box>

        {/* Notifications */}
        <NotificationCenter plain />

        {/* Theme Toggle (Porcelain / Dark Mode) */}
        <IconButton
          onClick={toggleTheme}
          size="small"
          title={mode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            color: 'text.secondary',
            '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1EFFC', color: theme.palette.primary.main }
          }}
        >
          {mode === 'dark'
            ? <Brightness7 sx={{ fontSize: '1.05rem', color: '#F59E0B' }} />
            : <Brightness4 sx={{ fontSize: '1.05rem', color: theme.palette.primary.main }} />}
        </IconButton>

        {/* Circular Profile Avatar */}
        <Avatar
          src={profile?.logoUrl || undefined}
          alt={profile?.businessName || 'Aleen'}
          onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
          title="Account menu"
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: theme.palette.primary.main,
            color: '#FFFFFF',
            fontSize: '0.7rem',
            fontWeight: 800,
            ml: 0.25,
            cursor: 'pointer',
            border: isDark ? '1px solid transparent' : `2px solid ${theme.palette.primary.main}66`,
            objectFit: 'contain',
            p: profile?.logoUrl ? 0.25 : 0,
            boxShadow: `0 2px 8px ${theme.palette.primary.main}59`,
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            '&:hover': {
              boxShadow: `0 0 0 4px ${theme.palette.primary.main}2E, 0 2px 8px ${theme.palette.primary.main}59`,
              transform: 'translateY(-1px)'
            }
          }}
        >
          {(profile?.businessName || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
        </Avatar>
      </Box>

      {/* Profile dropdown menu */}
      <MuiMenu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={() => setProfileMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.25,
            minWidth: 220,
            borderRadius: '14px',
            bgcolor: isDark ? '#1D1A2E' : '#FFFFFF',
            backgroundImage: 'none',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#EFEFF4'}`,
            boxShadow: isDark ? '0 16px 40px rgba(0, 0, 0, 0.5)' : '0 16px 40px rgba(112, 114, 176, 0.2)'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1EFFC'}` }}>
          <ScriptWordmark
            name={profile?.businessName || 'Aleen Clothing'}
            metallic={!brandNameColor}
            color={brandNameColor}
            fontSize={`${Math.round(brandNameSize * 0.82)}px`}
            lineHeight={1.2}
            sx={{
              fontFamily: brandNameFont.stack,
              fontWeight: brandNameWeight,
              fontStyle: brandNameStyle,
              letterSpacing: brandNameFont.kind === 'script' ? '0.015em' : '0.02em',
              textOverflow: 'ellipsis'
            }}
          />
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>
            {user?.name || user?.email || 'Boutique Owner'}
          </Typography>
        </Box>
        <MenuItem
          onClick={() => { setProfileMenuAnchor(null); navigate('/settings'); }}
          sx={{ fontSize: '0.8rem', fontWeight: 600, gap: 1.25, py: 1.1, color: 'text.primary' }}
        >
          <Settings fontSize="small" sx={{ color: 'text.secondary' }} /> Boutique Settings
        </MenuItem>
        <MenuItem
          onClick={() => { setProfileMenuAnchor(null); navigate('/settings?tab=colors'); }}
          sx={{ fontSize: '0.8rem', fontWeight: 600, gap: 1.25, py: 1.1, color: 'text.primary' }}
        >
          <Palette fontSize="small" sx={{ color: theme.palette.primary.main }} /> Color Themes
        </MenuItem>
        <Divider sx={{ my: 0.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EFEFF4' }} />
        <MenuItem
          onClick={() => { setProfileMenuAnchor(null); handleLogout(); }}
          sx={{ fontSize: '0.8rem', fontWeight: 700, gap: 1.25, py: 1.1, color: isDark ? '#FCA5A5' : '#DC2626' }}
        >
          <Logout fontSize="small" sx={{ color: 'inherit' }} /> Logout
        </MenuItem>
      </MuiMenu>
    </>
  );

  // Floating Top Capsule Bar with Real Aleen Pages + Overflow Dropdowns
  const renderMandateTopBar = () => {
    const reportRoutes = [
      { label: 'Daily Cash Ledger', path: '/payment-summary' },
      { label: 'Profit & Loss', path: '/profit-loss' },
      { label: 'Expenses Register', path: '/expenses' },
      { label: 'Sales Reports', path: '/sales-reports' },
      { label: 'Stock Audit', path: '/inventory-reports' },
      { label: 'Advanced Analytics', path: '/advanced-reports' }
    ];
    const isReportsActive = reportRoutes.some((r) => location.pathname === r.path);

    const settingsRoutes = [
      { label: 'Boutique Settings', path: '/settings' },
      { label: 'Barcode Studio', path: '/barcodes' },
      { label: 'Device Manager', path: '/devices' },
      { label: 'VIP Loyalty', path: '/loyalty' },
      { label: 'Marketing Hub', path: '/marketing' },
      { label: 'Purchase Orders', path: '/purchases' }
    ];
    const isSettingsActive = settingsRoutes.some((r) => location.pathname === r.path);

    const mainPillItems = [
      { label: 'Dashboard', path: '/' },
      { label: 'Invoices', path: '/invoices' },
      { label: 'Customers', path: '/customers' },
      { label: 'Inventory', path: '/inventory' },
      { label: 'Tailoring', path: '/tailoring' },
      { label: 'Vendors', path: '/vendors', matchPaths: ['/vendors', '/discovery'] }
    ];

    return (
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        {/* Left: Boutique Brand Name & Tagline */}
        <Box
          onClick={() => navigate('/')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer', flexShrink: 0 }}
        >
          {isMobile && (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setMobileOpen(true);
              }}
              size="small"
              sx={{ color: '#080F1C', mr: 0.5 }}
            >
              <Menu fontSize="small" />
            </IconButton>
          )}
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: '#080F1C',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.88rem',
              boxShadow: '0 2px 8px rgba(8, 15, 28, 0.2)'
            }}
          >
            {brandInitial}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              sx={{
                fontFamily: brandNameFont.stack,
                fontWeight: brandNameWeight || 700,
                fontStyle: brandNameStyle,
                fontSize: `${Math.min(Math.max(brandNameSize * 0.9, 17), 22)}px`,
                color: brandNameColor || '#080F1C',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}
            >
              {profile?.businessName || 'Aleen'}
            </Typography>
            <Typography
              sx={{
                fontFamily: brandTaglineFont.stack,
                fontSize: '0.65rem',
                fontWeight: 600,
                color: '#66707B',
                textTransform: taglineIsScript ? 'none' : 'uppercase',
                letterSpacing: taglineIsScript ? '0.04em' : '0.14em',
                lineHeight: 1
              }}
            >
              {profile?.tagline || 'Haute Couture Atelier'}
            </Typography>
          </Box>
        </Box>

        {/* Center: Floating Dark Navy Capsule Navigation */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            bgcolor: '#080F1C',
            borderRadius: '9999px',
            p: '3px 4px',
            gap: 0.35,
            boxShadow: '0 4px 16px rgba(8, 15, 28, 0.25)'
          }}
        >
          {mainPillItems.map((item) => {
            const isActive = item.matchPaths
              ? item.matchPaths.some((p) => location.pathname === p || location.pathname.startsWith(p))
              : location.pathname === item.path;

            return (
              <Box
                key={item.label}
                onClick={() => navigate(item.path)}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '9999px',
                  bgcolor: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#080F1C' : 'rgba(255, 255, 255, 0.75)',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    color: isActive ? '#080F1C' : '#FFFFFF',
                    bgcolor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)'
                  }
                }}
              >
                <span>{item.label}</span>
              </Box>
            );
          })}

          {/* Reports ▾ Dropdown Pill */}
          <Box
            onClick={(e) => setReportsAnchor(e.currentTarget)}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: '9999px',
              bgcolor: isReportsActive ? '#FFFFFF' : 'transparent',
              color: isReportsActive ? '#080F1C' : 'rgba(255, 255, 255, 0.75)',
              fontSize: '0.78rem',
              fontWeight: isReportsActive ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 0.3,
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                color: isReportsActive ? '#080F1C' : '#FFFFFF',
                bgcolor: isReportsActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)'
              }
            }}
          >
            <span>Reports</span>
            <ExpandMore sx={{ fontSize: 15, opacity: 0.7 }} />
          </Box>

          {/* Settings ▾ Dropdown Pill */}
          <Box
            onClick={(e) => setSettingsAnchor(e.currentTarget)}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: '9999px',
              bgcolor: isSettingsActive ? '#FFFFFF' : 'transparent',
              color: isSettingsActive ? '#080F1C' : 'rgba(255, 255, 255, 0.75)',
              fontSize: '0.78rem',
              fontWeight: isSettingsActive ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 0.3,
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                color: isSettingsActive ? '#080F1C' : '#FFFFFF',
                bgcolor: isSettingsActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)'
              }
            }}
          >
            <span>Settings</span>
            <ExpandMore sx={{ fontSize: 15, opacity: 0.7 }} />
          </Box>
        </Box>

        {/* Reports Dropdown Menu */}
        <MuiMenu
          anchorEl={reportsAnchor}
          open={Boolean(reportsAnchor)}
          onClose={() => setReportsAnchor(null)}
          PaperProps={{
            sx: {
              mt: 1.25,
              borderRadius: '16px',
              bgcolor: '#080F1C',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 16px 40px rgba(8, 15, 28, 0.4)',
              py: 0.75,
              px: 0.5,
              minWidth: 210
            }
          }}
        >
          <Typography
            sx={{
              px: 1.75,
              py: 0.6,
              fontSize: '0.66rem',
              fontWeight: 750,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#969DA7'
            }}
          >
            Finance & Audit
          </Typography>
          {reportRoutes.map((r) => {
            const isSelected = location.pathname === r.path;
            return (
              <MenuItem
                key={r.path}
                onClick={() => {
                  setReportsAnchor(null);
                  navigate(r.path);
                }}
                sx={{
                  borderRadius: '10px',
                  px: 1.75,
                  py: 0.75,
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                  bgcolor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.14)',
                    color: '#FFFFFF'
                  }
                }}
              >
                {r.label}
              </MenuItem>
            );
          })}
        </MuiMenu>

        {/* Settings Dropdown Menu */}
        <MuiMenu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={() => setSettingsAnchor(null)}
          PaperProps={{
            sx: {
              mt: 1.25,
              borderRadius: '16px',
              bgcolor: '#080F1C',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 16px 40px rgba(8, 15, 28, 0.4)',
              py: 0.75,
              px: 0.5,
              minWidth: 210
            }
          }}
        >
          <Typography
            sx={{
              px: 1.75,
              py: 0.6,
              fontSize: '0.66rem',
              fontWeight: 750,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#969DA7'
            }}
          >
            Atelier Operations
          </Typography>
          {settingsRoutes.map((s) => {
            const isSelected = location.pathname === s.path;
            return (
              <MenuItem
                key={s.path}
                onClick={() => {
                  setSettingsAnchor(null);
                  navigate(s.path);
                }}
                sx={{
                  borderRadius: '10px',
                  px: 1.75,
                  py: 0.75,
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                  bgcolor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.14)',
                    color: '#FFFFFF'
                  }
                }}
              >
                {s.label}
              </MenuItem>
            );
          })}
        </MuiMenu>

        {/* Right Utility: Live Clock + Command Search + Shift + Notifications + Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              px: 1.5,
              py: 0.5,
              borderRadius: '9999px',
              bgcolor: '#FFFFFF',
              border: '1px solid #E1E4EA',
              color: '#66707B',
              fontSize: '0.72rem',
              fontWeight: 650,
              letterSpacing: '0.01em'
            }}
          >
            {clockNow.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </Box>

          <Box
            onClick={() => setSearchOpen(true)}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1.25,
              px: 1.5,
              py: 0.55,
              borderRadius: '9999px',
              bgcolor: '#FFFFFF',
              border: '1px solid #E1E4EA',
              color: '#66707B',
              fontSize: '0.76rem',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(8, 15, 28, 0.04)',
              transition: 'all 0.18s ease',
              '&:hover': {
                borderColor: '#080F1C',
                color: '#080F1C'
              }
            }}
          >
            <Search sx={{ fontSize: 14 }} />
            <span>Ask Aleen</span>
            <Box
              sx={{
                fontSize: '0.64rem',
                fontWeight: 750,
                color: '#969DA7',
                bgcolor: '#F4F5F7',
                px: 0.7,
                py: 0.1,
                borderRadius: '4px'
              }}
            >
              ⌘K
            </Box>
          </Box>

          {/* Quick Cash Register Modal */}
          <Tooltip title="Cash Register & Shift">
            <IconButton
              size="small"
              onClick={() => setCashDrawerOpen(true)}
              sx={{
                width: 34,
                height: 34,
                bgcolor: '#FFFFFF',
                border: '1px solid #E1E4EA',
                color: '#080F1C',
                '&:hover': { bgcolor: '#F4F5F7' }
              }}
            >
              <AccountBalanceWallet sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          {/* Notification Center */}
          <NotificationCenter />

          {/* User Profile Avatar with dropdown */}
          <Avatar
            onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
            sx={{
              width: 34,
              height: 34,
              bgcolor: '#080F1C',
              color: '#FFFFFF',
              fontSize: '0.76rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: '2px solid #FFFFFF',
              boxShadow: '0 2px 8px rgba(8, 15, 28, 0.15)',
              transition: 'transform 0.18s ease',
              '&:hover': { transform: 'scale(1.05)' }
            }}
          >
            {(user?.name || user?.email || 'AD').substring(0, 2).toUpperCase()}
          </Avatar>
        </Box>
      </Box>
    );
  };

  // If Mandate Design System is active, render the floating rounded app shell on cool-gray stage
  if (isMandate) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          height: '100vh',
          bgcolor: '#D7DBDF', // Quiet cool-gray stage background
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 0, md: 2 },
          overflow: 'hidden'
        }}
      >
        <Box
          className="app-surface"
          sx={{
            width: '100%',
            maxWidth: '1540px',
            height: { xs: '100vh', md: 'calc(100vh - 32px)' },
            bgcolor: '#ECEEF2', // Lavender-tinted main application shell
            borderRadius: { xs: 0, md: '22px' },
            border: { xs: 'none', md: '2px solid #FFFFFF' },
            boxShadow: { xs: 'none', md: '0 16px 48px rgba(8, 15, 28, 0.08)' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Top Mandate Navigation Header */}
          <Box
            component="header"
            sx={{
              px: { xs: 2, md: 3 },
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'transparent',
              flexShrink: 0,
              borderBottom: '1px solid rgba(225, 228, 234, 0.65)'
            }}
          >
            {renderMandateTopBar()}
          </Box>

          {/* Main App Workspace */}
          <Box
            component="main"
            sx={{
              flex: 1,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              p: { xs: 2, md: 3 },
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#ECEEF2'
            }}
          >
            <Box sx={{ flex: 1, position: 'relative' }}>
              <Outlet />
            </Box>
          </Box>
        </Box>

        {/* Mobile Drawer */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            PaperProps={{
              sx: {
                width: 280,
                bgcolor: sidebarConfig.bg,
                borderRight: `1px solid ${sidebarConfig.borderColor}`,
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)'
              }
            }}
          >
            {renderSidebarContent()}
          </Drawer>
        )}

        {/* Profile dropdown menu */}
        <MuiMenu
          anchorEl={profileMenuAnchor}
          open={Boolean(profileMenuAnchor)}
          onClose={() => setProfileMenuAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1.25,
              minWidth: 220,
              borderRadius: '14px',
              bgcolor: isDark ? '#1D1A2E' : '#FFFFFF',
              backgroundImage: 'none',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#EFEFF4'}`,
              boxShadow: isDark ? '0 16px 40px rgba(0, 0, 0, 0.5)' : '0 16px 40px rgba(112, 114, 176, 0.2)'
            }
          }}
        >
          <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1EFFC'}` }}>
            <ScriptWordmark
              name={profile?.businessName || 'Aleen Clothing'}
              metallic={!brandNameColor}
              color={brandNameColor}
              fontSize={`${Math.round(brandNameSize * 0.82)}px`}
              lineHeight={1.2}
              sx={{
                fontFamily: brandNameFont.stack,
                fontWeight: brandNameWeight,
                fontStyle: brandNameStyle,
                letterSpacing: brandNameFont.kind === 'script' ? '0.015em' : '0.02em',
                textOverflow: 'ellipsis'
              }}
            />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>
              {user?.name || user?.email || 'Boutique Owner'}
            </Typography>
          </Box>
          <MenuItem
            onClick={() => { setProfileMenuAnchor(null); navigate('/settings'); }}
            sx={{ fontSize: '0.8rem', fontWeight: 600, gap: 1.25, py: 1.1, color: 'text.primary' }}
          >
            <Settings fontSize="small" sx={{ color: 'text.secondary' }} /> Boutique Settings
          </MenuItem>
          <MenuItem
            onClick={() => { setProfileMenuAnchor(null); navigate('/settings?tab=colors'); }}
            sx={{ fontSize: '0.8rem', fontWeight: 600, gap: 1.25, py: 1.1, color: 'text.primary' }}
          >
            <Palette fontSize="small" sx={{ color: theme.palette.primary.main }} /> Color Themes
          </MenuItem>
          <Divider sx={{ my: 0.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EFEFF4' }} />
          <MenuItem
            onClick={() => { setProfileMenuAnchor(null); handleLogout(); }}
            sx={{ fontSize: '0.8rem', fontWeight: 700, gap: 1.25, py: 1.1, color: isDark ? '#FCA5A5' : '#DC2626' }}
          >
            <Logout fontSize="small" sx={{ color: 'inherit' }} /> Logout
          </MenuItem>
        </MuiMenu>

        {/* Global Dialogs & Alerts */}
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
        <CashDrawerShiftModal open={cashDrawerOpen} onClose={() => setCashDrawerOpen(false)} />
        <NetworkStatus />
      </Box>
    );
  }

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
            height: { xs: 58, sm: 66 },
            px: { xs: 1.5, sm: 2.5, md: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: !isDark ? 'background.default' : topBarConfig.bg,
            color: topBarConfig.textColor,
            backdropFilter: topBarConfig.isTranslucent ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: topBarConfig.isTranslucent ? 'blur(20px)' : 'none',
            borderBottom: `1px solid ${topBarConfig.borderColor}`,
            transition: 'background-color 0.25s ease, border-color 0.25s ease',
            zIndex: 10,
            flexShrink: 0,
            gap: 1
          }}
        >
          {renderHorizonTopBar()}
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
