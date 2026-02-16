import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Chip, TextField, Paper, IconButton, Avatar, useTheme, Divider, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemAvatar, ListItemText, InputAdornment, useMediaQuery, Checkbox, FormControlLabel, Stack } from '@mui/material';
import { WhatsApp, ShoppingBag, Event, Search, MoreVert, TrendingUp, Group, Warning, Celebration, Send, CheckCircle, RadioButtonUnchecked, Edit, Delete, Add } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';

const Marketing = () => {
    const { customers, invoices, profile, updateCustomer, marketingTemplates, addMarketingTemplate, updateMarketingTemplate, deleteMarketingTemplate } = useData();
    const theme = useTheme();
    const [search, setSearch] = useState('');
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [customerFilter, setCustomerFilter] = useState('');
    const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
    const [bulkSendDialogOpen, setBulkSendDialogOpen] = useState(false);
    const [bulkTemplate, setBulkTemplate] = useState(null);

    const [editTemplateDialogOpen, setEditTemplateDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [templateFormData, setTemplateFormData] = useState({ title: '', message: '', color: '#d97706', imageUrl: '' });

    // Initialize default templates if none exist
    React.useEffect(() => {
        if (marketingTemplates.length === 0) {
            const defaults = [
                {
                    title: 'Festival Greeting',
                    message: `Celebrate the season with style! Get 20% off on all Sarees at ${profile.businessName}. Visit us today!`,
                    color: '#d97706',
                    type: 'festival',
                    imageUrl: ''
                },
                {
                    title: 'New Arrivals',
                    message: `Our new collection is here! 🌸 Explore the latest trends at ${profile.businessName}. Early birds get a special surprise!`,
                    color: '#10b981',
                    type: 'arrivals',
                    imageUrl: ''
                },
                {
                    title: 'Season Sale',
                    message: `End of season sale starting now! Up to 50% off on selected items at ${profile.businessName}. Don't miss out!`,
                    color: '#ef4444',
                    type: 'sale',
                    imageUrl: ''
                }
            ];
            defaults.forEach(async (t) => await addMarketingTemplate(t));
        }
    }, [marketingTemplates.length, profile.businessName]);

    const handleSaveTemplate = async () => {
        if (editingTemplate) {
            await updateMarketingTemplate(editingTemplate.id, templateFormData);
        } else {
            await addMarketingTemplate(templateFormData);
        }
        setEditTemplateDialogOpen(false);
        setEditingTemplate(null);
        setTemplateFormData({ title: '', message: '', color: '#d97706', imageUrl: '' });
    };

    const handleDeleteTemplate = async (id) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            await deleteMarketingTemplate(id);
        }
    };

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
            message = `Hello ${customer.name} !We've missed you at ${profile.businessName}. We have some exciting new arrivals. Visit us soon!`;
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

    const templates = marketingTemplates;

    const handleOpenTemplate = (template) => {
        setSelectedTemplate(template);
        setTemplateDialogOpen(true);
    };

    const handleSendTemplate = (customer) => {
        const phone = customer.phone.replace(/\D/g, '');
        const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
        let message = selectedTemplate.message;
        if (selectedTemplate.imageUrl) {
            message += `\n\n${selectedTemplate.imageUrl}`;
        }
        const url = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(message)}`;
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
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={selectedCustomerIds.length === dormantCustomers.length && dormantCustomers.length > 0}
                                            indeterminate={selectedCustomerIds.length > 0 && selectedCustomerIds.length < dormantCustomers.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedCustomerIds(dormantCustomers.map(c => c.id));
                                                } else {
                                                    setSelectedCustomerIds([]);
                                                }
                                            }}
                                        />
                                    }
                                    label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Select All</Typography>}
                                />
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
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
                                                <Checkbox
                                                    size="small"
                                                    checked={selectedCustomerIds.includes(customer.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedCustomerIds([...selectedCustomerIds, customer.id]);
                                                        } else {
                                                            setSelectedCustomerIds(selectedCustomerIds.filter(id => id !== customer.id));
                                                        }
                                                    }}
                                                />
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>Today's Celebrations</Typography>
                            {anniversaries.length > 0 && (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={anniversaries.every(a => selectedCustomerIds.includes(a.id))}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const newSelection = [...new Set([...selectedCustomerIds, ...anniversaries.map(a => a.id)])];
                                                    setSelectedCustomerIds(newSelection);
                                                } else {
                                                    const filtered = selectedCustomerIds.filter(id => !anniversaries.some(a => a.id === id));
                                                    setSelectedCustomerIds(filtered);
                                                }
                                            }}
                                        />
                                    }
                                    label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Select All</Typography>}
                                    sx={{ m: 0 }}
                                />
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {anniversaries.map((customer) => (
                                <Box key={customer.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Checkbox
                                        size="small"
                                        checked={selectedCustomerIds.includes(customer.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedCustomerIds([...selectedCustomerIds, customer.id]);
                                            } else {
                                                setSelectedCustomerIds(selectedCustomerIds.filter(id => id !== customer.id));
                                            }
                                        }}
                                    />
                                    <Avatar sx={{ bgcolor: '#f59e0b', width: 32, height: 32 }}><Celebration fontSize="small" /></Avatar>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{customer.name}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Birthday Today</Typography>
                                    </Box>
                                    <IconButton size="small" color="primary" onClick={() => sendWhatsApp(customer, 'anniversary')}>
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
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: template.color + '10',
                                        border: '1px solid',
                                        borderColor: template.color,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        '&:hover': {
                                            transform: 'translateX(4px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        }
                                    }}
                                >
                                    <Box onClick={() => handleOpenTemplate(template)}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Box sx={{ color: template.color, display: 'flex' }}>
                                                {template.type === 'festival' ? <Celebration fontSize="small" /> :
                                                    template.type === 'arrivals' ? <ShoppingBag fontSize="small" /> :
                                                        template.type === 'sale' ? <TrendingUp fontSize="small" /> :
                                                            <Event fontSize="small" />}
                                            </Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{template.title}</Typography>
                                        </Box>
                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontStyle: 'italic', pr: 6 }}>
                                            "{template.message.substring(0, 60)}..."
                                        </Typography>
                                    </Box>
                                    <Box sx={{ position: 'absolute', right: 8, top: 4, display: 'flex' }}>
                                        <IconButton size="small" onClick={() => {
                                            setEditingTemplate(template);
                                            setTemplateFormData({
                                                title: template.title,
                                                message: template.message,
                                                color: template.color,
                                                imageUrl: template.imageUrl || ''
                                            });
                                            setEditTemplateDialogOpen(true);
                                        }}>
                                            <Edit fontSize="inherit" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDeleteTemplate(template.id)}>
                                            <Delete fontSize="inherit" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            ))}
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Add />}
                                sx={{ borderRadius: 2, mt: 1 }}
                                onClick={() => {
                                    setEditingTemplate(null);
                                    setTemplateFormData({ title: '', message: '', color: '#d97706', imageUrl: '' });
                                    setEditTemplateDialogOpen(true);
                                }}
                            >
                                Create Custom
                            </Button>
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

            {/* Bulk Actions Header / Bar */}
            {selectedCustomerIds.length > 0 && (
                <Paper
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: theme.zIndex.appBar,
                        px: 3,
                        py: 1.5,
                        borderRadius: 10,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        width: 'auto',
                        minWidth: { xs: '90%', sm: 400 },
                        justifyContent: 'space-between'
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {selectedCustomerIds.length} Customers Selected
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            onClick={() => setSelectedCustomerIds([])}
                            sx={{ color: 'white', fontWeight: 700, textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<WhatsApp />}
                            onClick={() => {
                                setBulkTemplate(templates[0]);
                                setBulkSendDialogOpen(true);
                            }}
                            sx={{
                                bgcolor: 'white',
                                color: 'primary.main',
                                fontWeight: 800,
                                px: 3,
                                borderRadius: 5,
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'grey.100' }
                            }}
                        >
                            Bulk Send
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Bulk Send Managed Dialog */}
            <Dialog
                open={bulkSendDialogOpen}
                onClose={() => setBulkSendDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>
                    Bulk Send Messages
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={5}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>1. Choose Template</Typography>
                            <Stack spacing={2}>
                                {templates.map((t) => (
                                    <Box
                                        key={t.id}
                                        onClick={() => setBulkTemplate(t)}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            border: '2px solid',
                                            borderColor: bulkTemplate?.id === t.id ? 'primary.main' : 'divider',
                                            bgcolor: bulkTemplate?.id === t.id ? 'primary.light' : 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': { borderColor: 'primary.main' }
                                        }}
                                    >
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{t.title}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                                            "{t.message.substring(0, 60)}..."
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={7}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>2. Recipient List ({selectedCustomerIds.length})</Typography>
                            <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 400, overflow: 'auto' }}>
                                <List disablePadding>
                                    {selectedCustomerIds.map((id, idx) => {
                                        const customer = customers.find(c => c.id === id);
                                        if (!customer) return null;
                                        return (
                                            <ListItem
                                                key={id}
                                                divider={idx < selectedCustomerIds.length - 1}
                                                secondaryAction={
                                                    <IconButton
                                                        edge="end"
                                                        color="primary"
                                                        size="small"
                                                        onClick={() => {
                                                            const phone = customer.phone.replace(/\D/g, '');
                                                            const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
                                                            let message = bulkTemplate?.message || '';
                                                            if (bulkTemplate?.imageUrl) {
                                                                message += `\n\n${bulkTemplate.imageUrl}`;
                                                            }
                                                            const url = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(message)}`;
                                                            window.open(url, '_blank');
                                                            updateCustomer(customer.id, { lastReminderSent: new Date().toISOString() });
                                                        }}
                                                    >
                                                        <WhatsApp />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemAvatar>
                                                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
                                                        {customer.name[0]}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={<Typography variant="body2" sx={{ fontWeight: 700 }}>{customer.name}</Typography>}
                                                    secondary={<Typography variant="caption">{customer.phone}</Typography>}
                                                />
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            </Paper>
                            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary', textAlign: 'center' }}>
                                For security and anti-spam, click the icon next to each customer to send.
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setBulkSendDialogOpen(false)} sx={{ fontWeight: 700 }}>Finish</Button>
                </DialogActions>
            </Dialog>

            {/* Create/Edit Template Dialog */}
            <Dialog
                open={editTemplateDialogOpen}
                onClose={() => setEditTemplateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {editingTemplate ? 'Edit Template' : 'Create Custom Template'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Template Title"
                            placeholder="e.g. Diwali Special"
                            value={templateFormData.title}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, title: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label="Message"
                            multiline
                            rows={4}
                            placeholder="Type your WhatsApp message here..."
                            value={templateFormData.message}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, message: e.target.value })}
                            helperText="Tip: You can use emojis to make it more engaging!"
                        />
                        <TextField
                            fullWidth
                            label="Image URL (Optional)"
                            placeholder="https://example.com/image.jpg"
                            value={templateFormData.imageUrl}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, imageUrl: e.target.value })}
                            helperText="Paste a link to an image to include it in WhatsApp messages"
                        />
                        {templateFormData.imageUrl && (
                            <Box sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                p: 2,
                                textAlign: 'center',
                                bgcolor: 'grey.50'
                            }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>Image Preview</Typography>
                                <img
                                    src={templateFormData.imageUrl}
                                    alt="Template preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '200px',
                                        borderRadius: '8px',
                                        objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                                <Typography variant="caption" color="error" sx={{ display: 'none' }}>
                                    Unable to load image. Please check the URL.
                                </Typography>
                            </Box>
                        )}
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Theme Color</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {['#d97706', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'].map((c) => (
                                    <Box
                                        key={c}
                                        onClick={() => setTemplateFormData({ ...templateFormData, color: c })}
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            bgcolor: c,
                                            cursor: 'pointer',
                                            border: templateFormData.color === c ? '3px solid black' : 'none',
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'scale(1.1)' }
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setEditTemplateDialogOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveTemplate}
                        disabled={!templateFormData.title || !templateFormData.message}
                        sx={{ fontWeight: 800, px: 4, borderRadius: 3 }}
                    >
                        Save Template
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Marketing;
