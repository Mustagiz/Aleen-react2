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
  FilterList,
  Search,
  PriorityHigh
} from '@mui/icons-material';
import PageHeader from '../components/crm/PageHeader';
import AtelierKpiCard from '../components/crm/AtelierKpiCard';
import GlassCard from '../components/GlassCard';
import { useData } from '../contexts/DataContext';

const KANBAN_COLUMNS = [
  { id: 'intake', label: 'Intake & Specs', icon: <Straighten fontSize="small" />, color: '#64748B' },
  { id: 'cutting', label: 'Cutting & Pattern', icon: <ContentCut fontSize="small" />, color: '#D97706' },
  { id: 'stitching', label: 'Stitching Craft', icon: <Schedule fontSize="small" />, color: '#0F766E' },
  { id: 'trial', label: 'Trial Fitting', icon: <Person fontSize="small" />, color: '#7C3AED' },
  { id: 'ready', label: 'Ready for Pick-Up', icon: <CheckCircle fontSize="small" />, color: '#059669' },
  { id: 'delivered', label: 'Delivered', icon: <DoneAll fontSize="small" />, color: '#475569' }
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
  }
];

export default function TailoringKanban() {
  const { customers } = useData();
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('aleen_tailoring_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [search, setSearch] = useState('');
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

  const moveOrder = (orderId, direction) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const currentIndex = KANBAN_COLUMNS.findIndex(c => c.id === order.status);
      const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= KANBAN_COLUMNS.length) return order;
      return { ...order, status: KANBAN_COLUMNS[nextIndex].id };
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
      tailor: formData.tailor,
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
      tailor: 'Master Rafiq',
      price: '',
      advance: '',
      urgent: false
    });
  };

  const sendWhatsAppUpdate = (order) => {
    const cleanPhone = (order.phone || '').replace(/\D/g, '');
    const phone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(
      `Hello ${order.customerName}, update from Aleen Atelier! 🪡 Your bespoke garment "${order.garment}" status is currently: ${order.status.toUpperCase()}. We are ensuring perfection for your fitting on ${order.targetDate}.`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const filteredOrders = orders.filter(o =>
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.garment.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  const activeOrders = orders.filter(o => o.status !== 'delivered').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;
  const urgentOrders = orders.filter(o => o.urgent && o.status !== 'delivered').length;

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
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search garments or clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
              }}
              sx={{ width: 240, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
              sx={{
                px: 3,
                py: 1,
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.84rem',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
              }}
            >
              + New Tailoring Job
            </Button>
          </Box>
        }
      />

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <AtelierKpiCard
            title="In-Progress Alterations"
            value={activeOrders}
            icon={<Straighten fontSize="small" />}
            subtitle="Active on workshop floor"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <AtelierKpiCard
            title="Ready for Pick-Up"
            value={readyOrders}
            icon={<CheckCircle fontSize="small" />}
            goldAccent={true}
            subtitle="Awaiting client trial or collection"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <AtelierKpiCard
            title="Rush / Urgent Orders"
            value={urgentOrders}
            icon={<PriorityHigh fontSize="small" />}
            trend={urgentOrders > 0 ? `${urgentOrders} priority` : 'None'}
            trendPositive={urgentOrders === 0}
            subtitle="Requires same-day or priority craft"
          />
        </Grid>
      </Grid>

      {/* Kanban Board Container */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
          gap: 2,
          overflowX: 'auto',
          pb: 3
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

                      {/* Footer & Meta */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700, color: 'text.secondary' }}>
                          <AccessTime sx={{ fontSize: 12 }} /> {order.targetDate}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#D97706' }}>
                          ₹{order.price}
                        </Typography>
                      </Box>

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

                        <IconButton
                          size="small"
                          disabled={colIndex === KANBAN_COLUMNS.length - 1}
                          onClick={() => moveOrder(order.id, 'next')}
                          sx={{ p: 0.5, color: '#0F766E' }}
                        >
                          <ArrowForward fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </GlassCard>
                  ))
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

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
              <TextField
                select
                label="Assigned Master Tailor"
                fullWidth
                size="small"
                value={formData.tailor}
                onChange={(e) => setFormData({ ...formData, tailor: e.target.value })}
              >
                <MenuItem value="Master Rafiq">Master Rafiq (Blouses & Tops)</MenuItem>
                <MenuItem value="Master Anita">Master Anita (Lehengas & Sarees)</MenuItem>
                <MenuItem value="Master Imran">Master Imran (Suits & Heavy Craft)</MenuItem>
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
    </Box>
  );
}
