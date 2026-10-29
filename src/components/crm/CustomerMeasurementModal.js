import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Grid,
  MenuItem,
  InputAdornment,
  Divider,
  Alert,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  useTheme
} from '@mui/material';
import {
  Straighten,
  Close,
  Save,
  CheckCircle,
  Person,
  Phone,
  Tune,
  AutoAwesome
} from '@mui/icons-material';
import { useData } from '../../contexts/DataContext';

/**
 * CustomerMeasurementModal
 * 
 * Standalone bespoke measurement profile editor.
 * Triggerable from POS Invoicing Dialog, Customer 360 Drawer, or Tailoring Kanban.
 */
export default function CustomerMeasurementModal({
  open,
  onClose,
  customer,
  onSaved
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { updateCustomer } = useData();
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [unit, setUnit] = useState('in');

  const [measurements, setMeasurements] = useState({
    bust: '',
    waist: '',
    hip: '',
    shoulder: '',
    sleeveLength: '',
    armhole: '',
    garmentLength: '',
    neckFront: '',
    neckBack: '',
    bottomLength: '',
    bottomWaist: '',
    thigh: '',
    preferredFit: 'Tailored Slim'
  });

  const [tailorNotes, setTailorNotes] = useState('');

  useEffect(() => {
    if (customer) {
      setMeasurements({
        bust: customer.measurements?.bust || '',
        waist: customer.measurements?.waist || '',
        hip: customer.measurements?.hip || '',
        shoulder: customer.measurements?.shoulder || '',
        sleeveLength: customer.measurements?.sleeveLength || '',
        armhole: customer.measurements?.armhole || '',
        garmentLength: customer.measurements?.garmentLength || '',
        neckFront: customer.measurements?.neckFront || '',
        neckBack: customer.measurements?.neckBack || '',
        bottomLength: customer.measurements?.bottomLength || '',
        bottomWaist: customer.measurements?.bottomWaist || '',
        thigh: customer.measurements?.thigh || '',
        preferredFit: customer.measurements?.preferredFit || 'Tailored Slim'
      });
      setUnit(customer.measurements?.unit || 'in');
      setTailorNotes(customer.tailorNotes || customer.notes || '');
      setSaveSuccess(false);
      setError('');
    }
  }, [customer, open]);

  if (!customer) return null;

  const handleUnitToggle = (event, newUnit) => {
    if (!newUnit || newUnit === unit) return;
    
    // Optional automatic conversion: 1 in = 2.54 cm
    const conversionFactor = newUnit === 'cm' ? 2.54 : (1 / 2.54);
    const converted = {};
    for (const [k, v] of Object.entries(measurements)) {
      if (k === 'preferredFit') {
        converted[k] = v;
        continue;
      }
      const num = parseFloat(v);
      if (!isNaN(num) && num > 0) {
        converted[k] = (num * conversionFactor).toFixed(1).replace(/\.0$/, '');
      } else {
        converted[k] = v;
      }
    }
    setMeasurements(converted);
    setUnit(newUnit);
  };

  const handleSave = async () => {
    if (!customer.id) {
      setError('Cannot save measurements without a registered customer profile.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateCustomer(customer.id, {
        measurements: {
          ...measurements,
          unit,
          updatedAt: new Date().toISOString()
        },
        tailorNotes
      });

      setSaveSuccess(true);
      if (onSaved) onSaved({ measurements: { ...measurements, unit }, tailorNotes });
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to update measurements:', err);
      setError(err.message || 'Failed to save measurements');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'bust', label: 'Bust / Chest', icon: '◈' },
    { key: 'waist', label: 'Waist', icon: '◈' },
    { key: 'hip', label: 'Hip', icon: '◈' },
    { key: 'shoulder', label: 'Shoulder', icon: '◈' },
    { key: 'sleeveLength', label: 'Sleeve Length', icon: '◈' },
    { key: 'armhole', label: 'Armhole', icon: '◈' },
    { key: 'garmentLength', label: 'Kurta / Top Length', icon: '◈' },
    { key: 'neckFront', label: 'Front Neck', icon: '◈' },
    { key: 'neckBack', label: 'Back Neck', icon: '◈' },
    { key: 'bottomLength', label: 'Bottom / Salwar Length', icon: '◈' },
    { key: 'bottomWaist', label: 'Bottom Waist', icon: '◈' },
    { key: 'thigh', label: 'Thigh / Leg Opening', icon: '◈' }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: 'hidden',
          backgroundColor: isDark ? '#0F1E1D' : '#FFFFFF',
          border: isDark ? '1px solid rgba(20, 184, 166, 0.22)' : '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.14)',
          boxShadow: isDark
            ? '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(20, 184, 166, 0.15)'
            : '0 24px 60px -8px rgba(10, 77, 70, 0.22), 0 4px 16px rgba(0, 0, 0, 0.06)'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: isDark
            ? 'linear-gradient(135deg, #042F2E 0%, #0B3835 50%, #0F1E1D 100%)'
            : 'linear-gradient(135deg, #0A4D46 0%, #0F766E 70%, #115E59 100%)',
          color: '#FFFFFF',
          px: 3,
          py: 2.25,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isDark ? '1px solid rgba(20, 184, 166, 0.2)' : '1px solid rgba(194, 141, 75, 0.3)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Straighten sx={{ fontSize: 24, color: '#2DD4BF' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.08rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              Bespoke Measurement Profile
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.3 }}>
              <span>Client:</span>
              <strong style={{ color: '#FCD34D' }}>{customer.name}</strong>
              {customer.phone && <span>• {customer.phone}</span>}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#FFFFFF', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {saveSuccess && (
          <Alert
            severity="success"
            icon={<CheckCircle fontSize="inherit" />}
            sx={{
              borderRadius: 2.5,
              fontWeight: 700,
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: isDark ? '#6EE7B7' : '#065F46'
            }}
          >
            Measurements saved successfully to client atelier profile!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2.5, fontWeight: 700 }}>
            {error}
          </Alert>
        )}

        {/* Fit Profile & Unit Toggle Bar */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5,
            p: 1.75,
            borderRadius: 2.5,
            bgcolor: isDark ? 'rgba(20, 184, 166, 0.05)' : 'rgba(15, 118, 110, 0.035)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(20, 184, 166, 0.14)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)'
          }}
        >
          {/* Fit Selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Tune sx={{ fontSize: 20, color: isDark ? '#2DD4BF' : '#0F766E' }} />
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                Fit Silhouette
              </Typography>
              <TextField
                select
                size="small"
                variant="standard"
                value={measurements.preferredFit}
                onChange={(e) => setMeasurements({ ...measurements, preferredFit: e.target.value })}
                sx={{
                  '& .MuiSelect-select': {
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    py: 0.25
                  }
                }}
              >
                <MenuItem value="Relaxed">Relaxed Fit</MenuItem>
                <MenuItem value="Standard">Standard Fit</MenuItem>
                <MenuItem value="Tailored Slim">Tailored Slim</MenuItem>
                <MenuItem value="Royal Comfort">Royal Comfort</MenuItem>
              </TextField>
            </Box>
          </Box>

          {/* Unit Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem' }}>
              Unit:
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={unit}
              exclusive
              onChange={handleUnitToggle}
              sx={{
                bgcolor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.9)',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.4,
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: '#FFFFFF',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }
                }
              }}
            >
              <ToggleButton value="in">Inches (in)</ToggleButton>
              <ToggleButton value="cm">Centimeters (cm)</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* 12-Point Measurement Grid */}
        <Grid container spacing={1.5}>
          {fields.map((field) => (
            <Grid item xs={6} sm={4} key={field.key}>
              <TextField
                fullWidth
                size="small"
                label={field.label}
                value={measurements[field.key] || ''}
                onChange={(e) => setMeasurements({ ...measurements, [field.key]: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography
                        variant="caption"
                        sx={{
                          color: isDark ? '#2DD4BF' : '#0F766E',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          fontFamily: 'monospace'
                        }}
                      >
                        {unit}
                      </Typography>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    fontSize: '0.82rem',
                    fontWeight: 600
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontFamily: '"Plus Jakarta Sans", monospace',
                    fontWeight: 700,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)'
                  }
                }}
              />
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 0.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)' }} />

        {/* Tailor & Styling Notes */}
        <TextField
          fullWidth
          multiline
          rows={2.5}
          size="small"
          label="Master Tailor Alteration & Styling Notes"
          placeholder="e.g. Deep V neck back, 2-inch extra margin inside blouse, padded cups, concealed zipper..."
          value={tailorNotes}
          onChange={(e) => setTailorNotes(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)'
            }
          }}
        />
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <Button onClick={onClose} variant="text" sx={{ color: 'text.secondary', fontWeight: 700 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Save fontSize="small" />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            background: isDark
              ? 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)'
              : 'linear-gradient(135deg, #0A4D46 0%, #0F766E 100%)',
            color: '#FFFFFF',
            fontWeight: 800,
            borderRadius: 2,
            px: 3.5,
            py: 1,
            boxShadow: isDark
              ? '0 4px 16px rgba(20, 184, 166, 0.35)'
              : '0 4px 16px rgba(10, 77, 70, 0.3)',
            '&:hover': {
              boxShadow: isDark
                ? '0 6px 20px rgba(20, 184, 166, 0.5)'
                : '0 6px 20px rgba(10, 77, 70, 0.45)'
            }
          }}
        >
          {saving ? 'Saving...' : saveSuccess ? 'Saved! ✓' : 'Save Measurements'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
