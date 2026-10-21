import React, { useState, useEffect, useMemo } from 'react';
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
    Stack,
    Tabs,
    Tab,
    Tooltip,
    Divider,
    LinearProgress,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Badge,
    ToggleButtonGroup,
    ToggleButton
} from '@mui/material';
import {
    WhatsApp,
    Search,
    Group,
    Warning,
    Celebration,
    Edit,
    Delete,
    Add,
    Campaign,
    ContentCopy,
    Stars,
    Cake,
    CheckCircle,
    Chat,
    Person,
    DoneAll,
    Diamond,
    GridView,
    ViewList,
    CalendarMonth,
    History,
    ShoppingBag,
    AutoAwesome,
    Close,
    PlayArrow
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import ClienteleNavTabs from '../components/crm/ClienteleNavTabs';

// Utility for sentence-casing customer names
const toSentenceCase = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Preset Festive & Couture Broadcasts
const PRESET_BROADCASTS = [
    {
        title: '🌙 Haute Eid Couture Exclusive',
        category: 'festive',
        color: '#0F766E',
        message: 'Eid Mubarak {customer_name}! 🌙 Celebrate in bespoke luxury with our hand-embroidered shararas, anarkalis, and raw silk sarees. Visit {store_name} this week to explore private festive preview privileges!'
    },
    {
        title: '✨ Royal Festive & Bridal Splendour',
        category: 'bridal',
        color: '#D97706',
        message: 'Dear {customer_name}, step into timeless glamour. Our Royal Wedding & Bridal Couture collection is now open for private atelier fittings at {store_name}. Reserve your bespoke consultation slot today!'
    },
    {
        title: '🎁 VIP Loyalty Privileges & Rewards',
        category: 'vip',
        color: '#B45309',
        message: 'Hello {customer_name}! As an esteemed VIP patron of {store_name}, you have {loyalty_points} loyalty credits ready to redeem. Indulge in our new arrivals and enjoy your exclusive atelier privileges.'
    },
    {
        title: '👗 Seasonal Trunk Show & Arrivals',
        category: 'arrivals',
        color: '#2563EB',
        message: 'Greetings {customer_name}! Fresh weaves and artisan silhouettes just arrived at {store_name}. Early patrons receive complimentary custom sizing adjustments. We look forward to welcoming you soon!'
    }
];

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

    // Navigation & Tabs
    const [activeSubTab, setActiveSubTab] = useState(0); // 0: Broadcast Studio, 1: Templates, 2: Celebration Desk, 3: Dispatch Logs

    // Audience & Filter State
    const [search, setSearch] = useState('');
    const [selectedSegment, setSelectedSegment] = useState('all'); // all, dormant30, dormant60, vip, recent, celebrants, loyalty
    const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(12);

    // Composer & Live Preview State
    const [composerTitle, setComposerTitle] = useState('Bespoke Broadcast');
    const [composerMessage, setComposerMessage] = useState('');
    const [composerImage, setComposerImage] = useState('');
    const [composerOfferCode, setComposerOfferCode] = useState('HAUTE20');
    const [activeCustomerForPreview, setActiveCustomerForPreview] = useState(null);

    // Template Management
    const [templateFilterCategory, setTemplateFilterCategory] = useState('all');
    const [editTemplateDialogOpen, setEditTemplateDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [templateFormData, setTemplateFormData] = useState({
        title: '',
        message: '',
        color: '#0F766E',
        category: 'festive',
        imageUrl: ''
    });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Bulk Dispatch Queue State
    const [bulkQueueOpen, setBulkQueueOpen] = useState(false);
    const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
    const [dispatchedIds, setDispatchedIds] = useState([]);

    // Dispatch History (Saved locally for session & audit)
    const [dispatchHistory, setDispatchHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('atelier_marketing_dispatches');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [copiedAlert, setCopiedAlert] = useState(false);

    // Initialize default templates if empty
    useEffect(() => {
        if (marketingTemplates.length === 0) {
            const defaults = [
                {
                    title: 'Haute Festive Preview',
                    message: `Celebrate the festive season in bespoke elegance! Enjoy 20% privilege on curated designer sarees at ${profile?.businessName || 'Aleen Haute Couture'}. Schedule your private atelier fitting today!`,
                    color: '#0F766E',
                    category: 'festive',
                    imageUrl: ''
                },
                {
                    title: 'New Bridal & Couture Collection',
                    message: `Our new seasonal couture collection has arrived! 🌸 Explore the finest silk weaves and handcrafted embroidery at ${profile?.businessName || 'Aleen Haute Couture'}. Early patrons receive an exclusive styling consultation!`,
                    color: '#D97706',
                    category: 'bridal',
                    imageUrl: ''
                },
                {
                    title: 'Seasonal Boutique Privileges',
                    message: `Exclusive end-of-season designer privileges starting now! Up to 40% off on select couture pieces at ${profile?.businessName || 'Aleen Haute Couture'}. Don't miss out on these limited atelier creations!`,
                    color: '#B45309',
                    category: 'sale',
                    imageUrl: ''
                }
            ];
            defaults.forEach(async (t) => await addMarketingTemplate(t));
        }
    }, [marketingTemplates.length, profile?.businessName, addMarketingTemplate]);

    // Save dispatch history
    const recordDispatch = (customer, templateTitle, finalMessage) => {
        const newEntry = {
            id: Date.now() + Math.random().toString(36).substr(2, 4),
            customerId: customer.id,
            customerName: customer.name,
            phone: customer.phone,
            templateTitle: templateTitle || 'Direct Broadcast',
            message: finalMessage,
            timestamp: new Date().toISOString(),
            status: 'Sent via WhatsApp'
        };
        const updated = [newEntry, ...dispatchHistory].slice(0, 100);
        setDispatchHistory(updated);
        try {
            localStorage.setItem('atelier_marketing_dispatches', JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save history', e);
        }
    };

    // Calculate customer intelligence map (total spent, visit count, last visit date, days dormant)
    const customerStats = useMemo(() => {
        const today = new Date();
        const stats = {};

        customers.forEach(cust => {
            const customerInvoices = invoices.filter(
                inv => inv.customerId === cust.id || inv.phone === cust.phone || inv.customer === cust.name
            );

            const totalSpent = customerInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
            const visitCount = customerInvoices.length;

            let lastVisitDate = null;
            let daysDormant = 999;

            if (customerInvoices.length > 0) {
                const dates = customerInvoices.map(inv => new Date(inv.date)).filter(d => !isNaN(d));
                if (dates.length > 0) {
                    lastVisitDate = new Date(Math.max(...dates));
                    const diffTime = Math.abs(today - lastVisitDate);
                    daysDormant = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                }
            }

            stats[cust.id] = {
                totalSpent,
                visitCount,
                lastVisitDate,
                daysDormant,
                tier: cust.loyaltyTier || (totalSpent >= 50000 ? 'Platinum' : totalSpent >= 25000 ? 'Gold' : totalSpent >= 10000 ? 'Silver' : 'Bronze')
            };
        });

        return stats;
    }, [customers, invoices]);

    // Segment Customers
    const segmentedCustomers = useMemo(() => {
        const today = new Date();

        return customers.map(cust => {
            const stat = customerStats[cust.id] || { totalSpent: 0, visitCount: 0, daysDormant: 999, tier: 'Bronze' };
            const isBirthdayMonth = cust.dob && (new Date(cust.dob).getMonth() === today.getMonth());
            const isBirthdayToday = cust.dob && (
                new Date(cust.dob).getMonth() === today.getMonth() &&
                new Date(cust.dob).getDate() === today.getDate()
            );

            return {
                ...cust,
                displayName: toSentenceCase(cust.name),
                ...stat,
                isBirthdayMonth,
                isBirthdayToday
            };
        });
    }, [customers, customerStats]);

    // Segment Counts
    const segmentCounts = useMemo(() => {
        return {
            all: segmentedCustomers.length,
            dormant30: segmentedCustomers.filter(c => c.daysDormant >= 30 && c.daysDormant < 60).length,
            dormant60: segmentedCustomers.filter(c => c.daysDormant >= 60).length,
            vip: segmentedCustomers.filter(c => c.tier === 'Platinum' || c.tier === 'Gold' || c.totalSpent >= 25000).length,
            recent: segmentedCustomers.filter(c => c.daysDormant < 30).length,
            celebrants: segmentedCustomers.filter(c => c.isBirthdayMonth).length,
            loyalty: segmentedCustomers.filter(c => (c.loyaltyPoints || 0) >= 200).length
        };
    }, [segmentedCustomers]);

    // Filtered Customers based on Segment & Search
    const filteredPatrons = useMemo(() => {
        return segmentedCustomers.filter(c => {
            // Segment check
            if (selectedSegment === 'dormant30' && (c.daysDormant < 30 || c.daysDormant >= 60)) return false;
            if (selectedSegment === 'dormant60' && c.daysDormant < 60) return false;
            if (selectedSegment === 'vip' && !(c.tier === 'Platinum' || c.tier === 'Gold' || c.totalSpent >= 25000)) return false;
            if (selectedSegment === 'recent' && c.daysDormant >= 30) return false;
            if (selectedSegment === 'celebrants' && !c.isBirthdayMonth) return false;
            if (selectedSegment === 'loyalty' && (c.loyaltyPoints || 0) < 200) return false;

            // Search query
            if (search.trim()) {
                const q = search.toLowerCase();
                const matchName = c.name?.toLowerCase().includes(q);
                const matchPhone = c.phone?.includes(q);
                const matchTier = c.tier?.toLowerCase().includes(q);
                return matchName || matchPhone || matchTier;
            }
            return true;
        });
    }, [segmentedCustomers, selectedSegment, search]);

    // Birthday and Anniversaries
    const todayCelebrants = useMemo(() => {
        return segmentedCustomers.filter(c => c.isBirthdayToday);
    }, [segmentedCustomers]);

    const upcomingWeekCelebrants = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDate = today.getDate();

        return segmentedCustomers.filter(c => {
            if (!c.dob) return false;
            const dob = new Date(c.dob);
            if (dob.getMonth() !== currentMonth) return false;
            const diffDays = dob.getDate() - currentDate;
            return diffDays > 0 && diffDays <= 7;
        });
    }, [segmentedCustomers]);

    const monthCelebrants = useMemo(() => {
        return segmentedCustomers.filter(c => c.isBirthdayMonth && !c.isBirthdayToday);
    }, [segmentedCustomers]);

    // Merge Tags Text Replacement
    const formatPersonalizedMessage = (templateText, customer) => {
        if (!templateText) return '';
        const storeName = profile?.businessName || 'Aleen Haute Couture';
        const clientName = customer ? toSentenceCase(customer.name) : 'Valued Patron';
        const points = customer?.loyaltyPoints ?? 150;
        const tier = customer?.tier || 'VIP';

        return templateText
            .replace(/{customer_name}/gi, clientName)
            .replace(/{store_name}/gi, storeName)
            .replace(/{loyalty_points}/gi, points.toString())
            .replace(/{tier_name}/gi, tier)
            .replace(/{offer_code}/gi, composerOfferCode || 'ATELIERVIP');
    };

    // Insert Merge Tag into Composer
    const insertMergeTag = (tag) => {
        setComposerMessage(prev => prev ? `${prev} ${tag}` : tag);
    };

    // Send WhatsApp Direct Link
    const sendWhatsAppDirect = (customer, customMsg, customImg, templateTitle) => {
        const rawPhone = customer.phone.replace(/\D/g, '');
        const cleanPhone = rawPhone.startsWith('91') ? rawPhone : (rawPhone.length === 10 ? `91${rawPhone}` : rawPhone);

        const textToSend = formatPersonalizedMessage(customMsg, customer);
        let fullPayload = textToSend;
        if (customImg) {
            fullPayload += `\n\n${customImg}`;
        }

        const url = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(fullPayload)}`;
        window.open(url, '_blank');

        if (customer.id) {
            updateCustomer(customer.id, { lastReminderSent: new Date().toISOString() });
        }

        recordDispatch(customer, templateTitle || 'WhatsApp Broadcast', fullPayload);
    };

    // Image Upload Handling
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setIsUploading(true);
        const storageRef = ref(storage, `marketing_banners/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error('Upload error:', error);
                alert('Upload failed. Please check internet connection.');
                setIsUploading(false);
                setUploadProgress(0);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                if (editTemplateDialogOpen) {
                    setTemplateFormData(prev => ({ ...prev, imageUrl: downloadURL }));
                } else {
                    setComposerImage(downloadURL);
                }
                setIsUploading(false);
                setUploadProgress(0);
            }
        );
    };

    // Save Template
    const handleSaveTemplate = async () => {
        if (!templateFormData.title || !templateFormData.message) return;

        if (editingTemplate) {
            await updateMarketingTemplate(editingTemplate.id, templateFormData);
        } else {
            await addMarketingTemplate(templateFormData);
        }

        setEditTemplateDialogOpen(false);
        setEditingTemplate(null);
        setTemplateFormData({
            title: '',
            message: '',
            color: '#0F766E',
            category: 'festive',
            imageUrl: ''
        });
    };

    // Delete Template
    const handleDeleteTemplate = async (id) => {
        if (window.confirm('Delete this broadcast template from your atelier library?')) {
            const template = marketingTemplates.find(t => t.id === id);
            if (template?.imageUrl && template.imageUrl.includes('firebase')) {
                try {
                    const imageRef = ref(storage, template.imageUrl);
                    await deleteObject(imageRef);
                } catch (error) {
                    console.error('Error removing template image:', error);
                }
            }
            await deleteMarketingTemplate(id);
        }
    };

    // Copy Phone numbers for Broadcast Lists
    const handleCopySelectedNumbers = () => {
        const selectedList = customers.filter(c => selectedCustomerIds.includes(c.id));
        const numbers = selectedList.map(c => c.phone).join(', ');
        navigator.clipboard.writeText(numbers);
        setCopiedAlert(true);
        setTimeout(() => setCopiedAlert(false), 3000);
    };

    // Sequential Queue Runner
    const startBulkQueue = () => {
        if (selectedCustomerIds.length === 0) return;
        setCurrentQueueIndex(0);
        setDispatchedIds([]);
        setBulkQueueOpen(true);
    };

    const handleSendNextInQueue = () => {
        const currentCustId = selectedCustomerIds[currentQueueIndex];
        const customer = customers.find(c => c.id === currentCustId);

        if (customer) {
            sendWhatsAppDirect(customer, composerMessage, composerImage, composerTitle);
            setDispatchedIds(prev => [...prev, currentCustId]);
        }

        if (currentQueueIndex + 1 < selectedCustomerIds.length) {
            setCurrentQueueIndex(prev => prev + 1);
        }
    };

    // Selected sample customer for live preview
    const samplePreviewCustomer = activeCustomerForPreview || filteredPatrons[0] || customers[0] || {
        name: 'Fatima Al-Zahra',
        phone: '+91 98765 43210',
        loyaltyPoints: 420,
        tier: 'Platinum'
    };

    return (
        <Box sx={{ maxWidth: 1440, mx: 'auto', p: { xs: 2, md: 3.5 } }}>
            {/* Atelier Page Header */}
            <PageHeader
                title="Marketing & Atelier Broadcasts"
                subtitle="Curate omnichannel outreach, re-engage dormant patrons, and dispatch personalized WhatsApp lookbooks"
                actions={
                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="outlined"
                            startIcon={<AutoAwesome />}
                            onClick={() => {
                                setComposerTitle('Bespoke Festive Preview');
                                setComposerMessage(PRESET_BROADCASTS[0].message);
                                setActiveSubTab(0);
                            }}
                            sx={{
                                px: 2.5,
                                py: 1,
                                borderRadius: 2.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                borderColor: 'rgba(15, 118, 110, 0.3)',
                                color: '#0F766E',
                                '&:hover': {
                                    borderColor: '#0F766E',
                                    bgcolor: 'rgba(15, 118, 110, 0.04)'
                                }
                            }}
                        >
                            Instant Composer
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => {
                                setEditingTemplate(null);
                                setTemplateFormData({
                                    title: '',
                                    message: '',
                                    color: '#0F766E',
                                    category: 'festive',
                                    imageUrl: ''
                                });
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
                            New Template
                        </Button>
                    </Stack>
                }
            />

            {/* Navigation Tabs (Customers, Loyalty, Marketing) */}
            <ClienteleNavTabs />

            {/* 4 Atelier Intelligence KPIs */}
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Audience Reach"
                        value={customers.length.toLocaleString()}
                        subtitle="Total registered boutique clientele"
                        icon={<Group />}
                        trend={{ label: `${segmentCounts.recent} Active This Month`, isPositive: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Dormant Patrons"
                        value={(segmentCounts.dormant30 + segmentCounts.dormant60).toLocaleString()}
                        subtitle="No purchases in 30+ days"
                        icon={<Warning />}
                        trend={{
                            label: `${segmentCounts.dormant60} Deep Dormant (60d+)`,
                            isPositive: (segmentCounts.dormant30 + segmentCounts.dormant60) === 0
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Celebration Desk"
                        value={todayCelebrants.length.toLocaleString()}
                        subtitle="Patrons celebrating birthdays today"
                        icon={<Celebration />}
                        goldAccent={true}
                        trend={{ label: `${monthCelebrants.length} Celebrants This Month`, isPositive: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Campaign Templates"
                        value={marketingTemplates.length.toLocaleString()}
                        subtitle="Ready for 1-click WhatsApp dispatch"
                        icon={<Campaign />}
                        trend={{ label: `${dispatchHistory.length} Total Dispatches`, isPositive: true }}
                    />
                </Grid>
            </Grid>

            {/* Sub-Tabs: Navigation between Studio sections */}
            <Paper
                elevation={0}
                sx={{
                    mb: 3,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    overflow: 'hidden'
                }}
            >
                <Tabs
                    value={activeSubTab}
                    onChange={(e, val) => setActiveSubTab(val)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        px: 2,
                        minHeight: 52,
                        '& .MuiTabs-indicator': {
                            bgcolor: '#0F766E',
                            height: 3,
                            borderRadius: '3px 3px 0 0'
                        },
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 750,
                            fontSize: '0.92rem',
                            minHeight: 52,
                            color: 'text.secondary',
                            gap: 1,
                            '&.Mui-selected': {
                                color: '#0F766E',
                                fontWeight: 800
                            }
                        }
                    }}
                >
                    <Tab icon={<AutoAwesome sx={{ fontSize: '1.15rem' }} />} iconPosition="start" label="Audience Segments & Broadcast" />
                    <Tab icon={<Campaign sx={{ fontSize: '1.15rem' }} />} iconPosition="start" label={`Template Studio (${marketingTemplates.length})`} />
                    <Tab
                        icon={
                            <Badge badgeContent={todayCelebrants.length} color="warning" sx={{ '& .MuiBadge-badge': { fontWeight: 800 } }}>
                                <Cake sx={{ fontSize: '1.15rem' }} />
                            </Badge>
                        }
                        iconPosition="start"
                        label="Celebration Desk"
                    />
                    <Tab icon={<History sx={{ fontSize: '1.15rem' }} />} iconPosition="start" label={`Dispatch Log (${dispatchHistory.length})`} />
                </Tabs>
            </Paper>

            {/* ============================================================== */}
            {/* SUB-TAB 0: AUDIENCE SEGMENTS & INSTANT BROADCAST               */}
            {/* ============================================================== */}
            {activeSubTab === 0 && (
                <Grid container spacing={3}>
                    {/* Left Column: Segments, Filter, Customer Grid/Table */}
                    <Grid item xs={12} lg={7.5}>
                        {/* Segment Filter Bar */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 3.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                mb: 2.5,
                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#042F2E', letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.78rem' }}>
                                    Smart Audience Segmentation
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {filteredPatrons.length} patrons match current filter
                                </Typography>
                            </Box>

                            {/* Segment Filter Chips */}
                            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1, '::-webkit-scrollbar': { height: 4 } }}>
                                <Chip
                                    label={`All Patrons (${segmentCounts.all})`}
                                    clickable
                                    color={selectedSegment === 'all' ? 'primary' : 'default'}
                                    variant={selectedSegment === 'all' ? 'filled' : 'outlined'}
                                    onClick={() => setSelectedSegment('all')}
                                    sx={{ fontWeight: 700, borderRadius: 2 }}
                                />
                                <Chip
                                    icon={<Warning sx={{ fontSize: '1rem !important' }} />}
                                    label={`Dormant 30d+ (${segmentCounts.dormant30})`}
                                    clickable
                                    color={selectedSegment === 'dormant30' ? 'warning' : 'default'}
                                    variant={selectedSegment === 'dormant30' ? 'filled' : 'outlined'}
                                    onClick={() => setSelectedSegment('dormant30')}
                                    sx={{ fontWeight: 700, borderRadius: 2 }}
                                />
                                <Chip
                                    icon={<Warning sx={{ fontSize: '1rem !important' }} />}
                                    label={`Deep Dormant 60d+ (${segmentCounts.dormant60})`}
                                    clickable
                                    color={selectedSegment === 'dormant60' ? 'error' : 'default'}
                                    variant={selectedSegment === 'dormant60' ? 'filled' : 'outlined'}
                                    onClick={() => setSelectedSegment('dormant60')}
                                    sx={{ fontWeight: 700, borderRadius: 2 }}
                                />
                                <Chip
                                    icon={<Diamond sx={{ fontSize: '1rem !important' }} />}
                                    label={`VIP & High Spenders (${segmentCounts.vip})`}
                                    clickable
                                    color={selectedSegment === 'vip' ? 'secondary' : 'default'}
                                    variant={selectedSegment === 'vip' ? 'filled' : 'outlined'}
                                    onClick={() => setSelectedSegment('vip')}
                                    sx={{ fontWeight: 700, borderRadius: 2 }}
                                />
                                <Chip
                                    icon={<ShoppingBag sx={{ fontSize: '1rem !important' }} />}
                                    label={`Recent Shoppers (${segmentCounts.recent})`}
                                    clickable
                                    color={selectedSegment === 'recent' ? 'success' : 'default'}
                                    variant={selectedSegment === 'recent' ? 'filled' : 'outlined'}
                                    onClick={() => setSelectedSegment('recent')}
                                    sx={{ fontWeight: 700, borderRadius: 2 }}
                                />
                                <Chip
                                    icon={<Celebration sx={{ fontSize: '1rem !important' }} />}
                                    label={`Celebrants (${segmentCounts.celebrants})`}
                                    clickable
                                    color={selectedSegment === 'celebrants' ? 'warning' : 'default'}
                                    variant={selectedSegment === 'celebrants' ? 'filled' : 'outlined'}
                                    onClick={() => setSelectedSegment('celebrants')}
                                    sx={{ fontWeight: 700, borderRadius: 2 }}
                                />
                                <Chip
                                    icon={<Stars sx={{ fontSize: '1rem !important' }} />}
                                    label={`Loyalty Points (${segmentCounts.loyalty})`}
                                    clickable
                                    color={selectedSegment === 'loyalty' ? 'info' : 'default'}
                                    variant={selectedSegment === 'loyalty' ? 'filled' : 'outlined'}
                                    onClick={() => setSelectedSegment('loyalty')}
                                    sx={{ fontWeight: 700, borderRadius: 2 }}
                                />
                            </Stack>

                            <Divider sx={{ my: 2 }} />

                            {/* Search & Actions Bar */}
                            <Grid container spacing={1.5} alignItems="center">
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Search by patron name, phone, or tier..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search fontSize="small" sx={{ color: '#0F766E' }} />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2.5
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    size="small"
                                                    checked={selectedCustomerIds.length === filteredPatrons.length && filteredPatrons.length > 0}
                                                    indeterminate={selectedCustomerIds.length > 0 && selectedCustomerIds.length < filteredPatrons.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedCustomerIds(filteredPatrons.map(c => c.id));
                                                        } else {
                                                            setSelectedCustomerIds([]);
                                                        }
                                                    }}
                                                    sx={{ color: '#0F766E', '&.Mui-checked': { color: '#0F766E' } }}
                                                />
                                            }
                                            label={<Typography variant="caption" sx={{ fontWeight: 750 }}>Select All ({filteredPatrons.length})</Typography>}
                                        />

                                        <ToggleButtonGroup
                                            size="small"
                                            value={viewMode}
                                            exclusive
                                            onChange={(e, val) => val && setViewMode(val)}
                                            sx={{ height: 36 }}
                                        >
                                            <ToggleButton value="cards" aria-label="cards">
                                                <GridView fontSize="small" />
                                            </ToggleButton>
                                            <ToggleButton value="table" aria-label="table">
                                                <ViewList fontSize="small" />
                                            </ToggleButton>
                                        </ToggleButtonGroup>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Customer List Display (Cards or Table) */}
                        {filteredPatrons.length === 0 ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 6,
                                    borderRadius: 3.5,
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                    textAlign: 'center',
                                    bgcolor: 'background.paper'
                                }}
                            >
                                <Group sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                    No Patrons Found in Current Segment
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mt: 0.5 }}>
                                    Try clearing your search query or selecting a different segment pill above.
                                </Typography>
                            </Paper>
                        ) : viewMode === 'cards' ? (
                            <Grid container spacing={2}>
                                {filteredPatrons
                                    .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                                    .map((customer) => {
                                        const isSelected = selectedCustomerIds.includes(customer.id);
                                        const isPreviewActive = samplePreviewCustomer?.id === customer.id;

                                        return (
                                            <Grid item xs={12} sm={6} key={customer.id}>
                                                <Card
                                                    elevation={0}
                                                    sx={{
                                                        borderRadius: 3,
                                                        border: '1.5px solid',
                                                        borderColor: isPreviewActive ? '#0F766E' : isSelected ? 'rgba(15, 118, 110, 0.4)' : 'divider',
                                                        bgcolor: isPreviewActive ? 'rgba(15, 118, 110, 0.03)' : 'background.paper',
                                                        transition: 'all 0.2s',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        '&:hover': {
                                                            borderColor: '#0F766E',
                                                            boxShadow: '0 4px 16px rgba(15, 118, 110, 0.08)',
                                                            transform: 'translateY(-2px)'
                                                        }
                                                    }}
                                                >
                                                    <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                                                <Checkbox
                                                                    size="small"
                                                                    checked={isSelected}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedCustomerIds(prev => [...prev, customer.id]);
                                                                        } else {
                                                                            setSelectedCustomerIds(prev => prev.filter(id => id !== customer.id));
                                                                        }
                                                                    }}
                                                                    sx={{ p: 0.25, color: '#0F766E', '&.Mui-checked': { color: '#0F766E' } }}
                                                                />
                                                                <Avatar
                                                                    sx={{
                                                                        width: 36,
                                                                        height: 36,
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: 800,
                                                                        bgcolor: customer.tier === 'Platinum' ? '#042F2E' : customer.tier === 'Gold' ? '#D97706' : '#0F766E',
                                                                        color: '#ffffff'
                                                                    }}
                                                                >
                                                                    {customer.displayName[0]}
                                                                </Avatar>
                                                                <Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#042F2E', lineHeight: 1.2 }}>
                                                                        {customer.displayName}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {customer.phone}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>

                                                            <Chip
                                                                size="small"
                                                                label={customer.tier}
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 800,
                                                                    bgcolor: customer.tier === 'Platinum' ? 'rgba(4, 47, 46, 0.1)' : customer.tier === 'Gold' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(15, 118, 110, 0.1)',
                                                                    color: customer.tier === 'Platinum' ? '#042F2E' : customer.tier === 'Gold' ? '#B45309' : '#0F766E'
                                                                }}
                                                            />
                                                        </Box>

                                                        {/* Patron Metrics Snapshot */}
                                                        <Box
                                                            sx={{
                                                                display: 'grid',
                                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                                gap: 1,
                                                                p: 1.25,
                                                                borderRadius: 2,
                                                                bgcolor: 'rgba(0,0,0,0.02)',
                                                                border: '1px solid rgba(0,0,0,0.04)',
                                                                mb: 1.5,
                                                                textAlign: 'center'
                                                            }}
                                                        >
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                                                                    Spend
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                                                    ₹{(customer.totalSpent || 0).toLocaleString()}
                                                                </Typography>
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                                                                    Last Visit
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ fontWeight: 800, color: customer.daysDormant > 30 ? '#D97706' : 'text.primary' }}>
                                                                    {customer.daysDormant === 999 ? 'Never' : `${customer.daysDormant}d ago`}
                                                                </Typography>
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                                                                    Credits
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669' }}>
                                                                    {customer.loyaltyPoints || 0} pts
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        {/* Bottom Row Actions */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.5 }}>
                                                            <Button
                                                                size="small"
                                                                onClick={() => setActiveCustomerForPreview(customer)}
                                                                sx={{
                                                                    textTransform: 'none',
                                                                    fontWeight: 700,
                                                                    fontSize: '0.72rem',
                                                                    color: isPreviewActive ? '#0F766E' : 'text.secondary',
                                                                    p: 0
                                                                }}
                                                            >
                                                                {isPreviewActive ? '● Previewing in Phone' : 'Preview Live'}
                                                            </Button>

                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                startIcon={<WhatsApp sx={{ fontSize: '1rem !important' }} />}
                                                                onClick={() => {
                                                                    const msg = composerMessage || PRESET_BROADCASTS[0].message;
                                                                    sendWhatsAppDirect(customer, msg, composerImage, composerTitle);
                                                                }}
                                                                sx={{
                                                                    bgcolor: '#25D366',
                                                                    '&:hover': { bgcolor: '#128C7E' },
                                                                    borderRadius: 2,
                                                                    fontWeight: 750,
                                                                    fontSize: '0.75rem',
                                                                    textTransform: 'none',
                                                                    px: 1.5,
                                                                    py: 0.5
                                                                }}
                                                            >
                                                                {customer.lastReminderSent ? 'Resend' : 'Broadcast'}
                                                            </Button>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                            </Grid>
                        ) : (
                            <TableContainer
                                component={Paper}
                                elevation={0}
                                sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
                            >
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: 'rgba(15, 118, 110, 0.04)' }}>
                                        <TableRow>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    size="small"
                                                    checked={selectedCustomerIds.length === filteredPatrons.length && filteredPatrons.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedCustomerIds(filteredPatrons.map(c => c.id));
                                                        } else {
                                                            setSelectedCustomerIds([]);
                                                        }
                                                    }}
                                                    sx={{ color: '#0F766E', '&.Mui-checked': { color: '#0F766E' } }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Patron Details</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Tier</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Total Spent</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Dormancy</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Loyalty</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800 }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredPatrons
                                            .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                                            .map((customer) => {
                                                const isSelected = selectedCustomerIds.includes(customer.id);
                                                return (
                                                    <TableRow
                                                        key={customer.id}
                                                        hover
                                                        selected={isSelected}
                                                        sx={{ cursor: 'pointer' }}
                                                    >
                                                        <TableCell padding="checkbox">
                                                            <Checkbox
                                                                size="small"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedCustomerIds(prev => [...prev, customer.id]);
                                                                    } else {
                                                                        setSelectedCustomerIds(prev => prev.filter(id => id !== customer.id));
                                                                    }
                                                                }}
                                                                sx={{ color: '#0F766E', '&.Mui-checked': { color: '#0F766E' } }}
                                                            />
                                                        </TableCell>
                                                        <TableCell onClick={() => setActiveCustomerForPreview(customer)}>
                                                            <Typography variant="body2" sx={{ fontWeight: 750, color: '#042F2E' }}>
                                                                {customer.displayName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {customer.phone}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={customer.tier}
                                                                size="small"
                                                                sx={{
                                                                    fontWeight: 800,
                                                                    fontSize: '0.65rem',
                                                                    bgcolor: customer.tier === 'Platinum' ? 'rgba(4, 47, 46, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                                                                    color: customer.tier === 'Platinum' ? '#042F2E' : '#B45309'
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>
                                                            ₹{(customer.totalSpent || 0).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="caption" sx={{ fontWeight: 700, color: customer.daysDormant > 30 ? '#D97706' : 'text.secondary' }}>
                                                                {customer.daysDormant === 999 ? 'No orders' : `${customer.daysDormant} days ago`}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 700, color: '#059669' }}>
                                                            {customer.loyaltyPoints || 0} pts
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                startIcon={<WhatsApp />}
                                                                onClick={() => {
                                                                    const msg = composerMessage || PRESET_BROADCASTS[0].message;
                                                                    sendWhatsAppDirect(customer, msg, composerImage, composerTitle);
                                                                }}
                                                                sx={{
                                                                    bgcolor: '#25D366',
                                                                    '&:hover': { bgcolor: '#128C7E' },
                                                                    fontWeight: 750,
                                                                    fontSize: '0.72rem',
                                                                    borderRadius: 2,
                                                                    textTransform: 'none'
                                                                }}
                                                            >
                                                                Send
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {/* Pagination */}
                        <Box sx={{ mt: 2 }}>
                            <TablePagination
                                component="div"
                                count={filteredPatrons.length}
                                page={page}
                                onPageChange={(e, p) => setPage(p)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10));
                                    setPage(0);
                                }}
                                rowsPerPageOptions={[6, 12, 24, 48]}
                            />
                        </Box>
                    </Grid>

                    {/* Right Column: Live Smartphone WhatsApp Mockup & Quick Composer */}
                    <Grid item xs={12} lg={4.5}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 4,
                                border: '1px solid',
                                borderColor: 'divider',
                                position: 'sticky',
                                top: 88,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chat sx={{ color: '#0F766E' }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                        Live WhatsApp Preview
                                    </Typography>
                                </Box>
                                <Chip
                                    size="small"
                                    icon={<Person sx={{ fontSize: '0.9rem !important' }} />}
                                    label={toSentenceCase(samplePreviewCustomer.name).split(' ')[0]}
                                    sx={{ fontWeight: 750, bgcolor: 'rgba(15, 118, 110, 0.08)', color: '#0F766E' }}
                                />
                            </Box>

                            {/* Preset Quick Loaders */}
                            <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.secondary', display: 'block', mb: 1 }}>
                                Quick Load Preset Campaign:
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1.5, '::-webkit-scrollbar': { height: 4 } }}>
                                {PRESET_BROADCASTS.map((preset, idx) => (
                                    <Chip
                                        key={idx}
                                        label={preset.title.split(' ')[1] || preset.title}
                                        size="small"
                                        clickable
                                        onClick={() => {
                                            setComposerTitle(preset.title);
                                            setComposerMessage(preset.message);
                                        }}
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.72rem',
                                            bgcolor: 'rgba(15, 118, 110, 0.06)',
                                            color: '#0F766E',
                                            '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.15)' }
                                        }}
                                    />
                                ))}
                            </Stack>

                            {/* SMARTPHONE DEVICE CONTAINER */}
                            <Box
                                sx={{
                                    mx: 'auto',
                                    maxWidth: 340,
                                    borderRadius: '36px',
                                    border: '10px solid #1F2937',
                                    boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
                                    overflow: 'hidden',
                                    bgcolor: '#EFEAE2',
                                    position: 'relative'
                                }}
                            >
                                {/* Phone Top Notch */}
                                <Box sx={{ height: 18, bgcolor: '#1F2937', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Box sx={{ width: 60, height: 4, borderRadius: 2, bgcolor: '#374151' }} />
                                </Box>

                                {/* WhatsApp Green Header */}
                                <Box
                                    sx={{
                                        bgcolor: '#075E54',
                                        color: '#ffffff',
                                        p: '10px 14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: '#128C7E',
                                            fontSize: '0.8rem',
                                            fontWeight: 800,
                                            border: '1.5px solid #ffffff'
                                        }}
                                    >
                                        {(profile?.businessName || 'A')[0]}
                                    </Avatar>
                                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                            {profile?.businessName || 'Aleen Haute Couture'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.65rem' }}>
                                            online • verified atelier
                                        </Typography>
                                    </Box>
                                    <WhatsApp sx={{ color: '#25D366', fontSize: 20 }} />
                                </Box>

                                {/* WhatsApp Chat Screen Area */}
                                <Box
                                    sx={{
                                        minHeight: 260,
                                        maxHeight: 320,
                                        p: 1.5,
                                        overflowY: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-start',
                                        backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
                                        backgroundSize: '16px 16px'
                                    }}
                                >
                                    {/* Date separator */}
                                    <Box sx={{ textAlign: 'center', my: 1 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                bgcolor: 'rgba(255,255,255,0.85)',
                                                px: 1.25,
                                                py: 0.25,
                                                borderRadius: 1.5,
                                                fontSize: '0.62rem',
                                                fontWeight: 700,
                                                color: '#4B5563',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                                            }}
                                        >
                                            TODAY
                                        </Typography>
                                    </Box>

                                    {/* WhatsApp Chat Bubble */}
                                    <Box
                                        sx={{
                                            maxWidth: '92%',
                                            alignSelf: 'flex-start',
                                            bgcolor: '#FFFFFF',
                                            borderRadius: '12px 12px 12px 2px',
                                            p: 1.5,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                            position: 'relative'
                                        }}
                                    >
                                        {/* Lookbook Image Banner if attached */}
                                        {composerImage && (
                                            <Box sx={{ mb: 1, borderRadius: 1.5, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                                                <img
                                                    src={composerImage}
                                                    alt="Lookbook Campaign"
                                                    style={{ width: '100%', maxHeight: 140, objectFit: 'cover', display: 'block' }}
                                                />
                                            </Box>
                                        )}

                                        {/* Formatted Message */}
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: '#111827',
                                                fontSize: '0.8rem',
                                                lineHeight: 1.4,
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word'
                                            }}
                                        >
                                            {formatPersonalizedMessage(
                                                composerMessage || PRESET_BROADCASTS[0].message,
                                                samplePreviewCustomer
                                            )}
                                        </Typography>

                                        {/* Timestamp & Read ticks */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.75 }}>
                                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#9CA3AF' }}>
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                            <DoneAll sx={{ fontSize: 13, color: '#3B82F6' }} />
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Phone Bottom Bar */}
                                <Box sx={{ height: 16, bgcolor: '#FFFFFF', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Box sx={{ width: 100, height: 3, borderRadius: 2, bgcolor: '#D1D5DB' }} />
                                </Box>
                            </Box>

                            {/* Dynamic Merge Tag Inserters */}
                            <Box sx={{ mt: 2.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                                    Dynamic Personalization Tags:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                    <Chip
                                        size="small"
                                        label="+ {customer_name}"
                                        onClick={() => insertMergeTag('{customer_name}')}
                                        sx={{ fontSize: '0.7rem', fontWeight: 750, cursor: 'pointer' }}
                                    />
                                    <Chip
                                        size="small"
                                        label="+ {store_name}"
                                        onClick={() => insertMergeTag('{store_name}')}
                                        sx={{ fontSize: '0.7rem', fontWeight: 750, cursor: 'pointer' }}
                                    />
                                    <Chip
                                        size="small"
                                        label="+ {loyalty_points}"
                                        onClick={() => insertMergeTag('{loyalty_points}')}
                                        sx={{ fontSize: '0.7rem', fontWeight: 750, cursor: 'pointer' }}
                                    />
                                    <Chip
                                        size="small"
                                        label="+ {tier_name}"
                                        onClick={() => insertMergeTag('{tier_name}')}
                                        sx={{ fontSize: '0.7rem', fontWeight: 750, cursor: 'pointer' }}
                                    />
                                    <Chip
                                        size="small"
                                        label="+ {offer_code}"
                                        onClick={() => insertMergeTag('{offer_code}')}
                                        sx={{ fontSize: '0.7rem', fontWeight: 750, cursor: 'pointer', bgcolor: 'rgba(217, 119, 6, 0.1)', color: '#B45309' }}
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                                        Offer Code:
                                    </Typography>
                                    <TextField
                                        size="small"
                                        value={composerOfferCode}
                                        onChange={(e) => setComposerOfferCode(e.target.value.toUpperCase())}
                                        placeholder="e.g. HAUTE20"
                                        sx={{
                                            maxWidth: 130,
                                            '& .MuiOutlinedInput-input': {
                                                py: 0.5,
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                letterSpacing: '0.05em'
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>

                            {/* Message Input in Preview Sidebar */}
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                size="small"
                                placeholder="Edit broadcast message here..."
                                value={composerMessage}
                                onChange={(e) => setComposerMessage(e.target.value)}
                                sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            />

                            {/* Direct Broadcast to Current Patron */}
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<WhatsApp />}
                                onClick={() => {
                                    sendWhatsAppDirect(
                                        samplePreviewCustomer,
                                        composerMessage || PRESET_BROADCASTS[0].message,
                                        composerImage,
                                        composerTitle
                                    );
                                }}
                                sx={{
                                    mt: 2,
                                    py: 1.2,
                                    borderRadius: 2.5,
                                    fontWeight: 800,
                                    bgcolor: '#25D366',
                                    color: '#FFFFFF',
                                    textTransform: 'none',
                                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                                    '&:hover': { bgcolor: '#128C7E' }
                                }}
                            >
                                Dispatch To {toSentenceCase(samplePreviewCustomer.name).split(' ')[0]}
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* ============================================================== */}
            {/* SUB-TAB 1: CAMPAIGN TEMPLATES & STUDIO                         */}
            {/* ============================================================== */}
            {activeSubTab === 1 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {['all', 'festive', 'bridal', 'sale', 'vip', 'arrivals'].map((cat) => (
                                <Chip
                                    key={cat}
                                    label={cat.toUpperCase()}
                                    clickable
                                    color={templateFilterCategory === cat ? 'primary' : 'default'}
                                    variant={templateFilterCategory === cat ? 'filled' : 'outlined'}
                                    onClick={() => setTemplateFilterCategory(cat)}
                                    sx={{ fontWeight: 800, fontSize: '0.75rem', borderRadius: 2 }}
                                />
                            ))}
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => {
                                setEditingTemplate(null);
                                setTemplateFormData({
                                    title: '',
                                    message: '',
                                    color: '#0F766E',
                                    category: 'festive',
                                    imageUrl: ''
                                });
                                setEditTemplateDialogOpen(true);
                            }}
                            sx={{
                                borderRadius: 2.5,
                                fontWeight: 750,
                                textTransform: 'none',
                                bgcolor: '#0F766E',
                                '&:hover': { bgcolor: '#042F2E' }
                            }}
                        >
                            + Create Custom Template
                        </Button>
                    </Box>

                    <Grid container spacing={3}>
                        {marketingTemplates
                            .filter(t => templateFilterCategory === 'all' || (t.category || t.type) === templateFilterCategory)
                            .map((template) => (
                                <Grid item xs={12} sm={6} md={4} key={template.id}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3,
                                            borderRadius: 3.5,
                                            border: '1.5px solid',
                                            borderColor: 'divider',
                                            bgcolor: 'background.paper',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            height: '100%',
                                            position: 'relative',
                                            transition: 'all 0.22s',
                                            '&:hover': {
                                                borderColor: '#0F766E',
                                                transform: 'translateY(-3px)',
                                                boxShadow: '0 8px 24px rgba(15, 118, 110, 0.08)'
                                            }
                                        }}
                                    >
                                        {/* Lookbook banner image thumbnail if present */}
                                        {template.imageUrl && (
                                            <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', height: 120, border: '1px solid divider' }}>
                                                <img
                                                    src={template.imageUrl}
                                                    alt={template.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </Box>
                                        )}

                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: template.color || '#0F766E' }} />
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                                    {template.title}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                size="small"
                                                label={template.category || template.type || 'Campaign'}
                                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}
                                            />
                                        </Box>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                flex: 1,
                                                mb: 2.5,
                                                lineHeight: 1.5,
                                                fontStyle: 'italic',
                                                bgcolor: 'rgba(0,0,0,0.02)',
                                                p: 1.5,
                                                borderRadius: 2
                                            }}
                                        >
                                            "{template.message}"
                                        </Typography>

                                        {/* Template Actions */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setEditingTemplate(template);
                                                        setTemplateFormData({
                                                            title: template.title,
                                                            message: template.message,
                                                            color: template.color || '#0F766E',
                                                            category: template.category || template.type || 'festive',
                                                            imageUrl: template.imageUrl || ''
                                                        });
                                                        setEditTemplateDialogOpen(true);
                                                    }}
                                                >
                                                    <Edit fontSize="small" sx={{ fontSize: 18 }} />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                >
                                                    <Delete fontSize="small" sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Box>

                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<WhatsApp />}
                                                onClick={() => {
                                                    setComposerTitle(template.title);
                                                    setComposerMessage(template.message);
                                                    setComposerImage(template.imageUrl || '');
                                                    setActiveSubTab(0);
                                                }}
                                                sx={{
                                                    bgcolor: '#0F766E',
                                                    '&:hover': { bgcolor: '#042F2E' },
                                                    borderRadius: 2,
                                                    fontWeight: 750,
                                                    fontSize: '0.75rem',
                                                    textTransform: 'none'
                                                }}
                                            >
                                                Use in Studio
                                            </Button>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                    </Grid>
                </Box>
            )}

            {/* ============================================================== */}
            {/* SUB-TAB 2: CELEBRATION DESK (BIRTHDAYS & ANNIVERSARIES)        */}
            {/* ============================================================== */}
            {activeSubTab === 2 && (
                <Grid container spacing={3}>
                    {/* Today's Celebrants Highlight */}
                    <Grid item xs={12}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3.5,
                                borderRadius: 4,
                                background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)',
                                border: '1.5px solid rgba(217, 119, 6, 0.3)',
                                mb: 2
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar sx={{ bgcolor: '#D97706', width: 44, height: 44 }}>
                                        <Celebration sx={{ color: '#ffffff' }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#92400E' }}>
                                            Today's Birthday Patrons ({todayCelebrants.length})
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Dispatch personalized birthday compliments with 100 bonus loyalty credits
                                        </Typography>
                                    </Box>
                                </Box>

                                {todayCelebrants.length > 0 && (
                                    <Button
                                        variant="contained"
                                        startIcon={<WhatsApp />}
                                        onClick={() => {
                                            todayCelebrants.forEach(c => {
                                                const msg = `Happy Birthday ${c.displayName}! 🎉 Warmest wishes from the team at ${profile?.businessName || 'Aleen Haute Couture'}. As a celebration gift, please enjoy 100 bonus loyalty credits and 10% off your next atelier fitting!`;
                                                sendWhatsAppDirect(c, msg, '', 'Birthday Greeting');
                                            });
                                        }}
                                        sx={{
                                            bgcolor: '#D97706',
                                            '&:hover': { bgcolor: '#B45309' },
                                            fontWeight: 800,
                                            borderRadius: 2.5,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Dispatch to All ({todayCelebrants.length})
                                    </Button>
                                )}
                            </Box>

                            {todayCelebrants.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Cake sx={{ fontSize: 44, color: '#D97706', opacity: 0.4, mb: 1 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                        No client birthdays recorded for today. Look below for upcoming celebrations this week!
                                    </Typography>
                                </Box>
                            ) : (
                                <Grid container spacing={2}>
                                    {todayCelebrants.map(customer => (
                                        <Grid item xs={12} sm={6} md={4} key={customer.id}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 3,
                                                    bgcolor: '#FFFFFF',
                                                    border: '1px solid rgba(217, 119, 6, 0.25)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ bgcolor: '#D97706', width: 38, height: 38, fontWeight: 800 }}>
                                                        {customer.displayName[0]}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{customer.displayName}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{customer.phone}</Typography>
                                                    </Box>
                                                </Box>

                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<WhatsApp />}
                                                    onClick={() => {
                                                        const msg = `Happy Birthday ${customer.displayName}! 🎉 Warmest wishes from ${profile?.businessName || 'Aleen Haute Couture'}. As our birthday gift, please enjoy 100 bonus loyalty credits on your next bespoke visit!`;
                                                        sendWhatsAppDirect(customer, msg, '', 'Birthday Greeting');
                                                    }}
                                                    sx={{
                                                        bgcolor: '#25D366',
                                                        '&:hover': { bgcolor: '#128C7E' },
                                                        borderRadius: 2,
                                                        fontWeight: 750,
                                                        fontSize: '0.72rem',
                                                        textTransform: 'none'
                                                    }}
                                                >
                                                    Wish
                                                </Button>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Paper>
                    </Grid>

                    {/* Upcoming Celebrations (Next 7 Days) */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <CalendarMonth sx={{ color: '#0F766E' }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                    Upcoming in Next 7 Days ({upcomingWeekCelebrants.length})
                                </Typography>
                            </Box>
                            <List sx={{ p: 0 }}>
                                {upcomingWeekCelebrants.map(c => (
                                    <ListItem
                                        key={c.id}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2.5,
                                            mb: 1,
                                            p: 1.5
                                        }}
                                        secondaryAction={
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const msg = `Hello ${c.displayName}! Warm early birthday greetings from ${profile?.businessName || 'Aleen Haute Couture'}. We would love to prepare a special bespoke fitting for your upcoming celebration!`;
                                                    sendWhatsAppDirect(c, msg, '', 'Early Birthday Note');
                                                }}
                                                sx={{ color: '#25D366' }}
                                            >
                                                <WhatsApp />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: '#0F766E', fontSize: '0.8rem', fontWeight: 800 }}>
                                                {c.displayName[0]}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography variant="body2" sx={{ fontWeight: 750 }}>{c.displayName}</Typography>}
                                            secondary={`Birthday: ${new Date(c.dob).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} • ${c.phone}`}
                                        />
                                    </ListItem>
                                ))}
                                {upcomingWeekCelebrants.length === 0 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                                        No birthdays scheduled in the upcoming week.
                                    </Typography>
                                )}
                            </List>
                        </Paper>
                    </Grid>

                    {/* Celebrants This Month */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Cake sx={{ color: '#D97706' }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                    All Celebrants This Month ({monthCelebrants.length})
                                </Typography>
                            </Box>
                            <List sx={{ p: 0, maxHeight: 380, overflowY: 'auto' }}>
                                {monthCelebrants.map(c => (
                                    <ListItem
                                        key={c.id}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2.5,
                                            mb: 1,
                                            p: 1.5
                                        }}
                                        secondaryAction={
                                            <Button
                                                size="small"
                                                startIcon={<WhatsApp />}
                                                onClick={() => {
                                                    const msg = `Warm greetings ${c.displayName}! We celebrate your special month at ${profile?.businessName || 'Aleen Haute Couture'}. Book your private styling appointment and enjoy bespoke privileges!`;
                                                    sendWhatsAppDirect(c, msg, '', 'Month Birthday Note');
                                                }}
                                                sx={{
                                                    color: '#25D366',
                                                    fontWeight: 750,
                                                    fontSize: '0.72rem',
                                                    textTransform: 'none'
                                                }}
                                            >
                                                Message
                                            </Button>
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: '#D97706', fontSize: '0.8rem', fontWeight: 800 }}>
                                                {c.displayName[0]}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography variant="body2" sx={{ fontWeight: 750 }}>{c.displayName}</Typography>}
                                            secondary={`Birthday: ${new Date(c.dob).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} • ${c.phone}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* ============================================================== */}
            {/* SUB-TAB 3: DISPATCH AUDIT & LOGS                               */}
            {/* ============================================================== */}
            {activeSubTab === 3 && (
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                Broadcast Dispatch Audit Trail
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                History of WhatsApp campaigns dispatched during your atelier sessions
                            </Typography>
                        </Box>
                        {dispatchHistory.length > 0 && (
                            <Button
                                size="small"
                                color="error"
                                onClick={() => {
                                    if (window.confirm('Clear dispatch history?')) {
                                        setDispatchHistory([]);
                                        localStorage.removeItem('atelier_marketing_dispatches');
                                    }
                                }}
                                sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
                                Clear History
                            </Button>
                        )}
                    </Box>

                    {dispatchHistory.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                            <History sx={{ fontSize: 44, opacity: 0.4, mb: 1 }} />
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                No campaign broadcasts dispatched yet. Send your first broadcast from the Studio tab!
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: 'rgba(15, 118, 110, 0.04)' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800 }}>Dispatched Time</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Patron</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Mobile Number</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Campaign / Template</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Channel</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dispatchHistory.map(entry => (
                                        <TableRow key={entry.id} hover>
                                            <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                                {new Date(entry.timestamp).toLocaleString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 750, color: '#042F2E' }}>
                                                {toSentenceCase(entry.customerName)}
                                            </TableCell>
                                            <TableCell>{entry.phone}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={entry.templateTitle}
                                                    size="small"
                                                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={<WhatsApp sx={{ fontSize: '1rem !important' }} />}
                                                    label="WhatsApp"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(37, 211, 102, 0.1)',
                                                        color: '#128C7E',
                                                        fontWeight: 800,
                                                        fontSize: '0.7rem'
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            )}

            {/* ============================================================== */}
            {/* FLOATING ACTION BAR: WHEN PATRONS ARE SELECTED                 */}
            {/* ============================================================== */}
            {selectedCustomerIds.length > 0 && (
                <Paper
                    elevation={10}
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
                        gap: 2.5,
                        minWidth: { xs: '92%', sm: 540 },
                        justifyContent: 'space-between',
                        boxShadow: '0 16px 40px rgba(4, 47, 46, 0.5)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip
                            label={`${selectedCustomerIds.length} Selected`}
                            size="small"
                            sx={{ bgcolor: '#0F766E', color: '#FFFFFF', fontWeight: 800 }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
                            Audience Broadcast Queue
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Copy phone list for WhatsApp Broadcast lists">
                            <Button
                                size="small"
                                startIcon={<ContentCopy sx={{ fontSize: 16 }} />}
                                onClick={handleCopySelectedNumbers}
                                sx={{ color: '#FFFFFF', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                            >
                                {copiedAlert ? 'Copied!' : 'Copy Numbers'}
                            </Button>
                        </Tooltip>

                        <Button
                            size="small"
                            onClick={() => setSelectedCustomerIds([])}
                            sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                        >
                            Deselect
                        </Button>

                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<PlayArrow />}
                            onClick={startBulkQueue}
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
                            Launch Queue
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* ============================================================== */}
            {/* BULK DISPATCH SEQUENTIAL QUEUE DIALOG                          */}
            {/* ============================================================== */}
            <Dialog
                open={bulkQueueOpen}
                onClose={() => setBulkQueueOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 800,
                        bgcolor: 'rgba(15, 118, 110, 0.05)',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        color: '#042F2E',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WhatsApp sx={{ color: '#25D366' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            Sequential Broadcast Dispatch
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setBulkQueueOpen(false)}>
                        <Close fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                Progress: {currentQueueIndex + 1} of {selectedCustomerIds.length} Patrons
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800 }}>
                                {dispatchedIds.length} Sent
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={((currentQueueIndex + 1) / selectedCustomerIds.length) * 100}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: 'rgba(15, 118, 110, 0.1)',
                                '& .MuiLinearProgress-bar': { bgcolor: '#0F766E' }
                            }}
                        />
                    </Box>

                    {/* Current Recipient Card */}
                    {(() => {
                        const currentId = selectedCustomerIds[currentQueueIndex];
                        const customer = customers.find(c => c.id === currentId);
                        if (!customer) return null;

                        const isAlreadyDispatched = dispatchedIds.includes(currentId);

                        return (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    border: '1.5px solid',
                                    borderColor: isAlreadyDispatched ? '#059669' : '#0F766E',
                                    bgcolor: isAlreadyDispatched ? 'rgba(5, 150, 105, 0.03)' : 'rgba(15, 118, 110, 0.03)',
                                    mb: 2.5
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ bgcolor: '#0F766E', fontWeight: 800 }}>
                                            {customer.name[0]}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                                {toSentenceCase(customer.name)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {customer.phone}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    {isAlreadyDispatched ? (
                                        <Chip icon={<CheckCircle sx={{ fontSize: '1rem !important' }} />} label="Sent" size="small" color="success" />
                                    ) : (
                                        <Chip label="Next in Queue" size="small" sx={{ bgcolor: '#0F766E', color: '#fff', fontWeight: 700 }} />
                                    )}
                                </Box>

                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                    Personalized Message:
                                </Typography>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: '#FFFFFF',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        fontSize: '0.8rem',
                                        whiteSpace: 'pre-wrap'
                                    }}
                                >
                                    {formatPersonalizedMessage(composerMessage || PRESET_BROADCASTS[0].message, customer)}
                                </Paper>
                            </Paper>
                        );
                    })()}
                </DialogContent>

                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
                    <Button
                        size="small"
                        onClick={() => {
                            if (currentQueueIndex + 1 < selectedCustomerIds.length) {
                                setCurrentQueueIndex(prev => prev + 1);
                            }
                        }}
                        disabled={currentQueueIndex + 1 >= selectedCustomerIds.length}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                        Skip Recipient
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<WhatsApp />}
                        onClick={handleSendNextInQueue}
                        sx={{
                            bgcolor: '#25D366',
                            '&:hover': { bgcolor: '#128C7E' },
                            fontWeight: 800,
                            borderRadius: 2.5,
                            textTransform: 'none',
                            px: 3
                        }}
                    >
                        Open WhatsApp & Next Recipient
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ============================================================== */}
            {/* CREATE / EDIT TEMPLATE MODAL                                   */}
            {/* ============================================================== */}
            <Dialog
                open={editTemplateDialogOpen}
                onClose={() => setEditTemplateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 800,
                        bgcolor: 'rgba(15, 118, 110, 0.04)',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        color: '#042F2E'
                    }}
                >
                    {editingTemplate ? 'Edit Campaign Template' : 'Create Custom Broadcast Template'}
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5 }}>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Template Title *"
                            placeholder="e.g. Eid Royale Saree Showcase"
                            value={templateFormData.title}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, title: e.target.value })}
                        />

                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.secondary', display: 'block', mb: 1 }}>
                                Campaign Category:
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                                {['festive', 'bridal', 'sale', 'vip', 'arrivals'].map(cat => (
                                    <Chip
                                        key={cat}
                                        label={cat.toUpperCase()}
                                        clickable
                                        color={templateFormData.category === cat ? 'primary' : 'default'}
                                        onClick={() => setTemplateFormData({ ...templateFormData, category: cat })}
                                        sx={{ fontWeight: 750, fontSize: '0.72rem', borderRadius: 2 }}
                                    />
                                ))}
                            </Stack>
                        </Box>

                        <TextField
                            fullWidth
                            label="WhatsApp Message *"
                            multiline
                            rows={4}
                            placeholder="Craft your broadcast message here..."
                            value={templateFormData.message}
                            onChange={(e) => setTemplateFormData({ ...templateFormData, message: e.target.value })}
                            helperText="Tip: You can use merge tags like {customer_name}, {store_name}, {loyalty_points}."
                        />

                        {/* Banner Image Upload */}
                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.secondary', display: 'block', mb: 1 }}>
                                Lookbook Banner Image (Optional)
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
                                            sx={{
                                                py: 2,
                                                borderStyle: 'dashed',
                                                borderWidth: 2,
                                                borderColor: 'divider',
                                                borderRadius: 2.5,
                                                textTransform: 'none',
                                                fontWeight: 750
                                            }}
                                        >
                                            {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : '+ Upload Lookbook Image'}
                                        </Button>
                                    </label>
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2.5,
                                        p: 2,
                                        textAlign: 'center',
                                        bgcolor: 'background.paper',
                                        position: 'relative'
                                    }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={() => setTemplateFormData({ ...templateFormData, imageUrl: '' })}
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
                                            maxHeight: '160px',
                                            borderRadius: '8px',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Stack>
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
                            fontWeight: 750,
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
