import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableHead, TableRow, IconButton, TextField, Paper, Typography, TableContainer, Chip, Card, CardContent, Grid, Divider, Tooltip, useMediaQuery, useTheme, Avatar, TablePagination, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add, Edit, Delete, Search, People, Phone, Email, ShoppingBag, TrendingUp, FilterList, MoreVert, Download, WhatsApp, Payments, CurrencyRupee, Straighten, Visibility } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import Customer360Drawer from '../components/crm/Customer360Drawer';

const Customers = () => {
    const { customers, addCustomer, updateCustomer, deleteCustomer, invoices, profile, addPaymentRecord } = useData();
    const [open, setOpen] = useState(false);
    const [editCustomer, setEditCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);
    const [selected360Customer, setSelected360Customer] = useState(null);
    const [is360Open, setIs360Open] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        method: 'Cash',
        transactionId: '',
        note: ''
    });
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleOpen360 = (cust) => {
        // Find most up-to-date customer object from list
        const latest = customers.find(c => c.id === cust.id) || cust;
        setSelected360Customer(latest);
        setIs360Open(true);
    };

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

    const handleRecordPayment = async () => {
        if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const customer = customers.find(c => c.id === selectedCustomerForPayment);
        if (!customer) return;

        const outstandingInvoices = invoices
            .filter(inv => inv.customerId === selectedCustomerForPayment && (inv.balanceDue || 0) > 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (outstandingInvoices.length === 0) {
            alert('This customer has no outstanding invoices.');
            setPaymentDialogOpen(false);
            return;
        }

        let remainingPayment = parseFloat(paymentData.amount);
        for (const inv of outstandingInvoices) {
            if (remainingPayment <= 0) break;
            const amountToPay = Math.min(remainingPayment, inv.balanceDue);
            await addPaymentRecord(inv.id, {
                amount: amountToPay,
                method: paymentData.method,
                transactionId: paymentData.transactionId,
                note: paymentData.note
            });
            remainingPayment -= amountToPay;
        }

        setPaymentDialogOpen(false);
        setPaymentData({ amount: '', method: 'Cash', transactionId: '', note: '' });
    };

    const handleOpenPaymentDialog = (customerId) => {
        setSelectedCustomerForPayment(customerId);
        const customer = customers.find(c => c.id === customerId);
        setPaymentData({
            amount: customer?.totalDue || '',
            method: 'Cash',
            transactionId: '',
            note: ''
        });
        setPaymentDialogOpen(true);
    };

    const sendWhatsAppMessage = (cust) => {
        const message = `Hello ${cust.name}, this is ${profile?.businessName || 'Aleen Clothing'}. We're reaching out regarding your recent inquiry.`;
        const phone = cust.phone.replace(/[^0-9]/g, '');
        const url = `https://wa.me/${phone.startsWith('91') ? '' : '91'}${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const downloadCustomers = () => {
        const csvData = filteredCustomers.map(cust => {
            const stats = calculateCustomerStats(cust.id);
            return {
                Name: cust.name,
                Phone: cust.phone,
                Email: cust.email || '',
                Address: cust.address || '',
                'Total Spent': stats.totalSpent,
                'Visit Count': stats.visitCount,
                'Last Visit': stats.lastVisit,
                Notes: cust.notes || ''
            };
        });

        const headers = Object.keys(csvData[0] || {});
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const stats = [
        { title: 'Total Customers', value: customers.length, icon: <People />, color: '#F472B6' },
        { title: 'Repeat Clients', value: customers.filter(c => calculateCustomerStats(c.id).visitCount > 1).length, icon: <TrendingUp />, color: '#B76E79' },
        {
            title: 'Active This Month', value: customers.filter(c => {
                const lastVisit = calculateCustomerStats(c.id).lastVisit;
                return lastVisit !== 'Never' && new Date(lastVisit).getMonth() === new Date().getMonth();
            }).length, icon: <ShoppingBag />, color: '#DB2777'
        }
    ];

    return (
        <Box>
            <PageHeader
                title="Clientele & Guest Directory"
                subtitle="Manage VIP customer relations, bespoke measurements, and lifetime purchasing value"
                breadcrumbs={[
                    { label: 'Aleen Atelier', path: '/' },
                    { label: 'Clientele CRM', path: '/customers' },
                    { label: 'Guest Directory' }
                ]}
                actions={
                    <>
                        <Button
                            variant="outlined"
                            startIcon={<Download fontSize="small" />}
                            onClick={downloadCustomers}
                            sx={{
                                px: 2.5,
                                py: 1,
                                borderRadius: '10px',
                                fontWeight: 700,
                                fontSize: '0.84rem'
                            }}
                        >
                            Export Directory
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<Add fontSize="small" />}
                            onClick={() => handleOpen()}
                            sx={{
                                px: 3,
                                py: 1,
                                borderRadius: '10px',
                                fontWeight: 800,
                                fontSize: '0.84rem',
                                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
                            }}
                        >
                            Register Guest
                        </Button>
                    </>
                }
            />

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <AtelierKpiCard
                        title="Total Guests"
                        value={customers.length.toLocaleString()}
                        icon={<People fontSize="small" />}
                        goldAccent={true}
                        subtitle="Registered atelier clientele"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <AtelierKpiCard
                        title="Repeat Clientele"
                        value={customers.filter(c => calculateCustomerStats(c.id).visitCount > 1).length.toLocaleString()}
                        icon={<TrendingUp fontSize="small" />}
                        trend={`${Math.round((customers.filter(c => calculateCustomerStats(c.id).visitCount > 1).length / (customers.length || 1)) * 100)}% loyalty`}
                        trendPositive={true}
                        subtitle="Guests with > 1 boutique visit"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <AtelierKpiCard
                        title="Active This Month"
                        value={customers.filter(c => {
                            const lastVisit = calculateCustomerStats(c.id).lastVisit;
                            return lastVisit !== 'Never' && new Date(lastVisit).getMonth() === new Date().getMonth();
                        }).length.toLocaleString()}
                        icon={<ShoppingBag fontSize="small" />}
                        subtitle="Recent boutique purchases"
                    />
                </Grid>
            </Grid>

            <GlassCard sx={{ p: 2, mb: 3 }}>
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
            </GlassCard>

            {isMobile ? (
                <Box>
                    {filteredCustomers.map(cust => {
                        const customerStat = calculateCustomerStats(cust.id);
                        return (
                            <GlassCard key={cust.id} sx={{ mb: 2 }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Avatar
                                            onClick={() => handleOpen360(cust)}
                                            sx={{ bgcolor: 'secondary.light', width: 48, height: 48, fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            {getInitials(cust.name)}
                                        </Avatar>
                                        <Box sx={{ flex: 1, cursor: 'pointer' }} onClick={() => handleOpen360(cust)}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{cust.name}</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Phone sx={{ fontSize: 12 }} /> {cust.phone}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
                                                <Straighten sx={{ fontSize: 11 }} /> {cust.measurements ? 'Specs recorded' : 'Add measurements'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="360° Profile">
                                                <IconButton size="small" onClick={() => handleOpen360(cust)} sx={{ color: '#0F766E' }}>
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            {(cust.totalDue || 0) > 0 && (
                                                <IconButton size="small" onClick={() => handleOpenPaymentDialog(cust.id)} sx={{ color: 'success.main' }}>
                                                    <Payments fontSize="small" />
                                                </IconButton>
                                            )}
                                            <IconButton size="small" onClick={() => sendWhatsAppMessage(cust)} sx={{ color: '#25D366' }}><WhatsApp fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handleOpen(cust)} sx={{ color: 'primary.main' }}><Edit fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => { if (window.confirm(`Delete customer ${cust.name}?`)) deleteCustomer(cust.id); }} sx={{ color: 'error.main' }}><Delete fontSize="small" /></IconButton>
                                        </Box>
                                    </Box>
                                    <Divider sx={{ mb: 2 }} />
                                    <Grid container spacing={2}>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Total Spent</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{customerStat.totalSpent}</Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Visits</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{customerStat.visitCount}</Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Points</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{cust.loyaltyPoints || 0}</Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Due</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: (cust.totalDue || 0) > 0 ? 'error.main' : 'success.main' }}>
                                                ₹{(cust.totalDue || 0).toLocaleString()}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Last Visit</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{customerStat.lastVisit}</Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </GlassCard>
                        );
                    })}
                </Box>
            ) : (
                <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Name</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Info</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stats</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Points</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance Due</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Purchase</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(cust => {
                                    const customerStat = calculateCustomerStats(cust.id);
                                    return (
                                        <TableRow key={cust.id} hover>
                                            <TableCell>
                                                <Box
                                                    onClick={() => handleOpen360(cust)}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                        cursor: 'pointer',
                                                        '&:hover .cust-name': { color: 'primary.main' }
                                                    }}
                                                >
                                                    <Avatar sx={{ bgcolor: 'secondary.light', width: 36, height: 36, fontSize: '0.875rem' }}>{getInitials(cust.name)}</Avatar>
                                                    <Box>
                                                        <Typography className="cust-name" sx={{ fontWeight: 700, transition: 'color 0.15s' }}>{cust.name}</Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Straighten sx={{ fontSize: 11, color: '#D97706' }} />
                                                            {cust.measurements?.bust ? `Bust: ${cust.measurements.bust}" • ${cust.measurements.preferredFit || 'Custom'}` : 'No specs'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{cust.phone}</Typography>
                                                <Typography variant="caption" color="text.secondary">{cust.email || 'No email'}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 750 }}>₹{customerStat.totalSpent.toLocaleString()}</Typography>
                                                <Typography variant="caption" color="text.secondary">{customerStat.visitCount} visits</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={cust.loyaltyPoints || 0}
                                                    size="small"
                                                    color="primary"
                                                    sx={{ fontWeight: 800, borderRadius: 1.5, background: 'linear-gradient(135deg, #d97706 0%, #f97316 100%)' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{
                                                    fontWeight: 800,
                                                    color: (cust.totalDue || 0) > 0 ? 'error.main' : 'success.main'
                                                }}>
                                                    ₹{(cust.totalDue || 0).toLocaleString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{customerStat.lastVisit}</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Guest 360° Profile & Measurements">
                                                    <IconButton size="small" onClick={() => handleOpen360(cust)} sx={{ color: '#0F766E' }}>
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {(cust.totalDue || 0) > 0 && (
                                                    <Tooltip title="Record Payment">
                                                        <IconButton size="small" sx={{ color: 'success.main' }} onClick={() => handleOpenPaymentDialog(cust.id)}>
                                                            <Payments fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="WhatsApp"><IconButton size="small" sx={{ color: '#25D366' }} onClick={() => sendWhatsAppMessage(cust)}><WhatsApp fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(cust)} sx={{ color: 'primary.main' }}><Edit fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Delete"><IconButton size="small" sx={{ color: 'error.main' }} onClick={() => { if (window.confirm(`Delete customer ${cust.name}?`)) deleteCustomer(cust.id); }}><Delete fontSize="small" /></IconButton></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredCustomers.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    />
                </GlassCard>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>{editCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <TextField
                        fullWidth label="Full Name" margin="normal"
                        value={formData.name}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\b\w/g, (l) => l.toUpperCase());
                            setFormData({ ...formData, name: val });
                        }}
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

            <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Payments color="success" /> Record Payment
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Collect outstanding balance from <strong>{customers.find(c => c.id === selectedCustomerForPayment)?.name}</strong>
                    </Typography>
                    <TextField
                        fullWidth label="Amount Received" margin="normal" type="number"
                        value={paymentData.amount}
                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                        InputProps={{ startAdornment: <CurrencyRupee sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} /> }}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Payment Method</InputLabel>
                        <Select
                            value={paymentData.method}
                            label="Payment Method"
                            onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                        >
                            <MenuItem value="Cash">Cash</MenuItem>
                            <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                            <MenuItem value="UPI">UPI</MenuItem>
                            <MenuItem value="Cheque">Cheque</MenuItem>
                        </Select>
                    </FormControl>
                    {(paymentData.method === 'UPI' || paymentData.method === 'Bank Transfer') && (
                        <TextField
                            fullWidth label="Transaction ID" margin="normal"
                            value={paymentData.transactionId}
                            onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                        />
                    )}
                    <TextField
                        fullWidth label="Notes" margin="normal" multiline rows={2}
                        value={paymentData.note}
                        onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                        placeholder="e.g. Paid via PhonePe"
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setPaymentDialogOpen(false)} sx={{ fontWeight: 600 }}>Cancel</Button>
                    <Button variant="contained" color="success" onClick={handleRecordPayment} sx={{ px: 4, borderRadius: 2, fontWeight: 700 }}>Confirm Payment</Button>
                </DialogActions>
            </Dialog>

            {/* Customer 360 SlideOver Drawer */}
            <Customer360Drawer
                open={is360Open}
                onClose={() => setIs360Open(false)}
                customer={selected360Customer}
                onRecordPayment={(id) => {
                    setIs360Open(false);
                    handleOpenPaymentDialog(id);
                }}
                onEdit={(c) => {
                    setIs360Open(false);
                    handleOpen(c);
                }}
            />
        </Box>
    );
};

export default Customers;
