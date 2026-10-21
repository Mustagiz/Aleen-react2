import React, { useState, useMemo } from 'react';
import { 
    Box, Typography, TextField, MenuItem, Table, TableBody, TableCell, 
    TableHead, TableRow, TableContainer, Grid, Button, TablePagination, 
    useTheme, Chip, InputAdornment, IconButton
} from '@mui/material';
import GlassCard from '../components/GlassCard';
import { 
    TrendingUp, TrendingDown, Download, 
    ShoppingCart, Search, Close, 
    BarChart as BarChartIcon, MonetizationOn
} from '@mui/icons-material';
import { 
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
    LineElement, PointElement, ArcElement, Title, Tooltip as ChartTooltip, Legend 
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useData } from '../contexts/DataContext';
import { exportToCSV } from '../utils/helpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import FinanceNavTabs from '../components/crm/FinanceNavTabs';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, ChartTooltip, Legend);

const ProfitLoss = () => {
    const theme = useTheme();
    const { inventory, invoices, expenses } = useData();
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [itemFilter, setItemFilter] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const categories = useMemo(() => {
        return ['All', ...new Set(inventory.map(item => item.category).filter(Boolean))];
    }, [inventory]);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const invDate = new Date(inv.date);
            const from = dateFrom ? new Date(dateFrom) : new Date(0);
            const to = dateTo ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)) : new Date();
            return invDate >= from && invDate <= to;
        });
    }, [invoices, dateFrom, dateTo]);

    const profitData = useMemo(() => {
        return filteredInvoices.flatMap(inv =>
            (inv.items || []).map(item => {
                const invItem = inventory.find(i => i.id === item.id);
                const revenue = (Number(item.price) || 0) * (Number(item.quantity) || 1);
                const unitCost = item.cost !== undefined && item.cost !== null ? Number(item.cost) : (invItem?.cost || 0);
                const cost = unitCost * (Number(item.quantity) || 1);
                const profit = revenue - cost;
                return {
                    invoiceId: inv.id,
                    date: inv.date,
                    itemName: item.name || 'Custom Garment',
                    category: item.category || 'General',
                    quantity: Number(item.quantity) || 1,
                    unitCost,
                    cost,
                    revenue,
                    profit,
                    margin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0
                };
            })
        ).filter(item => {
            const categoryMatch = !categoryFilter || categoryFilter === 'All' || item.category === categoryFilter;
            const itemMatch = !itemFilter || item.itemName.toLowerCase().includes(itemFilter.toLowerCase().trim());
            return categoryMatch && itemMatch;
        });
    }, [filteredInvoices, inventory, categoryFilter, itemFilter]);

    const totalRevenue = useMemo(() => profitData.reduce((sum, item) => sum + item.revenue, 0), [profitData]);
    const totalCost = useMemo(() => profitData.reduce((sum, item) => sum + item.cost, 0), [profitData]);

    // Deduced Expenses calculation
    const expenseTotal = useMemo(() => {
        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            const from = dateFrom ? new Date(dateFrom) : new Date(0);
            const to = dateTo ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)) : new Date();
            return expDate >= from && expDate <= to;
        }).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    }, [expenses, dateFrom, dateTo]);

    const totalProfit = totalRevenue - totalCost - expenseTotal;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

    // Category-wise profit
    const categoryProfit = useMemo(() => {
        return profitData.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.profit;
            return acc;
        }, {});
    }, [profitData]);

    const chartData = {
        labels: Object.keys(categoryProfit).slice(0, 8),
        datasets: [{
            label: 'Net Category Profit (₹)',
            data: Object.values(categoryProfit).slice(0, 8),
            backgroundColor: Object.values(categoryProfit).slice(0, 8).map(val =>
                val >= 0 ? '#0F766E' : '#DC2626'
            ),
            borderRadius: 6
        }]
    };

    const distributionData = {
        labels: ['Gross COGS', 'Operating Expenses', 'Net Profit'],
        datasets: [{
            data: [
                Math.max(0, totalCost), 
                Math.max(0, expenseTotal), 
                Math.max(0, totalProfit)
            ],
            backgroundColor: ['#0891B2', '#D97706', '#059669'],
            borderWidth: 2,
            borderColor: theme.palette.mode === 'dark' ? '#1E293B' : '#FFFFFF'
        }]
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Aleen Atelier - Profit & Loss Statement', 14, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleString('en-IN')} | Period: ${dateFrom || 'All time'} to ${dateTo || 'Present'}`, 14, 28);

        const summaryRows = [
            ['Gross Sales Revenue', `₹${totalRevenue.toLocaleString('en-IN')}`],
            ['Cost of Goods Sold (COGS)', `₹${totalCost.toLocaleString('en-IN')}`],
            ['Operating Expenses Overhead', `₹${expenseTotal.toLocaleString('en-IN')}`],
            ['Net Atelier Profit', `₹${totalProfit.toLocaleString('en-IN')}`],
            ['Net Profit Margin %', `${profitMargin}%`]
        ];

        autoTable(doc, {
            startY: 36,
            head: [['Financial Metric', 'Amount']],
            body: summaryRows,
            theme: 'grid',
            headStyles: { fillColor: [15, 118, 110] }
        });

        const tableRows = profitData.slice(0, 30).map(p => [
            `#${p.invoiceId}`,
            new Date(p.date).toLocaleDateString('en-IN'),
            p.itemName,
            p.category,
            p.quantity,
            `₹${p.cost.toLocaleString('en-IN')}`,
            `₹${p.revenue.toLocaleString('en-IN')}`,
            `₹${p.profit.toLocaleString('en-IN')}`
        ]);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Invoice', 'Date', 'Product', 'Category', 'Qty', 'Cost', 'Revenue', 'Profit']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [15, 118, 110] }
        });

        doc.save(`aleen_profit_loss_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportReport = () => {
        const csvContent = profitData.map(p => ({
            'Invoice ID': p.invoiceId,
            'Date': new Date(p.date).toLocaleDateString(),
            'Item Name': p.itemName,
            'Category': p.category,
            'Quantity': p.quantity,
            'Cost Price': p.cost,
            'Revenue': p.revenue,
            'Profit': p.profit,
            'Margin %': p.margin
        }));
        exportToCSV(csvContent, 'aleen_profit_loss_statement');
    };

    return (
        <Box>
            {/* Atelier Luxury Header with Breadcrumbs & Actions */}
            <PageHeader
                title="Profit & Loss Statement"
                subtitle="Analyze gross boutique revenue, COGS, deducible overheads, and net margins"
                breadcrumbs={[
                    { label: 'Aleen Atelier', path: '/' },
                    { label: 'Finance & Audit' },
                    { label: 'Profit & Loss' }
                ]}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Button
                            variant="outlined"
                            startIcon={<Download fontSize="small" />}
                            onClick={exportReport}
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
                            startIcon={<Download fontSize="small" />}
                            onClick={exportPDF}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 3,
                                py: 1.1,
                                fontSize: '0.825rem',
                                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                color: '#ffffff',
                                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.28)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
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

            {/* Atelier KPI Summary Cards */}
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Gross Sales Revenue"
                        value={`₹${totalRevenue.toLocaleString('en-IN')}`}
                        icon={<MonetizationOn fontSize="small" />}
                        subtitle="Combined invoice sales"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Cost of Goods (COGS)"
                        value={`₹${totalCost.toLocaleString('en-IN')}`}
                        icon={<ShoppingCart fontSize="small" />}
                        subtitle="Procurement & tailoring direct cost"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Operating Overheads"
                        value={`₹${expenseTotal.toLocaleString('en-IN')}`}
                        icon={<TrendingDown fontSize="small" />}
                        subtitle="Shop expenses & workshop costs"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Net Atelier Profit"
                        value={`₹${totalProfit.toLocaleString('en-IN')}`}
                        icon={<TrendingUp fontSize="small" />}
                        goldAccent={true}
                        trend={{ value: `${profitMargin}% margin`, isPositive: totalProfit >= 0 }}
                        subtitle="Net bottom line earnings"
                    />
                </Grid>
            </Grid>

            {/* Filter and Date Bar */}
            <GlassCard sx={{ p: 2, mb: 3.5 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            label="From Date"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => {
                                setDateFrom(e.target.value);
                                setPage(0);
                            }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            label="To Date"
                            type="date"
                            value={dateTo}
                            onChange={(e) => {
                                setDateTo(e.target.value);
                                setPage(0);
                            }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Category Filter"
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setPage(0);
                            }}
                        >
                            {categories.map(cat => (
                                <MenuItem key={cat} value={cat}>
                                    {cat === 'All' ? `All Categories (${categories.length - 1})` : cat}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Filter by product name..."
                            value={itemFilter}
                            onChange={(e) => {
                                setItemFilter(e.target.value);
                                setPage(0);
                            }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>,
                                endAdornment: itemFilter && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setItemFilter('')}>
                                            <Close fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                </Grid>
            </GlassCard>

            {/* Visual Charts */}
            <Grid container spacing={3} sx={{ mb: 3.5 }}>
                <Grid item xs={12} md={7}>
                    <GlassCard sx={{ p: 2.5, height: '100%' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BarChartIcon sx={{ color: '#0F766E' }} />
                            Category Profitability Breakdown
                        </Typography>
                        <Box sx={{ height: 260 }}>
                            <Bar 
                                data={chartData} 
                                options={{ 
                                    responsive: true, 
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } } 
                                }} 
                            />
                        </Box>
                    </GlassCard>
                </Grid>
                <Grid item xs={12} md={5}>
                    <GlassCard sx={{ p: 2.5, height: '100%' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                            Revenue vs Expense Split
                        </Typography>
                        <Box sx={{ height: 260, display: 'flex', justifyContent: 'center' }}>
                            <Doughnut 
                                data={distributionData} 
                                options={{ 
                                    responsive: true, 
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'bottom' } } 
                                }} 
                            />
                        </Box>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* Aligned Itemized Profit & Loss Ledger Table */}
            <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Itemized Sales Margin Audit
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Showing transaction line margins after procurement COGS deductions
                        </Typography>
                    </Box>
                    <Chip 
                        label={`${profitData.length} Line Items`} 
                        size="small" 
                        sx={{ fontWeight: 700, bgcolor: 'rgba(15, 118, 110, 0.1)', color: '#0F766E' }}
                    />
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15, 118, 110, 0.04)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Invoice Ref
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Date
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Product & Category
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Qty
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Total COGS
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Gross Revenue
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75 }}>
                                    Net Profit
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.75, pr: 2 }}>
                                    Margin
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {profitData.length > 0 ? (
                                profitData
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((item, idx) => {
                                        const isProfitable = item.profit >= 0;

                                        return (
                                            <TableRow 
                                                key={idx} 
                                                hover
                                                sx={{ '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(15, 118, 110, 0.02)' } }}
                                            >
                                                <TableCell sx={{ py: 1.75 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                                                        #{item.invoiceId}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1.75 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1.75 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                        {item.itemName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {item.category}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center" sx={{ py: 1.75 }}>
                                                    <Chip label={item.quantity} size="small" sx={{ fontWeight: 700, height: 20 }} />
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 1.75 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        ₹{item.cost.toLocaleString('en-IN')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 1.75 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                        ₹{item.revenue.toLocaleString('en-IN')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 1.75 }}>
                                                    <Typography 
                                                        variant="subtitle2" 
                                                        sx={{ 
                                                            fontWeight: 900, 
                                                            color: isProfitable ? '#059669' : '#DC2626' 
                                                        }}
                                                    >
                                                        ₹{item.profit.toLocaleString('en-IN')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 1.75, pr: 2 }}>
                                                    <Chip
                                                        label={`${item.margin}%`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: isProfitable ? 'rgba(5, 150, 105, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                                                            color: isProfitable ? '#059669' : '#DC2626',
                                                            border: isProfitable ? '1px solid rgba(5, 150, 105, 0.25)' : '1px solid rgba(220, 38, 38, 0.25)',
                                                            fontWeight: 800,
                                                            fontSize: '0.72rem'
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <MonetizationOn sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                            No sales margin data found for the selected period.
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Try adjusting the date range or category filters.
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
                    count={profitData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                />
            </GlassCard>
        </Box>
    );
};

export default ProfitLoss;
