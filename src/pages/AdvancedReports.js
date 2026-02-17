import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
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
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Chip,
    LinearProgress,
    useTheme
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    Download,
    Print,
    MoreVert,
    ShowChart,
    People,
    ShoppingCart,
    AttachMoney
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { Bar, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const AdvancedReports = () => {
    const { invoices, inventory, customers } = useData();
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [dateRange, setDateRange] = useState('month');
    const [anchorEl, setAnchorEl] = useState(null);

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
                const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

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
                const key = item.id || item.name;
                if (!productSales[key]) {
                    productSales[key] = {
                        name: item.name,
                        category: item.category || 'General',
                        quantity: 0,
                        revenue: 0,
                        transactions: 0
                    };
                }
                productSales[key].quantity += item.quantity;
                productSales[key].revenue += item.price * item.quantity;
                productSales[key].transactions += 1;
            });
        });

        return Object.entries(productSales)
            .map(([id, data]) => {
                const invItem = inventory.find(i => i.id === id);
                return {
                    id,
                    name: data.name,
                    category: data.category,
                    quantity: data.quantity,
                    revenue: data.revenue,
                    transactions: data.transactions,
                    stock: invItem?.quantity || 0,
                    avgPrice: data.revenue / data.quantity
                };
            })
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 20);
    };

    // 3. CUSTOMER PURCHASE FREQUENCY
    const calculateCustomerFrequency = () => {
        const customerData = customers.map(customer => {
            const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
            const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
            const purchaseCount = customerInvoices.length;

            // Calculate days between purchases
            const dates = customerInvoices.map(inv => new Date(inv.date)).sort((a, b) => a - b);
            let avgDaysBetween = 0;
            if (dates.length > 1) {
                const intervals = [];
                for (let i = 1; i < dates.length; i++) {
                    intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
                }
                avgDaysBetween = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
            }

            const lastPurchase = dates.length > 0 ? dates[dates.length - 1] : null;
            const daysSinceLastPurchase = lastPurchase ? (new Date() - lastPurchase) / (1000 * 60 * 60 * 24) : 999;

            let segment = 'New';
            if (purchaseCount >= 10) segment = 'VIP';
            else if (purchaseCount >= 5) segment = 'Loyal';
            else if (purchaseCount >= 2) segment = 'Regular';

            const atRisk = daysSinceLastPurchase > 90;

            return {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                purchaseCount,
                totalSpent,
                avgDaysBetween: Math.round(avgDaysBetween),
                daysSinceLastPurchase: Math.round(daysSinceLastPurchase),
                segment,
                atRisk,
                avgOrderValue: purchaseCount > 0 ? totalSpent / purchaseCount : 0
            };
        }).filter(c => c.purchaseCount > 0)
            .sort((a, b) => b.purchaseCount - a.purchaseCount);

        return customerData;
    };

    // 4. AOV TRENDS
    const calculateAOVTrends = () => {
        const dailyData = {};

        filteredInvoices.forEach(inv => {
            const date = new Date(inv.date).toLocaleDateString('en-IN');
            if (!dailyData[date]) {
                dailyData[date] = { total: 0, count: 0 };
            }
            dailyData[date].total += inv.total;
            dailyData[date].count += 1;
        });

        const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b));

        return sortedDates.map(date => ({
            date,
            aov: dailyData[date].total / dailyData[date].count,
            orders: dailyData[date].count,
            revenue: dailyData[date].total
        }));
    };

    const profitData = calculateProfitByCategory();
    const bestSellers = calculateBestSellers();
    const customerFrequency = calculateCustomerFrequency();
    const aovTrends = calculateAOVTrends();

    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalCost = filteredInvoices.reduce((sum, inv) => {
        return sum + (inv.items?.reduce((itemSum, item) => {
            const invItem = inventory.find(i => i.id === item.id);
            return itemSum + ((invItem?.cost || 0) * item.quantity);
        }, 0) || 0);
    }, 0);
    const totalProfit = totalRevenue - totalCost;
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgAOV = filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0;

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();

        // Profit Margin Sheet
        const profitSheet = XLSX.utils.json_to_sheet(profitData.map(p => ({
            Category: p.category,
            Revenue: p.revenue,
            Cost: p.cost,
            Profit: p.profit,
            'Margin %': p.margin.toFixed(2),
            'Units Sold': p.quantity
        })));
        XLSX.utils.book_append_sheet(wb, profitSheet, 'Profit Margin');

        // Best Sellers Sheet
        const sellersSheet = XLSX.utils.json_to_sheet(bestSellers.map(s => ({
            Product: s.name,
            Category: s.category,
            'Units Sold': s.quantity,
            Revenue: s.revenue,
            Transactions: s.transactions,
            'Current Stock': s.stock
        })));
        XLSX.utils.book_append_sheet(wb, sellersSheet, 'Best Sellers');

        // Customer Frequency Sheet
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

        XLSX.writeFile(wb, `advanced-reports-${label.toLowerCase().replace(' ', '-')}-${new Date().toISOString().split('T')[0]}.xlsx`);
        handleMenuClose();
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Advanced Business Reports', 14, 20);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Period: ${label}`, 14, 28);
        doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 34);

        // Profit Margin Table
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Profit Margin by Category', 14, 45);

        autoTable(doc, {
            startY: 50,
            head: [['Category', 'Revenue', 'Profit', 'Margin %']],
            body: profitData.map(p => [
                p.category,
                `₹${p.revenue.toLocaleString('en-IN')}`,
                `₹${p.profit.toLocaleString('en-IN')}`,
                `${p.margin.toFixed(2)}%`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [136, 14, 79] }
        });

        // Best Sellers Table
        doc.addPage();
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Best Sellers', 14, 20);

        autoTable(doc, {
            startY: 25,
            head: [['Product', 'Category', 'Units Sold', 'Revenue']],
            body: bestSellers.slice(0, 15).map(s => [
                s.name,
                s.category,
                s.quantity,
                `₹${s.revenue.toLocaleString('en-IN')}`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [136, 14, 79] }
        });

        doc.save(`advanced-reports-${label.toLowerCase().replace(' ', '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
        handleMenuClose();
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
                        Advanced Reports
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Detailed business intelligence and analytics
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {/* Date Range Selector */}
                    <Box sx={{ display: 'flex', bgcolor: 'background.paper', p: 0.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        {['week', 'month', 'year'].map((range) => (
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
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(5, 150, 105, 0.1)' }}>
                                    <AttachMoney sx={{ color: '#059669' }} />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    Total Profit
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                                ₹{totalProfit.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {overallMargin.toFixed(2)}% margin
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(136, 14, 79, 0.1)' }}>
                                    <ShoppingCart sx={{ color: 'primary.main' }} />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    Avg Order Value
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                ₹{avgAOV.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(217, 119, 6, 0.1)' }}>
                                    <ShowChart sx={{ color: '#D97706' }} />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    Best Category
                                </Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                {profitData[0]?.category || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                ₹{(profitData[0]?.profit || 0).toLocaleString('en-IN')} profit
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(124, 58, 237, 0.1)' }}>
                                    <People sx={{ color: '#7C3AED' }} />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    At-Risk Customers
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                {customerFrequency.filter(c => c.atRisk).length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                No purchase in 90+ days
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.875rem'
                        }
                    }}
                >
                    <Tab label="Profit Margin by Category" />
                    <Tab label="Best Sellers" />
                    <Tab label="Customer Frequency" />
                    <Tab label="AOV Trends" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {/* Tab 1: Profit Margin */}
                    {activeTab === 0 && (
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: 'rgba(136, 14, 79, 0.02)' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Revenue</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Cost</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Profit</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Margin %</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Units Sold</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {profitData.map((row) => (
                                        <TableRow key={row.category} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{row.category}</TableCell>
                                            <TableCell align="right">₹{row.revenue.toLocaleString('en-IN')}</TableCell>
                                            <TableCell align="right">₹{row.cost.toLocaleString('en-IN')}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, color: row.profit >= 0 ? 'success.main' : 'error.main' }}>
                                                ₹{row.profit.toLocaleString('en-IN')}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={`${row.margin.toFixed(2)}%`}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: row.margin >= 30 ? 'rgba(5, 150, 105, 0.1)' : row.margin >= 15 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                                        color: row.margin >= 30 ? '#059669' : row.margin >= 15 ? '#F59E0B' : '#DC2626',
                                                        fontWeight: 700
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">{row.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Tab 2: Best Sellers */}
                    {activeTab === 1 && (
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: 'rgba(136, 14, 79, 0.02)' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Rank</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Units Sold</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Revenue</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Transactions</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Stock Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {bestSellers.map((product, index) => (
                                        <TableRow key={product.id} hover>
                                            <TableCell>
                                                <Chip
                                                    label={`#${index + 1}`}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'rgba(0,0,0,0.08)',
                                                        color: index < 3 ? 'white' : 'text.primary',
                                                        fontWeight: 700
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{product.name}</TableCell>
                                            <TableCell>{product.category}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>{product.quantity}</TableCell>
                                            <TableCell align="right">₹{product.revenue.toLocaleString('en-IN')}</TableCell>
                                            <TableCell align="right">{product.transactions}</TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: product.stock > 10 ? 'rgba(5, 150, 105, 0.1)' : product.stock > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                                        color: product.stock > 10 ? '#059669' : product.stock > 0 ? '#F59E0B' : '#DC2626',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Tab 3: Customer Frequency */}
                    {activeTab === 2 && (
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: 'rgba(136, 14, 79, 0.02)' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Purchases</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Total Spent</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Avg Days Between</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Days Since Last</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Segment</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {customerFrequency.slice(0, 20).map((customer) => (
                                        <TableRow key={customer.id} hover>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{customer.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{customer.phone}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>{customer.purchaseCount}</TableCell>
                                            <TableCell align="right">₹{customer.totalSpent.toLocaleString('en-IN')}</TableCell>
                                            <TableCell align="right">{customer.avgDaysBetween || 'N/A'}</TableCell>
                                            <TableCell align="right">{customer.daysSinceLastPurchase}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={customer.segment}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: customer.segment === 'VIP' ? 'rgba(136, 14, 79, 0.1)' : customer.segment === 'Loyal' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                                                        color: customer.segment === 'VIP' ? 'primary.main' : customer.segment === 'Loyal' ? '#059669' : '#D97706',
                                                        fontWeight: 700
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {customer.atRisk && (
                                                    <Chip
                                                        label="At Risk"
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'rgba(220, 38, 38, 0.1)',
                                                            color: '#DC2626',
                                                            fontWeight: 600
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
                            <Box sx={{ height: 300, mb: 3 }}>
                                <Line
                                    data={{
                                        labels: aovTrends.map(d => d.date),
                                        datasets: [{
                                            label: 'Average Order Value',
                                            data: aovTrends.map(d => d.aov),
                                            borderColor: '#E11D48',
                                            backgroundColor: 'rgba(225, 29, 72, 0.1)',
                                            fill: true,
                                            tension: 0.4
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
                                                }
                                            }
                                        }
                                    }}
                                />
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: 'rgba(136, 14, 79, 0.02)' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="right">Orders</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="right">Revenue</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="right">AOV</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {aovTrends.slice(-10).reverse().map((day) => (
                                            <TableRow key={day.date} hover>
                                                <TableCell>{day.date}</TableCell>
                                                <TableCell align="right">{day.orders}</TableCell>
                                                <TableCell align="right">₹{day.revenue.toLocaleString('en-IN')}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>
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
