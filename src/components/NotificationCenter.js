import React, { useState, useEffect, useMemo } from 'react';
import {
    IconButton,
    Badge,
    Menu,
    Typography,
    Box,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
    Chip,
    Tooltip,
    Stack
} from '@mui/material';
import {
    Notifications,
    NotificationsNone,
    Warning,
    ErrorOutline,
    Info,
    ChevronRight,
    DoneAll,
    CheckCircleOutline,
    RadioButtonUnchecked,
    DeleteOutline
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';

const READ_STORAGE_KEY = 'aleen_read_notifications';
const CLEARED_STORAGE_KEY = 'aleen_cleared_notifications';

const NotificationCenter = () => {
    const { inventory = [] } = useData();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'

    // Read notification IDs from localStorage
    const [readIds, setReadIds] = useState(() => {
        try {
            const saved = localStorage.getItem(READ_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Cleared notification IDs from localStorage
    const [clearedIds, setClearedIds] = useState(() => {
        try {
            const saved = localStorage.getItem(CLEARED_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Generate notification list from inventory & atelier alerts
    const allNotifications = useMemo(() => {
        const list = [];

        // Low stock and out-of-stock items
        inventory.forEach((item) => {
            const qty = Number(item.quantity) || 0;
            const notifId = `low-stock-${item.id || item.sku || item.name}`;

            if (clearedIds.includes(notifId)) return;

            if (qty === 0) {
                list.push({
                    id: notifId,
                    type: 'error',
                    title: 'Out of Stock',
                    message: `${item.name} is completely depleted. Reorder needed.`,
                    category: 'Inventory',
                    time: 'Urgent',
                    isRead: readIds.includes(notifId),
                    action: () => navigate('/inventory'),
                    icon: <ErrorOutline sx={{ color: '#EF4444' }} />
                });
            } else if (qty <= 2) {
                list.push({
                    id: notifId,
                    type: 'warning',
                    title: 'Low Stock Alert',
                    message: `${item.name} has only ${qty} piece${qty > 1 ? 's' : ''} remaining in atelier.`,
                    category: 'Inventory',
                    time: 'Stock alert',
                    isRead: readIds.includes(notifId),
                    action: () => navigate('/inventory'),
                    icon: <Warning sx={{ color: '#F59E0B' }} />
                });
            }
        });

        return list;
    }, [inventory, readIds, clearedIds, navigate]);

    // Unread count
    const unreadCount = useMemo(() => {
        return allNotifications.filter(n => !n.isRead).length;
    }, [allNotifications]);

    // Notifications to show based on filter
    const displayedNotifications = useMemo(() => {
        if (activeTab === 'unread') {
            return allNotifications.filter(n => !n.isRead);
        }
        return allNotifications;
    }, [allNotifications, activeTab]);

    const handleClick = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    // Mark all currently available notifications as read
    const handleMarkAllAsRead = (e) => {
        if (e) e.stopPropagation();
        const currentIds = allNotifications.map(n => n.id);
        const updated = Array.from(new Set([...readIds, ...currentIds]));
        setReadIds(updated);
        try {
            localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
            console.error('Failed to save read notifications', err);
        }
    };

    // Toggle single notification read status
    const handleToggleSingleRead = (id, e) => {
        if (e) e.stopPropagation();
        let updated;
        if (readIds.includes(id)) {
            updated = readIds.filter(x => x !== id);
        } else {
            updated = [...readIds, id];
        }
        setReadIds(updated);
        try {
            localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
            console.error('Failed to update read notification', err);
        }
    };

    // Clear all alerts
    const handleClearAll = (e) => {
        if (e) e.stopPropagation();
        const currentIds = allNotifications.map(n => n.id);
        const updated = Array.from(new Set([...clearedIds, ...currentIds]));
        setClearedIds(updated);
        try {
            localStorage.setItem(CLEARED_STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
            console.error('Failed to clear notifications', err);
        }
    };

    // Handle item click: mark read and execute action
    const handleItemClick = (notif) => {
        if (!notif.isRead) {
            const updated = Array.from(new Set([...readIds, notif.id]));
            setReadIds(updated);
            try {
                localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
            } catch (err) {
                console.error(err);
            }
        }
        if (notif.action) notif.action();
        handleClose();
    };

    const open = Boolean(anchorEl);

    return (
        <Box>
            <Tooltip title={unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : "Notifications"}>
                <IconButton
                    color="inherit"
                    onClick={handleClick}
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '9px',
                        border: '1px solid rgba(15, 118, 110, 0.15)',
                        color: unreadCount > 0 ? '#0F766E' : 'text.primary',
                        bgcolor: unreadCount > 0 ? 'rgba(15, 118, 110, 0.06)' : 'transparent',
                        '&:hover': {
                            bgcolor: 'rgba(15, 118, 110, 0.1)'
                        }
                    }}
                >
                    <Badge
                        badgeContent={unreadCount}
                        color="error"
                        max={99}
                        sx={{
                            '& .MuiBadge-badge': {
                                fontSize: '0.68rem',
                                height: 18,
                                minWidth: 18,
                                px: 0.5,
                                fontWeight: 800,
                                bgcolor: '#EF4444'
                            }
                        }}
                    >
                        {unreadCount > 0 ? <Notifications fontSize="small" /> : <NotificationsNone fontSize="small" />}
                    </Badge>
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        width: { xs: 320, sm: 380 },
                        maxHeight: 480,
                        borderRadius: 3,
                        mt: 1.5,
                        boxShadow: '0 16px 40px rgba(15, 118, 110, 0.15), 0 4px 16px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(15, 118, 110, 0.12)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }
                }}
            >
                {/* Popover Header */}
                <Box sx={{ p: 2, pb: 1.5, bgcolor: 'background.paper' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary' }}>
                                Notifications
                            </Typography>
                            {unreadCount > 0 ? (
                                <Chip
                                    label={`${unreadCount} new`}
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                                        color: '#EF4444',
                                        border: '1px solid rgba(239, 68, 68, 0.2)'
                                    }}
                                />
                            ) : (
                                <Chip
                                    label="Caught up"
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.68rem',
                                        fontWeight: 700,
                                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                                        color: '#059669',
                                        border: '1px solid rgba(16, 185, 129, 0.2)'
                                    }}
                                />
                            )}
                        </Box>

                        {/* Read All Button */}
                        <Button
                            size="small"
                            variant="text"
                            startIcon={<DoneAll sx={{ fontSize: '1rem !important' }} />}
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0}
                            sx={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'none',
                                color: '#0F766E',
                                px: 1,
                                py: 0.35,
                                borderRadius: '6px',
                                '&:hover': { bgcolor: 'rgba(15, 118, 110, 0.08)' },
                                '&.Mui-disabled': { color: 'text.disabled' }
                            }}
                        >
                            Read all
                        </Button>
                    </Box>

                    {/* Filter tabs: All vs Unread */}
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip
                            label={`All (${allNotifications.length})`}
                            size="small"
                            clickable
                            onClick={() => setActiveTab('all')}
                            sx={{
                                height: 24,
                                fontSize: '0.72rem',
                                fontWeight: activeTab === 'all' ? 800 : 600,
                                bgcolor: activeTab === 'all' ? '#0F766E' : 'action.hover',
                                color: activeTab === 'all' ? '#FFFFFF' : 'text.secondary',
                                '&:hover': {
                                    bgcolor: activeTab === 'all' ? '#0D6860' : 'action.selected'
                                }
                            }}
                        />
                        <Chip
                            label={`Unread (${unreadCount})`}
                            size="small"
                            clickable
                            onClick={() => setActiveTab('unread')}
                            sx={{
                                height: 24,
                                fontSize: '0.72rem',
                                fontWeight: activeTab === 'unread' ? 800 : 600,
                                bgcolor: activeTab === 'unread' ? '#0F766E' : 'action.hover',
                                color: activeTab === 'unread' ? '#FFFFFF' : 'text.secondary',
                                '&:hover': {
                                    bgcolor: activeTab === 'unread' ? '#0D6860' : 'action.selected'
                                }
                            }}
                        />
                    </Stack>
                </Box>

                <Divider />

                {/* Notifications List */}
                <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 300 }}>
                    {displayedNotifications.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <CheckCircleOutline sx={{ fontSize: 44, color: '#10B981', mb: 1, opacity: 0.8 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {activeTab === 'unread' ? 'No unread notifications' : 'All caught up!'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                {activeTab === 'unread'
                                    ? 'You have read all active atelier notifications.'
                                    : 'There are no active stock or operational alerts right now.'}
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {displayedNotifications.map((notif) => (
                                <ListItem
                                    key={notif.id}
                                    button
                                    onClick={() => handleItemClick(notif)}
                                    sx={{
                                        px: 2,
                                        py: 1.25,
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: notif.isRead ? 'transparent' : 'rgba(15, 118, 110, 0.04)',
                                        transition: 'background-color 0.15s ease',
                                        '&:hover': {
                                            bgcolor: notif.isRead ? 'action.hover' : 'rgba(15, 118, 110, 0.09)'
                                        }
                                    }}
                                >
                                    {/* Icon */}
                                    <ListItemIcon sx={{ minWidth: 38 }}>
                                        {notif.icon}
                                    </ListItemIcon>

                                    {/* Title & Message */}
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        fontSize: '0.82rem',
                                                        fontWeight: notif.isRead ? 600 : 800,
                                                        color: notif.isRead ? 'text.secondary' : 'text.primary'
                                                    }}
                                                >
                                                    {notif.title}
                                                </Typography>
                                                {!notif.isRead && (
                                                    <Box
                                                        sx={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: '50%',
                                                            bgcolor: '#0F766E'
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: 'text.secondary',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    lineHeight: 1.4
                                                }}
                                            >
                                                {notif.message}
                                            </Typography>
                                        }
                                    />

                                    {/* Quick Toggle Read/Unread Icon */}
                                    <Tooltip title={notif.isRead ? "Mark as unread" : "Mark as read"}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleToggleSingleRead(notif.id, e)}
                                            sx={{
                                                ml: 1,
                                                color: notif.isRead ? 'text.disabled' : '#0F766E',
                                                '&:hover': { color: '#0F766E', bgcolor: 'rgba(15, 118, 110, 0.08)' }
                                            }}
                                        >
                                            {notif.isRead ? (
                                                <RadioButtonUnchecked sx={{ fontSize: '1rem' }} />
                                            ) : (
                                                <CheckCircleOutline sx={{ fontSize: '1.05rem' }} />
                                            )}
                                        </IconButton>
                                    </Tooltip>

                                    <ChevronRight fontSize="small" sx={{ color: 'text.disabled', ml: 0.5 }} />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>

                {/* Popover Footer */}
                {allNotifications.length > 0 && (
                    <>
                        <Divider />
                        <Box sx={{ p: 1, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper' }}>
                            <Button
                                size="small"
                                startIcon={<DeleteOutline sx={{ fontSize: '0.9rem !important' }} />}
                                onClick={handleClearAll}
                                sx={{
                                    fontSize: '0.72rem',
                                    color: 'text.secondary',
                                    textTransform: 'none',
                                    '&:hover': { color: 'error.main' }
                                }}
                            >
                                Clear all
                            </Button>

                            <Button
                                size="small"
                                onClick={() => { navigate('/inventory'); handleClose(); }}
                                sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: '#0F766E',
                                    textTransform: 'none'
                                }}
                            >
                                View Inventory
                            </Button>
                        </Box>
                    </>
                )}
            </Menu>
        </Box>
    );
};

export default NotificationCenter;
