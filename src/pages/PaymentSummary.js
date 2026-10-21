import React, { useState, useMemo } from 'react';
import {
    Typography,
    Box,
    Grid,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    MenuItem,
    TextField,
    InputAdornment,
    TablePagination,
    useTheme,
    Avatar
} from '@mui/material';
import {
    AccountBalanceWallet,
    CreditCard,
    Money,
    QrCode2,
    Download,
    Print,
    TrendingUp,
    CalendarToday,
    Search,
    Close
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import FinanceNavTabs from '../components/crm/FinanceNavTabs';

const PaymentSummary = () => {
    const { invoices } = useData();
    const theme = useTheme();
    const [dateRange, setDateRange] = useState('today');

    // Search and Table Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [methodFilter, setMethodFilter] = useState('All');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const getDateRange = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        switch (dateRange) {
            case 'today':
                return { start: today, end: now, label: 'Today' };
            case 'yesterday':
                return { start: yesterday, end: today, label: 'Yesterday' };
            case 'week':
                return { start: weekStart, end: now, label: 'This Week' };
            case 'month':
                return { start: monthStart, end: now, label: 'This Month' };
            default:
                return { start: today, end: now, label: 'Today' };
        }
    };

    const { start, end, label } = getDateRange();

    // Filter invoices by date range
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= start && invDate <= end;
        });
    }, [invoices, start, end]);

    // Calculate payment summary
    const paymentSummary = useMemo(() => {
        const summary = {
            Cash: { total: 0, count: 0, transactions: [] },
            UPI: { total: 0, count: 0, transactions: [], providers: {} },
            Card: { total: 0, count: 0, transactions: [] },
            Credit: { total: 0, count: 0, transactions: [] },
            'Net Banking': { total: 0, count: 0, transactions: [] }
        };

        filteredInvoices.forEach(inv => {
            if (inv.payments && inv.payments.length > 0) {
                inv.payments.forEach(payment => {
                    const method = payment.method || 'Cash';
                    if (summary[method]) {
                        summary[method].total += payment.amount || 0;
                        summary[method].count += 1;
                        if (method === 'UPI' && payment.upiProvider) {
                            summary.UPI.providers[payment.upiProvider] = (summary.UPI.providers[payment.upiProvider] || 0) + payment.amount;
                        }
                        summary[method].transactions.push({
                            id: inv.id,
                            amount: payment.amount,
                            time: inv.date,
                            customer: inv.customer || 'Walk-in Guest',
                            transactionId: payment.transactionId,
                            upiProvider: payment.upiProvider
                        });
                    }
                });
            } else {
                const method = inv.paymentMethod || 'Cash';
                if (summary[method]) {
                    summary[method].total += inv.total || 0;
                    summary[method].count += 1;
                    summary[method].transactions.push({
                        id: inv.id,
                        amount: inv.total,
                        time: inv.date,
                        customer: inv.customer || 'Walk-in Guest',
                        transactionId: inv.upiTransactionId
                    });
                }
            }
        });

        return summary;
    }, [filteredInvoices]);

    const totalCollections = Object.values(paymentSummary).reduce((sum, method) => sum + method.total, 0);
    const totalTransactions = Object.values(paymentSummary).reduce((sum, method) => sum + method.count, 0);

    // Previous period for trend comparison
    const previousTotal = useMemo(() => {
        const prevStart = new Date(start);
        const prevEnd = new Date(end);
        const diff = end - start;
        prevStart.setTime(prevStart.getTime() - diff);
        prevEnd.setTime(prevEnd.getTime() - diff);

        const prevInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= prevStart && invDate < prevEnd;
        });

        return prevInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    }, [invoices, start, end]);

    const trend = previousTotal === 0 ? 100 : Math.round(((totalCollections - previousTotal) / previousTotal) * 100);

    // All transactions combined and filtered
    const allTransactions = useMemo(() => {
        return Object.entries(paymentSummary)
            .flatMap(([method, data]) => data.transactions.map(txn => ({ ...txn, method })))
            .filter(txn => {
                const query = searchQuery.toLowerCase().trim();
                const matchesSearch = !query ||
                    (txn.id || '').toLowerCase().includes(query) ||
                    (txn.customer || '').toLowerCase().includes(query) ||
                    (txn.transactionId || '').toLowerCase().includes(query);

                const matchesMethod = methodFilter === 'All' || txn.method === methodFilter;
                return matchesSearch && matchesMethod;
            })
            .sort((a, b) => new Date(b.time) - new Date(a.time));
    }, [paymentSummary, searchQuery, methodFilter]);

    const paginatedTransactions = useMemo(() => {
        return allTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [allTransactions, page, rowsPerPage]);

    const getPaymentIcon = (method) => {
        switch (method) {
            case 'Cash':
                return <Money />;
            case 'UPI':
                return <QrCode2 />;
            case 'Card':
                return <CreditCard />;
            case 'Credit':
                return <AccountBalanceWallet />;
            default:
                return <Money />;
        }
    };

    const getPaymentColor = (method) => {
        switch (method) {
            case 'Cash':
                return '#059669';
            case 'UPI':
                return '#7C3AED';
            case 'Card':
                return '#0891B2';
            case 'Credit':
                return '#DC2626';
            case 'Net Banking':
                return '#D97706';
            default:
                return '#6B7280';
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Aleen Clothing - Daily Cash & Audit Ledger', 14, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Period: ${label} | Generated: ${new Date().toLocaleString('en-IN')}`, 14, 28);

        const summaryData = [
            ['Total Collections', `₹${totalCollections.toLocaleString('en-IN')}`],
            ['Total Transactions', totalTransactions.toString()],
            ['Average Transaction Value', `₹${(totalCollections / totalTransactions || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`]
        ];

        autoTable(doc, {
            startY: 36,
            head: [['Financial Audit Metric', 'Value']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [15, 118, 110] }
        });

        const paymentData = Object.entries(paymentSummary)
            .filter(([_, data]) => data.count > 0)
            .map(([method, data]) => [
                method,
                data.count,
                `₹${data.total.toLocaleString('en-IN')}`,
                `₹${(data.total / data.count).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
            ]);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Settlement Method', 'Transactions', 'Total Collected', 'Average Ticket']],
            body: paymentData,
            theme: 'grid',
            headStyles: { fillColor: [15, 118, 110] }
        });

        doc.save(`aleen-daily-cash-ledger-${label.toLowerCase().replace(' ', '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportToExcel = () => {
        const summarySheet = [
            ['Aleen Clothing - Daily Cash & Audit Ledger'],
            ['Period', label],
            ['Generated', new Date().toLocaleString('en-IN')],
            [],
            ['Total Collections', totalCollections],
            ['Total Transactions', totalTransactions],
            ['Average Transaction', totalCollections / totalTransactions || 0],
            [],
            ['Payment Method', 'Count', 'Total Amount', 'Average Amount']
        ];

        Object.entries(paymentSummary)
            .filter(([_, data]) => data.count > 0)
            .forEach(([method, data]) => {
                summarySheet.push([
                    method,
                    data.count,
                    data.total,
                    data.total / data.count
                ]);
            });

        const ws = XLSX.utils.aoa_to_sheet(summarySheet);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Payment Summary');
        XLSX.writeFile(wb, `aleen_daily_cash_ledger_${label.toLowerCase().replace(' ', '-')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Box>
            {/* Atelier Luxury Header with Breadcrumbs & Action */}
            <PageHeader
                title="Daily Cash Ledger & Audit"
                subtitle="Reconcile daily counter cash, UPI collections, card transactions & POS intake"
                breadcrumbs={[
                    { label: 'Aleen Clothing', path: '/' },
                    { label: 'Finance & Audit' },
                    { label: 'Daily Cash Ledger' }
                ]}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            startIcon={<Download sx={{ fontSize: 19, color: '#0F766E' }} />}
                            onClick={exportToExcel}
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 2.75,
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
                            Export Excel
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Print sx={{ fontSize: 19, color: '#0F766E' }} />}
                            onClick={handlePrint}
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 2.75,
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
                            Print
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Download sx={{ fontSize: 19, color: '#FFFFFF !important' }} />}
                            onClick={exportToPDF}
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
                            Export Audit PDF
                        </Button>
                    </Box>
                }
            />

            {/* Finance & Audit Suite Sub-Nav Tabs */}
            <FinanceNavTabs />

            {/* Date Range Selector Bar */}
            <GlassCard sx={{ p: 1.5, mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday sx={{ fontSize: '1.1rem', color: '#0F766E' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Reconciliation Period:
                    </Typography>
                </Box>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'background.paper',
                    p: '3px',
                    height: 42,
                    boxSizing: 'border-box',
                    borderRadius: '24px',
                    border: '1.5px solid rgba(15, 118, 110, 0.25)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}>
                    {[
                        { key: 'today', label: 'Today' },
                        { key: 'yesterday', label: 'Yesterday' },
                        { key: 'week', label: 'This Week' },
                        { key: 'month', label: 'This Month' }
                    ].map((item) => {
                        const isSelected = dateRange === item.key;
                        return (
                            <Button
                                key={item.key}
                                onClick={() => {
                                    setDateRange(item.key);
                                    setPage(0);
                                }}
                                sx={{
                                    height: 34,
                                    px: 2,
                                    borderRadius: '20px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    color: isSelected ? '#FFFFFF' : 'text.secondary',
                                    bgcolor: isSelected ? '#0F766E' : 'transparent',
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                        bgcolor: isSelected ? '#042F2E' : 'rgba(15, 118, 110, 0.08)'
                                    }
                                }}
                            >
                                {item.label}
                            </Button>
                        );
                    })}
                </Box>
            </GlassCard>

            {/* Atelier KPI Cards */}
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                <Grid item xs={12} sm={4}>
                    <AtelierKpiCard
                        title="Total Collections"
                        value={`₹${totalCollections.toLocaleString('en-IN')}`}
                        icon={<AccountBalanceWallet fontSize="small" />}
                        goldAccent={true}
                        trend={trend !== 0 ? { value: `${Math.abs(trend)}% vs prev`, isPositive: trend >= 0 } : undefined}
                        subtitle={`Gross intake for ${label.toLowerCase()}`}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <AtelierKpiCard
                        title="Total Transactions"
                        value={totalTransactions}
                        icon={<CalendarToday fontSize="small" />}
                        subtitle={`Completed receipts in ${label.toLowerCase()}`}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <AtelierKpiCard
                        title="Average Transaction Ticket"
                        value={`₹${(totalCollections / Math.max(1, totalTransactions)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                        icon={<TrendingUp fontSize="small" />}
                        subtitle="Average sales slip size"
                    />
                </Grid>
            </Grid>

            {/* Payment Method Breakdown Cards */}
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.08em', display: 'block', mb: 2 }}>
                Intake by Payment Gateway & Tender
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                {Object.entries(paymentSummary)
                    .filter(([_, data]) => data.count > 0)
                    .map(([method, data]) => {
                        const pctShare = totalCollections > 0 ? ((data.total / totalCollections) * 100).toFixed(1) : 0;
                        const color = getPaymentColor(method);

                        return (
                            <Grid item xs={12} sm={6} md={2.4} key={method}>
                                <GlassCard sx={{ p: 2.25, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}18`, color: color, display: 'flex' }}>
                                                {React.cloneElement(getPaymentIcon(method), { sx: { fontSize: '1.25rem' } })}
                                            </Box>
                                            <Chip 
                                                label={`${pctShare}% Share`} 
                                                size="small" 
                                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: `${color}15`, color: color }}
                                            />
                                        </Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.25 }}>
                                            {method}
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F766E', fontSize: '1.15rem' }}>
                                            ₹{data.total.toLocaleString('en-IN')}
                                        </Typography>
                                    </Box>

                                    {/* Breakdown of UPI providers if present */}
                                    {method === 'UPI' && data.providers && Object.keys(data.providers).length > 0 && (
                                        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                                            {Object.entries(data.providers).map(([provider, amt]) => (
                                                <Box key={provider} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{provider}</Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>₹{amt.toLocaleString('en-IN')}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}

                                    <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" color="text.secondary">{data.count} slips</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                            Avg ₹{(data.total / data.count).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </Typography>
                                    </Box>
                                </GlassCard>
                            </Grid>
                        );
                    })}
            </Grid>

            {/* Transaction Filter Toolbar */}
            <GlassCard sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by invoice number, guest name, or transaction ID..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(0);
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small" sx={{ color: '#0F766E' }} />
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
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    height: 42,
                                    borderRadius: '24px',
                                    bgcolor: 'background.paper',
                                    fontSize: '0.84rem',
                                    '& fieldset': { borderColor: 'rgba(15, 118, 110, 0.25)' },
                                    '&:hover fieldset': { borderColor: '#0F766E' },
                                    '&.Mui-focused fieldset': { borderColor: '#0F766E', borderWidth: 1.5 }
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3.5}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Filter by Payment Method"
                            value={methodFilter}
                            onChange={(e) => {
                                setMethodFilter(e.target.value);
                                setPage(0);
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    height: 42,
                                    borderRadius: '24px',
                                    bgcolor: 'background.paper',
                                    fontSize: '0.84rem',
                                    '& fieldset': { borderColor: 'rgba(15, 118, 110, 0.25)' },
                                    '&:hover fieldset': { borderColor: '#0F766E' },
                                    '&.Mui-focused fieldset': { borderColor: '#0F766E', borderWidth: 1.5 }
                                }
                            }}
                        >
                            <MenuItem value="All">All Methods ({allTransactions.length})</MenuItem>
                            {['Cash', 'UPI', 'Card', 'Credit', 'Net Banking'].map(m => (
                                <MenuItem key={m} value={m}>
                                    {m}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.5} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {(searchQuery || methodFilter !== 'All') && (
                            <Button 
                                size="small" 
                                onClick={() => {
                                    setSearchQuery('');
                                    setMethodFilter('All');
                                    setPage(0);
                                }}
                                sx={{
                                    height: 38,
                                    borderRadius: '20px',
                                    px: 2,
                                    border: '1.5px solid rgba(15, 118, 110, 0.3)',
                                    color: '#0F766E',
                                    textTransform: 'none',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                        border: '1.5px solid #0F766E',
                                        bgcolor: 'rgba(15, 118, 110, 0.05)',
                                        transform: 'translateY(-1px)'
                                    }
                                }}
                            >
                                Reset Filters
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </GlassCard>

            {/* Transaction Audit Details Table */}
            <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15, 118, 110, 0.04)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Invoice Ref
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Date & Time
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Boutique Guest / Client
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Settlement Method
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Gateway Ref / Txn ID
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75, pr: 2 }}>
                                    Amount Collected
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedTransactions.length > 0 ? (
                                paginatedTransactions.map((txn, index) => {
                                    const methodColor = getPaymentColor(txn.method);

                                    return (
                                        <TableRow 
                                            key={`${txn.id}-${index}`} 
                                            hover
                                            sx={{ '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(15, 118, 110, 0.02)' } }}
                                        >
                                            <TableCell sx={{ py: 1.75 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace' }}>
                                                    #{txn.id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.75 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {new Date(txn.time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {new Date(txn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.75 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 26, height: 26, fontSize: '0.7rem', bgcolor: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', fontWeight: 800 }}>
                                                        {(txn.customer || 'G').charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {txn.customer}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 1.75 }}>
                                                <Chip
                                                    label={txn.method === 'UPI' && txn.upiProvider ? `${txn.method} (${txn.upiProvider})` : txn.method}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: `${methodColor}18`,
                                                        color: methodColor,
                                                        border: `1px solid ${methodColor}33`,
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 1.75 }}>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: txn.transactionId ? 'text.primary' : 'text.secondary' }}>
                                                    {txn.transactionId || 'Counter POS'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.75, pr: 2 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F766E', fontSize: '0.95rem' }}>
                                                    ₹{txn.amount.toLocaleString('en-IN')}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <AccountBalanceWallet sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                            No payment transactions found for this period.
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Try selecting a different date range or clearing your search filters.
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
                    count={allTransactions.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                />
            </GlassCard>
        </Box>
    );
};

export default PaymentSummary;
