import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Button,
  TextField,
  Divider,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Paper,
  InputAdornment,
  MenuItem
} from '@mui/material';
import {
  WhatsApp,
  Phone,
  Email,
  CalendarMonth,
  Straighten,
  ReceiptLong,
  Notes,
  Save,
  Payments,
  Stars,
  TrendingUp,
  AccountBalanceWallet,
  ShoppingBag,
  Close,
  OpenInNew
} from '@mui/icons-material';
import SlideOverDrawer from './SlideOverDrawer';
import { useData } from '../../contexts/DataContext';

const getTierColor = (tier) => {
  switch (tier) {
    case 'Platinum': return { bg: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)', text: '#F0FDFA', border: '#14B8A6' };
    case 'Gold': return { bg: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', text: '#FFFBEB', border: '#F59E0B' };
    case 'Silver': return { bg: 'linear-gradient(135deg, #64748B 0%, #475569 100%)', text: '#F8FAFC', border: '#94A3B8' };
    default: return { bg: 'linear-gradient(135deg, #B45309 0%, #78350F 100%)', text: '#FEF3C7', border: '#D97706' };
  }
};

const getInitials = (name) => {
  if (!name) return 'VIP';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export default function Customer360Drawer({
  open,
  onClose,
  customer,
  onEdit,
  onRecordPayment
}) {
  const { updateCustomer, invoices } = useData();
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Bespoke Measurements Form
  const [measurements, setMeasurements] = useState({
    bust: '',
    waist: '',
    hip: '',
    shoulder: '',
    sleeveLength: '',
    garmentLength: '',
    armhole: '',
    neckFront: '',
    neckBack: '',
    preferredFit: 'Tailored Slim'
  });

  // Atelier Notes & Preferences
  const [styleNotes, setStyleNotes] = useState('');
  const [preferredFabrics, setPreferredFabrics] = useState('');
  const [preferredColors, setPreferredColors] = useState('');

  // Sync state when customer changes
  useEffect(() => {
    if (customer) {
      setMeasurements({
        bust: customer.measurements?.bust || '',
        waist: customer.measurements?.waist || '',
        hip: customer.measurements?.hip || '',
        shoulder: customer.measurements?.shoulder || '',
        sleeveLength: customer.measurements?.sleeveLength || '',
        garmentLength: customer.measurements?.garmentLength || '',
        armhole: customer.measurements?.armhole || '',
        neckFront: customer.measurements?.neckFront || '',
        neckBack: customer.measurements?.neckBack || '',
        preferredFit: customer.measurements?.preferredFit || 'Tailored Slim'
      });
      setStyleNotes(customer.notes || '');
      setPreferredFabrics(customer.preferredFabrics || '');
      setPreferredColors(customer.preferredColors || '');
      setSaveSuccess(false);
    }
  }, [customer]);

  if (!customer) return null;

  const tierStyle = getTierColor(customer.loyaltyTier || 'Bronze');

  // Customer Invoices
  const customerInvoices = invoices.filter(inv =>
    (customer.id && inv.customerId === customer.id) ||
    (customer.phone && inv.phone && inv.phone.replace(/\D/g, '') === customer.phone.replace(/\D/g, ''))
  ).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  const handleSaveMeasurements = async () => {
    try {
      setSaving(true);
      await updateCustomer(customer.id, {
        measurements,
        notes: styleNotes,
        preferredFabrics,
        preferredColors
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update measurements:', err);
      alert('Failed to save measurements: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsApp = () => {
    const rawPhone = (customer.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const greeting = encodeURIComponent(
      `Hello ${customer.name}, greetings from Aleen Atelier! ✨ We are delighted to assist you with your wardrobe selections and bespoke fittings.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${greeting}`, '_blank');
  };

  return (
    <SlideOverDrawer
      open={open}
      onClose={onClose}
      title="Clientele 360° Profile"
      subtitle={`ID: #${customer.id || 'N/A'}`}
      width={560}
      actions={
        <Button
          size="small"
          variant="contained"
          startIcon={<Save fontSize="small" />}
          onClick={handleSaveMeasurements}
          disabled={saving}
          sx={{
            background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.8rem',
            px: 2.5
          }}
        >
          {saving ? 'Saving...' : saveSuccess ? 'Saved! ✓' : 'Save Specs'}
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Customer Identity Card */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                background: tierStyle.bg,
                color: tierStyle.text,
                fontSize: '1.25rem',
                fontWeight: 800,
                border: `2px solid ${tierStyle.border}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {getInitials(customer.name)}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {customer.name}
                </Typography>
                <Chip
                  label={`${customer.loyaltyTier || 'Bronze'} Member`}
                  size="small"
                  sx={{
                    background: tierStyle.bg,
                    color: tierStyle.text,
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    height: 22
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{customer.phone || 'No phone'}</Typography>
                </Box>
                {customer.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">{customer.email}</Typography>
                  </Box>
                )}
                {customer.birthday && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonth sx={{ fontSize: 14, color: '#D97706' }} />
                    <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 700 }}>
                      Birthday: {customer.birthday}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Quick Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Tooltip title="Direct WhatsApp">
                <IconButton
                  onClick={handleWhatsApp}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(37, 211, 102, 0.1)',
                    color: '#25D366',
                    '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.2)' }
                  }}
                >
                  <WhatsApp fontSize="small" />
                </IconButton>
              </Tooltip>

              {(customer.totalDue || 0) > 0 && onRecordPayment && (
                <Tooltip title="Clear Balance (Khata)">
                  <IconButton
                    onClick={() => onRecordPayment(customer.id)}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(239, 68, 68, 0.1)',
                      color: 'error.main',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' }
                    }}
                  >
                    <Payments fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Quick Metrics Bar */}
          <Grid container spacing={1.5} sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Grid item xs={3}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Spent
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F766E' }}>
                ₹{(customer.totalSpent || 0).toLocaleString('en-IN')}
              </Typography>
            </Grid>

            <Grid item xs={3}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Visits
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {customer.visitCount || 0}
              </Typography>
            </Grid>

            <Grid item xs={3}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Points
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#D97706' }}>
                {customer.loyaltyPoints || 0}
              </Typography>
            </Grid>

            <Grid item xs={3}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Balance Due
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 800,
                  color: (customer.totalDue || 0) > 0 ? 'error.main' : 'success.main'
                }}
              >
                ₹{(customer.totalDue || 0).toLocaleString('en-IN')}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Section Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{ minHeight: 40 }}
          >
            <Tab
              icon={<Straighten fontSize="small" />}
              iconPosition="start"
              label="Measurements"
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', minHeight: 40 }}
            />
            <Tab
              icon={<ReceiptLong fontSize="small" />}
              iconPosition="start"
              label={`Ledger (${customerInvoices.length})`}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', minHeight: 40 }}
            />
            <Tab
              icon={<Notes fontSize="small" />}
              iconPosition="start"
              label="Style & Notes"
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', minHeight: 40 }}
            />
          </Tabs>
        </Box>

        {/* TAB 0: Bespoke Garment Measurements */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Bespoke Atelier Specifications
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tailoring measurements for custom blouses, lehengas & suits (in inches)
                </Typography>
              </Box>

              <TextField
                select
                size="small"
                label="Fit Profile"
                value={measurements.preferredFit}
                onChange={(e) => setMeasurements({ ...measurements, preferredFit: e.target.value })}
                sx={{ width: 140 }}
              >
                <MenuItem value="Relaxed">Relaxed Fit</MenuItem>
                <MenuItem value="Standard">Standard Fit</MenuItem>
                <MenuItem value="Tailored Slim">Tailored Slim</MenuItem>
              </TextField>
            </Box>

            <Grid container spacing={2}>
              {[
                { key: 'bust', label: 'Bust / Chest' },
                { key: 'waist', label: 'Waist' },
                { key: 'hip', label: 'Hip' },
                { key: 'shoulder', label: 'Shoulder' },
                { key: 'sleeveLength', label: 'Sleeve Length' },
                { key: 'armhole', label: 'Armhole' },
                { key: 'garmentLength', label: 'Garment Length' },
                { key: 'neckFront', label: 'Front Neck' },
                { key: 'neckBack', label: 'Back Neck' }
              ].map((field) => (
                <Grid item xs={6} sm={4} key={field.key}>
                  <TextField
                    fullWidth
                    size="small"
                    label={field.label}
                    value={measurements[field.key] || ''}
                    onChange={(e) => setMeasurements({ ...measurements, [field.key]: e.target.value })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.secondary">in</Typography></InputAdornment>
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'background.paper'
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>

            <Button
              variant="contained"
              startIcon={<Save fontSize="small" />}
              onClick={handleSaveMeasurements}
              disabled={saving}
              sx={{
                mt: 1,
                py: 1,
                borderRadius: 2,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                color: '#FFFFFF'
              }}
            >
              {saving ? 'Saving Specs...' : saveSuccess ? 'Saved Successfully! ✓' : 'Save Measurements to Cloud'}
            </Button>
          </Box>
        )}

        {/* TAB 1: Invoices & Purchase Ledger */}
        {activeTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Order History & Financial Receipts
            </Typography>

            {customerInvoices.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 3 }}>
                <ReceiptLong sx={{ fontSize: 36, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  No purchases recorded yet for this client.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {customerInvoices.map((inv) => (
                  <Box
                    key={inv.id}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease-in-out',
                      '&:hover': {
                        borderColor: '#0F766E',
                        boxShadow: '0 4px 12px rgba(15,118,110,0.08)'
                      }
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                          #{inv.invoiceNumber || inv.id.slice(0, 8)}
                        </Typography>
                        <Chip
                          label={inv.paymentMethod || 'Cash'}
                          size="small"
                          sx={{ fontSize: '0.68rem', height: 20, fontWeight: 700 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                        {' • '}{inv.items?.length || 1} items
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F766E' }}>
                        ₹{(inv.total || 0).toLocaleString('en-IN')}
                      </Typography>
                      {inv.balanceDue > 0 && (
                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, display: 'block' }}>
                          Due: ₹{inv.balanceDue.toLocaleString('en-IN')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* TAB 2: Style Preferences & Private Notes */}
        {activeTab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Fabric & Color Palettes
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Curate tailored suggestions based on client favorites
              </Typography>
            </Box>

            <TextField
              fullWidth
              size="small"
              label="Preferred Fabrics"
              placeholder="e.g. Raw Silk, Banarasi, Chanderi, Pure Cotton"
              value={preferredFabrics}
              onChange={(e) => setPreferredFabrics(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              size="small"
              label="Preferred Colors & Aesthetics"
              placeholder="e.g. Emerald green, Wine, Pastels, Hand embroidery"
              value={preferredColors}
              onChange={(e) => setPreferredColors(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Private Stylist Notes"
              placeholder="Record fitting quirks, family celebrations, gift preferences..."
              value={styleNotes}
              onChange={(e) => setStyleNotes(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Button
              variant="contained"
              startIcon={<Save fontSize="small" />}
              onClick={handleSaveMeasurements}
              disabled={saving}
              sx={{
                py: 1,
                borderRadius: 2,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
                color: '#FFFFFF'
              }}
            >
              {saving ? 'Saving Notes...' : saveSuccess ? 'Saved Successfully! ✓' : 'Save Atelier Notes'}
            </Button>
          </Box>
        )}
      </Box>
    </SlideOverDrawer>
  );
}
