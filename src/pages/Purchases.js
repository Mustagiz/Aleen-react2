import React, { useState, useMemo } from 'react';
import { 
    Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, 
    Table, TableBody, TableCell, TableHead, TableRow, IconButton, MenuItem, 
    Paper, Typography, TableContainer, Chip, Grid, Autocomplete, 
    InputAdornment, TablePagination, useTheme, useMediaQuery, TableSortLabel, 
    Tabs, Tab, Checkbox, Tooltip, Avatar
} from '@mui/material';
import { 
    Add, Delete, ReceiptLong, Search, Edit, Close, AttachMoney, 
    Download, LocalShipping, AutoAwesome, Print, CalendarToday,
    CheckCircle, HourglassEmpty, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';

const Purchases = () => {
    const navigate = useNavigate();
    const { 
        purchases, vendors, inventory, addPurchase, updatePurchase, 
        deletePurchase, categories, addInventoryItem, updateCategories, 
        getLowStockItems 
    } = useData();
    const [open, setOpen] = useState(false);
    const [tabValue, setTabValue] = useState(0);

    // Edit Mode State
    const [editMode, setEditMode] = useState(false);
    const [selectedPoId, setSelectedPoId] = useState(null);

    // Quick Add Product State
    const [quickAddDialog, setQuickAddDialog] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState(null);
    const [newCategory, setNewCategory] = useState('');
    const [quickForm, setQuickForm] = useState({
        name: '', category: '', cost: '', price: '', productId: '', size: ''
    });

    // PO Form State
    const [vendorId, setVendorId] = useState('');
    const [status, setStatus] = useState('Ordered');
    const [poItems, setPoItems] = useState([{ productId: '', quantity: 1, cost: 0, variantSku: '' }]);
    const [paymentStatus, setPaymentStatus] = useState('Unpaid');
    const [amountPaid, setAmountPaid] = useState(0);
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [paymentFilter, setPaymentFilter] = useState('All');

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

    // Sorting State
    const [orderBy, setOrderBy] = useState('date');
    const [order, setOrder] = useState('desc');

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // Filtered and Sorted Purchases
    const filteredPurchases = useMemo(() => {
        return purchases.filter((po) => {
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query ||
                (po.id || '').toLowerCase().includes(query) ||
                (po.vendorName || '').toLowerCase().includes(query) ||
                po.items.some(i => (i.productName || '').toLowerCase().includes(query));

            const matchesStatus = statusFilter === 'All' || po.status === statusFilter;
            const matchesPayment = paymentFilter === 'All' || po.paymentStatus === paymentFilter;

            return matchesSearch && matchesStatus && matchesPayment;
        });
    }, [purchases, searchQuery, statusFilter, paymentFilter]);

    const sortedPurchases = useMemo(() => {
        return [...filteredPurchases].sort((a, b) => {
            if (orderBy === 'total' || orderBy === 'amountPaid') {
                return order === 'asc' ? ((a[orderBy] || 0) - (b[orderBy] || 0)) : ((b[orderBy] || 0) - (a[orderBy] || 0));
            }
            if (orderBy === 'date') {
                return order === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
            }
            const valA = (a[orderBy] || '').toString().toLowerCase();
            const valB = (b[orderBy] || '').toString().toLowerCase();
            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredPurchases, orderBy, order]);

    const handleOpen = (po = null) => {
        if (po) {
            setEditMode(true);
            setSelectedPoId(po.id);
            setVendorId(po.vendorId);
            setStatus(po.status);
            setPoItems(po.items.map(i => ({ 
                productId: i.productId, 
                quantity: i.quantity, 
                cost: i.cost, 
                variantSku: i.variantSku || '' 
            })));
            setPaymentStatus(po.paymentStatus);
            setAmountPaid(po.amountPaid || 0);
            setPurchaseDate(po.date ? new Date(po.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        } else {
            setEditMode(false);
            setSelectedPoId(null);
            setVendorId('');
            setStatus('Ordered');
            setPoItems([{ productId: '', quantity: 1, cost: 0, variantSku: '' }]);
            setPaymentStatus('Unpaid');
            setAmountPaid(0);
            setPurchaseDate(new Date().toISOString().split('T')[0]);
        }
        setOpen(true);
    };

    const handleQuickAddOpen = (index) => {
        setActiveRowIndex(index);
        setQuickForm({ name: '', category: categories[0] || 'Fabrics', cost: '', price: '', productId: '', size: '' });
        setQuickAddDialog(true);
    };

    const handleAddCategory = async () => {
        if (newCategory && !categories.includes(newCategory)) {
            const updated = [...categories, newCategory];
            await updateCategories(updated);
            setQuickForm({ ...quickForm, category: newCategory });
            setNewCategory('');
        }
    };

    const handleQuickSave = async () => {
        const id = quickForm.productId.trim() || `PRD-${Date.now()}`;
        const newItem = {
            ...quickForm,
            productId: id,
            price: parseFloat(quickForm.price) || 0,
            cost: parseFloat(quickForm.cost) || 0,
            quantity: 0,
            supplier: vendors.find(v => v.id === vendorId)?.name || ''
        };

        const addedItem = await addInventoryItem(newItem);
        if (activeRowIndex !== null && activeRowIndex < poItems.length) {
            const updated = [...poItems];
            updated[activeRowIndex] = {
                ...updated[activeRowIndex],
                productId: addedItem?.id || id,
                cost: parseFloat(quickForm.cost) || 0
            };
            setPoItems(updated);
        }
        setQuickAddDialog(false);
    };

    const handleAddItem = () => {
        setPoItems([...poItems, { productId: '', quantity: 1, cost: 0, variantSku: '' }]);
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...poItems];
        updated[index][field] = value;

        if (field === 'productId') {
            const product = inventory.find(i => i.id === value);
            if (product) {
                updated[index].cost = product.cost || 0;
            }
        }
        setPoItems(updated);
    };

    const calculateTotal = () => {
        return poItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.cost) || 0)), 0);
    };

    const handleSave = async () => {
        const total = calculateTotal();
        const poData = {
            vendorId,
            vendorName: vendors.find(v => v.id === vendorId)?.name || 'Unknown Vendor',
            status,
            paymentStatus,
            amountPaid: paymentStatus === 'Paid' ? total : (parseFloat(amountPaid) || 0),
            items: poItems.filter(i => i.productId).map(item => {
                const prod = inventory.find(inv => inv.id === item.productId);
                return {
                    ...item,
                    productName: prod ? prod.name : 'Custom Item',
                    quantity: Number(item.quantity) || 1,
                    cost: Number(item.cost) || 0
                };
            }),
            total,
            date: new Date(purchaseDate).toISOString()
        };

        if (editMode && selectedPoId) {
            const oldPo = purchases.find(p => p.id === selectedPoId);
            await updatePurchase(selectedPoId, { ...poData, date: oldPo?.date || poData.date }, oldPo);
        } else {
            await addPurchase(poData);
        }
        setOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (deleteId) {
            await deletePurchase(deleteId);
            setDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const openDeleteDialog = (id) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const handleReceiveStock = async (po) => {
        if (window.confirm(`Mark PO #${po.id.slice(-6)} as Received? This will update warehouse inventory and adjust stock counts.`)) {
            await updatePurchase(po.id, {
                status: 'Received',
                paymentStatus: 'Paid',
                amountPaid: po.total
            }, po);
        }
    };

    const downloadPurchases = () => {
        const csvData = purchases.map(po => ({
            'PO ID': po.id,
            'Date': new Date(po.date).toLocaleDateString(),
            'Vendor': po.vendorName,
            'Items Count': po.items.length,
            'Items Detail': po.items.map(i => `${i.productName || 'Item'} (x${i.quantity})`).join('; '),
            'Total Cost': po.total,
            'Paid Amount': po.amountPaid || 0,
            'Payment Status': po.paymentStatus,
            'Order Status': po.status
        }));

        if (csvData.length === 0) {
            alert('No purchase orders to export');
            return;
        }

        const headers = Object.keys(csvData[0]);
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(h => `"${(row[h] !== undefined && row[h] !== null ? row[h] : '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aleen_purchases_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Summary KPI values
    const totalOrders = purchases.length;
    const pendingCount = purchases.filter(p => p.status === 'Ordered').length;
    const totalSpent = purchases.reduce((sum, p) => sum + (p.total || 0), 0);

    return (
        <Box>
            {/* Atelier Luxury Header with Breadcrumbs & Action */}
            <PageHeader
                title="Purchase Orders & Procurement"
                subtitle="Track textile procurement orders, mill deliveries, stock receipt & supplier payments"
                breadcrumbs={[
                    { label: 'Aleen Atelier', path: '/' },
                    { label: 'Inventory & Stock', path: '/inventory' },
                    { label: 'Purchase Orders' }
                ]}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<Download fontSize="small" />}
                            onClick={downloadPurchases}
                            sx={{
                                px: 2.5,
                                py: 1.1,
                                borderRadius: 2,
                                fontWeight: 700,
                                fontSize: '0.825rem',
                                borderColor: 'rgba(15, 118, 110, 0.4)',
                                color: '#0F766E',
                                textTransform: 'none',
                                '&:hover': {
                                    borderColor: '#0F766E',
                                    bgcolor: 'rgba(15, 118, 110, 0.05)'
                                }
                            }}
                        >
                            Export CSV
                        </Button>
                        <Button 
                            variant="contained" 
                            startIcon={<Add />} 
                            onClick={() => handleOpen()} 
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 3,
                                py: 1.25,
                                fontSize: '0.875rem',
                                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                color: '#ffffff',
                                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.28)',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
                                    boxShadow: '0 6px 18px rgba(217, 119, 6, 0.4)',
                                    transform: 'translateY(-2px)'
                                }
                            }}
                        >
                            Create Purchase Order
                        </Button>
                    </Box>
                }
            />

            {/* View Switching Tabs */}
            <Tabs 
                value={tabValue} 
                onChange={(e, v) => setTabValue(v)} 
                sx={{ 
                    mb: 3, 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        minHeight: 48,
                        mr: 2
                    },
                    '& .Mui-selected': {
                        color: '#0F766E !important'
                    },
                    '& .MuiTabs-indicator': {
                        backgroundColor: '#0F766E',
                        height: 3,
                        borderRadius: '3px 3px 0 0'
                    }
                }}
            >
                <Tab label="Purchase Orders" icon={<ReceiptLong sx={{ fontSize: '1.2rem' }} />} iconPosition="start" />
                <Tab label="Smart Restock Assistant" icon={<AutoAwesome sx={{ fontSize: '1.2rem', color: '#D97706' }} />} iconPosition="start" />
            </Tabs>

            {tabValue === 0 && (
                <>
                    {/* Atelier KPI Summary Cards */}
                    <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                        <Grid item xs={12} sm={4}>
                            <AtelierKpiCard
                                title="Total Procurement Orders"
                                value={totalOrders}
                                icon={<ReceiptLong fontSize="small" />}
                                subtitle="Lifetime vendor orders placed"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <AtelierKpiCard
                                title="Pending Mill Deliveries"
                                value={pendingCount}
                                icon={<LocalShipping fontSize="small" />}
                                goldAccent={true}
                                subtitle="Awaiting receipt into inventory"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <AtelierKpiCard
                                title="Total Procurement Spend"
                                value={`₹${totalSpent.toLocaleString('en-IN')}`}
                                icon={<AttachMoney fontSize="small" />}
                                subtitle="Combined value of orders"
                            />
                        </Grid>
                    </Grid>

                    {/* Filter and Search Bar */}
                    <GlassCard sx={{ p: 2, mb: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4.5}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search by PO number, vendor name, fabric product..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(0);
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchQuery && (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setSearchQuery('')}>
                                                    <Close fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6} sm={4} md={2.5}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Order Status"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(0);
                                    }}
                                >
                                    <MenuItem value="All">All Statuses</MenuItem>
                                    <MenuItem value="Ordered">Ordered (Pending)</MenuItem>
                                    <MenuItem value="Received">Received (In Stock)</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={6} sm={4} md={2.5}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Payment Status"
                                    value={paymentFilter}
                                    onChange={(e) => {
                                        setPaymentFilter(e.target.value);
                                        setPage(0);
                                    }}
                                >
                                    <MenuItem value="All">All Payments</MenuItem>
                                    <MenuItem value="Unpaid">Unpaid</MenuItem>
                                    <MenuItem value="Partial">Partial</MenuItem>
                                    <MenuItem value="Paid">Paid</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4} md={2.5} sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                                <TextField
                                    select
                                    size="small"
                                    label="Sort By"
                                    value={orderBy}
                                    onChange={(e) => setOrderBy(e.target.value)}
                                    sx={{ minWidth: 120 }}
                                >
                                    <MenuItem value="date">Date</MenuItem>
                                    <MenuItem value="vendorName">Vendor</MenuItem>
                                    <MenuItem value="total">Total Cost</MenuItem>
                                    <MenuItem value="status">Status</MenuItem>
                                </TextField>
                                <Tooltip title={order === 'asc' ? 'Ascending Order' : 'Descending Order'}>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
                                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 0.8 }}
                                    >
                                        {order === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                                    </IconButton>
                                </Tooltip>
                                {(searchQuery || statusFilter !== 'All' || paymentFilter !== 'All') && (
                                    <Button 
                                        size="small" 
                                        color="inherit" 
                                        onClick={() => {
                                            setSearchQuery('');
                                            setStatusFilter('All');
                                            setPaymentFilter('All');
                                            setPage(0);
                                        }}
                                        sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, minWidth: 'auto', px: 1 }}
                                    >
                                        Reset
                                    </Button>
                                )}
                            </Grid>
                        </Grid>
                    </GlassCard>

                    {/* Aligned Purchase Orders Table */}
                    <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15, 118, 110, 0.04)' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            <TableSortLabel 
                                                active={orderBy === 'date'} 
                                                direction={orderBy === 'date' ? order : 'asc'} 
                                                onClick={() => handleRequestSort('date')}
                                            >
                                                PO Ref & Date
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            <TableSortLabel 
                                                active={orderBy === 'vendorName'} 
                                                direction={orderBy === 'vendorName' ? order : 'asc'} 
                                                onClick={() => handleRequestSort('vendorName')}
                                            >
                                                Vendor / Supplier
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            Items & Quantity
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            <TableSortLabel 
                                                active={orderBy === 'total'} 
                                                direction={orderBy === 'total' ? order : 'asc'} 
                                                onClick={() => handleRequestSort('total')}
                                            >
                                                Total Cost
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            Order Status
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            Payment Status
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedPurchases.length > 0 ? (
                                        (rowsPerPage > 0
                                            ? sortedPurchases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            : sortedPurchases
                                        ).map((po) => {
                                            const totalUnits = po.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
                                            const isReceived = po.status === 'Received';
                                            const isPaid = po.paymentStatus === 'Paid';

                                            return (
                                                <TableRow 
                                                    key={po.id} 
                                                    hover
                                                    sx={{ '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(15, 118, 110, 0.02)' } }}
                                                >
                                                    {/* PO Ref & Date */}
                                                    <TableCell sx={{ py: 2 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Avatar sx={{ bgcolor: isReceived ? 'rgba(5, 150, 105, 0.1)' : 'rgba(217, 119, 6, 0.1)', color: isReceived ? '#059669' : '#D97706', width: 36, height: 36 }}>
                                                                <ReceiptLong sx={{ fontSize: '1.1rem' }} />
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                                    #{po.id.length > 8 ? po.id.slice(-6).toUpperCase() : po.id.toUpperCase()}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}>
                                                                    <CalendarToday sx={{ fontSize: '0.75rem' }} />
                                                                    {new Date(po.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>

                                                    {/* Vendor */}
                                                    <TableCell sx={{ py: 2 }}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                            {po.vendorName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Vendor ID: {po.vendorId ? `#${po.vendorId.slice(-4)}` : 'Direct'}
                                                        </Typography>
                                                    </TableCell>

                                                    {/* Items & Quantity */}
                                                    <TableCell sx={{ py: 2 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Chip 
                                                                label={`${po.items.length} ${po.items.length === 1 ? 'Item' : 'Items'}`} 
                                                                size="small" 
                                                                sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                                            />
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                                ({totalUnits} units)
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>

                                                    {/* Total Cost (Right-aligned) */}
                                                    <TableCell align="right" sx={{ py: 2 }}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F766E', fontSize: '0.95rem' }}>
                                                            ₹{(po.total || 0).toLocaleString('en-IN')}
                                                        </Typography>
                                                        {po.amountPaid > 0 && po.amountPaid < po.total && (
                                                            <Typography variant="caption" color="text.secondary" display="block">
                                                                Paid: ₹{po.amountPaid.toLocaleString('en-IN')}
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Order Status (Center-aligned) */}
                                                    <TableCell align="center" sx={{ py: 2 }}>
                                                        <Chip
                                                            icon={isReceived ? <CheckCircle sx={{ fontSize: '0.85rem !important' }} /> : <HourglassEmpty sx={{ fontSize: '0.85rem !important' }} />}
                                                            label={isReceived ? 'Received' : 'Ordered'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: isReceived ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                                                                color: isReceived ? '#059669' : '#D97706',
                                                                border: isReceived ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)',
                                                                fontWeight: 800,
                                                                fontSize: '0.75rem',
                                                                px: 0.5
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Payment Status (Center-aligned) */}
                                                    <TableCell align="center" sx={{ py: 2 }}>
                                                        <Chip
                                                            label={po.paymentStatus || 'Unpaid'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: isPaid 
                                                                    ? 'rgba(16, 185, 129, 0.12)' 
                                                                    : (po.paymentStatus === 'Partial' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.1)'),
                                                                color: isPaid 
                                                                    ? '#059669' 
                                                                    : (po.paymentStatus === 'Partial' ? '#D97706' : '#DC2626'),
                                                                border: '1px solid',
                                                                borderColor: isPaid 
                                                                    ? 'rgba(16, 185, 129, 0.25)' 
                                                                    : (po.paymentStatus === 'Partial' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)'),
                                                                fontWeight: 800,
                                                                fontSize: '0.75rem'
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Actions (Right-aligned) */}
                                                    <TableCell align="right" sx={{ py: 2 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.75 }}>
                                                            {/* Receive stock quick action */}
                                                            {po.status === 'Ordered' && (
                                                                <Tooltip title="Receive Stock into Inventory">
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        onClick={() => handleReceiveStock(po)}
                                                                        sx={{
                                                                            fontSize: '0.72rem',
                                                                            fontWeight: 800,
                                                                            py: 0.4,
                                                                            px: 1.25,
                                                                            borderRadius: 1.5,
                                                                            textTransform: 'none',
                                                                            bgcolor: '#059669',
                                                                            color: '#ffffff',
                                                                            '&:hover': { bgcolor: '#047857' }
                                                                        }}
                                                                    >
                                                                        Receive
                                                                    </Button>
                                                                </Tooltip>
                                                            )}

                                                            {/* Print Barcode Labels */}
                                                            <Tooltip title="Print Product Barcodes">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => navigate('/barcodes', { state: { purchaseOrder: po } })}
                                                                    sx={{ 
                                                                        color: '#0F766E',
                                                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.1)' : 'rgba(15, 118, 110, 0.08)',
                                                                        '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.2)' }
                                                                    }}
                                                                >
                                                                    <Print fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            {/* Edit PO */}
                                                            <Tooltip title="Edit Purchase Order">
                                                                <IconButton 
                                                                    size="small" 
                                                                    onClick={() => handleOpen(po)} 
                                                                    sx={{ 
                                                                        color: '#D97706',
                                                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(217, 119, 6, 0.08)',
                                                                        '&:hover': { bgcolor: 'rgba(217, 119, 6, 0.2)' }
                                                                    }}
                                                                >
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            {/* Delete PO */}
                                                            <Tooltip title="Delete Purchase Order">
                                                                <IconButton 
                                                                    size="small" 
                                                                    onClick={() => openDeleteDialog(po.id)} 
                                                                    sx={{ 
                                                                        color: 'error.main',
                                                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                                                                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' }
                                                                    }}
                                                                >
                                                                    <Delete fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                                <ReceiptLong sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                                    No purchase orders match your criteria.
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Click "Create Purchase Order" to place a new fabric procurement order.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={filteredPurchases.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                        />
                    </GlassCard>
                </>
            )}

            {tabValue === 1 && (
                <SmartRestockView 
                    getLowStockItems={getLowStockItems} 
                    vendors={vendors} 
                    handleOpen={handleOpen} 
                    setVendorId={setVendorId} 
                    setPoItems={setPoItems} 
                />
            )}

            {/* Create/Edit PO Luxury Dialog */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ 
                    sx: { 
                        borderRadius: isMobile ? 0 : 3.5,
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
                    } 
                }}
            >
                <DialogTitle 
                    sx={{
                        background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                        color: '#ffffff',
                        px: 3,
                        py: 2.25,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
                            <ReceiptLong />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '0.02em' }}>
                                {editMode ? 'Edit Purchase Order' : 'Create Purchase Order'}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500 }}>
                                Procurement & Supplier Stock Inward Management
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: isMobile ? 2 : 3, mt: 1 }}>
                    {/* Step 1: Vendor & Order Header */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
                            1. Supplier & Order Schedule
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Autocomplete
                                    options={vendors}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={vendors.find(v => v.id === vendorId) || null}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    onChange={(event, newValue) => {
                                        setVendorId(newValue ? newValue.id : '');
                                    }}
                                    disablePortal
                                    autoHighlight
                                    renderOption={(props, option) => (
                                        <Box component="li" {...props} key={option.id}>
                                            <Box sx={{ py: 0.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{option.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.category || 'Vendor'} • {option.phone || 'No Contact'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Select Fabric Vendor / Mill *"
                                            fullWidth
                                            placeholder="Search by vendor name..."
                                            helperText="Select the textile supplier for this order"
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Order Status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <MenuItem value="Ordered">Ordered (Pending)</MenuItem>
                                    <MenuItem value="Received">Received (Stock In)</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    label="Order Date"
                                    type="date"
                                    fullWidth
                                    value={purchaseDate}
                                    onChange={(e) => setPurchaseDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Step 2: Line Items */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.08em' }}>
                                2. Line Items ({poItems.length})
                            </Typography>
                            <Button
                                startIcon={<Add />}
                                onClick={handleAddItem}
                                size="small"
                                sx={{ 
                                    textTransform: 'none', 
                                    fontWeight: 700, 
                                    color: '#0F766E',
                                    fontSize: '0.8rem'
                                }}
                            >
                                Add Another Line
                            </Button>
                        </Box>

                        {poItems.map((item, index) => {
                            const selectedProduct = inventory.find(i => i.id === item.productId);
                            const lineTotal = (Number(item.quantity) || 0) * (Number(item.cost) || 0);

                            return (
                                <Paper
                                    key={index}
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        mb: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2.5,
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'grey.50',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Grid container spacing={1.5} alignItems="center">
                                        <Grid item xs={12} sm={5}>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Autocomplete
                                                    fullWidth
                                                    size="small"
                                                    options={inventory}
                                                    getOptionLabel={(option) => `${option.name} (SKU: ${option.productId || option.id.slice(-4)})`}
                                                    value={selectedProduct || null}
                                                    isOptionEqualToValue={(option, value) => option.id === (typeof value === 'string' ? value : value?.id)}
                                                    onChange={(e, newVal) => handleItemChange(index, 'productId', newVal?.id)}
                                                    renderInput={(params) => <TextField {...params} label="Select Inventory Item *" placeholder="Choose product..." />}
                                                />
                                                <Tooltip title="Quick create new product if not in catalog">
                                                    <Button
                                                        variant="outlined"
                                                        onClick={() => handleQuickAddOpen(index)}
                                                        size="small"
                                                        sx={{ 
                                                            minWidth: 40, 
                                                            px: 1,
                                                            borderColor: '#0F766E',
                                                            color: '#0F766E'
                                                        }}
                                                    >
                                                        <Add fontSize="small" />
                                                    </Button>
                                                </Tooltip>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={4} sm={2}>
                                            <TextField
                                                fullWidth
                                                label="Quantity"
                                                type="number"
                                                size="small"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                                inputProps={{ min: 1 }}
                                            />
                                        </Grid>
                                        <Grid item xs={4} sm={2.5}>
                                            <TextField
                                                fullWidth
                                                label="Buy / Unit Cost"
                                                type="number"
                                                size="small"
                                                value={item.cost}
                                                onChange={(e) => handleItemChange(index, 'cost', parseFloat(e.target.value) || 0)}
                                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                                inputProps={{ min: 0, step: 0.01 }}
                                            />
                                        </Grid>
                                        <Grid item xs={3} sm={2} sx={{ textAlign: 'right' }}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Line Subtotal
                                            </Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F766E' }}>
                                                ₹{lineTotal.toLocaleString('en-IN')}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={1} sm={0.5} sx={{ textAlign: 'right' }}>
                                            <IconButton
                                                color="error"
                                                onClick={() => setPoItems(poItems.filter((_, i) => i !== index))}
                                                size="small"
                                                disabled={poItems.length === 1}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Grid>
                                    </Grid>

                                    {/* Variant selector if product has variants */}
                                    {selectedProduct && selectedProduct.hasVariants && selectedProduct.variants && (
                                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                label="Select Specific Variant (Receive stock into)"
                                                value={item.variantSku || ''}
                                                onChange={(e) => handleItemChange(index, 'variantSku', e.target.value)}
                                            >
                                                <MenuItem value="">General Product (No Variant Specified)</MenuItem>
                                                {selectedProduct.variants.map((v) => (
                                                    <MenuItem key={v.sku} value={v.sku}>
                                                        {v.size} / {v.color} (Current In-Store Stock: {v.quantity})
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Box>
                                    )}
                                </Paper>
                            );
                        })}
                    </Box>

                    {/* Step 3: Payment & Financial Summary Card */}
                    <Box 
                        sx={{ 
                            p: 2.5, 
                            borderRadius: 3, 
                            background: theme.palette.mode === 'dark' 
                                ? 'linear-gradient(135deg, rgba(15, 118, 110, 0.2) 0%, rgba(4, 47, 46, 0.3) 100%)' 
                                : 'linear-gradient(135deg, rgba(15, 118, 110, 0.06) 0%, rgba(217, 119, 6, 0.06) 100%)',
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.2)' : 'rgba(15, 118, 110, 0.15)'
                        }}
                    >
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
                            3. Payment Settlement & Terms
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Payment Status"
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                >
                                    <MenuItem value="Unpaid">Unpaid (Full Credit)</MenuItem>
                                    <MenuItem value="Partial">Partial Payment</MenuItem>
                                    <MenuItem value="Paid">Fully Paid</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Paid Amount"
                                    type="number"
                                    value={paymentStatus === 'Paid' ? calculateTotal() : amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    disabled={paymentStatus === 'Unpaid' || paymentStatus === 'Paid'}
                                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                    inputProps={{ min: 0, step: 0.01 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Total Order Value
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F766E' }}>
                                        ₹{calculateTotal().toLocaleString('en-IN')}
                                    </Typography>
                                    {paymentStatus === 'Partial' && (
                                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, display: 'block' }}>
                                            Balance Pending: ₹{(calculateTotal() - (parseFloat(amountPaid) || 0)).toLocaleString('en-IN')}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button 
                        onClick={() => setOpen(false)}
                        sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={!vendorId || poItems.length === 0 || !poItems.some(i => i.productId)}
                        sx={{
                            borderRadius: 2,
                            px: 3.5,
                            py: 1,
                            fontWeight: 700,
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                            color: '#ffffff',
                            boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
                            }
                        }}
                    >
                        {editMode ? 'Save PO Changes' : 'Confirm & Create Order'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Quick Add Product Dialog */}
            <Dialog 
                open={quickAddDialog} 
                onClose={() => setQuickAddDialog(false)} 
                maxWidth="sm" 
                fullWidth 
                PaperProps={{ sx: { borderRadius: 3.5, overflow: 'hidden' } }}
            >
                <DialogTitle sx={{ background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)', color: 'white', px: 3, py: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Quick Add Product to Inventory</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>Adds product directly to boutique catalog</Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Product SKU / ID"
                                value={quickForm.productId}
                                onChange={(e) => setQuickForm({ ...quickForm, productId: e.target.value })}
                                placeholder="Auto-generated if empty"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Category"
                                value={quickForm.category}
                                onChange={(e) => setQuickForm({ ...quickForm, category: e.target.value })}
                            >
                                {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                            </TextField>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <TextField
                                    size="small"
                                    placeholder="+ New category name"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    fullWidth
                                />
                                <Button 
                                    onClick={handleAddCategory} 
                                    variant="outlined" 
                                    size="small"
                                    disabled={!newCategory.trim()}
                                    sx={{ minWidth: 60, textTransform: 'none' }}
                                >
                                    Add
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Product Name *"
                                value={quickForm.name}
                                onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                                placeholder="e.g. Zari Embroidered Organza Fabric"
                                autoFocus
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Cost Price (₹)"
                                type="number"
                                value={quickForm.cost}
                                onChange={(e) => setQuickForm({ ...quickForm, cost: e.target.value })}
                                placeholder="Procurement cost"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Selling Price / MRP (₹) *"
                                type="number"
                                value={quickForm.price}
                                onChange={(e) => setQuickForm({ ...quickForm, price: e.target.value })}
                                placeholder="Retail sales price"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setQuickAddDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button 
                        onClick={handleQuickSave} 
                        variant="contained" 
                        disabled={!quickForm.name || !quickForm.price}
                        sx={{ 
                            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                            fontWeight: 700,
                            textTransform: 'none',
                            px: 3
                        }}
                    >
                        Save & Select
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Purchase Order"
                content="Are you sure you want to delete this purchase order? This action cannot be undone."
            />
        </Box>
    );
};

const SmartRestockView = ({ getLowStockItems, vendors, handleOpen, setVendorId, setPoItems }) => {
    const theme = useTheme();
    const [selectedItems, setSelectedItems] = useState([]);
    const lowStockItems = getLowStockItems ? getLowStockItems() : [];

    // Group by Supplier
    const groupedItems = lowStockItems.reduce((groups, item) => {
        const supplier = item.supplier || 'Unknown Supplier';
        if (!groups[supplier]) groups[supplier] = [];
        groups[supplier].push(item);
        return groups;
    }, {});

    const handleSelectAll = (supplier, items, checked) => {
        if (checked) {
            const newSelected = [...selectedItems];
            items.forEach(item => {
                const uniqueId = item.isVariant ? `${item.id}-${item.variantSku}` : item.id;
                if (!newSelected.includes(uniqueId)) newSelected.push(uniqueId);
            });
            setSelectedItems(newSelected);
        } else {
            const idsToRemove = items.map(item => item.isVariant ? `${item.id}-${item.variantSku}` : item.id);
            setSelectedItems(selectedItems.filter(id => !idsToRemove.includes(id)));
        }
    };

    const handleSelectItem = (uniqueId) => {
        if (selectedItems.includes(uniqueId)) {
            setSelectedItems(selectedItems.filter(id => id !== uniqueId));
        } else {
            setSelectedItems([...selectedItems, uniqueId]);
        }
    };

    const createBulkPO = (supplier, items) => {
        const vendor = vendors.find(v => v.name.toLowerCase() === supplier.toLowerCase());
        const vendorIdToUse = vendor ? vendor.id : '';

        const itemsToOrder = items.filter(item => {
            const uniqueId = item.isVariant ? `${item.id}-${item.variantSku}` : item.id;
            return selectedItems.includes(uniqueId);
        });

        if (itemsToOrder.length === 0) {
            alert("Please select items to order.");
            return;
        }

        const poItemsData = itemsToOrder.map(item => ({
            productId: item.id,
            productName: item.name,
            quantity: Math.max(10, ((item.minStockLevel || 5) * 2) - (item.quantity || 0)),
            cost: item.cost || 0,
            variantSku: item.variantSku || ''
        }));

        setVendorId(vendorIdToUse);
        setPoItems(poItemsData);
        handleOpen();
    };

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    Recommended Low-Stock Replenishment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Items below minimum buffer stock level. Select items and click "Create PO" to auto-populate an order.
                </Typography>
            </Box>

            {Object.keys(groupedItems).length === 0 ? (
                <GlassCard sx={{ p: 5, textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 48, color: '#059669', mb: 1.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>All Fabric & Garment Stock Levels Healthy!</Typography>
                    <Typography variant="body2" color="text.secondary">
                        No products are currently under their configured minimum threshold.
                    </Typography>
                </GlassCard>
            ) : (
                Object.entries(groupedItems).map(([supplier, items]) => (
                    <GlassCard key={supplier} sx={{ mb: 3, p: 0, overflow: 'hidden' }}>
                        <Box sx={{ 
                            p: 2, 
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15, 118, 110, 0.05)', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            borderBottom: '1px solid',
                            borderColor: 'divider'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Checkbox
                                    checked={items.every(item => selectedItems.includes(item.isVariant ? `${item.id}-${item.variantSku}` : item.id))}
                                    indeterminate={
                                        items.some(item => selectedItems.includes(item.isVariant ? `${item.id}-${item.variantSku}` : item.id)) &&
                                        !items.every(item => selectedItems.includes(item.isVariant ? `${item.id}-${item.variantSku}` : item.id))
                                    }
                                    onChange={(e) => handleSelectAll(supplier, items, e.target.checked)}
                                />
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{supplier}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {items.length} items requiring replenishment
                                    </Typography>
                                </Box>
                            </Box>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => createBulkPO(supplier, items)}
                                disabled={!items.some(item => selectedItems.includes(item.isVariant ? `${item.id}-${item.variantSku}` : item.id))}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    px: 2.5,
                                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                }}
                            >
                                Generate PO for Selected ({items.filter(item => selectedItems.includes(item.isVariant ? `${item.id}-${item.variantSku}` : item.id)).length})
                            </Button>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                                    <TableRow>
                                        <TableCell sx={{ width: 48 }} />
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Product & Details</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Buy Cost (₹)</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Current Stock</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Min Threshold</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map((item) => {
                                        const uniqueId = item.isVariant ? `${item.id}-${item.variantSku}` : item.id;
                                        const isSelected = selectedItems.includes(uniqueId);

                                        return (
                                            <TableRow key={uniqueId} hover selected={isSelected}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={() => handleSelectItem(uniqueId)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                                                    {item.isVariant && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Variant: {item.variantSku} ({item.size} / {item.color})
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                    ₹{(item.cost || 0).toLocaleString('en-IN')}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip 
                                                        label={item.quantity || 0} 
                                                        size="small" 
                                                        sx={{ 
                                                            bgcolor: 'rgba(239, 68, 68, 0.1)', 
                                                            color: '#DC2626', 
                                                            fontWeight: 800,
                                                            border: '1px solid rgba(239, 68, 68, 0.2)'
                                                        }} 
                                                    />
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                                    {item.minStockLevel || 5}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label="Critical Low"
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                                                            color: '#DC2626',
                                                            fontWeight: 800,
                                                            fontSize: '0.7rem'
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </GlassCard>
                ))
            )}
        </Box>
    );
};

export default Purchases;
