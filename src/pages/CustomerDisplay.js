import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Divider,
  Stack,
  Tooltip,
  Snackbar,
  Alert,
  Grid
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
  Payments,
  Stars,
  Redeem,
  CardMembership
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const CFD_CHANNEL_NAME = 'aleen_customer_display';
const CFD_STORAGE_KEY = 'aleen_cfd_state';

// Editorial Haute Couture Collection Showcase for Idle State
const ATELIER_COLLECTIONS = [
  {
    title: 'Bridal Heritage & Silk Lehengas',
    tagline: 'HAUTE COUTURE EMBELLISHMENTS',
    desc: 'Pure mulberry raw silks, antique zardozi needlework and handcrafted gota patti designed for timeless matrimonial grandeur.',
    highlights: ['Pure Silk Brocade', 'Hand-Crafted Zardozi', 'Bespoke Bridal Tailoring']
  },
  {
    title: 'Pure Handloom Chanderi & Banarasi',
    tagline: 'ARTISANAL WEAVING HERITAGE',
    desc: 'Curated directly from generational weaver clusters across Varanasi and Madhya Pradesh with certified silk purity.',
    highlights: ['Certified Pure Silk', 'Real Zari Borders', 'Generational Weaves']
  },
  {
    title: 'Bespoke Couture Tailoring & Alterations',
    tagline: 'MASTER ATELIER FITTING',
    desc: 'Precision silhouette sculpting and bespoke pattern craftsmanship tailored exactly to your personalized measurements.',
    highlights: ['Atelier Precision', 'Complimentary Adjustments', 'Perfect Silhouette']
  }
];

