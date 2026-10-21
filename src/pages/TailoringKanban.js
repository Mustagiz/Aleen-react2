import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Avatar,
  Tooltip,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Straighten,
  WhatsApp,
  ArrowForward,
  ArrowBack,
  AccessTime,
  Person,
  CheckCircle,
  ContentCut,
  Schedule,
  DoneAll,
  Search,
  PriorityHigh,
  Undo,
  LocalShipping,
  CheckCircleOutline,
  Delete,
  Group,
  Phone,
  Close,
  PersonAdd
} from '@mui/icons-material';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import GlassCard from '../components/GlassCard';


const KANBAN_COLUMNS = [
  { id: 'intake', label: 'Intake & Specs', icon: <Straighten fontSize="small" />, color: '#64748B' },
  { id: 'cutting', label: 'Cutting & Pattern', icon: <ContentCut fontSize="small" />, color: '#D97706' },
  { id: 'stitching', label: 'Stitching Craft', icon: <Schedule fontSize="small" />, color: '#0F766E' },
  { id: 'trial', label: 'Trial Fitting', icon: <Person fontSize="small" />, color: '#7C3AED' },
  { id: 'ready', label: 'Ready for Pick-Up', icon: <CheckCircle fontSize="small" />, color: '#059669' }
];

const INITIAL_ORDERS = [
  {
    id: 'TLR-101',
    customerName: 'Ayesha Khan',
    phone: '+91 98765 12345',
    garment: 'Bridal Raw Silk Blouse',
    specs: 'Deep back U-cut, princess cut, maggam hand embroidery on sleeves. Bust: 36", Waist: 30"',
    targetDate: '2026-10-24',
    tailor: 'Master Rafiq',
    status: 'stitching',
    price: 3800,
    advance: 2000,
    urgent: true
  },
  {
    id: 'TLR-102',
    customerName: 'Priya Sharma',
    phone: '+91 98220 54321',
    garment: 'Banarasi Saree Fall & Pico',
    specs: 'Cotton lining fall matching border, delicate thread picot hem, roll press',
    targetDate: '2026-10-22',
    tailor: 'Master Anita',
    status: 'ready',
    price: 650,
    advance: 650,
    urgent: false
  },
  {
    id: 'TLR-103',
    customerName: 'Zainab Merchant',
    phone: '+91 99300 88214',
    garment: 'Organza Lehenga Waist & Hem Alteration',
    specs: 'Take in waist 1.5 inches, shorten cancan layer by 1 inch, adjust hook clasp',
    targetDate: '2026-10-25',
    tailor: 'Master Imran',
    status: 'trial',
    price: 1800,
    advance: 1000,
    urgent: true
  },
  {
    id: 'TLR-104',
    customerName: 'Meera Deshmukh',
    phone: '+91 97654 32109',
    garment: 'Chanderi Kurti Set Bespoke Tailoring',
    specs: 'Boat neck with potli buttons, 3/4th sleeve with organza cuff, side slit 14"',
    targetDate: '2026-10-28',
    tailor: 'Master Rafiq',
    status: 'cutting',
    price: 2400,
    advance: 1200,
    urgent: false
  },
  {
    id: 'TLR-105',
    customerName: 'Fatima Sayed',
    phone: '+91 98111 22334',
    garment: 'Velvet Winter Shawl Hem Finish',
    specs: 'Gota patti border attachment with gold tassels on four corners',
    targetDate: '2026-10-29',
    tailor: 'Master Anita',
    status: 'intake',
    price: 1200,
    advance: 500,
    urgent: false
  },
  {
    id: 'TLR-100',
    customerName: 'Samira Al-Hassan',
    phone: '+91 98450 11223',
    garment: 'Pure Silk Anarkali Gown with Zari Borders',
    specs: 'Floor length, flared kalis, custom neckline fitting with antique gold zari work',
    targetDate: '2026-10-18',
    deliveredDate: '2026-10-19',
    tailor: 'Master Rafiq',
    status: 'delivered',
    price: 5200,
    advance: 5200,
    urgent: false
  }
];

