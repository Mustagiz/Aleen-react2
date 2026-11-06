import React, { useState, useMemo } from 'react';
import { 
    Box, 
    Button, 
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
    TextField, 
    Paper, 
    Typography, 
    TableContainer, 
    Chip, 
    Grid, 
    Tooltip, 
    Avatar, 
    TablePagination, 
    TableSortLabel, 
    MenuItem, 
    Select, 
    FormControl, 
    InputLabel,
    InputAdornment,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { 
    Add, 
    Edit, 
    Delete, 
    Search, 
    People, 
    Phone, 
    ShoppingBag, 
    TrendingUp, 
    Download, 
    WhatsApp, 
    Payments, 
    CurrencyRupee, 
    Straighten, 
    Visibility,
    Clear,
    Stars,
    WarningAmber,
    CheckCircle,
    CalendarMonth,
    PersonAdd,
    Person,
    Email,
    AutoAwesome,
    Close
} from '../components/icons';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import Customer360Drawer from '../components/crm/Customer360Drawer';
import ClienteleNavTabs from '../components/crm/ClienteleNavTabs';
import { useFeedback } from '../contexts/FeedbackContext';
import CustomerMeasurementModal from '../components/crm/CustomerMeasurementModal';
import { getContactAvatarPalette } from '../utils/helpers';

const Customers = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const { customers, addCustomer, updateCustomer, deleteCustomer, invoices, profile, addPaymentRecord } = useData();
    const { showToast, showConfirm } = useFeedback();
    const [open, setOpen] = useState(false);
    const [editCustomer, setEditCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [segmentFilter, setSegmentFilter] = useState('all'); // all, repeat, active, due, measurements
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);
    const [selected360Customer, setSelected360Customer] = useState(null);
    const [is360Open, setIs360Open] = useState(false);
    const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
    const [selectedMeasurementCustomer, setSelectedMeasurementCustomer] = useState(null);
    const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
    const [whatsAppCustomer, setWhatsAppCustomer] = useState(null);
    const [whatsAppTemplate, setWhatsAppTemplate] = useState('loyalty');
    const [whatsAppCustomText, setWhatsAppCustomText] = useState('');
    const [paymentData, setPaymentData] = useState({
        amount: '',
        method: 'Cash',
        transactionId: '',
        note: ''
    });

    const handleOpen360 = (cust) => {
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
        if (!name) return 'CU';
        const clean = name.replace(/[^a-zA-Z\s]/g, ' ').trim();
        const parts = clean.split(/\s+/).filter(Boolean);
        if (parts.length === 0) return name.slice(0, 2).toUpperCase();
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    const customerStatsMap = useMemo(() => {
        const stats = {};
        customers.forEach(cust => {
            const customerInvoices = invoices.filter(inv => inv.customerId === cust.id || inv.phone === cust.phone);
            const totalSpent = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
            const visitCount = customerInvoices.length;
            const lastVisit = customerInvoices.length > 0 
                ? new Date(Math.max(...customerInvoices.map(inv => new Date(inv.date)))).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                : 'Never';
            stats[cust.id] = { totalSpent, visitCount, lastVisit };
        });
        return stats;
    }, [customers, invoices]);

    const calculateCustomerStats = (customerId) => {
        return customerStatsMap[customerId] || { totalSpent: 0, visitCount: 0, lastVisit: 'Never' };
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
            showToast('Client name is required', 'warning');
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
            showToast('Please enter a valid payment amount', 'warning');
            return;
        }

        const customer = customers.find(c => c.id === selectedCustomerForPayment);
        if (!customer) return;

        const outstandingInvoices = invoices
            .filter(inv => (inv.customerId === selectedCustomerForPayment || inv.phone === customer.phone) && (inv.balanceDue || 0) > 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (outstandingInvoices.length === 0) {
            showToast('No outstanding invoices found for this client', 'info');
            return;
        }

        let remainingPayment = parseFloat(paymentData.amount);
        const updatedCustomerDue = Math.max(0, (customer.totalDue || 0) - remainingPayment);

        for (const invoice of outstandingInvoices) {
            if (remainingPayment <= 0) break;

            const due = invoice.balanceDue || 0;
            const amountToApply = Math.min(remainingPayment, due);
            const newBalanceDue = due - amountToApply;

            const existingHistory = invoice.paymentHistory || [];
            const newPaymentEntry = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
                amount: amountToApply,
                date: new Date().toISOString(),
                method: paymentData.method,
                transactionId: paymentData.transactionId || '',
                note: paymentData.note || 'Manual settlement'
            };

            await addPaymentRecord(invoice.id, {
                balanceDue: newBalanceDue,
                paymentHistory: [...existingHistory, newPaymentEntry],
                status: newBalanceDue === 0 ? 'paid' : 'partial'
            });

            remainingPayment -= amountToApply;
        }

        await updateCustomer(customer.id, {
            totalDue: updatedCustomerDue
        });

        showToast(`Successfully recorded payment of ₹${paymentData.amount}`, 'success');
        setPaymentDialogOpen(false);
        setPaymentData({ amount: '', method: 'Cash', transactionId: '', note: '' });
    };

    const handleOpenPaymentDialog = (customerId) => {
        setSelectedCustomerForPayment(customerId);
        const cust = customers.find(c => c.id === customerId);
        setPaymentData({
            amount: cust?.totalDue ? String(cust.totalDue) : '',
            method: 'Cash',
            transactionId: '',
            note: ''
        });
        setPaymentDialogOpen(true);
    };

    const getWhatsAppTemplateText = (cust, templateId) => {
        if (!cust) return '';
        const bName = profile?.businessName || 'Aleen Haute Couture';
        switch (templateId) {
            case 'loyalty':
                return `✨ Dear ${cust.name}, greetings from ${bName}! You currently have ${cust.loyaltyPoints || 0} VIP Loyalty Points (worth ₹${cust.loyaltyPoints || 0}). Visit our atelier to redeem them on your next bespoke piece!`;
            case 'fitting':
                return `✨ Dear ${cust.name}, greetings from ${bName}! Your bespoke attire is fitted and ready for trial & pickup. Please visit our boutique at your convenience.`;
            case 'festive':
                return `🌟 Exclusive VIP Preview for ${cust.name} | ${bName}\n\nAs a valued ${cust.loyaltyTier || 'Bronze'} VIP patron, we are pleased to invite you for an exclusive first-look at our latest seasonal festive collection!`;
            case 'due':
                return `✨ Dear ${cust.name}, this is a gentle reminder regarding the outstanding balance of ₹${cust.totalDue || 0} on your account with ${bName}. Kindly clear via UPI or in-store at your convenience.`;
            case 'greeting':
            default:
                return `Hello ${cust.name}, greetings from ${bName}! We hope you love your bespoke attire. Let us know if you need any styling adjustments or would like to explore our latest arrivals!`;
        }
    };

    const handleOpenWhatsAppModal = (cust, initialTemplate = 'loyalty') => {
        setWhatsAppCustomer(cust);
        setWhatsAppTemplate(initialTemplate);
        setWhatsAppCustomText(getWhatsAppTemplateText(cust, initialTemplate));
        setWhatsAppModalOpen(true);
    };

    const handleSendWhatsApp = () => {
        if (!whatsAppCustomer) return;
        const phone = whatsAppCustomer.phone.replace(/\D/g, '');
        const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
        const url = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(whatsAppCustomText)}`;
        window.open(url, '_blank');
        setWhatsAppModalOpen(false);
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
                'Loyalty Points': cust.loyaltyPoints || 0,
                'Balance Due': cust.totalDue || 0,
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
        link.download = `clientele_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Filter by search and segment
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.phone.includes(searchTerm) ||
                (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));
            
            if (!matchesSearch) return false;

            const stats = customerStatsMap[c.id] || { totalSpent: 0, visitCount: 0, lastVisit: 'Never' };

            switch (segmentFilter) {
                case 'repeat':
                    return stats.visitCount > 1;
                case 'active':
                    return stats.lastVisit !== 'Never' && stats.lastVisit.includes(new Date().getFullYear().toString());
                case 'due':
                    return (c.totalDue || 0) > 0;
                case 'measurements':
                    return !!c.measurements;
                default:
                    return true;
            }
        });
    }, [customers, searchTerm, segmentFilter, customerStatsMap]);

    // Table sorting via header arrows
    const [sortField, setSortField] = useState('name');
    const [sortDir, setSortDir] = useState('asc');

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const sortedCustomers = useMemo(() => {
        return [...filteredCustomers].sort((a, b) => {
            const statsA = customerStatsMap[a.id] || {};
            const statsB = customerStatsMap[b.id] || {};
            let valA, valB;
            switch (sortField) {
                case 'spend': valA = statsA.totalSpent || 0; valB = statsB.totalSpent || 0; break;
                case 'points': valA = a.loyaltyPoints || 0; valB = b.loyaltyPoints || 0; break;
                case 'due': valA = a.totalDue || 0; valB = b.totalDue || 0; break;
                case 'visit':
                    valA = statsA.lastVisit && statsA.lastVisit !== 'Never' ? new Date(statsA.lastVisit).getTime() : 0;
                    valB = statsB.lastVisit && statsB.lastVisit !== 'Never' ? new Date(statsB.lastVisit).getTime() : 0;
                    break;
                default:
                    valA = (a.name || '').toLowerCase();
                    valB = (b.name || '').toLowerCase();
            }
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredCustomers, sortField, sortDir, customerStatsMap]);

    // KPI Metrics
    const totalCustomers = customers.length;
    const repeatCount = customers.filter(c => (customerStatsMap[c.id]?.visitCount || 0) > 1).length;
    const loyaltyRatio = totalCustomers > 0 ? Math.round((repeatCount / totalCustomers) * 100) : 0;
    const totalReceivables = customers.reduce((sum, c) => sum + (c.totalDue || 0), 0);
    const activeThisMonth = customers.filter(c => {
        const lastVisit = customerStatsMap[c.id]?.lastVisit;
        return lastVisit && lastVisit !== 'Never' && new Date(lastVisit).getMonth() === new Date().getMonth();
    }).length;

    return (
        <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', p: { xs: 1.5, sm: 2, md: 3 } }}>
            {/* Page Header */}
            <PageHeader
                title="Clientele & Guest Directory"
                subtitle="Manage VIP client relationships, bespoke sizing specifications, loyalty balances, and lifetime value"
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<Download sx={{ fontSize: 18 }} />}
                            onClick={downloadCustomers}
                            sx={{
                                borderColor: '#E1E4EA',
                                bgcolor: '#FFFFFF',
                                color: '#080F1C',
                                borderRadius: '9999px',
                                fontWeight: 650,
                                fontSize: '0.82rem',
                                textTransform: 'none',
                                px: 2.5,
                                height: 38,
                                boxShadow: '0 1px 3px rgba(8, 15, 28, 0.04)',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                    borderColor: '#080F1C',
                                    bgcolor: '#F4F5F7'
                                }
                            }}
                        >
                            Export Directory
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add sx={{ fontSize: 18 }} />}
                            onClick={() => handleOpen()}
                            sx={{
                                bgcolor: '#080F1C',
                                color: '#FFFFFF',
                                borderRadius: '9999px',
                                fontWeight: 650,
                                fontSize: '0.82rem',
                                textTransform: 'none',
                                px: 3,
                                height: 38,
                                boxShadow: '0 2px 8px rgba(8, 15, 28, 0.16)',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                    bgcolor: '#1D2531'
                                }
                            }}
                        >
                            Register Guest
                        </Button>
                    </Box>
                }
            />

            {/* Clientele & CRM Tab Switcher */}
            <ClienteleNavTabs />

            {/* 4 Atelier KPIs: Responsive 2x2 Grid on Mobile, 4 Columns on Desktop */}
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Registered Clientele"
                        value={totalCustomers.toLocaleString()}
                        subtitle="Total boutique guests on record"
                        icon={<People />}
                    />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Repeat Clientele"
                        value={repeatCount.toLocaleString()}
                        subtitle="Guests with > 1 completed purchase"
                        icon={<TrendingUp />}
                        trend={`${loyaltyRatio}% Repeat Ratio`}
                        trendPositive={loyaltyRatio >= 25}
                    />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Active This Month"
                        value={activeThisMonth.toLocaleString()}
                        subtitle="Purchased within current calendar month"
                        icon={<ShoppingBag />}
                    />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Outstanding Due"
                        value={`₹${totalReceivables.toLocaleString('en-IN')}`}
                        subtitle="Total pending accounts receivable"
                        icon={<WarningAmber />}
                        redAccent={totalReceivables > 0}
                        sapphireAccent={totalReceivables === 0}
                    />
                </Grid>
            </Grid>

            {/* Search & Segment Pill Filter Bar */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: '16px',
                    border: '1px solid #E1E4EA',
                    bgcolor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(8, 15, 28, 0.04)'
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by client name, mobile (+91), or email..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    height: 38,
                                    borderRadius: '9999px',
                                    fontSize: '0.82rem',
                                    bgcolor: '#FAFCFA',
                                    '& fieldset': { borderColor: '#E1E4EA' },
                                    '&:hover fieldset': { borderColor: '#080F1C' },
                                    '&.Mui-focused fieldset': { borderColor: '#080F1C', borderWidth: 1 }
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: '#66707B', fontSize: 18 }} />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                                            <Clear fontSize="small" sx={{ color: '#969DA7' }} />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                            {[
                                { id: 'all', label: `All (${customers.length})` },
                                { id: 'repeat', label: `Repeat VIP (${repeatCount})` },
                                { id: 'active', label: `Active (${activeThisMonth})` },
                                { id: 'due', label: `Balance Due (${customers.filter(c => (c.totalDue || 0) > 0).length})` },
                                { id: 'measurements', label: `With Specs (${customers.filter(c => !!c.measurements).length})` }
                            ].map((pill) => {
                                const isActive = segmentFilter === pill.id;
                                return (
                                    <Button
                                        key={pill.id}
                                        size="small"
                                        onClick={() => { setSegmentFilter(pill.id); setPage(0); }}
                                        sx={{
                                            height: 32,
                                            px: 2,
                                            borderRadius: '9999px',
                                            textTransform: 'none',
                                            fontWeight: isActive ? 700 : 550,
                                            fontSize: '0.78rem',
                                            color: isActive ? '#FFFFFF' : '#66707B',
                                            bgcolor: isActive ? '#080F1C' : '#FAFCFA',
                                            border: '1px solid',
                                            borderColor: isActive ? '#080F1C' : '#E1E4EA',
                                            boxShadow: isActive ? '0 2px 6px rgba(8, 15, 28, 0.12)' : 'none',
                                            transition: 'all 0.15s ease',
                                            '&:hover': {
                                                bgcolor: isActive ? '#1D2531' : '#F4F5F7',
                                                borderColor: isActive ? '#1D2531' : '#080F1C',
                                                color: isActive ? '#FFFFFF' : '#080F1C'
                                            }
                                        }}
                                    >
                                        {pill.label}
                                    </Button>
                                );
                            })}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Clientele Directory Table */}
            <Paper
                elevation={0}
                sx={{
                    overflow: 'hidden',
                    borderRadius: '16px',
                    border: '1px solid #E1E4EA',
                    bgcolor: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(8, 15, 28, 0.04)',
                    position: 'relative'
                }}
            >
                <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <Table sx={{ minWidth: 700, '& .MuiTableCell-root': { verticalAlign: 'middle' } }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#FAFCFA', borderBottom: '1px solid #E1E4EA' }}>
                                <TableCell sx={{ fontWeight: 750, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#66707B', py: 1.5 }}>
                                    <TableSortLabel active={sortField === 'name'} direction={sortField === 'name' ? sortDir : 'asc'} onClick={() => handleSort('name')}>
                                        Guest & Contact Details
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 750, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#66707B', py: 1.5 }} align="right">
                                    <TableSortLabel active={sortField === 'spend'} direction={sortField === 'spend' ? sortDir : 'asc'} onClick={() => handleSort('spend')}>
                                        Lifetime Spend
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 750, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#66707B', py: 1.5 }} align="center">
                                    <TableSortLabel active={sortField === 'points'} direction={sortField === 'points' ? sortDir : 'asc'} onClick={() => handleSort('points')}>
                                        Loyalty Points
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 750, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#66707B', py: 1.5 }} align="right">
                                    <TableSortLabel active={sortField === 'due'} direction={sortField === 'due' ? sortDir : 'asc'} onClick={() => handleSort('due')}>
                                        Balance Due
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 750, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#66707B', py: 1.5 }} align="center">
                                    <TableSortLabel active={sortField === 'visit'} direction={sortField === 'visit' ? sortDir : 'asc'} onClick={() => handleSort('visit')}>
                                        Last Visit
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 750, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#66707B', py: 1.5, pr: 2.5 }} align="right">
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8, color: '#66707B' }}>
                                        <People sx={{ fontSize: 44, color: '#969DA7', mb: 1, opacity: 0.5 }} />
                                        <Typography variant="body1" sx={{ fontWeight: 650, color: '#66707B' }}>
                                            No guests match the selected search or filter criteria.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedCustomers
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map(cust => {
                                        const customerStat = calculateCustomerStats(cust.id);
                                        const hasDue = (cust.totalDue || 0) > 0;
                                        const isVip = customerStat.totalSpent >= 50000;
                                        const isPremier = customerStat.totalSpent >= 10000 && !isVip;
                                        const rawPhone = (cust.phone || '').replace(/\D/g, '');
                                        const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
                                        const hasPhone = Boolean(cust.phone && cust.phone.trim() && cust.phone !== '+91' && rawPhone.length >= 7);

                                        return (
                                            <TableRow 
                                                key={cust.id} 
                                                hover 
                                                sx={{ 
                                                    transition: 'background-color 0.15s ease',
                                                    borderBottom: '1px solid #F0F2F5',
                                                    '&:hover': { 
                                                        bgcolor: '#F8FAFC'
                                                    }
                                                }}
                                            >
                                                {/* Customer Name, Avatar & Specs */}
                                                <TableCell sx={{ py: 1.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                                                        <Avatar
                                                            onClick={() => handleOpen360(cust)}
                                                            sx={{
                                                                bgcolor: isVip ? '#080F1C' : '#F4F5F7',
                                                                color: isVip ? '#FFFFFF' : '#080F1C',
                                                                border: isVip ? '1px solid rgba(8, 15, 28, 0.25)' : '1px solid #E1E4EA',
                                                                width: 38,
                                                                height: 38,
                                                                borderRadius: '50%',
                                                                fontSize: '0.82rem',
                                                                fontWeight: 800,
                                                                letterSpacing: '0.02em',
                                                                cursor: 'pointer',
                                                                boxShadow: isVip ? '0 2px 6px rgba(8, 15, 28, 0.18)' : '0 1px 2px rgba(8, 15, 28, 0.04)',
                                                                transition: 'all 0.18s ease',
                                                                '&:hover': { 
                                                                    transform: 'scale(1.06)',
                                                                    borderColor: '#080F1C'
                                                                }
                                                            }}
                                                        >
                                                            {getInitials(cust.name)}
                                                        </Avatar>
                                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                                            {/* Guest Name & VIP / Premier Tier Badge */}
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85, flexWrap: 'wrap' }}>
                                                                <Typography
                                                                    onClick={() => handleOpen360(cust)}
                                                                    sx={{
                                                                        fontWeight: 700,
                                                                        fontSize: '0.92rem',
                                                                        color: '#080F1C',
                                                                        textTransform: 'capitalize',
                                                                        cursor: 'pointer',
                                                                        letterSpacing: '-0.01em',
                                                                        transition: 'color 0.15s ease',
                                                                        '&:hover': { color: '#6F4CED' }
                                                                    }}
                                                                >
                                                                    {cust.name}
                                                                </Typography>
                                                                {isVip && (
                                                                    <Chip
                                                                        label="VIP"
                                                                        size="small"
                                                                        icon={<Stars sx={{ fontSize: '11px !important', color: '#6F4CED' }} />}
                                                                        sx={{
                                                                            height: 20,
                                                                            fontSize: '0.62rem',
                                                                            fontWeight: 800,
                                                                            bgcolor: '#F3F0FF',
                                                                            color: '#6F4CED',
                                                                            border: '1px solid rgba(111, 76, 237, 0.25)',
                                                                            letterSpacing: '0.04em',
                                                                            borderRadius: '9999px',
                                                                            px: 0.5
                                                                        }}
                                                                    />
                                                                )}
                                                                {isPremier && (
                                                                    <Chip
                                                                        label="PREMIER"
                                                                        size="small"
                                                                        sx={{
                                                                            height: 20,
                                                                            fontSize: '0.58rem',
                                                                            fontWeight: 750,
                                                                            bgcolor: '#F4F5F7',
                                                                            color: '#080F1C',
                                                                            border: '1px solid #E1E4EA',
                                                                            letterSpacing: '0.04em',
                                                                            borderRadius: '9999px'
                                                                        }}
                                                                    />
                                                                )}
                                                            </Box>

                                                            {/* Contact details: Phone Pill, WhatsApp quick-tap & Measurements */}
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.45, flexWrap: 'wrap' }}>
                                                                {hasPhone ? (
                                                                    <Box
                                                                        component="a"
                                                                        href={`tel:${cust.phone}`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        sx={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: 0.5,
                                                                            textDecoration: 'none',
                                                                            px: 1,
                                                                            py: 0.2,
                                                                            borderRadius: '6px',
                                                                            bgcolor: '#FAFCFA',
                                                                            border: '1px solid #E1E4EA',
                                                                            color: '#66707B',
                                                                            transition: 'all 0.15s ease',
                                                                            '&:hover': {
                                                                                bgcolor: '#F4F5F7',
                                                                                borderColor: '#080F1C',
                                                                                color: '#080F1C'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Phone sx={{ fontSize: 11, color: '#969DA7' }} />
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                fontWeight: 600,
                                                                                fontSize: '0.74rem',
                                                                                color: 'inherit',
                                                                                fontVariantNumeric: 'tabular-nums'
                                                                            }}
                                                                        >
                                                                            {cust.phone}
                                                                        </Typography>
                                                                    </Box>
                                                                ) : (
                                                                    <Box
                                                                        sx={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: 0.4,
                                                                            px: 0.75,
                                                                            py: 0.15,
                                                                            borderRadius: '6px',
                                                                            bgcolor: '#FAFCFA',
                                                                            border: '1px dashed #E1E4EA'
                                                                        }}
                                                                    >
                                                                        <Phone sx={{ fontSize: 10, color: '#969DA7' }} />
                                                                        <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#969DA7', fontStyle: 'italic' }}>
                                                                            No phone
                                                                        </Typography>
                                                                    </Box>
                                                                )}

                                                                {/* Direct WhatsApp Quick-Chat Action */}
                                                                {hasPhone && (
                                                                    <Tooltip title={`Chat with ${cust.name} on WhatsApp`} arrow>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                window.open(`https://wa.me/${cleanPhone}`, '_blank');
                                                                            }}
                                                                            sx={{
                                                                                width: 24,
                                                                                height: 24,
                                                                                p: 0,
                                                                                color: '#66707B',
                                                                                bgcolor: '#FAFCFA',
                                                                                border: '1px solid #E1E4EA',
                                                                                transition: 'all 0.15s ease',
                                                                                '&:hover': {
                                                                                    color: '#2A875B',
                                                                                    bgcolor: '#E7F2EA',
                                                                                    borderColor: '#2A875B'
                                                                                }
                                                                            }}
                                                                        >
                                                                            <WhatsApp sx={{ fontSize: 12 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}

                                                                {cust.measurements?.bust && (
                                                                    <Chip
                                                                        icon={<Straighten sx={{ fontSize: '11px !important', color: '#66707B' }} />}
                                                                        label={`Bust: ${cust.measurements.bust}" • ${cust.measurements.preferredFit || 'Custom'}`}
                                                                        size="small"
                                                                        sx={{
                                                                            height: 20,
                                                                            fontSize: '0.67rem',
                                                                            bgcolor: '#FAFCFA',
                                                                            color: '#66707B',
                                                                            fontWeight: 600,
                                                                            border: '1px solid #E1E4EA',
                                                                            borderRadius: '9999px'
                                                                        }}
                                                                    />
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </TableCell>

                                                {/* Purchasing Stats */}
                                                <TableCell align="right" sx={{ py: 1.5 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 750,
                                                            fontSize: '0.92rem',
                                                            color: '#080F1C',
                                                            fontVariantNumeric: 'tabular-nums'
                                                        }}
                                                    >
                                                        ₹{customerStat.totalSpent.toLocaleString('en-IN')}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: '#969DA7',
                                                            fontWeight: 500,
                                                            fontSize: '0.71rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'flex-end',
                                                            gap: 0.4,
                                                            mt: 0.2
                                                        }}
                                                    >
                                                        <ShoppingBag sx={{ fontSize: 11, opacity: 0.6 }} />
                                                        {customerStat.visitCount} {customerStat.visitCount === 1 ? 'order' : 'orders'}
                                                    </Typography>
                                                </TableCell>

                                                {/* Loyalty Points */}
                                                <TableCell align="center" sx={{ py: 1.5 }}>
                                                    <Chip
                                                        icon={<Stars sx={{ fontSize: '12px !important', color: (cust.loyaltyPoints || 0) > 0 ? '#CE8F0B' : '#969DA7' }} />}
                                                        label={`${(cust.loyaltyPoints || 0).toLocaleString()} pts`}
                                                        size="small"
                                                        sx={{
                                                            height: 24,
                                                            px: 1,
                                                            borderRadius: '9999px',
                                                            bgcolor: (cust.loyaltyPoints || 0) > 0 ? '#FEF8EB' : '#FAFCFA',
                                                            color: (cust.loyaltyPoints || 0) > 0 ? '#CE8F0B' : '#66707B',
                                                            border: '1px solid',
                                                            borderColor: (cust.loyaltyPoints || 0) > 0 ? 'rgba(206, 143, 11, 0.3)' : '#E1E4EA',
                                                            fontWeight: 700,
                                                            fontSize: '0.72rem'
                                                        }}
                                                    />
                                                </TableCell>

                                                {/* Balance Due */}
                                                <TableCell align="right" sx={{ py: 1.5 }}>
                                                    {hasDue ? (
                                                        <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontWeight: 750,
                                                                    color: '#C33A4D',
                                                                    fontSize: '0.92rem',
                                                                    fontVariantNumeric: 'tabular-nums'
                                                                }}
                                                            >
                                                                ₹{(cust.totalDue || 0).toLocaleString('en-IN')}
                                                            </Typography>
                                                            <Chip
                                                                label="Due • Settle"
                                                                size="small"
                                                                onClick={() => handleOpenPaymentDialog(cust.id)}
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.62rem',
                                                                    fontWeight: 750,
                                                                    bgcolor: '#FEF2F2',
                                                                    color: '#C33A4D',
                                                                    border: '1px solid rgba(195, 58, 77, 0.3)',
                                                                    borderRadius: '9999px',
                                                                    cursor: 'pointer',
                                                                    mt: 0.3,
                                                                    '&:hover': { bgcolor: '#FEE2E2' }
                                                                }}
                                                            />
                                                        </Box>
                                                    ) : (
                                                        <Chip
                                                            icon={<CheckCircle sx={{ fontSize: '12px !important', color: '#2A875B' }} />}
                                                            label="Settled • ₹0"
                                                            size="small"
                                                            sx={{
                                                                height: 24,
                                                                fontSize: '0.72rem',
                                                                fontWeight: 700,
                                                                bgcolor: '#E7F2EA',
                                                                color: '#2A875B',
                                                                border: '1px solid rgba(42, 135, 91, 0.25)',
                                                                borderRadius: '9999px'
                                                            }}
                                                        />
                                                    )}
                                                </TableCell>

                                                {/* Last Visit */}
                                                <TableCell align="center" sx={{ py: 1.5 }}>
                                                    {customerStat.lastVisit === 'Never' ? (
                                                        <Chip
                                                            label="New Guest"
                                                            size="small"
                                                            sx={{
                                                                height: 24,
                                                                fontSize: '0.71rem',
                                                                fontWeight: 550,
                                                                bgcolor: '#FAFCFA',
                                                                color: '#969DA7',
                                                                border: '1px solid #E1E4EA',
                                                                borderRadius: '9999px'
                                                            }}
                                                        />
                                                    ) : (
                                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                                            <CalendarMonth sx={{ fontSize: 13, color: '#66707B' }} />
                                                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#161922' }}>
                                                                {customerStat.lastVisit}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell align="right" sx={{ py: 1.5, pr: 2 }}>
                                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Tooltip title="View 360° Profile & Sizing Specs">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpen360(cust)}
                                                                sx={{
                                                                    width: 30,
                                                                    height: 30,
                                                                    color: '#66707B',
                                                                    bgcolor: '#FFFFFF',
                                                                    border: '1px solid #E1E4EA',
                                                                    borderRadius: '8px',
                                                                    transition: 'all 0.15s ease',
                                                                    '&:hover': {
                                                                        color: '#080F1C',
                                                                        bgcolor: '#F4F5F7',
                                                                        borderColor: '#080F1C'
                                                                    }
                                                                }}
                                                            >
                                                                <Visibility sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Bespoke Measurements & Tailoring Specs">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setSelectedMeasurementCustomer(cust);
                                                                    setMeasurementModalOpen(true);
                                                                }}
                                                                sx={{
                                                                    width: 30,
                                                                    height: 30,
                                                                    color: '#66707B',
                                                                    bgcolor: '#FFFFFF',
                                                                    border: '1px solid #E1E4EA',
                                                                    borderRadius: '8px',
                                                                    transition: 'all 0.15s ease',
                                                                    '&:hover': {
                                                                        color: '#080F1C',
                                                                        bgcolor: '#F4F5F7',
                                                                        borderColor: '#080F1C'
                                                                    }
                                                                }}
                                                            >
                                                                <Straighten sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {hasDue && (
                                                            <Tooltip title="Settle Outstanding Balance">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleOpenPaymentDialog(cust.id)}
                                                                    sx={{
                                                                        width: 30,
                                                                        height: 30,
                                                                        color: '#2A875B',
                                                                        bgcolor: '#E7F2EA',
                                                                        border: '1px solid rgba(42, 135, 91, 0.3)',
                                                                        borderRadius: '8px',
                                                                        transition: 'all 0.15s ease',
                                                                        '&:hover': {
                                                                            bgcolor: '#2A875B',
                                                                            color: '#FFFFFF'
                                                                        }
                                                                    }}
                                                                >
                                                                    <Payments sx={{ fontSize: 15 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title="WhatsApp Dispatch / Fitting Message">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpenWhatsAppModal(cust, hasDue ? 'due' : 'loyalty')}
                                                                sx={{
                                                                    width: 30,
                                                                    height: 30,
                                                                    color: '#66707B',
                                                                    bgcolor: '#FFFFFF',
                                                                    border: '1px solid #E1E4EA',
                                                                    borderRadius: '8px',
                                                                    transition: 'all 0.15s ease',
                                                                    '&:hover': {
                                                                        color: '#2A875B',
                                                                        bgcolor: '#E7F2EA',
                                                                        borderColor: '#2A875B'
                                                                    }
                                                                }}
                                                            >
                                                                <WhatsApp sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Edit Guest Details">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpen(cust)}
                                                                sx={{
                                                                    width: 30,
                                                                    height: 30,
                                                                    color: '#66707B',
                                                                    bgcolor: '#FFFFFF',
                                                                    border: '1px solid #E1E4EA',
                                                                    borderRadius: '8px',
                                                                    transition: 'all 0.15s ease',
                                                                    '&:hover': {
                                                                        color: '#080F1C',
                                                                        bgcolor: '#F4F5F7',
                                                                        borderColor: '#080F1C'
                                                                    }
                                                                }}
                                                            >
                                                                <Edit sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Remove Client">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    showConfirm({
                                                                        title: 'Delete Patron Profile',
                                                                        message: `Are you sure you want to delete "${cust.name}"? This will remove their profile and records from the client register.`,
                                                                        confirmText: 'Delete Client',
                                                                        isDanger: true,
                                                                        onConfirm: () => {
                                                                            deleteCustomer(cust.id);
                                                                            showToast(`Patron profile "${cust.name}" removed`, 'info');
                                                                        }
                                                                    });
                                                                }}
                                                                sx={{
                                                                    width: 30,
                                                                    height: 30,
                                                                    color: '#66707B',
                                                                    bgcolor: '#FFFFFF',
                                                                    border: '1px solid #E1E4EA',
                                                                    borderRadius: '8px',
                                                                    transition: 'all 0.15s ease',
                                                                    '&:hover': {
                                                                        color: '#C33A4D',
                                                                        bgcolor: '#FEF2F2',
                                                                        borderColor: '#C33A4D'
                                                                    }
                                                                }}
                                                            >
                                                                <Delete sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
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
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={filteredCustomers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    sx={{
                        borderTop: '1px solid #E1E4EA',
                        color: '#66707B',
                        '& .MuiTablePagination-select': { fontWeight: 600 }
                    }}
                />
            </Paper>

            {/* Add/Edit Guest Dialog */}
            <Dialog 
                open={open} 
                onClose={() => setOpen(false)} 
                maxWidth="sm" 
                fullWidth 
                fullScreen={isTablet}
                PaperProps={{ 
                    sx: { 
                        borderRadius: isTablet ? 0 : '18px',
                        overflow: 'hidden',
                        border: '1px solid #E1E4EA',
                        boxShadow: '0 24px 60px rgba(8, 15, 28, 0.18)'
                    } 
                }}
            >
                <DialogTitle sx={{ 
                    p: 0,
                    position: 'relative',
                    bgcolor: '#FFFFFF',
                    borderBottom: '1px solid #E1E4EA'
                }}>
                    <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ 
                                width: 42, 
                                height: 42, 
                                borderRadius: '10px', 
                                bgcolor: '#F4F5F7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #E1E4EA'
                            }}>
                                <PersonAdd sx={{ color: '#080F1C', fontSize: 22 }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 750, color: '#080F1C', lineHeight: 1.2, letterSpacing: '-0.01em', fontSize: '1.05rem' }}>
                                    {editCustomer ? 'Update Guest Profile' : 'Register New Atelier Guest'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#66707B', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                    <AutoAwesome sx={{ fontSize: 13, color: '#6F4CED' }} />
                                    VIP Clientele & Tailoring Bespoke Registry
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton 
                            onClick={() => setOpen(false)} 
                            size="small" 
                            sx={{ 
                                color: '#66707B',
                                bgcolor: '#FAFCFA',
                                border: '1px solid #E1E4EA',
                                '&:hover': { bgcolor: '#F4F5F7', color: '#080F1C' }
                            }}
                        >
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#ECEEF2' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        {/* Section 1: Guest Identity */}
                        <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E1E4EA', boxShadow: '0 1px 3px rgba(8, 15, 28, 0.04)' }}>
                            <Typography variant="caption" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#080F1C', mb: 1.5, display: 'block' }}>
                                Primary Contact & Identity
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth 
                                        size="small"
                                        label="Full Name *" 
                                        value={formData.name}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\b\w/g, (l) => l.toUpperCase());
                                            setFormData({ ...formData, name: val });
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Person sx={{ fontSize: 18, color: '#66707B' }} />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        placeholder="e.g. Ayesha Khan"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth 
                                        size="small"
                                        label="Mobile Number (+91) *" 
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Phone sx={{ fontSize: 18, color: '#66707B' }} />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        placeholder="+91 9876543210"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth 
                                        size="small"
                                        label="Email Address" 
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Email sx={{ fontSize: 18, color: '#66707B' }} />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        placeholder="client@luxury.com"
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Section 2: Residential & Bespoke Preferences */}
                        <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E1E4EA', boxShadow: '0 1px 3px rgba(8, 15, 28, 0.04)' }}>
                            <Typography variant="caption" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#080F1C', mb: 1.5, display: 'block' }}>
                                Atelier Concierge & Styling Notes
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <TextField
                                    fullWidth 
                                    size="small"
                                    label="Residential / Shipping Address" 
                                    multiline 
                                    rows={2}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    placeholder="Villa / Suite, Street, City, Pincode"
                                />
                                <TextField
                                    fullWidth 
                                    size="small"
                                    label="Style Notes & Custom Preferences" 
                                    multiline 
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="e.g. Prefers Pure Katan Silk, loves antique gold zardozi borders, measurements on file"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                />
                            </Box>
                        </Box>

                        {/* VIP Hospitality Banner */}
                        <Box sx={{
                            p: 1.5,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            bgcolor: '#FEF8EB',
                            border: '1px solid rgba(206, 143, 11, 0.25)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Stars sx={{ color: '#CE8F0B', fontSize: 20 }} />
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 750, color: '#CE8F0B', display: 'block' }}>
                                        Automatic VIP Loyalty Enrollment
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#66707B', fontSize: '0.68rem' }}>
                                        Guest is immediately enrolled in Atelier Bronze Tier with points accrued on billing.
                                    </Typography>
                                </Box>
                            </Box>
                            <Chip 
                                label="Bronze VIP" 
                                size="small" 
                                sx={{ 
                                    height: 22, 
                                    fontSize: '0.65rem', 
                                    fontWeight: 750, 
                                    bgcolor: '#CE8F0B', 
                                    color: '#FFFFFF',
                                    borderRadius: '9999px'
                                }} 
                            />
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2.5, bgcolor: '#FFFFFF', borderTop: '1px solid #E1E4EA', justifyContent: 'space-between' }}>
                    <Button 
                        onClick={() => setOpen(false)} 
                        sx={{ 
                            fontWeight: 650, 
                            color: '#66707B',
                            textTransform: 'none',
                            px: 2.5,
                            borderRadius: '9999px',
                            '&:hover': { bgcolor: '#F4F5F7', color: '#080F1C' }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSave} 
                        sx={{ 
                            px: 3.5, 
                            py: 0.9,
                            borderRadius: '9999px', 
                            fontWeight: 700,
                            textTransform: 'none',
                            color: '#FFFFFF',
                            bgcolor: '#080F1C',
                            boxShadow: '0 2px 8px rgba(8, 15, 28, 0.16)',
                            '&:hover': {
                                bgcolor: '#1D2531'
                            }
                        }}
                    >
                        {editCustomer ? 'Update Guest Profile' : 'Save Guest Details'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Settle Outstanding Payment Dialog */}
            <Dialog 
                open={paymentDialogOpen} 
                onClose={() => setPaymentDialogOpen(false)} 
                maxWidth="xs" 
                fullWidth 
                fullScreen={isMobile}
                PaperProps={{ 
                    sx: { 
                        borderRadius: isMobile ? 0 : '18px',
                        border: '1px solid #E1E4EA',
                        boxShadow: '0 24px 60px rgba(8, 15, 28, 0.18)'
                    } 
                }}
            >
                <DialogTitle sx={{ 
                    fontWeight: 750, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.25,
                    bgcolor: '#FFFFFF',
                    borderBottom: '1px solid #E1E4EA',
                    color: '#080F1C',
                    fontSize: '1rem',
                    p: 2.5
                }}>
                    <Box sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        bgcolor: '#E7F2EA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2A875B'
                    }}>
                        <Payments sx={{ fontSize: 18 }} />
                    </Box>
                    Settle Balance Due
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5, bgcolor: '#ECEEF2' }}>
                    <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E1E4EA', my: 1, boxShadow: '0 1px 3px rgba(8, 15, 28, 0.04)' }}>
                        <Typography variant="body2" sx={{ mb: 2, color: '#66707B', fontSize: '0.84rem' }}>
                            Collect outstanding balance from <strong style={{ color: '#080F1C' }}>{customers.find(c => c.id === selectedCustomerForPayment)?.name}</strong>
                        </Typography>
                        <TextField
                            fullWidth 
                            size="small"
                            label="Amount Received (₹) *" 
                            margin="normal" 
                            type="number"
                            value={paymentData.amount}
                            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                            InputProps={{ startAdornment: <CurrencyRupee sx={{ fontSize: 16, mr: 0.5, color: '#080F1C' }} /> }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                        <FormControl fullWidth size="small" margin="normal">
                            <InputLabel>Payment Tender</InputLabel>
                            <Select
                                value={paymentData.method}
                                label="Payment Tender"
                                onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                                sx={{ borderRadius: '10px' }}
                            >
                                <MenuItem value="Cash">Cash</MenuItem>
                                <MenuItem value="UPI">UPI / QR Transfer</MenuItem>
                                <MenuItem value="Bank Transfer">Bank NEFT / IMPS</MenuItem>
                                <MenuItem value="Card">Card</MenuItem>
                                <MenuItem value="Cheque">Cheque</MenuItem>
                            </Select>
                        </FormControl>
                        {(paymentData.method === 'UPI' || paymentData.method === 'Bank Transfer') && (
                            <TextField
                                fullWidth 
                                size="small"
                                label="Transaction / UTR Reference ID" 
                                margin="normal"
                                value={paymentData.transactionId}
                                onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        )}
                        <TextField
                            fullWidth 
                            size="small"
                            label="Audit Note" 
                            margin="normal" 
                            multiline 
                            rows={2}
                            value={paymentData.note}
                            onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                            placeholder="e.g. Received via GPay at fitting appointment"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #E1E4EA', bgcolor: '#FFFFFF' }}>
                    <Button 
                        onClick={() => setPaymentDialogOpen(false)} 
                        sx={{ 
                            fontWeight: 650, 
                            color: '#66707B',
                            textTransform: 'none',
                            borderRadius: '9999px',
                            px: 2.5,
                            '&:hover': { bgcolor: '#F4F5F7', color: '#080F1C' }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleRecordPayment} 
                        sx={{ 
                            px: 3, 
                            borderRadius: '9999px', 
                            fontWeight: 700,
                            textTransform: 'none',
                            bgcolor: '#080F1C',
                            color: '#FFFFFF',
                            boxShadow: '0 2px 8px rgba(8, 15, 28, 0.16)',
                            '&:hover': { bgcolor: '#1D2531' }
                        }}
                    >
                        Confirm Settlement
                    </Button>
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

            {/* Customer Bespoke Measurement Specs Dialog */}
            <CustomerMeasurementModal
                open={measurementModalOpen}
                onClose={() => {
                    setMeasurementModalOpen(false);
                    setSelectedMeasurementCustomer(null);
                }}
                customer={selectedMeasurementCustomer}
            />

            {/* WhatsApp Client Messaging & Automation Studio */}
            <Dialog
                open={whatsAppModalOpen}
                onClose={() => setWhatsAppModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { 
                        borderRadius: '18px',
                        border: '1px solid #E1E4EA',
                        boxShadow: '0 24px 60px rgba(8, 15, 28, 0.18)',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    bgcolor: '#FFFFFF',
                    borderBottom: '1px solid #E1E4EA',
                    p: 2.5
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            bgcolor: '#E7F2EA',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#2A875B'
                        }}>
                            <WhatsApp sx={{ fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 750, color: '#080F1C', fontSize: '0.98rem' }}>
                                WhatsApp Client Dispatch
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#66707B', fontWeight: 550, fontSize: '0.74rem' }}>
                                {whatsAppCustomer?.name} • {whatsAppCustomer?.phone}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton 
                        size="small" 
                        onClick={() => setWhatsAppModalOpen(false)}
                        sx={{
                            color: '#66707B',
                            bgcolor: '#FAFCFA',
                            border: '1px solid #E1E4EA',
                            '&:hover': { bgcolor: '#F4F5F7', color: '#080F1C' }
                        }}
                    >
                        <Clear fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 2.5, bgcolor: '#ECEEF2' }}>
                    <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E1E4EA', my: 1, boxShadow: '0 1px 3px rgba(8, 15, 28, 0.04)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 750, textTransform: 'uppercase', color: '#080F1C', letterSpacing: '0.04em', mb: 1.25, display: 'block' }}>
                            Select Campaign / Message Template
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
                            {[
                                { id: 'loyalty', label: '🎁 Loyalty Rewards', desc: 'Points balance & tier' },
                                { id: 'fitting', label: '📏 Fitting Ready', desc: 'Trial pickup alert' },
                                { id: 'festive', label: '🌟 Festive VIP', desc: 'New collection preview' },
                                { id: 'due', label: '📋 Balance Due', desc: 'Pending settlement' },
                                { id: 'greeting', label: '💬 General Note', desc: 'Styling check-in' },
                            ].map((tpl) => {
                                const isSelected = whatsAppTemplate === tpl.id;
                                return (
                                    <Chip
                                        key={tpl.id}
                                        label={tpl.label}
                                        clickable
                                        onClick={() => {
                                            setWhatsAppTemplate(tpl.id);
                                            setWhatsAppCustomText(getWhatsAppTemplateText(whatsAppCustomer, tpl.id));
                                        }}
                                        sx={{
                                            fontWeight: isSelected ? 700 : 550,
                                            fontSize: '0.74rem',
                                            borderRadius: '9999px',
                                            height: 28,
                                            bgcolor: isSelected ? '#080F1C' : '#FAFCFA',
                                            color: isSelected ? '#FFFFFF' : '#66707B',
                                            border: '1px solid',
                                            borderColor: isSelected ? '#080F1C' : '#E1E4EA',
                                            '&:hover': {
                                                bgcolor: isSelected ? '#1D2531' : '#F4F5F7',
                                                borderColor: isSelected ? '#1D2531' : '#080F1C'
                                            }
                                        }}
                                    />
                                );
                            })}
                        </Box>

                        <TextField
                            label="Message Preview (Editable)"
                            fullWidth
                            multiline
                            rows={5}
                            value={whatsAppCustomText}
                            onChange={(e) => setWhatsAppCustomText(e.target.value)}
                            helperText="Will open directly in WhatsApp Web or desktop/mobile app."
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #E1E4EA', bgcolor: '#FFFFFF' }}>
                    <Button 
                        onClick={() => setWhatsAppModalOpen(false)} 
                        sx={{ 
                            fontWeight: 650, 
                            color: '#66707B',
                            textTransform: 'none',
                            borderRadius: '9999px',
                            px: 2.5,
                            '&:hover': { bgcolor: '#F4F5F7', color: '#080F1C' }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSendWhatsApp}
                        startIcon={<WhatsApp sx={{ fontSize: 17 }} />}
                        sx={{
                            px: 3,
                            borderRadius: '9999px',
                            fontWeight: 700,
                            textTransform: 'none',
                            bgcolor: '#2A875B',
                            color: '#FFFFFF',
                            boxShadow: '0 2px 8px rgba(42, 135, 91, 0.25)',
                            '&:hover': { bgcolor: '#23734D' }
                        }}
                    >
                        Send via WhatsApp
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Customers;
