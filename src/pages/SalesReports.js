import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Grid,
  Chip,
  TablePagination,
  MenuItem,
  Paper
} from '@mui/material';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useData } from '../contexts/DataContext';
import {
  Download,
  TrendingUp,
  Receipt,
  AttachMoney,
  FilterList,
  Clear
} from '@mui/icons-material';
import { formatCurrencyForPDF, generateReportPDF } from '../utils/helpers';
import PageHeader from '../components/crm/PageHeader';
import FinanceNavTabs from '../components/crm/FinanceNavTabs';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const SalesReports = () => {
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

    if (from && invDate < from) return false;
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      if (invDate > endOfDay) return false;
    }

    if (paymentFilter && inv.paymentMethod !== paymentFilter) return false;
    if (categoryFilter && !inv.items?.some(item => item.category === categoryFilter)) return false;

    return true;
  });

  const categories = ['All', ...new Set(inventory.map(item => item.category).filter(Boolean)), 'Custom'];

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalInvoices = filteredInvoices.length;
  const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  // Group by date
  const salesByDate = filteredInvoices.reduce((acc, inv) => {
    const date = new Date(inv.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    acc[date] = (acc[date] || 0) + inv.total;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(salesByDate),
    datasets: [{
      label: 'Sales Revenue (₹)',
      data: Object.values(salesByDate),
      backgroundColor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)',
      bordercolor: (t) => t.palette.primary.main,
      borderWidth: 2.5,
      tension: 0.35,
      fill: true,
      pointBackgroundcolor: (t) => t.palette.primary.main,
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointRadius: 4,
    }]
  };

  // Category-wise sales
  const categorySales = filteredInvoices.reduce((acc, inv) => {
    inv.items?.forEach(item => {
      const cat = item.category || 'General';
      acc[cat] = (acc[cat] || 0) + (item.price * item.quantity);
    });
    return acc;
  }, {});

  const categoryChartData = {
    labels: Object.keys(categorySales),
    datasets: [{
      label: 'Sales by Category (₹)',
      data: Object.values(categorySales),
      backgroundColor: [
        '#0F766E',
        '#D97706',
        '#042F2E',
        '#059669',
        '#B45309',
        '#64748B'
      ],
      borderRadius: 6,
      borderWidth: 0
    }]
  };

  // Payment method distribution
  const paymentMethodsChartData = filteredInvoices.reduce((acc, inv) => {
    const method = inv.paymentMethod || 'Cash';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  const paymentChartData = {
    labels: Object.keys(paymentMethodsChartData),
    datasets: [{
      data: Object.values(paymentMethodsChartData),
      backgroundColor: [
        '#0F766E',
        '#D97706',
        '#10B981',
        '#6366F1'
      ],
      borderWidth: 2,
      borderColor: '#FFFFFF',
      hoverOffset: 8
    }]
  };

  const exportPDF = () => {
    const summaryLines = [
      `Total Revenue: ${formatCurrencyForPDF(totalRevenue)}`,
      `Total Invoices: ${totalInvoices}`,
      `Average Order Value: ${formatCurrencyForPDF(avgInvoiceValue)}`
    ];

    if (paymentFilter) summaryLines.push(`Payment Method: ${paymentFilter}`);
    if (categoryFilter) summaryLines.push(`Category: ${categoryFilter}`);

    const tableData = filteredInvoices.map(inv => [
      inv.id,
      new Date(inv.date).toLocaleDateString(),
      inv.customer?.name || inv.customer || 'Walk-in Client',
      inv.paymentMethod || 'Cash',
      formatCurrencyForPDF(inv.total)
    ]);

    generateReportPDF(
      'Sales Audit Report',
      profile,
      summaryLines,
      ['Invoice ID', 'Date', 'Client', 'Payment Tender', 'Total Amount'],
      tableData,
      'sales-audit-report'
    );
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Top Header */}
      <PageHeader
        title="Boutique Sales Audit"
        subtitle="Comprehensive breakdown of transaction revenues, payment tender distribution, and category turnover"
        actions={
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={exportPDF}
            sx={{
              px: 3,
              py: 1
            }}
          >
            Export PDF Audit
          </Button>
        }
      />

      {/* Finance & Audit Tab Switcher */}
      <FinanceNavTabs activeTab="/sales-reports" />

      {/* KPI Cards: Responsive Grid on Mobile, 3 Columns on Tablet/Desktop */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
        <Grid item xs={6} sm={4}>
          <AtelierKpiCard
            title="Total Net Turnover"
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            subtitle={`Across ${totalInvoices} audited billing records`}
            icon={<AttachMoney />}
            color="success"
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <AtelierKpiCard
            title="Audited Invoices"
            value={totalInvoices}
            subtitle="Completed client orders"
            icon={<Receipt />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <AtelierKpiCard
            title="Average Ticket Size"
            value={`₹${avgInvoiceValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            subtitle="Mean sales value per invoice"
            icon={<TrendingUp />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3.5,
          borderRadius: 3.5,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList sx={{ color: (t) => t.palette.primary.main, fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Filter Sales Records
            </Typography>
          </Box>
          {(dateFrom || dateTo || paymentFilter || categoryFilter) && (
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={() => { setDateFrom(''); setDateTo(''); setPaymentFilter(''); setCategoryFilter(''); }}
              sx={{ textTransform: 'none', fontWeight: 700, color: '#DC2626' }}
            >
              Reset Filters
            </Button>
          )}
        </Box>

        <Grid container spacing={2}>
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
              label="Payment Tender"
              fullWidth
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Tenders</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="UPI">UPI / QR</MenuItem>
              <MenuItem value="Card">Card</MenuItem>
              <MenuItem value="Split">Split Payment</MenuItem>
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
      </Paper>

      {/* Visual Analytics */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
              Sales Revenue Timeline
            </Typography>
            <Box sx={{ height: 260 }}>
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { callback: (val) => `₹${val.toLocaleString('en-IN')}` },
                      grid: { color: 'rgba(0,0,0,0.04)' }
                    },
                    x: { grid: { display: false } }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
              Payment Methods Breakdown
            </Typography>
            <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut
                data={paymentChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } }
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Categorical Sales Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3.5,
          borderRadius: 3.5,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
          Revenue by Garment & Haute Couture Category
        </Typography>
        <Box sx={{ height: 220 }}>
          <Bar
            data={categoryChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { callback: (val) => `₹${val.toLocaleString('en-IN')}` },
                  grid: { color: 'rgba(0,0,0,0.04)' }
                },
                x: { grid: { display: false } }
              }
            }}
          />
        </Box>
      </Paper>

      {/* Itemized Invoices Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '20px',
          border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.14)',
          overflow: 'hidden',
          boxShadow: (t) => t.palette.mode === 'dark' 
            ? '0 10px 30px rgba(0, 0, 0, 0.4)' 
            : '0 10px 30px -10px rgba(var(--primary-rgb, 15, 118, 110), 0.08), 0 1px 3px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Box sx={{ px: 3, py: 2, bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.02)', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Detailed Sales Ledger ({filteredInvoices.length} entries)
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: 'primary.main', width: 140 }}>Invoice No</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>Payment Method</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'primary.main' }} align="center">Items</TableCell>
                <TableCell sx={{ fontWeight: 800, color: 'primary.main' }} align="right">Invoice Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No invoice transactions match the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((inv) => (
                    <TableRow key={inv.id} hover sx={{ '&:hover': { bgcolor: (t) => `${t.palette.primary.main}08` } }}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.main' }}>
                        #{inv.id}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {inv.customer?.name || inv.customer || 'Walk-in Client'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={inv.paymentMethod || 'Cash'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            bgcolor: inv.paymentMethod === 'UPI' ? 'rgba(16, 185, 129, 0.1)' : inv.paymentMethod === 'Card' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                            color: inv.paymentMethod === 'UPI' ? '#059669' : inv.paymentMethod === 'Card' ? '#4F46E5' : '#D97706'
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${inv.items?.length || 0} items`}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.72rem' }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.95rem' }}>
                        ₹{inv.total.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredInvoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Paper>
    </Box>
  );
};

export default SalesReports;
