import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  MenuItem,
  Paper,
  Typography,
  TableContainer,
  Chip,
  Grid,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
  TablePagination,
  TableSortLabel,
  Switch,
  InputAdornment,
  Stack,
  CardContent,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Search,
  Inventory2,
  TrendingUp,
  Warning,
  AttachMoney,
  Download,
  Upload,
  QrCode,
  Layers,
  Checkroom,
  Straighten,
  LocalOffer,
  Close,
  CheckCircle,
  RestartAlt,
  FilterList,
  GridView,
  ViewList
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import { TableSkeleton } from '../components/crm/AtelierSkeleton';
import Papa from 'papaparse';

const SIZE_PRESETS = ['Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Unstitched', 'Semi-Stitched'];

const COLOR_PRESETS = [
  { name: 'Emerald', hex: '#0F766E' },
  { name: 'Gold', hex: '#D97706' },
  { name: 'Ruby', hex: '#DC2626' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Wine', hex: '#831843' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Ivory', hex: '#FEF3C7' },
  { name: 'Black', hex: '#111827' },
  { name: 'Multi', hex: '#8B5CF6' }
];

const Inventory = () => {
  const { user } = useAuth();
  const {
    inventory = [],
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    bulkAddInventory,
    categories = [],
    updateCategories,
    loading
  } = useData();

  const safeCategories = Array.isArray(categories) && categories.length > 0
    ? categories
    : ['Sarees', 'Kurtis', 'Lehenga', 'Salwar Suits', 'Dupattas', 'Blouses'];

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low_or_out', 'low', 'out', 'in', 'surplus'
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    name: '',
    category: 'Sarees',
    size: 'Free Size',
    color: 'Emerald',
    price: '',
    cost: '',
    quantity: 10,
    minStockLevel: 2,
    supplier: '',
    hasVariants: false,
    variants: []
  });
  const [deleteId, setDeleteId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(0);
  }, [search, categoryFilter, stockFilter]);

  // Sorting State
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 900 ? 'cards' : 'table'));

  // Safe numerical KPIs & Stock Counts
  const totalItems = inventory?.length || 0;
  const totalValue = (inventory || []).reduce((sum, item) => sum + ((Number(item?.price) || 0) * (Number(item?.quantity) || 0)), 0);
  const totalUnits = (inventory || []).reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);

  const lowStockCount = (inventory || []).filter(item => {
    const qty = Number(item?.quantity) || 0;
    const min = Number(item?.minStockLevel) || 2;
    return qty > 0 && qty <= min;
  }).length;

  const outOfStockCount = (inventory || []).filter(item => (Number(item?.quantity) || 0) <= 0).length;
  const lowOrOutCount = lowStockCount + outOfStockCount;

  const inStockCount = (inventory || []).filter(item => {
    const qty = Number(item?.quantity) || 0;
    const min = Number(item?.minStockLevel) || 2;
    return qty > min;
  }).length;

  const surplusCount = (inventory || []).filter(item => (Number(item?.quantity) || 0) >= 10).length;

  const totalProfit = (inventory || []).reduce((sum, item) => sum + (((Number(item?.price) || 0) - (Number(item?.cost) || 0)) * (Number(item?.quantity) || 0)), 0);

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !safeCategories.includes(trimmed)) {
      if (updateCategories) updateCategories([...safeCategories, trimmed]);
      setForm(prev => ({ ...prev, category: trimmed }));
      setNewCategory('');
      setShowNewCategoryInput(false);
    }
  };

  const handleAutoGenerateSku = () => {
    const cat = form.category ? form.category.slice(0, 3).toUpperCase() : 'ALN';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setForm(prev => ({ ...prev, productId: `${cat}-${rand}` }));
  };

  const handleOpen = (item = null) => {
    setShowNewCategoryInput(false);
    if (item) {
      setEditItem(item);
      setForm({
        productId: item.productId || '',
        name: item.name || '',
        category: item.category || safeCategories[0] || 'Sarees',
        size: item.size || 'Free Size',
        color: item.color || 'Emerald',
        price: item.price !== undefined ? item.price : '',
        cost: item.cost !== undefined ? item.cost : '',
        quantity: item.quantity !== undefined ? item.quantity : 10,
        minStockLevel: item.minStockLevel !== undefined ? item.minStockLevel : 2,
        supplier: item.supplier || '',
        hasVariants: item.hasVariants || false,
        variants: item.variants || []
      });
    } else {
      setEditItem(null);
      setForm({
        productId: '',
        name: '',
        category: safeCategories[0] || 'Sarees',
        size: 'Free Size',
        color: 'Emerald',
        price: '',
        cost: '',
        quantity: 10,
        minStockLevel: 2,
        supplier: '',
        hasVariants: false,
        variants: []
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    const productId = form.productId.trim() || `PRD-${Date.now()}`;

    // Validate variants if enabled
    if (form.hasVariants && (!form.variants || form.variants.length === 0)) {
      alert("Please add at least one variant");
      return;
    }

    const data = {
      ...form,
      productId,
      price: parseFloat(form.price) || 0,
      cost: parseFloat(form.cost || 0),
      quantity: form.hasVariants
        ? (form.variants || []).reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0)
        : parseInt(form.quantity) || 0
    };

    if (editItem) {
      await updateInventoryItem(editItem.id, data);
    } else {
      await addInventoryItem(data);
    }
    setOpen(false);
  };

  const addVariant = () => {
    const sku = `${form.productId || 'PRD'}-${(form.variants || []).length + 1}`;
    setForm(prev => ({
      ...prev,
      variants: [...(prev.variants || []), { sku, size: prev.size || 'Free Size', color: prev.color || 'Std', quantity: 5, minStockLevel: 2, price: prev.price || 0 }]
    }));
  };

  const removeVariant = (index) => {
    setForm(prev => {
      const newVariants = [...(prev.variants || [])];
      newVariants.splice(index, 1);
      return { ...prev, variants: newVariants };
    });
  };

  const updateVariant = (index, field, value) => {
    setForm(prev => {
      const newVariants = [...(prev.variants || [])];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
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

  const downloadInventory = () => {
    const csvData = filteredInventory.map(item => {
      const row = {
        'Product ID': item.productId || '',
        'Name': item.name || '',
        'Category': item.category || '',
        'Size': item.size || '',
        'Color': item.color || '',
        'Selling Price': item.price || 0,
        'Quantity': item.quantity || 0,
        'Supplier': item.supplier || '',
      };
      if (user?.role === 'admin') {
        const cost = Number(item.cost) || 0;
        const price = Number(item.price) || 0;
        row['Cost Price'] = cost;
        row['Profit Margin'] = (cost > 0 && price > 0) ? (((price - cost) / price) * 100).toFixed(1) + '%' : '0%';
      }
      return row;
    });

    if (csvData.length === 0) {
      alert("No inventory to export");
      return;
    }

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const items = results.data.filter(row => row.name && row.price).map(row => ({
            productId: row['Product ID'] || `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: row.name,
            category: row.category || 'General',
            size: row.size || '',
            color: row.color || '',
            price: parseFloat(row['selling price'] || row.price) || 0,
            cost: parseFloat(row['cost price'] || row.cost) || 0,
            quantity: parseInt(row.quantity) || 0,
            supplier: row.supplier || '',
            hasVariants: false,
            variants: []
          }));

          if (items.length > 0) {
            await bulkAddInventory(items);
            alert(`Successfully imported ${items.length} items`);
          } else {
            alert('No valid items found in CSV');
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Failed to parse CSV file');
        }
      });
    }
  };

  // Safe search & filtering: memoized for 5,000+ item performance
  const filteredInventory = React.useMemo(() => {
    const q = String(search || '').toLowerCase().trim();
    return (inventory || []).filter(item => {
      if (!item) return false;
      const name = String(item.name || '').toLowerCase();
      const pId = String(item.productId || '').toLowerCase();
      const supp = String(item.supplier || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || pId.includes(q) || supp.includes(q);
      const matchesCategory = !categoryFilter || item.category === categoryFilter;

      // Stock Level Filter
      let matchesStock = true;
      const qty = Number(item.quantity) || 0;
      const minLvl = Number(item.minStockLevel) || 2;

      if (stockFilter === 'low_or_out') {
        matchesStock = qty <= minLvl;
      } else if (stockFilter === 'low') {
        matchesStock = qty > 0 && qty <= minLvl;
      } else if (stockFilter === 'out') {
        matchesStock = qty <= 0;
      } else if (stockFilter === 'in') {
        matchesStock = qty > minLvl;
      } else if (stockFilter === 'surplus') {
        matchesStock = qty >= 10;
      }

      return matchesSearch && matchesCategory && matchesStock;
    }).sort((a, b) => {
      const isAsc = order === 'asc';
      if (orderBy === 'price' || orderBy === 'quantity') {
        const valA = Number(a[orderBy]) || 0;
        const valB = Number(b[orderBy]) || 0;
        return isAsc ? (valA - valB) : (valB - valA);
      }
      const valA = String(a[orderBy] || '').toLowerCase();
      const valB = String(b[orderBy] || '').toLowerCase();
      return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [inventory, search, categoryFilter, stockFilter, orderBy, order]);

  // Highlight stock units based on quantity & threshold
  const renderStockBadge = (quantity, minStockLevel = 2) => {
    const qty = Number(quantity) || 0;
    const minLvl = Number(minStockLevel) || 2;

    if (qty <= 0) {
      return (
        <Tooltip title="Out of stock! Urgent replenishment required.">
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.25,
            py: 0.45,
            borderRadius: '16px',
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#DC2626',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#DC2626', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
              0 Units • Out of Stock
            </Typography>
          </Box>
        </Tooltip>
      );
    }

    if (qty <= minLvl) {
      return (
        <Tooltip title={`Low Stock Warning: Only ${qty} remaining in atelier (Min threshold: ${minLvl})`}>
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.25,
            py: 0.45,
            borderRadius: '16px',
            bgcolor: 'rgba(217, 119, 6, 0.12)',
            border: '1px solid rgba(217, 119, 6, 0.35)',
            color: '#B45309',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#D97706', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
              {qty} {qty === 1 ? 'Unit' : 'Units'} • Low Stock
            </Typography>
          </Box>
        </Tooltip>
      );
    }

    if (qty <= 5) {
      return (
        <Tooltip title={`Moderate inventory: ${qty} units available`}>
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.25,
            py: 0.45,
            borderRadius: '16px',
            bgcolor: 'rgba(15, 118, 110, 0.08)',
            border: '1px solid rgba(15, 118, 110, 0.22)',
            color: '#0F766E',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#0F766E', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              {qty} Units • Moderate
            </Typography>
          </Box>
        </Tooltip>
      );
    }

    return (
      <Tooltip title={`Well-stocked: ${qty} units available in atelier`}>
        <Box sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.45,
          borderRadius: '16px',
          bgcolor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.28)',
          color: '#059669',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
            {qty} Units • In Stock
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  const isFiltered = Boolean(search || categoryFilter || stockFilter !== 'all');
  const filteredTotalValue = filteredInventory.reduce((sum, item) => sum + ((Number(item?.price) || 0) * (Number(item?.quantity) || 0)), 0);
  const filteredTotalUnits = filteredInventory.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);

  // Calculate profit and margin dynamically for the modal form
  const sellingPrice = parseFloat(form.price) || 0;
  const costPrice = parseFloat(form.cost) || 0;
  const profit = sellingPrice - costPrice;
  const marginPct = (sellingPrice > 0 && costPrice > 0) ? (((profit / sellingPrice) * 100).toFixed(1)) : '0.0';

  return (
    <Box>
      <PageHeader
        title="Inventory & Garments"
        subtitle="Track stock levels, size variants, costs, profit margins, and manage your luxury apparel catalog"
        breadcrumbs={[{ label: 'Aleen Clothing', path: '/' }, { label: 'Inventory' }]}
        actions={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload />}
              sx={{
                flex: { xs: 1, sm: 1, md: 'none' },
                borderRadius: 2,
                fontWeight: 700,
                fontSize: { xs: '0.75rem', sm: '0.82rem' },
                whiteSpace: 'nowrap'
              }}
            >
              Import CSV
              <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={downloadInventory}
              sx={{
                flex: { xs: 1, sm: 1, md: 'none' },
                borderRadius: 2,
                fontWeight: 700,
                fontSize: { xs: '0.75rem', sm: '0.82rem' },
                whiteSpace: 'nowrap'
              }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => handleOpen()}
              disabled={user?.role !== 'admin'}
              sx={{
                flex: { xs: '100%', sm: 1.2, md: 'none' },
                borderRadius: 2,
                fontWeight: 800,
                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(15,118,110,0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              Add Garment
            </Button>
          </Box>
        }
      />

      {/* KPI Cards: Responsive 2x2 Grid on Mobile, Tablet & iPad, 4 Columns on Desktop */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
        <Grid item xs={6} sm={6} md={6} lg={3}>
          <AtelierKpiCard
            title="Total Garments"
            value={totalItems}
            icon={<Inventory2 fontSize="small" />}
            subtitle={`${totalUnits.toLocaleString('en-IN')} physical units`}
            onClick={() => setStockFilter('all')}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={6} lg={3}>
          <AtelierKpiCard
            title="Portfolio Value"
            value={`₹${totalValue.toLocaleString('en-IN')}`}
            icon={<AttachMoney fontSize="small" />}
            subtitle="Estimated retail valuation"
            goldAccent={true}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={6} lg={3}>
          <AtelierKpiCard
            title="Low Stock Alerts"
            value={lowOrOutCount}
            icon={<Warning fontSize="small" />}
            subtitle={outOfStockCount > 0 ? `${outOfStockCount} out • ${lowStockCount} low` : 'Items below 2 units'}
            trend={lowOrOutCount > 0 ? `${lowOrOutCount} styles urgent` : 'Catalog healthy'}
            trendPositive={lowOrOutCount === 0}
            onClick={() => setStockFilter(prev => prev === 'low_or_out' ? 'all' : 'low_or_out')}
          />
        </Grid>
        {user?.role === 'admin' && (
          <Grid item xs={6} sm={6} md={6} lg={3}>
            <AtelierKpiCard
              title="Profit Margin"
              value={`₹${totalProfit.toLocaleString('en-IN')}`}
              icon={<TrendingUp fontSize="small" />}
              subtitle="Projected profit on inventory"
              trend={`${totalValue > 0 ? ((totalProfit / totalValue) * 100).toFixed(1) : 0}% margin`}
              trendPositive={true}
            />
          </Grid>
        )}
      </Grid>

      {/* Filter and Command Toolbar */}
      <GlassCard sx={{ p: { xs: 2, sm: 2.5 }, mb: 3, border: '1px solid rgba(15, 118, 110, 0.15)' }}>
        {/* Tier 1: Search & Controls Layout */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: { xs: 'stretch', lg: 'center' },
          gap: 1.5,
          mb: 2
        }}>
          {/* Search Bar */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search garments by name, SKU, or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#0F766E', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <Close sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
            sx={{
              flex: { lg: 2 },
              minWidth: { lg: 260 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#FFFFFF'
              }
            }}
          />

          {/* Controls Cluster */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            flex: { lg: 3 },
            width: { xs: '100%', lg: 'auto' }
          }}>
            {/* Collection Filter */}
            <TextField
              select
              fullWidth
              size="small"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{
                flex: { xs: '1 1 calc(50% - 6px)', sm: 1.5 },
                minWidth: { xs: 'auto', sm: 160 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#FFFFFF'
                }
              }}
            >
              <MenuItem value="">All Collections</MenuItem>
              {safeCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>

            {/* Sort Dropdown */}
            <TextField
              select
              fullWidth
              size="small"
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              sx={{
                flex: { xs: '1 1 calc(50% - 6px)', sm: 1.2 },
                minWidth: { xs: 'auto', sm: 130 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#FFFFFF'
                }
              }}
            >
              <MenuItem value="name">Sort: Name</MenuItem>
              <MenuItem value="quantity">Sort: Units</MenuItem>
              <MenuItem value="price">Sort: Price</MenuItem>
              <MenuItem value="productId">Sort: SKU</MenuItem>
              <MenuItem value="category">Sort: Collection</MenuItem>
            </TextField>

            {/* Asc/Desc, Reset, and View Mode cluster */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' }, justifyContent: 'space-between' }}>
              <Tooltip title={order === 'asc' ? 'Ascending Order' : 'Descending Order'}>
                <IconButton
                  size="small"
                  onClick={() => setOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    border: '1px solid rgba(15, 118, 110, 0.25)',
                    color: '#0F766E',
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(15, 118, 110, 0.1)' : 'rgba(15, 118, 110, 0.05)',
                    flexShrink: 0
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>
                    {order === 'asc' ? '↑' : '↓'}
                  </Typography>
                </IconButton>
              </Tooltip>

              <Button
                variant={isFiltered ? 'contained' : 'outlined'}
                size="small"
                onClick={() => { setSearch(''); setCategoryFilter(''); setStockFilter('all'); }}
                disabled={!isFiltered}
                startIcon={<RestartAlt fontSize="small" />}
                sx={{
                  borderRadius: 2,
                  height: 38,
                  px: 1.5,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  flex: { xs: 1, sm: 'none' },
                  ...(isFiltered ? {
                    background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                    color: '#ffffff'
                  } : {})
                }}
              >
                Reset
              </Button>

              {/* View Switcher: Cards vs Table */}
              <ToggleButtonGroup
                size="small"
                value={viewMode}
                exclusive
                onChange={(e, next) => next && setViewMode(next)}
                sx={{
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                  border: '1px solid rgba(15, 118, 110, 0.2)',
                  borderRadius: 2,
                  height: 38,
                  flexShrink: 0
                }}
              >
                <ToggleButton
                  value="cards"
                  title="Card Grid View"
                  sx={{
                    px: 1.25,
                    border: 'none',
                    '&.Mui-selected': { bgcolor: 'rgba(15, 118, 110, 0.15)', color: '#0F766E' }
                  }}
                >
                  <GridView sx={{ fontSize: 18 }} />
                </ToggleButton>
                <ToggleButton
                  value="table"
                  title="Table View"
                  sx={{
                    px: 1.25,
                    border: 'none',
                    '&.Mui-selected': { bgcolor: 'rgba(15, 118, 110, 0.15)', color: '#0F766E' }
                  }}
                >
                  <ViewList sx={{ fontSize: 18 }} />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Tier 2: Swipeable Touch Stock Filter Chips */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          py: 0.5,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 0.5, flexShrink: 0 }}>
            <FilterList sx={{ fontSize: 18, color: '#0F766E' }} />
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', fontSize: '0.7rem' }}>
              Stock Filter:
            </Typography>
          </Box>

          {/* All Garments */}
          <Chip
            label={`All (${totalItems})`}
            onClick={() => setStockFilter('all')}
            size="small"
            variant={stockFilter === 'all' ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              borderRadius: 2,
              cursor: 'pointer',
              flexShrink: 0,
              bgcolor: stockFilter === 'all' ? '#0F766E' : 'transparent',
              color: stockFilter === 'all' ? '#FFFFFF' : 'text.primary',
              borderColor: 'rgba(15, 118, 110, 0.25)',
              '&:hover': { bgcolor: stockFilter === 'all' ? '#0F766E' : 'rgba(15, 118, 110, 0.08)' }
            }}
          />

          {/* Urgent Restock */}
          <Chip
            label={`⚠️ Urgent Restock (${lowOrOutCount})`}
            onClick={() => setStockFilter('low_or_out')}
            size="small"
            variant={stockFilter === 'low_or_out' ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 800,
              fontSize: '0.75rem',
              borderRadius: 2,
              cursor: 'pointer',
              flexShrink: 0,
              bgcolor: stockFilter === 'low_or_out' ? '#D97706' : 'rgba(217, 119, 6, 0.08)',
              color: stockFilter === 'low_or_out' ? '#FFFFFF' : '#B45309',
              borderColor: 'rgba(217, 119, 6, 0.4)',
              '&:hover': { bgcolor: stockFilter === 'low_or_out' ? '#B45309' : 'rgba(217, 119, 6, 0.16)' }
            }}
          />

          {/* Out of Stock */}
          <Chip
            label={`🔴 Out of Stock (${outOfStockCount})`}
            onClick={() => setStockFilter('out')}
            size="small"
            variant={stockFilter === 'out' ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 800,
              fontSize: '0.75rem',
              borderRadius: 2,
              cursor: 'pointer',
              flexShrink: 0,
              bgcolor: stockFilter === 'out' ? '#DC2626' : 'rgba(239, 68, 68, 0.08)',
              color: stockFilter === 'out' ? '#FFFFFF' : '#DC2626',
              borderColor: 'rgba(239, 68, 68, 0.35)',
              '&:hover': { bgcolor: stockFilter === 'out' ? '#B91C1C' : 'rgba(239, 68, 68, 0.16)' }
            }}
          />

          {/* Low Stock */}
          <Chip
            label={`🟡 Low Stock (${lowStockCount})`}
            onClick={() => setStockFilter('low')}
            size="small"
            variant={stockFilter === 'low' ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              borderRadius: 2,
              cursor: 'pointer',
              flexShrink: 0,
              bgcolor: stockFilter === 'low' ? '#F59E0B' : 'rgba(245, 158, 11, 0.08)',
              color: stockFilter === 'low' ? '#FFFFFF' : '#D97706',
              borderColor: 'rgba(245, 158, 11, 0.35)',
              '&:hover': { bgcolor: stockFilter === 'low' ? '#D97706' : 'rgba(245, 158, 11, 0.16)' }
            }}
          />

          {/* In Stock */}
          <Chip
            label={`🟢 In Stock (${inStockCount})`}
            onClick={() => setStockFilter('in')}
            size="small"
            variant={stockFilter === 'in' ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              borderRadius: 2,
              cursor: 'pointer',
              flexShrink: 0,
              bgcolor: stockFilter === 'in' ? '#059669' : 'rgba(16, 185, 129, 0.08)',
              color: stockFilter === 'in' ? '#FFFFFF' : '#059669',
              borderColor: 'rgba(16, 185, 129, 0.35)',
              '&:hover': { bgcolor: stockFilter === 'in' ? '#047857' : 'rgba(16, 185, 129, 0.16)' }
            }}
          />

          {/* Surplus */}
          <Chip
            label={`📦 Surplus 10+ (${surplusCount})`}
            onClick={() => setStockFilter('surplus')}
            size="small"
            variant={stockFilter === 'surplus' ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              borderRadius: 2,
              cursor: 'pointer',
              flexShrink: 0,
              bgcolor: stockFilter === 'surplus' ? '#6366F1' : 'rgba(99, 102, 241, 0.08)',
              color: stockFilter === 'surplus' ? '#FFFFFF' : '#4F46E5',
              borderColor: 'rgba(99, 102, 241, 0.35)',
              '&:hover': { bgcolor: stockFilter === 'surplus' ? '#4F46E5' : 'rgba(99, 102, 241, 0.16)' }
            }}
          />
        </Box>

        {/* Tier 3: Live Valuation & Result Count Bar */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          pt: 1.25,
          mt: 1,
          borderTop: (t) => `1px solid ${t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15, 118, 110, 0.08)'}`
        }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: { xs: '0.72rem', sm: '0.78rem' } }}>
            Showing <strong style={{ color: '#0F766E' }}>{filteredInventory.length}</strong> of {totalItems} garments ({filteredTotalUnits.toLocaleString('en-IN')} units)
          </Typography>
          <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 800, fontSize: { xs: '0.72rem', sm: '0.78rem' }, fontVariantNumeric: 'tabular-nums' }}>
            Catalog Valuation: ₹{filteredTotalValue.toLocaleString('en-IN')}
          </Typography>
        </Box>
      </GlassCard>

      {/* Responsive Garment Presentation: Cards Grid vs Luxury Table */}
      {viewMode === 'cards' ? (
        <Box>
          {filteredInventory.length === 0 ? (
            <GlassCard sx={{ p: 5, textAlign: 'center' }}>
              <Inventory2 sx={{ fontSize: 44, opacity: 0.3, mb: 1.5, display: 'block', mx: 'auto', color: '#0F766E' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>No garments match current criteria</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 2 }}>
                Try adjusting your search query, collection filter, or stock level pills.
              </Typography>
              {isFiltered && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RestartAlt />}
                  onClick={() => { setSearch(''); setCategoryFilter(''); setStockFilter('all'); }}
                  sx={{ borderRadius: 2, fontWeight: 700, borderColor: '#0F766E', color: '#0F766E' }}
                >
                  Clear All Filters
                </Button>
              )}
            </GlassCard>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)',
                    xl: 'repeat(4, 1fr)'
                  },
                  gap: { xs: 2, sm: 2.25, md: 2.5 }
                }}
              >
                {(rowsPerPage > 0 ? filteredInventory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : filteredInventory).map((item) => {
                  const price = Number(item.price) || 0;
                  const cost = Number(item.cost) || 0;
                  const profitVal = price - cost;
                  const profitMarginVal = (cost > 0 && price > 0) ? (((profitVal / price) * 100).toFixed(1)) : '0.0';
                  const qty = Number(item.quantity) || 0;
                  const isOutOfStock = qty <= 0;
                  const isLowStock = !isOutOfStock && qty <= (Number(item.minStockLevel) || 2);

                  return (
                    <GlassCard
                      key={item.id}
                      sx={{
                        p: { xs: 2, sm: 2.25 },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderLeft: isOutOfStock ? '4px solid #DC2626' : isLowStock ? '4px solid #D97706' : '4px solid transparent',
                        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 24px rgba(15, 118, 110, 0.12)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Header: SKU, Name, Collection */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#0F766E', fontWeight: 800, fontSize: '0.8rem' }}>
                              #{item.productId || 'NO-SKU'}
                            </Typography>
                            <Typography
                              variant="subtitle1"
                              noWrap
                              sx={{
                                fontWeight: 800,
                                mt: 0.25,
                                fontSize: { xs: '0.95rem', sm: '1rem' },
                                lineHeight: 1.25
                              }}
                            >
                              {item.name || 'Unnamed Garment'}
                            </Typography>
                            <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                              {item.supplier || 'In-House Atelier'}
                            </Typography>
                          </Box>
                          <Chip
                            label={item.category || 'General'}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              borderRadius: 1.5,
                              borderColor: 'rgba(15, 118, 110, 0.3)',
                              color: '#0F766E',
                              flexShrink: 0
                            }}
                          />
                        </Box>

                        {/* Middle: Size, Color and Stock Badge */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, bgcolor: 'action.hover', px: 1, py: 0.35, borderRadius: 1 }}>
                              {item.size || 'Free Size'}
                            </Typography>
                            {item.color && (
                              <Tooltip title={`Color: ${item.color}`}>
                                <Box
                                  sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    bgcolor: typeof item.color === 'string' ? item.color.toLowerCase() : '#ccc',
                                    border: '1.5px solid rgba(0,0,0,0.15)',
                                    flexShrink: 0
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                          {renderStockBadge(qty, item.minStockLevel)}
                        </Box>

                        {/* Aligned 3-Tile Metrics Box */}
                        <Box sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: 0,
                          textAlign: 'center',
                          mb: 2,
                          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(15, 118, 110, 0.03)',
                          py: 1.25,
                          borderRadius: 2,
                          border: (t) => `1px solid ${t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15, 118, 110, 0.12)'}`
                        }}>
                          <Box sx={{ px: 0.5, overflow: 'hidden' }}>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.65rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                              Price
                            </Typography>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', mt: 0.25 }}>
                              ₹{price.toLocaleString('en-IN')}
                            </Typography>
                          </Box>
                          <Box sx={{ px: 0.5, overflow: 'hidden', borderLeft: (t) => `1px solid ${t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15, 118, 110, 0.12)'}`, borderRight: (t) => `1px solid ${t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15, 118, 110, 0.12)'}` }}>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.65rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                              {user?.role === 'admin' ? 'Margin' : 'Category'}
                            </Typography>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 800, color: user?.role === 'admin' ? (profitVal > 0 ? '#059669' : '#DC2626') : 'text.primary', fontVariantNumeric: 'tabular-nums', mt: 0.25 }}>
                              {user?.role === 'admin' ? `${profitMarginVal}%` : (item.category || 'Apparel')}
                            </Typography>
                          </Box>
                          <Box sx={{ px: 0.5, overflow: 'hidden' }}>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.65rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                              Stock
                            </Typography>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 800, mt: 0.25 }}>
                              {qty} Units
                            </Typography>
                          </Box>
                        </Box>

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 0.5 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate('/barcodes', { state: { product: item } })}
                            startIcon={<QrCode fontSize="small" />}
                            sx={{
                              borderRadius: 2,
                              color: '#D97706',
                              borderColor: 'rgba(217, 119, 6, 0.4)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              height: 36,
                              px: 1.25,
                              minWidth: 'auto',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                          >
                            Tag
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<Edit fontSize="small" />}
                            onClick={() => handleOpen(item)}
                            disabled={user?.role !== 'admin'}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              height: 36,
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<Delete fontSize="small" />}
                            onClick={() => openDeleteDialog(item.id)}
                            disabled={user?.role !== 'admin'}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              height: 36,
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </CardContent>
                    </GlassCard>
                  );
                })}
              </Box>

              <GlassCard sx={{ mt: 3, p: 0.5, borderRadius: 2.5 }}>
                <TablePagination
                  rowsPerPageOptions={[6, 12, 24, 48]}
                  component="div"
                  count={filteredInventory.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </GlassCard>
            </>
          )}
        </Box>
      ) : (
        <GlassCard sx={{ p: 0, overflow: 'hidden', border: '1px solid rgba(15, 118, 110, 0.15)' }}>
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table sx={{ minWidth: user?.role === 'admin' ? 1160 : 1030 }}>
              <TableHead sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(15, 118, 110, 0.1)' : 'rgba(15, 118, 110, 0.05)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, width: 120, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={orderBy === 'productId'}
                      direction={orderBy === 'productId' ? order : 'asc'}
                      onClick={() => handleRequestSort('productId')}
                      sx={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}
                    >
                      Product SKU
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, minWidth: 200 }}>
                    <TableSortLabel
                      active={orderBy === 'name'}
                      direction={orderBy === 'name' ? order : 'asc'}
                      onClick={() => handleRequestSort('name')}
                      sx={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}
                    >
                      Garment Details
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 130, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={orderBy === 'category'}
                      direction={orderBy === 'category' ? order : 'asc'}
                      onClick={() => handleRequestSort('category')}
                      sx={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}
                    >
                      Collection
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, width: 130, whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                    Size & Color
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, width: 150, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={orderBy === 'price'}
                      direction={orderBy === 'price' ? order : 'asc'}
                      onClick={() => handleRequestSort('price')}
                      sx={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}
                    >
                      {user?.role === 'admin' ? 'Cost & Selling' : 'Selling Price'}
                    </TableSortLabel>
                  </TableCell>
                  {user?.role === 'admin' && (
                    <TableCell align="right" sx={{ fontWeight: 800, width: 130, whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                      Margin
                    </TableCell>
                  )}
                  <TableCell align="center" sx={{ fontWeight: 800, width: 180, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={orderBy === 'quantity'}
                      direction={orderBy === 'quantity' ? order : 'asc'}
                      onClick={() => handleRequestSort('quantity')}
                      sx={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}
                    >
                      Stock Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, width: 120, whiteSpace: 'nowrap', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableSkeleton rows={rowsPerPage} columns={user?.role === 'admin' ? 8 : 7} />
                ) : filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user?.role === 'admin' ? 8 : 7} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                      <Inventory2 sx={{ fontSize: 44, opacity: 0.35, mb: 1.5, display: 'block', mx: 'auto', color: '#0F766E' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                        No garments match current criteria
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 2 }}>
                        {stockFilter !== 'all'
                          ? `No items found under the selected stock category. Try resetting the filter to inspect other stock tiers.`
                          : 'Try adjusting your search query, collection filter, or catalog a new luxury garment.'}
                      </Typography>
                      {isFiltered && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<RestartAlt />}
                          onClick={() => { setSearch(''); setCategoryFilter(''); setStockFilter('all'); }}
                          sx={{ borderRadius: 2, fontWeight: 700, borderColor: '#0F766E', color: '#0F766E' }}
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  (rowsPerPage > 0 ? filteredInventory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : filteredInventory).map((item) => {
                    const price = Number(item.price) || 0;
                    const cost = Number(item.cost) || 0;
                    const profitVal = price - cost;
                    const profitMarginVal = (cost > 0 && price > 0) ? (((profitVal / price) * 100).toFixed(1)) : '0.0';
                    const qty = Number(item.quantity) || 0;
                    const minLvl = Number(item.minStockLevel) || 2;
                    const isOutOfStock = qty <= 0;
                    const isLowStock = !isOutOfStock && qty <= minLvl;

                    return (
                      <TableRow
                        key={item.id}
                        hover
                        sx={{
                          bgcolor: isOutOfStock
                            ? (t) => t.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.025)'
                            : isLowStock
                              ? (t) => t.palette.mode === 'dark' ? 'rgba(217, 119, 6, 0.08)' : 'rgba(217, 119, 6, 0.025)'
                              : 'inherit',
                          borderLeft: isOutOfStock
                            ? '3px solid #DC2626'
                            : isLowStock
                              ? '3px solid #D97706'
                              : '3px solid transparent',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {/* Product SKU */}
                        <TableCell sx={{ width: 120, whiteSpace: 'nowrap' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 800,
                              color: '#0F766E',
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              letterSpacing: '0.02em'
                            }}
                          >
                            #{item.productId || 'N/A'}
                          </Typography>
                        </TableCell>

                        {/* Garment Details */}
                        <TableCell sx={{ minWidth: 200 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                              {item.name || 'Unnamed Garment'}
                            </Typography>
                            {item.hasVariants && (
                              <Tooltip title={`${item.variants?.length || 0} Size/Color Variants`}>
                                <Chip
                                  label={`${item.variants?.length || 0} Var`}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    bgcolor: 'rgba(15, 118, 110, 0.1)',
                                    color: '#0F766E',
                                    borderRadius: 1
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                            {item.supplier || 'In-House Atelier'}
                          </Typography>
                        </TableCell>

                        {/* Collection */}
                        <TableCell sx={{ width: 130, whiteSpace: 'nowrap' }}>
                          <Chip
                            label={item.category || 'General'}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              borderRadius: '12px',
                              borderColor: 'rgba(15, 118, 110, 0.25)',
                              color: '#0F766E',
                              bgcolor: 'rgba(15, 118, 110, 0.04)'
                            }}
                          />
                        </TableCell>

                        {/* Size & Color */}
                        <TableCell sx={{ width: 130, whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {item.size || 'Free Size'}
                            </Typography>
                            {item.color && (
                              <Tooltip title={`Color: ${item.color}`}>
                                <Box
                                  sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    bgcolor: typeof item.color === 'string' ? item.color.toLowerCase() : '#ccc',
                                    border: '1.5px solid rgba(0,0,0,0.15)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    flexShrink: 0
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/* Cost & Selling Price */}
                        <TableCell align="right" sx={{ width: 150, whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 800,
                                fontVariantNumeric: 'tabular-nums',
                                color: 'text.primary',
                                fontSize: '0.88rem'
                              }}
                            >
                              ₹{price.toLocaleString('en-IN')}
                            </Typography>
                            {user?.role === 'admin' && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'text.secondary',
                                  fontVariantNumeric: 'tabular-nums',
                                  fontSize: '0.72rem'
                                }}
                              >
                                Cost: ₹{cost.toLocaleString('en-IN')}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        {/* Margin (Admin Only) */}
                        {user?.role === 'admin' && (
                          <TableCell align="right" sx={{ width: 130, whiteSpace: 'nowrap' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 800,
                                  color: profitVal > 0 ? '#059669' : profitVal < 0 ? '#DC2626' : 'text.primary',
                                  fontVariantNumeric: 'tabular-nums',
                                  fontSize: '0.88rem'
                                }}
                              >
                                ₹{profitVal.toFixed(0)}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: profitVal > 0 ? '#059669' : profitVal < 0 ? '#DC2626' : 'text.secondary',
                                  fontWeight: 700,
                                  fontSize: '0.72rem'
                                }}
                              >
                                {profitMarginVal}% margin
                              </Typography>
                            </Box>
                          </TableCell>
                        )}

                        {/* Inventory Stock Highlight */}
                        <TableCell align="center" sx={{ width: 180, whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            {renderStockBadge(qty, item.minStockLevel)}
                          </Box>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" sx={{ width: 120, whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <Tooltip title="Print Barcode Tag">
                              <IconButton
                                size="small"
                                onClick={() => navigate('/barcodes', { state: { product: item } })}
                                sx={{
                                  color: '#D97706',
                                  bgcolor: 'rgba(217, 119, 6, 0.08)',
                                  '&:hover': { bgcolor: 'rgba(217, 119, 6, 0.18)' }
                                }}
                              >
                                <QrCode fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {user?.role === 'admin' && (
                              <>
                                <Tooltip title="Edit Garment">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpen(item)}
                                    sx={{
                                      color: '#0F766E',
                                      bgcolor: 'rgba(15, 118, 110, 0.08)',
                                      '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.18)' }
                                    }}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Garment">
                                  <IconButton
                                    size="small"
                                    onClick={() => openDeleteDialog(item.id)}
                                    sx={{
                                      color: '#DC2626',
                                      bgcolor: 'rgba(220, 38, 38, 0.08)',
                                      '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.18)' }
                                    }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredInventory.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </GlassCard>
      )}

      {/* LUXURY ATELIER ADD / EDIT GARMENT DIALOG */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isSmallMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 3.5 },
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100%', sm: 'calc(100% - 48px)' },
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(15, 118, 110, 0.2), 0 8px 30px rgba(0,0,0,0.12)'
          }
        }}
      >
        {/* Modern Luxury Header */}
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
            color: 'white',
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Checkroom sx={{ color: '#F59E0B', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff', lineHeight: 1.2 }}>
                {editItem ? 'Edit Atelier Garment' : 'Add New Atelier Garment'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.78rem' }}>
                Catalog bespoke apparel, sizing, fabric specs, margins & inventory
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={() => setOpen(false)}
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.85)',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        {/* Structured Multi-Section Body */}
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            {/* Block 1: Garment Identity & Classification */}
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Checkroom sx={{ fontSize: 20, color: '#0F766E' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.78rem' }}>
                  Garment Identity & Classification
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={7}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Garment Name"
                    placeholder="e.g. Royal Banarasi Silk Saree, Gotapati Kurti..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Product SKU / ID"
                    placeholder="e.g. SAR-1002"
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            size="small"
                            onClick={handleAutoGenerateSku}
                            sx={{ fontSize: '0.68rem', fontWeight: 800, p: 0.25, minWidth: 'auto', textTransform: 'none', color: '#0F766E' }}
                          >
                            Auto SKU
                          </Button>
                        </InputAdornment>
                      )
                    }}
                    helperText="Click 'Auto SKU' or leave blank to auto-generate"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Collection / Category
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                      sx={{ fontSize: '0.72rem', textTransform: 'none', p: 0, fontWeight: 700, color: '#0F766E' }}
                    >
                      {showNewCategoryInput ? 'Choose Existing' : '+ New Category'}
                    </Button>
                  </Box>

                  {showNewCategoryInput ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Enter new category name..."
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleAddCategory}
                        sx={{
                          bgcolor: '#0F766E',
                          color: '#ffffff',
                          fontWeight: 700,
                          borderRadius: 2,
                          px: 2,
                          '&:hover': { bgcolor: '#0D6860' }
                        }}
                      >
                        Add
                      </Button>
                    </Box>
                  ) : (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    >
                      {safeCategories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Atelier Supplier / Artisan
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. Varanasi Weavers, Surat Textile Mill..."
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Block 2: Sizing & Color Palette */}
            {!form.hasVariants && (
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Straighten sx={{ fontSize: 20, color: '#0F766E' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.78rem' }}>
                    Size & Color Attributes
                  </Typography>
                </Box>

                {/* Quick Size Select */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                    Quick Size Selection:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.25 }}>
                    {SIZE_PRESETS.map((sz) => (
                      <Chip
                        key={sz}
                        label={sz}
                        size="small"
                        clickable
                        onClick={() => setForm(prev => ({ ...prev, size: sz }))}
                        sx={{
                          fontWeight: form.size === sz ? 800 : 600,
                          fontSize: '0.72rem',
                          bgcolor: form.size === sz ? '#0F766E' : 'action.hover',
                          color: form.size === sz ? '#FFFFFF' : 'text.primary',
                          borderRadius: 1.5,
                          border: form.size === sz ? '1px solid #0F766E' : '1px solid transparent',
                          '&:hover': {
                            bgcolor: form.size === sz ? '#0D6860' : 'action.selected'
                          }
                        }}
                      />
                    ))}
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    label="Garment Size"
                    placeholder="Selected or custom size (e.g. Free Size, 38 Bust)..."
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>

                {/* Quick Color Swatches */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                    Quick Color Selection:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.25 }}>
                    {COLOR_PRESETS.map((c) => (
                      <Chip
                        key={c.name}
                        avatar={
                          <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: c.hex, border: '1px solid rgba(0,0,0,0.2)' }} />
                        }
                        label={c.name}
                        size="small"
                        clickable
                        onClick={() => setForm(prev => ({ ...prev, color: c.name }))}
                        sx={{
                          fontWeight: form.color === c.name ? 800 : 600,
                          fontSize: '0.72rem',
                          bgcolor: form.color === c.name ? 'rgba(15, 118, 110, 0.12)' : 'action.hover',
                          color: form.color === c.name ? '#0F766E' : 'text.primary',
                          border: form.color === c.name ? '1px solid #0F766E' : '1px solid transparent',
                          borderRadius: 1.5
                        }}
                      />
                    ))}
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    label="Garment Color / Fabric Tone"
                    placeholder="Selected or custom color (e.g. Emerald with Gold Border)..."
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
              </Paper>
            )}

            {/* Block 3: Pricing & Margins */}
            {!form.hasVariants && (
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocalOffer sx={{ fontSize: 20, color: '#0F766E' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.78rem' }}>
                    Pricing & Atelier Gross Margins
                  </Typography>
                </Box>

                <Grid container spacing={2} alignItems="center">
                  {user?.role === 'admin' && (
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Cost Price (₹)"
                        placeholder="0"
                        value={form.cost}
                        onChange={(e) => setForm({ ...form, cost: e.target.value })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} sm={user?.role === 'admin' ? 4 : 6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Selling Price (₹)"
                      placeholder="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      disabled={user?.role !== 'admin' && !editItem}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontWeight: 800,
                          color: '#0F766E'
                        }
                      }}
                    />
                  </Grid>

                  {/* Live Profit & Margin Indicator */}
                  {user?.role === 'admin' && (
                    <Grid item xs={12} sm={4}>
                      <Box sx={{
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: profit > 0 ? 'rgba(16, 185, 129, 0.1)' : profit < 0 ? 'rgba(239, 68, 68, 0.1)' : 'action.hover',
                        border: '1px solid',
                        borderColor: profit > 0 ? 'rgba(16, 185, 129, 0.25)' : profit < 0 ? 'rgba(239, 68, 68, 0.25)' : 'divider',
                        textAlign: 'center'
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: profit > 0 ? '#059669' : profit < 0 ? '#DC2626' : 'text.secondary' }}>
                          {profit > 0 ? `Profit: ₹${profit.toFixed(0)} (${marginPct}%)` : profit < 0 ? `Loss: ₹${Math.abs(profit).toFixed(0)} (${marginPct}%)` : 'Set Prices to view Margin'}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                          Gross Atelier Margin
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            )}

            {/* Block 4: Stock Quantity & Thresholds */}
            {!form.hasVariants && (
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Inventory2 sx={{ fontSize: 20, color: '#0F766E' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.78rem' }}>
                    Inventory Stock & Thresholds
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Available Stock Quantity"
                      placeholder="0"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">Units</InputAdornment>
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Low Stock Alert Threshold"
                      placeholder="2"
                      value={form.minStockLevel}
                      onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })}
                      helperText="Alerts bell notification when stock drops to or below this level"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">Units</InputAdornment>
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Block 5: Variants Switcher & Table */}
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Layers sx={{ fontSize: 22, color: '#D97706' }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      Multi-Variant Garment
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Enable if this style comes in multiple sizes, colors, or differing price points
                    </Typography>
                  </Box>
                </Box>

                <Switch
                  checked={form.hasVariants}
                  onChange={(e) => setForm({ ...form, hasVariants: e.target.checked })}
                  color="primary"
                />
              </Box>

              {form.hasVariants && (
                <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>
                      Variants Breakdown ({(form.variants || []).length} variations)
                    </Typography>
                    <Button
                      startIcon={<Add />}
                      size="small"
                      variant="outlined"
                      onClick={addVariant}
                      sx={{ borderRadius: 1.5, fontWeight: 700, fontSize: '0.75rem', color: '#0F766E' }}
                    >
                      Add Variant
                    </Button>
                  </Box>

                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Variant SKU</TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Size</TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Color</TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Stock Qty</TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Min Alert</TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Price (₹)</TableCell>
                          <TableCell align="right"></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(!form.variants || form.variants.length === 0) ? (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                              No variants added yet. Click "+ Add Variant" above to specify sizes and colors.
                            </TableCell>
                          </TableRow>
                        ) : (
                          form.variants.map((v, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700 }}>
                                {v.sku}
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  sx={{ width: 90, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                  value={v.size || ''}
                                  placeholder="Size"
                                  onChange={(e) => updateVariant(idx, 'size', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  sx={{ width: 90, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                  value={v.color || ''}
                                  placeholder="Color"
                                  onChange={(e) => updateVariant(idx, 'color', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  sx={{ width: 70, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                  value={v.quantity || 0}
                                  onChange={(e) => updateVariant(idx, 'quantity', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  sx={{ width: 70, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                  value={v.minStockLevel || ''}
                                  placeholder="2"
                                  onChange={(e) => updateVariant(idx, 'minStockLevel', e.target.value)}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  sx={{ width: 90, '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontWeight: 700 } }}
                                  value={v.price || 0}
                                  onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <IconButton size="small" color="error" onClick={() => removeVariant(idx)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={`Total Inventory: ${(form.variants || []).reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0)} units`}
                      size="small"
                      sx={{ fontWeight: 800, bgcolor: 'rgba(15, 118, 110, 0.1)', color: '#0F766E' }}
                    />
                  </Box>
                </Box>
              )}
            </Paper>
          </Stack>
        </DialogContent>

        {/* Polished Dialog Footer */}
        <DialogActions
          sx={{
            p: 2.5,
            px: 3,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Summary:
            </Typography>
            <Chip
              label={form.name ? `${form.name} • ${form.category || 'Atelier'} • ₹${form.price || 0}` : 'New Garment'}
              size="small"
              sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setOpen(false)}
              variant="outlined"
              sx={{ borderRadius: 2, fontWeight: 700, px: 2.5, textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={<CheckCircle />}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                px: 3.5,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)'
              }}
            >
              {editItem ? 'Update Garment' : 'Save Garment to Atelier'}
            </Button>
          </Box>
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
