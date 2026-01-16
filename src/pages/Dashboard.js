import React from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, Avatar, Chip, Button } from '@mui/material';
import { TrendingUp, TrendingDown, Inventory2, ShoppingCart, Warning, AttachMoney, Receipt, Assessment, ArrowForward } from '@mui/icons-material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { inventory, invoices } = useData();
  const navigate = useNavigate();

  const today = new Date().toDateString();
  const todaySales = invoices.filter(inv => new Date(inv.date).toDateString() === today)
    .reduce((sum, inv) => sum + inv.total, 0);

  const lowStock = inventory.filter(item => item.quantity < 10);
  const recentInvoices = invoices.slice(-5).reverse();
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalCost = invoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((itemSum, item) => {
      const invItem = inventory.find(i => i.id === item.id);
      return itemSum + ((invItem?.cost || 0) * item.quantity);
    }, 0);
  }, 0);
  const totalProfit = totalRevenue - totalCost;
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);

  // Last 7 days sales data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  });

  const salesByDay = last7Days.map(day => {
    return invoices
      .filter(inv => new Date(inv.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) === day)
      .reduce((sum, inv) => sum + inv.total, 0);
  });

  const salesChartData = {
    labels: last7Days,
    datasets: [{
      label: 'Sales (₹)',
      data: salesByDay,
      backgroundColor: 'rgba(136, 14, 79, 0.05)',
      borderColor: '#880e4f',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#880e4f',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  // Category-wise sales calculation
  const categorySales = inventory.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + (item.price * (50 - item.quantity));
    return acc;
  }, {});

  const categoryChartData = {
    labels: Object.keys(categorySales),
    datasets: [{
      label: 'Sales by Category',
      data: Object.values(categorySales),
      backgroundColor: [
        '#880e4f',
        '#ad1457',
        '#f57f17',
        '#bc5100',
        '#2e7d32',
        '#c62828'
      ],
      borderRadius: 4,
      borderWidth: 0
    }]
  };

  const stockData = {
    labels: ['Low Stock', 'Medium Stock', 'High Stock'],
    datasets: [{
      data: [
        inventory.filter(i => i.quantity < 10).length,
        inventory.filter(i => i.quantity >= 10 && i.quantity < 50).length,
        inventory.filter(i => i.quantity >= 50).length
      ],
      backgroundColor: [
        '#c62828',
        '#f57f17',
        '#2e7d32'
      ],
      borderWidth: 0,
      hoverOffset: 15
    }]
  };

  const StatCard = ({ title, value, icon, color, trend, onClick }) => (
    <Card
      sx={{
        height: '100%',
        bgcolor: '#ffffff',
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick ? { transform: 'translateY(-6px)', boxShadow: '0 12px 24px rgba(0,0,0,0.08)' } : {}
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
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              color: trend > 0 ? '#1b5e20' : '#c62828',
              bgcolor: trend > 0 ? 'rgba(27, 94, 32, 0.08)' : 'rgba(198, 40, 40, 0.08)',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {trend > 0 ? <TrendingUp sx={{ fontSize: 14, mr: 0.5 }} /> : <TrendingDown sx={{ fontSize: 14, mr: 0.5 }} />}
              {Math.abs(trend)}%
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>vs last week</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ title, description, icon, color, onClick }) => (
    <Card
      sx={{
        height: '100%',
        bgcolor: '#ffffff',
        borderRadius: 4,
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
          <Box sx={{ p: 1.25, borderRadius: '12px', bgcolor: `${color}08`, color: color, mr: 2, display: 'flex' }}>
            {React.cloneElement(icon, { sx: { fontSize: 28 } })}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{title}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6, fontWeight: 500 }}>{description}</Typography>
        <Button
          fullWidth
          variant="outlined"
          endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
          sx={{
            borderColor: `${color}40`,
            color: color,
            fontWeight: 700,
            fontSize: '0.8rem',
            textTransform: 'none',
            borderRadius: 2,
            '&:hover': { bgcolor: `${color}05`, borderColor: color }
          }}
        >
          View {title}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
          Overview
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Welcome back to your Aleen Clothing management dashboard.</Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={4} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Today's Sales" value={`₹${todaySales.toLocaleString('en-IN')}`} icon={<AttachMoney />} color="#880e4f" trend={12} onClick={() => navigate('/sales-reports')} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Margin" value={`₹${totalProfit.toLocaleString('en-IN')}`} icon={<TrendingUp />} color="#2e7d32" trend={15} onClick={() => navigate('/sales-reports')} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Stock Items" value={totalItems.toLocaleString('en-IN')} icon={<Inventory2 />} color="#f57f17" onClick={() => navigate('/inventory')} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Low Stock Alerts" value={lowStock.length} icon={<Warning />} color="#c62828" trend={-5} onClick={() => navigate('/inventory-reports')} />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Inventory"
            description="Manage your products and stock"
            icon={<Inventory2 />}
            color="#880e4f"
            onClick={() => navigate('/inventory')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Invoices"
            description="Create and manage your retail invoices"
            icon={<Receipt />}
            color="#ad1457"
            onClick={() => navigate('/invoices')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Sales Analytics"
            description="Track and analyze your store revenue"
            icon={<Assessment />}
            color="#f57f17"
            onClick={() => navigate('/sales-reports')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Stock Flow"
            description="Monitor inventory and replenishments"
            icon={<Inventory2 />}
            color="#2e7d32"
            onClick={() => navigate('/inventory-reports')}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 4, borderRadius: 5, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment sx={{ color: 'primary.main' }} /> Weekly Sales Performance
            </Typography>
            <Line data={salesChartData} options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, border: { display: false }, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { weight: 600 } } },
                x: { border: { display: false }, grid: { display: false }, ticks: { font: { weight: 600 } } }
              }
            }} />
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 4, borderRadius: 5, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 4 }}>Stock Health</Typography>
            <Doughnut data={stockData} options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 25, font: { weight: 600, size: 12 } } }
              },
              cutout: '75%'
            }} />
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 4, borderRadius: 5, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 4 }}>Category Metrics</Typography>
            <Bar data={categoryChartData} options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, border: { display: false }, grid: { color: 'rgba(0,0,0,0.04)' } },
                x: { border: { display: false }, grid: { display: false } }
              }
            }} />
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 4, borderRadius: 5, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Recent Ledger</Typography>
              <Button size="small" variant="text" sx={{ fontWeight: 700, p: 0 }} onClick={() => navigate('/invoices')}>Full History</Button>
            </Box>
            {recentInvoices.length > 0 ? recentInvoices.map(inv => (
              <Box key={inv.id} sx={{ mb: 2, p: 2, bgcolor: 'rgba(136, 14, 79, 0.02)', borderRadius: 2.5, borderLeft: '3px solid #880e4f', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(136, 14, 79, 0.05)' } }} onClick={() => navigate('/invoices')}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>Inv #{inv.id}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Typography>
                  </Box>
                  <Chip
                    label={`₹${inv.total.toLocaleString('en-IN')}`}
                    size="small"
                    sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 800, border: '1px solid rgba(136, 14, 79, 0.1)', fontSize: '0.75rem' }}
                  />
                </Box>
              </Box>
            )) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>No entries found</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