const DEFAULT_TAILORS = [
  { id: 'TLR-M-1', name: 'Master Rafiq', specialty: 'Blouses & Tops', phone: '+91 98450 12345' },
  { id: 'TLR-M-2', name: 'Master Anita', specialty: 'Lehengas & Sarees', phone: '+91 98450 23456' },
  { id: 'TLR-M-3', name: 'Master Imran', specialty: 'Suits & Heavy Craft', phone: '+91 98450 34567' }
];

export default function TailoringKanban() {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('aleen_tailoring_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [tailors, setTailors] = useState(() => {
    const saved = localStorage.getItem('aleen_master_tailors');
    return saved ? JSON.parse(saved) : DEFAULT_TAILORS;
  });

  const [tailorDialogOpen, setTailorDialogOpen] = useState(false);
  const [newTailor, setNewTailor] = useState({ name: '', specialty: '', phone: '' });
  const [tailorError, setTailorError] = useState('');
  const [deleteConfirmTailor, setDeleteConfirmTailor] = useState(null);

  const [search, setSearch] = useState('');
  const [completedSearch, setCompletedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '+91 ',
    garment: '',
    specs: '',
    targetDate: '',
    tailor: 'Master Rafiq',
    price: '',
    advance: '',
    urgent: false
  });

  useEffect(() => {
    localStorage.setItem('aleen_tailoring_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('aleen_master_tailors', JSON.stringify(tailors));
  }, [tailors]);

  const handleAddTailor = (e) => {
    if (e) e.preventDefault();
    const trimmedName = newTailor.name.trim();
    if (!trimmedName) {
      setTailorError('Please enter the Master Tailor name.');
      return;
    }
    const exists = tailors.some(t => t.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      setTailorError(`Master Tailor "${trimmedName}" is already registered.`);
      return;
    }
    const createdTailor = {
      id: `TLR-M-${Date.now()}`,
      name: trimmedName,
      specialty: newTailor.specialty.trim() || 'Bespoke Craft & Alterations',
      phone: newTailor.phone.trim() || ''
    };
    setTailors(prev => [...prev, createdTailor]);
    setNewTailor({ name: '', specialty: '', phone: '' });
    setTailorError('');
    setFormData(prev => ({ ...prev, tailor: trimmedName }));
  };

  const handleDeleteTailor = (tailorToDelete) => {
    if (!tailorToDelete) return;
    setTailors(prev => prev.filter(t => t.id !== tailorToDelete.id && t.name !== tailorToDelete.name));
    setDeleteConfirmTailor(null);
    if (formData.tailor === tailorToDelete.name) {
      const remaining = tailors.filter(t => t.id !== tailorToDelete.id && t.name !== tailorToDelete.name);
      setFormData(prev => ({
        ...prev,
        tailor: remaining.length > 0 ? remaining[0].name : ''
      }));
    }
  };

  const moveOrder = (orderId, direction) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const currentIndex = KANBAN_COLUMNS.findIndex(c => c.id === order.status);
      const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= KANBAN_COLUMNS.length) return order;
      return { ...order, status: KANBAN_COLUMNS[nextIndex].id };
    }));
  };

  const markAsDelivered = (orderId) => {
    const now = new Date().toISOString().split('T')[0];
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        status: 'delivered',
        deliveredDate: now
      };
    }));
  };

  const reopenOrder = (orderId) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        status: 'ready'
      };
    }));
  };

  const handleCreateOrder = () => {
    if (!formData.customerName || !formData.garment) {
      alert('Please provide customer name and garment type.');
      return;
    }

    const newOrder = {
      id: `TLR-${Math.floor(100 + Math.random() * 900)}`,
      customerName: formData.customerName,
      phone: formData.phone,
      garment: formData.garment,
      specs: formData.specs,
      targetDate: formData.targetDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      tailor: formData.tailor || (tailors[0]?.name || 'Master Tailor'),
      status: 'intake',
      price: parseFloat(formData.price) || 0,
      advance: parseFloat(formData.advance) || 0,
      urgent: formData.urgent
    };

    setOrders(prev => [newOrder, ...prev]);
    setDialogOpen(false);
    setFormData({
      customerName: '',
      phone: '+91 ',
      garment: '',
      specs: '',
      targetDate: '',
      tailor: tailors[0]?.name || '',
      price: '',
      advance: '',
      urgent: false
    });
  };

  const sendWhatsAppUpdate = (order) => {
    const cleanPhone = (order.phone || '').replace(/\D/g, '');
    const phone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const isDelivered = order.status === 'delivered';
    const msgText = isDelivered
      ? `Hello ${order.customerName}! 🌟 Thank you for trusting Aleen Atelier with your bespoke garment "${order.garment}". It has been successfully completed and handed over. We hope you love the fit and craft!`
      : `Hello ${order.customerName}, update from Aleen Atelier! 🪡 Your bespoke garment "${order.garment}" status is currently: ${order.status.toUpperCase()}. We are ensuring perfection for your fitting on ${order.targetDate}.`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msgText)}`, '_blank');
  };

  const filteredOrders = orders.filter(o =>
    (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.garment || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.tailor || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeOrders = orders.filter(o => o.status !== 'delivered').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;
  const urgentOrders = orders.filter(o => o.urgent && o.status !== 'delivered').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  const filteredDelivered = deliveredOrders.filter(o =>
    (o.customerName || '').toLowerCase().includes(completedSearch.toLowerCase()) ||
    (o.garment || '').toLowerCase().includes(completedSearch.toLowerCase()) ||
    (o.id || '').toLowerCase().includes(completedSearch.toLowerCase()) ||
    (o.tailor || '').toLowerCase().includes(completedSearch.toLowerCase())
  );

  return (
    <Box>
      <PageHeader
        title="Bespoke Tailoring & Alterations Board"
        subtitle="End-to-end craft workflow: measurements, pattern cutting, artisan stitching, fitting trial and client handover"
        breadcrumbs={[
          { label: 'Aleen Atelier', path: '/' },
          { label: 'Merchandise', path: '/inventory' },
          { label: 'Tailoring Kanban' }
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search garments, clients, tailors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: '#0F766E', fontSize: 18 }} />
              }}
              sx={{
                width: 240,
                '& .MuiOutlinedInput-root': {
                  height: 42,
                  borderRadius: '24px',
                  bgcolor: 'background.paper',
                  fontSize: '0.84rem',
                  '& fieldset': {
                    borderColor: 'rgba(15, 118, 110, 0.3)'
                  },
                  '&:hover fieldset': {
                    borderColor: '#0F766E'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#0F766E',
                    borderWidth: 1.5
                  }
                }
              }}
            />
            <Button
              variant="outlined"
              startIcon={<Group sx={{ fontSize: 19, color: '#0F766E' }} />}
              onClick={() => setTailorDialogOpen(true)}
              sx={{
                height: 42,
                minHeight: 42,
                px: 2.5,
                borderRadius: '24px',
                border: '1.5px solid #0F766E',
                color: '#0F766E',
                bgcolor: 'background.paper',
                fontWeight: 700,
                fontSize: '0.84rem',
                textTransform: 'none',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  border: '1.5px solid #042F2E',
                  bgcolor: 'rgba(15, 118, 110, 0.05)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Master Tailors ({tailors.length})
            </Button>
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: 19, color: '#FFFFFF !important' }} />}
              onClick={() => setDialogOpen(true)}
              sx={{
                height: 42,
                minHeight: 42,
                px: 3,
                borderRadius: '24px',
                fontWeight: 700,
                fontSize: '0.84rem',
                textTransform: 'none',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%) !important',
                color: '#FFFFFF !important',
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '& .MuiSvgIcon-root': {
                  color: '#FFFFFF !important'
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, #115E59 0%, #021C1B 100%) !important',
                  boxShadow: '0 6px 18px rgba(15, 118, 110, 0.45)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              New Tailoring Job
            </Button>
          </Box>
        }
      />

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AtelierKpiCard
            title="In-Progress Alterations"
            value={activeOrders}
            icon={<Straighten fontSize="small" />}
            subtitle="Active on workshop floor"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AtelierKpiCard
            title="Ready for Pick-Up"
            value={readyOrders}
            icon={<CheckCircle fontSize="small" />}
            goldAccent={true}
            subtitle="Awaiting client trial or collection"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AtelierKpiCard
            title="Rush / Urgent Orders"
            value={urgentOrders}
            icon={<PriorityHigh fontSize="small" />}
            trend={urgentOrders > 0 ? `${urgentOrders} priority` : 'None'}
            trendPositive={urgentOrders === 0}
            subtitle="Requires same-day or priority craft"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AtelierKpiCard
            title="Delivered & Handed Over"
            value={deliveredOrders.length}
            icon={<DoneAll fontSize="small" />}
            subtitle="Completed client garments"
          />
        </Grid>
      </Grid>

      {/* Kanban Board Container (5 Active Workshop Stages) */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
              Workshop Craft Floor
            </Typography>
            <Chip
              label={`${activeOrders} Active Jobs`}
              size="small"
              sx={{ fontWeight: 800, bgcolor: 'primary.light', color: 'primary.contrastText' }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Use arrows or "Deliver" to progress jobs across stages
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
            gap: 2,
            overflowX: 'auto',
            pb: 1.5
          }}
        >
          {KANBAN_COLUMNS.map((col, colIndex) => {
            const colOrders = filteredOrders.filter(o => o.status === col.id);
            return (
              <Box
                key={col.id}
                sx={{
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: { xs: '100%', lg: 220 },
                  maxHeight: 'calc(100vh - 280px)'
                }}
              >
                {/* Column Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 1.5,
                    mb: 1.5,
                    borderBottom: '2px solid',
                    borderColor: col.color
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: col.color, display: 'flex' }}>{col.icon}</Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {col.label}
                    </Typography>
                  </Box>
                  <Chip
                    label={colOrders.length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      bgcolor: 'action.hover'
                    }}
                  />
                </Box>

                {/* Cards List */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    overflowY: 'auto',
                    pr: 0.5,
                    flex: 1
                  }}
                >
                  {colOrders.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        No jobs in this phase
                      </Typography>
                    </Box>
                  ) : (
                    colOrders.map((order) => (
                      <GlassCard
                        key={order.id}
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          border: '1px solid',
                          borderColor: order.urgent ? 'warning.main' : 'divider',
                          transition: 'all 0.15s ease-in-out',
                          '&:hover': {
                            borderColor: '#0F766E',
                            boxShadow: '0 6px 16px rgba(15,118,110,0.1)'
                          }
                        }}
                      >
                        {/* Card Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F766E' }}>
                            #{order.id}
                          </Typography>
                          {order.urgent && (
                            <Chip
                              label="RUSH"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.62rem',
                                fontWeight: 900,
                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                color: 'error.main',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                              }}
                            />
                          )}
                        </Box>

                        {/* Garment Title */}
                        <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.3, mb: 0.5 }}>
                          {order.garment}
                        </Typography>

                        {/* Customer Info */}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          👤 {order.customerName}
                        </Typography>

                        {/* Specs */}
                        {order.specs && (
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 1.5,
                              bgcolor: 'action.hover',
                              mb: 1.5
                            }}
                          >
                            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {order.specs}
                            </Typography>
                          </Box>
                        )}

                        {/* Tailor & Meta */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 600 }}>
                            ✂️ {order.tailor || 'Master Tailor'}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#D97706' }}>
                            ₹{order.price}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700, color: 'text.secondary' }}>
                            <AccessTime sx={{ fontSize: 12 }} /> Due: {order.targetDate}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.68rem', color: order.advance >= order.price ? 'success.main' : 'warning.main', fontWeight: 700 }}>
                            {order.advance >= order.price ? 'Fully Paid' : `Bal: ₹${(order.price || 0) - (order.advance || 0)}`}
                          </Typography>
                        </Box>

                        {/* Quick Delivered Button for Ready phase */}
                        {order.status === 'ready' && (
                          <Button
                            fullWidth
                            size="small"
                            variant="contained"
                            startIcon={<CheckCircleOutline sx={{ fontSize: 16 }} />}
                            onClick={() => markAsDelivered(order.id)}
                            sx={{
                              mb: 1.2,
                              py: 0.4,
                              borderRadius: 1.5,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                              color: '#ffffff',
                              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                            }}
                          >
                            Mark Delivered
                          </Button>
                        )}

                        {/* Card Controls */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                          <IconButton
                            size="small"
                            disabled={colIndex === 0}
                            onClick={() => moveOrder(order.id, 'prev')}
                            sx={{ p: 0.5 }}
                          >
                            <ArrowBack fontSize="small" sx={{ fontSize: 16 }} />
                          </IconButton>

                          <Tooltip title="Send WhatsApp Update">
                            <IconButton
                              size="small"
                              onClick={() => sendWhatsAppUpdate(order)}
                              sx={{ color: '#25D366', p: 0.5 }}
                            >
                              <WhatsApp fontSize="small" sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>

                          {colIndex < KANBAN_COLUMNS.length - 1 ? (
                            <IconButton
                              size="small"
                              onClick={() => moveOrder(order.id, 'next')}
                              sx={{ p: 0.5, color: '#0F766E' }}
                            >
                              <ArrowForward fontSize="small" sx={{ fontSize: 16 }} />
                            </IconButton>
                          ) : (
                            <Tooltip title="Deliver to Client">
                              <IconButton
                                size="small"
                                onClick={() => markAsDelivered(order.id)}
                                sx={{ p: 0.5, color: '#059669' }}
                              >
                                <DoneAll fontSize="small" sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </GlassCard>
                    ))
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Dedicated Completed & Delivered Garments Section (Down the board) */}
      <GlassCard sx={{ p: 3, borderRadius: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 2.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'rgba(5, 150, 105, 0.12)', color: '#059669', width: 36, height: 36 }}>
                <DoneAll fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Completed & Delivered Garments
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Delivered orders archive, handover receipts, and fitting records
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Filter delivered garments..."
              value={completedSearch}
              onChange={(e) => setCompletedSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
              }}
              sx={{ width: { xs: '100%', sm: 260 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Chip
              label={`${deliveredOrders.length} Delivered`}
              sx={{ fontWeight: 800, bgcolor: 'rgba(5, 150, 105, 0.1)', color: '#059669' }}
            />
          </Box>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>Job ID</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>Garment & Specs</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>Master Tailor</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>Handover Date</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Total Fee</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>Payment Status</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDelivered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <LocalShipping sx={{ fontSize: 36, opacity: 0.3, mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      No delivered garments found in this view.
                    </Typography>
                    <Typography variant="caption">
                      When garments reach pick-up and are delivered, they will appear here automatically.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDelivered.map((order) => {
                  const isFullyPaid = (order.advance || 0) >= (order.price || 0);
                  return (
                    <TableRow
                      key={order.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F766E' }}>
                        #{order.id}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {order.customerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.phone}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {order.garment}
                        </Typography>
                        {order.specs && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {order.specs}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {order.tailor || 'Master Tailor'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} /> {order.deliveredDate || order.targetDate}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 800, color: '#D97706' }}>
                        ₹{Number(order.price || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={isFullyPaid ? 'Settled / Paid' : `Due ₹${(order.price || 0) - (order.advance || 0)}`}
                          size="small"
                          color={isFullyPaid ? 'success' : 'warning'}
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="Send Thank You & Fitting WhatsApp">
                            <IconButton
                              size="small"
                              onClick={() => sendWhatsAppUpdate(order)}
                              sx={{ color: '#25D366' }}
                            >
                              <WhatsApp fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Reopen to Workshop (Alteration Request)">
                            <IconButton
                              size="small"
                              onClick={() => reopenOrder(order.id)}
                              sx={{ color: 'text.secondary' }}
                            >
                              <Undo fontSize="small" />
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
      </GlassCard>

      {/* New Tailoring Job Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create Bespoke Tailoring Job</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Client Name"
            fullWidth
            size="small"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            placeholder="e.g. Saira Banu"
          />

          <TextField
            label="Client Phone (for WhatsApp)"
            fullWidth
            size="small"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <TextField
            label="Garment Description"
            fullWidth
            size="small"
            value={formData.garment}
            onChange={(e) => setFormData({ ...formData, garment: e.target.value })}
            placeholder="e.g. Designer Bridal Blouse with Dori"
          />

          <TextField
            label="Bespoke Measurements & Alteration Specs"
            fullWidth
            multiline
            rows={3}
            size="small"
            value={formData.specs}
            onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
            placeholder="Bust: 36, Waist: 29, Armhole: 15, Neck Deep: 8 inches..."
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Target Delivery Date"
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              />
            </Grid>

            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  Assigned Master Tailor
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setTailorDialogOpen(true)}
                  sx={{ fontSize: '0.72rem', p: 0, minWidth: 'auto', textTransform: 'none', color: '#0F766E', fontWeight: 800 }}
                >
                  + Manage Tailors
                </Button>
              </Box>
              <TextField
                select
                fullWidth
                size="small"
                value={formData.tailor}
                onChange={(e) => setFormData({ ...formData, tailor: e.target.value })}
              >
                {tailors.map(t => (
                  <MenuItem key={t.id || t.name} value={t.name}>
                    {t.name} {t.specialty ? `(${t.specialty})` : ''}
                  </MenuItem>
                ))}
                {tailors.length === 0 && (
                  <MenuItem value="">-- No Tailors Registered --</MenuItem>
                )}
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Total Craft Price (₹)"
                type="number"
                fullWidth
                size="small"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Advance Paid (₹)"
                type="number"
                fullWidth
                size="small"
                value={formData.advance}
                onChange={(e) => setFormData({ ...formData, advance: e.target.value })}
              />
            </Grid>
          </Grid>

          <TextField
            select
            label="Priority / Turnaround"
            fullWidth
            size="small"
            value={formData.urgent ? 'yes' : 'no'}
            onChange={(e) => setFormData({ ...formData, urgent: e.target.value === 'yes' })}
          >
            <MenuItem value="no">Standard Atelier Timeline (3 - 5 days)</MenuItem>
            <MenuItem value="yes">⚡ Rush Order / Urgent (24 - 48 hours)</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateOrder}
            sx={{
              background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              px: 3
            }}
          >
            Issue Craft Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Master Tailors Management Dialog */}
      <Dialog
        open={tailorDialogOpen}
        onClose={() => setTailorDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        {/* Luxury Header Banner */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #042F2E 0%, #0F766E 100%)',
            color: '#FFFFFF',
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(217, 119, 6, 0.25)', color: '#FDE68A', border: '1px solid rgba(217, 119, 6, 0.4)' }}>
              <Group />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.2, color: '#FFFFFF' }}>
                Master Tailors & Artisans
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Add, manage, or remove master pattern makers and craft specialists
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setTailorDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.85)' }}>
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Add New Tailor Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'rgba(15, 118, 110, 0.25)',
              background: 'rgba(15, 118, 110, 0.03)'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F766E', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonAdd fontSize="small" /> Add New Master Tailor
            </Typography>

            {tailorError && (
              <Alert severity="error" onClose={() => setTailorError('')} sx={{ mb: 2, borderRadius: 2 }}>
                {tailorError}
              </Alert>
            )}

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Master Tailor Name *"
                  size="small"
                  fullWidth
                  placeholder="e.g. Master Salim"
                  value={newTailor.name}
                  onChange={(e) => {
                    setNewTailor({ ...newTailor, name: e.target.value });
                    if (tailorError) setTailorError('');
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Craft Specialty"
                  size="small"
                  fullWidth
                  placeholder="e.g. Sherwanis & Heavy Zari"
                  value={newTailor.specialty}
                  onChange={(e) => setNewTailor({ ...newTailor, specialty: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ContentCut sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={2.5}>
                <TextField
                  label="Phone / WhatsApp"
                  size="small"
                  fullWidth
                  placeholder="+91 98450..."
                  value={newTailor.phone}
                  onChange={(e) => setNewTailor({ ...newTailor, phone: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={1.5}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleAddTailor}
                  sx={{
                    py: 1,
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 3px 10px rgba(15, 118, 110, 0.3)'
                  }}
                >
                  + Add
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Master Tailors List */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Registered Master Tailors ({tailors.length})
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Real-time active workload on workshop floor
              </Typography>
            </Box>

            {tailors.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, px: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  No master tailors registered yet. Use the form above to add your first master artisan.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>Master Tailor</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>Craft Specialty</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>Active Jobs</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tailors.map((tailor) => {
                      const activeJobs = orders.filter(o => o.tailor === tailor.name && o.status !== 'delivered').length;
                      const cleanTailorName = tailor.name.replace(/Master\s+/i, '');
                      const initials = cleanTailorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MT';
                      return (
                        <TableRow key={tailor.id || tailor.name} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                sx={{
                                  width: 34,
                                  height: 34,
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  bgcolor: 'rgba(15, 118, 110, 0.12)',
                                  color: '#0F766E',
                                  border: '1px solid rgba(15, 118, 110, 0.25)'
                                }}
                              >
                                {initials}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                  {tailor.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                  ID: {tailor.id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={tailor.specialty || 'General Craft'}
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                bgcolor: 'rgba(217, 119, 6, 0.1)',
                                color: '#D97706',
                                border: '1px solid rgba(217, 119, 6, 0.25)'
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            {tailor.phone ? (
                              <Typography
                                variant="caption"
                                component="a"
                                href={`https://wa.me/${tailor.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  color: '#0F766E',
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                              >
                                <WhatsApp sx={{ fontSize: 14, color: '#25D366' }} />
                                {tailor.phone}
                              </Typography>
                            ) : (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>—</Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={activeJobs === 1 ? '1 Job Active' : `${activeJobs} Jobs Active`}
                              color={activeJobs > 0 ? 'warning' : 'default'}
                              sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Tooltip title={`Delete ${tailor.name}`}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteConfirmTailor(tailor)}
                                sx={{
                                  '&:hover': {
                                    bgcolor: 'rgba(239, 68, 68, 0.1)'
                                  }
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Changes are saved immediately and synced with your atelier workspace.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setTailorDialogOpen(false)}
            sx={{
              fontWeight: 800,
              px: 3,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
              color: '#ffffff'
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Tailor Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteConfirmTailor)}
        onClose={() => setDeleteConfirmTailor(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <Delete /> Remove Master Tailor?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5, color: 'text.primary' }}>
            Are you sure you want to remove <b>{deleteConfirmTailor?.name}</b> from the master tailors list?
          </Typography>
          {deleteConfirmTailor && (() => {
            const activeJobs = orders.filter(o => o.tailor === deleteConfirmTailor.name && o.status !== 'delivered').length;
            if (activeJobs > 0) {
              return (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  ⚠️ Master {deleteConfirmTailor.name} is currently assigned to <b>{activeJobs} active job(s)</b> on the workshop floor. Existing cards will keep the name for historical records, but new jobs will no longer list them.
                </Alert>
              );
            }
            return null;
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmTailor(null)} sx={{ fontWeight: 700, color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleDeleteTailor(deleteConfirmTailor)}
            sx={{ fontWeight: 800, px: 2.5, borderRadius: '8px' }}
          >
            Remove Tailor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
