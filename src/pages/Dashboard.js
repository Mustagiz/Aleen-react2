import React, { useState, useMemo, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Button,
  IconButton,
  useTheme,
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
  ExpandMore,
  Check
} from '../components/icons';
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
import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import ChartRangeSelect, { CHART_RANGE_OPTIONS } from '../components/crm/ChartRangeSelect';
import CashDrawerShiftModal from '../components/crm/CashDrawerShiftModal';
import { useThemeContext } from '../contexts/ThemeContext';
import { getThemeChartPalette, getChartMotion, getDoughnutMotion, getLineChartMotion, getBarChartMotion } from '../utils/chartTheme';

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
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

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

  // Chart animation key: forces a fresh entrance animation on page load/reload and range change
  const [chartKey, setChartKey] = useState(0);
  const [hoveredStockSegment, setHoveredStockSegment] = useState(null);
  const [activeRevenueSeries, setActiveRevenueSeries] = useState({ sales: true, expenses: true });
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [dateRange]);

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
      productSales[key] = (productSales[key] || 0) + (Number(item.quantity) || 1);
    });
  });

  let top5ProductsData = Object.entries(productSales)
    .map(([id, qty]) => {
      const product = inventory.find(p => p.id === id || p.name === id);
      return {
        name: product?.name || id || 'Garment Item',
        quantity: qty,
        price: product?.price || 0,
        revenue: qty * (product?.price || 0)
      };
    })
    .sort((a, b) => b.quantity - a.quantity);

  // If fewer than 5 products sold in this period, supplement with top catalog pieces
  if (top5ProductsData.length < 5 && inventory.length > 0) {
    const existingNames = new Set(top5ProductsData.map(p => p.name));
    const catalogFillers = inventory
      .filter(p => !existingNames.has(p.name))
      .slice(0, 5 - top5ProductsData.length)
      .map(p => ({
        name: p.name,
        quantity: 0,
        price: p.price || 0,
        revenue: 0,
        isCatalog: true
      }));
    top5ProductsData = [...top5ProductsData, ...catalogFillers];
  }
  top5ProductsData = top5ProductsData.slice(0, 5);

  const topProductsChartData = {
    labels: top5ProductsData.map(p => p.name),
    datasets: [{
      label: 'Pieces Sold',
      data: top5ProductsData.map(p => p.quantity),
      backgroundColor: [
        '#080F1C',
        '#4F46E5',
        '#059669',
        '#D97706',
        '#DC2626'
      ].slice(0, top5ProductsData.length),
      hoverBackgroundColor: [
        '#1E293B',
        '#6366F1',
        '#10B981',
        '#F59E0B',
        '#EF4444'
      ].slice(0, top5ProductsData.length),
      hoverBorderColor: isDark ? '#FFFFFF' : '#080F1C',
      hoverBorderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
      barThickness: 22,
      maxBarThickness: 28
    }]
  };

  // Financial Trends Data (Daily/Monthly with full chronological timeline)
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

    let finalLabels = [];
    if (dateRange === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        finalLabels.push(d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
      }
    } else if (dateRange === '30days') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        finalLabels.push(d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
      }
    } else if (dateRange === 'thisMonth') {
      const currentDay = today.getDate();
      for (let day = 1; day <= currentDay; day++) {
        const d = new Date(today.getFullYear(), today.getMonth(), day);
        finalLabels.push(d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
      }
    } else {
      const rawKeys = [...new Set([...Object.keys(salesMap), ...Object.keys(expMap)])];
      finalLabels = rawKeys.sort((a, b) => new Date(a) - new Date(b));
      if (finalLabels.length === 0) finalLabels = ['Today'];
    }

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
      activeRevenueSeries.sales && {
        label: 'Gross Sales (Revenue)',
        data: trend.sales,
        borderColor: isDark ? '#818CF8' : '#080F1C',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return isDark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(8, 15, 28, 0.15)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, isDark ? 'rgba(129, 140, 248, 0.42)' : 'rgba(8, 15, 28, 0.22)');
          gradient.addColorStop(0.7, isDark ? 'rgba(129, 140, 248, 0.08)' : 'rgba(8, 15, 28, 0.05)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: isDark ? '#818CF8' : '#080F1C',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#FFFFFF',
        pointHoverBorderColor: isDark ? '#818CF8' : '#080F1C',
        pointHoverBorderWidth: 3.5,
        pointHitRadius: 25,
        borderWidth: 2.8
      },
      activeRevenueSeries.expenses && {
        label: 'Store Operating Expenses',
        data: trend.expenses,
        borderColor: '#D97706',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(217, 119, 6, 0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(217, 119, 6, 0.35)');
          gradient.addColorStop(0.7, 'rgba(217, 119, 6, 0.06)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#D97706',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#FFFFFF',
        pointHoverBorderColor: '#D97706',
        pointHoverBorderWidth: 3.5,
        pointHitRadius: 25,
        borderWidth: 2.2
      }
    ].filter(Boolean)
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
        '#C33A4D',
        '#080F1C',
        '#2A875B'
      ],
      hoverBackgroundColor: [
        '#E11D48',
        '#1E293B',
        '#10B981'
      ],
      borderWidth: 2,
      borderColor: isDark ? '#1E293B' : '#FFFFFF',
      hoverBorderColor: isDark ? '#080F1C' : '#FFFFFF',
      hoverBorderWidth: 3,
      hoverOffset: 16,
      borderRadius: 6,
      spacing: 3
    }]
  };

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    ...getChartMotion(),
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? 'rgba(8, 15, 28, 0.96)' : 'rgba(8, 15, 28, 0.94)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        titleFont: { family: theme.typography?.fontFamily || "'DM Sans', sans-serif", size: 12, weight: '700' },
        bodyFont: { family: theme.typography?.fontFamily || "'DM Sans', sans-serif", size: 12 },
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: theme.typography?.fontFamily || "'DM Sans', sans-serif", size: 11 }, color: theme.palette.text.secondary || '#94A3B8' }
      },
      y: {
        grid: { borderDash: [4, 4], color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.06)', drawBorder: false },
        ticks: { font: { family: theme.typography?.fontFamily || "'DM Sans', sans-serif", size: 11 }, color: theme.palette.text.secondary || '#94A3B8' }
      }
    }
  };

  const lineChartOptions = {
    ...commonChartOptions,
    ...getLineChartMotion(),
    interaction: {
      mode: 'index',
      intersect: false
    },
    hover: {
      mode: 'nearest',
      intersect: false
    },
    plugins: {
      ...commonChartOptions.plugins,
      tooltip: {
        ...commonChartOptions.plugins.tooltip,
        displayColors: true,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const val = context.parsed.y || 0;
            return ` ${context.dataset.label}: ₹${val.toLocaleString('en-IN')}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxTicksLimit: 7,
          maxRotation: 0,
          autoSkip: true,
          font: { family: theme.typography?.fontFamily || "'DM Sans', sans-serif", size: 11 },
          color: theme.palette.text.secondary || '#94A3B8'
        }
      },
      y: {
        grid: { borderDash: [4, 4], color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.06)', drawBorder: false },
        ticks: {
          font: { family: theme.typography?.fontFamily || "'DM Sans', sans-serif", size: 11 },
          color: theme.palette.text.secondary || '#94A3B8',
          callback: (value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : value}`
        }
      }
    }
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    ...getDoughnutMotion(),
    onHover: (event, activeElements) => {
      if (activeElements && activeElements.length > 0) {
        setHoveredStockSegment(activeElements[0].index);
      } else {
        setHoveredStockSegment(null);
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...commonChartOptions.plugins.tooltip,
        displayColors: true,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const val = context.parsed || 0;
            const pct = totalItems > 0 ? Math.round((val / totalItems) * 100) : 0;
            return ` ${context.label}: ${val} pieces (${pct}%)`;
          }
        }
      }
    }
  };

  const barChartOptions = {
    ...commonChartOptions,
    ...getBarChartMotion(),
    indexAxis: 'y',
    interaction: {
      mode: 'nearest',
      intersect: true
    },
    plugins: {
      ...commonChartOptions.plugins,
      tooltip: {
        ...commonChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            const p = top5ProductsData[context.dataIndex];
            const qty = context.parsed.x || 0;
            if (p?.isCatalog) {
              return ` In Stock Catalog (₹${(p.price || 0).toLocaleString('en-IN')})`;
            }
            return [
              ` Units Sold: ${qty} pcs`,
              p?.revenue ? ` Gross Revenue: ₹${p.revenue.toLocaleString('en-IN')}` : null
            ].filter(Boolean);
          }
        }
      }
    },
    scales: {
      x: {
        grid: { borderDash: [4, 4], color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.06)', drawBorder: false },
        ticks: {
          precision: 0,
          font: { family: theme.typography?.fontFamily || "'DM Sans', sans-serif", size: 11 },
          color: theme.palette.text.secondary || '#94A3B8'
        }
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { family: theme.typography?.fontFamily || "'DM Sans', sans-serif", size: 11 },
          color: theme.palette.text.secondary || '#94A3B8'
        }
      }
    }
  };

  const rangeLabel = dateRange === '7days' ? 'Last 7 days' : dateRange === '30days' ? 'Last 30 days' : dateRange === 'thisMonth' ? 'This month' : 'All time';

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
              fontSize: { xs: '1.1rem', sm: '1.18rem', md: '1.28rem' },
              textTransform: 'capitalize'
            }}
          >
            {greeting}, {(user?.name || user?.email?.split('@')[0] || 'Store Stylist')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.3, display: 'block', fontSize: '0.74rem' }}>
            Here's what's happening at Aleen today.
          </Typography>
        </Box>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Revenue overview</Typography>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: '9999px',
                      bgcolor: isDark ? 'rgba(129, 140, 248, 0.12)' : 'rgba(8, 15, 28, 0.06)',
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(129, 140, 248, 0.25)' : 'rgba(8, 15, 28, 0.1)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: isDark ? '#818CF8' : '#080F1C'
                    }}
                  >
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">Gross sales vs operating cash expenses</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {/* Interactive toggle for Gross Sales */}
                  <Box
                    onClick={() => setActiveRevenueSeries(prev => ({ ...prev, sales: !prev.sales }))}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.2,
                      py: 0.4,
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: activeRevenueSeries.sales ? (isDark ? '#818CF8' : '#080F1C') : 'transparent',
                      bgcolor: activeRevenueSeries.sales ? (isDark ? 'rgba(129, 140, 248, 0.1)' : 'rgba(8, 15, 28, 0.05)') : 'transparent',
                      opacity: activeRevenueSeries.sales ? 1 : 0.45,
                      transition: 'all 0.15s ease',
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <Circle sx={{ fontSize: 9, color: isDark ? '#818CF8' : '#080F1C' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.74rem' }}>Gross Sales</Typography>
                  </Box>
                  {/* Interactive toggle for Expenses */}
                  <Box
                    onClick={() => setActiveRevenueSeries(prev => ({ ...prev, expenses: !prev.expenses }))}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.2,
                      py: 0.4,
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: activeRevenueSeries.expenses ? '#D97706' : 'transparent',
                      bgcolor: activeRevenueSeries.expenses ? 'rgba(217, 119, 6, 0.1)' : 'transparent',
                      opacity: activeRevenueSeries.expenses ? 1 : 0.45,
                      transition: 'all 0.15s ease',
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <Circle sx={{ fontSize: 9, color: '#D97706' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.74rem' }}>Expenses</Typography>
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
              <Line key={`rev-${dateRange}-${chartKey}`} data={salesChartData} options={lineChartOptions} />
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
                key={`stock-${chartKey}`}
                data={stockData}
                options={doughnutChartOptions}
              />
              <motion.div
                key={`stock-cnt-${chartKey}-${hoveredStockSegment !== null ? hoveredStockSegment : totalItems}`}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none', maxWidth: 140 }}
              >
                {hoveredStockSegment !== null ? (
                  <>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        color: stockData.datasets[0].backgroundColor[hoveredStockSegment],
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1
                      }}
                    >
                      {stockData.datasets[0].data[hoveredStockSegment]}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block', fontSize: '0.72rem', mt: 0.25 }}>
                      {stockData.labels[hoveredStockSegment]}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.66rem' }}>
                      {totalItems > 0 ? `${Math.round((stockData.datasets[0].data[hoveredStockSegment] / totalItems) * 100)}% of total` : ''}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '-0.02em' }}>
                      {totalItems}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Total Pieces
                    </Typography>
                  </>
                )}
              </motion.div>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              {stockData.labels.map((label, i) => (
                <Box
                  key={label}
                  onMouseEnter={() => setHoveredStockSegment(i)}
                  onMouseLeave={() => setHoveredStockSegment(null)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.7,
                    px: 1,
                    py: 0.35,
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    bgcolor: hoveredStockSegment === i ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Circle sx={{ fontSize: 9, color: stockData.datasets[0].backgroundColor[i] }} />
                  <Typography variant="caption" sx={{ fontWeight: hoveredStockSegment === i ? 800 : 600, color: 'text.secondary', fontSize: '0.72rem' }}>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Top products</Typography>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: '9999px',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(8, 15, 28, 0.06)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'text.secondary'
                    }}
                  >
                    {top5ProductsData.reduce((acc, p) => acc + (p.quantity || 0), 0)} Pieces Sold
                  </Box>
                </Box>
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
              <Bar key={`top-${dateRange}-${chartKey}`} data={topProductsChartData} options={barChartOptions} />
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
              <Box sx={{ flexGrow: 1, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Box sx={{ minWidth: { xs: 340, sm: 480 } }}>
                  {/* Table Header */}
                  <Box
                    sx={{
                      px: { xs: 1.5, sm: 2 },
                      py: 1,
                      display: 'grid',
                      gridTemplateColumns: { xs: '110px 1.2fr 85px', sm: '115px 95px 1.2fr 44px 90px 70px' },
                      gap: 1.5,
                      alignItems: 'center',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9F9FC'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      # Order
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: { xs: 'none', sm: 'block' } }}>
                      Date
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Customer
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', display: { xs: 'none', sm: 'block' } }}>
                      Items
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>
                      Total
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                      Payment
                    </Typography>
                  </Box>

                  {/* Table Rows */}
                  {recentInvoices.map((inv, index) => (
                    <Box
                      key={inv.id}
                      sx={{
                        px: { xs: 1.5, sm: 2 },
                        py: 1.1,
                        display: 'grid',
                        gridTemplateColumns: { xs: '110px 1.2fr 85px', sm: '115px 95px 1.2fr 44px 90px 70px' },
                        gap: 1.5,
                        alignItems: 'center',
                        borderBottom: index !== recentInvoices.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        transition: 'background 0.18s ease',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(8, 15, 28, 0.03)' }
                      }}
                      onClick={() => navigate('/invoices')}
                    >
                      {/* 1. Order ID & mobile timestamp */}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            color: 'text.primary',
                            fontVariantNumeric: 'tabular-nums',
                            letterSpacing: '-0.02em',
                            fontSize: '0.76rem',
                            display: 'block'
                          }}
                          noWrap
                        >
                          #{inv.invoiceNumber || inv.id}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.65rem',
                            display: { xs: 'block', sm: 'none' }
                          }}
                          noWrap
                        >
                          {inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                        </Typography>
                      </Box>

                      {/* 2. Date & Time (tablet / iPad / desktop) */}
                      <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.74rem', display: 'block' }} noWrap>
                          {inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.66rem', display: 'block' }} noWrap>
                          {inv.date ? new Date(inv.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </Typography>
                      </Box>

                      {/* 3. Customer Name */}
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          color: 'text.primary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        noWrap
                      >
                        {inv.customer || 'Walk-in Patron'}
                      </Typography>

                      {/* 4. Item Count */}
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 600,
                          textAlign: 'center',
                          fontVariantNumeric: 'tabular-nums',
                          fontSize: '0.76rem',
                          display: { xs: 'none', sm: 'block' }
                        }}
                      >
                        {inv.items?.length || 1}
                      </Typography>

                      {/* 5. Total Amount */}
                      <Box sx={{ textAlign: 'right', minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 800,
                            color: 'text.primary',
                            fontVariantNumeric: 'tabular-nums',
                            fontSize: '0.82rem'
                          }}
                          noWrap
                        >
                          ₹{Number(inv.total || 0).toLocaleString('en-IN')}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            color: 'success.main',
                            display: { xs: 'block', sm: 'none' },
                            textTransform: 'uppercase'
                          }}
                          noWrap
                        >
                          {inv.paymentMethod || 'Cash'}
                        </Typography>
                      </Box>

                      {/* 6. Payment Method Badge */}
                      <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'success.main',
                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                            px: 1,
                            py: 0.3,
                            borderRadius: '6px',
                            display: 'inline-block'
                          }}
                          noWrap
                        >
                          {inv.paymentMethod || 'Cash'}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
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
