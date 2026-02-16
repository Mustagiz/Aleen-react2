import React, { useState } from 'react';
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow, IconButton, MenuItem, Paper, Typography, TableContainer, Chip, Card, CardContent, Grid, useTheme, useMediaQuery, Divider, TablePagination, TableSortLabel } from '@mui/material';
import { Edit, Delete, Add, Search, ReceiptLong, AccountBalanceWallet, Warning, Download, Upload } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

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
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleAddCategory = () => {
        if (newCategory.trim() && !expenseCategories.includes(newCategory.trim())) {
            updateExpenseCategories([...expenseCategories, newCategory.trim()]);
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

    const sortedExpenses = expenses.filter(exp =>
        (exp.title?.toLowerCase().includes(search.toLowerCase()) || exp.note?.toLowerCase().includes(search.toLowerCase())) &&
        (categoryFilter === 'All' || exp.category === categoryFilter)
    ).sort((a, b) => {
        if (orderBy === 'amount') {
            return order === 'asc' ? (a[orderBy] - b[orderBy]) : (b[orderBy] - a[orderBy]);
        }
        if (orderBy === 'date') {
            return order === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
        }
        // Handle string sorting (case-insensitive)
        const valA = (a[orderBy] || '').toString().toLowerCase();
        const valB = (b[orderBy] || '').toString().toLowerCase();
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });

    const totalExpense = sortedExpenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const thisMonthExpense = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        const today = new Date();
        return expDate.getMonth() === today.getMonth() && expDate.getFullYear() === today.getFullYear();
    }).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    const handleOpen = (item = null) => {
        if (item) {
            setEditItem(item);
            setForm(item);
        } else {
            setEditItem(null);
            setForm({ title: '', amount: '', category: 'General', date: new Date().toISOString().split('T')[0], note: '' });
        }
        setOpen(true);
    };

    const handleSave = async () => {
        const data = { ...form, amount: parseFloat(form.amount) };
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

        const headers = ['Date', 'Title', 'Category', 'Amount', 'Note'];
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(h => `"${row[h]}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const downloadTemplate = () => {
        const headers = ['date', 'title', 'category', 'amount', 'note'];
        const csvContent = [
            headers.join(','),
            [new Date().toISOString().split('T')[0], 'Office Rent', 'Rent', '5000', 'Monthly rent'].map(v => `"${v}"`).join(',')
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `expense_template.csv`;
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
                    alert(`Successfully uploaded ${items.length} expenses`);
                } catch (error) {
                    console.error('Bulk upload error:', error);
                    alert('Error uploading expenses. Please check the file format.');
                }
            }
        };
        reader.readAsText(file);
        event.target.value = null; // Reset input
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>Miscellaneous Expenses</Typography>
                    <Typography variant="body2" color="text.secondary">Track your overheads and business costs</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="outlined" startIcon={<Download />} onClick={downloadExpenses} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Export</Button>
                    <Button variant="outlined" startIcon={<Download />} onClick={downloadTemplate} color="secondary" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Template</Button>
                    <Button variant="outlined" component="label" startIcon={<Upload />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                        Bulk Upload
                        <input type="file" hidden accept=".csv" onChange={handleBulkUpload} />
                    </Button>
                    <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #d97706 0%, #f97316 100%)',
                        boxShadow: `0 4px 12px ${theme.palette.primary.main}33`,
                        '&:hover': { background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)', transform: 'translateY(-2px)' }
                    }}>
                        Add Expense
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ borderRadius: 4, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(219, 39, 119, 0.15)', border: '1px solid rgba(219, 39, 119, 0.1)', background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(219, 39, 119, 0.05) 100%)` }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#DB2777' }} />
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>This Month</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>₹{thisMonthExpense.toLocaleString()}</Typography>
                            </Box>
                            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(219, 39, 119, 0.1)', color: '#DB2777' }}><AccountBalanceWallet /></Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ borderRadius: 4, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(183, 110, 121, 0.15)', border: '1px solid rgba(183, 110, 121, 0.1)', background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(183, 110, 121, 0.05) 100%)` }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: '#B76E79' }} />
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>Total Expenses</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>₹{totalExpense.toLocaleString()}</Typography>
                            </Box>
                            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(183, 110, 121, 0.1)', color: '#B76E79' }}><ReceiptLong /></Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Search sx={{ color: 'text.secondary' }} />
                <TextField placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} variant="standard" fullWidth InputProps={{ disableUnderline: true }} />
                <TextField select size="small" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} sx={{ minWidth: 150 }}>
                    <MenuItem value="All">All Categories</MenuItem>
                    {expenseCategories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Sort By" value={orderBy} onChange={(e) => setOrderBy(e.target.value)} sx={{ minWidth: 120 }}>
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="amount">Amount</MenuItem>
                    <MenuItem value="category">Category</MenuItem>
                    <MenuItem value="title">Title</MenuItem>
                </TextField>
                <TextField select size="small" label="Order" value={order} onChange={(e) => setOrder(e.target.value)} sx={{ minWidth: 100 }}>
                    <MenuItem value="asc">Asc</MenuItem>
                    <MenuItem value="desc">Desc</MenuItem>
                </TextField>
            </Paper>

            <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>
                                    <TableSortLabel active={orderBy === 'date'} direction={orderBy === 'date' ? order : 'asc'} onClick={() => handleRequestSort('date')}>
                                        Date
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>
                                    <TableSortLabel active={orderBy === 'title'} direction={orderBy === 'title' ? order : 'asc'} onClick={() => handleRequestSort('title')}>
                                        Expense Title
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>
                                    <TableSortLabel active={orderBy === 'category'} direction={orderBy === 'category' ? order : 'asc'} onClick={() => handleRequestSort('category')}>
                                        Category
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>
                                    <TableSortLabel active={orderBy === 'amount'} direction={orderBy === 'amount' ? order : 'asc'} onClick={() => handleRequestSort('amount')}>
                                        Amount
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Note</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedExpenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((exp) => (
                                <TableRow key={exp.id} hover>
                                    <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{exp.title}</TableCell>
                                    <TableCell><Chip label={exp.category} size="small" variant="outlined" /></TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: 'error.main' }}>₹{exp.amount.toLocaleString()}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{exp.note || '-'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleOpen(exp)} sx={{ color: 'primary.main' }}><Edit fontSize="small" /></IconButton>
                                        <IconButton size="small" onClick={() => openDeleteDialog(exp.id)} sx={{ color: 'error.main' }}><Delete fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sortedExpenses.length === 0 && (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No expenses found</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={sortedExpenses.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} />
            </Paper>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 800 }}>{editItem ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <TextField fullWidth label="Expense Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} margin="normal" placeholder="e.g. Office Rent" />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField fullWidth label="Amount (₹)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} margin="normal" />
                        <TextField select fullWidth label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} margin="normal">
                            {expenseCategories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                        </TextField>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <TextField size="small" label="Add New Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()} fullWidth />
                        <Button onClick={handleAddCategory} variant="outlined" size="small">Add</Button>
                    </Box>
                    <TextField fullWidth label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} margin="normal" InputLabelProps={{ shrink: true }} />
                    <TextField fullWidth label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} margin="normal" multiline rows={2} />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={!form.title || !form.amount}>Save Expense</Button>
                </DialogActions>
            </Dialog>

            <DeleteConfirmDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={handleConfirmDelete} title="Delete Expense" content="Are you sure you want to delete this expense record?" />
        </Box>
    );
};

export default Expenses;
