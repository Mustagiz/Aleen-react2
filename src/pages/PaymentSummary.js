import React, { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import {
    AccountBalanceWallet,
    CreditCard,
    Money,
    QrCode2,
    Download,
    Print,
    MoreVert,
    TrendingUp,
    TrendingDown,
    CalendarToday
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const PaymentSummary = () => {
    const { invoices } = useData();
    const [dateRange, setDateRange] = useState('today');
    const [anchorEl, setAnchorEl] = useState(null);

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
    const filteredInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= start && invDate <= end;
    });

    // Calculate payment summary
    const calculatePaymentSummary = () => {
        const summary = {
            Cash: { total: 0, count: 0, transactions: [] },
            UPI: { total: 0, count: 0, transactions: [] },
            Card: { total: 0, count: 0, transactions: [] },
            Credit: { total: 0, count: 0, transactions: [] },
            'Net Banking': { total: 0, count: 0, transactions: [] }
        };

        filteredInvoices.forEach(inv => {
            // Handle split payments
            if (inv.payments && inv.payments.length > 0) {
                inv.payments.forEach(payment => {
                    const method = payment.method || 'Cash';
                    if (summary[method]) {
                        summary[method].total += payment.amount || 0;
                        summary[method].count += 1;
                        summary[method].transactions.push({
                            id: inv.id,
                            amount: payment.amount,
                            time: inv.date,
                            customer: inv.customer || 'Walk-in',
                            transactionId: payment.transactionId
                        });
                    }
                });
            } else {
                // Single payment method
                const method = inv.paymentMethod || 'Cash';
                if (summary[method]) {
                    summary[method].total += inv.total || 0;
                    summary[method].count += 1;
                    summary[method].transactions.push({
                        id: inv.id,
                        amount: inv.total,
                        time: inv.date,
                        customer: inv.customer || 'Walk-in',
                        transactionId: inv.upiTransactionId
                    });
                }
            }
        });

        return summary;
    };

    const paymentSummary = calculatePaymentSummary();
    const totalCollections = Object.values(paymentSummary).reduce((sum, method) => sum + method.total, 0);
    const totalTransactions = Object.values(paymentSummary).reduce((sum, method) => sum + method.count, 0);

    // Get previous period for comparison
    const getPreviousPeriodData = () => {
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
    };

    const previousTotal = getPreviousPeriodData();
    const trend = previousTotal === 0 ? 100 : Math.round(((totalCollections - previousTotal) / previousTotal) * 100);

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
                return '#EA580C';
            default:
                return '#6B7280';
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Summary Report', 14, 20);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Period: ${label}`, 14, 28);
        doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 34);

        // Summary
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 14, 45);

        const summaryData = [
            ['Total Collections', `₹${totalCollections.toLocaleString('en-IN')}`],
            ['Total Transactions', totalTransactions.toString()],
            ['Average Transaction', `₹${(totalCollections / totalTransactions || 0).toLocaleString('en-IN')}`]
        ];

        autoTable(doc, {
            startY: 50,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [136, 14, 79] }
        });

        // Payment Method Breakdown
        const paymentData = Object.entries(paymentSummary)
            .filter(([_, data]) => data.count > 0)
            .map(([method, data]) => [
                method,
                data.count,
                `₹${data.total.toLocaleString('en-IN')}`,
                `₹${(data.total / data.count).toLocaleString('en-IN')}`
            ]);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Payment Method', 'Count', 'Total', 'Average']],
            body: paymentData,
            theme: 'grid',
            headStyles: { fillColor: [136, 14, 79] }
        });

        doc.save(`payment-summary-${label.toLowerCase().replace(' ', '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
        handleMenuClose();
    };

    const exportToExcel = () => {
        const summarySheet = [
            ['Payment Summary Report'],
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

        XLSX.writeFile(wb, `payment-summary-${label.toLowerCase().replace(' ', '-')}-${new Date().toISOString().split('T')[0]}.xlsx`);
        handleMenuClose();
    };

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handlePrint = () => {
        window.print();
        handleMenuClose();
    };

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                        Payment Summary
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Track daily collections across all payment methods
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {/* Date Range Selector */}
                    <Box sx={{ display: 'flex', bgcolor: 'background.paper', p: 0.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        {['today', 'yesterday', 'week', 'month'].map((range) => (
                            <Button
                                key={range}
                                onClick={() => setDateRange(range)}
                                sx={{
                                    px: 2,
                                    py: 0.75,
                                    borderRadius: 2,
                                    textTransform: 'capitalize',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    color: dateRange === range ? 'white' : 'text.secondary',
                                    bgcolor: dateRange === range ? 'primary.main' : 'transparent',
                                    '&:hover': {
                                        bgcolor: dateRange === range ? 'primary.dark' : 'rgba(0,0,0,0.04)'
                                    }
                                }}
                            >
                                {range}
                            </Button>
                        ))}
                    </Box>

                    {/* Export Menu */}
                    <IconButton onClick={handleMenuClick} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                        <MoreVert />
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                        <MenuItem onClick={exportToPDF}>
                            <ListItemIcon><Download fontSize="small" /></ListItemIcon>
                            <ListItemText>Export PDF</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={exportToExcel}>
                            <ListItemIcon><Download fontSize="small" /></ListItemIcon>
                            <ListItemText>Export Excel</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={handlePrint}>
                            <ListItemIcon><Print fontSize="small" /></ListItemIcon>
                            <ListItemText>Print</ListItemText>
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(136, 14, 79, 0.1)' }}>
                                    <AccountBalanceWallet sx={{ color: 'primary.main' }} />
                                </Box>
                                {trend !== 0 && (
                                    <Chip
                                        icon={trend >= 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                                        label={`${Math.abs(trend)}%`}
                                        size="small"
                                        sx={{
                                            bgcolor: trend >= 0 ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                            color: trend >= 0 ? '#059669' : '#DC2626',
                                            fontWeight: 700
                                        }}
                                    />
                                )}
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                                ₹{totalCollections.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Total Collections
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                        <CardContent>
                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(7, 89, 133, 0.1)', mb: 2, width: 'fit-content' }}>
                                <CalendarToday sx={{ color: '#075985' }} />
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                                {totalTransactions}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Total Transactions
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                        <CardContent>
                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(217, 119, 6, 0.1)', mb: 2, width: 'fit-content' }}>
                                <TrendingUp sx={{ color: '#D97706' }} />
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                                ₹{(totalCollections / totalTransactions || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Average Transaction
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Payment Method Breakdown */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {Object.entries(paymentSummary)
                    .filter(([_, data]) => data.count > 0)
                    .map(([method, data]) => (
                        <Grid item xs={12} sm={6} md={4} key={method}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${getPaymentColor(method)}15` }}>
                                            {React.cloneElement(getPaymentIcon(method), { sx: { color: getPaymentColor(method) } })}
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            {method}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Amount</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                            ₹{data.total.toLocaleString('en-IN')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Transactions</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                            {data.count}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="caption" color="text.secondary">Average</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                            ₹{(data.total / data.count).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
            </Grid>

            {/* Transaction Details Table */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Transaction Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {label} • {totalTransactions} transactions
                    </Typography>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'rgba(136, 14, 79, 0.02)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Invoice ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Transaction ID</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(paymentSummary)
                                .flatMap(([method, data]) =>
                                    data.transactions.map(txn => ({ ...txn, method }))
                                )
                                .sort((a, b) => new Date(b.time) - new Date(a.time))
                                .map((txn, index) => (
                                    <TableRow key={`${txn.id}-${index}`} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                        <TableCell sx={{ fontWeight: 600 }}>#{txn.id}</TableCell>
                                        <TableCell>{new Date(txn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                        <TableCell>{txn.customer}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={txn.method}
                                                size="small"
                                                sx={{
                                                    bgcolor: `${getPaymentColor(txn.method)}15`,
                                                    color: getPaymentColor(txn.method),
                                                    fontWeight: 600
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                {txn.transactionId || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                                            ₹{txn.amount.toLocaleString('en-IN')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default PaymentSummary;
