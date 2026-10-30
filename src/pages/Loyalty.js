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
    Chip,
    Avatar,
    LinearProgress,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    IconButton,
    Tooltip,
    TablePagination,
    Divider,
    InputAdornment,
    Switch,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    EmojiEvents,
    Stars,
    TrendingUp,
    History,
    Redeem,
    Close,
    Cake,
    LocalOffer,
    WorkspacePremium,
    Settings,
    CardGiftcard,
    Save
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import ClienteleNavTabs from '../components/crm/ClienteleNavTabs';
import { useFeedback } from '../contexts/FeedbackContext';

const Loyalty = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { customers, redeemLoyaltyPoints, addBirthdayBonus, loyaltySettings, updateLoyaltySettings, addCustomLoyaltyPoints } = useData();
    const { showToast } = useFeedback();
    const [redeemDialog, setRedeemDialog] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [pointsToRedeem, setPointsToRedeem] = useState('');
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Settings panel state
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsForm, setSettingsForm] = useState(null); // loaded when panel opens
    const [settingsSaving, setSettingsSaving] = useState(false);

    // Award custom points dialog state
    const [awardDialog, setAwardDialog] = useState(false);
    const [awardCustomer, setAwardCustomer] = useState(null);
    const [awardPoints, setAwardPoints] = useState('');
    const [awardReason, setAwardReason] = useState('');
    const [awardStart, setAwardStart] = useState('');
    const [awardExpiry, setAwardExpiry] = useState('');
    const [awardError, setAwardError] = useState('');
    const [awardSaving, setAwardSaving] = useState(false);

    // Calculate tier statistics
    const tierStats = {
        Bronze: customers.filter(c => c.loyaltyTier === 'Bronze' || !c.loyaltyTier).length,
        Silver: customers.filter(c => c.loyaltyTier === 'Silver').length,
        Gold: customers.filter(c => c.loyaltyTier === 'Gold').length,
        Platinum: customers.filter(c => c.loyaltyTier === 'Platinum').length
    };

    const totalPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
    const activeMembers = customers.filter(c => (c.loyaltyPoints || 0) > 0).length;

    const getTierColor = (tier) => {
        switch (tier) {
            case 'Bronze': return '#B45309';
            case 'Silver': return '#64748B';
            case 'Gold': return '#D97706';
            case 'Platinum': return '#0F766E';
            default: return '#9E9E9E';
        }
    };

    const getTierBenefits = (tier) => {
        const mult = tier === 'Platinum' ? (loyaltySettings?.platinumMultiplier ?? loyaltySettings?.tierMultipliers?.Platinum ?? 2)
            : tier === 'Gold' ? (loyaltySettings?.goldMultiplier ?? loyaltySettings?.tierMultipliers?.Gold ?? 1.5)
            : tier === 'Silver' ? (loyaltySettings?.silverMultiplier ?? loyaltySettings?.tierMultipliers?.Silver ?? 1.25)
            : (loyaltySettings?.bronzeMultiplier ?? loyaltySettings?.tierMultipliers?.Bronze ?? 1);

        switch (tier) {
            case 'Bronze': return `${mult}x points accrual on regular billing`;
            case 'Silver': return `${mult}x points + seasonal preview invitations`;
            case 'Gold': return `${mult}x points + priority atelier fitting slots`;
            case 'Platinum': return `${mult}x points + bespoke home consultations & private previews`;
            default: return `${mult}x points`;
        }
    };

    const getTierProgress = (customer) => {
        const spent = customer.totalSpent || 0;
        if (spent >= 100000) return { next: 'Haute Elite (Max Tier)', progress: 100 };
        if (spent >= 50000) return { next: 'Platinum (₹1,00,000)', progress: Math.min(100, (spent / 100000) * 100) };
        if (spent >= 25000) return { next: 'Gold (₹50,000)', progress: Math.min(100, (spent / 50000) * 100) };
        return { next: 'Silver (₹25,000)', progress: Math.min(100, (spent / 25000) * 100) };
    };

    const handleRedeemOpen = (customer) => {
        setSelectedCustomer(customer);
        setPointsToRedeem('');
        setError('');
        setRedeemDialog(true);
    };

    const handleRedeemPoints = async () => {
        try {
            const points = parseInt(pointsToRedeem);
            if (isNaN(points) || points <= 0) {
                setError('Please enter a valid number of points');
                return;
            }
            if (points > (selectedCustomer.loyaltyPoints || 0)) {
                setError('Insufficient points available in client balance');
                return;
            }

            await redeemLoyaltyPoints(selectedCustomer.id, points);
            setRedeemDialog(false);
            setSelectedCustomer(null);
            setPointsToRedeem('');
            showToast(`Successfully redeemed ${points} points for ${selectedCustomer.name}. ₹${points} credit applied!`, 'success');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleBirthdayBonus = async (customer) => {
        try {
            await addBirthdayBonus(customer.id, 100);
            showToast(`Birthday bonus of 100 points credited to ${customer.name}'s account!`, 'success');
        } catch (err) {
            showToast('Error adding birthday bonus: ' + err.message, 'error');
        }
    };

    // Settings panel handlers
    const handleSettingsOpen = () => {
        setSettingsForm({
            spendPerPoint: loyaltySettings?.spendPerPoint ?? 100,
            pointsRedeemRate: loyaltySettings?.pointsRedeemRate ?? 1.0,
            bronzeMultiplier: loyaltySettings?.bronzeMultiplier ?? loyaltySettings?.tierMultipliers?.Bronze ?? 1,
            silverMultiplier: loyaltySettings?.silverMultiplier ?? loyaltySettings?.tierMultipliers?.Silver ?? 1.25,
            goldMultiplier: loyaltySettings?.goldMultiplier ?? loyaltySettings?.tierMultipliers?.Gold ?? 1.5,
            platinumMultiplier: loyaltySettings?.platinumMultiplier ?? loyaltySettings?.tierMultipliers?.Platinum ?? 2,
            programStartDate: loyaltySettings?.programStartDate ?? '',
            programExpiryDate: loyaltySettings?.programExpiryDate ?? '',
            pointsExpiryDays: loyaltySettings?.pointsExpiryDays ?? 365,
            enabled: loyaltySettings?.enabled !== false
        });
        setSettingsOpen(true);
    };

    const handleSettingsSave = async () => {
        if (!settingsForm.spendPerPoint || Number(settingsForm.spendPerPoint) <= 0) {
            showToast('Spend per point must be greater than 0', 'error');
            return;
        }
        setSettingsSaving(true);
        try {
            await updateLoyaltySettings({
                spendPerPoint: Number(settingsForm.spendPerPoint),
                pointsRedeemRate: Math.max(0, parseFloat(settingsForm.pointsRedeemRate) || 1.0),
                bronzeMultiplier: Number(settingsForm.bronzeMultiplier),
                silverMultiplier: Number(settingsForm.silverMultiplier),
                goldMultiplier: Number(settingsForm.goldMultiplier),
                platinumMultiplier: Number(settingsForm.platinumMultiplier),
                programStartDate: settingsForm.programStartDate || '',
                programExpiryDate: settingsForm.programExpiryDate || '',
                pointsExpiryDays: Number(settingsForm.pointsExpiryDays) || 365,
                enabled: Boolean(settingsForm.enabled)
            });
            showToast('Loyalty program settings saved successfully and synchronized across platform!', 'success');
            setSettingsOpen(false);
        } catch (err) {
            showToast('Error saving settings: ' + err.message, 'error');
        }
        setSettingsSaving(false);
    };

    // Award custom points handlers
    const handleAwardOpen = (customer) => {
        setAwardCustomer(customer);
        setAwardPoints('');
        setAwardReason('');
        setAwardStart('');
        setAwardExpiry('');
        setAwardError('');
        setAwardDialog(true);
    };

    const handleAwardPoints = async () => {
        const pts = parseInt(awardPoints);
        if (isNaN(pts) || pts <= 0) { setAwardError('Enter a valid points amount'); return; }
        if (!awardReason.trim()) { setAwardError('Please enter a reason for awarding points'); return; }
        setAwardSaving(true);
        try {
            await addCustomLoyaltyPoints(
                awardCustomer.id,
                pts,
                awardReason.trim(),
                awardStart || null,
                awardExpiry || null
            );
            showToast(`${pts} loyalty points credited to ${awardCustomer.name}!`, 'success');
            setAwardDialog(false);
        } catch (err) {
            setAwardError(err.message);
        }
        setAwardSaving(false);
    };

    // Sorted loyalty patrons
    const sortedMembers = [...customers]
        .sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0));

    // Sanitized initials helper for boutique patrons
    const getInitials = (name) => {
        if (!name) return 'CL';
        const cleanName = name.replace(/[^a-zA-Z\s]/g, ' ').trim();
        const parts = cleanName.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return (parts[0] ? parts[0].slice(0, 2) : 'CL').toUpperCase();
    };

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1.5, sm: 2.5, md: 3 } }}>
            {/* Atelier Page Header */}
            <PageHeader
                title="VIP Loyalty & Atelier Privileges"
                subtitle="Manage tier progression, reward point accruals, birthday credits, and bespoke privileges"
                actions={
                    <Button
                        variant="contained"
                        startIcon={<Settings />}
                        onClick={handleSettingsOpen}
                        size="small"
                        sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none', px: 2.5 }}
                    >
                        Program Settings
                    </Button>
                }
            />

            {/* Clientele & CRM Tab Switcher */}
            <ClienteleNavTabs />

            {/* 4 Atelier Intelligence KPIs: Responsive 2x2 Grid on Mobile, 4 Columns on Desktop */}
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Circulating Points"
                        value={totalPoints.toLocaleString()}
                        subtitle="Total redeemable points balance"
                        icon={<Stars />}
                        color="warning"
                    />
                </Grid>

                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Active Privilege Members"
                        value={activeMembers.toLocaleString()}
                        subtitle="Clients with active point balances"
                        icon={<TrendingUp />}
                        color="success"
                        delta={{
                            text: `${customers.length > 0 ? Math.round((activeMembers / customers.length) * 100) : 0}% Active`,
                            isPositive: true
                        }}
                    />
                </Grid>

                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Platinum Haute Tier"
                        value={tierStats.Platinum.toLocaleString()}
                        subtitle="Top spenders with bespoke privileges"
                        icon={<WorkspacePremium />}
                        color="primary"
                    />
                </Grid>

                <Grid item xs={6} sm={6} md={3}>
                    <AtelierKpiCard
                        title="Gold Privilege Tier"
                        value={tierStats.Gold.toLocaleString()}
                        subtitle="Frequent atelier couture patrons"
                        icon={<EmojiEvents />}
                        color="warning"
                    />
                </Grid>
            </Grid>

            {/* Tier Distribution & Program Rules */}
            <Grid container spacing={3} sx={{ mb: 3.5 }}>
                {/* Tier Breakdown */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            height: '100%',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2.5, color: 'text.primary' }}>
                            Membership Tier Hierarchy
                        </Typography>
                        {['Platinum', 'Gold', 'Silver', 'Bronze'].map((tier) => (
                            <Box key={tier} sx={{ mb: 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <EmojiEvents sx={{ fontSize: 18, color: getTierColor(tier) }} />
                                        <Typography variant="body2" sx={{ fontWeight: 750, color: 'text.primary' }}>
                                            {tier} Tier
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main }}>
                                        {tierStats[tier]} {tierStats[tier] === 1 ? 'member' : 'members'}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={customers.length > 0 ? (tierStats[tier] / customers.length) * 100 : 0}
                                    sx={{
                                        height: 7,
                                        borderRadius: 4,
                                        bgcolor: 'rgba(0,0,0,0.04)',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: getTierColor(tier),
                                            borderRadius: 4
                                        }
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    {getTierBenefits(tier)}
                                </Typography>
                            </Box>
                        ))}
                    </Paper>
                </Grid>

                {/* Program Rules */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            height: '100%',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2.5, color: 'text.primary' }}>
                            Privilege Program Architecture
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)' }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)', color: (t) => t.palette.primary.main }}>
                                    <LocalOffer sx={{ fontSize: 20 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 750, color: 'text.primary' }}>
                                        Reward Accrual Rate
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        ₹{loyaltySettings?.spendPerPoint ?? 100} invoiced spend = 1 Loyalty Point automatically credited to guest wallet
                                    </Typography>
                                </Box>
                                <Chip
                                    label={`₹${loyaltySettings?.spendPerPoint ?? 100}/pt`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(217, 119, 6, 0.04)' }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(217, 119, 6, 0.12)', color: '#D97706' }}>
                                    <Redeem sx={{ fontSize: 20 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 750, color: 'text.primary' }}>
                                        Direct Checkout Redemption
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        1 Point = ₹{loyaltySettings?.pointsRedeemRate ?? 1} immediate discount deduction against any bespoke couture invoice
                                    </Typography>
                                </Box>
                                <Chip
                                    label={`1 pt = ₹${loyaltySettings?.pointsRedeemRate ?? 1}`}
                                    size="small"
                                    sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: 'rgba(217, 119, 6, 0.12)', color: '#D97706', border: '1px solid rgba(217, 119, 6, 0.3)' }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(16, 185, 129, 0.04)' }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
                                    <Cake sx={{ fontSize: 20 }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 750, color: 'text.primary' }}>
                                        Annual Birthday Gift Credit
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        100 Bonus Privileges automatically gifted during the patron's celebration month
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(100, 116, 139, 0.04)' }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(100, 116, 139, 0.12)', color: '#64748B' }}>
                                    <History sx={{ fontSize: 20 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 750, color: 'text.primary' }}>
                                        Points Validity & Expiry
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Reward points remain active for {loyaltySettings?.pointsExpiryDays ?? 365} days from date of accrual
                                    </Typography>
                                    {(loyaltySettings?.programStartDate || loyaltySettings?.programExpiryDate) && (
                                        <Typography variant="caption" sx={{ display: 'block', color: 'primary.main', fontWeight: 700, mt: 0.2 }}>
                                            Active Schedule: {loyaltySettings.programStartDate || 'Launch'} to {loyaltySettings.programExpiryDate || 'Continuous'}
                                        </Typography>
                                    )}
                                </Box>
                                <Chip
                                    label={loyaltySettings?.enabled === false ? 'PAUSED' : 'ACTIVE'}
                                    size="small"
                                    color={loyaltySettings?.enabled === false ? 'default' : 'success'}
                                    sx={{ fontWeight: 800, fontSize: '0.68rem', height: 22 }}
                                />
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Top Loyalty Patrons Table */}
            {/* Top Loyalty Patrons Table */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: '20px',
                    border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.14)',
                    overflow: 'hidden',
                    boxShadow: (t) => t.palette.mode === 'dark'
                        ? '0 10px 30px rgba(0, 0, 0, 0.4)'
                        : '0 10px 30px -10px rgba(var(--primary-rgb, 15, 118, 110), 0.08), 0 1px 3px rgba(0, 0, 0, 0.03)'
                }}
            >
                <Box sx={{ px: 3, py: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 118, 110, 0.03)', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        Clientele Loyalty Leaderboard & Privilege Balances
                    </Typography>
                </Box>

                <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <Table sx={{ minWidth: 680 }}>
                        <TableHead sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', width: 70 }} align="center">Rank</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Client Details</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }} align="center">Membership Tier</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }} align="right">Available Points</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }} align="right">Lifetime Spend</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Next Tier Target</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em' }} align="right">Privilege Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedMembers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        No loyalty members registered yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedMembers
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((customer, index) => {
                                        const globalRank = page * rowsPerPage + index + 1;
                                        const progress = getTierProgress(customer);
                                        const tier = customer.loyaltyTier || 'Bronze';

                                        return (
                                            <TableRow key={customer.id} hover sx={{ '&:hover': { bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.02)' } }}>
                                                {/* Rank */}
                                                <TableCell align="center">
                                                    <Chip
                                                        label={`#${globalRank}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: globalRank === 1 ? '#D97706' : globalRank === 2 ? '#64748B' : globalRank === 3 ? '#B45309' : 'rgba(0,0,0,0.06)',
                                                            color: globalRank <= 3 ? '#FFFFFF' : 'text.primary',
                                                            fontWeight: 800,
                                                            fontSize: '0.72rem'
                                                        }}
                                                    />
                                                </TableCell>

                                                {/* Client Name & Avatar */}
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Avatar 
                                                            sx={{ 
                                                                bgcolor: getTierColor(tier), 
                                                                background: tier === 'Platinum' 
                                                                    ? 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)' 
                                                                    : tier === 'Gold' 
                                                                        ? 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)' 
                                                                        : tier === 'Silver' 
                                                                            ? 'linear-gradient(135deg, #94A3B8 0%, #475569 100%)' 
                                                                            : 'linear-gradient(135deg, #B45309 0%, #78350F 100%)',
                                                                color: '#FFFFFF',
                                                                width: 40, 
                                                                height: 40, 
                                                                fontSize: '0.88rem',
                                                                fontWeight: 800,
                                                                boxShadow: `0 4px 12px ${getTierColor(tier)}35`,
                                                                border: '2px solid rgba(255, 255, 255, 0.85)'
                                                            }}
                                                        >
                                                            {getInitials(customer.name)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.9rem' }}>
                                                                {customer.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                                {customer.phone}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>

                                                {/* Tier */}
                                                <TableCell align="center">
                                                    <Chip
                                                        icon={<EmojiEvents sx={{ fontSize: '15px !important', color: `${getTierColor(tier)} !important` }} />}
                                                        label={tier}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: `${getTierColor(tier)}15`,
                                                            color: getTierColor(tier),
                                                            fontWeight: 800,
                                                            fontSize: '0.74rem',
                                                            border: `1px solid ${getTierColor(tier)}30`
                                                        }}
                                                    />
                                                </TableCell>

                                                {/* Available Points (Right Aligned) */}
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, fontSize: '0.95rem' }}>
                                                        {(customer.loyaltyPoints || 0).toLocaleString()} pts
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ₹{(customer.loyaltyPoints || 0).toLocaleString()} value
                                                    </Typography>
                                                </TableCell>

                                                {/* Lifetime Spend (Right Aligned) */}
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                        ₹{(customer.totalSpent || 0).toLocaleString('en-IN')}
                                                    </Typography>
                                                </TableCell>

                                                {/* Progress to Next Tier */}
                                                <TableCell>
                                                    <Box sx={{ minWidth: 140 }}>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                                            {progress.next}
                                                        </Typography>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={progress.progress}
                                                            sx={{
                                                                height: 6,
                                                                borderRadius: 3,
                                                                bgcolor: 'rgba(0,0,0,0.06)',
                                                                '& .MuiLinearProgress-bar': {
                                                                    bgcolor: getTierColor(tier),
                                                                    borderRadius: 3
                                                                }
                                                            }}
                                                        />
                                                    </Box>
                                                </TableCell>

                                                {/* Privilege Actions (Atelier Action Capsule Dock) */}
                                                <TableCell align="right">
                                                    <Box
                                                        sx={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 0.75,
                                                            p: '3px 6px',
                                                            borderRadius: (t) => `${t.shape?.borderRadius || 8}px`,
                                                            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(20, 184, 166, 0.08)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)',
                                                            border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(20, 184, 166, 0.2)' : '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.12)'
                                                        }}
                                                    >
                                                        <Tooltip title="Redeem Available Points">
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    disabled={!customer.loyaltyPoints || customer.loyaltyPoints <= 0}
                                                                    onClick={() => handleRedeemOpen(customer)}
                                                                    sx={{
                                                                        width: 30,
                                                                        height: 30,
                                                                        color: (t) => t.palette.primary.main,
                                                                        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                                                                        border: '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.2)',
                                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                                                        transition: 'all 0.18s ease',
                                                                        '&:hover:not(:disabled)': {
                                                                            bgcolor: (t) => t.palette.primary.main,
                                                                            color: '#FFFFFF',
                                                                            transform: 'translateY(-1px)',
                                                                            boxShadow: '0 4px 10px rgba(15, 118, 110, 0.3)'
                                                                        }
                                                                    }}
                                                                >
                                                                    <Redeem sx={{ fontSize: 15 }} />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                        <Tooltip title="Gift Birthday 100 Points Credit">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleBirthdayBonus(customer)}
                                                                sx={{
                                                                    width: 30,
                                                                    height: 30,
                                                                    color: '#D97706',
                                                                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                                                                    border: '1px solid rgba(217, 119, 6, 0.25)',
                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                                                    transition: 'all 0.18s ease',
                                                                    '&:hover': {
                                                                        bgcolor: '#D97706',
                                                                        color: '#FFFFFF',
                                                                        transform: 'translateY(-1px)',
                                                                        boxShadow: '0 4px 10px rgba(217, 119, 6, 0.3)'
                                                                    }
                                                                }}
                                                            >
                                                                <Cake sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Award Custom Loyalty Points">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleAwardOpen(customer)}
                                                                sx={{
                                                                    width: 30,
                                                                    height: 30,
                                                                    color: '#059669',
                                                                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                                                                    border: '1px solid rgba(5, 150, 105, 0.25)',
                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                                                    transition: 'all 0.18s ease',
                                                                    '&:hover': {
                                                                        bgcolor: '#059669',
                                                                        color: '#FFFFFF',
                                                                        transform: 'translateY(-1px)',
                                                                        boxShadow: '0 4px 10px rgba(5, 150, 105, 0.3)'
                                                                    }
                                                                }}
                                                            >
                                                                <CardGiftcard sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={sortedMembers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                />
            </Paper>

            {/* Redeem Points Dialog */}
            <Dialog 
                open={redeemDialog} 
                onClose={() => setRedeemDialog(false)} 
                maxWidth="xs" 
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4 } }}
            >
                <DialogTitle sx={{ 
                    fontWeight: 800, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    color: 'text.primary'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Redeem sx={{ color: (t) => t.palette.primary.main }} /> Redeem Privilege Points
                    </Box>
                    <IconButton onClick={() => setRedeemDialog(false)} size="small">
                        <Close fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5 }}>
                    {selectedCustomer && (
                        <Box>
                            <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                                <Typography variant="body2">
                                    <strong>{selectedCustomer.name}</strong> has <strong>{selectedCustomer.loyaltyPoints || 0}</strong> points available (₹{selectedCustomer.loyaltyPoints || 0} discount).
                                </Typography>
                            </Alert>
                            <TextField
                                fullWidth
                                label="Points to Redeem *"
                                type="number"
                                margin="normal"
                                value={pointsToRedeem}
                                onChange={(e) => setPointsToRedeem(e.target.value)}
                                error={!!error}
                                helperText={error || `Maximum: ${selectedCustomer.loyaltyPoints} points`}
                                InputProps={{
                                    inputProps: { min: 1, max: selectedCustomer.loyaltyPoints }
                                }}
                            />
                            {pointsToRedeem && parseInt(pointsToRedeem) > 0 && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(15, 118, 110, 0.06)', borderRadius: 2.5, border: '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.15)' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 750, color: (t) => t.palette.primary.main }}>
                                        Instant Invoice Discount: ₹{parseInt(pointsToRedeem || 0).toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Remaining Balance: {Math.max(0, (selectedCustomer.loyaltyPoints || 0) - parseInt(pointsToRedeem || 0))} points
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setRedeemDialog(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleRedeemPoints} 
                        disabled={!pointsToRedeem || parseInt(pointsToRedeem) <= 0}
                        sx={{ 
                            px: 3.5, 
                            borderRadius: 2.5, 
                            fontWeight: 700,
                            background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`
                        }}
                    >
                        Redeem Discount
                    </Button>
                </DialogActions>
            </Dialog>
            {/* ── Program Settings Dialog ── */}
            <Dialog
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, p: 0.5 } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: '#fff' }}><Settings sx={{ fontSize: 18 }} /></Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>Loyalty Program Settings</Typography>
                    </Box>
                    <IconButton onClick={() => setSettingsOpen(false)} size="small"><Close fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {settingsForm && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>Accrual Spend Rate</Typography>
                                    <TextField
                                        fullWidth
                                        label="Rupees spent per 1 point earned"
                                        type="number"
                                        size="small"
                                        value={settingsForm.spendPerPoint}
                                        onChange={(e) => setSettingsForm(p => ({ ...p, spendPerPoint: e.target.value }))}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                            endAdornment: <InputAdornment position="end">= 1 pt</InputAdornment>,
                                            inputProps: { min: 1 }
                                        }}
                                        helperText="e.g. 100 means ₹100 spent = 1 pt"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>Redemption Value</Typography>
                                    <TextField
                                        fullWidth
                                        label="Discount per 1 point redeemed"
                                        type="number"
                                        size="small"
                                        value={settingsForm.pointsRedeemRate}
                                        onChange={(e) => setSettingsForm(p => ({ ...p, pointsRedeemRate: e.target.value }))}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">1 pt = ₹</InputAdornment>,
                                            inputProps: { min: 0.1, step: 0.25 }
                                        }}
                                        helperText="e.g. 1 means 1 point = ₹1 discount"
                                    />
                                </Grid>
                            </Grid>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>Tier Point Multipliers</Typography>
                                <Grid container spacing={2}>
                                    {[['Bronze', 'bronzeMultiplier'], ['Silver', 'silverMultiplier'], ['Gold', 'goldMultiplier'], ['Platinum', 'platinumMultiplier']].map(([label, key]) => (
                                        <Grid item xs={6} key={key}>
                                            <TextField
                                                fullWidth
                                                label={`${label} multiplier`}
                                                type="number"
                                                size="small"
                                                value={settingsForm[key]}
                                                onChange={(e) => setSettingsForm(p => ({ ...p, [key]: e.target.value }))}
                                                InputProps={{ endAdornment: <InputAdornment position="end">×</InputAdornment>, inputProps: { min: 0.1, step: 0.25 } }}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary' }}>Program Validity & Expiry</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Points Validity Period (Days)"
                                            type="number"
                                            size="small"
                                            value={settingsForm.pointsExpiryDays}
                                            onChange={(e) => setSettingsForm(p => ({ ...p, pointsExpiryDays: e.target.value }))}
                                            InputProps={{ endAdornment: <InputAdornment position="end">Days</InputAdornment>, inputProps: { min: 30 } }}
                                            helperText="Earned points expire after this many days (e.g. 365 for 1 year)"
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Program Start Date"
                                            type="date"
                                            size="small"
                                            value={settingsForm.programStartDate}
                                            onChange={(e) => setSettingsForm(p => ({ ...p, programStartDate: e.target.value }))}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Program Expiry Date"
                                            type="date"
                                            size="small"
                                            value={settingsForm.programExpiryDate}
                                            onChange={(e) => setSettingsForm(p => ({ ...p, programExpiryDate: e.target.value }))}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                            <Divider />
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                        Loyalty Rewards Status
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Enable or pause loyalty accruals across all POS terminals
                                    </Typography>
                                </Box>
                                <Switch
                                    checked={Boolean(settingsForm.enabled)}
                                    onChange={(e) => setSettingsForm(p => ({ ...p, enabled: e.target.checked }))}
                                    color="primary"
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setSettingsOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>Cancel</Button>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSettingsSave}
                        disabled={settingsSaving}
                        sx={{ px: 3.5, borderRadius: 2.5, fontWeight: 700 }}
                    >
                        {settingsSaving ? 'Saving…' : 'Save Settings'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Award Custom Points Dialog ── */}
            <Dialog
                open={awardDialog}
                onClose={() => setAwardDialog(false)}
                maxWidth="xs"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4, p: 0.5 } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#059669', color: '#fff' }}><CardGiftcard sx={{ fontSize: 18 }} /></Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>Award Custom Points</Typography>
                            {awardCustomer && <Typography variant="caption" color="text.secondary">{awardCustomer.name}</Typography>}
                        </Box>
                    </Box>
                    <IconButton onClick={() => setAwardDialog(false)} size="small"><Close fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        {awardError && <Alert severity="error" sx={{ borderRadius: 2 }}>{awardError}</Alert>}
                        <TextField
                            fullWidth
                            autoFocus
                            label="Points to Award *"
                            type="number"
                            value={awardPoints}
                            onChange={(e) => { setAwardPoints(e.target.value); setAwardError(''); }}
                            InputProps={{ endAdornment: <InputAdornment position="end">pts</InputAdornment>, inputProps: { min: 1 } }}
                        />
                        <TextField
                            fullWidth
                            label="Reason / Description *"
                            placeholder="e.g. Special event bonus, referral credit…"
                            value={awardReason}
                            onChange={(e) => { setAwardReason(e.target.value); setAwardError(''); }}
                            multiline
                            rows={2}
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Points Valid From"
                                    type="date"
                                    size="small"
                                    value={awardStart}
                                    onChange={(e) => setAwardStart(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    helperText="Optional"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Points Expire On"
                                    type="date"
                                    size="small"
                                    value={awardExpiry}
                                    onChange={(e) => setAwardExpiry(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    helperText="Optional"
                                />
                            </Grid>
                        </Grid>
                        {awardPoints && parseInt(awardPoints) > 0 && (
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(5, 150, 105, 0.06)', borderRadius: 2.5, border: '1px solid rgba(5, 150, 105, 0.2)' }}>
                                <Typography variant="body2" sx={{ fontWeight: 750, color: '#059669' }}>
                                    +{parseInt(awardPoints).toLocaleString()} pts → ₹{parseInt(awardPoints).toLocaleString()} credit value
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setAwardDialog(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>Cancel</Button>
                    <Button
                        variant="contained"
                        startIcon={<CardGiftcard />}
                        onClick={handleAwardPoints}
                        disabled={awardSaving || !awardPoints || !awardReason.trim()}
                        sx={{ px: 3.5, borderRadius: 2.5, fontWeight: 700, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                    >
                        {awardSaving ? 'Awarding…' : 'Award Points'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Loyalty;
