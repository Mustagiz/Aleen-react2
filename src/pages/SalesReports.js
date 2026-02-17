import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Card, CardContent, Grid, Chip, TablePagination, MenuItem, useTheme } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useData } from '../contexts/DataContext';
import { Download, TrendingUp, Receipt, AttachMoney } from '@mui/icons-material';
import { formatCurrencyForPDF, generateReportPDF } from '../utils/helpers';
import GlassCard from '../components/GlassCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const SalesReports = () => {
  const theme = useTheme();
  const { invoices, profile, inventory } = useData();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.date);
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    // Date Filter
    if (from && invDate < from) return false;
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      if (invDate > endOfDay) return false;
    }

    // Payment Filter
    if (paymentFilter && inv.paymentMethod !== paymentFilter) return false;

    // Category Filter (Show invoice if any item matches category)
    if (categoryFilter && !inv.items.some(item => item.category === categoryFilter)) return false;

    return true;
  });

  const categories = ['All', ...new Set(inventory.map(item => item.category)), 'Custom'];
  const paymentMethods = ['All', 'Cash', 'UPI', 'Card', 'Other'];

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
      backgroundColor: 'rgba(244, 114, 182, 0.05)',
      borderColor: '#F472B6',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#F472B6',
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
  const paymentMethodsChartData = filteredInvoices.reduce((acc, inv) => {
    acc[inv.paymentMethod] = (acc[inv.paymentMethod] || 0) + 1;
    return acc;
  }, {});

  const paymentChartData = {
    labels: Object.keys(paymentMethodsChartData),
    datasets: [{
      data: Object.values(paymentMethodsChartData),
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

    if (paymentFilter) summaryLines.push(`Payment Method: ${paymentFilter}`);
    if (categoryFilter) summaryLines.push(`Category: ${categoryFilter}`);

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
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Sales Reports</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Detailed analytics of your business performance</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={exportPDF}
          sx={{
            background: 'linear-gradient(135deg, #d97706 0%, #f97316 100%)',
            boxShadow: `0 4px 12px ${theme.palette.primary.main}33`,
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            px: 4,
            py: 1.5,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
              boxShadow: `0 6px 16px ${theme.palette.primary.main}4D`,
              transform: 'translateY(-2px)'
            }
          }}
        >
          Export Report
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={4}>
          <GlassCard sx={{ height: '100%', p: 0 }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: '#E11D48' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>Total Revenue</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.5 }}>₹{totalRevenue.toLocaleString('en-IN')}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(225, 29, 72, 0.1)', color: '#E11D48' }}>
                  <AttachMoney />
                </Box>
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={4}>
          <GlassCard sx={{ height: '100%', p: 0 }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: '#1976d2' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>Total Invoices</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.5 }}>{totalInvoices}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(25, 118, 210, 0.1)', color: '#1976d2' }}>
                  <Receipt />
                </Box>
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid item xs={12} sm={4}>
          <GlassCard sx={{ height: '100%', p: 0 }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: '#ed6c02' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>Average Value</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.5 }}>₹{avgInvoiceValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(237, 108, 2, 0.1)', color: '#ed6c02' }}>
                  <TrendingUp />
                </Box>
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>

      <GlassCard sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'primary.main' }}>Filter Reports</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="From Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="To Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Payment Method"
              fullWidth
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Payment Methods</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="Card">Card</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Product Category"
              fullWidth
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.slice(1).map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <Button variant="outlined" size="small" onClick={() => { setDateFrom(''); setDateTo(''); setPaymentFilter(''); setCategoryFilter(''); }}>Clear Filters</Button>
      </GlassCard>

      <GlassCard sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>Sales Trend</Typography>
        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
      </GlassCard>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <GlassCard sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>Sales by Category</Typography>
            <Bar data={categoryChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </GlassCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <GlassCard sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>Payment Methods</Typography>
            <Doughnut data={paymentChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </GlassCard>
        </Grid>
      </Grid>

      <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice ID</TableCell>
                <TableCell sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</TableCell>
                <TableCell sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', sm: 'table-cell' } }}>Items Count</TableCell>
                <TableCell sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((inv, idx) => (
                  <TableRow key={inv.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell sx={{ fontWeight: 700 }}>#{inv.id}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{new Date(inv.date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{inv.items?.length || 0} Products</TableCell>
                    <TableCell sx={{ fontWeight: 900, color: 'primary.main' }}>₹{inv.total.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredInvoices.length}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </GlassCard>
    </Box >
  );
};

export default SalesReports;
