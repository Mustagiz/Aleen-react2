import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Chip, TextField, Paper, IconButton, Avatar, useTheme, Divider, Tooltip } from '@mui/material';
import { WhatsApp, ShoppingBag, Event, Search, MoreVert, TrendingUp, Group, Warning, Celebration, Send } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';

const Marketing = () => {
    const { customers, invoices, profile } = useData();
    const theme = useTheme();
    const [search, setSearch] = useState('');

    const today = new Date();

    // Calculate dormant customers (last visit > 30 days ago)
    const dormantThreshold = 30; // days

    const getDormantCustomers = () => {
        return customers.filter(customer => {
            // Find latest invoice for this customer
            const customerInvoices = invoices.filter(inv => inv.phone === customer.phone || inv.customer === customer.name);
            if (customerInvoices.length === 0) return true; // Never visited is technically dormant

            const latestInvoice = customerInvoices.reduce((latest, current) => {
                return new Date(current.date) > new Date(latest.date) ? current : latest;
            });

            const lastVisit = new Date(latestInvoice.date);
            const diffTime = Math.abs(today - lastVisit);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return diffDays > dormantThreshold;
        });
    };

    const getAnniversaries = () => {
        return customers.filter(customer => {
            if (!customer.dob) return false;
            const dob = new Date(customer.dob);
            return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
        });
    };

    const dormantCustomers = getDormantCustomers();
    const anniversaries = getAnniversaries();

    const sendWhatsApp = (customer, type) => {
        let message = '';
        if (type === 'dormant') {
            message = `Hello ${customer.name}! We've missed you at ${profile.businessName}. We have some exciting new arrivals. Visit us soon!`;
        } else if (type === 'anniversary') {
            message = `Happy Birthday ${customer.name}! 🎉 Wishing you a wonderful day. As a special treat, enjoy a 10% discount on your next visit to ${profile.businessName}!`;
        }

        const phone = customer.phone.replace(/\D/g, '');
        const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
        const url = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const StatCard = ({ title, value, icon, color }) => (
        <Card sx={{
            borderRadius: 4,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.05)',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: color }} />
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{title}</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{value}</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${color}15`, color: color }}>
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Marketing Center</Typography>
                    <Typography variant="body2" color="text.secondary">Engage with your customers and drive sales</Typography>
                </Box>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Customers" value={customers.length} icon={<Group />} color={theme.palette.primary.main} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Dormant Customers" value={dormantCustomers.length} icon={<Warning />} color="#ef4444" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Today's Birthdays" value={anniversaries.length} icon={<Celebration />} color="#f59e0b" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Active Campaigns" value="2" icon={<TrendingUp />} color="#10b981" />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Dormant Customers Section */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, borderRadius: 4, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Dormant Customers</Typography>
                                <Typography variant="caption" color="text.secondary">Customers who haven't visited in 30+ days</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    size="small"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" /> }}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {dormantCustomers
                                .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
                                .slice(0, 10)
                                .map((customer) => (
                                    <Card key={customer.id} sx={{
                                        borderRadius: 3,
                                        bgcolor: 'grey.50',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        boxShadow: 'none',
                                        '&:hover': { bgcolor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                                    }}>
                                        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ bgcolor: theme.palette.primary.main, fontWeight: 700 }}>{customer.name[0]}</Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{customer.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{customer.phone}</Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'right', mr: 2 }}>
                                                    <Chip
                                                        label="Dormant"
                                                        size="small"
                                                        color="error"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                                                    />
                                                </Box>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<WhatsApp />}
                                                    onClick={() => sendWhatsApp(customer, 'dormant')}
                                                    sx={{
                                                        bgcolor: '#25D366',
                                                        '&:hover': { bgcolor: '#128C7E' },
                                                        fontWeight: 700,
                                                        borderRadius: 2
                                                    }}
                                                >
                                                    Remind
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            {dormantCustomers.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                    No dormant customers found!
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Side Panels */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 4, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Today's Celebrations</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {anniversaries.map((customer) => (
                                <Box key={customer.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: '#f59e0b' }}><Celebration fontSize="small" /></Avatar>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{customer.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">Birthday Today</Typography>
                                    </Box>
                                    <IconButton color="primary" onClick={() => sendWhatsApp(customer, 'anniversary')}>
                                        <Send fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                            {anniversaries.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                    No birthdays today.
                                </Typography>
                            )}
                        </Box>
                    </Paper>

                    <Paper sx={{ p: 3, borderRadius: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Campaign Templates</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.light', border: '1px solid', borderColor: 'primary.main' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Festival Greeting</Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                    "Special 20% off for the festive season..."
                                </Typography>
                            </Box>
                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>New Arrivals</Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                    "Checkout our new collection of Kurtis..."
                                </Typography>
                            </Box>
                            <Button fullWidth variant="outlined" sx={{ borderRadius: 2, mt: 1 }}>Create Custom</Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Marketing;
