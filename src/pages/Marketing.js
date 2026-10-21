import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    ToggleButton,
    Switch,
    Alert,
    Radio,
    RadioGroup,
    FormControl,
    FormLabel
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
    PlayArrow,
    Settings,
    PlayCircle,
    PauseCircle,
    StopCircle,
    ElectricBolt,
    QrCode,
    ReceiptLong,
    VpnKey
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import ClienteleNavTabs from '../components/crm/ClienteleNavTabs';

// Sentence Casing utility
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

// Default WhatsApp Auto-Responder Keywords
const DEFAULT_KEYWORDS = [
    {
        id: 'kw_1',
        keyword: 'CATALOGUE',
        description: 'Sends the digital couture lookbook link and current bridal catalog',
        response: 'Greetings! 🌸 Thank you for contacting {store_name}. Browse our digital Haute Couture Lookbook here: https://aleen.atelier/lookbook. For bespoke bookings, reply with 1.',
        active: true
    },
    {
        id: 'kw_2',
        keyword: 'LOCATION',
        description: 'Sends atelier store address, GPS coordinates, and valet parking info',
        response: '📍 {store_name} is located at: Haute Couture Studio, Fashion Boulevard, Commercial Street. Valet parking available. Google Maps: https://maps.google.com/?q=aleen+atelier',
        active: true
    },
    {
        id: 'kw_3',
        keyword: 'TIMINGS',
        description: 'Sends boutique operating hours and appointment slots',
        response: '⏰ Atelier Hours: Monday – Saturday (10:30 AM to 8:30 PM), Sunday (11:00 AM to 6:00 PM). Private styling appointments can be booked anytime via our concierge.',
        active: true
    },
    {
        id: 'kw_4',
        keyword: 'VIP',
        description: 'Informs customer how to check tier and redeem loyalty points',
        response: '👑 Welcome to the VIP Atelier Circle! Patrons earn 1 credit per ₹100 spent. Credits never expire and unlock early bridal preview access. Reply with your registered mobile to check points.',
        active: true
    }
];

