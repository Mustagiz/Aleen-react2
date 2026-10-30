import React, { useState, useMemo, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Button,
  Chip,
  useTheme,
  Avatar,
  Paper,
  Stack
} from '@mui/material';
import {
  TrendingUp,
  Inventory2,
  Warning,
  AttachMoney,
  Receipt,
  Assessment,
  ArrowForward,
  Circle,
  ShoppingCart,
  AccountBalanceWallet,
  Straighten,
  PointOfSale,
  Add
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import CashDrawerShiftModal from '../components/crm/CashDrawerShiftModal';
import { useThemeContext } from '../contexts/ThemeContext';
import { getThemeChartPalette } from '../utils/chartTheme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { user } = useAuth();
  const { inventory = [], invoices = [], purchases = [], vendors = [], expenses = [], getLowStockItems, profile = {} } = useData();
  const navigate = useNavigate();
  const theme = useTheme();
  const { designSystem, activeSystemConfig } = useThemeContext();
  const isDark = theme.palette.mode === 'dark';

  const getSystemBannerConfig = () => {
    const primaryColor = theme.palette.primary.main;
    const darkPrimary = theme.palette.primary.dark;
    const lightPrimary = theme.palette.primary.light;

    switch (designSystem) {
      case 'zoho':
        return {
          badge: 'ZOHO CRM ENTERPRISE',
          title: 'Enterprise Command & Operations',
          bg: isDark ? 'linear-gradient(135deg, #182033 0%, #0F1522 100%)' : 'linear-gradient(135deg, #182033 0%, #253352 100%)',
          textColor: '#FFFFFF',
          subtextColor: 'rgba(255, 255, 255, 0.88)',
          isDarkBanner: true,
          borderColor: `${primaryColor}66`,
          shadow: '0 12px 32px rgba(24, 32, 51, 0.35)',
          ctaBg: primaryColor,
          ctaHover: darkPrimary,
          badgeBg: `${primaryColor}33`,
          badgeColor: '#FFD8BF',
          radius: `${activeSystemConfig?.shape?.cardRadius || 8}px`
        };
      case 'microsoft':
        return {
          badge: 'MICROSOFT FLUENT 365',
          title: 'Dynamics 365 Operations Console',
          bg: isDark ? 'linear-gradient(135deg, #004E8C 0%, #002B4D 100%)' : `linear-gradient(135deg, ${primaryColor} 0%, ${darkPrimary} 100%)`,
          textColor: '#FFFFFF',
          subtextColor: 'rgba(255, 255, 255, 0.88)',
          isDarkBanner: true,
          borderColor: 'rgba(255, 255, 255, 0.25)',
          shadow: `0 8px 24px ${primaryColor}4D`,
          ctaBg: primaryColor,
          ctaHover: darkPrimary,
          badgeBg: 'rgba(255, 255, 255, 0.2)',
          badgeColor: '#FFFFFF',
          radius: `${activeSystemConfig?.shape?.cardRadius || 6}px`
        };
      case 'apple':
        return {
          badge: 'MACOS LIQUID STUDIO',
          title: 'Executive Studio Overview',
          bg: isDark ? 'rgba(28, 28, 30, 0.88)' : 'rgba(255, 255, 255, 0.85)',
          textColor: isDark ? '#FFFFFF' : '#1D1D1F',
          subtextColor: isDark ? 'rgba(255, 255, 255, 0.75)' : '#6E6E73',
          isDarkBanner: isDark,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
          shadow: isDark ? '0 16px 40px rgba(0, 0, 0, 0.45)' : '0 12px 36px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03)',
          ctaBg: primaryColor,
          ctaHover: darkPrimary,
          badgeBg: isDark ? `${primaryColor}38` : `${primaryColor}18`,
          badgeColor: isDark ? lightPrimary : primaryColor,
          backdropFilter: 'blur(30px) saturate(180%)',
          radius: `${activeSystemConfig?.shape?.cardRadius || 18}px`
        };
      case 'linear':
        return {
          badge: 'LINEAR PRECISION CORE',
          title: 'Workspace Metrics & Revenue Pulse',
          bg: '#0D0E11',
          textColor: '#FFFFFF',
          subtextColor: 'rgba(255, 255, 255, 0.8)',
          isDarkBanner: true,
          borderColor: '#23252A',
          shadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
          ctaBg: primaryColor,
          ctaHover: darkPrimary,
          badgeBg: `${primaryColor}2E`,
          badgeColor: lightPrimary,
          radius: `${activeSystemConfig?.shape?.cardRadius || 6}px`
        };
      case 'material':
        return {
          badge: 'MATERIAL YOU M3',
          title: 'Expressive Boutique Summary',
          bg: isDark ? 'linear-gradient(135deg, #1E2129 0%, #111318 100%)' : `linear-gradient(135deg, ${primaryColor}14 0%, ${primaryColor}2E 100%)`,
          textColor: isDark ? '#FFFFFF' : '#041E49',
          subtextColor: isDark ? 'rgba(255, 255, 255, 0.8)' : '#334155',
          isDarkBanner: isDark,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : `${primaryColor}33`,
          shadow: `0 8px 28px ${primaryColor}22`,
          ctaBg: primaryColor,
          ctaHover: darkPrimary,
          badgeBg: `${primaryColor}28`,
          badgeColor: isDark ? lightPrimary : primaryColor,
          radius: `${activeSystemConfig?.shape?.cardRadius || 24}px`
        };
      case 'stripe':
        return {
          badge: 'STRIPE FINTECH PLATFORM',
          title: 'Financial Revenue & Orders Intel',
          bg: 'linear-gradient(135deg, #0A2540 0%, #071A2E 100%)',
          textColor: '#FFFFFF',
          subtextColor: 'rgba(255, 255, 255, 0.88)',
          isDarkBanner: true,
          borderColor: `${primaryColor}55`,
          shadow: '0 12px 32px rgba(10, 37, 64, 0.4)',
          ctaBg: primaryColor,
          ctaHover: darkPrimary,
          badgeBg: `${primaryColor}33`,
          badgeColor: lightPrimary,
          radius: `${activeSystemConfig?.shape?.cardRadius || 12}px`
        };
      case 'salesforce':
        return {
          badge: 'SALESFORCE LIGHTNING',
          title: 'Lightning Cloud Operations',
          bg: isDark ? 'linear-gradient(135deg, #014486 0%, #012852 100%)' : `linear-gradient(135deg, ${primaryColor} 0%, ${darkPrimary} 100%)`,
          textColor: '#FFFFFF',
          subtextColor: 'rgba(255, 255, 255, 0.92)',
          isDarkBanner: true,
          borderColor: 'rgba(255, 255, 255, 0.25)',
          shadow: `0 8px 24px ${primaryColor}4D`,
          ctaBg: primaryColor,
          ctaHover: darkPrimary,
          badgeBg: 'rgba(255, 255, 255, 0.2)',
          badgeColor: '#FFFFFF',
          radius: `${activeSystemConfig?.shape?.cardRadius || 6}px`
        };
      default: // Atelier
        return {
          badge: 'HAUTE COUTURE ATELIER',
          title: 'Executive Command & Overview',
          bg: isDark ? 'linear-gradient(135deg, #071E1C 0%, #041211 100%)' : `linear-gradient(135deg, ${darkPrimary || '#042F2E'} 0%, ${primaryColor} 100%)`,
          textColor: '#FFFFFF',
          subtextColor: 'rgba(255, 255, 255, 0.88)',
          isDarkBanner: true,
          borderColor: `${primaryColor}4D`,
          shadow: `0 12px 32px ${darkPrimary || '#042F2E'}40`,
          ctaBg: primaryColor,
          ctaHover: darkPrimary,
          badgeBg: `${primaryColor}38`,
          badgeColor: '#FEF08A',
          radius: `${activeSystemConfig?.shape?.cardRadius || 16}px`
        };
    }
  };

  const sysBanner = getSystemBannerConfig();

  // Dynamic Theme Button Styling Helpers for Dashboard Banner Actions
  const getBannerPrimaryBtnStyle = () => {
    const radius = activeSystemConfig?.shape?.buttonRadius ?? theme.shape?.borderRadius ?? 8;
    const ctaBg = sysBanner.ctaBg || theme.palette.primary.main;
    const ctaHover = sysBanner.ctaHover || theme.palette.primary.dark;
    const contrastText = theme.palette.primary.contrastText || '#FFFFFF';

    return {
      bgcolor: `${ctaBg} !important`,
      color: `${contrastText} !important`,
      fontWeight: 700,
      fontSize: { xs: '0.84rem', sm: '0.84rem' },
      borderRadius: `${radius}px !important`,
      minHeight: { xs: 44, sm: 40 },
      px: { xs: 2.4, sm: 2.6 },
      textTransform: activeSystemConfig?.buttonStyle?.textTransform || 'none',
      boxShadow: `0 4px 14px ${ctaBg}55`,
      border: '1px solid rgba(255, 255, 255, 0.25) !important',
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.75,
      '& .MuiSvgIcon-root, & .MuiButton-startIcon, & .MuiButton-startIcon > *:first-of-type': {
        color: `${contrastText} !important`,
        fontSize: '1.2rem !important'
      },
      '&:hover': {
        bgcolor: `${ctaHover} !important`,
        boxShadow: `0 6px 18px ${ctaBg}88`,
        transform: 'translateY(-1px)'
      },
      '&:active': {
        transform: 'scale(0.98)'
      },
      '&:focus-visible': {
        outline: `2px solid ${ctaBg}`,
        outlineOffset: 2
      }
    };
  };

  const getBannerSecondaryBtnStyle = () => {
    const radius = activeSystemConfig?.shape?.buttonRadius ?? theme.shape?.borderRadius ?? 8;
    const isDarkBanner = sysBanner.isDarkBanner;

    if (isDarkBanner) {
      // Saturated or dark hero banners (Atelier, Zoho, Microsoft, Stripe, Salesforce, Linear, or Dark Mode)
      return {
        bgcolor: 'rgba(255, 255, 255, 0.12) !important',
        color: '#FFFFFF !important',
        border: '1px solid rgba(255, 255, 255, 0.28) !important',
        borderRadius: `${radius}px !important`,
        fontWeight: 600,
        fontSize: { xs: '0.82rem', sm: '0.83rem' },
        minHeight: { xs: 44, sm: 40 },
        px: { xs: 2.2, sm: 2.4 },
        textTransform: activeSystemConfig?.buttonStyle?.textTransform || 'none',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2) !important',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.75,
        '& .MuiSvgIcon-root, & .MuiButton-startIcon, & .MuiButton-startIcon > *:first-of-type': {
          color: '#FFFFFF !important',
          fontSize: '1.15rem !important'
        },
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.22) !important',
          borderColor: 'rgba(255, 255, 255, 0.6) !important',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3) !important',
          transform: 'translateY(-1px)',
          '& .MuiSvgIcon-root, & .MuiButton-startIcon, & .MuiButton-startIcon > *:first-of-type': {
            color: '#FFFFFF !important'
          }
        },
        '&:active': {
          transform: 'scale(0.98)',
          bgcolor: 'rgba(255, 255, 255, 0.28) !important'
        },
        '&:focus-visible': {
          outline: '2px solid rgba(255, 255, 255, 0.8)',
          outlineOffset: 2
        }
      };
    }

    // Light Banner (e.g. Google Material 3 Light or Apple Liquid Light)
    const primaryMain = theme.palette.primary.main;
    const textPrimary = theme.palette.text.primary || '#0F172A';

    return {
      bgcolor: 'rgba(255, 255, 255, 0.85) !important',
      color: `${textPrimary} !important`,
      border: `1px solid ${primaryMain}30 !important`,
      borderRadius: `${radius}px !important`,
      fontWeight: 600,
      fontSize: { xs: '0.82rem', sm: '0.83rem' },
      minHeight: { xs: 44, sm: 40 },
      px: { xs: 2.2, sm: 2.4 },
      textTransform: activeSystemConfig?.buttonStyle?.textTransform || 'none',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05) !important',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.75,
      '& .MuiSvgIcon-root, & .MuiButton-startIcon, & .MuiButton-startIcon > *:first-of-type': {
        color: `${primaryMain} !important`,
        fontSize: '1.15rem !important'
      },
      '&:hover': {
        bgcolor: '#FFFFFF !important',
        borderColor: `${primaryMain} !important`,
        color: `${theme.palette.primary.dark || primaryMain} !important`,
        boxShadow: `0 4px 14px ${primaryMain}22 !important`,
        transform: 'translateY(-1px)',
        '& .MuiSvgIcon-root, & .MuiButton-startIcon, & .MuiButton-startIcon > *:first-of-type': {
          color: `${theme.palette.primary.dark || primaryMain} !important`
        }
      },
      '&:active': {
        transform: 'scale(0.98)'
      },
      '&:focus-visible': {
        outline: `2px solid ${primaryMain}`,
        outlineOffset: 2
      }
    };
  };

  const [dateRange, setDateRange] = useState('7days');
  const [drawerModalOpen, setDrawerModalOpen] = useState(false);

  // Live bespoke tailoring orders from localStorage
  const [tailoringOrders, setTailoringOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('aleen_tailoring_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('aleen_tailoring_orders');
        if (saved) setTailoringOrders(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  // Filtered dataset according to timeframe
  const getFilteredData = () => {
    const invList = invoices || [];
    const purList = purchases || [];
    const expList = expenses || [];

    if (dateRange === 'all') {
      return {
        filteredInvoices: invList,
        filteredPurchases: purList,
        filteredExpenses: expList
      };
    }

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (dateRange === '7days') {
      startDate.setDate(today.getDate() - 7);
    } else if (dateRange === '30days') {
      startDate.setDate(today.getDate() - 30);
    } else if (dateRange === 'thisMonth') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      return {
        filteredInvoices: invList,
        filteredPurchases: purList,
        filteredExpenses: expList
      };
    }

    const fInvoices = invList.filter(inv => inv.date && new Date(inv.date) >= startDate);
    const fPurchases = purList.filter(p => p.date && new Date(p.date) >= startDate);
    const fExpenses = expList.filter(e => e.date && new Date(e.date) >= startDate);
    return { filteredInvoices: fInvoices, filteredPurchases: fPurchases, filteredExpenses: fExpenses };
  };

  const { filteredInvoices = [], filteredPurchases = [], filteredExpenses = [] } = getFilteredData();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const todaySales = invoices
    .filter(inv => new Date(inv.date).toDateString() === today.toDateString())
    .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

  const yesterdaySales = invoices
    .filter(inv => new Date(inv.date).toDateString() === yesterday)
    .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

  const salesTrend = yesterdaySales === 0 ? 100 : Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);

  // Dynamic Sales Title & Subtitle based on active timeframe
  const salesKpiInfo = useMemo(() => {
    switch (dateRange) {
      case '7days':
        return { title: '7 Days Revenue', subtitle: 'Past 7 days collections' };
      case '30days':
        return { title: '30 Days Revenue', subtitle: 'Past 30 days collections' };
      case 'thisMonth':
        return { title: 'Month Revenue', subtitle: 'This calendar month' };
      case 'all':
        return { title: 'All-Time Revenue', subtitle: 'Lifetime registered revenue' };
      default:
        return { title: "Today's Revenue", subtitle: 'vs yesterday' };
    }
  }, [dateRange]);

  const lowStockItemsList = getLowStockItems ? getLowStockItems() : [];
  const lowStockCount = lowStockItemsList.length;
  const recentInvoices = invoices.slice(-5).reverse();

  // Financial Calculations
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalPurchasesCost = filteredPurchases.reduce((sum, p) => sum + p.total, 0);
  const totalPaidPurchases = filteredPurchases.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const netCash = totalRevenue - totalPaidPurchases;

  const totalCostOfGoods = filteredInvoices.reduce((sum, inv) => {
    return sum + (inv.items?.reduce((itemSum, item) => {
      const invItem = inventory.find(i => i.id === item.id);
      return itemSum + ((invItem?.cost || 0) * item.quantity);
    }, 0) || 0);
  }, 0);

  const grossProfit = totalRevenue - totalCostOfGoods;
  const totalItems = inventory.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalInventoryValue = inventory.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.cost) || 0), 0);
  const atv = filteredInvoices.length > 0 ? (totalRevenue / filteredInvoices.length) : 0;

  // Tailoring / Bespoke Atelier Order Stats
  const activeTailoringJobs = tailoringOrders.filter(o => o.status !== 'delivered');
  const urgentFittingsToday = tailoringOrders.filter(o => {
    if (!o.trialDate && !o.deliveryDate) return false;
    const targetDate = new Date(o.trialDate || o.deliveryDate).toDateString();
    return targetDate === today.toDateString();
  });

  // Top Products Calculation
  const productSales = {};
  filteredInvoices.forEach(inv => {
    inv.items?.forEach(item => {
      const key = item.id || item.name;
      productSales[key] = (productSales[key] || 0) + item.quantity;
    });
  });

  const top5ProductsData = Object.entries(productSales)
    .map(([id, qty]) => {
      const product = inventory.find(p => p.id === id);
      return { name: product?.name || 'Garment Item', quantity: qty, price: product?.price || 0 };
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const topProductsChartData = {
    labels: top5ProductsData.map(p => p.name),
    datasets: [{
      label: 'Pieces Sold',
      data: top5ProductsData.map(p => p.quantity),
      backgroundColor: getThemeChartPalette(theme, top5ProductsData.length),
      borderRadius: activeSystemConfig?.shape?.borderRadius || 6,
      barThickness: 24,
    }]
  };

  // Financial Trends Data (Daily/Monthly)
  const getTrendData = () => {
    const isAll = dateRange === 'all';
    const salesMap = {};
    const expMap = {};

    filteredInvoices.forEach(inv => {
      if (!inv.date) return;
      const dateObj = new Date(inv.date);
      if (isNaN(dateObj.getTime())) return;
      const key = isAll 
        ? dateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      salesMap[key] = (salesMap[key] || 0) + (Number(inv.total) || 0);
    });

    filteredExpenses.forEach(exp => {
      if (!exp.date) return;
      const dateObj = new Date(exp.date);
      if (isNaN(dateObj.getTime())) return;
      const key = isAll 
        ? dateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      expMap[key] = (expMap[key] || 0) + (Number(exp.amount) || 0);
    });

    const rawKeys = [...new Set([...Object.keys(salesMap), ...Object.keys(expMap)])];
    const sortedKeys = rawKeys.sort((a, b) => new Date(a) - new Date(b));
    const finalLabels = sortedKeys.length > 0 ? sortedKeys : ['Today'];

    return {
      labels: finalLabels,
      sales: finalLabels.map(k => salesMap[k] || 0),
      expenses: finalLabels.map(k => expMap[k] || 0)
    };
  };

  const trend = getTrendData();

  const salesChartData = {
    labels: trend.labels,
    datasets: [
      {
        label: 'Gross Sales (Revenue)',
        data: trend.sales,
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}1F`,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: isDark ? '#0F172A' : '#FFFFFF',
        pointRadius: 4,
        borderWidth: 2.5
      },
      {
        label: 'Store Operating Expenses',
        data: trend.expenses,
        borderColor: theme.palette.secondary?.main || '#D97706',
        backgroundColor: `${theme.palette.secondary?.main || '#D97706'}14`,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: theme.palette.secondary?.main || '#D97706',
        pointBorderColor: isDark ? '#0F172A' : '#FFFFFF',
        pointRadius: 4,
        borderWidth: 2
      }
    ]
  };

  const stockData = {
    labels: ['Critical (≤1)', 'Optimal (2-50)', 'Surplus (>50)'],
    datasets: [{
      data: [
        inventory.filter(i => (Number(i.quantity) || 0) <= 1).length,
        inventory.filter(i => (Number(i.quantity) || 0) > 1 && (Number(i.quantity) || 0) < 50).length,
        inventory.filter(i => (Number(i.quantity) || 0) >= 50).length
      ],
      backgroundColor: [
        theme.palette.error.main,
        theme.palette.primary.main,
        theme.palette.success.main
      ],
      borderWidth: 2,
      borderColor: isDark ? '#1E293B' : '#FFFFFF'
    }]
  };

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.92)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        borderWidth: 1,
        padding: 12,
        titleFont: { family: theme.typography?.fontFamily || "'Plus Jakarta Sans', sans-serif", size: 13, weight: '700' },
        bodyFont: { family: theme.typography?.fontFamily || "'Plus Jakarta Sans', sans-serif", size: 12 },
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: theme.typography?.fontFamily || "'Plus Jakarta Sans', sans-serif", size: 11 }, color: theme.palette.text.secondary || '#94A3B8' }
      },
      y: {
        grid: { borderDash: [4, 4], color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.06)', drawBorder: false },
        ticks: { font: { family: theme.typography?.fontFamily || "'Plus Jakarta Sans', sans-serif", size: 11 }, color: theme.palette.text.secondary || '#94A3B8' }
      }
    }
  };

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
      {/* ============================================================== */}
      {/* 1. ECOSYSTEM EXECUTIVE COMMAND BANNER                          */}
      {/* ============================================================== */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 3.5,
          borderRadius: sysBanner.radius,
          background: sysBanner.bg,
          color: sysBanner.textColor,
          border: `1.5px solid ${sysBanner.borderColor}`,
          boxShadow: sysBanner.shadow,
          backdropFilter: sysBanner.backdropFilter || 'none',
          WebkitBackdropFilter: sysBanner.backdropFilter || 'none',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8, flexWrap: 'wrap' }}>
              <Chip
                label={sysBanner.badge}
                size="small"
                sx={{
                  bgcolor: sysBanner.badgeBg,
                  color: sysBanner.badgeColor,
                  fontWeight: 900,
                  fontSize: '0.66rem',
                  letterSpacing: '0.1em',
                  border: `1px solid ${sysBanner.borderColor}`,
                  height: 22,
                  borderRadius: `${activeSystemConfig?.shape?.buttonRadius || 6}px`
                }}
              />
              <Typography variant="caption" sx={{ color: sysBanner.subtextColor, fontWeight: 600 }}>
                {profile.businessName || 'Aleen Clothing'} • CRM Studio
              </Typography>
            </Box>

            <Typography
              variant="h3"
              sx={{
                fontFamily: 'inherit',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                color: sysBanner.textColor
              }}
            >
              {sysBanner.title}
            </Typography>

            <Typography variant="body2" sx={{ color: sysBanner.subtextColor, mt: 0.8, maxWidth: 650, fontSize: '0.86rem' }}>
              Welcome back, <strong>{user?.name || user?.email?.split('@')[0] || 'Store Stylist'}</strong>. Live pulse of retail billing, custom bridal tailoring, and garment inventory.
            </Typography>
          </Box>

          {/* Quick Action Navigation Dock */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 1.25 }}
            sx={{
              width: { xs: '100%', md: 'auto' },
              alignSelf: { xs: 'stretch', md: 'center' },
              flexWrap: 'wrap',
              mt: { xs: 1.5, md: 0 }
            }}
          >
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: '1.2rem !important' }} />}
              onClick={() => navigate('/invoices?action=new', { state: { openNewBill: true } })}
              sx={{
                ...getBannerPrimaryBtnStyle(),
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              New Bill
            </Button>
            <Button
              variant="contained"
              startIcon={<PointOfSale sx={{ fontSize: '1.15rem !important' }} />}
              onClick={() => setDrawerModalOpen(true)}
              sx={{
                ...getBannerSecondaryBtnStyle(),
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Shift & Z-Report
            </Button>
            <Button
              variant="contained"
              startIcon={<Straighten sx={{ fontSize: '1.15rem !important' }} />}
              onClick={() => navigate('/tailoring')}
              sx={{
                ...getBannerSecondaryBtnStyle(),
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Tailoring Board
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* ============================================================== */}
      {/* 2. TIMEFRAME SELECTOR FILTER BAR                               */}
      {/* ============================================================== */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.78rem' }}>
          Atelier Financial Metrics ({dateRange === '7days' ? 'Last 7 Days' : dateRange === '30days' ? 'Last 30 Days' : dateRange === 'thisMonth' ? 'This Month' : 'All-Time'})
        </Typography>

        <GlassCard sx={{ p: 0.4, borderRadius: `${activeSystemConfig?.shape?.buttonRadius || 8}px`, display: 'flex', gap: 0.5 }}>
          {[
            { id: '7days', label: '7 Days' },
            { id: '30days', label: '30 Days' },
            { id: 'thisMonth', label: 'Month' },
            { id: 'all', label: 'All' }
          ].map((item) => (
            <Button
              key={item.id}
              onClick={() => setDateRange(item.id)}
              variant={dateRange === item.id ? 'contained' : 'text'}
              size="small"
              sx={{
                px: 2,
                py: 0.4,
                borderRadius: `${activeSystemConfig?.shape?.buttonRadius || 8}px`,
                fontSize: '0.76rem',
                fontWeight: 800,
                bgcolor: dateRange === item.id ? theme.palette.primary.main : 'transparent',
                color: dateRange === item.id ? (theme.palette.primary.contrastText || '#FFFFFF') : 'text.secondary',
                '&:hover': {
                  bgcolor: dateRange === item.id ? theme.palette.primary.dark : 'action.hover'
                }
              }}
            >
              {item.label}
            </Button>
          ))}
        </GlassCard>
      </Box>

      {/* ============================================================== */}
      {/* 3. EDITORIAL KPI METRICS GRID: Responsive 2x2 Grid on Mobile   */}
      {/* ============================================================== */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
        {/* Sales Revenue */}
        <Grid item xs={6} sm={6} lg={3}>
          <AtelierKpiCard
            title={salesKpiInfo.title}
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            icon={<AttachMoney fontSize="small" />}
            trend={dateRange === '7days' || dateRange === 'today' ? (salesTrend !== undefined ? `${Math.abs(salesTrend)}%` : null) : null}
            trendPositive={salesTrend >= 0}
            goldAccent={true}
            onClick={() => navigate('/sales-reports')}
            subtitle={salesKpiInfo.subtitle}
          />
        </Grid>

        {/* Total Stock Units */}
        <Grid item xs={6} sm={6} lg={3}>
          <AtelierKpiCard
            title="Garment Inventory Stock"
            value={`${totalItems.toLocaleString('en-IN')} pcs`}
            icon={<Inventory2 fontSize="small" />}
            sapphireAccent={true}
            onClick={() => navigate('/inventory')}
            subtitle="Available boutique pieces"
          />
        </Grid>

        {/* Low Stock Warning */}
        <Grid item xs={6} sm={6} lg={3}>
          <AtelierKpiCard
            title="Low Stock Reorders"
            value={lowStockCount}
            icon={<Warning fontSize="small" />}
            trend={lowStockCount > 0 ? `${lowStockCount} items low` : 'Stock Healthy'}
            trendPositive={lowStockCount === 0}
            redAccent={lowStockCount > 0}
            onClick={() => navigate('/inventory')}
            subtitle="Below threshold alert"
          />
        </Grid>

        {/* Average Transaction Value (ATV) */}
        <Grid item xs={6} sm={6} lg={3}>
          <AtelierKpiCard
            title="Avg Ticket Value (ATV)"
            value={`₹${atv.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            icon={<ShoppingCart fontSize="small" />}
            onClick={() => navigate('/sales-reports')}
            subtitle={`${filteredInvoices.length} invoices registered`}
          />
        </Grid>

        {/* Admin Exclusive Financial Ledger KPIs */}
        {user?.role === 'admin' && (
          <>
            <Grid item xs={6} sm={6} lg={3}>
              <AtelierKpiCard
                title="Gross Trading Profit"
                value={`₹${grossProfit.toLocaleString('en-IN')}`}
                icon={<Assessment fontSize="small" />}
                goldAccent={true}
                onClick={() => navigate('/profit-loss')}
                subtitle="Revenue minus garment cost"
              />
            </Grid>

            <Grid item xs={6} sm={6} lg={3}>
              <AtelierKpiCard
                title="Net Cash Position"
                value={`₹${netCash.toLocaleString('en-IN')}`}
                icon={<TrendingUp fontSize="small" />}
                sapphireAccent={true}
                onClick={() => navigate('/profit-loss')}
                subtitle="Sales minus vendor payouts"
              />
            </Grid>

            <Grid item xs={6} sm={6} lg={3}>
              <AtelierKpiCard
                title="Inventory Capital"
                value={`₹${totalInventoryValue.toLocaleString('en-IN')}`}
                icon={<AccountBalanceWallet fontSize="small" />}
                onClick={() => navigate('/inventory')}
                subtitle="Cost basis asset valuation"
              />
            </Grid>

            <Grid item xs={6} sm={6} lg={3}>
              <AtelierKpiCard
                title="Vendor Procurement"
                value={`₹${totalPurchasesCost.toLocaleString('en-IN')}`}
                icon={<Receipt fontSize="small" />}
                redAccent={true}
                onClick={() => navigate('/purchases')}
                subtitle="Mill & fabric purchases"
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* ============================================================== */}
      {/* 4. WORKSHOP PULSE & FITTINGS DUE TODAY                         */}
      {/* ============================================================== */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3.5,
          borderRadius: 3,
          border: '1.5px solid #CBD5E1',
          bgcolor: isDark ? 'rgba(15, 118, 110, 0.06)' : '#FFFFFF'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Straighten sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                Bespoke Atelier Workshop Pulse
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Active custom tailoring jobs, fittings, and patron deliveries
              </Typography>
            </Box>
          </Box>
          <Button
            size="small"
            variant="outlined"
            endIcon={<ArrowForward />}
            onClick={() => navigate('/tailoring')}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.78rem',
              borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
              borderColor: 'primary.main',
              color: 'primary.main'
            }}
          >
            Open Tailoring Board ({activeTailoringJobs.length} Active)
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
                Active Garments on Board
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.5 }}>
                {activeTailoringJobs.length} Orders
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                In cutting, stitching & trials
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: urgentFittingsToday.length > 0 ? 'rgba(217, 119, 6, 0.08)' : (isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC'),
                border: '1px solid',
                borderColor: urgentFittingsToday.length > 0 ? '#D97706' : '#E2E8F0'
              }}
            >
              <Typography variant="caption" sx={{ color: urgentFittingsToday.length > 0 ? '#B45309' : 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
                Trials & Deliveries Due Today
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: urgentFittingsToday.length > 0 ? '#D97706' : '#0F172A', mt: 0.5 }}>
                {urgentFittingsToday.length} Fittings
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                {urgentFittingsToday.length > 0 ? 'Urgent patron appointments' : 'No urgent trials pending today'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
                Register Cash Status
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#10B981', mt: 0.5 }}>
                Active & Balanced
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Shift ready for Day-End Z-Report
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ============================================================== */}
      {/* 5. CHARTS ROW: REVENUE TRENDS & STOCK HEALTH                   */}
      {/* ============================================================== */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        {/* Left: Financial Performance Trajectory */}
        <Grid item xs={12} md={7} lg={8}>
          <GlassCard sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Financial Trajectory & Inflow</Typography>
                <Typography variant="caption" color="text.secondary">Gross Sales vs Operating Cash Expenses</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Circle sx={{ fontSize: 10, color: 'primary.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Gross Sales</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Circle sx={{ fontSize: 10, color: 'secondary.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Expenses</Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ height: 320 }}>
              <Line data={salesChartData} options={commonChartOptions} />
            </Box>
          </GlassCard>
        </Grid>

        {/* Right: Garment Stock Distribution */}
        <Grid item xs={12} md={5} lg={4}>
          <GlassCard sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>Garment Inventory Health</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 3 }}>Distribution by inventory tier</Typography>

            <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut
                data={stockData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '72%',
                  plugins: { legend: { display: false } }
                }}
              />
              <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main' }}>{totalItems}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Total Pieces</Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              {stockData.labels.map((label, i) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <Circle sx={{ fontSize: 9, color: stockData.datasets[0].backgroundColor[i] }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem' }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* ============================================================== */}
      {/* 6. BOTTOM ROW: TOP GARMENTS & RECENT CHECKOUT STREAM          */}
      {/* ============================================================== */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Left: Top Products Bar Chart */}
        <Grid item xs={12} md={7} lg={7}>
          <GlassCard sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Top Couture & Garment Silhouettes</Typography>
                <Typography variant="caption" color="text.secondary">Best-selling pieces by units sold</Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/sales-reports')}
                sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.76rem', color: 'primary.main' }}
              >
                Full Analytics
              </Button>
            </Box>
            <Box sx={{ height: 280 }}>
              <Bar data={topProductsChartData} options={{ ...commonChartOptions, indexAxis: 'y' }} />
            </Box>
          </GlassCard>
        </Grid>

        {/* Right: Live Checkout Stream */}
        <Grid item xs={12} md={5} lg={5}>
          <GlassCard sx={{ p: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Recent Patron Checkouts</Typography>
              <Button
                size="small"
                onClick={() => navigate('/invoices')}
                sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.76rem', color: 'primary.main' }}
              >
                All Invoices
              </Button>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {recentInvoices.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No invoices issued yet.</Typography>
                </Box>
              ) : (
                recentInvoices.map((inv, index) => (
                  <Box
                    key={inv.id}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      borderBottom: index !== recentInvoices.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      transition: 'background 0.2s',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => navigate('/invoices')}
                  >
                    <Avatar sx={{ bgcolor: (t) => `${t.palette.primary.main}18`, color: 'primary.main', borderRadius: (t) => `${t.shape?.borderRadius || 8}px`, width: 38, height: 38 }}>
                      <Receipt sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.82rem' }} noWrap>
                        {inv.customer || 'Walk-in Patron'} • #{inv.invoiceNumber || inv.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.72rem' }}>
                        {inv.date ? new Date(inv.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Recent'} • {inv.items?.length || 1} pieces • <span style={{ color: 'var(--emerald-primary)', fontWeight: 700 }}>{inv.paymentMethod || 'Cash'}</span>
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.main', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      ₹{Number(inv.total || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Cash Drawer Shift Modal */}
      <CashDrawerShiftModal
        open={drawerModalOpen}
        onClose={() => setDrawerModalOpen(false)}
      />
    </Box>
  );
};

export default Dashboard;
