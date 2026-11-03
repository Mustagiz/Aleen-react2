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
    Stack,
    useTheme
} from '@mui/material';
import { useThemeContext } from '../contexts/ThemeContext';
import {
    Notifications,
    NotificationsNone,
    Warning,
    ErrorOutline,
    ChevronRight,
    DoneAll,
    CheckCircleOutline,
    RadioButtonUnchecked,
    DeleteOutline
} from './icons';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const STATE_STORAGE_KEY = 'aleen_notification_state';
const EMPTY_STATE = { read: {}, cleared: {} };

const loadStoredState = () => {
    try {
        const raw = localStorage.getItem(STATE_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return { read: parsed.read || {}, cleared: parsed.cleared || {} };
        }
    } catch (e) {}
    return EMPTY_STATE;
};

const normalizeKey = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

const formatNotificationTime = (iso) => {
    const ts = Date.parse(iso || '');
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const minutes = Math.floor((now.getTime() - ts) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
    if (date.toDateString() === now.toDateString()) return `Today · ${time}`;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`;
    return `${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · ${time}`;
};

// Best evidence for when an alert became true: the movement log that left the
// item at this quantity, otherwise when the stock row was created.
const getGroupAlertTime = (group, movementTimes) => {
    let best = 0;
    group.items.forEach((item) => {
        const entry = movementTimes.get(String(item?.id));
        let exact = 0;
        let atOrBelow = 0;
        if (entry) {
            entry.byQty.forEach((ts, qty) => {
                if (qty === group.qty) exact = Math.max(exact, ts);
                else if (qty < group.qty) atOrBelow = Math.max(atOrBelow, ts);
            });
        }
        best = Math.max(best, exact || atOrBelow || (Date.parse(item?.dateAdded || '') || 0));
    });
    return best ? new Date(best).toISOString() : '';
};

const NotificationCenter = ({ plain = false }) => {
    const theme = useTheme();
    const { activeSystemConfig } = useThemeContext() || {};
    const topBarConfig = theme.custom?.topBar || {
        isColored: false,
        textColor: theme.palette.mode === 'dark' ? '#F8FAFC' : '#0F172A'
    };
    const isDark = theme.palette.mode === 'dark';
    const { inventory = [], inventoryLogs = [] } = useData();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'

    // Read/cleared state is shared through Firestore so refreshing, reopening or
    // using another till keeps the same unread count. localStorage is the fast
    // first paint before the snapshot lands.
    const [notifState, setNotifState] = useState(loadStoredState);

    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, 'settings', 'notificationState'),
            (snap) => {
                if (!snap.exists()) return;
                const data = snap.data() || {};
                setNotifState((prev) => ({
                    read: { ...prev.read, ...(data.read || {}) },
                    cleared: { ...prev.cleared, ...(data.cleared || {}) }
                }));
            },
            (err) => console.warn('Notification state sync warning:', err)
        );
        return () => unsub();
    }, []);

    // Latest stock movement per product and resulting quantity
    const movementTimes = useMemo(() => {
        const byProduct = new Map();
        (inventoryLogs || []).forEach((log) => {
            const productId = String(log?.productId || '');
            const ts = Date.parse(log?.timestamp || '');
            const qty = Number(log?.newQuantity);
            if (!productId || !ts || !Number.isFinite(qty)) return;
            let entry = byProduct.get(productId);
            if (!entry) {
                entry = { byQty: new Map() };
                byProduct.set(productId, entry);
            }
            entry.byQty.set(qty, Math.max(entry.byQty.get(qty) || 0, ts));
        });
        return byProduct;
    }, [inventoryLogs]);

    // Inventory rows that share a name and quantity are one alert, so a bulk
    // import of 74 identical SKUs reads as "×74" instead of 74 duplicate rows.
    const alertGroups = useMemo(() => {
        const groups = new Map();
        (inventory || []).forEach((item) => {
            const qty = Number(item?.quantity) || 0;
            const min = Number(item?.minStockLevel) || 2;
            if (qty > min) return;
            const type = qty <= 0 ? 'error' : 'warning';
            const name = String(item?.name || 'Unnamed item').trim().replace(/\s+/g, ' ');
            const id = `${type}:${normalizeKey(name)}:${qty}`;
            let group = groups.get(id);
            if (!group) {
                group = { id, type, name, qty, items: [], skus: [] };
                groups.set(id, group);
            }
            group.items.push(item);
            const rawSku = String(item?.productId || item?.sku || '').trim().replace(/^#/, '');
            const sku = rawSku ? `#${rawSku.toUpperCase()}` : '';
            if (sku && !group.skus.includes(sku)) group.skus.push(sku);
        });
        return groups;
    }, [inventory]);

    // Generate notification list from inventory & atelier alerts
    const allNotifications = useMemo(() => {
        return Array.from(alertGroups.values())
            .filter((group) => !notifState.cleared[group.id])
            .map((group) => {
                const count = group.items.length;
                const isOut = group.qty <= 0;
                const skuLabel = count === 1 && group.skus[0] ? ` · ${group.skus[0]}` : '';
                const pieces = `piece${group.qty > 1 ? 's' : ''}`;
                const message = isOut
                    ? (count > 1
                        ? `${group.name} · ${count} SKUs are fully depleted in the atelier. Reorder now.`
                        : `${group.name}${skuLabel} is completely depleted. Reorder needed.`)
                    : (count > 1
                        ? `${group.name} · ${count} SKUs have only ${group.qty} ${pieces} left in the atelier.`
                        : `${group.name}${skuLabel} has only ${group.qty} ${pieces} remaining in the atelier.`);
                const timeIso = getGroupAlertTime(group, movementTimes);
                return {
                    id: group.id,
                    type: group.type,
                    title: isOut ? 'Out of Stock' : 'Low Stock Alert',
                    message,
                    category: 'Inventory',
                    count,
                    timeIso,
                    timeLabel: formatNotificationTime(timeIso),
                    isRead: Boolean(notifState.read[group.id]),
                    action: () => navigate('/inventory'),
                    icon: isOut
                        ? <ErrorOutline sx={{ color: '#EF4444' }} />
                        : <Warning sx={{ color: '#F59E0B' }} />
                };
            })
            .sort((a, b) => (Date.parse(b.timeIso) || 0) - (Date.parse(a.timeIso) || 0));
    }, [alertGroups, notifState, movementTimes, navigate]);

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

    const persistState = (next) => {
        setNotifState(next);
        try {
            localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(next));
        } catch (err) {}
        setDoc(doc(db, 'settings', 'notificationState'), next, { merge: true })
            .catch((err) => console.warn('Failed to sync notification state:', err));
    };

    // Mark all currently available notifications as read
    const handleMarkAllAsRead = (e) => {
        if (e) e.stopPropagation();
        const stamp = new Date().toISOString();
        const read = { ...notifState.read };
        allNotifications.forEach((n) => { read[n.id] = stamp; });
        persistState({ ...notifState, read });
    };

    // Toggle single notification read status
    const handleToggleSingleRead = (id, e) => {
        if (e) e.stopPropagation();
        const read = { ...notifState.read };
        if (read[id]) delete read[id];
        else read[id] = new Date().toISOString();
        persistState({ ...notifState, read });
    };

    // Clear all alerts
    const handleClearAll = (e) => {
        if (e) e.stopPropagation();
        const stamp = new Date().toISOString();
        const cleared = { ...notifState.cleared };
        allNotifications.forEach((n) => { cleared[n.id] = stamp; });
        persistState({ ...notifState, cleared });
    };

    // Handle item click: mark read and execute action
    const handleItemClick = (notif) => {
        if (!notif.isRead) {
            persistState({
                ...notifState,
                read: { ...notifState.read, [notif.id]: new Date().toISOString() }
            });
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
                    sx={ plain ? {
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: 'none',
                        color: unreadCount > 0 ? theme.palette.primary.main : 'text.secondary',
                        bgcolor: 'transparent',
                        '&:hover': {
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1EFFC',
                            color: theme.palette.primary.main
                        }
                    } : {
                        width: 36,
                        height: 36,
                        borderRadius: activeSystemConfig?.id === 'material' ? '50% !important' : `${activeSystemConfig?.shape?.buttonRadius || 6}px`,
                        border: activeSystemConfig?.id === 'material' ? 'none' : (topBarConfig.isColored ? '1px solid rgba(255, 255, 255, 0.35)' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)')),
                        color: topBarConfig.isColored 
                            ? '#FFFFFF' 
                            : (unreadCount > 0 ? theme.palette.primary.main : 'text.primary'),
                        bgcolor: topBarConfig.isColored 
                            ? (unreadCount > 0 ? 'rgba(255, 255, 255, 0.22)' : 'transparent') 
                            : (unreadCount > 0 ? `${theme.palette.primary.main}12` : (activeSystemConfig?.id === 'material' ? (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)') : 'transparent')),
                        '&:hover': {
                            bgcolor: activeSystemConfig?.id === 'material' ? (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)') : (topBarConfig.isColored ? 'rgba(255, 255, 255, 0.2)' : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'))
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
                        {unreadCount > 0 ? <Notifications fontSize="small" sx={{ color: topBarConfig.isColored ? '#FFFFFF' : 'inherit' }} /> : <NotificationsNone fontSize="small" sx={{ color: topBarConfig.isColored ? '#FFFFFF' : 'inherit' }} />}
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
                        maxWidth: 'calc(100vw - 28px)',
                        maxHeight: 480,
                        borderRadius: '14px',
                        mt: 1.5,
                        boxShadow: isDark
                            ? '0 16px 40px rgba(0, 0, 0, 0.5)'
                            : '0 16px 40px rgba(112, 114, 176, 0.18), 0 1px 3px rgba(31, 27, 46, 0.06)',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#EFEFF4'}`,
                        bgcolor: 'background.paper',
                        backgroundImage: 'none',
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
                                        bgcolor: isDark ? 'rgba(124, 111, 232, 0.2)' : 'rgba(124, 111, 232, 0.1)',
                                        color: isDark ? theme.palette.primary.light : '#5B4BD1',
                                        border: 'none'
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
                                        bgcolor: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.1)',
                                        color: isDark ? '#34D399' : '#059669',
                                        border: 'none'
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
                                color: (t) => t.palette.primary.main,
                                px: 1,
                                py: 0.35,
                                borderRadius: '6px',
                                '&:hover': { bgcolor: 'action.hover' },
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
                                height: 26,
                                px: 0.75,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                bgcolor: activeTab === 'all' ? (isDark ? 'rgba(124, 111, 232, 0.18)' : 'rgba(124, 111, 232, 0.1)') : 'transparent',
                                color: activeTab === 'all' ? (isDark ? theme.palette.primary.light : '#5B4BD1') : 'text.secondary',
                                border: 'none',
                                '&:hover': {
                                    bgcolor: activeTab === 'all' ? (isDark ? 'rgba(124, 111, 232, 0.24)' : 'rgba(124, 111, 232, 0.14)') : 'action.hover'
                                }
                            }}
                        />
                        <Chip
                            label={`Unread (${unreadCount})`}
                            size="small"
                            clickable
                            onClick={() => setActiveTab('unread')}
                            sx={{
                                height: 26,
                                px: 0.75,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                bgcolor: activeTab === 'unread' ? (isDark ? 'rgba(124, 111, 232, 0.18)' : 'rgba(124, 111, 232, 0.1)') : 'transparent',
                                color: activeTab === 'unread' ? (isDark ? theme.palette.primary.light : '#5B4BD1') : 'text.secondary',
                                border: 'none',
                                '&:hover': {
                                    bgcolor: activeTab === 'unread' ? (isDark ? 'rgba(124, 111, 232, 0.24)' : 'rgba(124, 111, 232, 0.14)') : 'action.hover'
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
                            <CheckCircleOutline sx={{ fontSize: 40, color: isDark ? '#34D399' : '#10B981', mb: 1, opacity: 0.8 }} />
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
                                        bgcolor: notif.isRead ? 'transparent' : (isDark ? 'rgba(124, 111, 232, 0.08)' : 'rgba(124, 111, 232, 0.04)'),
                                        transition: 'background-color 0.15s ease',
                                        '&:hover': {
                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : (notif.isRead ? 'action.hover' : 'rgba(124, 111, 232, 0.09)')
                                        }
                                    }}
                                >
                                    {/* Icon tile */}
                                    <ListItemIcon sx={{ minWidth: 0, mr: 1.5 }}>
                                        <Box sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: notif.type === 'error'
                                                ? (isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.1)')
                                                : (isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.14)'),
                                            '& svg': { fontSize: '1.05rem' }
                                        }}>
                                            {notif.icon}
                                        </Box>
                                    </ListItemIcon>

                                    {/* Title & Message */}
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        fontSize: '0.76rem',
                                                        fontWeight: notif.isRead ? 600 : 700,
                                                        color: notif.isRead ? 'text.secondary' : 'text.primary',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.04em'
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
                                                            bgcolor: (t) => t.palette.primary.main,
                                                            flexShrink: 0
                                                        }}
                                                    />
                                                )}
                                                {notif.count > 1 && (
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            px: 0.6,
                                                            borderRadius: '6px',
                                                            fontSize: '0.62rem',
                                                            fontWeight: 800,
                                                            lineHeight: 1.5,
                                                            letterSpacing: 0,
                                                            color: isDark ? theme.palette.primary.light : '#5B4BD1',
                                                            bgcolor: isDark ? 'rgba(124, 111, 232, 0.18)' : 'rgba(124, 111, 232, 0.1)'
                                                        }}
                                                    >
                                                        ×{notif.count}
                                                    </Box>
                                                )}
                                            </Box>
                                        }
                                        secondaryTypographyProps={{ component: 'div' }}
                                        secondary={
                                            <>
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
                                                {notif.timeLabel && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            display: 'block',
                                                            mt: 0.35,
                                                            fontSize: '0.66rem',
                                                            fontWeight: 600,
                                                            color: 'text.disabled',
                                                            letterSpacing: '0.01em'
                                                        }}
                                                    >
                                                        {notif.timeLabel}
                                                    </Typography>
                                                )}
                                            </>
                                        }
                                    />

                                    {/* Quick Toggle Read/Unread Icon */}
                                    <Tooltip title={notif.isRead ? "Mark as unread" : "Mark as read"}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleToggleSingleRead(notif.id, e)}
                                            sx={{
                                                ml: 1,
                                                color: notif.isRead ? 'text.disabled' : (isDark ? theme.palette.primary.light : '#7C6FE8'),
                                                '&:hover': { color: (t) => t.palette.primary.main, bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(124, 111, 232, 0.08)' }
                                            }}
                                        >
                                            {notif.isRead ? (
                                                <RadioButtonUnchecked sx={{ fontSize: '0.95rem' }} />
                                            ) : (
                                                <CheckCircleOutline sx={{ fontSize: '1rem' }} />
                                            )}
                                        </IconButton>
                                    </Tooltip>

                                    <ChevronRight sx={{ fontSize: '1.1rem', color: 'text.disabled', ml: 0.25 }} />
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
                                    color: (t) => t.palette.primary.main,
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
