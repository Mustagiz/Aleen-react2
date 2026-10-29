import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Paper,
  Button
} from '@mui/material';
import {
  Search,
  Inventory,
  Receipt,
  People,
  Store,
  ShoppingCart,
  TrendingUp,
  Straighten,
  QrCode2,
  AccountBalanceWallet,
  Assessment,
  Close,
  KeyboardReturn,
  ArrowDownward,
  ArrowUpward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

const CATEGORIES = [
  { id: 'all', label: 'All Results' },
  { id: 'action', label: 'Quick Actions' },
  { id: 'inventory', label: 'Garments' },
  { id: 'invoice', label: 'Invoices' },
  { id: 'customer', label: 'Clientele' },
  { id: 'tailoring', label: 'Tailoring' }
];

const GlobalSearch = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { inventory = [], customers = [], invoices = [], vendors = [] } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Load tailoring orders from local storage for deep command search
  const tailoringOrders = useMemo(() => {
    try {
      const stored = localStorage.getItem('aleen_tailoring_orders');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [open]);

  // Built-in Quick Action Commands
  const quickActions = useMemo(() => [
    {
      id: 'cmd-new-invoice',
      type: 'action',
      icon: <ShoppingCart sx={{ fontSize: 20 }} />,
      title: 'New Retail Bill / Invoice',
      subtitle: 'Open high-speed boutique POS counter (Press F2)',
      shortcut: 'F2',
      action: () => {
        navigate('/invoices?action=new');
        onClose();
      },
      color: (t) => t.palette.primary.main,
      keywords: ['new', 'invoice', 'sale', 'bill', 'pos', 'counter', 'checkout']
    },
    {
      id: 'cmd-tailoring',
      type: 'action',
      icon: <Straighten sx={{ fontSize: 20 }} />,
      title: 'Bespoke Tailoring & Measurements',
      subtitle: 'Create bespoke tailoring job, patterns & trials',
      shortcut: 'Kanban',
      action: () => {
        navigate('/tailoring');
        onClose();
      },
      color: '#7C3AED',
      keywords: ['tailor', 'alteration', 'blouse', 'fitting', 'bespoke', 'measurement']
    },
    {
      id: 'cmd-barcodes',
      type: 'action',
      icon: <QrCode2 sx={{ fontSize: 20 }} />,
      title: 'Barcode & Price Tag Studio',
      subtitle: 'Batch design and print retail thermal price stickers',
      shortcut: 'Tags',
      action: () => {
        navigate('/barcodes');
        onClose();
      },
      color: '#D97706',
      keywords: ['barcode', 'price', 'tag', 'sticker', 'thermal', 'print']
    },
    {
      id: 'cmd-cash-ledger',
      type: 'action',
      icon: <AccountBalanceWallet sx={{ fontSize: 20 }} />,
      title: 'Daily Cash Ledger & Audit',
      subtitle: 'Daily counter cash, UPI collections & audit ledger',
      shortcut: 'Ledger',
      action: () => {
        navigate('/payment-summary');
        onClose();
      },
      color: '#059669',
      keywords: ['cash', 'ledger', 'audit', 'drawer', 'collections', 'summary']
    },
    {
      id: 'cmd-profit-loss',
      type: 'action',
      icon: <Assessment sx={{ fontSize: 20 }} />,
      title: 'Profit & Loss Statement',
      subtitle: 'Real-time gross revenue, COGS and net margins',
      shortcut: 'P&L',
      action: () => {
        navigate('/profit-loss');
        onClose();
      },
      color: '#2563EB',
      keywords: ['profit', 'loss', 'cogs', 'statement', 'margins', 'revenue']
    },
    {
      id: 'cmd-inventory',
      type: 'action',
      icon: <Inventory sx={{ fontSize: 20 }} />,
      title: 'Inventory Catalog & Garments',
      subtitle: 'Manage styles, variants, cost prices & stock levels',
      shortcut: 'Stock',
      action: () => {
        navigate('/inventory');
        onClose();
      },
      color: (t) => t.palette.primary.main,
      keywords: ['inventory', 'product', 'item', 'stock', 'catalog', 'garment']
    },
    {
      id: 'cmd-clientele',
      type: 'action',
      icon: <People sx={{ fontSize: 20 }} />,
      title: 'Clientele 360° Directory',
      subtitle: 'VIP guests, purchase history & loyalty profiles',
      shortcut: 'VIP',
      action: () => {
        navigate('/customers');
        onClose();
      },
      color: '#DB2777',
      keywords: ['customer', 'guest', 'client', 'vip', 'loyalty', 'phone']
    }
  ], [navigate, onClose]);

  // Deep Search Query Matching
  const filteredResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    if (!q) {
      // Default to Quick Actions when search box is empty
      return activeCategory === 'all' || activeCategory === 'action' ? quickActions : [];
    }

    const matched = [];

    // 1. Actions Match
    if (activeCategory === 'all' || activeCategory === 'action') {
      quickActions.forEach(action => {
        if (
          action.title.toLowerCase().includes(q) ||
          action.subtitle.toLowerCase().includes(q) ||
          action.keywords.some(k => k.includes(q))
        ) {
          matched.push(action);
        }
      });
    }

    // 2. Inventory / Products Match
    if (activeCategory === 'all' || activeCategory === 'inventory') {
      inventory.forEach(item => {
        if (
          item.name?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q) ||
          item.productId?.toLowerCase().includes(q)
        ) {
          matched.push({
            id: `inv-${item.id}`,
            type: 'inventory',
            icon: <Inventory sx={{ fontSize: 20 }} />,
            title: item.name,
            subtitle: `${item.category || 'Apparel'} • SKU: ${item.sku || item.productId || 'N/A'} • Stock: ${item.quantity || 0} • ₹${(item.price || 0).toLocaleString('en-IN')}`,
            action: () => {
              navigate('/inventory');
              onClose();
            },
            color: (t) => t.palette.primary.main
          });
        }
      });
    }

    // 3. Customers Match
    if (activeCategory === 'all' || activeCategory === 'customer') {
      customers.forEach(customer => {
        if (
          customer.name?.toLowerCase().includes(q) ||
          customer.phone?.includes(q) ||
          customer.email?.toLowerCase().includes(q)
        ) {
          matched.push({
            id: `cust-${customer.id}`,
            type: 'customer',
            icon: <People sx={{ fontSize: 20 }} />,
            title: customer.name,
            subtitle: `${customer.phone || 'No Phone'} • VIP Tier: ${customer.loyaltyTier || 'Standard'} • ${customer.loyaltyPoints || 0} Pts`,
            action: () => {
              navigate('/customers');
              onClose();
            },
            color: '#7C3AED'
          });
        }
      });
    }

    // 4. Invoices Match
    if (activeCategory === 'all' || activeCategory === 'invoice') {
      invoices.forEach(inv => {
        const invId = String(inv.id || '');
        const custName = inv.customerName || customers.find(c => c.id === inv.customerId)?.name || 'Guest';
        if (invId.toLowerCase().includes(q) || custName.toLowerCase().includes(q)) {
          matched.push({
            id: `inv-bill-${inv.id}`,
            type: 'invoice',
            icon: <Receipt sx={{ fontSize: 20 }} />,
            title: `Invoice #${inv.id}`,
            subtitle: `${custName} • ₹${(inv.total || 0).toLocaleString('en-IN')} • ${inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : 'Recent'}`,
            action: () => {
              navigate('/invoices');
              onClose();
            },
            color: '#D97706'
          });
        }
      });
    }

    // 5. Tailoring Orders Match
    if (activeCategory === 'all' || activeCategory === 'tailoring') {
      tailoringOrders.forEach(order => {
        const orderId = String(order.id || '');
        const cName = order.customerName || '';
        const garment = order.garment || '';
        if (
          orderId.toLowerCase().includes(q) ||
          cName.toLowerCase().includes(q) ||
          garment.toLowerCase().includes(q)
        ) {
          matched.push({
            id: `tlr-${order.id}`,
            type: 'tailoring',
            icon: <Straighten sx={{ fontSize: 20 }} />,
            title: `Job #${order.id} - ${order.garment}`,
            subtitle: `Client: ${cName} • Status: ${(order.status || '').toUpperCase()} • Due: ${order.targetDate || 'TBD'}`,
            action: () => {
              navigate('/tailoring');
              onClose();
            },
            color: '#059669'
          });
        }
      });
    }

    return matched.slice(0, 15);
  }, [searchQuery, activeCategory, quickActions, inventory, customers, invoices, tailoringOrders, navigate, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Focus input automatically when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setActiveCategory('all');
      setSelectedIndex(0);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        filteredResults[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'action': return 'Command';
      case 'inventory': return 'Garment';
      case 'customer': return 'Client';
      case 'invoice': return 'Invoice';
      case 'tailoring': return 'Craft Job';
      default: return type;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          position: 'fixed',
          top: { xs: 20, sm: 60, md: 80 },
          m: { xs: '0 auto', sm: '0 auto' },
          width: { xs: 'calc(100% - 24px)', sm: '85vw', md: 680 },
          maxWidth: '100%',
          bgcolor: 'background.paper',
          backgroundImage: 'linear-gradient(180deg, rgba(15, 118, 110, 0.03) 0%, rgba(0, 0, 0, 0) 100%)',
          boxShadow: '0 25px 50px -12px rgba(4, 47, 46, 0.35), 0 0 0 1px rgba(var(--primary-rgb, 15, 118, 110), 0.2)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Search Header Input */}
        <Box sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)'
        }}>
          <Search sx={{ color: (t) => t.palette.primary.main, fontSize: 26 }} />
          <TextField
            fullWidth
            inputRef={inputRef}
            placeholder="Type a command, customer phone, SKU, or invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'text.primary'
              }
            }}
          />
          <Chip
            label="ESC"
            size="small"
            onClick={onClose}
            sx={{
              height: 22,
              fontSize: '0.68rem',
              fontWeight: 800,
              bgcolor: 'action.hover',
              cursor: 'pointer'
            }}
          />
        </Box>

        {/* Category Filter Pills */}
        <Box sx={{
          px: 2,
          py: 1,
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <Chip
                key={cat.id}
                label={cat.label}
                size="small"
                onClick={() => setActiveCategory(cat.id)}
                sx={{
                  height: 24,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  bgcolor: isSelected ? 'primary.main' : 'transparent',
                  color: isSelected ? '#FFFFFF' : 'text.secondary',
                  border: '1px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  '&:hover': {
                    bgcolor: isSelected ? (t) => `${t.palette.primary.dark} !important` : (t) => `${t.palette.primary.main}14`
                  }
                }}
              />
            );
          })}
        </Box>

        {/* Results List */}
        {filteredResults.length > 0 ? (
          <List sx={{ maxHeight: 380, overflowY: 'auto', p: 1.25 }}>
            {filteredResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <ListItem
                  key={item.id || index}
                  onClick={item.action}
                  selected={isSelected}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    bgcolor: isSelected ? 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)' : 'transparent',
                    border: '1px solid',
                    borderColor: isSelected ? 'rgba(15, 118, 110, 0.3)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(15, 118, 110, 0.06)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 42 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${item.color}15`,
                        color: item.color
                      }}
                    >
                      {item.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {item.title}
                        </Typography>
                        <Chip
                          label={getTypeLabel(item.type)}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            bgcolor: `${item.color}15`,
                            color: item.color,
                            border: `1px solid ${item.color}30`
                          }}
                        />
                      </Box>
                    }
                    secondary={item.subtitle}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      sx: { color: 'text.secondary', display: 'block', mt: 0.25 }
                    }}
                  />
                  {item.shortcut ? (
                    <Chip
                      label={item.shortcut}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        bgcolor: 'action.hover'
                      }}
                    />
                  ) : (
                    <KeyboardReturn sx={{ fontSize: 16, color: 'text.disabled' }} />
                  )}
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Search sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              No matches found for "{searchQuery}"
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Try searching by guest phone number, customer name, invoice ID, or product SKU.
            </Typography>
          </Box>
        )}

        {/* Footer Navigation Hints */}
        <Box sx={{
          px: 2.5,
          py: 1.25,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.02)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip label="↑↓" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }} />
              <Typography variant="caption" color="text.secondary">Navigate</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip label="↵" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }} />
              <Typography variant="caption" color="text.secondary">Execute</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip label="ESC" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }} />
              <Typography variant="caption" color="text.secondary">Dismiss</Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: (t) => t.palette.primary.main }}>
            Aleen Clothing Boutique Command OS
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