export default function CustomerDisplay() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSlide, setActiveSlide] = useState(0);
  const [pingAlert, setPingAlert] = useState(false);
  const [syncSource, setSyncSource] = useState('cloud'); // 'cloud' | 'local'

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

  // Auto-cycling Atelier Collection Carousel during Idle
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % ATELIER_COLLECTIONS.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

  const applyCfdUpdate = (data, source) => {
    if (!data) return;
    setCfdState((prev) => {
      // Discard out-of-order packets if a newer update is already rendered
      if (prev?.updatedAt && data.updatedAt && data.updatedAt < prev.updatedAt) {
        return prev;
      }
      return { ...prev, ...data };
    });
    setConnected(true);
    setSyncSource(source);
    try {
      localStorage.setItem(CFD_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  };

  // 1. Cloud Firestore Real-time Listener (Enables 2nd Device / iPad over Wi-Fi/4G/5G)
  useEffect(() => {
    try {
      // includeMetadataChanges: true delivers updates instantly without waiting for server network acks
      const unsub = onSnapshot(
        doc(db, 'cfd_live_sessions', 'primary'),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data) {
              applyCfdUpdate(data, 'cloud');

              // Check for test ping
              if (data.testPing && Date.now() - data.testPing < 8000) {
                setPingAlert(true);
              }
            }
          }
        },
        (error) => {
          console.warn('Firestore CFD listener warning:', error);
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn('Failed to attach Cloud Firestore CFD listener:', err);
    }
  }, []);

  // 2. BroadcastChannel & LocalStorage Event Listeners (For zero-latency same-computer dual monitor)
  useEffect(() => {
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel(CFD_CHANNEL_NAME);
        channelRef.current = bc;

        bc.onmessage = (event) => {
          if (!event.data) return;
          const { type, payload } = event.data;

          if (type === 'SYNC' && payload) {
            applyCfdUpdate(payload, 'local');
          } else if (type === 'CLEAR') {
            setCfdState(null);
            try {
              localStorage.removeItem(CFD_STORAGE_KEY);
            } catch (e) {}
          } else if (type === 'PING') {
            setPingAlert(true);
            setConnected(true);
          } else if (type === 'HEARTBEAT') {
            setConnected(true);
          }
        };

        // Request initial sync from active POS tab immediately on mount
        bc.postMessage({ type: 'REQUEST_SYNC' });
      }
    } catch (err) {
      console.warn('BroadcastChannel error in CFD:', err);
    }

    // LocalStorage fallback listener
    const handleStorage = (e) => {
      if (e.key === CFD_STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (updated) {
            applyCfdUpdate(updated, 'local');
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // Watch fullscreen change
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Instant wake-up sync when tablet screen turns on or browser tab gains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && channelRef.current) {
        channelRef.current.postMessage({ type: 'REQUEST_SYNC' });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
  const loyaltyPoints = cfdState?.loyaltyPoints || 0;
  const paymentMethod = cfdState?.paymentMethod || 'Cash';
  const upiUrl = cfdState?.upiUrl || '';
  const isSettled = cfdState?.status === 'settled';

  // Dynamic UPI QR code URL
  const qrCodeImageUrl = useMemo(() => {
    if (!upiUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(upiUrl)}`;
  }, [upiUrl]);

  const isEmptyCart = !items.length && !isSettled;
  const hasCustomer = Boolean(customerName && customerName.trim());

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        bgcolor: '#0A0D14',
        color: '#F8FAFC',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* Test Ping Toast Notification */}
      <Snackbar
        open={pingAlert}
        autoHideDuration={4000}
        onClose={() => setPingAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          icon={<CheckCircle sx={{ color: '#34D399' }} />}
          sx={{
            bgcolor: 'rgba(15, 23, 42, 0.95)',
            color: '#FFFFFF',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(52, 211, 153, 0.2)',
            borderRadius: 3,
            fontWeight: 700
          }}
        >
          ✨ Cashier Terminal Connected • Live Mirroring Active
        </Alert>
      </Snackbar>

      {/* Ambient Luxury Background Glows */}
      <Box
        sx={{
          position: 'fixed',
          top: -150,
          right: -150,
          width: 550,
          height: 550,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(197, 160, 89, 0.15) 0%, rgba(10, 13, 20, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          bottom: -150,
          left: -150,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(10, 13, 20, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Top Luxury Banner */}
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          py: 1.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          bgcolor: 'rgba(15, 23, 42, 0.8)',
          zIndex: 10
        }}
      >
        {/* Brand & Store Name */}
        <Stack direction="row" alignItems="center" spacing={2}>
          {storeLogo ? (
            <Box
              component="img"
              src={storeLogo}
              alt={storeName}
              sx={{ width: 44, height: 44, borderRadius: 2.5, objectFit: 'contain' }}
            />
          ) : (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #C5A059 0%, #8F6E2B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(197, 160, 89, 0.35)'
              }}
            >
              <Diamond sx={{ color: '#FFFFFF', fontSize: 24 }} />
            </Box>
          )}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: '#FFFFFF',
                textTransform: 'uppercase',
                fontSize: { xs: '0.95rem', md: '1.15rem' },
                lineHeight: 1.2
              }}
            >
              {storeName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#C5A059',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 700,
                fontSize: '0.68rem'
              }}
            >
              Customer Facing Live Terminal
            </Typography>
          </Box>
        </Stack>

        {/* Right Status Controls */}
        <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }}>
          {/* Personalized Customer Welcome Chip in Header */}
          {hasCustomer && (
            <Chip
              icon={<Diamond sx={{ fontSize: '0.95rem !important', color: '#C5A059 !important' }} />}
              label={`Patron: ${customerName} • ${customerTier}`}
              sx={{
                bgcolor: 'rgba(197, 160, 89, 0.15)',
                color: '#F3E8C7',
                border: '1px solid rgba(197, 160, 89, 0.4)',
                fontWeight: 700,
                fontSize: { xs: '0.72rem', sm: '0.82rem' },
                height: 32
              }}
            />
          )}

          {/* Sync Status Badge */}
          <Chip
            icon={<Wifi sx={{ fontSize: '0.85rem !important', color: connected ? '#10B981' : '#F59E0B' }} />}
            label={connected ? (syncSource === 'cloud' ? 'Cloud Sync' : 'Live Sync') : 'Reconnecting'}
            size="small"
            sx={{
              bgcolor: connected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              color: connected ? '#34D399' : '#FBBF24',
              border: `1px solid ${connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              fontWeight: 700,
              fontSize: '0.72rem',
              height: 28
            }}
          />

          {/* Live Clock */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.6}
            sx={{ color: 'rgba(255, 255, 255, 0.7)', display: { xs: 'none', sm: 'flex' } }}
          >
            <AccessTime sx={{ fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, letterSpacing: '0.04em', fontSize: '0.85rem' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
          </Stack>

          {/* Fullscreen Toggle */}
          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Edge-to-Edge Fullscreen'}>
            <IconButton
              onClick={toggleFullscreen}
              size="small"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 2,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.18)', color: '#FFFFFF' }
              }}
            >
              {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', p: { xs: 2, md: 3 }, gap: { xs: 2, md: 3 }, zIndex: 1, minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {/* STATE 1: BILL SETTLED CELEBRATION */}
          {isSettled ? (
            <motion.div
              key="settled"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Paper
                elevation={0}
                sx={{
                  maxWidth: 720,
                  width: '100%',
                  p: { xs: 3.5, md: 6 },
                  textAlign: 'center',
                  borderRadius: 4.5,
                  bgcolor: 'rgba(15, 23, 42, 0.88)',
                  border: '1px solid rgba(197, 160, 89, 0.45)',
                  backdropFilter: 'blur(28px)',
                  boxShadow: '0 30px 60px rgba(0, 0, 0, 0.7), 0 0 50px rgba(197, 160, 89, 0.2)'
                }}
              >
                <Box
                  sx={{
                    width: 92,
                    height: 92,
                    mx: 'auto',
                    mb: 2.5,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 30px rgba(16, 185, 129, 0.45)'
                  }}
                >
                  <CheckCircle sx={{ fontSize: 56, color: '#FFFFFF' }} />
                </Box>

                <Typography
                  variant="overline"
                  sx={{ color: '#C5A059', letterSpacing: '0.24em', fontWeight: 800, fontSize: '0.85rem' }}
                >
                  SETTLEMENT COMPLETE
                </Typography>

                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, mb: 1.5, color: '#FFFFFF', fontSize: { xs: '1.8rem', md: '2.6rem' } }}>
                  Thank You, {customerName || 'Honoured Patron'}!
                </Typography>

                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.75)', mb: 3.5, maxWidth: 540, mx: 'auto' }}>
                  Your bespoke couture garments are being prepared with highest precision. A digital tax invoice receipt has been recorded.
                </Typography>

                {/* Amount Paid & Reward Points Card */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3.5 }}>
                  <Box
                    sx={{
                      flex: 1,
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Settled Tender ({paymentMethod})
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#C5A059', mt: 0.5 }}>
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      flex: 1,
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: 'rgba(197, 160, 89, 0.08)',
                      border: '1px solid rgba(197, 160, 89, 0.3)'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#C5A059', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                      Privilege Rewards Credited
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#34D399', mt: 0.5 }}>
                      +{Math.max(15, Math.round(total * 0.05))} Points
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                  <VerifiedUser sx={{ color: '#34D399', fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                    Official Aleen Atelier Authenticity Guaranteed • Crafted with Heritage
                  </Typography>
                </Stack>
              </Paper>
            </motion.div>
          ) : isEmptyCart ? (
            /* STATE 2: HYPER-PERSONALIZED WELCOME SUITE OR HAUTE COUTURE SHOWCASE */
            <motion.div
              key={hasCustomer ? 'personalized-welcome' : 'atelier-showcase'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {hasCustomer ? (
                /* PERSONALIZED PATRON WELCOME SUITE */
                <Paper
                  elevation={0}
                  sx={{
                    maxWidth: 820,
                    width: '100%',
                    p: { xs: 3.5, md: 5.5 },
                    borderRadius: 4.5,
                    bgcolor: 'rgba(15, 23, 42, 0.82)',
                    border: '1px solid rgba(197, 160, 89, 0.4)',
                    backdropFilter: 'blur(28px)',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 45px rgba(197, 160, 89, 0.18)',
                    textAlign: 'center'
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2.5,
                      borderRadius: 3.5,
                      background: 'linear-gradient(135deg, #C5A059 0%, #8F6E2B 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 25px rgba(197, 160, 89, 0.4)'
                    }}
                  >
                    <Stars sx={{ fontSize: 44, color: '#FFFFFF' }} />
                  </Box>

                  <Chip
                    icon={<CardMembership sx={{ fontSize: '1rem !important', color: '#C5A059 !important' }} />}
                    label={`HONOURED ATELIER PATRON • ${customerTier.toUpperCase()} PRIVILEGE`}
                    sx={{
                      bgcolor: 'rgba(197, 160, 89, 0.15)',
                      color: '#F3E8C7',
                      border: '1px solid rgba(197, 160, 89, 0.35)',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      letterSpacing: '0.06em',
                      mb: 2,
                      px: 1
                    }}
                  />

                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 900,
                      color: '#FFFFFF',
                      fontSize: { xs: '1.8rem', md: '2.6rem' },
                      mb: 1
                    }}
                  >
                    Welcome to Aleen Couture, {customerName}!
                  </Typography>

                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 580, mx: 'auto', mb: 4 }}>
                    We are honored to have you at our atelier. Your dedicated stylist is curating and scanning your selected garments at the counter.
                  </Typography>

                  {/* 3 Patron Benefit Cards */}
                  <Grid container spacing={2.5} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          bgcolor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(197, 160, 89, 0.25)',
                          height: '100%',
                          textAlign: 'left'
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Redeem sx={{ color: '#C5A059', fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#C5A059' }}>
                            Loyalty Balance
                          </Typography>
                        </Stack>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 0.5 }}>
                          {loyaltyPoints || 450} Points
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.55)', display: 'block', lineHeight: 1.4 }}>
                          Available to redeem towards today's bespoke bill
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          bgcolor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(52, 211, 153, 0.25)',
                          height: '100%',
                          textAlign: 'left'
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <AutoAwesome sx={{ color: '#34D399', fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#34D399' }}>
                            VIP Privilege
                          </Typography>
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 0.5, fontSize: '1.05rem' }}>
                          Complimentary Alterations
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.55)', display: 'block', lineHeight: 1.4 }}>
                          Master tailor measurements included with every garment
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          bgcolor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          height: '100%',
                          textAlign: 'left'
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <ShoppingBag sx={{ color: '#818CF8', fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#818CF8' }}>
                            Live Status
                          </Typography>
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 0.5, fontSize: '1.05rem' }}>
                          Awaiting Garments
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.55)', display: 'block', lineHeight: 1.4 }}>
                          Items will stream onto this screen in real time as scanned
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Pulsing Status Loader Bar */}
                  <Box
                    sx={{
                      p: 1.8,
                      borderRadius: 2.5,
                      bgcolor: 'rgba(197, 160, 89, 0.1)',
                      border: '1px dashed rgba(197, 160, 89, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1.5
                    }}
                  >
                    <AutoAwesome sx={{ color: '#C5A059', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: '#F3E8C7', fontWeight: 600 }}>
                      Consultant currently ringing up items at the billing terminal...
                    </Typography>
                  </Box>
                </Paper>
              ) : (
                /* HAUTE COUTURE BRAND SHOWCASE (TRUE IDLE) */
                <Paper
                  elevation={0}
                  sx={{
                    maxWidth: 820,
                    width: '100%',
                    p: { xs: 3.5, md: 5.5 },
                    textAlign: 'center',
                    borderRadius: 4.5,
                    bgcolor: 'rgba(15, 23, 42, 0.72)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(24px)',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)'
                  }}
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  >
                    <Box
                      sx={{
                        width: 90,
                        height: 90,
                        mx: 'auto',
                        mb: 2.5,
                        borderRadius: 3.5,
                        background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.28) 0%, rgba(197, 160, 89, 0.06) 100%)',
                        border: '1px solid rgba(197, 160, 89, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Diamond sx={{ fontSize: 46, color: '#C5A059' }} />
                    </Box>
                  </motion.div>

                  <Typography
                    variant="overline"
                    sx={{ color: '#C5A059', letterSpacing: '0.24em', fontWeight: 800, fontSize: '0.85rem' }}
                  >
                    WELCOME TO {storeName.toUpperCase()}
                  </Typography>

                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 900,
                      mt: 0.5,
                      mb: 1.5,
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: { xs: '1.8rem', md: '2.6rem' }
                    }}
                  >
                    Bespoke Craftsmanship & Haute Couture
                  </Typography>

                  {/* Active Carousel Card */}
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3.5,
                      bgcolor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(197, 160, 89, 0.25)',
                      my: 3,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#C5A059',
                        letterSpacing: '0.14em',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        display: 'block',
                        mb: 0.6
                      }}
                    >
                      FEATURED ATELIER COLLECTION • {ATELIER_COLLECTIONS[activeSlide].tagline}
                    </Typography>

                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 1 }}>
                      {ATELIER_COLLECTIONS[activeSlide].title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 540, mx: 'auto', mb: 2 }}>
                      {ATELIER_COLLECTIONS[activeSlide].desc}
                    </Typography>

                    <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap">
                      {ATELIER_COLLECTIONS[activeSlide].highlights.map((h, i) => (
                        <Chip
                          key={i}
                          label={h}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(197, 160, 89, 0.12)',
                            color: '#F3E8C7',
                            border: '1px solid rgba(197, 160, 89, 0.3)',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      ))}
                    </Stack>

                    {/* Carousel Dots */}
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2.5 }}>
                      {ATELIER_COLLECTIONS.map((_, i) => (
                        <Box
                          key={i}
                          onClick={() => setActiveSlide(i)}
                          sx={{
                            width: i === activeSlide ? 24 : 8,
                            height: 8,
                            borderRadius: 4,
                            bgcolor: i === activeSlide ? '#C5A059' : 'rgba(255, 255, 255, 0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  {/* Store Credo Chips */}
                  <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                    <Chip
                      icon={<AutoAwesome sx={{ color: '#C5A059 !important' }} />}
                      label="Zero-Contact UPI Checkout"
                      sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#E2E8F0', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                    />
                    <Chip
                      icon={<ShoppingBag sx={{ color: '#38BDF8 !important' }} />}
                      label="Itemized Live Bill Mirroring"
                      sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#E2E8F0', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                    />
                    <Chip
                      icon={<VerifiedUser sx={{ color: '#34D399 !important' }} />}
                      label="Certified Authentic Handloom"
                      sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#E2E8F0', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                    />
                  </Stack>
                </Paper>
              )}
            </motion.div>
          ) : (
            /* STATE 3: DUAL-SCREEN LIVE CART & UPI PAYMENT PREVIEW */
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <Box sx={{ flex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, minHeight: 0 }}>
                {/* Left Panel: Itemized Live Bill Stream (60%) */}
                <Box
                  sx={{
                    flex: { xs: 1, md: 1.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    bgcolor: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(24px)',
                    overflow: 'hidden',
                    minHeight: 0
                  }}
                >
                  {/* Cart Header with Customer Details */}
                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <LocalMall sx={{ color: '#C5A059', fontSize: 22 }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem' }}>
                        Curated Ensemble for {customerName || 'Honoured Patron'} ({items.length} {items.length === 1 ? 'Item' : 'Items'})
                      </Typography>
                    </Stack>

                    {cfdState?.lastScannedItem && (
                      <Chip
                        size="small"
                        icon={<AutoAwesome sx={{ fontSize: '0.85rem !important', color: '#C5A059 !important' }} />}
                        label={`Just Added: ${cfdState.lastScannedItem}`}
                        sx={{
                          bgcolor: 'rgba(197, 160, 89, 0.15)',
                          color: '#F3E8C7',
                          border: '1px solid rgba(197, 160, 89, 0.35)',
                          fontWeight: 700,
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
                            transition={{ duration: 0.2 }}
                          >
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                borderRadius: 3,
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
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.25 }}>
                                  {item.name}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.8 }}>
                                  {item.variantDetails && (
                                    <Chip
                                      label={item.variantDetails}
                                      size="small"
                                      sx={{
                                        height: 22,
                                        fontSize: '0.68rem',
                                        bgcolor: 'rgba(197, 160, 89, 0.12)',
                                        color: '#F3E8C7',
                                        fontWeight: 700
                                      }}
                                    />
                                  )}
                                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.55)' }}>
                                    ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                                  </Typography>
                                </Stack>
                              </Box>

                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#C5A059', fontSize: '1.15rem' }}>
                                  ₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                                  Qty: {item.quantity}
                                </Typography>
                              </Box>
                            </Paper>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </Stack>
                  </Box>

                  {/* Valued Patron Privilege Savings Banner */}
                  {discount > 0 && (
                    <Box
                      sx={{
                        px: 3,
                        py: 1.5,
                        bgcolor: 'rgba(52, 211, 153, 0.1)',
                        borderTop: '1px solid rgba(52, 211, 153, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AutoAwesome sx={{ color: '#34D399', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ color: '#34D399', fontWeight: 700 }}>
                          Valued Patron Privilege Applied
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: '#34D399', fontWeight: 800, fontSize: '0.85rem' }}>
                        You are saving ₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} today!
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Right Panel: Totals & Dynamic UPI QR Code (40%) */}
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
                      borderRadius: 4,
                      bgcolor: 'rgba(15, 23, 42, 0.82)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(20px)'
                    }}
                  >
                    <Typography variant="overline" sx={{ color: '#C5A059', letterSpacing: '0.15em', fontWeight: 800 }}>
                      BILL SUMMARY
                    </Typography>

                    <Stack spacing={1.2} sx={{ mt: 1.5, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                          Subtotal
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                          ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>

                      {discount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#34D399', fontWeight: 600 }}>
                            Atelier Privilege Discount
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#34D399' }}>
                            - ₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )}

                      {tax > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                            Estimated GST / Taxes
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                            + ₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                        Net Payable
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 900,
                          color: '#C5A059',
                          fontSize: { xs: '1.9rem', md: '2.3rem' }
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
                      borderRadius: 4,
                      bgcolor: 'rgba(15, 23, 42, 0.82)',
                      border: '1px solid rgba(197, 160, 89, 0.35)',
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
                            bgcolor: '#FFFFFF',
                            boxShadow: '0 10px 35px rgba(0, 0, 0, 0.6), 0 0 25px rgba(197, 160, 89, 0.2)',
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
                          <QrCode2 sx={{ color: '#C5A059', fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                            Scan to Pay ₹{total.toLocaleString('en-IN')} via UPI
                          </Typography>
                        </Stack>

                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.55)', maxWidth: 280 }}>
                          GPay • PhonePe • Paytm • BHIM • Banking UPI
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
                            border: '1px solid rgba(197, 160, 89, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Payments sx={{ color: '#C5A059', fontSize: 32 }} />
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                          Tender: {paymentMethod}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)', mt: 0.5, maxWidth: 280 }}>
                          Please proceed with payment at the cashier counter.
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Subtle Footer Bar */}
      <Box
        sx={{
          py: 1.4,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          bgcolor: 'rgba(10, 13, 20, 0.85)',
          zIndex: 10
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.72rem' }}>
          Powered by Aleen Atelier Cloud Engine • Real-Time Firestore & Dual-Monitor Mirroring
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.72rem' }}>
          Strictly Confidential & Encrypted Locally
        </Typography>
      </Box>
    </Box>
  );
}
