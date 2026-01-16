import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow, MenuItem, TableContainer, Card, CardContent, Grid, Chip, useMediaQuery, useTheme, Divider } from '@mui/material';
import { useData } from '../contexts/DataContext';
import { Download, Inventory2, Warning, TrendingUp, AttachMoney } from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const InventoryReports = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { inventory, profile } = useData();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockLevel, setStockLevel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const allCategories = [...new Set(inventory.map(item => item.category))];

  const filteredInventory = inventory.filter(item => {
    const categoryMatch = categoryFilter === '' || item.category === categoryFilter;
    const stockMatch = stockLevel === '' ||
      (stockLevel === 'low' && item.quantity < 10) ||
      (stockLevel === 'medium' && item.quantity >= 10 && item.quantity < 50) ||
      (stockLevel === 'high' && item.quantity >= 50);

    // Date filtering logic with fallback
    const itemDate = item.dateAdded ? new Date(item.dateAdded) : (isNaN(item.id) ? new Date() : new Date(parseInt(item.id)));
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const dateMatch = (!start || itemDate >= start) && (!end || itemDate <= end);

    return categoryMatch && stockMatch && dateMatch;
  });

  const totalValue = filteredInventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lowStockCount = filteredInventory.filter(item => item.quantity < 10).length;
  const totalItems = filteredInventory.length;
  const totalProfit = filteredInventory.reduce((sum, item) => sum + ((item.price - (item.cost || 0)) * item.quantity), 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`${profile.businessName} - Inventory Report`, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    if (startDate || endDate) {
      doc.text(`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`, 20, 30);
    }
    doc.text(`Total Items: ${filteredInventory.length}`, 20, 35);
    doc.text(`Total Value: ₹${totalValue.toFixed(2)}`, 20, 42);
    doc.text(`Low Stock Items: ${lowStockCount}`, 20, 49);
    const tableData = filteredInventory.map(item => [
      item.name,
      item.category,
      item.size,
      item.color,
      `₹${item.price}`,
      item.quantity,
      item.dateAdded ? new Date(item.dateAdded).toLocaleDateString() : 'N/A'
    ]);
    autoTable(doc, {
      startY: 60,
      head: [['Name', 'Category', 'Size', 'Color', 'Price', 'Stock', 'Added Date']],
      body: tableData
    });
    doc.save('inventory-report.pdf');
  };

  const exportCSV = () => {
    const headers = ['Name', 'Category', 'Size', 'Color', 'Price', 'Quantity', 'Supplier'];
    const rows = filteredInventory.map(item => [
      item.name, item.category, item.size, item.color, item.price, item.quantity, item.supplier
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-report.csv';
    a.click();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>Inventory Reports</Typography>
          <Typography variant="body2" color="text.secondary">Analyze your stock levels and inventory value</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={exportPDF}
            sx={{
              background: 'linear-gradient(135deg, #880e4f 0%, #ad1457 100%)',
              borderRadius: '8px',
              fontWeight: 700,
              textTransform: 'none'
            }}
          >
            PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportCSV}
            sx={{ borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
          >
            CSV
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 4, border: 'none', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: 'primary.main' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Items</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>{totalItems}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(136, 14, 79, 0.05)', color: 'primary.main' }}>
                  <Inventory2 />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 4, border: 'none', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#2e7d32' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Value</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(46, 125, 50, 0.05)', color: '#2e7d32' }}>
                  <AttachMoney />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 4, border: 'none', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#f57f17' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low Stock</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#f57f17', mt: 0.5 }}>{lowStockCount}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(245, 127, 23, 0.05)', color: '#f57f17' }}>
                  <Warning />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 4, border: 'none', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#ad1457' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Margin</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#ad1457', mt: 0.5 }}>₹{totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(173, 20, 87, 0.05)', color: '#ad1457' }}>
                  <TrendingUp />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Filters</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap' }}>
          <TextField select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} sx={{ flex: 1, minWidth: 150 }}>
            <MenuItem value="">All Categories</MenuItem>
            {allCategories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </TextField>
          <TextField select label="Stock Level" value={stockLevel} onChange={(e) => setStockLevel(e.target.value)} sx={{ flex: 1, minWidth: 150 }}>
            <MenuItem value="">All Levels</MenuItem>
            <MenuItem value="low">Low (&lt;10)</MenuItem>
            <MenuItem value="medium">Medium (10-49)</MenuItem>
            <MenuItem value="high">High (≥50)</MenuItem>
          </TextField>
          <TextField
            label="From Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1, minWidth: 150 }}
          />
          <TextField
            label="To Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1, minWidth: 150 }}
          />
          <Button variant="outlined" onClick={() => { setCategoryFilter(''); setStockLevel(''); setStartDate(''); setEndDate(''); }}>Clear</Button>
        </Box>
      </Paper>

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredInventory.map((item) => (
            <Card key={item.id} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>{item.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                      <Chip label={item.category} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(136, 14, 79, 0.05)', color: 'primary.main' }} />
                      <Typography variant="caption" color="text.secondary">{item.size} • {item.color}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Date Added</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {item.dateAdded ? new Date(item.dateAdded).toLocaleDateString() : (isNaN(item.id) ? new Date().toLocaleDateString() : new Date(parseInt(item.id)).toLocaleDateString())}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Stock Status</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, justifyContent: 'flex-end' }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.quantity < 10 ? '#ef4444' : item.quantity < 50 ? '#f59e0b' : '#10b981' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.quantity} Units</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
          {filteredInventory.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: 'rgba(0,0,0,0.02)' }}>
              <Typography color="text.secondary">No items found matching filters</Typography>
            </Paper>
          )}
        </Box>
      ) : (
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(136, 14, 79, 0.02)', borderBottom: '2px solid rgba(136, 14, 79, 0.1)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product Details</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Added</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price & Stock</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInventory.map((item) => {
                  const itemDate = item.dateAdded ? new Date(item.dateAdded) : (isNaN(item.id) ? new Date() : new Date(parseInt(item.id)));
                  return (
                    <TableRow key={item.id} sx={{ '&:hover': { bgcolor: 'rgba(136, 14, 79, 0.02)' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                          <Chip label={item.category} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(136, 14, 79, 0.05)', color: 'primary.main' }} />
                          <Typography variant="caption" color="text.secondary">{item.size} • {item.color}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {itemDate.toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{item.price}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.quantity < 10 ? '#ef4444' : item.quantity < 50 ? '#f59e0b' : '#10b981' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{item.quantity} Units</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default InventoryReports;
