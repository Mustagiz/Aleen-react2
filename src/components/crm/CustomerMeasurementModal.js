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
  Chip
} from '@mui/material';
import {
  Straighten,
  Close,
  Save,
  CheckCircle,
  Person,
  Phone
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
  const { updateCustomer } = useData();
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

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
      setTailorNotes(customer.tailorNotes || customer.notes || '');
      setSaveSuccess(false);
      setError('');
    }
  }, [customer, open]);

  if (!customer) return null;

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
          updatedAt: new Date().toISOString()
        },
        tailorNotes
      });

      setSaveSuccess(true);
      if (onSaved) onSaved({ measurements, tailorNotes });
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
    { key: 'bust', label: 'Bust / Chest' },
    { key: 'waist', label: 'Waist' },
    { key: 'hip', label: 'Hip' },
    { key: 'shoulder', label: 'Shoulder' },
    { key: 'sleeveLength', label: 'Sleeve Length' },
    { key: 'armhole', label: 'Armhole' },
    { key: 'garmentLength', label: 'Kurta / Top Length' },
    { key: 'neckFront', label: 'Front Neck' },
    { key: 'neckBack', label: 'Back Neck' },
    { key: 'bottomLength', label: 'Bottom / Salwar Length' },
    { key: 'bottomWaist', label: 'Bottom Waist' },
    { key: 'thigh', label: 'Thigh / Leg Opening' }
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
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #042F2E 0%, #0F766E 100%)',
          color: '#FFFFFF',
          px: 3,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Straighten sx={{ fontSize: 24, color: '#34D399' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>
              Bespoke Measurement Profile
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Client: {customer.name} {customer.phone ? `(${customer.phone})` : ''}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#FFFFFF' }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {saveSuccess && (
          <Alert severity="success" icon={<CheckCircle fontSize="inherit" />} sx={{ borderRadius: 2 }}>
            Measurements saved successfully to cloud!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Fit Profile Selector */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'action.hover', p: 1.5, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Preferred Fit Profile
          </Typography>
          <TextField
            select
            size="small"
            value={measurements.preferredFit}
            onChange={(e) => setMeasurements({ ...measurements, preferredFit: e.target.value })}
            sx={{ width: 160 }}
          >
            <MenuItem value="Relaxed">Relaxed Fit</MenuItem>
            <MenuItem value="Standard">Standard Fit</MenuItem>
            <MenuItem value="Tailored Slim">Tailored Slim</MenuItem>
            <MenuItem value="Royal Comfort">Royal Comfort</MenuItem>
          </TextField>
        </Box>

        {/* Measurement Grid */}
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
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                        in
                      </Typography>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontFamily: 'monospace'
                  }
                }}
              />
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 0.5 }} />

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
              borderRadius: 2
            }
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="text" sx={{ color: 'text.secondary', fontWeight: 700 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Save fontSize="small" />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
            color: '#FFFFFF',
            fontWeight: 800,
            borderRadius: 2,
            px: 3,
            boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)'
          }}
        >
          {saving ? 'Saving...' : saveSuccess ? 'Saved! ✓' : 'Save Measurements'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
