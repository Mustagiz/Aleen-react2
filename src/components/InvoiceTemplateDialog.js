import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Switch,
  FormControlLabel,
  TextField,
  MenuItem,
  Divider,
  Chip,
  Tabs,
  Tab,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Close,
  Palette,
  CloudUpload,
  Delete,
  CheckCircle,
  AccountBalance,
  DescriptionOutlined,
  ImageOutlined,
  Visibility
} from '@mui/icons-material';
import { INVOICE_TEMPLATES, DEFAULT_INVOICE_SETTINGS } from '../constants/invoiceTemplates';
import { useData } from '../contexts/DataContext';
import InvoicePrint from './InvoicePrint';

const SAMPLE_INVOICE = {
  id: 'INV-SAMPLE-01',
  date: new Date().toISOString(),
  customer: 'Sultana Begum',
  phone: '+91 98450 11223',
  items: [
    { name: 'Pure Raw Silk Bridal Lehenga with Hand Zari', category: 'Bridal Couture', quantity: 1, price: 28500 },
    { name: 'Organza Embroidered Dupatta with Scallop Hem', category: 'Accessories', quantity: 1, price: 4200 },
    { name: 'Custom Handcrafted Velvet Blouse Fitting', category: 'Bespoke Tailoring', quantity: 1, price: 3500 }
  ],
  subtotal: 36200,
  discount: 1810,
  discountPercentage: 5,
  gst: 18,
  tax: 6190.20,
  total: 40580.20,
  paymentStatus: 'paid',
  status: 'paid',
  paidAmount: 40580.20,
  balanceDue: 0,
  isSample: true,
  paymentMethod: 'UPI / Split Payment',
  notes: 'Client fitting scheduled for 28th Oct. Roll pressing included.'
};