const Marketing = () => {
    const {
        customers,
        invoices,
        profile,
        updateProfile,
        updateCustomer,
        marketingTemplates,
        addMarketingTemplate,
        updateMarketingTemplate,
        deleteMarketingTemplate
    } = useData();

    // Sub-Tabs Navigation
    // 0: Audience & Broadcast Studio
    // 1: WhatsApp Automations & Auto-Pilot Hub
    // 2: Template Studio
    // 3: Celebration Desk
    // 4: Keywords & Auto-Responder
    // 5: Dispatch History & Audit
    const [activeSubTab, setActiveSubTab] = useState(0);

    // Audience & Filter State
    const [search, setSearch] = useState('');
    const [selectedSegment, setSelectedSegment] = useState('all');
    const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
    const [viewMode, setViewMode] = useState('cards');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(12);

    // Composer & Live Preview State
    const [composerTitle, setComposerTitle] = useState('Bespoke Broadcast');
    const [composerMessage, setComposerMessage] = useState('');
    const [composerImage, setComposerImage] = useState('');
    const [composerOfferCode, setComposerOfferCode] = useState('HAUTE20');
    const [activeCustomerForPreview, setActiveCustomerForPreview] = useState(null);

    // Template Management State
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

    // ==============================================================
    // WHATSAPP GATEWAY & API CONFIGURATION
    // ==============================================================
    const [gatewayModalOpen, setGatewayModalOpen] = useState(false);
    const [gatewayConfig, setGatewayConfig] = useState(() => {
        try {
            const saved = localStorage.getItem('atelier_whatsapp_gateway_config');
            return saved ? JSON.parse(saved) : {
                mode: 'browser', // 'browser' (wa.me) | 'meta_cloud' | 'webhook'
                metaPhoneNumberId: '',
                metaAccessToken: '',
                metaWabaId: '',
                webhookUrl: '',
                webhookApiKey: '',
                testPhone: '+91'
            };
        } catch (e) {
            return { mode: 'browser', metaPhoneNumberId: '', metaAccessToken: '', webhookUrl: '', webhookApiKey: '', testPhone: '+91' };
        }
    });
    const [gatewayTestStatus, setGatewayTestStatus] = useState(null); // { success: boolean, message: string }

    const handleSaveGatewayConfig = (newConfig) => {
        setGatewayConfig(newConfig);
        try {
            localStorage.setItem('atelier_whatsapp_gateway_config', JSON.stringify(newConfig));
            if (profile) {
                updateProfile({ whatsappSettings: newConfig });
            }
        } catch (e) {
            console.error('Failed to save gateway config', e);
        }
        setGatewayModalOpen(false);
    };

    // ==============================================================
    // WHATSAPP AUTOMATION RULES (DRIP & EVENT TRIGGERS)
    // ==============================================================
    const [automationRules, setAutomationRules] = useState(() => {
        try {
            const saved = localStorage.getItem('atelier_whatsapp_automations');
            return saved ? JSON.parse(saved) : {
                birthdayAutoDrip: true,
                birthdayBonusCredits: 100,
                dormancyWinback: true,
                dormancyThreshold: 30,
                invoiceReceiptAuto: true,
                tailoringReadyAlert: true,
                vipTierUpgradeAlert: true,
                dueBalanceChaser: true
            };
        } catch (e) {
            return {
                birthdayAutoDrip: true,
                birthdayBonusCredits: 100,
                dormancyWinback: true,
                dormancyThreshold: 30,
                invoiceReceiptAuto: true,
                tailoringReadyAlert: true,
                vipTierUpgradeAlert: true,
                dueBalanceChaser: true
            };
        }
    });

    const handleToggleAutomation = (ruleKey) => {
        setAutomationRules(prev => {
            const updated = { ...prev, [ruleKey]: !prev[ruleKey] };
            try {
                localStorage.setItem('atelier_whatsapp_automations', JSON.stringify(updated));
            } catch (e) {
                console.error(e);
            }
            return updated;
        });
    };

    // ==============================================================
    // AUTO-PILOT RUNNER ENGINE (HANDS-FREE DISPATCHER)
    // ==============================================================
    const [autoPilotOpen, setAutoPilotOpen] = useState(false);
    const [autoPilotRunning, setAutoPilotRunning] = useState(false);
    const [autoPilotPaused, setAutoPilotPaused] = useState(false);
    const [autoPilotThrottleSec, setAutoPilotThrottleSec] = useState(4);
    const [autoPilotCurrentIdx, setAutoPilotCurrentIdx] = useState(0);
    const [autoPilotCountdown, setAutoPilotCountdown] = useState(4);
    const [dispatchedIds, setDispatchedIds] = useState([]);
    const timerRef = useRef(null);

    // ==============================================================
    // KEYWORDS AUTO-RESPONDER STATE
    // ==============================================================
    const [keywordsList, setKeywordsList] = useState(() => {
        try {
            const saved = localStorage.getItem('atelier_whatsapp_keywords');
            return saved ? JSON.parse(saved) : DEFAULT_KEYWORDS;
        } catch (e) {
            return DEFAULT_KEYWORDS;
        }
    });
    const [editKeywordDialogOpen, setEditKeywordDialogOpen] = useState(false);
    const [editingKeyword, setEditingKeyword] = useState(null);
    const [keywordFormData, setKeywordFormData] = useState({ keyword: '', description: '', response: '', active: true });

    // ==============================================================
    // DISPATCH LOGS & AUDIT HISTORY
    // ==============================================================
    const [dispatchHistory, setDispatchHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('atelier_marketing_dispatches');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [copiedAlert, setCopiedAlert] = useState(false);

    // Record dispatch in history
    const recordDispatch = (customer, templateTitle, finalMessage, channel = 'WhatsApp') => {
        const newEntry = {
            id: Date.now() + Math.random().toString(36).substr(2, 4),
            customerId: customer.id,
            customerName: customer.name,
            phone: customer.phone,
            templateTitle: templateTitle || 'Direct Broadcast',
            message: finalMessage,
            timestamp: new Date().toISOString(),
            status: 'Sent Successfully',
            channel
        };
        const updated = [newEntry, ...dispatchHistory].slice(0, 100);
        setDispatchHistory(updated);
        try {
            localStorage.setItem('atelier_marketing_dispatches', JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save history', e);
        }
    };

    // Calculate customer intelligence stats
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
            if (selectedSegment === 'dormant30' && (c.daysDormant < 30 || c.daysDormant >= 60)) return false;
            if (selectedSegment === 'dormant60' && c.daysDormant < 60) return false;
            if (selectedSegment === 'vip' && !(c.tier === 'Platinum' || c.tier === 'Gold' || c.totalSpent >= 25000)) return false;
            if (selectedSegment === 'recent' && c.daysDormant >= 30) return false;
            if (selectedSegment === 'celebrants' && !c.isBirthdayMonth) return false;
            if (selectedSegment === 'loyalty' && (c.loyaltyPoints || 0) < 200) return false;

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

    // Celebrations
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

    // Dynamic Personalization Text Formatter
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

    // ==============================================================
    // CORE WHATSAPP DISPATCHER (META CLOUD API / WEBHOOK / BROWSER)
    // ==============================================================
    const dispatchWhatsApp = async (customer, customMsg, customImg, templateTitle) => {
        const rawPhone = customer.phone.replace(/\D/g, '');
        const cleanPhone = rawPhone.startsWith('91') ? rawPhone : (rawPhone.length === 10 ? `91${rawPhone}` : rawPhone);
        const textToSend = formatPersonalizedMessage(customMsg, customer);

        // 1. Meta WhatsApp Cloud API Mode (Headless background send)
        if (gatewayConfig.mode === 'meta_cloud' && gatewayConfig.metaPhoneNumberId && gatewayConfig.metaAccessToken) {
            try {
                const response = await fetch(`https://graph.facebook.com/v18.0/${gatewayConfig.metaPhoneNumberId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${gatewayConfig.metaAccessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: cleanPhone,
                        type: 'text',
                        text: { body: textToSend }
                    })
                });

                if (response.ok) {
                    if (customer.id) updateCustomer(customer.id, { lastReminderSent: new Date().toISOString() });
                    recordDispatch(customer, templateTitle, textToSend, 'Meta Cloud API');
                    return { success: true, channel: 'Meta Cloud API' };
                }
            } catch (err) {
                console.warn('Meta API call failed, falling back to browser WhatsApp:', err);
            }
        }

        // 2. Custom Webhook Gateway Mode (e.g. Evolution API, Baileys, Wati)
        if (gatewayConfig.mode === 'webhook' && gatewayConfig.webhookUrl) {
            try {
                const response = await fetch(gatewayConfig.webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(gatewayConfig.webhookApiKey ? { 'Authorization': `Bearer ${gatewayConfig.webhookApiKey}`, 'x-api-key': gatewayConfig.webhookApiKey } : {})
                    },
                    body: JSON.stringify({
                        phone: cleanPhone,
                        message: textToSend,
                        imageUrl: customImg || null
                    })
                });

                if (response.ok) {
                    if (customer.id) updateCustomer(customer.id, { lastReminderSent: new Date().toISOString() });
                    recordDispatch(customer, templateTitle, textToSend, 'Custom Webhook Gateway');
                    return { success: true, channel: 'Webhook' };
                }
            } catch (err) {
                console.warn('Webhook call failed, falling back to browser WhatsApp:', err);
            }
        }

        // 3. Universal Browser Click-to-Chat (wa.me)
        let fullPayload = textToSend;
        if (customImg) fullPayload += `\n\n${customImg}`;
        const url = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(fullPayload)}`;
        window.open(url, '_blank');

        if (customer.id) updateCustomer(customer.id, { lastReminderSent: new Date().toISOString() });
        recordDispatch(customer, templateTitle, fullPayload, 'WhatsApp Web / Mobile');
        return { success: true, channel: 'Browser wa.me' };
    };

    // Test Gateway Ping
    const handleTestGatewayPing = async () => {
        setGatewayTestStatus({ loading: true, message: 'Testing WhatsApp gateway dispatch...' });
        const dummyCustomer = {
            id: 'test_patron',
            name: profile?.businessName || 'Atelier Owner',
            phone: gatewayConfig.testPhone || '+91 9999999999'
        };
        const testMsg = `Hello! 🌟 This is an automated test ping from ${profile?.businessName || 'Aleen Haute Couture'} WhatsApp Automation Engine. If you received this, your connection is fully operational!`;

        try {
            const res = await dispatchWhatsApp(dummyCustomer, testMsg, '', 'Gateway Connection Test');
            setGatewayTestStatus({
                loading: false,
                success: true,
                message: `Connection successful! Dispatched via ${res.channel}.`
            });
        } catch (err) {
            setGatewayTestStatus({
                loading: false,
                success: false,
                message: `Ping failed: ${err.message}`
            });
        }
    };

    // ==============================================================
    // AUTO-PILOT EXECUTION LOOP (INTERVAL RUNNER)
    // ==============================================================
    const startAutoPilot = () => {
        if (selectedCustomerIds.length === 0) return;
        setAutoPilotCurrentIdx(0);
        setDispatchedIds([]);
        setAutoPilotRunning(true);
        setAutoPilotPaused(false);
        setAutoPilotCountdown(autoPilotThrottleSec);
        setAutoPilotOpen(true);
    };

    const stopAutoPilot = () => {
        setAutoPilotRunning(false);
        setAutoPilotPaused(false);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    useEffect(() => {
        if (!autoPilotRunning || autoPilotPaused) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setAutoPilotCountdown(prev => {
                if (prev <= 1) {
                    // Trigger dispatch for current index
                    const currentId = selectedCustomerIds[autoPilotCurrentIdx];
                    const customer = customers.find(c => c.id === currentId);

                    if (customer) {
                        dispatchWhatsApp(
                            customer,
                            composerMessage || PRESET_BROADCASTS[0].message,
                            composerImage,
                            composerTitle
                        );
                        setDispatchedIds(old => [...old, currentId]);
                    }

                    // Advance index or complete
                    if (autoPilotCurrentIdx + 1 < selectedCustomerIds.length) {
                        setAutoPilotCurrentIdx(curr => curr + 1);
                        return autoPilotThrottleSec;
                    } else {
                        // Completed all
                        setAutoPilotRunning(false);
                        return 0;
                    }
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPilotRunning, autoPilotPaused, autoPilotCurrentIdx, selectedCustomerIds, customers, composerMessage, composerImage, composerTitle, autoPilotThrottleSec]);

    // Handle Image Upload
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

    // Sample preview customer
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
                title="WhatsApp Marketing & Automation Suite"
                subtitle="Automate client journeys, trigger WhatsApp e-invoices & status alerts, and launch hands-free broadcast campaigns"
                actions={
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Button
                            variant="outlined"
                            startIcon={<Settings />}
                            onClick={() => setGatewayModalOpen(true)}
                            sx={{
                                px: 2.5,
                                py: 1,
                                borderRadius: 2.5,
                                fontWeight: 750,
                                textTransform: 'none',
                                borderColor: 'rgba(15, 118, 110, 0.3)',
                                color: '#0F766E',
                                '&:hover': {
                                    borderColor: '#0F766E',
                                    bgcolor: 'rgba(15, 118, 110, 0.04)'
                                }
                            }}
                        >
                            {gatewayConfig.mode === 'meta_cloud' ? 'Meta API Connected' : gatewayConfig.mode === 'webhook' ? 'Webhook Active' : 'Gateway Settings'}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<ElectricBolt />}
                            onClick={() => setActiveSubTab(1)}
                            sx={{
                                px: 3,
                                py: 1,
                                borderRadius: 2.5,
                                fontWeight: 750,
                                textTransform: 'none',
                                background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                                color: '#ffffff',
                                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #042F2E 0%, #0F766E 100%)'
                                }
                            }}
                        >
                            Automations Hub
                        </Button>
                    </Stack>
                }
            />

            {/* Clientele & CRM Navigation Tabs */}
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
                        title="Dormant Winback"
                        value={(segmentCounts.dormant30 + segmentCounts.dormant60).toLocaleString()}
                        subtitle="Automated winback queue (30d+)"
                        icon={<Warning />}
                        trend={{
                            label: `${segmentCounts.dormant60} Deep Dormant (60d+)`,
                            isPositive: (segmentCounts.dormant30 + segmentCounts.dormant60) === 0
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Automated Drips"
                        value={Object.values(automationRules).filter(Boolean).length.toString()}
                        subtitle="Active automated event triggers"
                        icon={<ElectricBolt />}
                        goldAccent={true}
                        trend={{ label: `${todayCelebrants.length} Birthdays Today`, isPositive: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Dispatches Logged"
                        value={dispatchHistory.length.toLocaleString()}
                        subtitle="WhatsApp broadcasts delivered"
                        icon={<Campaign />}
                        trend={{ label: `${gatewayConfig.mode.replace('_', ' ').toUpperCase()}`, isPositive: true }}
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
                    <Tab icon={<AutoAwesome sx={{ fontSize: '1.15rem' }} />} iconPosition="start" label="Audience & Instant Broadcast" />
                    <Tab
                        icon={
                            <Badge color="success" variant="dot">
                                <ElectricBolt sx={{ fontSize: '1.15rem' }} />
                            </Badge>
                        }
                        iconPosition="start"
                        label="⚡ Automations & Auto-Pilot"
                    />
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
                    <Tab icon={<QrCode sx={{ fontSize: '1.15rem' }} />} iconPosition="start" label="Keywords & QR Auto-Responder" />
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
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
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
                                                                    dispatchWhatsApp(customer, msg, composerImage, composerTitle);
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
                                                                    dispatchWhatsApp(customer, msg, composerImage, composerTitle);
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
                                        {composerImage && (
                                            <Box sx={{ mb: 1, borderRadius: 1.5, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                                                <img
                                                    src={composerImage}
                                                    alt="Lookbook Campaign"
                                                    style={{ width: '100%', maxHeight: 140, objectFit: 'cover', display: 'block' }}
                                                />
                                            </Box>
                                        )}

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

                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.75 }}>
                                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#9CA3AF' }}>
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                            <DoneAll sx={{ fontSize: 13, color: '#3B82F6' }} />
                                        </Box>
                                    </Box>
                                </Box>

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
                                    dispatchWhatsApp(
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
            {/* SUB-TAB 1: WHATSAPP AUTOMATIONS & AUTO-PILOT HUB              */}
            {/* ============================================================== */}
            {activeSubTab === 1 && (
                <Box>
                    {/* Top Status & Gateway Alert Banner */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3.5,
                            border: '1.5px solid',
                            borderColor: gatewayConfig.mode !== 'browser' ? '#0F766E' : 'rgba(15, 118, 110, 0.25)',
                            bgcolor: 'rgba(15, 118, 110, 0.03)',
                            mb: 3.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 2
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#0F766E', width: 48, height: 48 }}>
                                <ElectricBolt sx={{ color: '#ffffff', fontSize: 28 }} />
                            </Avatar>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                        WhatsApp Dispatch Gateway
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={gatewayConfig.mode === 'meta_cloud' ? 'Meta Cloud API (Headless)' : gatewayConfig.mode === 'webhook' ? 'Custom Webhook Gateway' : 'Click-to-Chat (wa.me)'}
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: '0.72rem',
                                            bgcolor: gatewayConfig.mode !== 'browser' ? '#0F766E' : 'rgba(0,0,0,0.08)',
                                            color: gatewayConfig.mode !== 'browser' ? '#ffffff' : 'text.primary'
                                        }}
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                    {gatewayConfig.mode === 'meta_cloud'
                                        ? 'Configured for official Meta Graph API background messaging without opening browser tabs.'
                                        : gatewayConfig.mode === 'webhook'
                                        ? 'Configured for custom webhook / Evolution API / Baileys microservice.'
                                        : 'Operating in Universal Click-to-Chat mode (opens WhatsApp Web/App directly with pre-filled message).'}
                                </Typography>
                            </Box>
                        </Box>

                        <Stack direction="row" spacing={1.5}>
                            <Button
                                variant="outlined"
                                startIcon={<Settings />}
                                onClick={() => setGatewayModalOpen(true)}
                                sx={{
                                    borderRadius: 2.5,
                                    fontWeight: 750,
                                    textTransform: 'none',
                                    color: '#0F766E',
                                    borderColor: 'rgba(15, 118, 110, 0.4)'
                                }}
                            >
                                Gateway Config
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<WhatsApp />}
                                onClick={handleTestGatewayPing}
                                sx={{
                                    bgcolor: '#25D366',
                                    '&:hover': { bgcolor: '#128C7E' },
                                    borderRadius: 2.5,
                                    fontWeight: 800,
                                    textTransform: 'none'
                                }}
                            >
                                Test Ping
                            </Button>
                        </Stack>
                    </Paper>

                    {/* Test Ping Feedback */}
                    {gatewayTestStatus && (
                        <Alert
                            severity={gatewayTestStatus.success ? 'success' : 'info'}
                            onClose={() => setGatewayTestStatus(null)}
                            sx={{ mb: 3, borderRadius: 2.5, fontWeight: 700 }}
                        >
                            {gatewayTestStatus.message}
                        </Alert>
                    )}

                    {/* Automation Trigger Rules Grid */}
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E', mb: 2 }}>
                        Automated Lifecycle & Event Triggers
                    </Typography>

                    <Grid container spacing={2.5}>
                        {/* 1. Daily Birthday Greeter */}
                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    border: '1.5px solid',
                                    borderColor: automationRules.birthdayAutoDrip ? '#D97706' : 'divider',
                                    bgcolor: 'background.paper',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Cake sx={{ color: '#D97706' }} />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                                Daily Birthday & Anniversary Greeter
                                            </Typography>
                                        </Box>
                                        <Switch
                                            checked={automationRules.birthdayAutoDrip}
                                            onChange={() => handleToggleAutomation('birthdayAutoDrip')}
                                            color="warning"
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.82rem' }}>
                                        Automatically identifies patrons celebrating today and prompts or dispatches a personalized birthday greeting + {automationRules.birthdayBonusCredits} bonus loyalty credits.
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                    <Chip
                                        size="small"
                                        label={`${todayCelebrants.length} Celebrants Today`}
                                        sx={{ bgcolor: 'rgba(217, 119, 6, 0.1)', color: '#B45309', fontWeight: 800, fontSize: '0.7rem' }}
                                    />
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        disabled={todayCelebrants.length === 0}
                                        onClick={() => {
                                            todayCelebrants.forEach(c => {
                                                const msg = `Happy Birthday ${c.displayName}! 🎉 Warmest wishes from ${profile?.businessName || 'Aleen Haute Couture'}. We've credited 100 bonus loyalty credits to your account!`;
                                                dispatchWhatsApp(c, msg, '', 'Automated Birthday Drip');
                                            });
                                        }}
                                        sx={{ textTransform: 'none', fontWeight: 750, fontSize: '0.72rem' }}
                                    >
                                        Run Scan & Send Now
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* 2. Dormancy Winback Drip */}
                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    border: '1.5px solid',
                                    borderColor: automationRules.dormancyWinback ? '#0F766E' : 'divider',
                                    bgcolor: 'background.paper',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Warning sx={{ color: '#0F766E' }} />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                                Dormant Patron Winback (30d+ Inactivity)
                                            </Typography>
                                        </Box>
                                        <Switch
                                            checked={automationRules.dormancyWinback}
                                            onChange={() => handleToggleAutomation('dormancyWinback')}
                                            color="primary"
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.82rem' }}>
                                        Identifies clients who have not purchased in over 30 days and invites them back with seasonal couture arrivals and styling incentives.
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                    <Chip
                                        size="small"
                                        label={`${segmentCounts.dormant30} In Dormancy Queue`}
                                        sx={{ bgcolor: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', fontWeight: 800, fontSize: '0.7rem' }}
                                    />
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => {
                                            setSelectedSegment('dormant30');
                                            setActiveSubTab(0);
                                        }}
                                        sx={{ textTransform: 'none', fontWeight: 750, fontSize: '0.72rem' }}
                                    >
                                        View Dormant Queue
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* 3. Retail Bill & E-Invoice Auto Dispatch */}
                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    border: '1.5px solid',
                                    borderColor: automationRules.invoiceReceiptAuto ? '#0F766E' : 'divider',
                                    bgcolor: 'background.paper',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ReceiptLong sx={{ color: '#0F766E' }} />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                                E-Invoice & Digital Receipt Auto-Share
                                            </Typography>
                                        </Box>
                                        <Switch
                                            checked={automationRules.invoiceReceiptAuto}
                                            onChange={() => handleToggleAutomation('invoiceReceiptAuto')}
                                            color="primary"
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.82rem' }}>
                                        Prompt 1-click WhatsApp dispatch with itemized receipt, total amount, taxes, and payment mode as soon as a bill is finalized.
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                    <Chip
                                        size="small"
                                        label="Active in POS / Invoices"
                                        sx={{ bgcolor: 'rgba(5, 150, 105, 0.1)', color: '#059669', fontWeight: 800, fontSize: '0.7rem' }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        Auto-formatted breakdown
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* 4. Tailoring Ready-for-Pickup Alert */}
                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    border: '1.5px solid',
                                    borderColor: automationRules.tailoringReadyAlert ? '#0F766E' : 'divider',
                                    bgcolor: 'background.paper',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CheckCircle sx={{ color: '#0F766E' }} />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                                Tailoring Ready & Fitting Notification
                                            </Typography>
                                        </Box>
                                        <Switch
                                            checked={automationRules.tailoringReadyAlert}
                                            onChange={() => handleToggleAutomation('tailoringReadyAlert')}
                                            color="primary"
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.82rem' }}>
                                        Sends instantaneous WhatsApp alert when bespoke garment moves to "Ready for Trial" or "Ready for Pickup" on the Kanban tailoring board.
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                    <Chip
                                        size="small"
                                        label="Connected to Tailoring Kanban"
                                        sx={{ bgcolor: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', fontWeight: 800, fontSize: '0.7rem' }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        Includes delivery target date
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* ============================================================== */}
            {/* SUB-TAB 2: CAMPAIGN TEMPLATES & STUDIO                         */}
            {/* ============================================================== */}
            {activeSubTab === 2 && (
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
            {/* SUB-TAB 3: CELEBRATION DESK                                    */}
            {/* ============================================================== */}
            {activeSubTab === 3 && (
                <Grid container spacing={3}>
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
                                                dispatchWhatsApp(c, msg, '', 'Birthday Greeting');
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
                                                        dispatchWhatsApp(customer, msg, '', 'Birthday Greeting');
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
                                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, mb: 1, p: 1.5 }}
                                        secondaryAction={
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const msg = `Hello ${c.displayName}! Warm early birthday greetings from ${profile?.businessName || 'Aleen Haute Couture'}. We would love to prepare a special bespoke fitting for your upcoming celebration!`;
                                                    dispatchWhatsApp(c, msg, '', 'Early Birthday Note');
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
                                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, mb: 1, p: 1.5 }}
                                        secondaryAction={
                                            <Button
                                                size="small"
                                                startIcon={<WhatsApp />}
                                                onClick={() => {
                                                    const msg = `Warm greetings ${c.displayName}! We celebrate your special month at ${profile?.businessName || 'Aleen Haute Couture'}. Book your private styling appointment and enjoy bespoke privileges!`;
                                                    dispatchWhatsApp(c, msg, '', 'Month Birthday Note');
                                                }}
                                                sx={{ color: '#25D366', fontWeight: 750, fontSize: '0.72rem', textTransform: 'none' }}
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
            {/* SUB-TAB 4: KEYWORDS & QR AUTO-RESPONDER STUDIO                 */}
            {/* ============================================================== */}
            {activeSubTab === 4 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                WhatsApp Inbound Keywords & QR Code Auto-Responder
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Generate QR stickers and click-to-chat links that automatically prompt customer replies for catalogs, locations, and timings
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => {
                                setEditingKeyword(null);
                                setKeywordFormData({ keyword: '', description: '', response: '', active: true });
                                setEditKeywordDialogOpen(true);
                            }}
                            sx={{
                                borderRadius: 2.5,
                                fontWeight: 750,
                                textTransform: 'none',
                                bgcolor: '#0F766E',
                                '&:hover': { bgcolor: '#042F2E' }
                            }}
                        >
                            + Add Keyword Trigger
                        </Button>
                    </Box>

                    <Grid container spacing={2.5}>
                        {keywordsList.map((kw) => {
                            const samplePhone = (profile?.phone || '919876543210').replace(/\D/g, '');
                            const qrClickUrl = `https://wa.me/${samplePhone}?text=${encodeURIComponent(kw.keyword)}`;

                            return (
                                <Grid item xs={12} md={6} key={kw.id}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: 3,
                                            border: '1.5px solid',
                                            borderColor: 'divider',
                                            bgcolor: 'background.paper',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Chip
                                                    label={`Trigger: "${kw.keyword}"`}
                                                    sx={{ bgcolor: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', fontWeight: 800 }}
                                                />
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setEditingKeyword(kw);
                                                            setKeywordFormData({ ...kw });
                                                            setEditKeywordDialogOpen(true);
                                                        }}
                                                    >
                                                        <Edit fontSize="small" sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => {
                                                            if (window.confirm(`Delete keyword "${kw.keyword}"?`)) {
                                                                const updated = keywordsList.filter(k => k.id !== kw.id);
                                                                setKeywordsList(updated);
                                                                localStorage.setItem('atelier_whatsapp_keywords', JSON.stringify(updated));
                                                            }
                                                        }}
                                                    >
                                                        <Delete fontSize="small" sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Box>
                                            </Box>

                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                                                {kw.description}
                                            </Typography>

                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: 'rgba(0,0,0,0.02)',
                                                    border: '1px solid rgba(0,0,0,0.04)',
                                                    fontSize: '0.82rem',
                                                    lineHeight: 1.4,
                                                    fontStyle: 'italic',
                                                    mb: 2
                                                }}
                                            >
                                                "{formatPersonalizedMessage(kw.response, samplePreviewCustomer)}"
                                            </Paper>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                            <Button
                                                size="small"
                                                startIcon={<ContentCopy sx={{ fontSize: 16 }} />}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(qrClickUrl);
                                                    alert(`Copied WhatsApp QR link for keyword "${kw.keyword}"! You can print this link or generate a QR sticker.`);
                                                }}
                                                sx={{ textTransform: 'none', fontWeight: 750, fontSize: '0.75rem', color: '#0F766E' }}
                                            >
                                                Copy QR Link
                                            </Button>

                                            <Button
                                                size="small"
                                                variant="contained"
                                                startIcon={<WhatsApp />}
                                                onClick={() => window.open(qrClickUrl, '_blank')}
                                                sx={{
                                                    bgcolor: '#25D366',
                                                    '&:hover': { bgcolor: '#128C7E' },
                                                    fontWeight: 750,
                                                    fontSize: '0.72rem',
                                                    borderRadius: 2,
                                                    textTransform: 'none'
                                                }}
                                            >
                                                Test Keyword
                                            </Button>
                                        </Box>
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>
            )}

            {/* ============================================================== */}
            {/* SUB-TAB 5: DISPATCH LOGS & AUDIT                               */}
            {/* ============================================================== */}
            {activeSubTab === 5 && (
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
                                                    label={entry.channel || 'WhatsApp'}
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
                            onClick={startAutoPilot}
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
                            ⚡ Launch Auto-Pilot
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* ============================================================== */}
            {/* HANDS-FREE AUTO-PILOT QUEUE RUNNER MODAL                       */}
            {/* ============================================================== */}
            <Dialog
                open={autoPilotOpen}
                onClose={() => {
                    stopAutoPilot();
                    setAutoPilotOpen(false);
                }}
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
                        <ElectricBolt sx={{ color: '#0F766E' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            ⚡ Hands-Free Auto-Pilot Broadcast
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => {
                        stopAutoPilot();
                        setAutoPilotOpen(false);
                    }}>
                        <Close fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                Progress: {autoPilotCurrentIdx + 1} of {selectedCustomerIds.length} Patrons
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800 }}>
                                {dispatchedIds.length} Sent • {autoPilotRunning && !autoPilotPaused ? `Next in ${autoPilotCountdown}s` : 'Paused'}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={((autoPilotCurrentIdx + 1) / selectedCustomerIds.length) * 100}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: 'rgba(15, 118, 110, 0.1)',
                                '& .MuiLinearProgress-bar': { bgcolor: '#0F766E' }
                            }}
                        />
                    </Box>

                    {/* Throttle Speed Selector */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            Dispatch Throttle (Anti-Spam Delay):
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            {[
                                { label: 'Fast (3s)', val: 3 },
                                { label: 'Normal (5s)', val: 5 },
                                { label: 'Safe (8s)', val: 8 }
                            ].map(s => (
                                <Chip
                                    key={s.val}
                                    label={s.label}
                                    size="small"
                                    clickable
                                    color={autoPilotThrottleSec === s.val ? 'primary' : 'default'}
                                    onClick={() => setAutoPilotThrottleSec(s.val)}
                                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                />
                            ))}
                        </Stack>
                    </Box>

                    {/* Current Recipient Card */}
                    {(() => {
                        const currentId = selectedCustomerIds[autoPilotCurrentIdx];
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
                                        <Chip icon={<CheckCircle sx={{ fontSize: '1rem !important' }} />} label="Dispatched" size="small" color="success" />
                                    ) : (
                                        <Chip label={`Sending in ${autoPilotCountdown}s`} size="small" sx={{ bgcolor: '#0F766E', color: '#fff', fontWeight: 700 }} />
                                    )}
                                </Box>

                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                    Message Payload Preview:
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
                        color="error"
                        startIcon={<StopCircle />}
                        onClick={stopAutoPilot}
                        sx={{ textTransform: 'none', fontWeight: 750 }}
                    >
                        Abort Runner
                    </Button>

                    <Stack direction="row" spacing={1}>
                        {autoPilotRunning && !autoPilotPaused ? (
                            <Button
                                variant="outlined"
                                startIcon={<PauseCircle />}
                                onClick={() => setAutoPilotPaused(true)}
                                sx={{ textTransform: 'none', fontWeight: 750 }}
                            >
                                Pause
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                startIcon={<PlayCircle />}
                                onClick={() => {
                                    setAutoPilotPaused(false);
                                    setAutoPilotRunning(true);
                                }}
                                sx={{ bgcolor: '#0F766E', '&:hover': { bgcolor: '#042F2E' }, textTransform: 'none', fontWeight: 750 }}
                            >
                                Resume Auto-Pilot
                            </Button>
                        )}

                        <Button
                            variant="contained"
                            startIcon={<WhatsApp />}
                            onClick={() => {
                                const currentId = selectedCustomerIds[autoPilotCurrentIdx];
                                const customer = customers.find(c => c.id === currentId);
                                if (customer) {
                                    dispatchWhatsApp(customer, composerMessage || PRESET_BROADCASTS[0].message, composerImage, composerTitle);
                                    setDispatchedIds(old => [...old, currentId]);
                                }
                                if (autoPilotCurrentIdx + 1 < selectedCustomerIds.length) {
                                    setAutoPilotCurrentIdx(i => i + 1);
                                    setAutoPilotCountdown(autoPilotThrottleSec);
                                }
                            }}
                            sx={{
                                bgcolor: '#25D366',
                                '&:hover': { bgcolor: '#128C7E' },
                                fontWeight: 800,
                                borderRadius: 2.5,
                                textTransform: 'none'
                            }}
                        >
                            Send & Next Now
                        </Button>
                    </Stack>
                </DialogActions>
            </Dialog>

            {/* ============================================================== */}
            {/* WHATSAPP GATEWAY & CLOUD API CONFIGURATION MODAL               */}
            {/* ============================================================== */}
            <Dialog
                open={gatewayModalOpen}
                onClose={() => setGatewayModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 800,
                        bgcolor: 'rgba(15, 118, 110, 0.05)',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        color: '#042F2E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <VpnKey sx={{ color: '#0F766E' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                            WhatsApp Gateway & API Credentials
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setGatewayModalOpen(false)}>
                        <Close fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 2.5 }}>
                    <FormControl component="fieldset" sx={{ mb: 2.5, width: '100%' }}>
                        <FormLabel component="legend" sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#042F2E', mb: 1 }}>
                            Select Dispatch Method:
                        </FormLabel>
                        <RadioGroup
                            value={gatewayConfig.mode}
                            onChange={(e) => setGatewayConfig({ ...gatewayConfig, mode: e.target.value })}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 1.5,
                                    mb: 1,
                                    borderRadius: 2.5,
                                    border: '1.5px solid',
                                    borderColor: gatewayConfig.mode === 'browser' ? '#0F766E' : 'divider',
                                    bgcolor: gatewayConfig.mode === 'browser' ? 'rgba(15, 118, 110, 0.04)' : 'transparent'
                                }}
                            >
                                <FormControlLabel
                                    value="browser"
                                    control={<Radio size="small" sx={{ color: '#0F766E', '&.Mui-checked': { color: '#0F766E' } }} />}
                                    label={
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 750 }}>
                                                Universal Click-to-Chat (wa.me)
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Zero setup needed. Launches WhatsApp Web or Desktop App with pre-filled message.
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Paper>

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 1.5,
                                    mb: 1,
                                    borderRadius: 2.5,
                                    border: '1.5px solid',
                                    borderColor: gatewayConfig.mode === 'meta_cloud' ? '#0F766E' : 'divider',
                                    bgcolor: gatewayConfig.mode === 'meta_cloud' ? 'rgba(15, 118, 110, 0.04)' : 'transparent'
                                }}
                            >
                                <FormControlLabel
                                    value="meta_cloud"
                                    control={<Radio size="small" sx={{ color: '#0F766E', '&.Mui-checked': { color: '#0F766E' } }} />}
                                    label={
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 750 }}>
                                                Meta WhatsApp Cloud API (Graph API)
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Official Meta Business API for headless background dispatch without opening tabs.
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Paper>

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2.5,
                                    border: '1.5px solid',
                                    borderColor: gatewayConfig.mode === 'webhook' ? '#0F766E' : 'divider',
                                    bgcolor: gatewayConfig.mode === 'webhook' ? 'rgba(15, 118, 110, 0.04)' : 'transparent'
                                }}
                            >
                                <FormControlLabel
                                    value="webhook"
                                    control={<Radio size="small" sx={{ color: '#0F766E', '&.Mui-checked': { color: '#0F766E' } }} />}
                                    label={
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 750 }}>
                                                Custom Webhook / QR Gateway (Evolution API / Baileys)
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Connect to your self-hosted WhatsApp server, microservice, or gateway provider.
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Paper>
                        </RadioGroup>
                    </FormControl>

                    {/* Meta Cloud Credentials Form */}
                    {gatewayConfig.mode === 'meta_cloud' && (
                        <Stack spacing={2} sx={{ mt: 1, p: 2, borderRadius: 2.5, bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid divider' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                Meta Graph API Parameters:
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                label="Phone Number ID *"
                                placeholder="e.g. 10459382910284"
                                value={gatewayConfig.metaPhoneNumberId}
                                onChange={(e) => setGatewayConfig({ ...gatewayConfig, metaPhoneNumberId: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                type="password"
                                label="Permanent Access Token *"
                                placeholder="EAAG..."
                                value={gatewayConfig.metaAccessToken}
                                onChange={(e) => setGatewayConfig({ ...gatewayConfig, metaAccessToken: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                label="WABA ID (Optional)"
                                placeholder="e.g. 39201948271049"
                                value={gatewayConfig.metaWabaId || ''}
                                onChange={(e) => setGatewayConfig({ ...gatewayConfig, metaWabaId: e.target.value })}
                            />
                        </Stack>
                    )}

                    {/* Webhook Gateway Credentials Form */}
                    {gatewayConfig.mode === 'webhook' && (
                        <Stack spacing={2} sx={{ mt: 1, p: 2, borderRadius: 2.5, bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid divider' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#042F2E' }}>
                                Gateway Microservice Endpoint:
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                label="Webhook / API Endpoint URL *"
                                placeholder="https://api.my-whatsapp-gateway.com/send-message"
                                value={gatewayConfig.webhookUrl}
                                onChange={(e) => setGatewayConfig({ ...gatewayConfig, webhookUrl: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                type="password"
                                label="API Secret / Bearer Key (Optional)"
                                placeholder="API key or auth token"
                                value={gatewayConfig.webhookApiKey}
                                onChange={(e) => setGatewayConfig({ ...gatewayConfig, webhookApiKey: e.target.value })}
                            />
                        </Stack>
                    )}

                    {/* Test Number */}
                    <Box sx={{ mt: 2.5 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Your Test Mobile Number (for Ping tests)"
                            placeholder="+91 9876543210"
                            value={gatewayConfig.testPhone}
                            onChange={(e) => setGatewayConfig({ ...gatewayConfig, testPhone: e.target.value })}
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setGatewayModalOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => handleSaveGatewayConfig(gatewayConfig)}
                        sx={{
                            fontWeight: 750,
                            px: 3,
                            borderRadius: 2.5,
                            background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)'
                        }}
                    >
                        Save Credentials
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ============================================================== */}
            {/* KEYWORD CREATE / EDIT DIALOG                                   */}
            {/* ============================================================== */}
            <Dialog
                open={editKeywordDialogOpen}
                onClose={() => setEditKeywordDialogOpen(false)}
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
                    {editingKeyword ? 'Edit Keyword Auto-Responder' : 'Add New Keyword Auto-Responder'}
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5 }}>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Inbound Trigger Keyword *"
                            placeholder="e.g. VIP, CATALOGUE, LOCATION"
                            value={keywordFormData.keyword}
                            onChange={(e) => setKeywordFormData({ ...keywordFormData, keyword: e.target.value.toUpperCase() })}
                        />
                        <TextField
                            fullWidth
                            label="Description (Internal)"
                            placeholder="e.g. Sends festive saree lookbook and wedding discount"
                            value={keywordFormData.description}
                            onChange={(e) => setKeywordFormData({ ...keywordFormData, description: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Automated WhatsApp Reply *"
                            placeholder="Type reply message... (You can use {store_name}, {customer_name})"
                            value={keywordFormData.response}
                            onChange={(e) => setKeywordFormData({ ...keywordFormData, response: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setEditKeywordDialogOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (!keywordFormData.keyword || !keywordFormData.response) return;
                            let updated;
                            if (editingKeyword) {
                                updated = keywordsList.map(k => k.id === editingKeyword.id ? { ...k, ...keywordFormData } : k);
                            } else {
                                const newKw = { ...keywordFormData, id: 'kw_' + Date.now() };
                                updated = [...keywordsList, newKw];
                            }
                            setKeywordsList(updated);
                            localStorage.setItem('atelier_whatsapp_keywords', JSON.stringify(updated));
                            setEditKeywordDialogOpen(false);
                        }}
                        sx={{
                            fontWeight: 750,
                            px: 3,
                            borderRadius: 2.5,
                            background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)'
                        }}
                    >
                        Save Keyword Rule
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
