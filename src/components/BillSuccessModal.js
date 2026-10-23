import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  Paper,
  Chip,
  CircularProgress,
  InputAdornment,
  useTheme,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  CheckCircle,
  WhatsApp,
  Print,
  Download,
  Close,
  Phone,
  Person,
  Add,
  ContentCopy,
  Tune,
  PictureAsPdf,
  Chat
} from '@mui/icons-material';
import { INVOICE_WHATSAPP_TEMPLATES, generateInvoiceWhatsAppText } from './InvoiceWhatsAppDialog';

/**
 * BillSuccessModal
 * 
 * Interactive boutique post-checkout modal that appears immediately after a bill
 * is generated. Gives options to send either an official PDF Document Bill or a
 * formatted Text Summary Bill directly on WhatsApp, with live customer phone entry,
 * direct thermal/A4 printing, and PDF download.
 */
const BillSuccessModal = ({
  open,
  onClose,
  invoice,
  profile,
  onPrint,
  onDownloadPDF,
  onSharePDF,
  isDownloadingPDF,
  onOpenAdvancedWhatsApp,
  onNewBill,
  onUpdateInvoicePhone
}) => {
  const theme = useTheme();

  // Preferred WhatsApp share mode: 'pdf' (default) or 'text'
  const [whatsappMode, setWhatsappMode] = useState(() => {
    return localStorage.getItem('aleen_preferred_whatsapp_format') || 'pdf';
  });

  // Editable customer phone for WhatsApp dispatch
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isSharingPDF, setIsSharingPDF] = useState(false);

  // Synchronize phone whenever invoice changes
  useEffect(() => {
    if (invoice) {
      const rawPhone = invoice.phone || '';
      setCustomerPhone(rawPhone);
      setPhoneError('');
    }
  }, [invoice]);

  if (!invoice) return null;

  // Format currency
  const totalAmount = Number(invoice.total || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const itemCount = Array.isArray(invoice.items)
    ? invoice.items.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0)
    : 1;

  // Clean and format phone number for WhatsApp wa.me link
  const getFormattedPhone = () => {
    const digitsOnly = (customerPhone || '').replace(/[^0-9]/g, '');
    if (!digitsOnly) return '';
    // If user typed 10-digit Indian number without country code
    if (digitsOnly.length === 10) {
      return `91${digitsOnly}`;
    }
    // If already starts with 91 and has 12 digits
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      return digitsOnly;
    }
    return digitsOnly;
  };

  const handleModeChange = (mode) => {
    setWhatsappMode(mode);
    localStorage.setItem('aleen_preferred_whatsapp_format', mode);
  };

  // Compile WhatsApp text template
  const getCompiledMessageText = () => {
    const lastTemplateId = localStorage.getItem('aleen_last_whatsapp_template') || 'atelier_luxury';
    const templateObj = INVOICE_WHATSAPP_TEMPLATES.find(t => t.id === lastTemplateId) || INVOICE_WHATSAPP_TEMPLATES[0];
    const customSaved = localStorage.getItem(`aleen_custom_template_${templateObj.id}`);
    
    return generateInvoiceWhatsAppText(
      customSaved || templateObj.template,
      { ...invoice, phone: customerPhone },
      profile
    );
  };

  // 1. Send Text Bill on WhatsApp
  const handleSendTextWhatsApp = async () => {
    const formattedPhone = getFormattedPhone();

    if (!formattedPhone) {
      setPhoneError('Please enter customer mobile number');
      return;
    }

    if (formattedPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    setPhoneError('');
    setIsSendingWhatsApp(true);

    try {
      if (onUpdateInvoicePhone && customerPhone !== invoice.phone) {
        await onUpdateInvoicePhone(invoice.id, customerPhone);
      }

      const messageText = getCompiledMessageText();
      const encodedText = encodeURIComponent(messageText);
      const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

      window.open(waUrl, '_blank');

      setSnackbar({
        open: true,
        message: `Opening WhatsApp chat with ${customerPhone} (Text Bill)...`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error dispatching text WhatsApp bill:', err);
      setSnackbar({
        open: true,
        message: 'Could not open WhatsApp. Please check number and try again.',
        severity: 'error'
      });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // 2. Send PDF Bill on WhatsApp
  const handleSendPDFWhatsApp = async () => {
    const formattedPhone = getFormattedPhone();

    if (!formattedPhone) {
      setPhoneError('Please enter customer mobile number');
      return;
    }

    if (formattedPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    setPhoneError('');
    setIsSharingPDF(true);

    try {
      if (onUpdateInvoicePhone && customerPhone !== invoice.phone) {
        await onUpdateInvoicePhone(invoice.id, customerPhone);
      }

      const messageText = getCompiledMessageText();

      if (onSharePDF) {
        const result = await onSharePDF(invoice, customerPhone, messageText);
        if (result?.method === 'native-share') {
          setSnackbar({
            open: true,
            message: 'Opening share sheet — select WhatsApp to send PDF bill!',
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: `PDF downloaded to device & WhatsApp chat opened for ${customerPhone}!`,
            severity: 'success'
          });
        }
      } else {
        // Fallback: download PDF and open WhatsApp text
        if (onDownloadPDF) onDownloadPDF(invoice);
        const encodedText = encodeURIComponent(messageText);
        const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;
        window.open(waUrl, '_blank');
        setSnackbar({
          open: true,
          message: 'PDF downloaded & WhatsApp opened. Attach the PDF file in chat.',
          severity: 'info'
        });
      }
    } catch (err) {
      console.error('Error sharing PDF bill on WhatsApp:', err);
      setSnackbar({
        open: true,
        message: 'Error generating PDF. Please try sending Text bill instead.',
        severity: 'error'
      });
    } finally {
      setIsSharingPDF(false);
    }
  };

  const handleCopyReceiptText = async () => {
    try {
      const messageText = getCompiledMessageText();
      await navigator.clipboard.writeText(messageText);
      setSnackbar({ open: true, message: 'Receipt text copied to clipboard!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to copy text', severity: 'error' });
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 3, sm: 4 },
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            m: { xs: 1.5, sm: 3 }
          }
        }}
      >
        {/* Atelier Header Banner */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #042F2E 0%, #0F766E 60%, #115E59 100%)',
            color: '#FFFFFF',
            px: { xs: 2.5, sm: 3.5 },
            py: { xs: 2.5, sm: 3 },
            position: 'relative'
          }}
        >
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              position: 'absolute',
              top: 14,
              right: 14,
              color: 'rgba(255, 255, 255, 0.75)',
              '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255, 255, 255, 0.15)' }
            }}
          >
            <Close fontSize="small" />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: { xs: 46, sm: 54 },
                height: { xs: 46, sm: 54 },
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid rgba(255, 255, 255, 0.35)',
                color: '#34D399',
                flexShrink: 0
              }}
            >
              <CheckCircle sx={{ fontSize: { xs: 28, sm: 34 } }} />
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.25 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.25rem' }, letterSpacing: '-0.01em' }}>
                  Bill Generated Successfully!
                </Typography>
                <Chip
                  label={`#${invoice.id}`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    height: 22
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                Official invoice is recorded in system & ready for customer dispatch
              </Typography>
            </Box>
          </Box>
        </Box>

        <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Summary Snapshot Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,118,110,0.2)' : 'rgba(15,118,110,0.1)',
                  color: '#0F766E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Person fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', noWrap: true }}>
                  {invoice.customer || 'Walk-in Customer'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  {itemCount} {itemCount === 1 ? 'garment' : 'garments'} • {invoice.paymentMethod || 'Cash'} •{' '}
                  <Box component="span" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'success.main' }}>
                    {invoice.paymentStatus || 'Paid'}
                  </Box>
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="caption" sx={{ textTransform: 'uppercase', color: 'text.secondary', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.05em', display: 'block' }}>
                Total Bill Value
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: '#0F766E',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  letterSpacing: '-0.02em'
                }}
              >
                ₹{totalAmount}
              </Typography>
            </Box>
          </Paper>

          {/* Section 1: Customer WhatsApp Share Box with Text vs PDF Option */}
          <Paper
            elevation={0}
            sx={{
              p: 2.25,
              borderRadius: 3,
              border: '1.5px solid',
              borderColor: '#25D366',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(37, 211, 102, 0.05)' : '#F0FDF4',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.75
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: '#25D366',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <WhatsApp sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                    Share Bill on Customer WhatsApp
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                    Choose between official PDF document or itemized text receipt
                  </Typography>
                </Box>
              </Box>

              {onOpenAdvancedWhatsApp && (
                <Tooltip title="Customize Message or Switch Template">
                  <Button
                    size="small"
                    startIcon={<Tune sx={{ fontSize: 15 }} />}
                    onClick={() => {
                      onClose();
                      onOpenAdvancedWhatsApp(invoice);
                    }}
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      color: '#0F766E',
                      p: 0.5
                    }}
                  >
                    Template Studio
                  </Button>
                </Tooltip>
              )}
            </Box>

            {/* Format Selection Option Toggle: PDF Bill vs Text Bill */}
            <Box
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.25)' : '#FFFFFF',
                p: 0.5,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'rgba(37, 211, 102, 0.3)'
              }}
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
                <Button
                  size="small"
                  variant={whatsappMode === 'pdf' ? 'contained' : 'text'}
                  startIcon={<PictureAsPdf sx={{ fontSize: 17 }} />}
                  onClick={() => handleModeChange('pdf')}
                  sx={{
                    borderRadius: 2,
                    py: 0.8,
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    bgcolor: whatsappMode === 'pdf' ? '#0F766E' : 'transparent',
                    color: whatsappMode === 'pdf' ? '#FFFFFF' : 'text.primary',
                    boxShadow: whatsappMode === 'pdf' ? '0 2px 8px rgba(15, 118, 110, 0.25)' : 'none',
                    '&:hover': {
                      bgcolor: whatsappMode === 'pdf' ? '#0D6861' : 'rgba(15, 118, 110, 0.08)'
                    }
                  }}
                >
                  PDF Document Bill
                </Button>
                <Button
                  size="small"
                  variant={whatsappMode === 'text' ? 'contained' : 'text'}
                  startIcon={<Chat sx={{ fontSize: 17 }} />}
                  onClick={() => handleModeChange('text')}
                  sx={{
                    borderRadius: 2,
                    py: 0.8,
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    bgcolor: whatsappMode === 'text' ? '#25D366' : 'transparent',
                    color: whatsappMode === 'text' ? '#FFFFFF' : 'text.primary',
                    boxShadow: whatsappMode === 'text' ? '0 2px 8px rgba(37, 211, 102, 0.25)' : 'none',
                    '&:hover': {
                      bgcolor: whatsappMode === 'text' ? '#1EBE5D' : 'rgba(37, 211, 102, 0.08)'
                    }
                  }}
                >
                  Text Summary Bill
                </Button>
              </Box>
            </Box>

            {/* Mobile Number Input */}
            <TextField
              fullWidth
              size="small"
              label="Customer Mobile Number"
              placeholder="+91 98765 43210"
              value={customerPhone}
              onChange={(e) => {
                setCustomerPhone(e.target.value);
                if (phoneError) setPhoneError('');
              }}
              error={!!phoneError}
              helperText={phoneError || 'Default 10-digit mobile number with or without +91'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone sx={{ color: '#25D366', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: customerPhone && (
                  <InputAdornment position="end">
                    <Tooltip title="Copy formatted text to clipboard">
                      <IconButton size="small" onClick={handleCopyReceiptText}>
                        <ContentCopy fontSize="small" sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  fontWeight: 600,
                  fontSize: '0.92rem'
                }
              }}
            />

            {/* WhatsApp Dispatch Actions */}
            {whatsappMode === 'pdf' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={isSharingPDF}
                  startIcon={isSharingPDF ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdf sx={{ fontSize: 20 }} />}
                  onClick={handleSendPDFWhatsApp}
                  sx={{
                    py: 1.35,
                    bgcolor: '#0F766E',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: { xs: '0.86rem', sm: '0.92rem' },
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)',
                    '&:hover': {
                      bgcolor: '#0D6861',
                      boxShadow: '0 6px 18px rgba(15, 118, 110, 0.45)'
                    }
                  }}
                >
                  {isSharingPDF ? 'Generating & Attaching PDF...' : 'Share PDF Bill on WhatsApp'}
                </Button>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    size="small"
                    onClick={handleSendTextWhatsApp}
                    disabled={isSendingWhatsApp}
                    sx={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'text.secondary',
                      textTransform: 'none',
                      py: 0
                    }}
                  >
                    Or send as Text Summary instead
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={isSendingWhatsApp}
                  startIcon={isSendingWhatsApp ? <CircularProgress size={18} color="inherit" /> : <WhatsApp sx={{ fontSize: 20 }} />}
                  onClick={handleSendTextWhatsApp}
                  sx={{
                    py: 1.35,
                    bgcolor: '#25D366',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: { xs: '0.86rem', sm: '0.92rem' },
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                    '&:hover': {
                      bgcolor: '#1EBE5D',
                      boxShadow: '0 6px 18px rgba(37, 211, 102, 0.45)'
                    }
                  }}
                >
                  {isSendingWhatsApp ? 'Opening WhatsApp...' : 'Share Text Bill on WhatsApp'}
                </Button>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    size="small"
                    onClick={handleSendPDFWhatsApp}
                    disabled={isSharingPDF}
                    sx={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'text.secondary',
                      textTransform: 'none',
                      py: 0
                    }}
                  >
                    Or send as official PDF Invoice instead
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>

          {/* Section 2: Print & Download Quick Bar */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, display: 'block', fontSize: '0.7rem' }}>
              Print & Offline Invoices
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              {/* Print Receipt Button */}
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Print sx={{ color: '#0F766E' }} />}
                onClick={() => {
                  if (onPrint) onPrint(invoice);
                }}
                sx={{
                  py: 1.25,
                  borderRadius: 2.25,
                  border: '1.5px solid',
                  borderColor: 'divider',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  textTransform: 'none',
                  color: 'text.primary',
                  bgcolor: 'background.paper',
                  '&:hover': {
                    borderColor: '#0F766E',
                    bgcolor: 'rgba(15, 118, 110, 0.05)'
                  }
                }}
              >
                Print Receipt / Slip
              </Button>

              {/* Download PDF Button */}
              <Button
                variant="outlined"
                fullWidth
                disabled={isDownloadingPDF}
                startIcon={isDownloadingPDF ? <CircularProgress size={18} color="inherit" /> : <Download sx={{ color: '#D97706' }} />}
                onClick={() => {
                  if (onDownloadPDF) onDownloadPDF(invoice);
                }}
                sx={{
                  py: 1.25,
                  borderRadius: 2.25,
                  border: '1.5px solid',
                  borderColor: 'divider',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  textTransform: 'none',
                  color: 'text.primary',
                  bgcolor: 'background.paper',
                  '&:hover': {
                    borderColor: '#D97706',
                    bgcolor: 'rgba(217, 119, 6, 0.05)'
                  }
                }}
              >
                {isDownloadingPDF ? 'Generating PDF...' : 'Download PDF Bill'}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          {/* Dialog Bottom Actions */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5
            }}
          >
            {onNewBill ? (
              <Button
                variant="text"
                startIcon={<Add />}
                onClick={() => {
                  onClose();
                  onNewBill();
                }}
                sx={{
                  fontWeight: 700,
                  color: '#0F766E',
                  textTransform: 'none',
                  fontSize: '0.84rem'
                }}
              >
                + Create Next Bill (Alt+N)
              </Button>
            ) : <Box />}

            <Button
              variant="contained"
              onClick={onClose}
              sx={{
                px: 3,
                py: 0.9,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: '0.84rem',
                textTransform: 'none',
                bgcolor: 'text.primary',
                color: 'background.paper',
                '&:hover': {
                  bgcolor: 'text.secondary'
                }
              }}
            >
              Done
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BillSuccessModal;
