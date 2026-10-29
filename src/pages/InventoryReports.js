import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  MenuItem,
  TableContainer,
  Grid,
  Chip,
  TablePagination,
  Tabs,
  Tab
} from '@mui/material';
import { useData } from '../contexts/DataContext';
import {
  Download,
  Inventory2,
  Warning,
  TrendingDown,
  ListAlt,
  History,
  AttachMoney
} from '@mui/icons-material';
import { formatCurrencyForPDF, generateReportPDF, formatSkuWithHyphen } from '../utils/helpers';
import PageHeader from '../components/crm/PageHeader';
import FinanceNavTabs from '../components/crm/FinanceNavTabs';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';

const InventoryReports = () => {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockLevel, setStockLevel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState(0);
  const { inventory, profile, inventoryLogs, invoices } = useData();

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const allCategories = [...new Set(inventory.map(item => item.category).filter(Boolean))];

  const filteredInventory = inventory.filter(item => {
    const categoryMatch = categoryFilter === '' || item.category === categoryFilter;
    const stockMatch = stockLevel === '' ||
      (stockLevel === 'low' && item.quantity < 2) ||
      (stockLevel === 'medium' && item.quantity >= 2 && item.quantity < 20) ||
      (stockLevel === 'high' && item.quantity >= 20);

    const itemDate = item.dateAdded ? new Date(item.dateAdded) : (isNaN(item.id) ? new Date() : new Date(parseInt(item.id)));
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const dateMatch = (!start || itemDate >= start) && (!end || itemDate <= end);

    return categoryMatch && stockMatch && dateMatch;
  });

  const totalValue = filteredInventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lowStockCount = filteredInventory.filter(item => item.quantity < 2).length;
  const totalItemsCount = filteredInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const exportPDF = () => {
    const summaryLines = [
      `Total Item SKUs: ${filteredInventory.length}`,
      `Total Physical Units: ${totalItemsCount}`,
      `Total Inventory Valuation: ${formatCurrencyForPDF(totalValue)}`,
      `Low Stock Alerts: ${lowStockCount}`
    ];

    if (startDate || endDate) {
      summaryLines.unshift(`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`);
    }

    const tableData = filteredInventory.map(item => [
      item.name,
      item.category || 'General',
      `${item.size || '-'} / ${item.color || '-'}`,
      formatCurrencyForPDF(item.price),
      `${item.quantity} units`,
      formatCurrencyForPDF(item.price * item.quantity)
    ]);

    generateReportPDF(
      'Boutique Stock Audit Report',
      profile,
      summaryLines,
      ['Product Name', 'Category', 'Size / Color', 'Retail Price', 'Current Stock', 'Stock Valuation'],
      tableData,
      'stock-audit-report'
    );
  };

  const exportCSV = () => {
    const headers = ['Name', 'Category', 'Size', 'Color', 'Price', 'Quantity', 'Valuation', 'Supplier'];
    const rows = filteredInventory.map(item => [
      `"${item.name}"`,
      `"${item.category || ''}"`,
      `"${item.size || ''}"`,
      `"${item.color || ''}"`,
      item.price,
      item.quantity,
      item.price * item.quantity,
      `"${item.supplier || ''}"`
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock-audit-report.csv';
    a.click();
  };

  const getSlowMovingItems = () => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return inventory.filter(item => {
      const itemSales = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= ninetyDaysAgo && inv.items?.some(i => i.id === item.id);
      });

      const itemDate = item.dateAdded ? new Date(item.dateAdded) : (isNaN(item.id) ? new Date() : new Date(parseInt(item.id)));
      if (itemDate >= ninetyDaysAgo) return false;

      return itemSales.length === 0;
    });
  };

  const slowMovingItems = getSlowMovingItems();
  const sortedLogs = [...(inventoryLogs || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Top Header */}
      <PageHeader
        title="Stock Valuation & Inventory Audit"
        subtitle="Real-time physical asset valuation, movement logs, and slow-moving SKU detection"
        actions={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportCSV}
              sx={{
                borderColor: 'divider',
                color: 'text.primary',
                borderRadius: 2.5,
                fontWeight: 700,
                textTransform: 'none',
                px: 2.5,
                '&:hover': { bordercolor: (t) => t.palette.primary.main, bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)' }
              }}
            >
              CSV Export
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={exportPDF}
              sx={{
                background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
                color: '#FFFFFF',
                borderRadius: 2.5,
                fontWeight: 700,
                textTransform: 'none',
                px: 3,
                boxShadow: '0 4px 14px rgba(var(--primary-rgb, 15, 118, 110), 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #042F2E 0%, #0F766E 100%)'
                }
              }}
            >
              Audit PDF
            </Button>
          </Box>
        }
      />

      {/* Finance & Audit Tab Switcher */}
      <FinanceNavTabs activeTab="/inventory-reports" />

      {/* 4 Atelier KPIs: Responsive 2x2 Grid on Mobile, 4 Columns on Desktop */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <AtelierKpiCard
            title="Total Stock Valuation"
            value={`₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            subtitle={`Retail value across ${totalItemsCount} pieces`}
            icon={<AttachMoney />}
            color="success"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <AtelierKpiCard
            title="Active Catalog SKUs"
            value={filteredInventory.length}
            subtitle={`${totalItemsCount} total garment units`}
            icon={<Inventory2 />}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <AtelierKpiCard
            title="Low Stock Warning"
            value={lowStockCount}
            subtitle="Pieces with under 2 units remaining"
            icon={<Warning />}
            color={lowStockCount > 0 ? "warning" : "success"}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <AtelierKpiCard
            title="Slow Moving SKUs"
            value={slowMovingItems.length}
            subtitle="Zero customer sales in past 90 days"
            icon={<TrendingDown />}
            color={slowMovingItems.length > 0 ? "error" : "success"}
          />
        </Grid>
      </Grid>

      {/* Stock Subtabs & Container */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3.5,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          boxShadow: '0 4px 20px -4px rgba(var(--primary-rgb, 15, 118, 110), 0.08)'
        }}
      >
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2, pt: 1, bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.02)' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => { setActiveTab(val); setPage(0); }}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                minHeight: 48,
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: (t) => t.palette.primary.main
                }
              },
              '& .MuiTabs-indicator': {
                backgroundcolor: (t) => t.palette.primary.main,
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab icon={<ListAlt sx={{ fontSize: 18 }} />} iconPosition="start" label="Stock Audit & Valuation" />
            <Tab icon={<History sx={{ fontSize: 18 }} />} iconPosition="start" label={`Movement History (${sortedLogs.length})`} />
            <Tab icon={<TrendingDown sx={{ fontSize: 18 }} />} iconPosition="start" label={`Slow Moving Aging (${slowMovingItems.length})`} />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* TAB 0: Current Stock Valuation */}
          {activeTab === 0 && (
            <>
              {/* Filter Row */}
              <Box sx={{ p: 2, mb: 3, borderRadius: 2.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Garment Category"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {allCategories.map(cat => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Stock Threshold"
                      value={stockLevel}
                      onChange={(e) => setStockLevel(e.target.value)}
                    >
                      <MenuItem value="">All Stock Levels</MenuItem>
                      <MenuItem value="low">Low Stock (&lt; 2 units)</MenuItem>
                      <MenuItem value="medium">Medium Stock (2 - 20 units)</MenuItem>
                      <MenuItem value="high">High Stock (20+ units)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.5}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="From Added Date"
                      InputLabelProps={{ shrink: true }}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.5}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="To Added Date"
                      InputLabelProps={{ shrink: true }}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    {(categoryFilter || stockLevel || startDate || endDate) && (
                      <Button
                        size="small"
                        onClick={() => { setCategoryFilter(''); setStockLevel(''); setStartDate(''); setEndDate(''); }}
                        sx={{ color: '#DC2626', textTransform: 'none', fontWeight: 700 }}
                      >
                        Clear
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </Box>

              {/* Table */}
              <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Creations / Item Details</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Specs</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }} align="right">Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }} align="center">Stock Level</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }} align="right">Asset Valuation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                          No inventory items match your filter criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventory
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((item) => (
                          <TableRow key={item.id} hover sx={{ '&:hover': { bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.02)' } }}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {item.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                                SKU: #{formatSkuWithHyphen(item.productId || item.id || '')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.category || 'General'}
                                size="small"
                                sx={{ bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)', color: (t) => t.palette.primary.main, fontWeight: 700, fontSize: '0.72rem' }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                              {item.size || 'Free Size'} {item.color ? `• ${item.color}` : ''}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              ₹{item.price?.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${item.quantity} in stock`}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: '0.72rem',
                                  bgcolor: item.quantity < 2 ? 'rgba(220, 38, 38, 0.1)' : item.quantity < 20 ? 'rgba(217, 119, 6, 0.1)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)',
                                  color: item.quantity < 2 ? '#DC2626' : item.quantity < 20 ? '#D97706' : '#0F766E'
                                }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, fontSize: '0.95rem' }}>
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
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
                count={filteredInventory.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ borderTop: '1px solid', borderColor: 'divider' }}
              />
            </>
          )}

          {/* TAB 1: Movement History Logs */}
          {activeTab === 1 && (
            <>
              <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Timestamp</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Garment Product</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }} align="center">Adjustment</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }} align="center">Updated Stock</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Reason / Operational Note</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                          No inventory movement logs recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedLogs
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((log) => (
                          <TableRow key={log.id} hover sx={{ '&:hover': { bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.02)' } }}>
                            <TableCell sx={{ fontSize: '0.825rem' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {new Date(log.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {log.productName}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${log.change > 0 ? '+' : ''}${log.change}`}
                                size="small"
                                sx={{
                                  bgcolor: log.change > 0 ? 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                  color: log.change > 0 ? '#0F766E' : '#DC2626',
                                  fontWeight: 800,
                                  fontSize: '0.75rem'
                                }}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800 }}>
                              {log.newQuantity} units
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>
                              {log.reason || 'Standard Inventory Adjustment'}
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
                count={sortedLogs.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ borderTop: '1px solid', borderColor: 'divider' }}
              />
            </>
          )}

          {/* TAB 2: Slow Moving & Aging Items */}
          {activeTab === 2 && (
            <>
              <Box sx={{ p: 2, mb: 3, borderRadius: 2.5, bgcolor: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.2)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Warning sx={{ color: '#D97706' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#B45309' }}>
                  Audited Aging SKUs: The following items have had ZERO client sales registered in the past 90 days. Consider promotional discounts or bundle packages.
                </Typography>
              </Box>

              <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Creations / Item Details</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }} align="center">Current Stock</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }} align="right">Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.primary' }} align="right">Tied-Up Capital</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {slowMovingItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                          Outstanding! No slow-moving inventory found in the 90-day window.
                        </TableCell>
                      </TableRow>
                    ) : (
                      slowMovingItems.map((item) => (
                        <TableRow key={item.id} hover sx={{ '&:hover': { bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.02)' } }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                              SKU #{formatSkuWithHyphen(item.productId || item.id || '')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.category || 'General'}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.72rem' }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${item.quantity} units`}
                              size="small"
                              sx={{ bgcolor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', fontWeight: 800, fontSize: '0.72rem' }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            ₹{item.price?.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, fontSize: '0.95rem' }}>
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default InventoryReports;
