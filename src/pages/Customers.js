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
    CalendarMonth
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import Customer360Drawer from '../components/crm/Customer360Drawer';
import ClienteleNavTabs from '../components/crm/ClienteleNavTabs';
import { useFeedback } from '../contexts/FeedbackContext';
import CustomerMeasurementModal from '../components/crm/CustomerMeasurementModal';

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
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
            {/* Page Header */}
            <PageHeader
                title="Clientele & Guest Directory"
                subtitle="Manage VIP client relationships, bespoke sizing specifications, loyalty balances, and lifetime value"
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={downloadCustomers}
                            sx={{
                                borderColor: 'divider',
                                color: 'text.primary',
                                borderRadius: 2.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                px: 2.5,
                                '&:hover': { bordercolor: (t) => t.palette.primary.main, bgcolor: 'rgba(15, 118, 110, 0.04)' }
                            }}
                        >
                            Export Directory
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => handleOpen()}
                            sx={{
                                background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
                                color: '#FFFFFF',
                                borderRadius: 2.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                px: 3,
                                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #042F2E 0%, #0F766E 100%)'
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
                        color="primary"
                    />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Repeat Clientele"
                        value={repeatCount.toLocaleString()}
                        subtitle="Guests with > 1 completed purchase"
                        icon={<TrendingUp />}
                        color="success"
                        delta={{
                            text: `${loyaltyRatio}% Repeat Ratio`,
                            isPositive: loyaltyRatio >= 25
                        }}
                    />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Active This Month"
                        value={activeThisMonth.toLocaleString()}
                        subtitle="Purchased within current calendar month"
                        icon={<ShoppingBag />}
                        color="warning"
                    />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Outstanding Due"
                        value={`₹${totalReceivables.toLocaleString('en-IN')}`}
                        subtitle="Total pending accounts receivable"
                        icon={<WarningAmber />}
                        color={totalReceivables > 0 ? "error" : "success"}
                    />
                </Grid>
            </Grid>

            {/* Search & Segment Pill Filter Bar */}
            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    mb: 3.5,
                    borderRadius: 3.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
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
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: (t) => t.palette.primary.main }} />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                                            <Clear fontSize="small" />
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
                            ].map((pill) => (
                                <Button
                                    key={pill.id}
                                    size="small"
                                    onClick={() => { setSegmentFilter(pill.id); setPage(0); }}
                                    sx={{
                                        px: 2,
                                        py: 0.6,
                                        borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        color: segmentFilter === pill.id ? '#FFFFFF' : 'text.secondary',
                                        bgcolor: segmentFilter === pill.id ? 'primary.main' : 'action.hover',
                                        '&:hover': {
                                            bgcolor: segmentFilter === pill.id ? 'primary.dark' : 'action.selected'
                                        }
                                    }}
                                >
                                    {pill.label}
                                </Button>
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Clientele Directory Table */}
            <Paper
                elevation={0}
                sx={{
                    overflow: 'hidden',
                    background: (t) => t.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.95)' : '#FFFFFF',
                    boxShadow: (t) => t.palette.mode === 'dark'
                        ? '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(20, 184, 166, 0.12)'
                        : '0 12px 32px -4px rgba(15, 118, 110, 0.08), 0 2px 6px rgba(0, 0, 0, 0.02)',
                    position: 'relative'
                }}
            >
                {/* Decorative Atelier Emerald Hairline */}
                <Box
                    sx={{
                        height: '3px',
                        background: (t) => `linear-gradient(90deg, ${t.palette.primary.dark} 0%, ${t.palette.primary.main} 50%, ${t.palette.secondary.main} 100%)`
                    }}
                />

                <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <Table sx={{ minWidth: 700 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'primary.main', py: 1.8 }}>Guest & Contact Details</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'primary.main', py: 1.8 }} align="right">Lifetime Spend</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'primary.main', py: 1.8 }} align="center">Loyalty Points</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'primary.main', py: 1.8 }} align="right">Balance Due</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'primary.main', py: 1.8 }} align="center">Last Visit</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'primary.main', py: 1.8, pr: 2.5 }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                        <People sx={{ fontSize: 48, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
                                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                            No guests match the selected search or filter criteria.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map(cust => {
                                        const customerStat = calculateCustomerStats(cust.id);
                                        const hasDue = (cust.totalDue || 0) > 0;
                                        const isVip = customerStat.totalSpent >= 50000;
                                        const isPremier = customerStat.totalSpent >= 10000 && !isVip;

                                        const avatarBg = isVip
                                            ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 60%, #92400E 100%)'
                                            : isPremier
                                            ? 'linear-gradient(135deg, #14B8A6 0%, #0F766E 60%, #042F2E 100%)'
                                            : 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)';

                                        const avatarBorder = isVip
                                            ? '2px solid rgba(245, 158, 11, 0.6)'
                                            : isPremier
                                            ? '2px solid rgba(20, 184, 166, 0.45)'
                                            : '2px solid rgba(15, 118, 110, 0.25)';

                                        const avatarShadow = isVip
                                            ? '0 4px 12px rgba(217, 119, 6, 0.35)'
                                            : '0 2px 8px rgba(15, 118, 110, 0.2)';

                                        return (
                                            <TableRow 
                                                key={cust.id} 
                                                hover 
                                                sx={{ 
                                                    transition: 'all 0.18s ease',
                                                    '&:hover': { 
                                                        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.04)' : 'rgba(15, 118, 110, 0.025)'
                                                    }
                                                }}
                                            >
                                                {/* Customer Name, Avatar & Specs */}
                                                <TableCell sx={{ py: 1.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.6 }}>
                                                        <Avatar
                                                            onClick={() => handleOpen360(cust)}
                                                            sx={{
                                                                background: avatarBg,
                                                                border: avatarBorder,
                                                                color: '#FFFFFF',
                                                                width: 42,
                                                                height: 42,
                                                                fontSize: '0.84rem',
                                                                fontWeight: 900,
                                                                letterSpacing: '0.04em',
                                                                cursor: 'pointer',
                                                                boxShadow: avatarShadow,
                                                                transition: 'transform 0.2s ease',
                                                                '&:hover': { transform: 'scale(1.08)' }
                                                            }}
                                                        >
                                                            {getInitials(cust.name)}
                                                        </Avatar>
                                                        <Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                <Typography
                                                                    onClick={() => handleOpen360(cust)}
                                                                    sx={{
                                                                        fontWeight: 800,
                                                                        fontSize: '0.92rem',
                                                                        color: 'text.primary',
                                                                        textTransform: 'capitalize',
                                                                        cursor: 'pointer',
                                                                        transition: 'color 0.15s ease',
                                                                        '&:hover': { color: (t) => t.palette.primary.main }
                                                                    }}
                                                                >
                                                                    {cust.name}
                                                                </Typography>
                                                                {isVip && (
                                                                    <Chip
                                                                        label="VIP"
                                                                        size="small"
                                                                        icon={<Stars sx={{ fontSize: '11px !important', color: '#D97706' }} />}
                                                                        sx={{
                                                                            height: 18,
                                                                            fontSize: '0.62rem',
                                                                            fontWeight: 900,
                                                                            bgcolor: 'rgba(217, 119, 6, 0.14)',
                                                                            color: '#B45309',
                                                                            border: '1px solid rgba(217, 119, 6, 0.3)',
                                                                            letterSpacing: '0.04em'
                                                                        }}
                                                                    />
                                                                )}
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, mt: 0.35, flexWrap: 'wrap' }}>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: 'text.secondary',
                                                                        fontFamily: 'monospace',
                                                                        fontWeight: 600,
                                                                        fontSize: '0.74rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 0.4
                                                                    }}
                                                                >
                                                                    <Phone sx={{ fontSize: 11, color: (t) => t.palette.primary.main, opacity: 0.7 }} /> {cust.phone || 'No phone'}
                                                                </Typography>
                                                                {cust.measurements?.bust && (
                                                                    <Chip
                                                                        icon={<Straighten sx={{ fontSize: '11px !important', color: '#B45309' }} />}
                                                                        label={`Bust: ${cust.measurements.bust}" • ${cust.measurements.preferredFit || 'Custom'}`}
                                                                        size="small"
                                                                        sx={{
                                                                            height: 19,
                                                                            fontSize: '0.67rem',
                                                                            bgcolor: 'rgba(217, 119, 6, 0.09)',
                                                                            color: '#B45309',
                                                                            fontWeight: 700,
                                                                            border: '1px solid rgba(217, 119, 6, 0.2)'
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
                                                            fontWeight: 900,
                                                            fontSize: '0.95rem',
                                                            color: (t) => t.palette.primary.main,
                                                            fontVariantNumeric: 'tabular-nums'
                                                        }}
                                                    >
                                                        ₹{customerStat.totalSpent.toLocaleString('en-IN')}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: 'text.secondary',
                                                            fontWeight: 600,
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
                                                        icon={<Stars sx={{ fontSize: '13px !important', color: (cust.loyaltyPoints || 0) > 0 ? '#D97706' : 'text.disabled' }} />}
                                                        label={`${(cust.loyaltyPoints || 0).toLocaleString()} pts`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: (cust.loyaltyPoints || 0) > 0 ? 'rgba(217, 119, 6, 0.12)' : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                                            color: (cust.loyaltyPoints || 0) > 0 ? '#B45309' : 'text.secondary',
                                                            border: (cust.loyaltyPoints || 0) > 0 ? '1px solid rgba(217, 119, 6, 0.28)' : '1px solid rgba(0,0,0,0.06)',
                                                            fontWeight: 800,
                                                            fontSize: '0.73rem',
                                                            px: 0.5
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
                                                                    fontWeight: 900,
                                                                    color: '#DC2626',
                                                                    fontSize: '0.94rem',
                                                                    fontVariantNumeric: 'tabular-nums'
                                                                }}
                                                            >
                                                                ₹{(cust.totalDue || 0).toLocaleString('en-IN')}
                                                            </Typography>
                                                            <Chip
                                                                label="Pending • Settle"
                                                                size="small"
                                                                onClick={() => handleOpenPaymentDialog(cust.id)}
                                                                sx={{
                                                                    height: 18,
                                                                    fontSize: '0.62rem',
                                                                    fontWeight: 800,
                                                                    bgcolor: 'rgba(220, 38, 38, 0.1)',
                                                                    color: '#DC2626',
                                                                    border: '1px solid rgba(220, 38, 38, 0.3)',
                                                                    cursor: 'pointer',
                                                                    mt: 0.3,
                                                                    '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.2)' }
                                                                }}
                                                            />
                                                        </Box>
                                                    ) : (
                                                        <Chip
                                                            icon={<CheckCircle sx={{ fontSize: '12px !important', color: '#059669' }} />}
                                                            label="Settled • ₹0"
                                                            size="small"
                                                            sx={{
                                                                height: 22,
                                                                fontSize: '0.72rem',
                                                                fontWeight: 800,
                                                                bgcolor: 'rgba(5, 150, 105, 0.08)',
                                                                color: '#059669',
                                                                border: '1px solid rgba(5, 150, 105, 0.22)'
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
                                                                height: 22,
                                                                fontSize: '0.71rem',
                                                                fontWeight: 600,
                                                                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                                                                color: 'text.secondary',
                                                                border: '1px solid rgba(0,0,0,0.06)'
                                                            }}
                                                        />
                                                    ) : (
                                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                                            <CalendarMonth sx={{ fontSize: 13, color: (t) => t.palette.primary.main, opacity: 0.7 }} />
                                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary' }}>
                                                                {customerStat.lastVisit}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell align="right" sx={{ py: 1.5, pr: 2 }}>
                                                    <Box
                                                        sx={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 0.65,
                                                            p: '3px 6px',
                                                            borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                                                            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.08)' : 'rgba(15, 118, 110, 0.04)',
                                                            border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(20, 184, 166, 0.2)' : '1px solid rgba(15, 118, 110, 0.12)'
                                                        }}
                                                    >
                                                        <Tooltip title="View 360° Profile & Sizing Specs">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpen360(cust)}
                                                                sx={{
                                                                    width: 30,
                                                                    height: 30,
                                                                    color: (t) => t.palette.primary.main,
                                                                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                                                                    border: '1px solid rgba(15, 118, 110, 0.16)',
                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                                                    transition: 'all 0.18s ease',
                                                                    '&:hover': {
                                                                        bgcolor: (t) => t.palette.primary.main,
                                                                        color: '#FFFFFF',
                                                                        transform: 'translateY(-1px)',
                                                                        boxShadow: '0 4px 10px rgba(15, 118, 110, 0.3)'
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
                                                                    color: '#D97706',
                                                                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                                                                    border: '1px solid rgba(217, 119, 6, 0.2)',
                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                                                    transition: 'all 0.18s ease',
                                                                    '&:hover': {
                                                                        bgcolor: '#D97706',
                                                                        color: '#FFFFFF',
                                                                        transform: 'translateY(-1px)',
                                                                        boxShadow: '0 4px 10px rgba(217, 119, 6, 0.3)'
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
                                                                        color: '#059669',
                                                                        bgcolor: 'rgba(5, 150, 105, 0.12)',
                                                                        border: '1px solid rgba(5, 150, 105, 0.3)',
                                                                        transition: 'all 0.18s ease',
                                                                        '&:hover': {
                                                                            bgcolor: '#059669',
                                                                            color: '#FFFFFF',
                                                                            transform: 'translateY(-1px)',
                                                                            boxShadow: '0 4px 10px rgba(5, 150, 105, 0.3)'
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
                                                                    color: '#059669',
                                                                    bgcolor: 'rgba(37, 211, 102, 0.09)',
                                                                    border: '1px solid rgba(37, 211, 102, 0.25)',
                                                                    transition: 'all 0.18s ease',
                                                                    '&:hover': {
                                                                        bgcolor: '#059669',
                                                                        color: '#FFFFFF',
                                                                        transform: 'translateY(-1px)',
                                                                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)'
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
                                                                    color: '#0284C7',
                                                                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                                                                    border: '1px solid rgba(2, 132, 199, 0.2)',
                                                                    transition: 'all 0.18s ease',
                                                                    '&:hover': {
                                                                        bgcolor: '#0284C7',
                                                                        color: '#FFFFFF',
                                                                        transform: 'translateY(-1px)',
                                                                        boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)'
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
                                                                    color: '#DC2626',
                                                                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                                                                    border: '1px solid rgba(220, 38, 38, 0.2)',
                                                                    transition: 'all 0.18s ease',
                                                                    '&:hover': {
                                                                        bgcolor: '#DC2626',
                                                                        color: '#FFFFFF',
                                                                        transform: 'translateY(-1px)',
                                                                        boxShadow: '0 4px 10px rgba(220, 38, 38, 0.3)'
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
                    sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                />
            </Paper>

            {/* Add/Edit Guest Dialog */}
            <Dialog 
                open={open} 
                onClose={() => setOpen(false)} 
                maxWidth="sm" 
                fullWidth 
                fullScreen={isTablet}
                PaperProps={{ sx: { borderRadius: isTablet ? 0 : 4 } }}
            >
                <DialogTitle sx={{ 
                    fontWeight: 800, 
                    bgcolor: 'rgba(15, 118, 110, 0.04)', 
                    borderBottom: '1px solid', 
                    borderColor: 'divider',
                    color: '#042F2E'
                }}>
                    {editCustomer ? 'Update Guest Profile' : 'Register New Atelier Guest'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <TextField
                        fullWidth 
                        label="Full Name *" 
                        margin="normal"
                        value={formData.name}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\b\w/g, (l) => l.toUpperCase());
                            setFormData({ ...formData, name: val });
                        }}
                    />
                    <TextField
                        fullWidth 
                        label="Mobile Number (+91) *" 
                        margin="normal"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <TextField
                        fullWidth 
                        label="Email Address" 
                        margin="normal"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <TextField
                        fullWidth 
                        label="Residential Address" 
                        margin="normal" 
                        multiline 
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    <TextField
                        fullWidth 
                        label="Style Notes & Custom Preferences" 
                        margin="normal" 
                        multiline 
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="e.g. Prefers Pure Katan Silk, loves antique gold zardozi borders"
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSave} 
                        sx={{ 
                            px: 3.5, 
                            borderRadius: 2.5, 
                            fontWeight: 700,
                            background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`
                        }}
                    >
                        Save Guest Details
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
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4 } }}
            >
                <DialogTitle sx={{ 
                    fontWeight: 800, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    bgcolor: 'rgba(5, 150, 105, 0.05)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    color: '#042F2E'
                }}>
                    <Payments sx={{ color: '#059669' }} /> Settle Balance Due
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5 }}>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Collect outstanding balance from <strong>{customers.find(c => c.id === selectedCustomerForPayment)?.name}</strong>
                    </Typography>
                    <TextField
                        fullWidth 
                        label="Amount Received (₹) *" 
                        margin="normal" 
                        type="number"
                        value={paymentData.amount}
                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                        InputProps={{ startAdornment: <CurrencyRupee sx={{ fontSize: 16, mr: 0.5, color: (t) => t.palette.primary.main }} /> }}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Payment Tender</InputLabel>
                        <Select
                            value={paymentData.method}
                            label="Payment Tender"
                            onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
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
                            label="Transaction / UTR Reference ID" 
                            margin="normal"
                            value={paymentData.transactionId}
                            onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                        />
                    )}
                    <TextField
                        fullWidth 
                        label="Audit Note" 
                        margin="normal" 
                        multiline 
                        rows={2}
                        value={paymentData.note}
                        onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                        placeholder="e.g. Received via GPay at fitting appointment"
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setPaymentDialogOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleRecordPayment} 
                        sx={{ 
                            px: 3.5, 
                            borderRadius: 2.5, 
                            fontWeight: 700,
                            bgcolor: '#059669',
                            '&:hover': { bgcolor: '#047857' }
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
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    pb: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Box sx={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            bgcolor: 'rgba(37, 211, 102, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#25D366'
                        }}>
                            <WhatsApp />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                WhatsApp Client Dispatch
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                {whatsAppCustomer?.name} • {whatsAppCustomer?.phone}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton size="small" onClick={() => setWhatsAppModalOpen(false)}>
                        <Clear fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 2.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.04em', mb: 1, display: 'block' }}>
                        Select Campaign / Message Template
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
                        {[
                            { id: 'loyalty', label: '🎁 Loyalty Rewards', desc: 'Points balance & tier' },
                            { id: 'fitting', label: '📏 Fitting Ready', desc: 'Trial pickup alert' },
                            { id: 'festive', label: '🌟 Festive VIP', desc: 'New collection preview' },
                            { id: 'due', label: '📋 Balance Due', desc: 'Pending settlement' },
                            { id: 'greeting', label: '💬 General Note', desc: 'Styling check-in' },
                        ].map((tpl) => (
                            <Chip
                                key={tpl.id}
                                label={tpl.label}
                                clickable
                                color={whatsAppTemplate === tpl.id ? 'primary' : 'default'}
                                variant={whatsAppTemplate === tpl.id ? 'filled' : 'outlined'}
                                onClick={() => {
                                    setWhatsAppTemplate(tpl.id);
                                    setWhatsAppCustomText(getWhatsAppTemplateText(whatsAppCustomer, tpl.id));
                                }}
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    borderRadius: 2
                                }}
                            />
                        ))}
                    </Box>

                    <TextField
                        label="Message Preview (Editable)"
                        fullWidth
                        multiline
                        rows={5}
                        value={whatsAppCustomText}
                        onChange={(e) => setWhatsAppCustomText(e.target.value)}
                        helperText="Will open directly in WhatsApp Web or desktop/mobile app."
                    />
                </DialogContent>

                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setWhatsAppModalOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSendWhatsApp}
                        startIcon={<WhatsApp />}
                        sx={{
                            px: 3,
                            borderRadius: 2,
                            fontWeight: 700,
                            bgcolor: '#25D366',
                            color: '#fff',
                            '&:hover': { bgcolor: '#128C7E' }
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
