import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Card, CardContent, Grid, Chip } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useData } from '../contexts/DataContext';
import { Download, TrendingUp, Receipt, AttachMoney } from '@mui/icons-material';
import { formatCurrencyForPDF, generateReportPDF } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const SalesReports = () => {
  const { invoices, profile } = useData();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.date);
    const from = dateFrom ? new Date(dateFrom) : new Date(0);
    const to = dateTo ? new Date(dateTo) : new Date();
    return invDate >= from && invDate <= to;
  });

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalInvoices = filteredInvoices.length;
  const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  const salesByDate = filteredInvoices.reduce((acc, inv) => {
    const date = new Date(inv.date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + inv.total;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(salesByDate),
    datasets: [{
      label: 'Sales (₹)',
      data: Object.values(salesByDate),
      backgroundColor: 'rgba(136, 14, 79, 0.05)',
      borderColor: '#880e4f',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#880e4f',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }]
  };

  // Category-wise sales
  const categorySales = filteredInvoices.reduce((acc, inv) => {
    inv.items?.forEach(item => {
      acc[item.category] = (acc[item.category] || 0) + (item.price * item.quantity);
    });
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

  // Payment method distribution
  const paymentMethods = filteredInvoices.reduce((acc, inv) => {
    acc[inv.paymentMethod] = (acc[inv.paymentMethod] || 0) + 1;
    return acc;
  }, {});

  const paymentChartData = {
    labels: Object.keys(paymentMethods),
    datasets: [{
      data: Object.values(paymentMethods),
      backgroundColor: [
        '#2e7d32',
        '#880e4f',
        '#ad1457',
        '#f57f17'
      ],
      borderWidth: 0,
      hoverOffset: 15
    }]
  };

  const exportPDF = () => {
    const summaryLines = [
      `Total Revenue: ${formatCurrencyForPDF(totalRevenue)}`,
      `Total Invoices: ${totalInvoices}`,
      `Average Invoice Value: ${formatCurrencyForPDF(avgInvoiceValue)}`
    ];

    if (dateFrom || dateTo) {
      summaryLines.unshift(`Period: ${dateFrom || 'Start'} to ${dateTo || 'Today'}`);
    }

    const tableData = filteredInvoices.map(inv => [
      inv.id,
      new Date(inv.date).toLocaleDateString(),
      inv.customer || 'Walk-in',
      inv.paymentMethod,
      formatCurrencyForPDF(inv.total)
    ]);

    generateReportPDF(
      'Sales Report',
      profile,
      summaryLines,
      ['Invoice ID', 'Date', 'Customer', 'Payment', 'Total'],
      tableData,
      'sales-report'
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>Sales Reports</Typography>
          <Typography variant="body2" color="text.secondary">Analyze your sales performance</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={exportPDF}
          sx={{
            background: 'linear-gradient(135deg, #880e4f 0%, #ad1457 100%)',
            boxShadow: '0 4px 12px rgba(136, 14, 79, 0.2)',
            '&:hover': {
              background: 'linear-gradient(135deg, #ad1457 0%, #880e4f 100%)',
            },
            borderRadius: '8px',
            fontWeight: 700,
            textTransform: 'none'
          }}
        >
          Export PDF
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 4, border: 'none', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: 'primary.main' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>₹{totalRevenue.toLocaleString('en-IN')}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(136, 14, 79, 0.05)', color: 'primary.main' }}>
                  <AttachMoney />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 4, border: 'none', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#2e7d32' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Invoices</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>{totalInvoices}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(46, 125, 50, 0.05)', color: '#2e7d32' }}>
                  <Receipt />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 4, border: 'none', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#f57f17' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Value</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>₹{avgInvoiceValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(245, 127, 23, 0.05)', color: '#f57f17' }}>
                  <TrendingUp />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Filter by Date Range</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField label="From Date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField label="To Date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          <Button variant="outlined" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Sales Trend</Typography>
        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Sales by Category</Typography>
            <Bar data={categoryChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Payment Methods</Typography>
            <Doughnut data={paymentChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(136, 14, 79, 0.02)', borderBottom: '2px solid rgba(136, 14, 79, 0.1)' }}>
              <TableRow>
                <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice ID</TableCell>
                <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</TableCell>
                <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', sm: 'table-cell' } }}>Items Count</TableCell>
                <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.map((inv, idx) => (
                <TableRow key={inv.id} sx={{ '&:hover': { bgcolor: 'rgba(136, 14, 79, 0.02)' } }}>
                  <TableCell sx={{ fontWeight: 700 }}>#{inv.id}</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>{new Date(inv.date).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{inv.items?.length || 0} Products</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>₹{inv.total.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default SalesReports;
