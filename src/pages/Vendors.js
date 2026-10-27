import React, { useState, useMemo } from 'react';
import { 
    Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, 
    Table, TableBody, TableCell, TableHead, TableRow, IconButton, Typography, 
    TableContainer, Grid, Chip, TablePagination, useTheme, useMediaQuery, Avatar, Tooltip, 
    InputAdornment, MenuItem, Rating
} from '@mui/material';
import { 
    Add, Edit, Delete, Store, LocalShipping, AttachMoney, Search, 
    Phone, Email, WhatsApp, Close, AccessTime
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import GlassCard from '../components/GlassCard';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';

const VENDOR_CATEGORIES = [
    'Fabric Mills (Silk, Cotton, Velvet)',
    'Embroidery & Zari Work',
    'Trims, Laces & Buttons',
    'Dyeing & Hand Block Printing',
    'Tailoring & Stitching Partner',
    'Packaging & Boutique Supplies',
    'General Supplier'
];

const Vendors = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { vendors, addVendor, updateVendor, deleteVendor } = useData();
    const [open, setOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ 
        name: '', 
        phone: '', 
        email: '', 
        person: '', 
        gst: '', 
        terms: '', 
        address: '', 
        category: 'Fabric Mills (Silk, Cotton, Velvet)',
        qualityRating: 5 
    });
    const [deleteId, setDeleteId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Filters and Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [balanceFilter, setBalanceFilter] = useState('All');

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

    const handleOpen = (item = null) => {
        if (item) {
            setEditItem(item);
            setForm({
                name: item.name || '',
                phone: item.phone || '',
                email: item.email || '',
                person: item.person || '',
                gst: item.gst || '',
                terms: item.terms || '',
                address: item.address || '',
                category: item.category || 'Fabric Mills (Silk, Cotton, Velvet)',
                qualityRating: item.qualityRating !== undefined ? item.qualityRating : 5
            });
        } else {
            setEditItem(null);
            setForm({ 
                name: '', 
                phone: '', 
                email: '', 
                person: '', 
                gst: '', 
                terms: '', 
                address: '', 
                category: 'Fabric Mills (Silk, Cotton, Velvet)',
                qualityRating: 5 
            });
        }
        setOpen(true);
    };

    const handleSave = async () => {
        if (editItem) {
            await updateVendor(editItem.id, form);
        } else {
            await addVendor(form);
        }
        setOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (deleteId) {
            await deleteVendor(deleteId);
            setDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const openDeleteDialog = (id) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
    };

    // Filtered Vendors calculation
    const filteredVendors = useMemo(() => {
        return vendors.filter((v) => {
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query || 
                (v.name || '').toLowerCase().includes(query) ||
                (v.person || '').toLowerCase().includes(query) ||
                (v.phone || '').toLowerCase().includes(query) ||
                (v.email || '').toLowerCase().includes(query) ||
                (v.gst || '').toLowerCase().includes(query) ||
                (v.category || '').toLowerCase().includes(query);

            const matchesCategory = categoryFilter === 'All' || v.category === categoryFilter;

            const matchesBalance = balanceFilter === 'All' || 
                (balanceFilter === 'Outstanding' && (v.balance || 0) > 0) ||
                (balanceFilter === 'Settled' && (v.balance || 0) <= 0);

            return matchesSearch && matchesCategory && matchesBalance;
        });
    }, [vendors, searchQuery, categoryFilter, balanceFilter]);

    // Summary KPI calculations
    const totalVendors = vendors.length;
    const totalPayable = vendors.reduce((sum, v) => sum + (v.balance || 0), 0);
    const avgLeadTime = Math.round(
        vendors.reduce((sum, v) => sum + (v.performance?.avgLeadTime || 0), 0) / 
        Math.max(1, vendors.filter(v => v.performance?.avgLeadTime).length)
    ) || 0;

    // Vendor avatar generator
    const getAvatarLetter = (name) => {
        return (name || 'V').trim().charAt(0).toUpperCase();
    };

    return (
        <Box>
            {/* Atelier Luxury Header with Breadcrumbs & Action */}
            <PageHeader
                title="Fabric & Vendors Directory"
                subtitle="Manage textile suppliers, master craft mills, and procurement partners"
                breadcrumbs={[
                    { label: 'Aleen Clothing', path: '/' },
                    { label: 'Purchases & Stock', path: '/purchases' },
                    { label: 'Vendors & Mills' }
                ]}
                actions={
                    <Button 
                        variant="contained" 
                        startIcon={<Add sx={{ fontSize: 19, color: '#FFFFFF !important' }} />} 
                        onClick={() => handleOpen()} 
                        sx={{
                            height: 40,
                            minHeight: 40,
                            px: 2.75,
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxSizing: 'border-box',
                            background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%) !important',
                            color: '#FFFFFF !important',
                            boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            '& .MuiSvgIcon-root': {
                                color: '#FFFFFF !important'
                            },
                            '&:hover': {
                                background: 'linear-gradient(135deg, #115E59 0%, #021C1B 100%) !important',
                                boxShadow: '0 6px 18px rgba(15, 118, 110, 0.45)',
                                transform: 'translateY(-1px)'
                            }
                        }}
                    >
                        Add Vendor / Mill
                    </Button>
                }
            />

            {/* Atelier KPI Summary Cards */}
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                <Grid item xs={12} sm={4}>
                    <AtelierKpiCard
                        title="Fabric & Mill Partners"
                        value={totalVendors}
                        icon={<Store fontSize="small" />}
                        subtitle="Active registered suppliers"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <AtelierKpiCard
                        title="Outstanding Payables"
                        value={`₹${totalPayable.toLocaleString('en-IN')}`}
                        icon={<AttachMoney fontSize="small" />}
                        goldAccent={true}
                        subtitle="Pending supplier balance"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <AtelierKpiCard
                        title="Avg Fulfillment Lead Time"
                        value={`${avgLeadTime} Days`}
                        icon={<LocalShipping fontSize="small" />}
                        subtitle="Across mill procurement orders"
                    />
                </Grid>
            </Grid>

            {/* Filter and Search Bar */}
            <GlassCard sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by vendor name, contact person, phone, GST..."
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
                    <Grid item xs={12} sm={6} md={3.5}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Specialization / Category"
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            <MenuItem value="All">All Categories ({vendors.length})</MenuItem>
                            {VENDOR_CATEGORIES.map(cat => (
                                <MenuItem key={cat} value={cat}>
                                    {cat}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.5}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Payment Balance"
                            value={balanceFilter}
                            onChange={(e) => {
                                setBalanceFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            <MenuItem value="All">All Ledgers</MenuItem>
                            <MenuItem value="Outstanding">Has Outstanding Balance</MenuItem>
                            <MenuItem value="Settled">Settled / Zero Balance</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {(searchQuery || categoryFilter !== 'All' || balanceFilter !== 'All') && (
                            <Button 
                                size="small" 
                                color="inherit" 
                                onClick={() => {
                                    setSearchQuery('');
                                    setCategoryFilter('All');
                                    setBalanceFilter('All');
                                    setPage(0);
                                }}
                                sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                                Reset
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </GlassCard>

            {/* Vendors Table with Aligned Columns */}
            <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
                <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <Table sx={{ minWidth: 680 }} stickyHeader>
                        <TableHead sx={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 2,
                            '& th': {
                                backdropFilter: 'blur(10px)',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 32, 32, 0.92)' : 'rgba(255, 255, 255, 0.92)',
                                borderBottom: theme.palette.mode === 'dark' ? '1.5px solid rgba(255, 255, 255, 0.1)' : '1.5px solid rgba(15, 118, 110, 0.15)'
                            }
                        }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Vendor / Supplier
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Contact & Communication
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Specialization & Rating
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Order History
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Balance Due
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredVendors.length > 0 ? (
                                (rowsPerPage > 0
                                    ? filteredVendors.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    : filteredVendors
                                ).map((vendor) => {
                                    const balance = vendor.balance || 0;
                                    const rawPhone = (vendor.phone || '').replace(/[^0-9]/g, '');
                                    const waNumber = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

                                    return (
                                        <TableRow 
                                            key={vendor.id} 
                                            hover
                                            sx={{ '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(15, 118, 110, 0.02)' } }}
                                        >
                                            {/* Vendor Name & Firm */}
                                            <TableCell sx={{ py: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                                                    <Avatar 
                                                        sx={{ 
                                                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#0F766E', 
                                                            color: '#ffffff',
                                                            fontWeight: 800,
                                                            width: 40,
                                                            height: 40,
                                                            fontSize: '1rem',
                                                            boxShadow: '0 2px 8px rgba(15, 118, 110, 0.2)'
                                                        }}
                                                    >
                                                        {getAvatarLetter(vendor.name)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.9rem' }}>
                                                            {vendor.name}
                                                        </Typography>
                                                        {vendor.category && (
                                                            <Chip 
                                                                label={vendor.category}
                                                                size="small"
                                                                sx={{ 
                                                                    height: 20, 
                                                                    fontSize: '0.68rem', 
                                                                    fontWeight: 600,
                                                                    mt: 0.4,
                                                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.1)',
                                                                    color: '#D97706',
                                                                    border: '1px solid rgba(217, 119, 6, 0.2)'
                                                                }}
                                                            />
                                                        )}
                                                        {vendor.gst && (
                                                            <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 500, mt: 0.3 }}>
                                                                GST: {vendor.gst}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            {/* Contact Details & WhatsApp Link */}
                                            <TableCell sx={{ py: 2 }}>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {vendor.person || 'Direct Contact'}
                                                    </Typography>
                                                    
                                                    {vendor.phone && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                                                {vendor.phone}
                                                            </Typography>
                                                            {rawPhone && (
                                                                <Tooltip title="Message via WhatsApp">
                                                                    <IconButton 
                                                                        component="a" 
                                                                        href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello ${vendor.name}, regarding our boutique order:`)}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        size="small" 
                                                                        sx={{ p: 0.25, color: '#25D366' }}
                                                                    >
                                                                        <WhatsApp sx={{ fontSize: '0.95rem' }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    )}

                                                    {vendor.email && (
                                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 500, mt: 0.2 }}>
                                                            {vendor.email}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>

                                            {/* Specialization & Quality Rating */}
                                            <TableCell sx={{ py: 2 }}>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                                        <Rating 
                                                            value={Number(vendor.qualityRating) || 5} 
                                                            readOnly 
                                                            precision={0.5} 
                                                            size="small" 
                                                            sx={{ color: '#D97706', fontSize: '0.9rem' }}
                                                        />
                                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                                            ({vendor.qualityRating || 5})
                                                        </Typography>
                                                    </Box>
                                                    {vendor.terms && (
                                                        <Chip 
                                                            label={`Terms: ${vendor.terms}`} 
                                                            size="small" 
                                                            variant="outlined" 
                                                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                                                        />
                                                    )}
                                                </Box>
                                            </TableCell>

                                            {/* Order History & Lead Time */}
                                            <TableCell sx={{ py: 2 }}>
                                                {vendor.performance ? (
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <AccessTime sx={{ fontSize: '0.85rem', color: '#0F766E' }} />
                                                            {vendor.performance.avgLeadTime || 0} days avg
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                            {vendor.performance.totalOrders || 0} procurement orders
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                        No past orders
                                                    </Typography>
                                                )}
                                            </TableCell>

                                            {/* Balance Due (Right-aligned) */}
                                            <TableCell align="right" sx={{ py: 2 }}>
                                                <Chip
                                                    label={`₹${balance.toLocaleString('en-IN')}`}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: balance > 0 
                                                            ? (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.1)') 
                                                            : (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.1)'),
                                                        color: balance > 0 ? '#DC2626' : '#059669',
                                                        border: balance > 0 ? '1px solid rgba(220, 38, 38, 0.25)' : '1px solid rgba(5, 150, 105, 0.25)',
                                                        fontWeight: 800,
                                                        fontSize: '0.825rem',
                                                        px: 0.75,
                                                        py: 0.5,
                                                        borderRadius: 1.75
                                                    }}
                                                />
                                            </TableCell>

                                            {/* Actions (Right-aligned) */}
                                            <TableCell align="right" sx={{ py: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                                    <Tooltip title="Edit Vendor Details">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleOpen(vendor)} 
                                                            sx={{ 
                                                                color: '#0F766E',
                                                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.1)' : 'rgba(15, 118, 110, 0.08)',
                                                                '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.18)' }
                                                            }}
                                                        >
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Vendor">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => openDeleteDialog(vendor.id)} 
                                                            sx={{ 
                                                                color: 'error.main',
                                                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                                                                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.18)' }
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
                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                        <Store sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                            No vendors match your search criteria.
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Try adjusting your filters or click "Add Vendor / Mill" to create one.
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
                    count={filteredVendors.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                />
            </GlassCard>

            {/* Add / Edit Vendor Modal Dialog */}
            <Dialog 
                open={open} 
                onClose={() => setOpen(false)} 
                maxWidth="sm" 
                fullWidth 
                fullScreen={isMobile}
                PaperProps={{ 
                    sx: { 
                        borderRadius: isMobile ? 0 : '16px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
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
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
                            <Store />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.02em' }}>
                                {editItem ? 'Edit Vendor / Mill Profile' : 'Register New Vendor / Mill'}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500 }}>
                                Aleen Clothing Supplier & Textile Partner Directory
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 3, mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={7}>
                            <TextField 
                                fullWidth 
                                label="Vendor / Firm / Mill Name *" 
                                value={form.name} 
                                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                                placeholder="e.g. Royal Banarasi Silk Mills"
                                autoFocus
                            />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                            <TextField 
                                select
                                fullWidth 
                                label="Specialization" 
                                value={form.category} 
                                onChange={(e) => setForm({ ...form, category: e.target.value })} 
                            >
                                {VENDOR_CATEGORIES.map(cat => (
                                    <MenuItem key={cat} value={cat}>
                                        {cat}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField 
                                fullWidth 
                                label="Contact Person / Representative" 
                                value={form.person} 
                                onChange={(e) => setForm({ ...form, person: e.target.value })} 
                                placeholder="e.g. Master Rajesh Ji"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                fullWidth 
                                label="Phone / WhatsApp Number *" 
                                value={form.phone} 
                                onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                                placeholder="e.g. +91 98765 43210"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Phone fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField 
                                fullWidth 
                                label="Email Address" 
                                value={form.email} 
                                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                                placeholder="vendor@fabrics.com"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Email fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                fullWidth 
                                label="GSTIN / Tax ID" 
                                value={form.gst} 
                                onChange={(e) => setForm({ ...form, gst: e.target.value })} 
                                placeholder="e.g. 07AAAAA0000A1Z5"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField 
                                fullWidth 
                                label="Payment Terms" 
                                value={form.terms} 
                                onChange={(e) => setForm({ ...form, terms: e.target.value })} 
                                placeholder="e.g. Net 30, Advance 50%" 
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
                                    Quality & Craftsmanship Rating
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Rating
                                        value={Number(form.qualityRating) || 5}
                                        precision={0.5}
                                        onChange={(event, newValue) => {
                                            setForm({ ...form, qualityRating: newValue || 5 });
                                        }}
                                        sx={{ color: '#D97706' }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                        {form.qualityRating} / 5
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField 
                                fullWidth 
                                label="Mill / Workshop Physical Address" 
                                value={form.address} 
                                onChange={(e) => setForm({ ...form, address: e.target.value })} 
                                multiline 
                                rows={2} 
                                placeholder="e.g. Plot 42, Weavers Colony, Surat, Gujarat"
                            />
                        </Grid>
                    </Grid>
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
                        disabled={!form.name || !form.name.trim()}
                        sx={{
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            fontWeight: 700,
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                            color: '#ffffff',
                            boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #115E59 0%, #02201E 100%)',
                                boxShadow: '0 6px 18px rgba(15, 118, 110, 0.45)'
                            },
                            '&.Mui-disabled': {
                                background: 'rgba(0, 0, 0, 0.12)',
                                color: 'rgba(0, 0, 0, 0.26)'
                            }
                        }}
                    >
                        {editItem ? 'Save Changes' : 'Register Vendor'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Vendor Record"
                content="Are you sure you want to delete this vendor? This will remove their record and contact details."
            />
        </Box>
    );
};

export default Vendors;
