import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Chip, TextField, Paper, IconButton, Avatar, useTheme, Divider, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemAvatar, ListItemText, InputAdornment, useMediaQuery } from '@mui/material';
import { WhatsApp, ShoppingBag, Event, Search, MoreVert, TrendingUp, Group, Warning, Celebration, Send } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';

const Marketing = () => {
    const { customers, invoices, profile, updateCustomer } = useData();
    const theme = useTheme();
    const [search, setSearch] = useState('');
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [customerFilter, setCustomerFilter] = useState('');

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

        // Track reminder
        if (customer.id) {
            updateCustomer(customer.id, { lastReminderSent: new Date().toISOString() });
        }
    };

    const templates = [
        {
            id: 'festival',
            title: 'Festival Greeting',
            message: `Celebrate the season with style! Get 20% off on all Sarees at ${profile.businessName}. Visit us today!`,
            color: 'primary.main',
            icon: <Celebration />
        },
        {
            id: 'arrivals',
            title: 'New Arrivals',
            message: `Our new collection is here! 🌸 Explore the latest trends at ${profile.businessName}. Early birds get a special surprise!`,
            color: '#10b981',
            icon: <ShoppingBag />
        },
        {
            id: 'sale',
            title: 'Season Sale',
            message: `End of season sale starting now! Up to 50% off on selected items at ${profile.businessName}. Don't miss out!`,
            color: '#ef4444',
            icon: <TrendingUp />
        }
    ];

    const handleOpenTemplate = (template) => {
        setSelectedTemplate(template);
        setTemplateDialogOpen(true);
    };

    const handleSendTemplate = (customer) => {
        const phone = customer.phone.replace(/\D/g, '');
        const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
        const url = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(selectedTemplate.message)}`;
        window.open(url, '_blank');

        // Track reminder
        if (customer.id) {
            updateCustomer(customer.id, { lastReminderSent: new Date().toISOString() });
        }
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
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>{title}</Typography>
                        <Typography variant="h4" sx={{
                            fontWeight: 800,
                            mt: 0.5,
                            fontSize: { xs: '1.5rem', sm: '2.125rem' }
                        }}>{value}</Typography>
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
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                                                <Avatar sx={{
                                                    bgcolor: theme.palette.primary.main,
                                                    fontWeight: 700,
                                                    width: { xs: 32, sm: 40 },
                                                    height: { xs: 32, sm: 40 },
                                                    fontSize: { xs: '0.9rem', sm: '1rem' }
                                                }}>{customer.name[0]}</Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{customer.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{customer.phone}</Typography>
                                                    {customer.lastReminderSent && (
                                                        <Typography variant="caption" display="block" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.6rem' }}>
                                                            Last: {new Date(customer.lastReminderSent).toLocaleDateString()}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Box sx={{ textAlign: 'right', mr: { xs: 0, sm: 2 }, display: { xs: 'none', sm: 'block' } }}>
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
                                                        borderRadius: 2,
                                                        minWidth: { xs: 80, sm: 100 },
                                                        fontSize: { xs: '0.7rem', sm: '0.8125rem' }
                                                    }}
                                                >
                                                    {customer.lastReminderSent ? 'Resend' : 'Remind'}
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
                            {templates.map((template) => (
                                <Box
                                    key={template.id}
                                    onClick={() => handleOpenTemplate(template)}
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: template.id === 'festival' ? 'primary.light' : 'grey.50',
                                        border: '1px solid',
                                        borderColor: template.id === 'festival' ? 'primary.main' : 'divider',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'translateX(4px)',
                                            bgcolor: template.id === 'festival' ? 'primary.light' : 'white',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Box sx={{ color: template.color, display: 'flex' }}>
                                            {React.cloneElement(template.icon, { fontSize: 'small' })}
                                        </Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{template.title}</Typography>
                                    </Box>
                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        "{template.message.substring(0, 60)}..."
                                    </Typography>
                                </Box>
                            ))}
                            <Button fullWidth variant="outlined" sx={{ borderRadius: 2, mt: 1 }}>Create Custom</Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Template Send Dialog */}
            <Dialog
                open={templateDialogOpen}
                onClose={() => setTemplateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                fullScreen={useMediaQuery(theme.breakpoints.down('sm'))}
                PaperProps={{ sx: { borderRadius: { xs: 0, sm: 4 } } }}
            >
                <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Send "{selectedTemplate?.title}"
                    {useMediaQuery(theme.breakpoints.down('sm')) && (
                        <IconButton size="small" onClick={() => setTemplateDialogOpen(false)}>
                            <MoreVert />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                        mb: 3,
                        border: '1px dashed',
                        borderColor: 'divider',
                        fontStyle: 'italic',
                        color: 'text.secondary'
                    }}>
                        "{selectedTemplate?.message}"
                    </Typography>

                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Select Customer to Send</Typography>

                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search customer by name or phone..."
                        value={customerFilter}
                        onChange={(e) => setCustomerFilter(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search fontSize="small" />
                                </InputAdornment>
                            )
                        }}
                    />

                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {customers
                            .filter(c =>
                                c.name.toLowerCase().includes(customerFilter.toLowerCase()) ||
                                c.phone.includes(customerFilter)
                            )
                            .slice(0, 50)
                            .map((customer) => (
                                <ListItem
                                    key={customer.id}
                                    secondaryAction={
                                        <IconButton edge="end" color="primary" onClick={() => handleSendTemplate(customer)}>
                                            <WhatsApp />
                                        </IconButton>
                                    }
                                    sx={{
                                        borderRadius: 2,
                                        mb: 1,
                                        '&:hover': { bgcolor: 'primary.light' }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: theme.palette.primary.main, fontSize: '0.8rem' }}>
                                            {customer.name[0]}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Typography sx={{ fontWeight: 700 }}>{customer.name}</Typography>}
                                        secondary={customer.phone}
                                    />
                                </ListItem>
                            ))}
                    </List>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setTemplateDialogOpen(false)} sx={{ fontWeight: 700 }}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Marketing;
