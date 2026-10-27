import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Paper,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Close,
  QrCode2,
  ContentCopy,
  CheckCircle,
  AccountBalanceWallet,
  CurrencyRupee,
  DoneAll
} from '@mui/icons-material';
import { generateUpiPaymentUrl } from '../../engine/billingEngine';

/**
 * UpiPaymentQrModal
 * Luxury Dynamic UPI QR Code Payment Modal for Aleen POS Checkout
 */
export default function UpiPaymentQrModal({
  open,
  onClose,
  amount = 0,
  invoiceNumber = '',
  profile = {},
  onPaymentConfirmed
}) {
  const [copied, setCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const storeVpa = profile?.upiVpa || profile?.upiId || 'aleenclothing@icici';
  const storeName = profile?.businessName || 'Aleen Clothing';

  const upiUrl = generateUpiPaymentUrl({
    vpa: storeVpa,
    payeeName: storeName,
    amount,
    invoiceNumber
  });

  const qrImageUrl = upiUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(upiUrl)}`
    : '';

  const handleCopyLink = async () => {
    if (!upiUrl) return;
    try {
      await navigator.clipboard.writeText(upiUrl);
      setCopied(true);
      setSnackbarOpen(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy UPI link:', err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          border: '1px solid rgba(15, 118, 110, 0.2)'
        }
      }}
    >
      <DialogTitle
        sx={{
          py: 2,
          px: 3,
          background: 'linear-gradient(135deg, #0A4D46 0%, #042F2E 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <QrCode2 sx={{ color: '#F59E0B', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '0.02em', lineHeight: 1.2 }}>
              Scan & Pay via UPI
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
              {storeName} • Instant Verification
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#FFFFFF', opacity: 0.85, '&:hover': { opacity: 1 } }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
        {/* Payable Amount Highlight */}
        <Box sx={{ my: 1 }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', fontWeight: 700 }}>
            Total Amount Due
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', fontFeatureSettings: '"tnum"' }}>
              ₹{Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          {invoiceNumber && (
            <Chip
              label={`Invoice #${invoiceNumber}`}
              size="small"
              sx={{ mt: 1, bgcolor: 'rgba(15, 118, 110, 0.08)', color: 'primary.main', fontWeight: 700, fontSize: '0.72rem' }}
            />
          )}
        </Box>

        {/* QR Code Container */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            my: 2.5,
            display: 'inline-block',
            borderRadius: 3,
            bgcolor: '#FFFFFF',
            border: '2px solid rgba(15, 118, 110, 0.2)',
            boxShadow: '0 8px 30px rgba(10, 77, 70, 0.12)'
          }}
        >
          {qrImageUrl ? (
            <Box
              component="img"
              src={qrImageUrl}
              alt="UPI QR Code"
              sx={{
                width: 210,
                height: 210,
                display: 'block',
                borderRadius: 1.5
              }}
            />
          ) : (
            <Box sx={{ width: 210, height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="error">
                Please enter a valid amount to generate UPI QR
              </Typography>
            </Box>
          )}
        </Paper>

        {/* VPA Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Chip
            icon={<AccountBalanceWallet sx={{ fontSize: '15px !important' }} />}
            label={storeVpa}
            size="small"
            sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: 'background.paper', border: '1px solid rgba(0,0,0,0.08)' }}
          />
          <Tooltip title={copied ? 'Copied!' : 'Copy UPI Link'}>
            <IconButton size="small" onClick={handleCopyLink} sx={{ color: 'primary.main' }}>
              {copied ? <CheckCircle fontSize="small" sx={{ color: '#10B981' }} /> : <ContentCopy fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'text.secondary', fontSize: '0.72rem' }}>
          Supports Google Pay, PhonePe, Paytm, BHIM, Cred & all UPI banking apps
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 0, justifyContent: 'space-between', bgcolor: 'background.default' }}>
        <Button variant="outlined" onClick={onClose} sx={{ color: 'text.secondary', borderColor: 'divider' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DoneAll />}
          onClick={() => {
            if (onPaymentConfirmed) onPaymentConfirmed();
            onClose();
          }}
          sx={{
            px: 3,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #0A4D46 0%, #0F766E 100%)',
            boxShadow: '0 4px 16px rgba(10, 77, 70, 0.35)'
          }}
        >
          Payment Received
        </Button>
      </DialogActions>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%', fontWeight: 700 }}>
          UPI payment link copied to clipboard!
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
