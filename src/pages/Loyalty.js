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
    useTheme
} from '@mui/material';
import {
    EmojiEvents,
    Stars,
    TrendingUp,
    CardGiftcard,
    History,
    Redeem,
    Close,
    Cake,
    LocalOffer
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import GlassCard from '../components/GlassCard';

const Loyalty = () => {
    const { customers, redeemLoyaltyPoints, addBirthdayBonus } = useData();
    const theme = useTheme();
    const [redeemDialog, setRedeemDialog] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [pointsToRedeem, setPointsToRedeem] = useState('');
    const [error, setError] = useState('');

    // Calculate tier statistics
    const tierStats = {
        Bronze: customers.filter(c => c.loyaltyTier === 'Bronze').length,
        Silver: customers.filter(c => c.loyaltyTier === 'Silver').length,
        Gold: customers.filter(c => c.loyaltyTier === 'Gold').length,
        Platinum: customers.filter(c => c.loyaltyTier === 'Platinum').length
    };

    const totalPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
    const activeMembers = customers.filter(c => (c.loyaltyPoints || 0) > 0).length;

    const getTierColor = (tier) => {
        switch (tier) {
            case 'Bronze': return '#CD7F32';
            case 'Silver': return '#C0C0C0';
            case 'Gold': return '#FFD700';
            case 'Platinum': return '#E5E4E2';
            default: return '#9E9E9E';
        }
    };

    const getTierBenefits = (tier) => {
        switch (tier) {
            case 'Bronze': return '1x points earning';
            case 'Silver': return '1.25x points earning';
            case 'Gold': return '1.5x points + early sale access';
            case 'Platinum': return '2x points + exclusive offers';
            default: return '';
        }
    };

    const getTierProgress = (customer) => {
        const spent = customer.totalSpent || 0;
        if (spent >= 100000) return { next: 'Max Tier', progress: 100 };
        if (spent >= 50000) return { next: 'Platinum (₹100,000)', progress: (spent / 100000) * 100 };
        if (spent >= 25000) return { next: 'Gold (₹50,000)', progress: (spent / 50000) * 100 };
        return { next: 'Silver (₹25,000)', progress: (spent / 25000) * 100 };
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
            if (points > selectedCustomer.loyaltyPoints) {
                setError('Insufficient points');
                return;
            }

            await redeemLoyaltyPoints(selectedCustomer.id, points);
            setRedeemDialog(false);
            setSelectedCustomer(null);
            setPointsToRedeem('');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleBirthdayBonus = async (customerId) => {
        try {
            await addBirthdayBonus(customerId, 100);
            alert('Birthday bonus of 100 points added successfully!');
        } catch (err) {
            alert('Error adding birthday bonus: ' + err.message);
        }
    };

    // Top loyalty members
    const topMembers = [...customers]
        .sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))
        .slice(0, 10);

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                    Loyalty Program
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Manage customer rewards and tier benefits
                </Typography>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard sx={{ height: '100%', p: 0 }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: 'primary.main' }} />
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>
                                    Total Points
                                </Typography>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(136, 14, 79, 0.1)' }}>
                                    <Stars sx={{ color: 'primary.main', fontSize: 20 }} />
                                </Box>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                {totalPoints.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard sx={{ height: '100%', p: 0 }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: '#059669' }} />
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>
                                    Active Members
                                </Typography>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(5, 150, 105, 0.1)' }}>
                                    <TrendingUp sx={{ color: '#059669', fontSize: 20 }} />
                                </Box>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                {activeMembers}
                            </Typography>
                        </CardContent>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard sx={{ height: '100%', p: 0 }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: '#D97706' }} />
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>
                                    Platinum Members
                                </Typography>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(217, 119, 6, 0.1)' }}>
                                    <EmojiEvents sx={{ color: '#D97706', fontSize: 20 }} />
                                </Box>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                {tierStats.Platinum}
                            </Typography>
                        </CardContent>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard sx={{ height: '100%', p: 0 }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: '#7C3AED' }} />
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>
                                    Gold Members
                                </Typography>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(124, 58, 237, 0.1)' }}>
                                    <CardGiftcard sx={{ color: '#7C3AED', fontSize: 20 }} />
                                </Box>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                {tierStats.Gold}
                            </Typography>
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* Tier Distribution */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <GlassCard sx={{ p: 3, height: '100%' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'primary.main' }}>
                            Tier Distribution
                        </Typography>
                        {['Platinum', 'Gold', 'Silver', 'Bronze'].map((tier) => (
                            <Box key={tier} sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <EmojiEvents sx={{ fontSize: 20, color: getTierColor(tier) }} />
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {tier}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                        {tierStats[tier]} members
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={(tierStats[tier] / customers.length) * 100}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: `${getTierColor(tier)}20`,
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: getTierColor(tier),
                                            borderRadius: 4
                                        }
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontWeight: 500 }}>
                                    {getTierBenefits(tier)}
                                </Typography>
                            </Box>
                        ))}
                    </GlassCard>
                </Grid>

                <Grid item xs={12} md={6}>
                    <GlassCard sx={{ p: 3, height: '100%' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'primary.main' }}>
                            Program Rules
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(136, 14, 79, 0.05)' }}>
                                    <LocalOffer sx={{ color: 'primary.main', fontSize: 20 }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        Earning Points
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        ₹100 spent = 1 point
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(136, 14, 79, 0.05)' }}>
                                    <Redeem sx={{ color: 'primary.main', fontSize: 20 }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        Redeeming Points
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        100 points = ₹100 discount
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(136, 14, 79, 0.05)' }}>
                                    <Cake sx={{ color: 'primary.main', fontSize: 20 }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        Birthday Bonus
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        100 bonus points on birthday
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(136, 14, 79, 0.05)' }}>
                                    <History sx={{ color: 'primary.main', fontSize: 20 }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        Points Expiry
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        Points expire after 1 year
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* Top Loyalty Members */}
            <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Top Loyalty Members
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Customers with the highest loyalty points
                    </Typography>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rank</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tier</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Points</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Spent</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }} align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {topMembers.map((customer, index) => {
                                const progress = getTierProgress(customer);
                                return (
                                    <TableRow key={customer.id} hover>
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
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ bgcolor: getTierColor(customer.loyaltyTier), width: 36, height: 36, fontSize: '0.875rem' }}>
                                                    {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </Avatar>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 600 }}>{customer.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{customer.phone}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={<EmojiEvents sx={{ fontSize: '16px !important' }} />}
                                                label={customer.loyaltyTier}
                                                size="small"
                                                sx={{
                                                    bgcolor: `${getTierColor(customer.loyaltyTier)}20`,
                                                    color: getTierColor(customer.loyaltyTier),
                                                    fontWeight: 700,
                                                    border: `1px solid ${getTierColor(customer.loyaltyTier)}40`
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                {(customer.loyaltyPoints || 0).toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                ₹{(customer.totalSpent || 0).toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ minWidth: 120 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                    Next: {progress.next}
                                                </Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={progress.progress}
                                                    sx={{
                                                        height: 6,
                                                        borderRadius: 3,
                                                        bgcolor: 'rgba(0,0,0,0.08)',
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: getTierColor(customer.loyaltyTier),
                                                            borderRadius: 3
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Redeem Points">
                                                <IconButton size="small" onClick={() => handleRedeemOpen(customer)} sx={{ color: 'primary.main' }}>
                                                    <Redeem fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Birthday Bonus">
                                                <IconButton size="small" onClick={() => handleBirthdayBonus(customer.id)} sx={{ color: '#F59E0B' }}>
                                                    <Cake fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </GlassCard>

            {/* Redeem Points Dialog */}
            <Dialog open={redeemDialog} onClose={() => setRedeemDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Redeem Points
                    </Typography>
                    <IconButton onClick={() => setRedeemDialog(false)} size="small">
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {selectedCustomer && (
                        <Box>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                <Typography variant="body2">
                                    <strong>{selectedCustomer.name}</strong> has <strong>{selectedCustomer.loyaltyPoints}</strong> points available
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    1 point = ₹1 discount
                                </Typography>
                            </Alert>
                            <TextField
                                fullWidth
                                label="Points to Redeem"
                                type="number"
                                value={pointsToRedeem}
                                onChange={(e) => setPointsToRedeem(e.target.value)}
                                error={!!error}
                                helperText={error || `Maximum: ${selectedCustomer.loyaltyPoints} points`}
                                InputProps={{
                                    inputProps: { min: 0, max: selectedCustomer.loyaltyPoints }
                                }}
                            />
                            {pointsToRedeem && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        Discount Amount: ₹{parseInt(pointsToRedeem || 0).toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Remaining Points: {selectedCustomer.loyaltyPoints - parseInt(pointsToRedeem || 0)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setRedeemDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleRedeemPoints} disabled={!pointsToRedeem}>
                        Redeem Points
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Loyalty;
