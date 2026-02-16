import React, { useState, useEffect } from 'react';
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Typography,
    Box,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button
} from '@mui/material';
import {
    Notifications,
    Warning,
    Inventory,
    Info,
    ChevronRight
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
    const { inventory } = useData();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const lowStockItems = inventory.filter(item => (Number(item.quantity) || 0) <= 2);

        const newNotifications = lowStockItems.map(item => ({
            id: `low-stock-${item.id}`,
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${item.name} is running low (${item.quantity} left)`,
            action: () => navigate('/inventory'),
            icon: <Warning color="warning" />
        }));

        setNotifications(newNotifications);
    }, [inventory, navigate]);

    const handleClick = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const open = Boolean(anchorEl);

    return (
        <Box>
            <IconButton color="inherit" onClick={handleClick}>
                <Badge badgeContent={notifications.length} color="error">
                    <Notifications />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: { width: 320, maxHeight: 400, borderRadius: 3, mt: 1.5, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Notifications</Typography>
                    {notifications.length > 0 && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {notifications.length} active alerts
                        </Typography>
                    )}
                </Box>
                <Divider />

                {notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Info sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">All caught up! No alerts.</Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notifications.map((notif) => (
                            <ListItem
                                key={notif.id}
                                button
                                onClick={() => { notif.action(); handleClose(); }}
                                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>{notif.icon}</ListItemIcon>
                                <ListItemText
                                    primary={notif.title}
                                    secondary={notif.message}
                                    primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                />
                                <ChevronRight fontSize="small" sx={{ color: 'text.disabled' }} />
                            </ListItem>
                        ))}
                    </List>
                )}

                {notifications.length > 0 && (
                    <>
                        <Divider />
                        <Box sx={{ p: 1 }}>
                            <Button
                                fullWidth
                                size="small"
                                onClick={() => { navigate('/inventory'); handleClose(); }}
                                sx={{ textTransform: 'none' }}
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
