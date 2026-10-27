import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Tabs,
    Tab,
    Chip
} from '@mui/material';
import {
    Download,
    Print,
    ShowChart,
    People,
    ShoppingCart,
    AttachMoney
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import PageHeader from '../components/crm/PageHeader';
import FinanceNavTabs from '../components/crm/FinanceNavTabs';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';

const AdvancedReports = () => {
    const { invoices, inventory } = useData();
    const [activeTab, setActiveTab] = useState(0);
    const [dateRange, setDateRange] = useState('month');

    const getDateRange = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);

        switch (dateRange) {
            case 'week':
                return { start: weekStart, end: now, label: 'This Week' };
            case 'month':
                return { start: monthStart, end: now, label: 'This Month' };
            case 'year':
                return { start: yearStart, end: now, label: 'This Year' };
            default:
                return { start: monthStart, end: now, label: 'This Month' };
        }
    };

    const { start, end, label } = getDateRange();
    const filteredInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= start && invDate <= end;
    });

    // 1. PROFIT MARGIN BY CATEGORY
    const calculateProfitByCategory = () => {
        const categoryData = {};

        filteredInvoices.forEach(inv => {
            inv.items?.forEach(item => {
                const category = item.category || 'General';
                const invItem = inventory.find(i => i.id === item.id);
                const cost = invItem?.cost || 0;
                const revenue = item.price * item.quantity;
                const costTotal = cost * item.quantity;
                const profit = revenue - costTotal;

                if (!categoryData[category]) {
                    categoryData[category] = {
                        revenue: 0,
                        cost: 0,
                        profit: 0,
                        quantity: 0
                    };
                }

                categoryData[category].revenue += revenue;
                categoryData[category].cost += costTotal;
                categoryData[category].profit += profit;
                categoryData[category].quantity += item.quantity;
            });
        });

        return Object.entries(categoryData).map(([category, data]) => ({
            category,
            revenue: data.revenue,
            cost: data.cost,
            profit: data.profit,
            margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
            quantity: data.quantity
        })).sort((a, b) => b.profit - a.profit);
    };

    // 2. BEST SELLERS
    const calculateBestSellers = () => {
        const productSales = {};

        filteredInvoices.forEach(inv => {
            inv.items?.forEach(item => {
                const id = item.id || item.name;
                if (!productSales[id]) {
                    productSales[id] = {
                        id,
                        name: item.name,
                        category: item.category || 'General',
                        quantity: 0,
                        revenue: 0,
                        transactions: 0
                    };
                }
                productSales[id].quantity += item.quantity;
                productSales[id].revenue += item.price * item.quantity;
                productSales[id].transactions += 1;
            });
        });

        return Object.values(productSales)
            .map(product => {
                const invItem = inventory.find(i => i.id === product.id);
                return {
                    ...product,
                    stock: invItem?.quantity || 0
                };
            })
            .sort((a, b) => b.quantity - a.quantity);
    };

    // 3. CUSTOMER FREQUENCY ANALYSIS
    const calculateCustomerFrequency = () => {
        const customerData = {};

        invoices.forEach(inv => {
            const customerId = inv.customer?.phone || inv.customer?.name || 'Walk-in';
            if (customerId === 'Walk-in') return;

            if (!customerData[customerId]) {
                customerData[customerId] = {
                    id: customerId,
                    name: inv.customer?.name || 'Unknown',
                    phone: inv.customer?.phone || '',
                    purchases: [],
                    totalSpent: 0
                };
            }

            customerData[customerId].purchases.push(new Date(inv.date));
            customerData[customerId].totalSpent += inv.total;
        });

        const now = new Date();
        return Object.values(customerData).map(customer => {
            const purchases = customer.purchases.sort((a, b) => a - b);
            const purchaseCount = purchases.length;
            const lastPurchase = purchases[purchases.length - 1];
            const daysSinceLastPurchase = Math.floor((now - lastPurchase) / (1000 * 60 * 60 * 24));

            let avgDaysBetween = 0;
            if (purchaseCount > 1) {
                const firstPurchase = purchases[0];
                const totalDays = (lastPurchase - firstPurchase) / (1000 * 60 * 60 * 24);
                avgDaysBetween = Math.round(totalDays / (purchaseCount - 1));
            }

            let segment = 'One-Time';
            if (purchaseCount >= 5) segment = 'VIP';
            else if (purchaseCount >= 3) segment = 'Loyal';
            else if (purchaseCount === 2) segment = 'Repeat';

            return {
                ...customer,
                purchaseCount,
                avgDaysBetween,
                daysSinceLastPurchase,
                segment,
                atRisk: daysSinceLastPurchase > 90 && purchaseCount > 1
            };
        }).sort((a, b) => b.totalSpent - a.totalSpent);
    };

    // 4. AOV TRENDS
    const calculateAOVTrends = () => {
        const dailyData = {};

        filteredInvoices.forEach(inv => {
            const date = new Date(inv.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            if (!dailyData[date]) {
                dailyData[date] = {
                    date,
                    revenue: 0,
                    orders: 0
                };
            }
            dailyData[date].revenue += inv.total;
            dailyData[date].orders += 1;
        });

        return Object.values(dailyData).map(day => ({
            ...day,
            aov: day.orders > 0 ? day.revenue / day.orders : 0
        }));
    };

    const profitData = calculateProfitByCategory();
    const bestSellers = calculateBestSellers();
    const customerFrequency = calculateCustomerFrequency();
    const aovTrends = calculateAOVTrends();

    // Summary Metrics
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalProfit = profitData.reduce((sum, p) => sum + p.profit, 0);
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgAOV = filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0;
    const atRiskCount = customerFrequency.filter(c => c.atRisk).length;

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();

        const profitSheet = XLSX.utils.json_to_sheet(profitData.map(p => ({
            Category: p.category,
            Revenue: p.revenue,
            Cost: p.cost,
            Profit: p.profit,
            'Margin %': p.margin.toFixed(2),
            'Units Sold': p.quantity
        })));
        XLSX.utils.book_append_sheet(wb, profitSheet, 'Profit Margin');

        const sellersSheet = XLSX.utils.json_to_sheet(bestSellers.map(s => ({
            Product: s.name,
            Category: s.category,
            'Units Sold': s.quantity,
            Revenue: s.revenue,
            Transactions: s.transactions,
            'Current Stock': s.stock
        })));
        XLSX.utils.book_append_sheet(wb, sellersSheet, 'Best Sellers');

        const frequencySheet = XLSX.utils.json_to_sheet(customerFrequency.map(c => ({
            Customer: c.name,
            Phone: c.phone,
            Purchases: c.purchaseCount,
            'Total Spent': c.totalSpent,
            'Avg Days Between': c.avgDaysBetween,
            'Days Since Last': c.daysSinceLastPurchase,
            Segment: c.segment,
            'At Risk': c.atRisk ? 'Yes' : 'No'
        })));
        XLSX.utils.book_append_sheet(wb, frequencySheet, 'Customer Frequency');

        XLSX.writeFile(wb, `advanced-analytics-${label.toLowerCase().replace(' ', '-')}-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Aleen Haute Couture - Business Intelligence & Analytics', 14, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Period: ${label}  |  Generated: ${new Date().toLocaleString('en-IN')}`, 14, 28);

        // Profit Margin Table
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Profit Margin by Category', 14, 40);

        autoTable(doc, {
            startY: 45,
            head: [['Category', 'Revenue', 'Cost', 'Net Profit', 'Margin %', 'Units Sold']],
            body: profitData.map(p => [
                p.category,
                `₹${p.revenue.toLocaleString('en-IN')}`,
                `₹${p.cost.toLocaleString('en-IN')}`,
                `₹${p.profit.toLocaleString('en-IN')}`,
                `${p.margin.toFixed(2)}%`,
                p.quantity
            ]),
            theme: 'grid',
            headStyles: { fillColor: [15, 118, 110] },
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' }
            }
        });

        // Best Sellers Table
        doc.addPage();
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Top Performing Creations (Best Sellers)', 14, 20);

        autoTable(doc, {
            startY: 25,
            head: [['Product', 'Category', 'Units Sold', 'Revenue', 'Txns', 'In Stock']],
            body: bestSellers.slice(0, 20).map(s => [
                s.name,
                s.category,
                s.quantity,
                `₹${s.revenue.toLocaleString('en-IN')}`,
                s.transactions,
                s.stock
            ]),
            theme: 'grid',
            headStyles: { fillColor: [15, 118, 110] },
            columnStyles: {
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' }
            }
        });

        doc.save(`advanced-analytics-${label.toLowerCase().replace(' ', '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
            {/* Top Atelier Header */}
            <PageHeader
                title="Advanced Analytics & BI"
                subtitle={`In-depth intelligence on margins, bestseller items, repeat retention, and basket size for ${label}`}
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Period Pills */}
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
                                { id: 'week', label: 'Week' },
                                { id: 'month', label: 'Month' },
                                { id: 'year', label: 'Year' }
                            ].map((tab) => (
                                <Button
                                    key={tab.id}
                                    onClick={() => setDateRange(tab.id)}
                                    sx={{
                                        height: 34,
                                        px: 2,
                                        borderRadius: '20px',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.82rem',
                                        color: dateRange === tab.id ? '#FFFFFF' : 'text.secondary',
                                        bgcolor: dateRange === tab.id ? '#0F766E' : 'transparent',
                                        transition: 'all 0.15s ease',
                                        '&:hover': {
                                            bgcolor: dateRange === tab.id ? '#042F2E' : 'rgba(15, 118, 110, 0.08)'
                                        }
                                    }}
                                >
                                    {tab.label}
                                </Button>
                            ))}
                        </Box>

                        <Button
                            variant="outlined"
                            onClick={exportToPDF}
                            startIcon={<Download sx={{ fontSize: 18, color: '#0F766E' }} />}
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 2.5,
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
                            PDF
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={exportToExcel}
                            startIcon={<Download sx={{ fontSize: 18, color: '#0F766E' }} />}
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 2.5,
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
                            Excel
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handlePrint}
                            startIcon={<Print sx={{ fontSize: 18, color: '#0F766E' }} />}
                            sx={{
                                height: 42,
                                minHeight: 42,
                                px: 2.5,
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
                    </Box>
                }
            />

            {/* Seamless Finance & Audit Navigation Tab Switcher */}
            <FinanceNavTabs activeTab="/advanced-reports" />

            {/* 4 Atelier Intelligence KPIs: Responsive 2x2 Grid on Mobile, 4 Columns on Desktop */}
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Net Gross Profit"
                        value={`₹${totalProfit.toLocaleString('en-IN')}`}
                        subtitle={`${overallMargin.toFixed(1)}% blended margin across ${filteredInvoices.length} invoices`}
                        icon={<AttachMoney />}
                        color="success"
                        delta={{
                            text: `${overallMargin.toFixed(0)}% Margin`,
                            isPositive: overallMargin >= 30
                        }}
                    />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Avg Order Value (AOV)"
                        value={`₹${avgAOV.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                        subtitle="Average checkout basket size"
                        icon={<ShoppingCart />}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Top Performing Category"
                        value={profitData[0]?.category || 'N/A'}
                        subtitle={profitData[0] ? `₹${profitData[0].profit.toLocaleString('en-IN')} net earnings` : 'No sales yet'}
                        icon={<ShowChart />}
                        color="warning"
                    />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="At-Risk Clients"
                        value={atRiskCount}
                        subtitle="Prior buyers inactive for 90+ days"
                        icon={<People />}
                        color={atRiskCount > 0 ? "error" : "success"}
                    />
                </Grid>
            </Grid>

            {/* Analytic Deep Dives with Integrated Subtabs */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px -4px rgba(15, 118, 110, 0.08)'
                }}
            >
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2, pt: 1, bgcolor: 'rgba(15, 118, 110, 0.02)' }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        textColor="primary"
                        indicatorColor="primary"
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                minHeight: 48,
                                color: 'text.secondary',
                                '&.Mui-selected': {
                                    color: '#0F766E'
                                }
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: '#0F766E',
                                height: 3,
                                borderRadius: '3px 3px 0 0'
                            }
                        }}
                    >
                        <Tab label="Profit Margin by Category" />
                        <Tab label="Best Sellers" />
                        <Tab label="Customer Frequency & Retention" />
                        <Tab label="AOV Daily Trends" />
                    </Tabs>
                </Box>

                <Box sx={{ p: { xs: 2, md: 3 } }}>
                    {/* Tab 1: Profit Margin by Category */}
                    {activeTab === 0 && (
                        <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: 'rgba(15, 118, 110, 0.04)' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Gross Revenue</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Estimated Cost</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Net Profit</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Margin %</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Units Sold</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {profitData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                No category sales data recorded in this period.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        profitData.map((row) => (
                                            <TableRow key={row.category} hover sx={{ '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.02)' } }}>
                                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                    {row.category}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                    ₹{row.revenue.toLocaleString('en-IN')}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                                    ₹{row.cost.toLocaleString('en-IN')}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: row.profit >= 0 ? '#0F766E' : '#DC2626' }}>
                                                    ₹{row.profit.toLocaleString('en-IN')}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={`${row.margin.toFixed(1)}%`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: row.margin >= 30 ? 'rgba(15, 118, 110, 0.1)' : row.margin >= 15 ? 'rgba(217, 119, 6, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                                            color: row.margin >= 30 ? '#0F766E' : row.margin >= 15 ? '#D97706' : '#DC2626',
                                                            fontWeight: 800,
                                                            fontSize: '0.75rem'
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                    {row.quantity}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Tab 2: Best Sellers */}
                    {activeTab === 1 && (
                        <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: 'rgba(15, 118, 110, 0.04)' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E', width: 80 }} align="center">Rank</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }}>Creations / Item</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Units Sold</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Revenue Generated</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Invoices</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="center">Stock Level</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {bestSellers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                No item volume sales recorded in this period.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        bestSellers.map((product, index) => (
                                            <TableRow key={product.id} hover sx={{ '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.02)' } }}>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={`#${index + 1}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: index === 0 ? '#D97706' : index === 1 ? '#64748B' : index === 2 ? '#B45309' : 'rgba(0,0,0,0.06)',
                                                            color: index < 3 ? '#FFFFFF' : 'text.primary',
                                                            fontWeight: 800,
                                                            fontSize: '0.72rem'
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                    {product.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={product.category}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.75rem' }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: '#0F766E' }}>
                                                    {product.quantity}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                    ₹{product.revenue.toLocaleString('en-IN')}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                                    {product.transactions}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={product.stock > 10 ? `${product.stock} in stock` : product.stock > 0 ? `Low: ${product.stock}` : 'Out of stock'}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: product.stock > 10 ? 'rgba(15, 118, 110, 0.1)' : product.stock > 0 ? 'rgba(217, 119, 6, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                                            color: product.stock > 10 ? '#0F766E' : product.stock > 0 ? '#D97706' : '#DC2626',
                                                            fontWeight: 700,
                                                            fontSize: '0.72rem'
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Tab 3: Customer Frequency */}
                    {activeTab === 2 && (
                        <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: 'rgba(15, 118, 110, 0.04)' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }}>Client</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Total Orders</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Lifetime Value</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Avg Days Gap</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Days Since Last</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="center">Segment</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="center">Health Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {customerFrequency.slice(0, 25).map((customer) => (
                                        <TableRow key={customer.id} hover sx={{ '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.02)' } }}>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{customer.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{customer.phone}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                {customer.purchaseCount}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800, color: '#0F766E' }}>
                                                ₹{customer.totalSpent.toLocaleString('en-IN')}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                                {customer.avgDaysBetween ? `${customer.avgDaysBetween} d` : '—'}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                {customer.daysSinceLastPurchase} days
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={customer.segment}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: customer.segment === 'VIP' ? 'rgba(217, 119, 6, 0.15)' : customer.segment === 'Loyal' ? 'rgba(15, 118, 110, 0.12)' : 'rgba(0,0,0,0.06)',
                                                        color: customer.segment === 'VIP' ? '#D97706' : customer.segment === 'Loyal' ? '#0F766E' : 'text.primary',
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                {customer.atRisk ? (
                                                    <Chip
                                                        label="At Risk"
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'rgba(220, 38, 38, 0.1)',
                                                            color: '#DC2626',
                                                            fontWeight: 800,
                                                            fontSize: '0.72rem'
                                                        }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        label="Active"
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'rgba(15, 118, 110, 0.1)',
                                                            color: '#0F766E',
                                                            fontWeight: 700,
                                                            fontSize: '0.72rem'
                                                        }}
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Tab 4: AOV Trends */}
                    {activeTab === 3 && (
                        <Box>
                            <Box sx={{ height: 280, mb: 3 }}>
                                <Line
                                    data={{
                                        labels: aovTrends.map(d => d.date),
                                        datasets: [{
                                            label: 'Average Order Value (₹)',
                                            data: aovTrends.map(d => d.aov),
                                            borderColor: '#0F766E',
                                            backgroundColor: 'rgba(15, 118, 110, 0.08)',
                                            fill: true,
                                            tension: 0.35,
                                            pointBackgroundColor: '#0F766E',
                                            pointRadius: 4,
                                            pointHoverRadius: 6
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    callback: (value) => `₹${value.toLocaleString('en-IN')}`
                                                },
                                                grid: { color: 'rgba(0,0,0,0.04)' }
                                            },
                                            x: {
                                                grid: { display: false }
                                            }
                                        }
                                    }}
                                />
                            </Box>
                            <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: 'rgba(15, 118, 110, 0.04)' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, color: '#042F2E' }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Orders</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Total Revenue</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#042F2E' }} align="right">Basket Size (AOV)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {aovTrends.slice(-15).reverse().map((day) => (
                                            <TableRow key={day.date} hover sx={{ '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.02)' } }}>
                                                <TableCell sx={{ fontWeight: 600 }}>{day.date}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>{day.orders}</TableCell>
                                                <TableCell align="right">₹{day.revenue.toLocaleString('en-IN')}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: '#0F766E' }}>
                                                    ₹{day.aov.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default AdvancedReports;
