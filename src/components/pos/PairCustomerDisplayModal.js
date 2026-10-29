import React, { useState, useMemo } from 'react';
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
  InputAdornment,
  Chip,
  Stack,
  Paper
} from '@mui/material';
import {
  Close,
  ContentCopy,
  Check,
  PhoneIphone,
  Wifi,
  Sensors,
  OpenInNew
} from '@mui/icons-material';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function PairCustomerDisplayModal({
  open,
  onClose,
  profile,
  onLaunchSameWindow
}) {
  const [customIp, setCustomIp] = useState('');
  const [copied, setCopied] = useState(false);
  const [pingSuccess, setPingSuccess] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const isLocalhost = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local')
    );
  }, []);

  // Compute the exact URL the customer display is reachable at
  const customerDisplayUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/customer-display';
    if (customIp && customIp.trim()) {
      let clean = customIp.trim();
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = `http://${clean}`;
      }
      // Remove trailing slash
      clean = clean.replace(/\/+$/, '');
      return `${clean}/customer-display`;
    }
    return `${window.location.origin}/customer-display`;
  }, [customIp]);

  // Dynamic QR Code generation (High resolution, crisp margin)
  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(customerDisplayUrl)}`;
  }, [customerDisplayUrl]);

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(customerDisplayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendTestPing = async () => {
    setIsPinging(true);
    try {
      await setDoc(
        doc(db, 'cfd_live_sessions', 'primary'),
        {
          testPing: Date.now(),
          testMessage: 'Ping from Cashier Terminal',
          storeName: profile?.businessName || 'Aleen Clothing',
          updatedAt: Date.now()
        },
        { merge: true }
      );
      setPingSuccess(true);
      setTimeout(() => setPingSuccess(false), 3500);
    } catch (err) {
      console.warn('Failed to dispatch test ping:', err);
    } finally {
      setIsPinging(false);
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
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: '#0F172A',
          color: '#F8FAFC',
          border: '1px solid rgba(197, 160, 89, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(197, 160, 89, 0.12)'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: { xs: 2.5, sm: 3 },
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: (t) => `0 4px 14px ${t.palette.primary.main}55`
            }}
          >
            <PhoneIphone sx={{ color: '#FFFFFF', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: { xs: '1rem', sm: '1.2rem' } }}>
              Connect 2nd Screen / Customer Facing Display
            </Typography>
            <Typography variant="caption" sx={{ color: (t) => t.palette.primary.light || '#C5A059', letterSpacing: '0.08em', fontWeight: 600 }}>
              Live Real-Time Cloud & Dual-Monitor Pairing (iPad, Tablet, Phone or 2nd Monitor)
            </Typography>
          </Box>
        </Stack>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
            '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
          {/* Left Column: QR Code Card */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: 3,
              borderRadius: 3.5,
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(197, 160, 89, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            <Box
              sx={{
                p: 1.5,
                bgcolor: '#FFFFFF',
                borderRadius: 3,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(197, 160, 89, 0.3)',
                mb: 2.5,
                display: 'inline-block'
              }}
            >
              <Box
                component="img"
                src={qrCodeUrl}
                alt="Scan to open customer display"
                sx={{
                  width: { xs: 210, sm: 240 },
                  height: { xs: 210, sm: 240 },
                  display: 'block'
                }}
              />
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 0.5 }}>
              Scan with iPad, Tablet or Phone Camera
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: 280, mb: 2 }}>
              Point your iPad or mobile phone camera at this QR code. The browser will open the live, customer-facing terminal.
            </Typography>

            <Stack direction="row" spacing={1.5} sx={{ width: '100%' }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={copied ? <Check sx={{ color: '#34D399' }} /> : <ContentCopy />}
                onClick={handleCopyLink}
                sx={{
                  color: copied ? '#34D399' : '#C5A059',
                  borderColor: copied ? 'rgba(52, 211, 153, 0.4)' : 'rgba(197, 160, 89, 0.4)',
                  bgcolor: copied ? 'rgba(52, 211, 153, 0.08)' : 'transparent',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  py: 1,
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: '#C5A059',
                    bgcolor: 'rgba(197, 160, 89, 0.1)'
                  }
                }}
              >
                {copied ? 'Link Copied!' : 'Copy Display Link'}
              </Button>

              <Button
                fullWidth
                variant="contained"
                size="small"
                startIcon={<OpenInNew />}
                onClick={() => {
                  if (onLaunchSameWindow) onLaunchSameWindow();
                  else window.open(customerDisplayUrl, 'AleenCustomerDisplay', 'width=1120,height=760,menubar=no,toolbar=no');
                }}
                sx={{
                  background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
                  color: '#FFFFFF',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  py: 1,
                  borderRadius: 2,
                  boxShadow: (t) => `0 4px 14px ${t.palette.primary.main}55`,
                  '&:hover': {
                    filter: 'brightness(1.08)'
                  }
                }}
              >
                Launch on PC
              </Button>
            </Stack>
          </Paper>

          {/* Right Column: Connection details & Wi-Fi Setup */}
          <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              {/* Cloud Realtime Status */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  mb: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: '#10B981',
                      boxShadow: '0 0 10px #10B981'
                    }}
                  />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#34D399' }}>
                      Cloud Firestore Live Stream Active
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Zero Latency • Live Cart Mirroring • Dynamic UPI QR
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSendTestPing}
                  disabled={isPinging}
                  startIcon={<Sensors sx={{ fontSize: 16 }} />}
                  sx={{
                    color: '#34D399',
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    borderRadius: 1.8,
                    '&:hover': { borderColor: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.12)' }
                  }}
                >
                  {isPinging ? 'Pinging...' : pingSuccess ? 'Ping Sent! ✓' : 'Send Test Pulse'}
                </Button>
              </Box>

              {/* Local Wi-Fi Network Guidance */}
              {isLocalhost && (
                <Box
                  sx={{
                    p: 2.2,
                    borderRadius: 3,
                    bgcolor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    mb: 2.5
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Wifi sx={{ color: '#FBBF24', fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#FBBF24' }}>
                      Shop Wi-Fi Pairing Notice (Localhost Detected)
                    </Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', display: 'block', mb: 1.5, lineHeight: 1.5 }}>
                    Because your POS is running locally on this Mac/PC, your iPad or phone cannot reach <code>localhost</code> directly.
                    Enter your computer's local Wi-Fi IP address below (e.g. <code>192.168.1.15:3002</code>) to immediately update the QR code for your iPad:
                  </Typography>

                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 192.168.1.15:3002"
                    value={customIp}
                    onChange={(e) => setCustomIp(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>
                            http://
                          </Typography>
                        </InputAdornment>
                      ),
                      endAdornment: customIp && (
                        <InputAdornment position="end">
                          <Chip
                            size="small"
                            label="QR Updated"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              bgcolor: 'rgba(52, 211, 153, 0.15)',
                              color: '#34D399',
                              fontWeight: 700
                            }}
                          />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(0, 0, 0, 0.3)',
                        color: '#FFFFFF',
                        borderRadius: 2,
                        fontSize: '0.85rem',
                        '& fieldset': { borderColor: 'rgba(245, 158, 11, 0.35)' },
                        '&:hover fieldset': { borderColor: '#FBBF24' },
                        '&.Mui-focused fieldset': { borderColor: '#FBBF24' }
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.45)', display: 'block', mt: 0.8, fontSize: '0.68rem' }}>
                    Tip: On macOS, find your IP under <strong>System Settings → Wi-Fi → Details → IP Address</strong>.
                  </Typography>
                </Box>
              )}

              {/* How it works */}
              <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <Typography variant="overline" sx={{ color: '#C5A059', letterSpacing: '0.12em', fontWeight: 700 }}>
                  HOW CUSTOMER SCREEN PAIRING WORKS
                </Typography>
                <Stack spacing={1.2} sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', display: 'block' }}>
                    <strong>1. Place Device on Counter:</strong> Mount your iPad or tablet facing the patron at your checkout desk.
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', display: 'block' }}>
                    <strong>2. Scan Once:</strong> Scan this QR code using the iPad camera. It launches the Aleen Customer Terminal.
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', display: 'block' }}>
                    <strong>3. Automatic Realtime Sync:</strong> As you barcode-scan items, select discounts, or switch to UPI, the iPad updates in real time with dynamic UPI QR and personalized patron greetings.
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* Target URL Preview */}
            <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block' }}>
                Active Display URL:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  color: '#C5A059',
                  wordBreak: 'break-all',
                  fontSize: '0.78rem'
                }}
              >
                {customerDisplayUrl}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          bgcolor: 'rgba(15, 23, 42, 0.95)',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.45)' }}>
          Powered by Aleen Haute Couture Dual-Screen Live Engine
        </Typography>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
            color: '#FFFFFF',
            fontWeight: 700,
            textTransform: 'none',
            px: 3,
            borderRadius: 2
          }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
