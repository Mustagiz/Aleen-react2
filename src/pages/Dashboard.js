import React, { useState, useMemo, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Button,
  IconButton,
  useTheme,
  Stack,
  Menu,
  MenuItem
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
  Add,
  ExpandMore,
  Check
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
import ChartRangeSelect, { CHART_RANGE_OPTIONS } from '../components/crm/ChartRangeSelect';
import CashDrawerShiftModal from '../components/crm/CashDrawerShiftModal';
import { useThemeContext } from '../contexts/ThemeContext';
import { getThemeChartPalette, getChartMotion, getDoughnutMotion } from '../utils/chartTheme';

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
  const { activeSystemConfig } = useThemeContext();
  const isDark = theme.palette.mode === 'dark';

  const buttonRadius = activeSystemConfig?.shape?.buttonRadius || 12;
  const cardRadius = activeSystemConfig?.shape?.cardRadius || 14;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const [dateRange, setDateRange] = useState('7days');
  const [drawerModalOpen, setDrawerModalOpen] = useState(false);

  // Horizon-style customizable KPI row: which metric fills each of the 6 slots
  const DEFAULT_KPI_SLOTS = ['revenue', 'stock', 'lowStock', 'atv', 'grossProfit', 'netCash'];
  const [kpiSlots, setKpiSlots] = useState(() => {
    try {
      const saved = localStorage.getItem('aleen_dashboard_kpi_slots');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length === 6) return arr;
      }
    } catch (e) {}
    return DEFAULT_KPI_SLOTS;
  });
  const [kpiMenu, setKpiMenu] = useState(null); // { index, anchorEl } of the open slot dropdown

  useEffect(() => {
    try { localStorage.setItem('aleen_dashboard_kpi_slots', JSON.stringify(kpiSlots)); } catch (e) {}
  }, [kpiSlots]);

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
    ...getChartMotion(),
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

  const rangeLabel = dateRange === '7days' ? 'Last 7 days' : dateRange === '30days' ? 'Last 30 days' : dateRange === 'thisMonth' ? 'This month' : 'All time';

  const greetingBtnSx = {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.75rem',
    borderRadius: `${buttonRadius}px`,
    minHeight: { xs: 36, sm: 32 },
    px: 1.5,
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    '&:hover': { transform: 'translateY(-1px)' },
    '&:active': { transform: 'scale(0.98)' }
  };

  // Horizon KPI slot registry: every metric that can fill a slot
  const kpiMetrics = [
    {
      id: 'revenue',
      title: salesKpiInfo.title,
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: <AttachMoney fontSize="small" />,
      trend: dateRange === '7days' || dateRange === 'today' ? (salesTrend !== undefined ? `${Math.abs(salesTrend)}%` : null) : null,
      trendPositive: salesTrend >= 0,
      goldAccent: true,
      subtitle: salesKpiInfo.subtitle,
      onClick: () => navigate('/sales-reports')
    },
    {
      id: 'stock',
      title: 'Garment Inventory Stock',
      value: `${totalItems.toLocaleString('en-IN')} pcs`,
      icon: <Inventory2 fontSize="small" />,
      sapphireAccent: true,
      subtitle: 'Available boutique pieces',
      onClick: () => navigate('/inventory')
    },
    {
      id: 'lowStock',
      title: 'Low Stock Reorders',
      value: lowStockCount,
      icon: <Warning fontSize="small" />,
      trend: lowStockCount > 0 ? `${lowStockCount} items low` : 'Stock Healthy',
      trendPositive: lowStockCount === 0,
      redAccent: lowStockCount > 0,
      subtitle: 'Below threshold alert',
      onClick: () => navigate('/inventory')
    },
    {
      id: 'atv',
      title: 'Avg Ticket Value (ATV)',
      value: `₹${atv.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: <ShoppingCart fontSize="small" />,
      subtitle: `${filteredInvoices.length} invoices registered`,
      onClick: () => navigate('/sales-reports')
    },
    {
      id: 'grossProfit',
      title: 'Gross Trading Profit',
      value: `₹${grossProfit.toLocaleString('en-IN')}`,
      icon: <Assessment fontSize="small" />,
      goldAccent: true,
      subtitle: 'Revenue minus garment cost',
      adminOnly: true,
      onClick: () => navigate('/profit-loss')
    },
    {
      id: 'netCash',
      title: 'Net Cash Position',
      value: `₹${netCash.toLocaleString('en-IN')}`,
      icon: <TrendingUp fontSize="small" />,
      sapphireAccent: true,
      subtitle: 'Sales minus vendor payouts',
      adminOnly: true,
      onClick: () => navigate('/profit-loss')
    },
    {
      id: 'inventoryCapital',
      title: 'Inventory Capital',
      value: `₹${totalInventoryValue.toLocaleString('en-IN')}`,
      icon: <AccountBalanceWallet fontSize="small" />,
      subtitle: 'Cost basis asset valuation',
      adminOnly: true,
      onClick: () => navigate('/inventory')
    },
    {
      id: 'vendorProcurement',
      title: 'Vendor Procurement',
      value: `₹${totalPurchasesCost.toLocaleString('en-IN')}`,
      icon: <Receipt fontSize="small" />,
      redAccent: true,
      subtitle: 'Mill & fabric purchases',
      adminOnly: true,
      onClick: () => navigate('/purchases')
    }
  ];

  // Resolve saved slot ids to role-visible metrics (admin sees all 8, staff the 4 public ones)
  const availableKpiMetrics = kpiMetrics.filter(m => !m.adminOnly || user?.role === 'admin');
  const kpiSlotCount = Math.min(6, availableKpiMetrics.length);
  const usedKpiIds = new Set();
  const effectiveKpiSlots = [];
  for (let i = 0; i < kpiSlotCount; i++) {
    const metric = availableKpiMetrics.find(m => m.id === kpiSlots[i] && !usedKpiIds.has(m.id))
      || availableKpiMetrics.find(m => !usedKpiIds.has(m.id))
      || availableKpiMetrics[0];
    usedKpiIds.add(metric.id);
    effectiveKpiSlots.push(metric);
  }

  const handleKpiSelect = (slotIndex, metricId) => {
    if (kpiSlots[slotIndex] === metricId) {
      setKpiMenu(null);
      return;
    }
    setKpiSlots(prev => {
      const next = [...prev];
      const otherIndex = next.indexOf(metricId);
      if (otherIndex !== -1) next[otherIndex] = prev[slotIndex];
      next[slotIndex] = metricId;
      return next;
    });
    setKpiMenu(null);
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* ============================================================== */}
      {/* 1. HORIZON-STYLE PAGE HEADER                                    */}
      {/* ============================================================== */}
      <Box sx={{ mb: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'flex-end' }, justifyContent: 'space-between', gap: { xs: 1.5, md: 1 } }}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'inherit',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              lineHeight: 1.25,
              fontSize: { xs: '1.1rem', sm: '1.18rem', md: '1.28rem' }
            }}
          >
            {greeting}, {user?.name || user?.email?.split('@')[0] || 'Store Stylist'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.3, display: 'block', fontSize: '0.74rem' }}>
            Here's what's happening at Aleen today.
          </Typography>
        </Box>

        {/* Quick Action Navigation Dock */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 1 }}
          sx={{
            width: { xs: '100%', md: 'auto' },
            alignSelf: { xs: 'stretch', md: 'center' },
            flexWrap: 'wrap',
            mt: { xs: 0.5, md: 0 }
          }}
        >
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              alignSelf: 'center',
              px: 1.3,
              py: 0.35,
              mr: 0.5,
              borderRadius: '999px',
              border: '1px solid #EFEFF4',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
              color: 'text.secondary',
              fontSize: '0.7rem',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            {todayLabel}
          </Box>
          <Button
            variant="contained"
            startIcon={<Add sx={{ fontSize: '1.1rem !important' }} />}
            onClick={() => navigate('/invoices?action=new', { state: { openNewBill: true } })}
            sx={{
              ...greetingBtnSx,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: '0 1px 2px rgba(124, 111, 232, 0.3)',
              '&:hover': { ...greetingBtnSx['&:hover'], bgcolor: 'primary.dark' },
              '&:active': { transform: 'scale(0.98)' },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            New Bill
          </Button>
          <Button
            variant="outlined"
            startIcon={<PointOfSale sx={{ fontSize: '1.1rem !important' }} />}
            onClick={() => setDrawerModalOpen(true)}
            sx={{
              ...greetingBtnSx,
              bgcolor: isDark ? 'transparent' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#EFEFF4',
              color: 'text.secondary',
              '&:hover': { ...greetingBtnSx['&:hover'], borderColor: 'primary.main', color: 'primary.main', bgcolor: isDark ? 'transparent' : '#FFFFFF' },
              '&:active': { transform: 'scale(0.98)' },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Shift & Z-Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<Straighten sx={{ fontSize: '1.1rem !important' }} />}
            onClick={() => navigate('/tailoring')}
            sx={{
              ...greetingBtnSx,
              bgcolor: isDark ? 'transparent' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#EFEFF4',
              color: 'text.secondary',
              '&:hover': { ...greetingBtnSx['&:hover'], borderColor: 'primary.main', color: 'primary.main', bgcolor: isDark ? 'transparent' : '#FFFFFF' },
              '&:active': { transform: 'scale(0.98)' },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Tailoring Board
          </Button>
        </Stack>
      </Box>

      {/* ============================================================== */}
      {/* 2. FINANCIAL OVERVIEW LABEL (range set per chart card)          */}
      {/* ============================================================== */}
      <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Typography sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.78rem' }}>
          Financial overview · {rangeLabel}
        </Typography>
      </Box>

      {/* ============================================================== */}
      {/* 3. KPI METRICS ROW: 6 Horizon mini-stat slots, each with a     */}
      {/*    dropdown to swap in any metric                              */}
      {/* ============================================================== */}
      <Grid container spacing={{ xs: 1.5, sm: 1.75, md: 2 }} sx={{ mb: 2 }}>
        {effectiveKpiSlots.map((metric, i) => (
          <Grid item xs={6} sm={6} md={4} lg={12 / kpiSlotCount} key={metric.id}>
            <AtelierKpiCard
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              subtitle={metric.subtitle}
              trend={metric.trend}
              trendPositive={metric.trendPositive}
              goldAccent={metric.goldAccent}
              redAccent={metric.redAccent}
              sapphireAccent={metric.sapphireAccent}
              onClick={metric.onClick}
              headerAction={
                <IconButton
                  size="small"
                  aria-label={`Change metric ${i + 1}`}
                  onClick={(e) => { e.stopPropagation(); setKpiMenu({ index: i, anchorEl: e.currentTarget }); }}
                  sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
                >
                  <ExpandMore sx={{ fontSize: 15 }} />
                </IconButton>
              }
            />
          </Grid>
        ))}
      </Grid>

      {/* KPI slot metric picker dropdown */}
      <Menu
        anchorEl={kpiMenu?.anchorEl || null}
        open={Boolean(kpiMenu)}
        onClose={() => setKpiMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 0.5,
            minWidth: 236,
            maxHeight: 344,
            borderRadius: `${cardRadius}px`,
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#EFEFF4'}`,
            boxShadow: isDark ? '0 12px 32px rgba(0, 0, 0, 0.55)' : '0 12px 32px -8px rgba(31, 27, 46, 0.16)',
            backgroundImage: 'none',
            bgcolor: isDark ? '#1D1A2E' : '#FFFFFF',
            '& .MuiList-root': { py: 0.75 }
          }
        }}
      >
        <MenuItem disabled sx={{ opacity: '1 !important', fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary', py: 0.5 }}>
          Select metric
        </MenuItem>
        {availableKpiMetrics.map(m => {
          const isSelected = kpiMenu !== null && effectiveKpiSlots[kpiMenu.index]?.id === m.id;
          return (
            <MenuItem
              key={m.id}
              dense
              selected={isSelected}
              onClick={() => handleKpiSelect(kpiMenu.index, m.id)}
              sx={{ fontSize: '0.8rem', fontWeight: 600, gap: 1.1, py: 0.75, borderRadius: '8px', mx: 0.5, my: 0.1 }}
            >
              <Box sx={{ color: isSelected ? 'primary.main' : 'text.secondary', display: 'inline-flex', '& svg': { fontSize: '1.05rem' } }}>{m.icon}</Box>
              {m.title}
              {isSelected && <Check sx={{ ml: 'auto', fontSize: '1rem !important', color: 'primary.main' }} />}
            </MenuItem>
          );
        })}
      </Menu>

      {/* ============================================================== */}
      {/* 4. WORKSHOP PULSE & FITTINGS DUE TODAY                         */}
      {/* ============================================================== */}
      <GlassCard sx={{ p: 1.75, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isDark ? 'rgba(124, 111, 232, 0.16)' : '#F1EFFC',
                color: isDark ? '#9B8FF5' : '#5B4BD1',
                flexShrink: 0
              }}
            >
              <Straighten sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                Workshop pulse
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Active custom tailoring jobs, fittings, and patron deliveries
              </Typography>
            </Box>
          </Box>
          <Button
            size="small"
            variant="outlined"
            endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/tailoring')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.78rem',
              borderRadius: `${buttonRadius}px`,
              borderColor: isDark ? 'rgba(155, 143, 245, 0.4)' : '#7C6FE8',
              color: isDark ? '#9B8FF5' : '#5B4BD1',
              bgcolor: isDark ? 'transparent' : '#FFFFFF',
              '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: isDark ? 'transparent' : '#FFFFFF' }
            }}
          >
            Open Tailoring Board ({activeTailoringJobs.length} Active)
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F9F9FC', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#EFEFF4'}` }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Active garments on board
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
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
                p: 1.5,
                borderRadius: '12px',
                bgcolor: urgentFittingsToday.length > 0 ? 'rgba(217, 119, 6, 0.08)' : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#F9F9FC'),
                border: '1px solid',
                borderColor: urgentFittingsToday.length > 0 ? '#D97706' : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#EFEFF4')
              }}
            >
              <Typography variant="caption" sx={{ color: urgentFittingsToday.length > 0 ? '#B45309' : 'text.secondary', fontWeight: 600 }}>
                Trials & deliveries due today
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: urgentFittingsToday.length > 0 ? '#D97706' : 'text.primary', mt: 0.5 }}>
                {urgentFittingsToday.length} Fittings
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                {urgentFittingsToday.length > 0 ? 'Urgent patron appointments' : 'No urgent trials pending today'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F9F9FC', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#EFEFF4'}` }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Register cash status
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#10B981', mt: 0.5 }}>
                Active & Balanced
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Shift ready for Day-End Z-Report
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </GlassCard>

      {/* ============================================================== */}
      {/* 5. CHARTS ROW: REVENUE TRENDS & STOCK HEALTH                   */}
      {/* ============================================================== */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Left: Revenue Overview */}
        <Grid item xs={12} md={7} lg={8}>
          <GlassCard sx={{ p: 2.25, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Revenue overview</Typography>
                <Typography variant="caption" color="text.secondary">Gross sales vs operating cash expenses</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Circle sx={{ fontSize: 10, color: 'primary.main' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Gross Sales</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Circle sx={{ fontSize: 10, color: 'secondary.main' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Expenses</Typography>
                  </Box>
                </Box>
                <ChartRangeSelect
                  value={dateRange}
                  onChange={setDateRange}
                  options={CHART_RANGE_OPTIONS}
                />
              </Box>
            </Box>
            <Box sx={{ height: 230 }}>
              <Line data={salesChartData} options={commonChartOptions} />
            </Box>
          </GlassCard>
        </Grid>

        {/* Right: Garment Stock Distribution */}
        <Grid item xs={12} md={5} lg={4}>
          <GlassCard sx={{ p: 2.25, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Inventory health</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>Distribution by inventory tier</Typography>

            <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut
                data={stockData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '72%',
                  ...getDoughnutMotion(),
                  plugins: { legend: { display: false } }
                }}
              />
              <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>{totalItems}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Total Pieces</Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              {stockData.labels.map((label, i) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <Circle sx={{ fontSize: 9, color: stockData.datasets[0].backgroundColor[i] }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.72rem' }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* ============================================================== */}
      {/* 6. BOTTOM ROW: TOP PRODUCTS & LATEST ORDERS                    */}
      {/* ============================================================== */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {/* Left: Top Products Bar Chart */}
        <Grid item xs={12} md={7} lg={7}>
          <GlassCard sx={{ p: 2.25, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Top products</Typography>
                <Typography variant="caption" color="text.secondary">Best-selling pieces by units sold</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ChartRangeSelect
                  value={dateRange}
                  onChange={setDateRange}
                  options={CHART_RANGE_OPTIONS}
                />
                <Button
                  size="small"
                  endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                  onClick={() => navigate('/sales-reports')}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.76rem', color: 'primary.main' }}
                >
                  Full Analytics
                </Button>
              </Box>
            </Box>
            <Box sx={{ height: 210 }}>
              <Bar data={topProductsChartData} options={{ ...commonChartOptions, indexAxis: 'y' }} />
            </Box>
          </GlassCard>
        </Grid>

        {/* Right: Latest Orders Table */}
        <Grid item xs={12} md={5} lg={5}>
          <GlassCard sx={{ p: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>Latest orders</Typography>
              <Button
                size="small"
                onClick={() => navigate('/invoices')}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.76rem', color: 'primary.main' }}
              >
                View all
              </Button>
            </Box>

            {recentInvoices.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No invoices issued yet.</Typography>
              </Box>
            ) : (
              <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <Box
                  sx={{
                    px: 2,
                    py: 0.75,
                    display: 'grid',
                    gridTemplateColumns: { xs: '44px 1fr auto', sm: '44px 1.1fr 1.3fr 44px 88px 74px' },
                    gap: 1,
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9F9FC'
                  }}
                >
                  {['#', 'Date', 'Customer', 'Items', 'Total', 'Payment'].map((col, i) => (
                    <Typography
                      key={col}
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: 'text.secondary',
                        fontSize: '0.68rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        display: { xs: i === 0 || i === 2 || i === 4 ? 'block' : 'none', sm: 'block' }
                      }}
                    >
                      {col}
                    </Typography>
                  ))}
                </Box>

                {recentInvoices.map((inv, index) => (
                  <Box
                    key={inv.id}
                    sx={{
                      px: 2,
                      py: 0.9,
                      display: 'grid',
                      gridTemplateColumns: { xs: '44px 1fr auto', sm: '44px 1.1fr 1.3fr 44px 88px 74px' },
                      gap: 1,
                      alignItems: 'center',
                      borderBottom: index !== recentInvoices.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      transition: 'background 0.2s',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => navigate('/invoices')}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                      #{inv.invoiceNumber || inv.id}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem', display: { xs: 'none', sm: 'block' } }} noWrap>
                      {inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'} · {inv.date ? new Date(inv.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem' }} noWrap>
                      {inv.customer || 'Walk-in Patron'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums', display: { xs: 'none', sm: 'block' } }}>
                      {inv.items?.length || 1}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem' }}>
                      ₹{Number(inv.total || 0).toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--emerald-primary)', display: { xs: 'none', sm: 'block' } }} noWrap>
                      {inv.paymentMethod || 'Cash'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
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
