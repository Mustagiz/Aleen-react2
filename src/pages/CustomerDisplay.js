import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Divider,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Fullscreen,
  FullscreenExit,
  QrCode2,
  CheckCircle,
  Diamond,
  LocalMall,
  ShoppingBag,
  AccessTime,
  Wifi,
  AutoAwesome,
  VerifiedUser,
  Payments
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const CFD_CHANNEL_NAME = 'aleen_customer_display';
const CFD_STORAGE_KEY = 'aleen_cfd_state';

export default function CustomerDisplay() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // CFD State
  const [cfdState, setCfdState] = useState(() => {
    try {
      const saved = localStorage.getItem(CFD_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [connected, setConnected] = useState(true);
  const channelRef = useRef(null);

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // BroadcastChannel & LocalStorage Event Listeners
  useEffect(() => {
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel(CFD_CHANNEL_NAME);
        channelRef.current = bc;

        bc.onmessage = (event) => {
          if (!event.data) return;
          const { type, payload } = event.data;

          if (type === 'SYNC') {
            setCfdState(payload);
            setConnected(true);
            try {
              localStorage.setItem(CFD_STORAGE_KEY, JSON.stringify(payload));
            } catch (e) {}
          } else if (type === 'CLEAR') {
            setCfdState(null);
            try {
              localStorage.removeItem(CFD_STORAGE_KEY);
            } catch (e) {}
          } else if (type === 'HEARTBEAT') {
            setConnected(true);
          }
        };

        // Request initial sync from active POS tab
        bc.postMessage({ type: 'REQUEST_SYNC' });
      }
    } catch (err) {
      console.warn('BroadcastChannel error in CFD:', err);
    }

    // LocalStorage fallback listener (for cross-window sync)
    const handleStorage = (e) => {
      if (e.key === CFD_STORAGE_KEY) {
        try {
          const updated = e.newValue ? JSON.parse(e.newValue) : null;
          setCfdState(updated);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // Watch fullscreen change
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const storeName = cfdState?.storeName || 'Aleen Clothing';
  const storeLogo = cfdState?.storeLogo || null;
  const items = useMemo(() => cfdState?.items || [], [cfdState?.items]);
  const subtotal = cfdState?.subtotal || 0;
  const discount = cfdState?.discount || 0;
  const tax = cfdState?.tax || 0;
  const total = cfdState?.total || 0;
  const customerName = cfdState?.customerName || '';
  const customerTier = cfdState?.customerTier || 'Silver';
  const paymentMethod = cfdState?.paymentMethod || 'Cash';
  const upiUrl = cfdState?.upiUrl || '';
  const isSettled = cfdState?.status === 'settled';

  // Dynamic UPI QR code URL
  const qrCodeImageUrl = useMemo(() => {
    if (!upiUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(upiUrl)}`;
  }, [upiUrl]);

  const isEmptyCart = !items.length && !isSettled;

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        bgcolor: '#0a0d14',
        color: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* Ambient Luxury Background Glow */}
      <Box
        sx={{
          position: 'fixed',
          top: -150,
          right: -150,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(197, 160, 89, 0.12) 0%, rgba(10, 13, 20, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          bottom: -150,
          left: -150,
          width: 550,
          height: 550,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(10, 13, 20, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Top Luxury Banner */}
      <Box
        sx={{
          px: { xs: 2.5, md: 4 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
          bgcolor: 'rgba(15, 23, 42, 0.75)',
          zIndex: 10
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          {storeLogo ? (
            <Box
              component="img"
              src={storeLogo}
              alt={storeName}
              sx={{ width: 44, height: 44, borderRadius: 2, objectFit: 'contain' }}
            />
          ) : (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #c5a059 0%, #8f6e2b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(197, 160, 89, 0.3)'
              }}
            >
              <Diamond sx={{ color: '#ffffff', fontSize: 24 }} />
            </Box>
          )}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: '#ffffff',
                textTransform: 'uppercase',
                fontSize: { xs: '1rem', md: '1.2rem' }
              }}
            >
              {storeName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#c5a059',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                fontSize: '0.68rem'
              }}
            >
              Customer Facing Live Terminal
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2}>
          {customerName && (
            <Chip
              icon={<Diamond sx={{ fontSize: '1rem !important', color: '#c5a059 !important' }} />}
              label={`Guest: ${customerName} • ${customerTier}`}
              sx={{
                bgcolor: 'rgba(197, 160, 89, 0.12)',
                color: '#f3e8c7',
                border: '1px solid rgba(197, 160, 89, 0.3)',
                fontWeight: 600,
                fontSize: '0.82rem',
                display: { xs: 'none', sm: 'inline-flex' }
              }}
            />
          )}

          <Chip
            icon={<Wifi sx={{ fontSize: '0.9rem !important', color: connected ? '#10b981' : '#f59e0b' }} />}
            label={connected ? 'Live Sync' : 'Reconnecting'}
            size="small"
            sx={{
              bgcolor: connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              color: connected ? '#34d399' : '#fbbf24',
              border: `1px solid ${connected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
              fontWeight: 600,
              fontSize: '0.72rem'
            }}
          />

          <Stack direction="row" alignItems="center" spacing={0.6} sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            <AccessTime sx={{ fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, letterSpacing: '0.04em' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
          </Stack>

          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
            <IconButton
              onClick={toggleFullscreen}
              size="small"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)', color: '#ffffff' }
              }}
            >
              {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', p: { xs: 2, md: 3 }, gap: { xs: 2, md: 3 }, zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {/* STATE 1: BILL SETTLED SCREEN */}
          {isSettled ? (
            <motion.div
              key="settled"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Paper
                elevation={0}
                sx={{
                  maxWidth: 680,
                  width: '100%',
                  p: { xs: 4, md: 6 },
                  textAlign: 'center',
                  borderRadius: 4,
                  bgcolor: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(197, 160, 89, 0.4)',
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(197, 160, 89, 0.15)'
                }}
              >
                <Box
                  sx={{
                    width: 88,
                    height: 88,
                    mx: 'auto',
                    mb: 3,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <CheckCircle sx={{ fontSize: 52, color: '#ffffff' }} />
                </Box>

                <Typography
                  variant="overline"
                  sx={{ color: '#c5a059', letterSpacing: '0.2em', fontWeight: 700, fontSize: '0.9rem' }}
                >
                  TRANSACTION COMPLETE
                </Typography>

                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, mb: 1, color: '#ffffff' }}>
                  Thank You, {customerName || 'Honoured Patron'}!
                </Typography>

                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                  Your bespoke ensemble is being prepared. An e-bill receipt has been dispatched.
                </Typography>

                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    mb: 4
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                    Total Settled Amount
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#c5a059', mt: 0.5 }}>
                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                  <VerifiedUser sx={{ color: '#34d399', fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                    Official Atelier Authenticity Guaranteed • Crafted with Perfection
                  </Typography>
                </Stack>
              </Paper>
            </motion.div>
          ) : isEmptyCart ? (
            /* STATE 2: ELEGANT IDLE SCREENSAVER */
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Paper
                elevation={0}
                sx={{
                  maxWidth: 760,
                  width: '100%',
                  p: { xs: 4, md: 7 },
                  textAlign: 'center',
                  borderRadius: 4,
                  bgcolor: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)'
                }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                >
                  <Box
                    sx={{
                      width: 96,
                      height: 96,
                      mx: 'auto',
                      mb: 3,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.25) 0%, rgba(197, 160, 89, 0.05) 100%)',
                      border: '1px solid rgba(197, 160, 89, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Diamond sx={{ fontSize: 48, color: '#c5a059' }} />
                  </Box>
                </motion.div>

                <Typography
                  variant="overline"
                  sx={{ color: '#c5a059', letterSpacing: '0.24em', fontWeight: 700, fontSize: '0.85rem' }}
                >
                  WELCOME TO {storeName}
                </Typography>

                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    mt: 1,
                    mb: 2,
                    background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '1.8rem', md: '2.5rem' }
                  }}
                >
                  Bespoke Craftsmanship & Haute Couture
                </Typography>

                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: 540, mx: 'auto', mb: 4 }}>
                  Items scanned by the cashier will appear here in real time with live prices, discounts, and payment options.
                </Typography>

                <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                  <Chip
                    icon={<AutoAwesome sx={{ color: '#c5a059 !important' }} />}
                    label="Zero-Contact UPI Checkout"
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#e2e8f0', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  />
                  <Chip
                    icon={<ShoppingBag sx={{ color: '#38bdf8 !important' }} />}
                    label="Itemized Live Preview"
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#e2e8f0', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  />
                </Stack>
              </Paper>
            </motion.div>
          ) : (
            /* STATE 3: DUAL-SCREEN LIVE CART & UPI PAYMENT PREVIEW */
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', height: '100%', display: 'flex', gap: 24 }}
            >
              {/* Left Panel: Itemized Live Bill Stream (62%) */}
              <Box
                sx={{
                  flex: { xs: 1, md: 1.6 },
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3.5,
                  bgcolor: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  overflow: 'hidden'
                }}
              >
                {/* Cart Header */}
                <Box
                  sx={{
                    px: 3,
                    py: 2.2,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <LocalMall sx={{ color: '#c5a059', fontSize: 22 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '1.05rem' }}>
                      Selected Ensembles ({items.length} {items.length === 1 ? 'Item' : 'Items'})
                    </Typography>
                  </Stack>
                  {cfdState?.lastScannedItem && (
                    <Chip
                      size="small"
                      icon={<AutoAwesome sx={{ fontSize: '0.85rem !important', color: '#c5a059 !important' }} />}
                      label={`Just Added: ${cfdState.lastScannedItem}`}
                      sx={{
                        bgcolor: 'rgba(197, 160, 89, 0.15)',
                        color: '#f3e8c7',
                        border: '1px solid rgba(197, 160, 89, 0.3)',
                        fontWeight: 600,
                        fontSize: '0.72rem'
                      }}
                    />
                  )}
                </Box>

                {/* Scanned Items Scrollable Table */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
                  <Stack spacing={1.5}>
                    <AnimatePresence initial={false}>
                      {items.map((item, idx) => (
                        <motion.div
                          key={item.id || idx}
                          initial={{ opacity: 0, x: -20, scale: 0.98 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.22 }}
                        >
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2.5,
                              bgcolor: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.06)',
                                borderColor: 'rgba(197, 160, 89, 0.3)'
                              }
                            }}
                          >
                            <Box sx={{ flex: 1, pr: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                                {item.name}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.6 }}>
                                {item.variantDetails && (
                                  <Chip
                                    label={item.variantDetails}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.68rem',
                                      bgcolor: 'rgba(197, 160, 89, 0.12)',
                                      color: '#f3e8c7',
                                      fontWeight: 600
                                    }}
                                  />
                                )}
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                  ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                                </Typography>
                              </Stack>
                            </Box>

                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#c5a059', fontSize: '1.1rem' }}>
                                ₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                Qty: {item.quantity}
                              </Typography>
                            </Box>
                          </Paper>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </Stack>
                </Box>
              </Box>

              {/* Right Panel: Totals & Dynamic UPI QR Code (38%) */}
              <Box
                sx={{
                  flex: { xs: 1, md: 1 },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2.5
                }}
              >
                {/* Financial Summary Card */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3.5,
                    bgcolor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <Typography variant="overline" sx={{ color: '#c5a059', letterSpacing: '0.15em', fontWeight: 700 }}>
                    BILL SUMMARY
                  </Typography>

                  <Stack spacing={1.2} sx={{ mt: 1.5, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Subtotal
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                        ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>

                    {discount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#34d399', fontWeight: 600 }}>
                          Atelier Courtesy Discount
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#34d399' }}>
                          - ₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                    )}

                    {tax > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          Estimated Taxes / GST
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                          + ₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
                      Net Payable
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 900,
                        color: '#c5a059',
                        fontSize: { xs: '1.8rem', md: '2.2rem' }
                      }}
                    >
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Paper>

                {/* Dynamic UPI Payment / Tender Card */}
                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    p: 3,
                    borderRadius: 3.5,
                    bgcolor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(197, 160, 89, 0.3)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                  }}
                >
                  {paymentMethod === 'UPI' && qrCodeImageUrl ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          bgcolor: '#ffffff',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                          display: 'inline-block',
                          mb: 2
                        }}
                      >
                        <Box
                          component="img"
                          src={qrCodeImageUrl}
                          alt="Dynamic UPI QR Code"
                          sx={{ width: 190, height: 190, display: 'block' }}
                        />
                      </Box>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <QrCode2 sx={{ color: '#c5a059', fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff' }}>
                          Scan to Pay with Any UPI App
                        </Typography>
                      </Stack>

                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', maxWidth: 260 }}>
                        GPay • PhonePe • Paytm • BHIM • Banking Apps
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ py: 3 }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          mx: 'auto',
                          mb: 2,
                          borderRadius: '50%',
                          bgcolor: 'rgba(197, 160, 89, 0.1)',
                          border: '1px solid rgba(197, 160, 89, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Payments sx={{ color: '#c5a059', fontSize: 32 }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff' }}>
                        Tender: {paymentMethod}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5, maxWidth: 280 }}>
                        Please proceed with payment at the cashier counter.
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Subtle Footer Bar */}
      <Box
        sx={{
          py: 1.5,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          bgcolor: 'rgba(10, 13, 20, 0.8)',
          zIndex: 10
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
          Powered by Aleen Atelier Cloud Engine • BroadcastChannel Instant Synchronization
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
          Strictly Confidential & Encrypted Locally
        </Typography>
      </Box>
    </Box>
  );
}
