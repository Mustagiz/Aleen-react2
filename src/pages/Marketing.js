import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Grid, 
    Button, 
    Chip, 
    TextField, 
    Paper, 
    IconButton, 
    Avatar, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    List, 
    ListItem, 
    ListItemAvatar, 
    ListItemText, 
    InputAdornment, 
    Checkbox, 
    FormControlLabel, 
    Stack 
} from '@mui/material';
import { 
    WhatsApp, 
    Search, 
    MoreVert, 
    TrendingUp, 
    Group, 
    Warning, 
    Celebration, 
    Send, 
    Edit, 
    Delete, 
    Add,
    Campaign
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import ClienteleNavTabs from '../components/crm/ClienteleNavTabs';

const Marketing = () => {
    const { 
        customers, 
        invoices, 
        profile, 
        updateCustomer, 
        marketingTemplates, 
        addMarketingTemplate, 
        updateMarketingTemplate, 
        deleteMarketingTemplate 
    } = useData();
    const [search, setSearch] = useState('');
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [customerFilter, setCustomerFilter] = useState('');
    const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
    const [bulkSendDialogOpen, setBulkSendDialogOpen] = useState(false);
    const [bulkTemplate, setBulkTemplate] = useState(null);

    const [editTemplateDialogOpen, setEditTemplateDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [templateFormData, setTemplateFormData] = useState({ title: '', message: '', color: '#0F766E', imageUrl: '' });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Initialize default templates if none exist
    useEffect(() => {
        if (marketingTemplates.length === 0) {
            const defaults = [
                {
                    title: 'Haute Festive Preview',
                    message: `Celebrate the festive season in bespoke elegance! Enjoy 20% privilege on curated designer sarees at ${profile?.businessName || 'Aleen Haute Couture'}. Schedule your private atelier fitting today!`,
                    color: '#0F766E',
                    type: 'festival',
                    imageUrl: ''
                },
                {
                    title: 'New Bridal & Couture Collection',
                    message: `Our new seasonal couture collection has arrived! 🌸 Explore the finest silk weaves and handcrafted embroidery at ${profile?.businessName || 'Aleen Haute Couture'}. Early patrons receive an exclusive styling consultation!`,
                    color: '#D97706',
                    type: 'arrivals',
                    imageUrl: ''
                },
                {
                    title: 'Seasonal Boutique Privileges',
                    message: `Exclusive end-of-season designer privileges starting now! Up to 40% off on select couture pieces at ${profile?.businessName || 'Aleen Haute Couture'}. Don't miss out on these limited atelier creations!`,
                    color: '#B45309',
                    type: 'sale',
                    imageUrl: ''
                }
            ];
            defaults.forEach(async (t) => await addMarketingTemplate(t));
        }
    }, [marketingTemplates.length, profile?.businessName, addMarketingTemplate]);

    const handleSaveTemplate = async () => {
        if (editingTemplate) {
            await updateMarketingTemplate(editingTemplate.id, templateFormData);
        } else {
            await addMarketingTemplate(templateFormData);
        }
        setEditTemplateDialogOpen(false);
        setEditingTemplate(null);
        setTemplateFormData({ title: '', message: '', color: '#0F766E', imageUrl: '' });
        setUploadProgress(0);
        setIsUploading(false);
    };

    const handleDeleteTemplate = async (id) => {
        if (window.confirm('Are you sure you want to delete this campaign template?')) {
            const template = marketingTemplates.find(t => t.id === id);
            if (template?.imageUrl && template.imageUrl.includes('firebase')) {
                try {
                    const imageRef = ref(storage, template.imageUrl);
                    await deleteObject(imageRef);
                } catch (error) {
                    console.error('Error deleting image:', error);
                }
            }
            await deleteMarketingTemplate(id);
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setIsUploading(true);
        const storageRef = ref(storage, `marketing_templates/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error('Upload error:', error);
                alert('Failed to upload image. Please try again.');
                setIsUploading(false);
                setUploadProgress(0);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setTemplateFormData({ ...templateFormData, imageUrl: downloadURL });
                setIsUploading(false);
                setUploadProgress(0);
            }
        );
    };

    const handleRemoveImage = () => {
        setTemplateFormData({ ...templateFormData, imageUrl: '' });
    };

    const today = new Date();
    const dormantThreshold = 30; // days

    const getDormantCustomers = () => {
        return customers.filter(customer => {
            const customerInvoices = invoices.filter(inv => inv.phone === customer.phone || inv.customer === customer.name);
            if (customerInvoices.length === 0) return true;

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
            message = `Hello ${customer.name}! We've missed you at ${profile?.businessName || 'Aleen Haute Couture'}. We have exquisite new seasonal arrivals and would love to welcome you back for a styling session. Visit us soon!`;
        } else if (type === 'anniversary') {
            message = `Happy Birthday ${customer.name}! 🎉 Warmest wishes from the entire team at ${profile?.businessName || 'Aleen Haute Couture'}. As a celebration gift, please enjoy 100 bonus loyalty credits and 10% off your next custom tailoring or boutique purchase!`;
        }

        const phone = customer.phone.replace(/\D/g, '');
        const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
        const url = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

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

        if (customer.id) {
            updateCustomer(customer.id, { lastReminderSent: new Date().toISOString() });
        }
    };

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
            {/* Atelier Page Header */}
            <PageHeader
                title="WhatsApp Campaigns & Marketing Engine"
                subtitle="Broadcast couture announcements, celebrate VIP birthdays, and re-engage dormant atelier patrons"
                actions={
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setEditingTemplate(null);
                            setTemplateFormData({ title: '', message: '', color: '#0F766E', imageUrl: '' });
                            setEditTemplateDialogOpen(true);
                        }}
                        sx={{
                            px: 3,
                            py: 1,
                            borderRadius: 2.5,
                            fontWeight: 700,
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                            color: '#ffffff',
                            boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #042F2E 0%, #0F766E 100%)'
                            }
                        }}
                    >
                        Create Campaign Template
                    </Button>
                }
            />

            {/* Clientele & CRM Tab Switcher */}
            <ClienteleNavTabs />

            {/* 4 Atelier Intelligence KPIs */}
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Audience Reach"
                        value={customers.length.toLocaleString()}
                        subtitle="Total registered boutique clientele"
                        icon={<Group />}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Dormant Patrons"
                        value={dormantCustomers.length.toLocaleString()}
                        subtitle="No visits in the past 30+ days"
                        icon={<Warning />}
                        color={dormantCustomers.length > 0 ? "warning" : "success"}
                        delta={{
                            text: `${dormantCustomers.length} Re-engage`,
                            isPositive: dormantCustomers.length === 0
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Today's Birthdays"
                        value={anniversaries.length.toLocaleString()}
                        subtitle="Clients celebrating today"
                        icon={<Celebration />}
                        color="warning"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Campaign Templates"
                        value={marketingTemplates.length.toLocaleString()}
                        subtitle="Ready for instant WhatsApp broadcast"
                        icon={<TrendingUp />}
                        color="success"
                    />
                </Grid>
            </Grid>

            {/* Main Content Layout */}
            <Grid container spacing={3}>
                {/* Dormant Customers Section */}
                <Grid item xs={12} lg={8}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            mb: 3,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                    Dormant Patrons Re-engagement ({dormantCustomers.length})
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Clients who have not placed a couture or retail order in 30+ days
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
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
                                            sx={{ color: '#0F766E', '&.Mui-checked': { color: '#0F766E' } }}
                                        />
                                    }
                                    label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Select All</Typography>}
                                />
                                <TextField
                                    size="small"
                                    placeholder="Search dormant list..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    InputProps={{ 
                                        startAdornment: <Search sx={{ mr: 1, color: '#0F766E' }} fontSize="small" /> 
                                    }}
                                    sx={{ minWidth: 200 }}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {dormantCustomers
                                .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
                                .slice(0, 15)
                                .map((customer) => (
                                    <Paper
                                        key={customer.id}
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 2,
                                            transition: 'all 0.2s',
                                            '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.02)', borderColor: '#0F766E' }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                                                sx={{ color: '#0F766E', '&.Mui-checked': { color: '#0F766E' } }}
                                            />
                                            <Avatar sx={{
                                                bgcolor: '#0F766E',
                                                fontWeight: 800,
                                                width: 38,
                                                height: 38,
                                                fontSize: '0.85rem'
                                            }}>
                                                {customer.name[0]}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                    {customer.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {customer.phone}
                                                </Typography>
                                                {customer.lastReminderSent && (
                                                    <Typography variant="caption" display="block" sx={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem' }}>
                                                        Last reminded: {new Date(customer.lastReminderSent).toLocaleDateString()}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Chip
                                                label="Dormant (>30d)"
                                                size="small"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '0.68rem',
                                                    bgcolor: 'rgba(217, 119, 6, 0.1)',
                                                    color: '#B45309',
                                                    display: { xs: 'none', sm: 'inline-flex' }
                                                }}
                                            />
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
                                                    textTransform: 'none',
                                                    fontSize: '0.78rem',
                                                    px: 2
                                                }}
                                            >
                                                {customer.lastReminderSent ? 'Resend' : 'Remind'}
                                            </Button>
                                        </Box>
                                    </Paper>
                                ))}

                            {dormantCustomers.length === 0 && (
                                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        Splendid! No dormant clientele detected. All clients have ordered recently.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Right Side Panels: Celebrations & Templates */}
                <Grid item xs={12} lg={4}>
                    {/* Today's Celebrations */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            mb: 3,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Celebration sx={{ color: '#D97706', fontSize: 20 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                    Today's Birthdays
                                </Typography>
                            </Box>
                            {anniversaries.length > 0 && (
                                <Chip
                                    label={`${anniversaries.length} today`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(217, 119, 6, 0.12)', color: '#B45309', fontWeight: 800 }}
                                />
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {anniversaries.map((customer) => (
                                <Box
                                    key={customer.id}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(217, 119, 6, 0.05)',
                                        border: '1px solid rgba(217, 119, 6, 0.15)'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ bgcolor: '#D97706', width: 34, height: 34, fontSize: '0.8rem', fontWeight: 800 }}>
                                            {customer.name[0]}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 750 }}>{customer.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{customer.phone}</Typography>
                                        </Box>
                                    </Box>
                                    <IconButton
                                        size="small"
                                        onClick={() => sendWhatsApp(customer, 'anniversary')}
                                        sx={{ bgcolor: '#25D366', color: '#FFFFFF', '&:hover': { bgcolor: '#128C7E' } }}
                                    >
                                        <Send fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                            {anniversaries.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    No client birthdays recorded for today.
                                </Typography>
                            )}
                        </Box>
                    </Paper>

                    {/* Campaign Templates */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Campaign sx={{ color: '#0F766E', fontSize: 20 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                    Campaign Templates
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                            {templates.map((template) => (
                                <Box
                                    key={template.id}
                                    sx={{
                                        p: 2,
                                        borderRadius: 2.5,
                                        bgcolor: 'background.paper',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        '&:hover': {
                                            borderColor: '#0F766E',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(15, 118, 110, 0.08)'
                                        }
                                    }}
                                >
                                    <Box onClick={() => handleOpenTemplate(template)}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Box sx={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                bgcolor: template.color || '#0F766E'
                                            }} />
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                                {template.title}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontStyle: 'italic', pr: 5 }}>
                                            "{template.message.substring(0, 65)}..."
                                        </Typography>
                                    </Box>
                                    <Box sx={{ position: 'absolute', right: 8, top: 8, display: 'flex', gap: 0.5 }}>
                                        <IconButton size="small" onClick={() => {
                                            setEditingTemplate(template);
                                            setTemplateFormData({
                                                title: template.title,
                                                message: template.message,
                                                color: template.color || '#0F766E',
                                                imageUrl: template.imageUrl || ''
                                            });
                                            setEditTemplateDialogOpen(true);
                                        }}>
                                            <Edit fontSize="small" sx={{ fontSize: 16 }} />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDeleteTemplate(template.id)}>
                                            <Delete fontSize="small" sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                </Box>
                            ))}

                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Add />}
                                sx={{
                                    borderRadius: 2.5,
                                    mt: 1,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    borderColor: 'divider',
                                    color: 'text.primary',
                                    '&:hover': { borderColor: '#0F766E', bgcolor: 'rgba(15, 118, 110, 0.04)' }
                                }}
                                onClick={() => {
                                    setEditingTemplate(null);
                                    setTemplateFormData({ title: '', message: '', color: '#0F766E', imageUrl: '' });
                                    setEditTemplateDialogOpen(true);
                                }}
                            >
                                + Add Custom Template
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
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle sx={{ 
                    fontWeight: 800, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    bgcolor: 'rgba(15, 118, 110, 0.04)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    color: '#042F2E'
                }}>
                    Broadcast: "{selectedTemplate?.title}"
                    <IconButton size="small" onClick={() => setTemplateDialogOpen(false)}>
                        <MoreVert />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5 }}>
                    <Typography variant="body2" sx={{
                        p: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 2.5,
                        mb: 3,
                        border: '1px dashed',
                        borderColor: '#0F766E',
                        fontStyle: 'italic',
                        color: 'text.secondary'
                    }}>
                        "{selectedTemplate?.message}"
                    </Typography>

                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#042F2E' }}>
                        Select Patron to Dispatch
                    </Typography>

                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search patron by name or mobile..."
                        value={customerFilter}
                        onChange={(e) => setCustomerFilter(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search fontSize="small" sx={{ color: '#0F766E' }} />
                                </InputAdornment>
                            )
                        }}
                    />

                    <List sx={{ maxHeight: 320, overflow: 'auto', p: 0 }}>
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
                                        <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={<WhatsApp />}
                                            onClick={() => handleSendTemplate(customer)}
                                            sx={{
                                                bgcolor: '#25D366',
                                                '&:hover': { bgcolor: '#128C7E' },
                                                fontWeight: 700,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            Send
                                        </Button>
                                    }
                                    sx={{
                                        borderRadius: 2,
                                        mb: 1,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.04)' }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: '#0F766E', fontSize: '0.85rem', fontWeight: 800 }}>
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
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setTemplateDialogOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Actions Floating Bottom Bar */}
            {selectedCustomerIds.length > 0 && (
                <Paper
                    elevation={8}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1300,
                        px: 3,
                        py: 1.5,
                        borderRadius: 10,
                        bgcolor: '#042F2E',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        minWidth: { xs: '90%', sm: 420 },
                        justifyContent: 'space-between',
                        boxShadow: '0 12px 40px rgba(4, 47, 46, 0.4)'
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {selectedCustomerIds.length} Patrons Selected
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button
                            size="small"
                            onClick={() => setSelectedCustomerIds([])}
                            sx={{ color: '#FFFFFF', fontWeight: 700, textTransform: 'none' }}
                        >
                            Deselect
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
                                bgcolor: '#25D366',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                px: 2.5,
                                borderRadius: 5,
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#128C7E' }
                            }}
                        >
                            Bulk Dispatch
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
                <DialogTitle sx={{ 
                    fontWeight: 800, 
                    bgcolor: 'rgba(15, 118, 110, 0.04)', 
                    borderBottom: '1px solid', 
                    borderColor: 'divider',
                    color: '#042F2E'
                }}>
                    Bulk WhatsApp Campaign Dispatch
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={5}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#042F2E' }}>
                                1. Select Campaign Template
                            </Typography>
                            <Stack spacing={1.5}>
                                {templates.map((t) => (
                                    <Box
                                        key={t.id}
                                        onClick={() => setBulkTemplate(t)}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            border: '2px solid',
                                            borderColor: bulkTemplate?.id === t.id ? '#0F766E' : 'divider',
                                            bgcolor: bulkTemplate?.id === t.id ? 'rgba(15, 118, 110, 0.06)' : 'background.paper',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
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
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#042F2E' }}>
                                2. Recipient Queue ({selectedCustomerIds.length})
                            </Typography>
                            <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, maxHeight: 380, overflow: 'auto' }}>
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
                                                        sx={{ color: '#25D366' }}
                                                    >
                                                        <WhatsApp />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemAvatar>
                                                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: '#0F766E' }}>
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
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setBulkSendDialogOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Finish Campaign
                    </Button>
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
                <DialogTitle sx={{ 
                    fontWeight: 800, 
                    bgcolor: 'rgba(15, 118, 110, 0.04)', 
                    borderBottom: '1px solid', 
                    borderColor: 'divider',
                    color: '#042F2E'
                }}>
                    {editingTemplate ? 'Edit Campaign Template' : 'Create Custom Broadcast Template'}
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Template Title *"
                            placeholder="e.g. Eid Couture Preview"
                            value={templateFormData.title}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, title: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label="WhatsApp Message *"
                            multiline
                            rows={4}
                            placeholder="Type your WhatsApp message..."
                            value={templateFormData.message}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, message: e.target.value })}
                            helperText="Pro Tip: Use emojis and personalized greetings for higher engagement."
                        />

                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                                Campaign Banner Image (Optional)
                            </Typography>

                            {!templateFormData.imageUrl ? (
                                <Box>
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="template-image-upload"
                                        type="file"
                                        onChange={handleImageUpload}
                                        disabled={isUploading}
                                    />
                                    <label htmlFor="template-image-upload">
                                        <Button
                                            variant="outlined"
                                            component="span"
                                            fullWidth
                                            disabled={isUploading}
                                            sx={{ py: 2, borderStyle: 'dashed', borderWidth: 2, borderColor: 'divider' }}
                                        >
                                            {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : '+ Upload Lookbook Image'}
                                        </Button>
                                    </label>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                        Max size: 5MB (JPG, PNG). Will be appended to the WhatsApp broadcast.
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2.5,
                                    p: 2,
                                    textAlign: 'center',
                                    bgcolor: 'background.paper',
                                    position: 'relative'
                                }}>
                                    <IconButton
                                        size="small"
                                        onClick={handleRemoveImage}
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            bgcolor: 'rgba(220, 38, 38, 0.1)',
                                            color: '#DC2626'
                                        }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                    <img
                                        src={templateFormData.imageUrl}
                                        alt="Template preview"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '180px',
                                            borderRadius: '8px',
                                            objectFit: 'contain'
                                        }}
                                    />
                                    <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1, fontWeight: 700 }}>
                                        ✓ Banner image attached
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setEditTemplateDialogOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveTemplate}
                        disabled={!templateFormData.title || !templateFormData.message}
                        sx={{
                            fontWeight: 700,
                            px: 3.5,
                            borderRadius: 2.5,
                            background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)'
                        }}
                    >
                        Save Template
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Marketing;
