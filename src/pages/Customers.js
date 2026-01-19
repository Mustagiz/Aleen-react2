import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow, IconButton, TextField, Paper, Typography, TableContainer, Chip, Card, CardContent, Grid, Divider, Tooltip, useMediaQuery, useTheme, Avatar, TablePagination } from '@mui/material';
import { Add, Edit, Delete, Search, People, Phone, Email, ShoppingBag, TrendingUp, FilterList, MoreVert } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';

const Customers = () => {
    const { customers, addCustomer, updateCustomer, deleteCustomer, invoices } = useData();
    const [open, setOpen] = useState(false);
    const [editCustomer, setEditCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [formData, setFormData] = useState({
        name: '',
        phone: '+91',
        email: '',
        address: '',
        notes: ''
    });

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CU';
    };

    const calculateCustomerStats = (customerId) => {
        const customerInvoices = invoices.filter(inv => inv.customerId === customerId);
        const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const visitCount = customerInvoices.length;
        const lastVisit = customerInvoices.length > 0 ? new Date(Math.max(...customerInvoices.map(inv => new Date(inv.date)))).toLocaleDateString() : 'Never';
        return { totalSpent, visitCount, lastVisit };
    };

    const handleOpen = (cust = null) => {
        if (cust) {
            setEditCustomer(cust);
            setFormData({
                name: cust.name,
                phone: cust.phone || '+91',
                email: cust.email || '',
                address: cust.address || '',
                notes: cust.notes || ''
            });
        } else {
            setEditCustomer(null);
            setFormData({ name: '', phone: '+91', email: '', address: '', notes: '' });
        }
        setOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            alert('Name is required');
            return;
        }
        if (editCustomer) {
            await updateCustomer(editCustomer.id, formData);
        } else {
            await addCustomer(formData);
        }
        setOpen(false);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const stats = [
        { title: 'Total Customers', value: customers.length, icon: <People />, color: '#880e4f' },
        { title: 'Repeat Clients', value: customers.filter(c => calculateCustomerStats(c.id).visitCount > 1).length, icon: <TrendingUp />, color: '#2e7d32' },
        {
            title: 'Active This Month', value: customers.filter(c => {
                const lastVisit = calculateCustomerStats(c.id).lastVisit;
                return lastVisit !== 'Never' && new Date(lastVisit).getMonth() === new Date().getMonth();
            }).length, icon: <ShoppingBag />, color: '#f57f17'
        }
    ];

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Customers</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Manage client relations and purchase history</Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpen()}
                    sx={{
                        px: 4, py: 1.5,
                        borderRadius: 3,
                        fontWeight: 700,
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #880e4f 0%, #ad1457 100%)',
                        boxShadow: '0 4px 12px rgba(136, 14, 79, 0.2)'
                    }}
                >
                    Add Customer
                </Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((stat, idx) => (
                    <Grid item xs={12} sm={4} key={idx}>
                        <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${stat.color}10`, color: stat.color }}>
                                    {stat.icon}
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>{stat.title}</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{stat.value}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Search sx={{ color: 'text.secondary' }} />
                    <TextField
                        fullWidth
                        placeholder="Search by name or phone..."
                        variant="standard"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{ disableUnderline: true }}
                    />
                </Box>
            </Paper>

            {isMobile ? (
                <Box>
                    {filteredCustomers.map(cust => {
                        const customerStat = calculateCustomerStats(cust.id);
                        return (
                            <Card key={cust.id} sx={{ mb: 2, borderRadius: 4, bgcolor: 'background.paper', position: 'relative' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48, fontWeight: 700 }}>{getInitials(cust.name)}</Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{cust.name}</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Phone sx={{ fontSize: 12 }} /> {cust.phone}
                                            </Typography>
                                        </Box>
                                        <IconButton size="small" onClick={() => handleOpen(cust)}><Edit fontSize="small" /></IconButton>
                                    </Box>
                                    <Divider sx={{ mb: 2 }} />
                                    <Grid container spacing={2}>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Total Spent</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{customerStat.totalSpent}</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Visits</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{customerStat.visitCount}</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Last Visit</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{customerStat.lastVisit}</Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800 }}>Customer Name</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Contact Info</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Stats</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Last Purchase</TableCell>
                                <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(cust => {
                                const customerStat = calculateCustomerStats(cust.id);
                                return (
                                    <TableRow key={cust.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ bgcolor: 'secondary.light', width: 36, height: 36, fontSize: '0.875rem' }}>{getInitials(cust.name)}</Avatar>
                                                <Typography sx={{ fontWeight: 600 }}>{cust.name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{cust.phone}</Typography>
                                            <Typography variant="caption" color="text.secondary">{cust.email || 'No email'}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{customerStat.totalSpent.toLocaleString()}</Typography>
                                            <Typography variant="caption" color="text.secondary">{customerStat.visitCount} orders</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{customerStat.lastVisit}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(cust)}><Edit fontSize="small" /></IconButton></Tooltip>
                                            <Tooltip title="Delete"><IconButton size="small" sx={{ color: 'error.main' }} onClick={() => deleteCustomer(cust.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredCustomers.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    />
                </TableContainer>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>{editCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <TextField
                        fullWidth label="Full Name" margin="normal"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Phone Number" margin="normal"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Email Address" margin="normal"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Address" margin="normal" multiline rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Notes" margin="normal" multiline rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)} sx={{ fontWeight: 600 }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} sx={{ px: 4, borderRadius: 2, fontWeight: 700 }}>Save Customer</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Customers;
