import React from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, Button, Chip, IconButton, useTheme, Avatar } from '@mui/material';
import { TrendingUp, TrendingDown, Inventory2, Warning, AttachMoney, Receipt, Assessment, ArrowForward, MoreVert, Circle, People, ShoppingCart, AccountBalanceWallet } from '@mui/icons-material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DateRange, CalendarMonth, History, ViewWeek } from '@mui/icons-material';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const { user } = useAuth();
  const { inventory, invoices, purchases, vendors, expenses } = useData();
  const navigate = useNavigate();
  const theme = useTheme();
  const [dateRange, setDateRange] = React.useState('7days');

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const getFilteredData = () => {
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (dateRange === '7days') {
      startDate.setDate(today.getDate() - 7);
    } else if (dateRange === '30days') {
      startDate.setDate(today.getDate() - 30);
    } else if (dateRange === 'thisMonth') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      return { filteredInvoices: invoices, filteredPurchases: purchases };
    }

    const fInvoices = invoices.filter(inv => new Date(inv.date) >= startDate);
    const fPurchases = purchases.filter(p => new Date(p.date) >= startDate);
    const fExpenses = (expenses || []).filter(e => new Date(e.date) >= startDate);
    return { filteredInvoices: fInvoices, filteredPurchases: fPurchases, filteredExpenses: fExpenses };
  };

  const { filteredInvoices, filteredPurchases, filteredExpenses } = getFilteredData();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const todaySales = invoices.filter(inv => new Date(inv.date).toDateString() === today.toDateString())
    .reduce((sum, inv) => sum + inv.total, 0);

  const yesterdaySales = invoices.filter(inv => new Date(inv.date).toDateString() === yesterday)
    .reduce((sum, inv) => sum + inv.total, 0);

  const salesTrend = yesterdaySales === 0 ? 100 : Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);

  const lowStock = inventory.filter(item => item.quantity <= 1);
  const recentInvoices = invoices.slice(-6).reverse();

  // Financial Calculations
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalPurchasesCost = filteredPurchases.reduce((sum, p) => sum + p.total, 0);
  const totalPaidPurchases = filteredPurchases.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

  // Net Cash = Sales (Cash In) - Vendor Payments (Cash Out)
  const netCash = totalRevenue - totalPaidPurchases;

  // Outstanding Vendor Payments (Global, not just filtered)
  const totalVendorPayables = vendors.reduce((sum, v) => sum + (v.balance || 0), 0);

  const totalCostOfGoods = filteredInvoices.reduce((sum, inv) => {
    return sum + (inv.items?.reduce((itemSum, item) => {
      const invItem = inventory.find(i => i.id === item.id);
      return itemSum + ((invItem?.cost || 0) * item.quantity);
    }, 0) || 0);
  }, 0);

  const grossProfit = totalRevenue - totalCostOfGoods;
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);

  const lowStockCount = inventory.filter(item => item.quantity <= 1).length;
  const totalInventoryValue = inventory.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.cost) || 0), 0);
  const atv = filteredInvoices.length > 0 ? (totalRevenue / filteredInvoices.length) : 0;

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
      return { name: product?.name || 'Unknown', quantity: qty, price: product?.price || 0 };
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const topProductsChartData = {
    labels: top5ProductsData.map(p => p.name),
    datasets: [{
      label: 'Units Sold',
      data: top5ProductsData.map(p => p.quantity),
      backgroundColor: '#d97706', // Warm Amber
      borderRadius: 8,
      barThickness: 30,
    }]
  };

  const getDateLabels = () => {
    if (dateRange === '7days') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      });
    } else if (dateRange === '30days') {
      return Array.from({ length: 4 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (21 - i * 7));
        return `Week ${i + 1} `;
      });
    } else {
      return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    }
  };

  const labels = getDateLabels();

  const getSalesData = () => {
    if (dateRange === '7days') {
      return labels.map(dayText => {
        return filteredInvoices
          .filter(inv => {
            const invDate = new Date(inv.date);
            return invDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) === dayText;
          })
          .reduce((sum, inv) => sum + inv.total, 0);
      });
    } else {
      const weekStarts = Array.from({ length: 4 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (28 - i * 7));
        return d;
      });
      return weekStarts.map((start, i) => {
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        return filteredInvoices
          .filter(inv => {
            const d = new Date(inv.date);
            return d >= start && d < end;
          })
          .reduce((sum, inv) => sum + inv.total, 0);
      });
    }
  };

  const salesByPeriod = getSalesData();

  // Financial Trends Data (Daily/Monthly)
  const getTrendData = () => {
    const dailySales = {};
    const dailyExpenses = {};

    filteredInvoices.forEach(inv => {
      const d = new Date(inv.date).toLocaleDateString();
      dailySales[d] = (dailySales[d] || 0) + inv.total;
    });

    filteredExpenses.forEach(exp => {
      const d = new Date(exp.date).toLocaleDateString();
      dailyExpenses[d] = (dailyExpenses[d] || 0) + exp.amount;
    });

    // Merge dates and sort
    const allDates = [...new Set([...Object.keys(dailySales), ...Object.keys(dailyExpenses)])]
      .sort((a, b) => new Date(a) - new Date(b));

    return {
      labels: allDates,
      sales: allDates.map(d => dailySales[d] || 0),
      expenses: allDates.map(d => dailyExpenses[d] || 0)
    };
  };

  const trend = getTrendData();

  const salesChartData = {
    labels: trend.labels,
    datasets: [
      {
        label: 'Revenue',
        data: trend.sales,
        borderColor: '#E11D48',
        backgroundColor: 'rgba(225, 29, 72, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Expenses',
        data: trend.expenses,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const categorySales = filteredInvoices.reduce((acc, inv) => {
    inv.items?.forEach(item => {
      const category = item.category || 'General';
      acc[category] = (acc[category] || 0) + (item.price * item.quantity);
    });
    return acc;
  }, {});

  const categoryChartData = {
    labels: Object.keys(categorySales),
    datasets: [{
      label: 'Revenue by Category',
      data: Object.values(categorySales),
      backgroundColor: ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#78350f', '#92400e'],
      borderWidth: 0,
    }]
  };

  const stockData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [{
      data: [
        inventory.filter(i => i.quantity <= 1).length,
        inventory.filter(i => i.quantity > 1 && i.quantity < 50).length,
        inventory.filter(i => i.quantity >= 50).length
      ],
      backgroundColor: ['#e53935', '#fb8c00', '#43a047'],
      borderWidth: 0,
    }]
  };

  const commonChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: { family: "'Inter', sans-serif", size: 14 },
        bodyFont: { family: "'Inter', sans-serif", size: 13 },
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "'Inter', sans-serif" }, color: '#9ca3af' }
      },
      y: {
        grid: { borderDash: [4, 4], color: '#f3f4f6', drawBorder: false },
        ticks: { font: { family: "'Inter', sans-serif" }, color: '#9ca3af' }
      }
    }
  };

  const StatCard = ({ title, value, icon, color, trend, onClick, subtitle }) => (
    <Card
      onClick={onClick}
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 4,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: color + '25',
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${color}08 100%)`,
        boxShadow: `0 4px 20px -4px ${color}20, 0 0 0 1px ${color}10`,
        backdropFilter: 'blur(10px)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '5px',
          height: '100%',
          background: `linear-gradient(180deg, ${color} 0%, ${color}80 100%)`,
          boxShadow: `2px 0 8px ${color}40`
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`,
          pointerEvents: 'none'
        },
        '&:hover': onClick ? {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: `0 20px 40px -8px ${color}35, 0 0 0 1px ${color}30`,
          borderColor: color + '50',
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${color}12 100%)`,
        } : {
          boxShadow: `0 8px 24px -6px ${color}25`,
        }
      }}
    >
      <CardContent sx={{ p: 2, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{
            p: 1.2,
            borderRadius: 2.5,
            bgcolor: color + '12',
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 8px ${color}15, inset 0 1px 0 ${color}25`,
            border: `1px solid ${color}15`
          }}>
            {React.cloneElement(icon, { sx: { fontSize: 24, filter: `drop-shadow(0 1px 2px ${color}30)` } })}
          </Box>
          {trend !== undefined && (
            <Chip
              icon={trend >= 0 ? <TrendingUp sx={{ fontSize: '12px !important' }} /> : <TrendingDown sx={{ fontSize: '12px !important' }} />}
              label={`${Math.abs(trend)}%`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                bgcolor: trend >= 0 ? 'rgba(67, 160, 71, 0.1)' : 'rgba(229, 57, 53, 0.1)',
                color: trend >= 0 ? 'success.main' : 'error.main',
                fontWeight: 700,
                borderRadius: 1.5,
                border: trend >= 0 ? '1px solid rgba(67, 160, 71, 0.15)' : '1px solid rgba(229, 57, 53, 0.15)'
              }}
            />
          )}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.2, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.02em', textTransform: 'uppercase', opacity: 0.8 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2, opacity: 0.6, fontSize: '0.65rem' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ mb: 5, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, letterSpacing: '-0.03em' }}>Dashboard</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>Overview of your business performance.</Typography>
        </Box>

        <Box sx={{
          display: 'flex',
          bgcolor: 'background.paper',
          p: 0.75,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
          {[
            { id: '7days', label: '7 Days' },
            { id: '30days', label: '30 Days' },
            { id: 'thisMonth', label: 'Month' },
            { id: 'all', label: 'All' }
          ].map((item) => (
            <Button
              key={item.id}
              onClick={() => setDateRange(item.id)}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: dateRange === item.id ? 'white' : 'text.secondary',
                bgcolor: dateRange === item.id ? 'primary.main' : 'transparent',
                '&:hover': {
                  bgcolor: dateRange === item.id ? 'primary.dark' : 'rgba(0,0,0,0.04)'
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Today's Sales" value={`₹${todaySales.toLocaleString('en-IN')}`} icon={<AttachMoney />} color="#E11D48" trend={salesTrend} onClick={() => navigate('/sales-reports')} />
        </Grid>
        {user?.role === 'admin' && (
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard title="Total Purchases" value={`₹${totalPurchasesCost.toLocaleString('en-IN')}`} icon={<Receipt />} color="#1976d2" onClick={() => navigate('/purchases')} />
          </Grid>
        )}
        {user?.role === 'admin' && (
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard title="Net Cash Available" value={`₹${netCash.toLocaleString('en-IN')}`} icon={<TrendingUp />} color="#059669" onClick={() => navigate('/profit-loss')} />
          </Grid>
        )}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Stock" value={totalItems.toLocaleString('en-IN')} icon={<Inventory2 />} color="#D97706" onClick={() => navigate('/inventory')} />
        </Grid>

        {/* Row 2 */}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Low Stock Items" value={lowStockCount} icon={<Warning />} color="#EA580C" onClick={() => navigate('/inventory')} subtitle="Items below threshold" />
        </Grid>
        {user?.role === 'admin' && (
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard title="Gross Profit" value={`₹${grossProfit.toLocaleString('en-IN')}`} icon={<Assessment />} color="#7C3AED" onClick={() => navigate('/profit-loss')} />
          </Grid>
        )}
        {user?.role === 'admin' && (
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard title="Total Inventory Value" value={`₹${totalInventoryValue.toLocaleString('en-IN')}`} icon={<AccountBalanceWallet />} color="#DB2777" onClick={() => navigate('/inventory')} />
          </Grid>
        )}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Avg Transaction" value={`₹${atv.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<ShoppingCart />} color="#0891B2" onClick={() => navigate('/sales-reports')} />
        </Grid>
      </Grid>

      {user?.role === 'admin' && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{
              p: 4,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Revenue vs Expenses</Typography>
                  <Typography variant="body2" color="text.secondary">Financial performance tracking</Typography>
                </Box>
                <IconButton size="small"><MoreVert /></IconButton>
              </Box>
              <Box sx={{ height: 350 }}>
                <Line data={salesChartData} options={{ ...commonChartOptions, maintainAspectRatio: false }} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{
              p: 4,
              borderRadius: 4,
              border: '1px solid rgba(217, 119, 6, 0.1)',
              boxShadow: '0 15px 35px -10px rgba(217, 119, 6, 0.15)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Inventory Health</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Distribution by stock level</Typography>
              <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut data={stockData} options={{
                  responsive: true,
                  cutout: '75%',
                  plugins: { legend: { display: false } }
                }} />
                <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{totalItems}</Typography>
                  <Typography variant="caption" color="text.secondary">Total Items</Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 3 }}>
                {stockData.labels.map((label, i) => (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Circle sx={{ fontSize: 10, color: stockData.datasets[0].backgroundColor[i] }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{label}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {user?.role !== 'admin' && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{
              p: 4,
              borderRadius: 4,
              border: '1px solid rgba(217, 119, 6, 0.1)',
              boxShadow: '0 15px 35px -10px rgba(217, 119, 6, 0.15)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Inventory Health</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Distribution by stock level</Typography>
              <Box sx={{ height: 300, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut data={stockData} options={{
                  responsive: true,
                  cutout: '75%',
                  plugins: { legend: { display: false } }
                }} />
                <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{totalItems}</Typography>
                  <Typography variant="caption" color="text.secondary">Total Items</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={7}>
          <Paper elevation={0} sx={{
            p: 4,
            borderRadius: 4,
            border: '1px solid rgba(217, 119, 6, 0.1)',
            boxShadow: '0 15px 35px -10px rgba(217, 119, 6, 0.15)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Top Products</Typography>
                <Typography variant="body2" color="text.secondary">Best selling items by quantity</Typography>
              </Box>
              <Button endIcon={<ArrowForward />} onClick={() => navigate('/sales-reports')}>Full Report</Button>
            </Box>
            <Bar data={topProductsChartData} options={{ ...commonChartOptions, indexAxis: 'y' }} />
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Paper elevation={0} sx={{
            p: 0,
            borderRadius: 4,
            border: '1px solid rgba(217, 119, 6, 0.1)',
            boxShadow: '0 15px 35px -10px rgba(217, 119, 6, 0.15)',
            overflow: 'hidden'
          }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Activity</Typography>
            </Box>
            <Box sx={{ p: 0 }}>
              {recentInvoices.map((inv, index) => (
                <Box key={inv.id} sx={{
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  borderBottom: index !== recentInvoices.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: 'action.hover' }
                }}>
                  <Avatar sx={{ bgcolor: 'rgba(217, 119, 6, 0.1)', color: '#d97706', borderRadius: 2 }}>
                    <Receipt fontSize="small" />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Invoice #{inv.id}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(inv.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {inv.items?.length || 0} items
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#d97706' }}>
                    ₹{inv.total.toLocaleString('en-IN')}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
