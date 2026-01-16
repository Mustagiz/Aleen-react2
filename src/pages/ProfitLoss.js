import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Grid, Card, CardContent, Button } from '@mui/material';
import { TrendingUp, TrendingDown, Download } from '@mui/icons-material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useData } from '../contexts/DataContext';
import { exportToCSV, formatCurrencyForPDF, generateReportPDF } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const ProfitLoss = () => {
  const { inventory, invoices, profile } = useData();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [itemFilter, setItemFilter] = useState('');

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
      const cost = (invItem?.cost || 0) * item.quantity;
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
  const totalProfit = totalRevenue - totalCost;
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

  // Profit vs Loss distribution
  const profitItems = profitData.filter(item => item.profit > 0).length;
  const lossItems = profitData.filter(item => item.profit < 0).length;

  const distributionData = {
    labels: ['Profit Items', 'Loss Items'],
    datasets: [{
      data: [profitItems, lossItems],
      backgroundColor: ['#1b5e20', '#c62828'],
      borderWidth: 0,
      hoverOffset: 15
    }]
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
      `Total Cost: ${formatCurrencyForPDF(totalCost)}`,
      `Total Profit/Loss: ${formatCurrencyForPDF(totalProfit)}`,
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
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 4, border: 'none', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: 'primary.main' }} />
            <CardContent sx={{ p: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>₹{totalRevenue.toLocaleString('en-IN')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 4, border: 'none', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#f57f17' }} />
            <CardContent sx={{ p: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Cost</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>₹{totalCost.toLocaleString('en-IN')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 4, border: 'none', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: totalProfit >= 0 ? '#2e7d32' : '#c62828' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profit / Loss</Typography>
                {totalProfit >= 0 ? <TrendingUp sx={{ fontSize: 16, color: '#2e7d32' }} /> : <TrendingDown sx={{ fontSize: 16, color: '#c62828' }} />}
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: totalProfit >= 0 ? '#2e7d32' : '#c62828', mt: 0.5 }}>₹{totalProfit.toLocaleString('en-IN')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 4, border: 'none', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#880e4f' }} />
            <CardContent sx={{ p: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Margin</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>{profitMargin}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Category-wise Profit</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<Download />} onClick={exportPDF} variant="contained" sx={{ bgcolor: 'primary.main' }}>Export PDF</Button>
            <Button startIcon={<Download />} onClick={exportReport} variant="outlined">Export CSV</Button>
          </Box>
        </Box>
        <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Profit Trend Over Time</Typography>
            <Line data={trendChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Profit vs Loss</Typography>
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
              {profitData.map((item, idx) => (
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
      </Paper>
    </Box>
  );
};

export default ProfitLoss;
