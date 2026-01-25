import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow, IconButton, MenuItem, Paper, Typography, TableContainer, Chip, Card, CardContent, Grid, Tooltip, useTheme, useMediaQuery, Divider, TablePagination } from '@mui/material';
import { Edit, Delete, Add, Search, Inventory2, TrendingUp, Warning, AttachMoney, Download } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

const Inventory = () => {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, categories, updateCategories } = useData();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [form, setForm] = useState({
    productId: '', name: '', category: '', size: '', color: '', price: '', cost: '', quantity: '', supplier: ''
  });
  const [deleteId, setDeleteId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lowStockItems = inventory.filter(item => item.quantity < 2).length;
  const totalProfit = inventory.reduce((sum, item) => sum + ((item.price - (item.cost || 0)) * item.quantity), 0);

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      updateCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const downloadInventory = () => {
    const csvData = filteredInventory.map(item => ({
      'Product ID': item.productId || '',
      'Name': item.name,
      'Category': item.category,
      'Size': item.size || '',
      'Color': item.color || '',
      'Cost Price': item.cost || 0,
      'Selling Price': item.price,
      'Quantity': item.quantity,
      'Supplier': item.supplier || '',
      'Profit Margin': item.cost ? (((item.price - item.cost) / item.price) * 100).toFixed(1) + '%' : '0%'
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleOpen = (item = null) => {
    if (item) {
      setEditItem(item);
      setForm(item);
    } else {
      setEditItem(null);
      setForm({ productId: '', name: '', category: '', size: '', color: '', price: '', cost: '', quantity: '', supplier: '' });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    const productId = form.productId.trim() || `PRD-${Date.now()}`;
    const data = { ...form, productId, price: parseFloat(form.price), cost: parseFloat(form.cost || 0), quantity: parseInt(form.quantity) };
    if (editItem) {
      await updateInventoryItem(editItem.id, data);
    } else {
      await addInventoryItem(data);
    }
    setOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteInventoryItem(deleteId);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const openDeleteDialog = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) &&
    (categoryFilter === '' || item.category === categoryFilter)
  );

  return (
    <Box>
      {/* Header with Stats */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>Inventory Management</Typography>
            <Typography variant="body2" color="text.secondary">Manage your products and stock levels</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={downloadInventory}
              sx={{ px: 3, py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpen()}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                px: { xs: 2, sm: 4 },
                py: 1.5,
                borderRadius: 2,
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #d97706 0%, #f97316 100%)',
                boxShadow: `0 4px 12px ${theme.palette.primary.main}33`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
                  boxShadow: `0 6px 16px ${theme.palette.primary.main}4D`,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Add Product
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              borderRadius: 4, position: 'relative', overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(183, 110, 121, 0.15)',
              border: '1px solid rgba(183, 110, 121, 0.15)',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(183, 110, 121, 0.05) 100%)`,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px -10px rgba(183, 110, 121, 0.3)' }
            }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: 'primary.main' }} />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Items</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>{totalItems}</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'primary.light', color: 'primary.main' }}>
                    <Inventory2 />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              borderRadius: 4, position: 'relative', overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(46, 125, 50, 0.15)',
              border: '1px solid rgba(46, 125, 50, 0.15)',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(46, 125, 50, 0.05) 100%)`,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px -10px rgba(46, 125, 50, 0.3)' }
            }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#2e7d32' }} />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Value</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>₹{totalValue.toLocaleString('en-IN')}</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(46, 125, 50, 0.05)', color: '#2e7d32' }}>
                    <AttachMoney />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              borderRadius: 4, position: 'relative', overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(245, 127, 23, 0.15)',
              border: '1px solid rgba(245, 127, 23, 0.15)',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(245, 127, 23, 0.05) 100%)`,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px -10px rgba(245, 127, 23, 0.3)' }
            }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#f57f17' }} />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low Stock</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#f57f17', mt: 0.5 }}>{lowStockItems}</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(245, 127, 23, 0.05)', color: '#f57f17' }}>
                    <Warning />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              borderRadius: 4, position: 'relative', overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(219, 39, 119, 0.15)',
              border: '1px solid rgba(219, 39, 119, 0.15)',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(219, 39, 119, 0.05) 100%)`,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px -10px rgba(219, 39, 119, 0.3)' }
            }}>
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#DB2777' }} />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Margin</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>₹{totalProfit.toLocaleString('en-IN')}</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(219, 39, 119, 0.05)', color: '#DB2777' }}>
                    <TrendingUp />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(183, 110, 121, 0.08)', border: '1px solid rgba(183, 110, 121, 0.1)' }}>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, bgcolor: 'grey.50', borderRadius: 2, px: 2 }}>
            <Search sx={{ color: 'text.secondary' }} />
            <TextField
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              variant="standard"
              fullWidth
              InputProps={{ disableUnderline: true }}
            />
          </Box>
          <TextField
            select
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </TextField>
        </Box>
      </Paper>

      {/* Inventory List */}
      {isMobile ? (
        <Box>
          {filteredInventory.map((item) => {
            const profit = (item.price - (item.cost || 0));
            const profitMargin = item.cost ? ((profit / item.price) * 100).toFixed(1) : 0;
            return (
              <Card key={item.id} sx={{
                mb: 2, borderRadius: 3,
                boxShadow: '0 10px 15px -3px rgba(183, 110, 121, 0.1)',
                border: '1px solid rgba(183, 110, 121, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 20px 25px -5px rgba(183, 110, 121, 0.15)' }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>ID: {item.productId || 'N/A'}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.supplier || 'No Supplier'}</Typography>
                    </Box>
                    <Chip label={item.category} size="small" sx={{ bgcolor: 'rgba(136, 14, 79, 0.05)', color: 'primary.main', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Size: {item.size || 'N/A'}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Color:</Typography>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color?.toLowerCase() || 'transparent', border: '1px solid rgba(0,0,0,0.1)' }} />
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>₹{item.price}</Typography>
                      <Typography variant="caption" sx={{ color: profit > 0 ? '#1b5e20' : '#c62828' }}>Margin: {profitMargin}%</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: item.quantity < 2 ? '#ef4444' : item.quantity < 50 ? '#f59e0b' : '#10b981' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.quantity}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">Stock</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button fullWidth variant="outlined" color="primary" size="small" startIcon={<Edit />} onClick={() => handleOpen(item)}>Edit</Button>
                    <Button fullWidth variant="outlined" color="error" size="small" startIcon={<Delete />} onClick={() => openDeleteDialog(item.id)}>Delete</Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ) : (
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Product ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Product Details</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }}>Variant</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Cost & Price</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Margin</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Inventory</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0 ? filteredInventory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : filteredInventory).map((item) => {
                  const profit = (item.price - (item.cost || 0));
                  const profitMargin = item.cost ? ((profit / item.price) * 100).toFixed(1) : 0;
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontFamily: 'monospace' }}>{item.productId || 'N/A'}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.supplier || 'No Supplier'}</Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Chip label={item.category} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', borderRadius: 1 }} />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{item.size}</Typography>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color.toLowerCase(), border: '1px solid rgba(0,0,0,0.1)' }} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{item.price}</Typography>
                          <Typography variant="caption" color="text.secondary">Cost: ₹{item.cost || 0}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: profit > 0 ? '#1b5e20' : '#c62828' }}>₹{profit.toFixed(0)}</Typography>
                        <Typography variant="caption" sx={{ color: profit > 0 ? '#1b5e20' : '#c62828', opacity: 0.8 }}>{profitMargin}% margin</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.quantity < 2 ? '#ef4444' : item.quantity < 50 ? '#f59e0b' : '#10b981' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.quantity} Units</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <IconButton size="small" onClick={() => handleOpen(item)} sx={{ color: 'primary.main' }}><Edit fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => openDeleteDialog(item.id)} sx={{ color: 'error.main' }}><Delete fontSize="small" /></IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredInventory.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} />
        </Paper>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 800, fontSize: '1.1rem', py: 2.5 }}>
          {editItem ? 'Edit Product Details' : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField fullWidth label="Product ID" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} margin="normal" helperText="Leave empty to auto-generate" />
          <TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="normal" />
          <TextField select fullWidth label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} margin="normal">
            {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField size="small" label="Add New Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()} fullWidth />
            <Button onClick={handleAddCategory} variant="outlined" size="small">Add</Button>
          </Box>
          <TextField fullWidth label="Size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} margin="normal" />
          <TextField fullWidth label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} margin="normal" />
          <TextField fullWidth label="Cost Price (₹)" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} margin="normal" />
          <TextField fullWidth label="Selling Price (₹)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} margin="normal" />
          {form.price && form.cost && (
            <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 'bold' }}>
              Profit: ₹{(parseFloat(form.price) - parseFloat(form.cost)).toFixed(2)} ({(((parseFloat(form.price) - parseFloat(form.cost)) / parseFloat(form.price)) * 100).toFixed(1)}%)
            </Typography>
          )}
          <TextField fullWidth label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} margin="normal" />
          <TextField fullWidth label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        content="Are you sure you want to delete this product? This action will remove it from inventory."
      />
    </Box>
  );
};

export default Inventory;
