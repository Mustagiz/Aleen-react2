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
} from '../icons';
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
          width: { xs: '100%', sm: 860, md: 890 },
          maxWidth: '94vw',
          borderRadius: '18px',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 24px 64px -8px rgba(8, 15, 28, 0.18), 0 8px 24px -4px rgba(8, 15, 28, 0.08)'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              bgcolor: (t) => `${t.palette.primary.main}14`,
              border: '1px solid',
              borderColor: (t) => `${t.palette.primary.main}26`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <PhoneIphone sx={{ color: 'primary.main', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '1rem', sm: '1.15rem' }, lineHeight: 1.2 }}>
              Connect 2nd Screen / Customer Facing Display
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.04em', fontWeight: 600 }}>
              Live Real-Time Cloud & Dual-Monitor Pairing (iPad, Tablet, Phone or 2nd Monitor)
            </Typography>
          </Box>
        </Stack>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': { color: 'text.primary', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '340px 1fr' },
            gap: 2.5,
            alignItems: 'stretch'
          }}
        >
          {/* Left Column: QR Code Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#F9FAFC',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                sx={{
                  p: 1.25,
                  bgcolor: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 6px 20px rgba(8, 15, 28, 0.06)',
                  mb: 2,
                  display: 'inline-block'
                }}
              >
                <Box
                  component="img"
                  src={qrCodeUrl}
                  alt="Scan to open customer display"
                  sx={{
                    width: 190,
                    height: 190,
                    display: 'block'
                  }}
                />
              </Box>

              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.96rem', mb: 0.5 }}>
                Scan with iPad, Tablet or Phone
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.78rem', maxWidth: 280, mb: 2, lineHeight: 1.45 }}>
                Point secondary device camera at this QR code. The browser will instantly load the synchronized customer screen.
              </Typography>
            </Box>

            {/* Bottom Action Buttons (Aligned Grid, Identical Heights, No Wrap) */}
            <Box
              sx={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1.25,
                mt: 'auto'
              }}
            >
              <Button
                variant="outlined"
                size="small"
                startIcon={copied ? <Check sx={{ color: 'success.main', fontSize: 16 }} /> : <ContentCopy sx={{ fontSize: 16 }} />}
                onClick={handleCopyLink}
                sx={{
                  color: copied ? 'success.main' : 'text.primary',
                  borderColor: copied ? 'success.main' : 'divider',
                  bgcolor: copied ? 'rgba(16, 185, 129, 0.08)' : 'background.paper',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  height: 38,
                  whiteSpace: 'nowrap',
                  borderRadius: '9999px',
                  px: 1,
                  '&:hover': {
                    borderColor: 'text.primary',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<OpenInNew sx={{ fontSize: 16 }} />}
                onClick={() => {
                  if (onLaunchSameWindow) onLaunchSameWindow();
                  else window.open(customerDisplayUrl, 'AleenCustomerDisplay', 'width=1120,height=760,menubar=no,toolbar=no');
                }}
                sx={{
                  bgcolor: '#080F1C',
                  color: '#FFFFFF',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  height: 38,
                  whiteSpace: 'nowrap',
                  borderRadius: '9999px',
                  px: 1,
                  boxShadow: '0 2px 8px rgba(8, 15, 28, 0.2)',
                  '&:hover': {
                    bgcolor: '#1D2531'
                  }
                }}
              >
                Launch on PC
              </Button>
            </Box>
          </Paper>

          {/* Right Column: Connection details & Wi-Fi Setup */}
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Cloud Realtime Status Banner (Horizontally and Vertically Balanced) */}
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: '12px',
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid',
                  borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      bgcolor: '#10B981',
                      boxShadow: '0 0 8px #10B981',
                      flexShrink: 0
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        color: (t) => t.palette.mode === 'dark' ? '#34D399' : '#047857',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Cloud Firestore Live Stream Active
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#065F46',
                        display: 'block',
                        fontSize: '0.72rem',
                        mt: 0.25,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      Zero Latency • Live Cart Mirroring • Dynamic UPI QR
                    </Typography>
                  </Box>
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSendTestPing}
                  disabled={isPinging}
                  startIcon={<Sensors sx={{ fontSize: 15 }} />}
                  sx={{
                    color: (t) => t.palette.mode === 'dark' ? '#34D399' : '#047857',
                    borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(16, 185, 129, 0.35)',
                    bgcolor: 'background.paper',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    height: 32,
                    borderRadius: '9999px',
                    px: 1.5,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    '&:hover': {
                      borderColor: '#10B981',
                      bgcolor: 'rgba(16, 185, 129, 0.12)'
                    }
                  }}
                >
                  {isPinging ? 'Pinging...' : pingSuccess ? 'Ping Sent! ✓' : 'Send Test Pulse'}
                </Button>
              </Box>

              {/* Local Wi-Fi Network Guidance */}
              {isLocalhost && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid',
                    borderColor: 'rgba(245, 158, 11, 0.25)'
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                    <Wifi sx={{ color: '#D97706', fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: (t) => t.palette.mode === 'dark' ? '#FBBF24' : '#B45309' }}>
                      Shop Wi-Fi Pairing Notice (Localhost Detected)
                    </Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, lineHeight: 1.5 }}>
                    Because your POS is running locally on this machine, your iPad cannot reach <code>localhost</code> directly.
                    Enter your computer's local Wi-Fi IP address below (e.g. <code>192.168.1.15:3002</code>) to update the QR code:
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
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
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
                              bgcolor: 'rgba(16, 185, 129, 0.15)',
                              color: 'success.main',
                              fontWeight: 700
                            }}
                          />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                        borderRadius: '9px',
                        fontSize: '0.85rem'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.8, fontSize: '0.68rem' }}>
                    Tip: On macOS, find your IP under <strong>System Settings → Wi-Fi → Details → IP Address</strong>.
                  </Typography>
                </Box>
              )}

              {/* How it works */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: '14px',
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#F9FAFC',
                  borderColor: 'divider'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    display: 'block',
                    mb: 1.5
                  }}
                >
                  HOW CUSTOMER SCREEN PAIRING WORKS
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    { num: '1', title: 'Place Device on Counter', desc: 'Mount your iPad or tablet facing the patron at your checkout desk.' },
                    { num: '2', title: 'Scan Once', desc: 'Scan this QR code using the iPad camera. It launches the Aleen Customer Terminal.' },
                    { num: '3', title: 'Automatic Realtime Sync', desc: 'As you barcode-scan items or apply discounts, the display updates with 0ms delay.' }
                  ].map((step) => (
                    <Box key={step.num} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          bgcolor: '#080F1C',
                          color: '#FFFFFF',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.2
                        }}
                      >
                        {step.num}
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', display: 'block', lineHeight: 1.3 }}>
                          {step.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.78rem', lineHeight: 1.4 }}>
                          {step.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Box>

            {/* Target URL Preview (Matching 38px Height with Left Column Buttons) */}
            <Box
              sx={{
                px: 1.75,
                py: 0.5,
                borderRadius: '10px',
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#F4F5F7',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                minHeight: 38,
                boxSizing: 'border-box'
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  ACTIVE DISPLAY URL:
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    fontFamily: 'monospace',
                    color: 'text.primary',
                    fontWeight: 600,
                    fontSize: '0.76rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {customerDisplayUrl}
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleCopyLink} sx={{ color: copied ? 'success.main' : 'text.secondary', p: 0.5 }}>
                {copied ? <Check sx={{ fontSize: 16 }} /> : <ContentCopy sx={{ fontSize: 16 }} />}
              </IconButton>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
          Powered by Aleen Haute Couture Dual-Screen Live Engine
        </Typography>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: '#080F1C',
            color: '#FFFFFF',
            fontWeight: 700,
            textTransform: 'none',
            px: 3.5,
            py: 0.8,
            borderRadius: '9999px',
            boxShadow: '0 2px 8px rgba(8, 15, 28, 0.2)',
            '&:hover': {
              bgcolor: '#1D2531'
            }
          }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
