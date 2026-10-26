import React, { useState, useMemo } from 'react';
import { 
    Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, 
    Table, TableBody, TableCell, TableHead, TableRow, IconButton, MenuItem, 
    Typography, TableContainer, Chip, Grid, useTheme, useMediaQuery, TablePagination, 
    TableSortLabel, InputAdornment, Tooltip, Avatar 
} from '@mui/material';
import { 
    Edit, Delete, Add, Search, ReceiptLong, AccountBalanceWallet, 
    Download, Upload, Close, ArrowUpward, ArrowDownward, TrendingUp
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import FinanceNavTabs from '../components/crm/FinanceNavTabs';

const Expenses = () => {
    const { expenses, addExpense, updateExpense, deleteExpense, bulkAddExpenses, expenseCategories, updateExpenseCategories } = useData();
    const [open, setOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [newCategory, setNewCategory] = useState('');
    const [form, setForm] = useState({
        title: '', amount: '', category: 'General', date: new Date().toISOString().split('T')[0], note: ''
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
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleAddCategory = () => {
        if (newCategory.trim() && !expenseCategories.includes(newCategory.trim())) {
            updateExpenseCategories([...expenseCategories, newCategory.trim()]);
            setForm(prev => ({ ...prev, category: newCategory.trim() }));
            setNewCategory('');
        }
    };

    // Sorting State
    const [orderBy, setOrderBy] = useState('date');
    const [order, setOrder] = useState('desc');

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const query = search.toLowerCase().trim();
            const matchesSearch = !query ||
                (exp.title || '').toLowerCase().includes(query) ||
                (exp.note || '').toLowerCase().includes(query);

            const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [expenses, search, categoryFilter]);

    const sortedExpenses = useMemo(() => {
        return [...filteredExpenses].sort((a, b) => {
            if (orderBy === 'amount') {
                return order === 'asc' ? ((Number(a[orderBy]) || 0) - (Number(b[orderBy]) || 0)) : ((Number(b[orderBy]) || 0) - (Number(a[orderBy]) || 0));
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
    }, [filteredExpenses, orderBy, order]);

    const totalExpense = useMemo(() => {
        return expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    }, [expenses]);

    const thisMonthExpense = useMemo(() => {
        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            const today = new Date();
            return expDate.getMonth() === today.getMonth() && expDate.getFullYear() === today.getFullYear();
        }).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    }, [expenses]);

    const avgExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;

    const handleOpen = (item = null) => {
        if (item) {
            setEditItem(item);
            setForm({
                title: item.title || '',
                amount: item.amount || '',
                category: item.category || 'General',
                date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                note: item.note || ''
            });
        } else {
            setEditItem(null);
            setForm({ 
                title: '', 
                amount: '', 
                category: expenseCategories[0] || 'General', 
                date: new Date().toISOString().split('T')[0], 
                note: '' 
            });
        }
        setOpen(true);
    };

    const handleSave = async () => {
        const data = { ...form, amount: parseFloat(form.amount) || 0 };
        if (editItem) {
            await updateExpense(editItem.id, data);
        } else {
            await addExpense(data);
        }
        setOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (deleteId) {
            await deleteExpense(deleteId);
            setDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const openDeleteDialog = (id) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const downloadExpenses = () => {
        const csvData = sortedExpenses.map(item => ({
            'Date': item.date,
            'Title': item.title,
            'Category': item.category,
            'Amount': item.amount,
            'Note': item.note || ''
        }));

        if (csvData.length === 0) {
            alert('No expenses to export.');
            return;
        }

        const headers = ['Date', 'Title', 'Category', 'Amount', 'Note'];
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(h => `"${(row[h] !== undefined && row[h] !== null ? row[h] : '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aleen_expenses_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const downloadTemplate = () => {
        const headers = ['date', 'title', 'category', 'amount', 'note'];
        const csvContent = [
            headers.join(','),
            [new Date().toISOString().split('T')[0], 'Workshop Rent', 'Rent', '15000', 'Monthly atelier premises rent'].map(v => `"${v}"`).join(',')
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aleen_expense_import_template.csv`;
        link.click();
    };

    const handleBulkUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const items = lines.slice(1).map(line => {
                const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/"/g, ''));
                const item = {};
                headers.forEach((h, i) => {
                    if (h === 'amount') item[h] = parseFloat(values[i]) || 0;
                    else item[h] = values[i] || '';
                });
                return item;
            });

            if (items.length > 0) {
                try {
                    await bulkAddExpenses(items);
                    alert(`Successfully imported ${items.length} expenses into register.`);
                } catch (error) {
                    console.error('Bulk upload error:', error);
                    alert('Error uploading expenses. Please verify the CSV header format.');
                }
            }
        };
        reader.readAsText(file);
        event.target.value = null;
    };

    return (
        <Box>
            {/* Atelier Luxury Header with Breadcrumbs & Actions */}
            <PageHeader
                title="Boutique Expenses Register"
                subtitle="Track workshop rent, master tailor disbursements, packaging & operating overheads"
                breadcrumbs={[
                    { label: 'Aleen Clothing', path: '/' },
                    { label: 'Finance & Audit' },
                    { label: 'Expenses Register' }
                ]}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<Download sx={{ fontSize: 19, color: '#0F766E' }} />}
                            onClick={downloadExpenses}
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 2.25,
                                borderRadius: '24px',
                                border: '1.5px solid #0F766E',
                                color: '#0F766E',
                                bgcolor: 'background.paper',
                                fontWeight: 700,
                                fontSize: '0.84rem',
                                textTransform: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                '&:hover': {
                                    border: '1.5px solid #042F2E',
                                    bgcolor: 'rgba(15, 118, 110, 0.05)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Export CSV
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Download sx={{ fontSize: 19, color: '#0F766E' }} />}
                            onClick={downloadTemplate}
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 2.25,
                                borderRadius: '24px',
                                border: '1.5px solid rgba(15, 118, 110, 0.3)',
                                color: '#0F766E',
                                bgcolor: 'background.paper',
                                fontWeight: 700,
                                fontSize: '0.84rem',
                                textTransform: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                '&:hover': {
                                    border: '1.5px solid #0F766E',
                                    bgcolor: 'rgba(15, 118, 110, 0.05)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Template
                        </Button>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<Upload sx={{ fontSize: 19, color: '#0F766E' }} />}
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 2.25,
                                borderRadius: '24px',
                                border: '1.5px solid rgba(15, 118, 110, 0.3)',
                                color: '#0F766E',
                                bgcolor: 'background.paper',
                                fontWeight: 700,
                                fontSize: '0.84rem',
                                textTransform: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                '&:hover': {
                                    border: '1.5px solid #0F766E',
                                    bgcolor: 'rgba(15, 118, 110, 0.05)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Bulk Import
                            <input type="file" hidden accept=".csv" onChange={handleBulkUpload} />
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add sx={{ fontSize: 19, color: '#FFFFFF !important' }} />}
                            onClick={() => handleOpen()}
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 3,
                                borderRadius: '24px',
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
                            Log Expense
                        </Button>
                    </Box>
                }
            />

            {/* Finance & Audit Suite Sub-Nav Tabs */}
            <FinanceNavTabs />

            {/* Atelier KPI Cards: Responsive Grid on Mobile, 3 Columns on Tablet/Desktop */}
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
                <Grid item xs={6} sm={4}>
                    <AtelierKpiCard
                        title="This Month's Overhead"
                        value={`₹${thisMonthExpense.toLocaleString('en-IN')}`}
                        icon={<AccountBalanceWallet fontSize="small" />}
                        goldAccent={true}
                        subtitle="Operating costs current month"
                    />
                </Grid>
                <Grid item xs={6} sm={4}>
                    <AtelierKpiCard
                        title="Total Recorded Expenses"
                        value={`₹${totalExpense.toLocaleString('en-IN')}`}
                        icon={<ReceiptLong fontSize="small" />}
                        subtitle={`Across ${expenses.length} ledger entries`}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <AtelierKpiCard
                        title="Average Expense Entry"
                        value={`₹${avgExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                        icon={<TrendingUp fontSize="small" />}
                        subtitle="Mean disbursement value"
                    />
                </Grid>
            </Grid>

            {/* Search and Filters Toolbar */}
            <GlassCard sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by expense title or description note..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>,
                                endAdornment: search && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearch('')}>
                                            <Close fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={6} sm={4} md={3}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Expense Category"
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            <MenuItem value="All">All Categories ({expenses.length})</MenuItem>
                            {expenseCategories.map(cat => (
                                <MenuItem key={cat} value={cat}>
                                    {cat}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2.5}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Sort By"
                            value={orderBy}
                            onChange={(e) => setOrderBy(e.target.value)}
                        >
                            <MenuItem value="date">Date</MenuItem>
                            <MenuItem value="amount">Amount (₹)</MenuItem>
                            <MenuItem value="category">Category</MenuItem>
                            <MenuItem value="title">Expense Title</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4} md={1.5} sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                        <Tooltip title={order === 'asc' ? 'Ascending Order' : 'Descending Order'}>
                            <IconButton 
                                size="small" 
                                onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
                                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 0.8 }}
                            >
                                {order === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                        {(search || categoryFilter !== 'All') && (
                            <Button 
                                size="small" 
                                color="inherit" 
                                onClick={() => {
                                    setSearch('');
                                    setCategoryFilter('All');
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

            {/* Expenses Table with Proper Column Alignment */}
            <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
                <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <Table size="small" sx={{ minWidth: 680 }}>
                        <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15, 118, 110, 0.04)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    <TableSortLabel active={orderBy === 'date'} direction={orderBy === 'date' ? order : 'asc'} onClick={() => handleRequestSort('date')}>
                                        Date
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    <TableSortLabel active={orderBy === 'title'} direction={orderBy === 'title' ? order : 'asc'} onClick={() => handleRequestSort('title')}>
                                        Expense Description
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    <TableSortLabel active={orderBy === 'category'} direction={orderBy === 'category' ? order : 'asc'} onClick={() => handleRequestSort('category')}>
                                        Category
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    <TableSortLabel active={orderBy === 'amount'} direction={orderBy === 'amount' ? order : 'asc'} onClick={() => handleRequestSort('amount')}>
                                        Amount (₹)
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Audit Note
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75, pr: 2 }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedExpenses.length > 0 ? (
                                (rowsPerPage > 0
                                    ? sortedExpenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    : sortedExpenses
                                ).map((exp) => (
                                    <TableRow 
                                        key={exp.id} 
                                        hover
                                        sx={{ '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(15, 118, 110, 0.02)' } }}
                                    >
                                        <TableCell sx={{ py: 1.75 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.75 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                {exp.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.75 }}>
                                            <Chip 
                                                label={exp.category || 'General'} 
                                                size="small" 
                                                sx={{ 
                                                    height: 22, 
                                                    fontSize: '0.72rem', 
                                                    fontWeight: 700,
                                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(217, 119, 6, 0.1)',
                                                    color: '#D97706',
                                                    border: '1px solid rgba(217, 119, 6, 0.25)'
                                                }} 
                                            />
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 1.75 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F766E', fontSize: '0.95rem' }}>
                                                ₹{(Number(exp.amount) || 0).toLocaleString('en-IN')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.75 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                {exp.note || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 1.75, pr: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                                <Tooltip title="Edit Expense">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleOpen(exp)} 
                                                        sx={{ 
                                                            color: '#0F766E',
                                                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.1)' : 'rgba(15, 118, 110, 0.08)',
                                                            '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.2)' }
                                                        }}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete Expense">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => openDeleteDialog(exp.id)} 
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
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <ReceiptLong sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                            No expense records found.
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Click "Log Expense" to record shop utilities, tailoring wages, or rent.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={sortedExpenses.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                />
            </GlassCard>

            {/* Log / Edit Expense Dialog */}
            <Dialog 
                open={open} 
                onClose={() => setOpen(false)} 
                maxWidth="sm" 
                fullWidth 
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3.5, overflow: 'hidden' } }}
            >
                <DialogTitle 
                    sx={{ 
                        background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)', 
                        color: 'white', 
                        px: 3, 
                        py: 2.25,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }}>
                            <ReceiptLong />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                                {editItem ? 'Edit Overhead Expense' : 'Log New Boutique Expense'}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85 }}>
                                Aleen Clothing Internal Expense Ledger
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 3, mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField 
                                fullWidth 
                                label="Expense Title / Beneficiary *" 
                                value={form.title} 
                                onChange={(e) => setForm({ ...form, title: e.target.value })} 
                                placeholder="e.g. Master Tailor Zari Work Wages"
                                autoFocus
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                fullWidth 
                                label="Disbursement Amount (₹) *" 
                                type="number" 
                                value={form.amount} 
                                onChange={(e) => setForm({ ...form, amount: e.target.value })} 
                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                placeholder="0.00"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                fullWidth 
                                label="Disbursement Date" 
                                type="date" 
                                value={form.date} 
                                onChange={(e) => setForm({ ...form, date: e.target.value })} 
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField 
                                select 
                                fullWidth 
                                label="Expense Category" 
                                value={form.category} 
                                onChange={(e) => setForm({ ...form, category: e.target.value })} 
                            >
                                {expenseCategories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                            </TextField>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                                <TextField 
                                    size="small" 
                                    placeholder="+ Add new expense category" 
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
                                label="Audit Memo / Notes" 
                                value={form.note} 
                                onChange={(e) => setForm({ ...form, note: e.target.value })} 
                                multiline 
                                rows={2} 
                                placeholder="e.g. Paid in cash by store manager, invoice voucher attached"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        variant="contained" 
                        disabled={!form.title.trim() || !form.amount}
                        sx={{
                            borderRadius: 2,
                            px: 3.5,
                            py: 1,
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
                        {editItem ? 'Save Changes' : 'Confirm & Log Expense'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Expense Entry"
                content="Are you sure you want to delete this expense record? This will adjust your operating cost calculations."
            />
        </Box>
    );
};

export default Expenses;
