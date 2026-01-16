import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow, IconButton, MenuItem, Paper, Typography, TableContainer, Chip, Card, CardContent, Grid, Tooltip, useTheme, useMediaQuery, Divider } from '@mui/material';
import { Edit, Delete, Add, Search, Inventory2, TrendingUp, Warning } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';

const Inventory = () => {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, categories, updateCategories } = useData();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [form, setForm] = useState({
    name: '', category: '', size: '', color: '', price: '', cost: '', quantity: '', supplier: ''
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lowStockItems = inventory.filter(item => item.quantity < 10).length;
  const totalProfit = inventory.reduce((sum, item) => sum + ((item.price - (item.cost || 0)) * item.quantity), 0);



  const handleAddCategory = async () => {
    if (newCategory && !categories.includes(newCategory)) {
      const updated = [...categories, newCategory];
      await updateCategories(updated);
      setForm({ ...form, category: newCategory });
      setNewCategory('');
    }
  };

  const handleOpen = (item = null) => {
    if (item) {
      setEditItem(item);
      setForm(item);
    } else {
      setEditItem(null);
      setForm({ name: '', category: '', size: '', color: '', price: '', cost: '', quantity: '', supplier: '' });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    const data = { ...form, price: parseFloat(form.price), cost: parseFloat(form.cost || 0), quantity: parseInt(form.quantity) };
    if (editItem) {
      await updateInventoryItem(editItem.id, data);
    } else {
      await addInventoryItem(data);
    }
    setOpen(false);
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) &&
    (categoryFilter === '' || item.category === categoryFilter)
  );

  return (
    <Box>
      {/* Header with Stats */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>Inventory Management</Typography>
            <Typography variant="body2" color="text.secondary">Manage your products and stock levels</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            size="large"
            sx={{
              px: 4,
              py: 1.25,
              background: 'linear-gradient(135deg, #880e4f 0%, #ad1457 100%)',
              boxShadow: '0 4px 12px rgba(136, 14, 79, 0.2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #ad1457 0%, #880e4f 100%)',
                boxShadow: '0 6px 16px rgba(136, 14, 79, 0.3)',
              },
              borderRadius: '8px',
              fontWeight: 700,
              textTransform: 'none'
            }}
          >
            Add Product
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3}>
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
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>₹{totalValue.toLocaleString('en-IN')}</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(46, 125, 50, 0.05)', color: '#2e7d32' }}>
                    <TrendingUp />
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
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#c62828', mt: 0.5 }}>{lowStockItems}</Typography>
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
              <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: 'secondary.main' }} />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Margin</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>₹{totalProfit.toLocaleString('en-IN')}</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(245, 127, 23, 0.05)', color: 'secondary.main' }}>
                    <TrendingUp />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
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

      {/* Inventory List (Mobile) or Table (Desktop) */}
      {isMobile ? (
        <Box>
          {filteredInventory.map((item) => {
            const profit = (item.price - (item.cost || 0));
            const profitMargin = item.cost ? ((profit / item.price) * 100).toFixed(1) : 0;
            return (
              <Card key={item.id} sx={{ mb: 2, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.supplier || 'No Supplier'}
                      </Typography>
                    </Box>
                    <Chip
                      label={item.category}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(136, 14, 79, 0.05)',
                        color: 'primary.main',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 20
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Size: {item.size || 'N/A'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Color:</Typography>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color?.toLowerCase() || 'transparent', border: '1px solid rgba(0,0,0,0.1)' }} />
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 1.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        ₹{item.price}
                      </Typography>
                      <Typography variant="caption" sx={{ color: profit > 0 ? '#1b5e20' : '#c62828' }}>
                        Margin: {profitMargin}%
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: item.quantity < 10 ? '#ef4444' : item.quantity < 50 ? '#f59e0b' : '#10b981' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.quantity}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">Stock</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleOpen(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => deleteInventoryItem(item.id)}
                    >
                      Delete
                    </Button>
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
              <TableHead sx={{ bgcolor: 'rgba(136, 14, 79, 0.02)', borderBottom: '2px solid rgba(136, 14, 79, 0.1)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product Details</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', sm: 'table-cell' } }}>Category</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', md: 'table-cell' } }}>Variants</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cost & Price</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Margin</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInventory.map((item, idx) => {
                  const profit = (item.price - (item.cost || 0));
                  const profitMargin = item.cost ? ((profit / item.price) * 100).toFixed(1) : 0;
                  return (
                    <TableRow
                      key={item.id}
                      sx={{
                        '&:hover': { bgcolor: 'rgba(136, 14, 79, 0.02)' },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.supplier || 'No Supplier'}</Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Chip
                          label={item.category}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(136, 14, 79, 0.05)',
                            color: 'primary.main',
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            textTransform: 'uppercase',
                            borderRadius: 1
                          }}
                        />
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
                        <Typography variant="body2" sx={{ fontWeight: 700, color: profit > 0 ? '#1b5e20' : '#c62828' }}>
                          ₹{profit.toFixed(0)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: profit > 0 ? '#1b5e20' : '#c62828', opacity: 0.8 }}>
                          {profitMargin}% margin
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: item.quantity < 10 ? '#ef4444' : item.quantity < 50 ? '#f59e0b' : '#10b981'
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.quantity} Units</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpen(item)}
                            sx={{
                              color: 'primary.main',
                              bgcolor: 'rgba(136, 14, 79, 0.05)',
                              '&:hover': { bgcolor: 'rgba(136, 14, 79, 0.1)' }
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => deleteInventoryItem(item.id)}
                            sx={{
                              color: 'error.main',
                              bgcolor: 'rgba(198, 40, 40, 0.05)',
                              '&:hover': { bgcolor: 'rgba(198, 40, 40, 0.1)' }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 800, fontSize: '1.1rem', py: 2.5 }}>
          {editItem ? 'Edit Product Details' : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="normal" />
          <TextField select fullWidth label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} margin="normal">
            {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField
              size="small"
              label="Add New Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              fullWidth
            />
            <Button onClick={handleAddCategory} variant="outlined" size="small">Add</Button>
          </Box>
          <TextField fullWidth label="Size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} margin="normal" />
          <TextField fullWidth label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} margin="normal" />
          <TextField fullWidth label="Cost Price (₹)" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} margin="normal" helperText="Purchase/manufacturing cost" />
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
    </Box>
  );
};

export default Inventory;
