import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Grid, Card, CardContent, Button, TablePagination, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown, Download } from '@mui/icons-material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useData } from '../contexts/DataContext';
import { exportToCSV, formatCurrencyForPDF, generateReportPDF } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const ProfitLoss = () => {
  const theme = useTheme();
  const { inventory, invoices, expenses, profile } = useData();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [itemFilter, setItemFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const categories = ['All', ...new Set(inventory.map(item => item.category))];

  const filteredInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.date);
    const from = dateFrom ? new Date(dateFrom) : new Date(0);
    const to = dateTo ? new Date(dateTo) : new Date();
    return invDate >= from && invDate <= to;
  });

  const profitData = filteredInvoices.flatMap(inv =>
    inv.items.map(item => {
      const invItem = inventory.find(i => i.id === item.id);
      const revenue = item.price * item.quantity;
      const cost = (item.cost !== undefined ? item.cost : (invItem?.cost || 0)) * item.quantity;
      const profit = revenue - cost;
      return {
        invoiceId: inv.id,
        date: inv.date,
        itemName: item.name,
        category: item.category,
        quantity: item.quantity,
        cost,
        revenue,
        profit,
        margin: cost > 0 ? ((profit / revenue) * 100).toFixed(1) : 0
      };
    })
  ).filter(item => {
    const categoryMatch = !categoryFilter || categoryFilter === 'All' || item.category === categoryFilter;
    const itemMatch = !itemFilter || item.itemName.toLowerCase().includes(itemFilter.toLowerCase());
    return categoryMatch && itemMatch;
  });

  const totalRevenue = profitData.reduce((sum, item) => sum + item.revenue, 0);
  const totalCost = profitData.reduce((sum, item) => sum + item.cost, 0);

  // Deduced Expenses calculation
  const expenseTotal = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    const from = dateFrom ? new Date(dateFrom) : new Date(0);
    const to = dateTo ? new Date(dateTo) : new Date();
    return expDate >= from && expDate <= to;
  }).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  const totalProfit = totalRevenue - totalCost - expenseTotal;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Category-wise profit
  const categoryProfit = profitData.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.profit;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(categoryProfit),
    datasets: [{
      label: 'Profit (₹)',
      data: Object.values(categoryProfit),
      backgroundColor: Object.values(categoryProfit).map(val =>
        val >= 0 ? '#1b5e20' : '#c62828'
      ),
      borderRadius: 4
    }]
  };

  // Profit trend over time
  const profitByDate = profitData.reduce((acc, item) => {
    const date = new Date(item.date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + item.profit;
    return acc;
  }, {});

  const trendChartData = {
    labels: Object.keys(profitByDate),
    datasets: [{
      label: 'Profit Trend',
      data: Object.values(profitByDate),
      backgroundColor: 'rgba(136, 14, 79, 0.05)',
      borderColor: '#880e4f',
      borderWidth: 3,
      tension: 0.4,
      fill: true
    }]
  };

  // Profit Forecasting Logic
  const calculateForecast = () => {
    const sortedDates = Object.keys(profitByDate).sort((a, b) => new Date(a) - new Date(b));
    if (sortedDates.length < 2) return null;

    const firstDate = new Date(sortedDates[0]);
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const daysDiff = Math.max(1, Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24)));

    const avgDailyProfit = totalProfit / daysDiff;
    const projected30Days = avgDailyProfit * 30;

    return {
      daily: avgDailyProfit,
      monthly: projected30Days,
      forecastData: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(lastDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        profit: avgDailyProfit
      }))
    };
  };

  const forecast = calculateForecast();

  const forecastChartData = {
    labels: [
      ...Object.keys(profitByDate).slice(-7),
      ...(forecast?.forecastData.map(d => d.date) || [])
    ],
    datasets: [
      {
        label: 'Historical Profit',
        data: [...Object.values(profitByDate).slice(-7), ...Array(7).fill(null)],
        borderColor: '#880e4f',
        tension: 0.4,
      },
      {
        label: 'Forecasted Profit',
        data: [...Array(7).fill(null), ...Array(7).fill(forecast?.daily || 0)],
        borderColor: '#43a047',
        borderDash: [5, 5],
        tension: 0,
      }
    ]
  };

  const exportReport = () => {
    const data = profitData.map(item => ({
      'Invoice': item.invoiceId,
      'Date': new Date(item.date).toLocaleDateString(),
      'Item': item.itemName,
      'Category': item.category,
      'Quantity': item.quantity,
      'Cost': item.cost.toFixed(2),
      'Revenue': item.revenue.toFixed(2),
      'Profit': item.profit.toFixed(2),
      'Margin %': item.margin
    }));
    exportToCSV(data, 'profit-loss-report');
  };

  const exportPDF = () => {
    const summaryLines = [
      `Total Revenue: ${formatCurrencyForPDF(totalRevenue)}`,
      `Gross Profit: ${formatCurrencyForPDF(totalRevenue - totalCost)}`,
      `Miscellaneous Expenses: ${formatCurrencyForPDF(expenseTotal)}`,
      `Net Profit/Loss: ${formatCurrencyForPDF(totalProfit)}`,
      `Net Margin: ${profitMargin}%`
    ];

    if (dateFrom || dateTo) {
      summaryLines.unshift(`Period: ${dateFrom || 'Start'} to ${dateTo || 'Today'}`);
    }

    const tableData = profitData.map(item => [
      item.invoiceId,
      new Date(item.date).toLocaleDateString(),
      `${item.itemName} (${item.category})`,
      item.quantity,
      formatCurrencyForPDF(item.cost),
      formatCurrencyForPDF(item.revenue),
      formatCurrencyForPDF(item.profit)
    ]);

    generateReportPDF(
      'Profit & Loss Report',
      profile,
      summaryLines,
      ['Invoice', 'Date', 'Item', 'Qty', 'Cost', 'Revenue', 'Profit'],
      tableData,
      'profit-loss-report'
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>Profit & Loss Report</Typography>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField label="From Date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField label="To Date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} fullWidth>
              {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField label="Search Item" value={itemFilter} onChange={(e) => setItemFilter(e.target.value)} fullWidth />
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={2.4}>
          <Card sx={{
            p: 2.5,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 25px -5px rgba(225, 29, 72, 0.15)',
            border: '1px solid rgba(225, 29, 72, 0.15)',
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(225, 29, 72, 0.05) 100%)`,
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px -10px rgba(225, 29, 72, 0.3)' }
          }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#E11D48' }} />
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>Revenue</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>₹{totalRevenue.toLocaleString()}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={2.4}>
          <Card sx={{
            p: 2.5,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 25px -5px rgba(183, 110, 121, 0.15)',
            border: '1px solid rgba(183, 110, 121, 0.15)',
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(183, 110, 121, 0.05) 100%)`,
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px -10px rgba(183, 110, 121, 0.3)' }
          }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#B76E79' }} />
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>COGS</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>₹{totalCost.toLocaleString()}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={2.4}>
          <Card sx={{
            p: 2.5,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.15)',
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(245, 158, 11, 0.05) 100%)`,
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px -10px rgba(245, 158, 11, 0.3)' }
          }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#f59e0b' }} />
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>Expenses</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'error.main' }}>- ₹{expenseTotal.toLocaleString()}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={2.4}>
          <Card sx={{
            p: 2.5,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: totalProfit >= 0 ? '0 10px 25px -5px rgba(67, 160, 71, 0.15)' : '0 10px 25px -5px rgba(229, 57, 53, 0.15)',
            border: totalProfit >= 0 ? '1px solid rgba(67, 160, 71, 0.15)' : '1px solid rgba(229, 57, 53, 0.15)',
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${totalProfit >= 0 ? 'rgba(67, 160, 71, 0.05)' : 'rgba(229, 57, 53, 0.05)'} 100%)`,
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: totalProfit >= 0 ? '0 12px 24px -10px rgba(67, 160, 71, 0.3)' : '0 12px 24px -10px rgba(229, 57, 53, 0.3)' }
          }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: totalProfit >= 0 ? '#43a047' : '#e53935' }} />
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>Net Profit</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: totalProfit >= 0 ? 'success.main' : 'error.main' }}>₹{totalProfit.toLocaleString()}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <Card sx={{
            p: 2.5,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 25px -5px rgba(219, 39, 119, 0.15)',
            border: '1px solid rgba(219, 39, 119, 0.15)',
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(219, 39, 119, 0.05) 100%)`,
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#DB2777' }} />
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>Margin</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{profitMargin}%</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={12} lg={2.4}>
          <Card sx={{
            p: 2.5,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 25px -5px rgba(67, 160, 71, 0.15)',
            border: '1px solid rgba(67, 160, 71, 0.15)',
            background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
            color: 'white'
          }}>
            <Typography variant="overline" sx={{ fontWeight: 700, fontSize: '0.65rem', opacity: 0.8 }}>30-Day Forecast</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>+₹{forecast?.monthly.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Based on daily avg of ₹{forecast?.daily.toFixed(0) || '0'}</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Category-wise Profit</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<Download />}
              onClick={exportPDF}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #d97706 0%, #f97316 100%)',
                boxShadow: `0 4px 12px ${theme.palette.primary.main}33`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
                  boxShadow: `0 6px 16px ${theme.palette.primary.main}4D`,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Export PDF
            </Button>
            <Button
              startIcon={<Download />}
              onClick={exportReport}
              variant="outlined"
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'primary.light',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Export CSV
            </Button>
          </Box>
        </Box>
        <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Profit Trend & Forecast</Typography>
            <Line data={forecastChartData} options={{
              responsive: true,
              plugins: { legend: { position: 'top' } },
              scales: { y: { beginAtZero: false } }
            }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Profit Distribution</Typography>
            <Doughnut data={distributionData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed Table */}
      <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'rgba(136, 14, 79, 0.02)', borderBottom: '2px solid rgba(136, 14, 79, 0.1)' }}>
              <TableRow>
                <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice</TableCell>
                <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</TableCell>
                <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item Details</TableCell>
                <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financials</TableCell>
                <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profit/Loss</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profitData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, idx) => (
                  <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'rgba(136, 14, 79, 0.01)' } }}>
                    <TableCell sx={{ fontWeight: 700 }}>#{item.invoiceId}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.itemName}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.category} • Qty: {item.quantity}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{item.revenue.toLocaleString('en-IN')}</Typography>
                      <Typography variant="caption" color="text.secondary">Cost: ₹{item.cost.toLocaleString('en-IN')}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: item.profit >= 0 ? '#1b5e20' : '#c62828' }}>
                        ₹{item.profit.toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: item.profit >= 0 ? '#1b5e20' : '#c62828', opacity: 0.8 }}>
                        {item.margin}% margin
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={profitData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box >
  );
};

export default ProfitLoss;
