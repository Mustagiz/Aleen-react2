import React from 'react';
import { Grid, Typography, Box, CardContent, Button, Chip, IconButton, useTheme, Avatar } from '@mui/material';
import { TrendingUp, TrendingDown, Inventory2, Warning, AttachMoney, Receipt, Assessment, ArrowForward, MoreVert, Circle, People, ShoppingCart, AccountBalanceWallet } from '@mui/icons-material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DateRange, CalendarMonth, History, ViewWeek } from '@mui/icons-material';
import GlassCard from '../components/GlassCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  // ... logic remains same ...
  const { user } = useAuth();
  const { inventory, invoices, purchases, vendors, expenses, getLowStockItems } = useData();
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

  const lowStockItemsList = getLowStockItems ? getLowStockItems() : [];
  const lowStockCount = lowStockItemsList.length;
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
    <GlassCard
      onClick={onClick}
      sx={{
        height: '100%',
        p: 0,
        '&:hover': onClick ? {
          transform: 'translateY(-8px)',
          boxShadow: `0 20px 40px -8px ${color}35`,
        } : {},
        // Enhanced indicator
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          background: `linear-gradient(180deg, ${color} 0%, ${color}80 100%)`,
        }
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{
            p: 1.5,
            borderRadius: 3,
            bgcolor: color + '15',
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {React.cloneElement(icon, { sx: { fontSize: 28 } })}
          </Box>
          {trend !== undefined && (
            <Chip
              icon={trend >= 0 ? <TrendingUp sx={{ fontSize: '14px !important' }} /> : <TrendingDown sx={{ fontSize: '14px !important' }} />}
              label={`${Math.abs(trend)}%`}
              size="small"
              sx={{
                height: 24,
                bgcolor: trend >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: trend >= 0 ? '#10B981' : '#EF4444',
                fontWeight: 700,
                borderRadius: 1.5,
              }}
            />
          )}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5, letterSpacing: '-0.02em' }}>
          {value}
        </Typography>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </GlassCard>
  );

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 3 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', mb: 1, letterSpacing: '-0.04em' }}>
            Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500, opacity: 0.8 }}>
            Overview of your business performance.
          </Typography>
        </Box>

        <GlassCard sx={{ p: 0.75, borderRadius: 5, display: 'flex', gap: 1 }}>
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
              sx={{
                px: 3,
                py: 1,
                borderRadius: 4,
                boxShadow: dateRange === item.id ? theme.shadows[2] : 'none',
              }}
            >
              {item.label}
            </Button>
          ))}
        </GlassCard>
      </Box>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {/* StatCards use the updated component below */}
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
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} lg={8}>
            <GlassCard sx={{ p: 4, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Revenue vs Expenses</Typography>
                  <Typography variant="body2" color="text.secondary">Financial performance tracking</Typography>
                </Box>
                <IconButton size="small"><MoreVert /></IconButton>
              </Box>
              <Box sx={{ height: 350 }}>
                <Line data={salesChartData} options={{ ...commonChartOptions, maintainAspectRatio: false }} />
              </Box>
            </GlassCard>
          </Grid>
          <Grid item xs={12} lg={4}>
            <GlassCard sx={{
              p: 4,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Inventory Health</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Distribution by stock level</Typography>
              <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut data={stockData} options={{
                  responsive: true,
                  cutout: '75%',
                  plugins: { legend: { display: false } }
                }} />
                <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>{totalItems}</Typography>
                  <Typography variant="caption" color="text.secondary">Total Items</Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 3 }}>
                {stockData.labels.map((label, i) => (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Circle sx={{ fontSize: 10, color: stockData.datasets[0].backgroundColor[i] }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>{label}</Typography>
                  </Box>
                ))}
              </Box>
            </GlassCard>
          </Grid>
        </Grid>
      )}

      {user?.role !== 'admin' && (
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12}>
            <GlassCard sx={{
              p: 4,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Inventory Health</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Distribution by stock level</Typography>
              <Box sx={{ height: 300, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut data={stockData} options={{
                  responsive: true,
                  cutout: '75%',
                  plugins: { legend: { display: false } }
                }} />
                <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>{totalItems}</Typography>
                  <Typography variant="caption" color="text.secondary">Total Items</Typography>
                </Box>
              </Box>
            </GlassCard>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={7}>
          <GlassCard sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Top Products</Typography>
                <Typography variant="body2" color="text.secondary">Best selling items by quantity</Typography>
              </Box>
              <Button endIcon={<ArrowForward />} onClick={() => navigate('/sales-reports')}>Full Report</Button>
            </Box>
            <Bar data={topProductsChartData} options={{ ...commonChartOptions, indexAxis: 'y' }} />
          </GlassCard>
        </Grid>
        <Grid item xs={12} lg={5}>
          <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Recent Activity</Typography>
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
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 2 }}>
                    <Receipt fontSize="small" />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Invoice #{inv.id}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(inv.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {inv.items?.length || 0} items
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'primary.main' }}>
                    ₹{inv.total.toLocaleString('en-IN')}
                  </Typography>
                </Box>
              ))}
            </Box>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
