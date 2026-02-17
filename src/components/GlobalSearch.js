import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Box,
    Typography,
    Chip,
    InputAdornment,
    Divider,
    Paper
} from '@mui/material';
import {
    Search,
    Inventory,
    Receipt,
    People,
    Store,
    ShoppingCart,
    TrendingUp,
    KeyboardArrowRight
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

const GlobalSearch = ({ open, onClose }) => {
    const navigate = useNavigate();
    const { inventory, customers, invoices, vendors } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        const query = searchQuery.toLowerCase();
        const allResults = [];

        // Search Inventory
        inventory.forEach(item => {
            if (
                item.name?.toLowerCase().includes(query) ||
                item.category?.toLowerCase().includes(query) ||
                item.sku?.toLowerCase().includes(query)
            ) {
                allResults.push({
                    type: 'inventory',
                    icon: <Inventory />,
                    title: item.name,
                    subtitle: `${item.category} • SKU: ${item.sku} • Stock: ${item.quantity}`,
                    action: () => {
                        navigate('/inventory');
                        onClose();
                    },
                    color: '#059669'
                });
            }
        });

        // Search Customers
        customers.forEach(customer => {
            if (
                customer.name?.toLowerCase().includes(query) ||
                customer.phone?.includes(query) ||
                customer.email?.toLowerCase().includes(query)
            ) {
                allResults.push({
                    type: 'customer',
                    icon: <People />,
                    title: customer.name,
                    subtitle: `${customer.phone} • ${customer.loyaltyTier || 'Bronze'} • ${customer.loyaltyPoints || 0} pts`,
                    action: () => {
                        navigate('/customers');
                        onClose();
                    },
                    color: '#7C3AED'
                });
            }
        });

        // Search Invoices
        invoices.forEach(invoice => {
            const invoiceNumber = invoice.id?.toString();
            const customerName = customers.find(c => c.id === invoice.customerId)?.name || 'Walk-in';

            if (
                invoiceNumber?.includes(query) ||
                customerName?.toLowerCase().includes(query)
            ) {
                allResults.push({
                    type: 'invoice',
                    icon: <Receipt />,
                    title: `Invoice #${invoice.id}`,
                    subtitle: `${customerName} • ₹${invoice.total.toLocaleString('en-IN')} • ${new Date(invoice.date).toLocaleDateString('en-IN')}`,
                    action: () => {
                        navigate('/invoices');
                        onClose();
                    },
                    color: '#E11D48'
                });
            }
        });

        // Search Vendors
        vendors.forEach(vendor => {
            if (
                vendor.name?.toLowerCase().includes(query) ||
                vendor.phone?.includes(query) ||
                vendor.email?.toLowerCase().includes(query)
            ) {
                allResults.push({
                    type: 'vendor',
                    icon: <Store />,
                    title: vendor.name,
                    subtitle: `${vendor.phone} • Balance: ₹${(vendor.balance || 0).toLocaleString('en-IN')}`,
                    action: () => {
                        navigate('/vendors');
                        onClose();
                    },
                    color: '#D97706'
                });
            }
        });

        // Quick Actions
        const quickActions = [
            {
                type: 'action',
                icon: <ShoppingCart />,
                title: 'New Invoice',
                subtitle: 'Create a new sales invoice',
                action: () => {
                    navigate('/invoices');
                    onClose();
                },
                color: '#E11D48',
                keywords: ['new', 'invoice', 'sale', 'bill']
            },
            {
                type: 'action',
                icon: <Inventory />,
                title: 'Add Product',
                subtitle: 'Add new product to inventory',
                action: () => {
                    navigate('/inventory');
                    onClose();
                },
                color: '#059669',
                keywords: ['new', 'product', 'add', 'inventory', 'item']
            },
            {
                type: 'action',
                icon: <People />,
                title: 'Add Customer',
                subtitle: 'Register new customer',
                action: () => {
                    navigate('/customers');
                    onClose();
                },
                color: '#7C3AED',
                keywords: ['new', 'customer', 'add', 'register']
            },
            {
                type: 'action',
                icon: <TrendingUp />,
                title: 'View Reports',
                subtitle: 'Advanced business reports',
                action: () => {
                    navigate('/advanced-reports');
                    onClose();
                },
                color: '#D97706',
                keywords: ['report', 'analytics', 'stats', 'dashboard']
            }
        ];

        quickActions.forEach(action => {
            if (action.keywords.some(keyword => keyword.includes(query))) {
                allResults.push(action);
            }
        });

        setResults(allResults.slice(0, 10));
        setSelectedIndex(0);
    }, [searchQuery, inventory, customers, invoices, vendors, navigate, onClose]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            results[selectedIndex].action();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setResults([]);
        setSelectedIndex(0);
        onClose();
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'inventory': return 'Product';
            case 'customer': return 'Customer';
            case 'invoice': return 'Invoice';
            case 'vendor': return 'Vendor';
            case 'action': return 'Action';
            default: return type;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    position: 'fixed',
                    top: 100,
                    m: 0
                }
            }}
        >
            <DialogContent sx={{ p: 0 }}>
                {/* Search Input */}
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <TextField
                        fullWidth
                        autoFocus
                        placeholder="Search products, customers, invoices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Chip
                                        label="ESC"
                                        size="small"
                                        sx={{
                                            height: 24,
                                            fontSize: '0.75rem',
                                            bgcolor: 'rgba(0,0,0,0.08)',
                                            fontWeight: 600
                                        }}
                                    />
                                </InputAdornment>
                            )
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { border: 'none' },
                                bgcolor: 'rgba(0,0,0,0.02)',
                                borderRadius: 2
                            }
                        }}
                    />
                </Box>

                {/* Results */}
                {results.length > 0 ? (
                    <List sx={{ maxHeight: 400, overflow: 'auto', p: 1 }}>
                        {results.map((result, index) => (
                            <ListItem
                                key={index}
                                button
                                selected={index === selectedIndex}
                                onClick={result.action}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.5,
                                    '&.Mui-selected': {
                                        bgcolor: 'rgba(136, 14, 79, 0.08)',
                                        '&:hover': {
                                            bgcolor: 'rgba(136, 14, 79, 0.12)'
                                        }
                                    }
                                }}
                            >
                                <ListItemIcon>
                                    <Box
                                        sx={{
                                            p: 1,
                                            borderRadius: 1.5,
                                            bgcolor: `${result.color}15`,
                                            color: result.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {result.icon}
                                    </Box>
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {result.title}
                                            </Typography>
                                            <Chip
                                                label={getTypeLabel(result.type)}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.65rem',
                                                    bgcolor: `${result.color}20`,
                                                    color: result.color,
                                                    fontWeight: 700
                                                }}
                                            />
                                        </Box>
                                    }
                                    secondary={result.subtitle}
                                    secondaryTypographyProps={{
                                        variant: 'caption',
                                        sx: { color: 'text.secondary' }
                                    }}
                                />
                                <KeyboardArrowRight sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </ListItem>
                        ))}
                    </List>
                ) : searchQuery ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Search sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            No results found for "{searchQuery}"
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 2, display: 'block' }}>
                            QUICK TIPS
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Chip label="↑↓" size="small" sx={{ bgcolor: 'rgba(0,0,0,0.08)', fontWeight: 600, minWidth: 40 }} />
                                <Typography variant="caption" color="text.secondary">Navigate</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Chip label="↵" size="small" sx={{ bgcolor: 'rgba(0,0,0,0.08)', fontWeight: 600, minWidth: 40 }} />
                                <Typography variant="caption" color="text.secondary">Select</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Chip label="ESC" size="small" sx={{ bgcolor: 'rgba(0,0,0,0.08)', fontWeight: 600, minWidth: 40 }} />
                                <Typography variant="caption" color="text.secondary">Close</Typography>
                            </Box>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                            SEARCH FOR
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Chip label="Products" size="small" variant="outlined" />
                            <Chip label="Customers" size="small" variant="outlined" />
                            <Chip label="Invoices" size="small" variant="outlined" />
                            <Chip label="Vendors" size="small" variant="outlined" />
                            <Chip label="Actions" size="small" variant="outlined" />
                        </Box>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default GlobalSearch;
