import React from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, Button, Chip } from '@mui/material';
import { TrendingUp, TrendingDown, Inventory2, Warning, AttachMoney, Receipt, Assessment, ArrowForward } from '@mui/icons-material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { DateRange, CalendarMonth, History, ViewWeek } from '@mui/icons-material';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const { inventory, invoices } = useData();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = React.useState('7days');

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const getFilteredInvoices = () => {
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (dateRange === '7days') {
      startDate.setDate(today.getDate() - 7);
    } else if (dateRange === '30days') {
      startDate.setDate(today.getDate() - 30);
    } else if (dateRange === 'thisMonth') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      return invoices; // 'all'
    }
    return invoices.filter(inv => new Date(inv.date) >= startDate);
  };

  const filteredInvoices = getFilteredInvoices();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const todaySales = invoices.filter(inv => new Date(inv.date).toDateString() === today.toDateString())
    .reduce((sum, inv) => sum + inv.total, 0);

  const yesterdaySales = invoices.filter(inv => new Date(inv.date).toDateString() === yesterday)
    .reduce((sum, inv) => sum + inv.total, 0);

  const salesTrend = yesterdaySales === 0 ? 100 : Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);

  const lowStock = inventory.filter(item => item.quantity < 2);
  const recentInvoices = invoices.slice(-6).reverse();
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalCost = filteredInvoices.reduce((sum, inv) => {
    return sum + (inv.items?.reduce((itemSum, item) => {
      const invItem = inventory.find(i => i.id === item.id);
      return itemSum + ((invItem?.cost || 0) * item.quantity);
    }, 0) || 0);
  }, 0);
  const totalProfit = totalRevenue - totalCost;
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);

  // Top Products Calculation
  const productSales = {};
  filteredInvoices.forEach(inv => {
    inv.items?.forEach(item => {
      // Use original ID or Name as key
      const key = item.id || item.name;
      productSales[key] = (productSales[key] || 0) + item.quantity;
    });
  });

  const top5ProductsData = Object.entries(productSales)
    .map(([id, qty]) => {
      const product = inventory.find(p => p.id === id);
      return { name: product?.name || 'Unknown', quantity: qty };
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const topProductsChartData = {
    labels: top5ProductsData.map(p => p.name),
    datasets: [{
      label: 'Units Sold',
      data: top5ProductsData.map(p => p.quantity),
      backgroundColor: 'rgba(173, 20, 87, 0.7)',
      borderRadius: 6,
    }]
  };

  // Date labels and sales grouping based on range
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
        return `Week ${i + 1}`;
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
      // Group by weeks for longer periods
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

  const salesChartData = {
    labels: labels,
    datasets: [{
      label: 'Sales (₹)',
      data: salesByPeriod,
      backgroundColor: 'rgba(136, 14, 79, 0.05)',
      borderColor: '#880e4f',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#880e4f',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
    }]
  };

  // Category-wise sales calculation from REAL sales data
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
      backgroundColor: ['#880e4f', '#ad1457', '#f57f17', '#bc5100', '#2e7d32', '#c62828'],
      borderRadius: 4,
    }]
  };

  const stockData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [{
      data: [
        inventory.filter(i => i.quantity < 2).length,
        inventory.filter(i => i.quantity >= 2 && i.quantity < 50).length,
        inventory.filter(i => i.quantity >= 50).length
      ],
      backgroundColor: ['#c62828', '#f57f17', '#2e7d32'],
      borderWidth: 0,
    }]
  };

  const StatCard = ({ title, value, icon, color, trend, onClick }) => (
    <Card
      sx={{
        height: '100%',
        bgcolor: 'background.paper',
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: (theme) => theme.palette.mode === 'light' ? '0 4px 20px rgba(0,0,0,0.04)' : '0 4px 20px rgba(0,0,0,0.4)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundImage: 'none',
        border: '1px solid',
        borderColor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
        '&:hover': onClick ? { transform: 'translateY(-6px)', boxShadow: (theme) => theme.palette.mode === 'light' ? '0 12px 24px rgba(0,0,0,0.08)' : '0 12px 24px rgba(0,0,0,0.6)' } : {}
      }}
      onClick={onClick}
    >
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: color }} />
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>{value}</Typography>
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${color}08`, color: color }}>
            {React.cloneElement(icon, { sx: { fontSize: 24 } })}
          </Box>
        </Box>
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              color: trend >= 0 ? '#1b5e20' : '#c62828',
              bgcolor: trend >= 0 ? 'rgba(27, 94, 32, 0.08)' : 'rgba(198, 40, 40, 0.08)',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {trend >= 0 ? <TrendingUp sx={{ fontSize: 14, mr: 0.5 }} /> : <TrendingDown sx={{ fontSize: 14, mr: 0.5 }} />}
              {Math.abs(trend)}%
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>vs yesterday</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ mb: 5, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>Overview</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Real-time business analytics for Aleen Clothing.</Typography>
        </Box>

        <Box sx={{
          display: 'flex',
          bgcolor: 'background.paper',
          p: 0.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          {[
            { id: '7days', label: '7 Days', icon: <ViewWeek fontSize="small" /> },
            { id: '30days', label: '30 Days', icon: <CalendarMonth fontSize="small" /> },
            { id: 'thisMonth', label: 'This Month', icon: <DateRange fontSize="small" /> },
            { id: 'all', label: 'All Time', icon: <History fontSize="small" /> }
          ].map((item) => (
            <Button
              key={item.id}
              size="small"
              onClick={() => setDateRange(item.id)}
              startIcon={item.icon}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 700,
                color: dateRange === item.id ? 'white' : 'text.secondary',
                background: dateRange === item.id ? 'linear-gradient(135deg, #880e4f 0%, #ad1457 100%)' : 'transparent',
                '&:hover': {
                  background: dateRange === item.id ? 'linear-gradient(135deg, #ad1457 0%, #880e4f 100%)' : 'rgba(0,0,0,0.02)'
                }
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Box>

      <Grid container spacing={4} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Today's Sales" value={`₹${todaySales.toLocaleString('en-IN')}`} icon={<AttachMoney />} color="#880e4f" trend={salesTrend} onClick={() => navigate('/sales-reports')} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Net Profit" value={`₹${totalProfit.toLocaleString('en-IN')}`} icon={<TrendingUp />} color="#2e7d32" onClick={() => navigate('/profit-loss')} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Stock" value={totalItems} icon={<Inventory2 />} color="#f57f17" onClick={() => navigate('/inventory')} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Low Stock" value={lowStock.length} icon={<Warning />} color="#c62828" onClick={() => navigate('/inventory-reports')} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 4, borderRadius: 5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', backgroundImage: 'none', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 4 }}>
              {dateRange === '7days' ? 'Weekly' : dateRange === '30days' ? 'Monthly' : 'Sales'} Trend
            </Typography>
            <Line data={salesChartData} options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#999' } },
                x: { grid: { display: false }, ticks: { color: '#999' } }
              }
            }} />
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 4, borderRadius: 5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%', backgroundImage: 'none' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 4 }}>Stock Health</Typography>
            <Doughnut data={stockData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, cutout: '70%' }} />
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 4, borderRadius: 5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', backgroundImage: 'none' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 4 }}>Top 5 Best Sellers</Typography>
            <Bar data={topProductsChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </Paper>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 4, borderRadius: 5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', backgroundImage: 'none' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 4 }}>Category Revenue</Typography>
            <Bar data={categoryChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 4, borderRadius: 5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', backgroundImage: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Recent Transactions</Typography>
          <Button onClick={() => navigate('/invoices')}>View All</Button>
        </Box>
        <Grid container spacing={2}>
          {recentInvoices.map(inv => (
            <Grid item xs={12} md={4} key={inv.id}>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, borderLeft: '4px solid #880e4f' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Inv #{inv.id}</Typography>
                <Typography variant="h6">₹{inv.total}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;