export default function InvoiceTemplateDialog({ open, onClose, settings, onSaveSettings }) {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const dataCtx = useData() || {};
  const { updateInvoiceTemplateSettings } = dataCtx;

  const [tabIndex, setTabIndex] = useState(0);
  const [localSettings, setLocalSettings] = useState(() => settings || dataCtx.invoiceTemplateSettings || DEFAULT_INVOICE_SETTINGS);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    } else if (dataCtx.invoiceTemplateSettings) {
      setLocalSettings(dataCtx.invoiceTemplateSettings);
    }
  }, [settings, dataCtx.invoiceTemplateSettings]);

  const handleTemplateSelect = (templateId) => {
    setLocalSettings(prev => ({ ...prev, template: templateId }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      alert('Image file is too large (max 2.5MB). Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLocalSettings(prev => ({
        ...prev,
        customLetterheadImage: event.target.result,
        useCustomLetterhead: true
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLetterhead = () => {
    setLocalSettings(prev => ({
      ...prev,
      customLetterheadImage: '',
      useCustomLetterhead: false
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    try {
      localStorage.setItem('aleen_invoice_template_settings', JSON.stringify(localSettings));
      if (updateInvoiceTemplateSettings) {
        await updateInvoiceTemplateSettings(localSettings);
      }
      if (onSaveSettings) onSaveSettings(localSettings);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Error saving template settings:', err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isTablet}
      PaperProps={{
        sx: {
          borderRadius: isTablet ? 0 : 3,
          overflow: 'hidden',
          maxHeight: isTablet ? '100%' : '92vh'
        }
      }}
    >
      {/* Luxury Header Banner */}
      <Box
        sx={{
          background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.dark || '#042F2E'} 0%, ${t.palette.primary.main} 100%)`,
          color: '#ffffff',
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: 'rgba(217, 119, 6, 0.2)',
              border: '1px solid rgba(217, 119, 6, 0.4)',
              display: 'flex'
            }}
          >
            <Palette sx={{ color: '#FDE68A', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: -0.2 }}>
              Invoice Template & Letterhead Studio
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Choose luxury couture styles, upload custom graphic letterheads, and customize branding
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.85)' }}>
          <Close />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, bgcolor: 'background.paper' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, val) => setTabIndex(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.86rem' }
          }}
        >
          <Tab icon={<Palette fontSize="small" />} iconPosition="start" label="1. Select Template Style" />
          <Tab icon={<ImageOutlined fontSize="small" />} iconPosition="start" label="2. Custom Letterhead / Logo" />
          <Tab icon={<AccountBalance fontSize="small" />} iconPosition="start" label="3. Bank, Terms & Notes" />
          <Tab icon={<Visibility fontSize="small" />} iconPosition="start" label="4. Live Full Preview" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            Invoice template settings saved successfully! All future invoices and PDF exports will use this styling.
          </Alert>
        )}

        {/* TAB 0: Choose Template Style */}
        {tabIndex === 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Choose Atelier Invoice Template
              </Typography>
              <Chip
                label={`${INVOICE_TEMPLATES.length} Luxury Templates`}
                size="small"
                sx={{
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.1)',
                  color: (t) => t.palette.primary.main,
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  borderRadius: '6px',
                  border: (t) => `1px solid ${t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.2)'}`
                }}
              />
            </Box>

            <Grid container spacing={2.5}>
              {INVOICE_TEMPLATES.map((tmpl) => {
                const isSelected = localSettings.template === tmpl.id;
                return (
                  <Grid item xs={12} sm={6} md={3} key={tmpl.id}>
                    <Card
                      onClick={() => handleTemplateSelect(tmpl.id)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 2.5,
                        height: '100%',
                        position: 'relative',
                        border: '2px solid',
                        borderColor: isSelected ? tmpl.primaryColor : 'divider',
                        boxShadow: isSelected ? `0 6px 20px ${tmpl.primaryColor}30` : '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: tmpl.primaryColor,
                          transform: 'translateY(-3px)'
                        }
                      }}
                    >
                      {/* Top Header Mockup */}
                      <Box
                        sx={{
                          p: 2,
                          background: tmpl.headerBg,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '0.85rem' }}>
                          {tmpl.name}
                        </Typography>
                        {isSelected ? (
                          <CheckCircle sx={{ color: '#FDE68A', fontSize: 20 }} />
                        ) : (
                          <Chip
                            label={tmpl.badge}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              bgcolor: 'rgba(255,255,255,0.2)',
                              color: '#ffffff'
                            }}
                          />
                        )}
                      </Box>

                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: tmpl.primaryColor, display: 'block', mb: 0.5 }}>
                          {tmpl.tagline}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.78rem', mb: 2, minHeight: 36 }}>
                          {tmpl.description}
                        </Typography>

                        {/* Palette preview pills */}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: tmpl.primaryColor, border: '1px solid rgba(0,0,0,0.1)' }} />
                          <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: tmpl.secondaryColor, border: '1px solid rgba(0,0,0,0.1)' }} />
                          <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: tmpl.darkColor, border: '1px solid rgba(0,0,0,0.1)' }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto', fontWeight: 700, fontSize: '0.7rem' }}>
                            {isSelected ? 'ACTIVE' : 'Select'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Quick Preview of Selected Style */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.5 }}>
                Interactive Preview with Sample Bill:
              </Typography>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'grey.50', overflow: 'hidden' }}>
                <InvoicePrint invoice={SAMPLE_INVOICE} template={localSettings.template} settings={localSettings} />
              </Box>
            </Box>
          </Box>
        )}

        {/* TAB 1: Custom Letterhead / Logo */}
        {tabIndex === 1 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudUpload fontSize="small" /> Upload Custom Graphic Letterhead
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, fontSize: '0.84rem' }}>
                  Upload your boutique’s designed letterhead header banner (PNG / JPG / WebP). When enabled, this replaces the default vector header on all printed receipts and PDF invoices.
                </Typography>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />

                <Box
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    border: '2px dashed',
                    borderColor: (t) => localSettings.customLetterheadImage ? t.palette.primary.main : t.palette.divider,
                    borderRadius: 3,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: localSettings.customLetterheadImage ? 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)' : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: (t) => t.palette.primary.main,
                      bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.04)'
                    }
                  }}
                >
                  <CloudUpload sx={{ fontSize: 44, color: (t) => t.palette.primary.main, mb: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    Click or Drag to Upload Letterhead
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                    Recommended size: 1200 x 240px (Max 2.5MB) • PNG, JPG, or SVG
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 2, borderRadius: 2, fontWeight: 700, borderColor: (t) => t.palette.primary.main, color: (t) => t.palette.primary.main }}
                  >
                    Select File
                  </Button>
                </Box>

                {/* Controls */}
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.useCustomLetterhead && Boolean(localSettings.customLetterheadImage)}
                        disabled={!localSettings.customLetterheadImage}
                        onChange={(e) => setLocalSettings({ ...localSettings, useCustomLetterhead: e.target.checked })}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Use Custom Letterhead on Invoices
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Display uploaded graphic banner at the top of PDF & printed invoices
                        </Typography>
                      </Box>
                    }
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.showWatermark}
                        onChange={(e) => setLocalSettings({ ...localSettings, showWatermark: e.target.checked })}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Show Subtle Atelier Watermark
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Adds a faint signature watermark in the center of the invoice
                        </Typography>
                      </Box>
                    }
                  />

                  {localSettings.showWatermark && (
                    <TextField
                      label="Watermark Text"
                      size="small"
                      value={localSettings.watermarkText}
                      onChange={(e) => setLocalSettings({ ...localSettings, watermarkText: e.target.value })}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              </Grid>

              {/* Letterhead Preview */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                  Current Uploaded Letterhead:
                </Typography>
                {localSettings.customLetterheadImage ? (
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: '#ffffff' }}>
                    <Box
                      component="img"
                      src={localSettings.customLetterheadImage}
                      alt="Custom Letterhead"
                      sx={{
                        width: '100%',
                        maxHeight: 180,
                        objectFit: 'contain',
                        borderRadius: 1,
                        border: '1px solid #f0f0f0',
                        bgcolor: '#fafafa'
                      }}
                    />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip label="Custom Graphic Active" color="success" size="small" sx={{ fontWeight: 700 }} />
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={handleRemoveLetterhead}
                        sx={{ fontWeight: 700 }}
                      >
                        Remove Letterhead
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No custom letterhead uploaded yet. The invoice will use the default luxury vector banner of the selected template.
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 2: Bank, Terms & Notes */}
        {tabIndex === 2 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalance fontSize="small" /> Bank Account & UPI Settlement Details
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.showBankDetails}
                      onChange={(e) => setLocalSettings({ ...localSettings, showBankDetails: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Print Bank Transfer & UPI Details on Bill</Typography>}
                />

                {localSettings.showBankDetails && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <TextField
                      select
                      label="Settlement Card Display"
                      size="small"
                      value={localSettings.leftBoxMode || 'luxury-composite'}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        leftBoxMode: e.target.value
                      })}
                      helperText="Choose what appears in place of raw bank numbers on invoices"
                    >
                      <MenuItem value="luxury-composite">⚜️ Luxury Composite (UPI QR + Loyalty + Care + Concierge)</MenuItem>
                      <MenuItem value="upi-qr">⚡ Dedicated Scan-to-Pay UPI QR Code</MenuItem>
                      <MenuItem value="loyalty-privileges">👑 Patron Loyalty & Atelier Privileges</MenuItem>
                      <MenuItem value="garment-care">✂️ Bespoke Garment Care & Alterations</MenuItem>
                      <MenuItem value="concierge">💬 VIP Social & Concierge Connect</MenuItem>
                      <MenuItem value="banking">🏛️ Traditional Bank Transfer Details (A/C & IFSC)</MenuItem>
                      <MenuItem value="none">🚫 Hidden / Blank</MenuItem>
                    </TextField>
                    <TextField
                      label="Bank Name & Branch"
                      size="small"
                      value={localSettings.bankDetails?.bankName || ''}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        bankDetails: { ...localSettings.bankDetails, bankName: e.target.value }
                      })}
                    />
                    <TextField
                      label="Account Number"
                      size="small"
                      value={localSettings.bankDetails?.accountNumber || ''}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        bankDetails: { ...localSettings.bankDetails, accountNumber: e.target.value }
                      })}
                    />
                    <TextField
                      label="IFSC Code"
                      size="small"
                      value={localSettings.bankDetails?.ifsc || ''}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        bankDetails: { ...localSettings.bankDetails, ifsc: e.target.value }
                      })}
                    />
                    <TextField
                      label="UPI ID / VPA (e.g. boutique@upi)"
                      size="small"
                      value={localSettings.bankDetails?.upiId || ''}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        bankDetails: { ...localSettings.bankDetails, upiId: e.target.value }
                      })}
                    />
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionOutlined fontSize="small" /> Terms & Conditions & Signatory
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Store Tagline"
                    size="small"
                    value={localSettings.tagline}
                    onChange={(e) => setLocalSettings({ ...localSettings, tagline: e.target.value })}
                  />

                  <TextField
                    label="Terms & Conditions (shown on bottom of invoice)"
                    multiline
                    rows={4}
                    size="small"
                    value={localSettings.termsText}
                    onChange={(e) => setLocalSettings({ ...localSettings, termsText: e.target.value })}
                  />

                  <TextField
                    label="Thank You Note"
                    size="small"
                    value={localSettings.customFooterNote}
                    onChange={(e) => setLocalSettings({ ...localSettings, customFooterNote: e.target.value })}
                  />

                  <TextField
                    label="Authorized Signatory Label"
                    size="small"
                    value={localSettings.signatureLabel}
                    onChange={(e) => setLocalSettings({ ...localSettings, signatureLabel: e.target.value })}
                  />

                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Authorized Signature Artwork:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button
                        variant="outlined"
                        component="label"
                        size="small"
                        startIcon={<CloudUpload />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Upload Signature Image
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setLocalSettings(prev => ({ ...prev, signatureImage: ev.target.result }));
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </Button>
                      {localSettings.signatureImage && (
                        <Button
                          variant="text"
                          color="error"
                          size="small"
                          onClick={() => setLocalSettings(prev => ({ ...prev, signatureImage: '' }))}
                          sx={{ textTransform: 'none' }}
                        >
                          Remove
                        </Button>
                      )}
                    </Box>
                    {localSettings.signatureImage && (
                      <Box sx={{ mt: 1, p: 0.75, border: '1px dashed #CBD5E1', display: 'inline-block', borderRadius: 1.5, bgcolor: '#F8FAFC' }}>
                        <img src={localSettings.signatureImage} alt="Signature" style={{ maxHeight: 54, maxWidth: 180, objectFit: 'contain' }} />
                      </Box>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 3: Live Full Preview */}
        {tabIndex === 3 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                Full Live Invoice Rendering ({localSettings.template}):
              </Typography>
              <Chip
                label={localSettings.useCustomLetterhead ? 'Using Custom Letterhead' : 'Using Preset Header'}
                color={localSettings.useCustomLetterhead ? 'secondary' : 'default'}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Box>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: '#ffffff', overflow: 'hidden' }}>
              <InvoicePrint invoice={SAMPLE_INVOICE} template={localSettings.template} settings={localSettings} />
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, px: 3, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
        <Button onClick={onClose} sx={{ fontWeight: 700, color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            px: 4,
            py: 1,
            borderRadius: '8px',
            fontWeight: 800,
            background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
            color: '#ffffff',
            boxShadow: (t) => `0 4px 14px ${t.palette.primary.main}55`
          }}
        >
          Save Template & Branding
        </Button>
      </DialogActions>
    </Dialog>
  );
}
