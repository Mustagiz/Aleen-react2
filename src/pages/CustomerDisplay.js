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
  Grid,
  Dialog,
  Avatar,
  Rating,
  Button
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
  CardMembership,
  Close,
  ZoomIn,
  Favorite,
  WhatsApp
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';

const CFD_CHANNEL_NAME = 'aleen_customer_display';
const CFD_STORAGE_KEY = 'aleen_cfd_state';

// Interactive Atelier Feedback Compliments
const COMPLIMENT_OPTIONS = [
  '✨ Exquisite Fabric',
  '✂️ Flawless Fit',
  '👔 Helpful Stylist',
  '💎 Royal Ambience',
  '⚡ Swift Service'
];

// Helper to classify couture garments for visual storytelling
const getGarmentMeta = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('saree') || lower.includes('sari')) return { label: 'Handloom Saree', icon: '🥻', tag: 'Pure Weave' };
  if (lower.includes('lehenga') || lower.includes('bridal') || lower.includes('choli')) return { label: 'Bridal Couture', icon: '👗', tag: 'Zardozi Work' };
  if (lower.includes('sherwani') || lower.includes('blazer') || lower.includes('suit') || lower.includes('tuxedo')) return { label: 'Bespoke Suiting', icon: '👔', tag: 'Atelier Tailored' };
  if (lower.includes('kurti') || lower.includes('kurta') || lower.includes('anarkali')) return { label: 'Artisanal Ensemble', icon: '✨', tag: 'Hand Embroidered' };
  if (lower.includes('dupatta') || lower.includes('shawl') || lower.includes('stole')) return { label: 'Heritage Wrap', icon: '🧣', tag: 'Pure Zari' };
  if (lower.includes('alteration') || lower.includes('stitch') || lower.includes('tailor')) return { label: 'Master Tailoring', icon: '✂️', tag: 'Custom Fit' };
  return { label: 'Haute Couture', icon: '💎', tag: 'Bespoke Craft' };
};

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
    setCfdState(data);
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

  // 2. BroadcastChannel, Window postMessage & LocalStorage Event Listeners (Zero-latency dual-monitor / multi-window)
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

    // Direct window.postMessage listener (for child windows / popups opened via POS)
    const handleDirectMessage = (event) => {
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
      }
    };
    window.addEventListener('message', handleDirectMessage);

    // If opened via window.open from POS, request immediate sync from opener
    if (window.opener) {
      try {
        window.opener.postMessage({ type: 'REQUEST_SYNC' }, '*');
      } catch (err) {
        console.warn('Failed to handshake with opener window:', err);
      }
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
      if (document.visibilityState === 'visible') {
        if (channelRef.current) {
          channelRef.current.postMessage({ type: 'REQUEST_SYNC' });
        }
        if (window.opener) {
          try {
            window.opener.postMessage({ type: 'REQUEST_SYNC' }, '*');
          } catch (e) {}
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('message', handleDirectMessage);
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
  const customerPhone = cfdState?.customerPhone || '';
  const customerTier = cfdState?.customerTier || 'Silver';
  const loyaltyPoints = cfdState?.loyaltyPoints || 0;
  const paymentMethod = cfdState?.paymentMethod || 'Cash';
  const upiUrl = cfdState?.upiUrl || '';
  const isSettled = cfdState?.status === 'settled';

  // Auto-return to homepage 2.5s after bill settlement
  useEffect(() => {
    if (isSettled) {
      const timer = setTimeout(() => {
        setCfdState((prev) => (prev ? { ...prev, status: 'idle', items: [], customerName: '', customerPhone: '' } : null));
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isSettled]);

  // Interactive Customer Touchpoint States
  const [patronRating, setPatronRating] = useState(5);
  const [selectedCompliments, setSelectedCompliments] = useState(['✨ Exquisite Fabric', '✂️ Flawless Fit']);
  const [ratingToast, setRatingToast] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [qrZoomOpen, setQrZoomOpen] = useState(false);
  const [receiptRequested, setReceiptRequested] = useState(false);
  const [receiptToast, setReceiptToast] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Time-aware greeting
  const timeGreeting = useMemo(() => {
    const hr = currentTime.getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, [currentTime]);

  // Patron Initials
  const patronInitials = useMemo(() => {
    if (!customerName) return 'VIP';
    const parts = customerName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [customerName]);

  // Dynamic Theme Accent
  const themeAccent = cfdState?.themeColor || '#C5A059';


  const handleCopyUpi = () => {
    if (upiUrl && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(upiUrl);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  const triggerHeartBurst = () => {
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 1800);
  };

  const toggleCompliment = (comp) => {
    setSelectedCompliments((prev) =>
      prev.includes(comp) ? prev.filter((c) => c !== comp) : [...prev, comp]
    );
    triggerHeartBurst();
    setRatingToast(true);
  };

  const handleRequestReceipt = () => {
    setReceiptRequested(true);
    setReceiptToast(true);
  };

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

      {/* Rating & Compliment Toast */}
      <Snackbar
        open={ratingToast}
        autoHideDuration={3500}
        onClose={() => setRatingToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          icon={<AutoAwesome sx={{ color: '#FBBF24' }} />}
          sx={{
            bgcolor: 'rgba(15, 23, 42, 0.96)',
            color: '#FFFFFF',
            border: `1px solid ${themeAccent}66`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 12px 35px rgba(0, 0, 0, 0.7), 0 0 30px ${themeAccent}33`,
            borderRadius: 3,
            fontWeight: 700
          }}
        >
          💖 Thank you for the {patronRating}-Star love! Aleen Atelier is honoured to serve you.
        </Alert>
      </Snackbar>

      {/* WhatsApp Receipt Request Toast */}
      <Snackbar
        open={receiptToast}
        autoHideDuration={3500}
        onClose={() => setReceiptToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          icon={<WhatsApp sx={{ color: '#25D366' }} />}
          sx={{
            bgcolor: 'rgba(15, 23, 42, 0.96)',
            color: '#FFFFFF',
            border: '1px solid rgba(37, 211, 102, 0.4)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.7)',
            borderRadius: 3,
            fontWeight: 700
          }}
        >
          📲 Digital Tax Invoice will be dispatched to {customerPhone ? `WhatsApp (+${customerPhone})` : 'your WhatsApp'} upon checkout!
        </Alert>
      </Snackbar>

      {/* Floating Heart Burst Celebration */}
      <AnimatePresence>
        {heartBurst && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1.3, y: -40 }}
            exit={{ opacity: 0, scale: 0.8, y: -100 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              pointerEvents: 'none',
              textAlign: 'center'
            }}
          >
            <Box
              sx={{
                p: 3,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${themeAccent} 0%, #D97706 100%)`,
                boxShadow: `0 0 60px ${themeAccent}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Favorite sx={{ fontSize: 64, color: '#FFFFFF' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#FFFFFF', mt: 1.5, textShadow: '0 4px 14px rgba(0,0,0,0.8)' }}>
              Stylist Thanked! ✨
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Luxury Background Glows (Adapts to Store Theme Accent) */}
      <Box
        sx={{
          position: 'fixed',
          top: -150,
          right: -150,
          width: 580,
          height: 580,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${themeAccent}26 0%, rgba(10, 13, 20, 0) 70%)`,
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
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(10, 13, 20, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Top Luxury Banner */}
      <Box
        sx={{
          px: { xs: 1.5, sm: 2.5, md: 4 },
          py: { xs: 1.2, sm: 1.5 },
          minHeight: { xs: 58, sm: 66 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 1, sm: 2 },
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          bgcolor: 'rgba(15, 23, 42, 0.92)',
          zIndex: 10
        }}
      >
        {/* Brand & Store Name */}
        <Stack direction="row" alignItems="center" spacing={{ xs: 1.2, sm: 2 }} sx={{ minWidth: 0, flexShrink: 1 }}>
          {storeLogo ? (
            <Box
              component="img"
              src={storeLogo}
              alt={storeName}
              sx={{
                width: { xs: 36, sm: 42 },
                height: { xs: 36, sm: 42 },
                borderRadius: '12px',
                objectFit: 'contain',
                flexShrink: 0,
                border: `1px solid ${themeAccent}44`,
                bgcolor: 'rgba(255,255,255,0.04)'
              }}
            />
          ) : (
            <Box
              sx={{
                width: { xs: 36, sm: 42 },
                height: { xs: 36, sm: 42 },
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${themeAccent} 0%, #8F6E2B 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 16px ${themeAccent}55`,
                flexShrink: 0
              }}
            >
              <Diamond sx={{ color: '#FFFFFF', fontSize: { xs: 20, sm: 24 } }} />
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: '#FFFFFF',
                textTransform: 'uppercase',
                fontSize: { xs: '0.9rem', sm: '1.05rem', md: '1.2rem' },
                lineHeight: 1.2
              }}
            >
              {storeName}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: themeAccent,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                fontSize: { xs: '0.62rem', sm: '0.68rem' },
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Haute Couture Interactive Customer Terminal
            </Typography>
          </Box>
        </Stack>

        {/* Right Status Controls */}
        <Stack direction="row" alignItems="center" spacing={{ xs: 0.8, sm: 1.2 }} sx={{ flexShrink: 0 }}>
          {/* Personalized Customer Welcome Chip in Header (Pure White Text) */}
          {hasCustomer && (
            <Chip
              avatar={
                <Avatar sx={{ bgcolor: themeAccent, color: '#0F172A', fontWeight: 900, fontSize: '0.72rem', width: 24, height: 24 }}>
                  {patronInitials}
                </Avatar>
              }
              label={`${timeGreeting}, ${customerName}`}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF !important',
                border: `1px solid ${themeAccent}66`,
                fontWeight: 800,
                fontSize: { xs: '0.72rem', sm: '0.82rem' },
                height: { xs: 28, sm: 32 },
                maxWidth: { xs: 150, sm: 240, md: 'none' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                '& .MuiChip-label': {
                  color: '#FFFFFF !important',
                  fontWeight: 800,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }
              }}
            />
          )}

          {/* Sync Status Badge */}
          <Chip
            icon={<Wifi sx={{ fontSize: '0.85rem !important', color: connected ? '#10B981' : '#F59E0B' }} />}
            label={connected ? (syncSource === 'cloud' ? 'Cloud' : 'Dual-Screen') : 'Connecting'}
            size="small"
            sx={{
              bgcolor: connected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              color: connected ? '#34D399' : '#FBBF24',
              border: `1px solid ${connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              fontWeight: 700,
              fontSize: '0.72rem',
              height: 28,
              '& .MuiChip-label': {
                color: connected ? '#34D399' : '#FBBF24',
                fontWeight: 700
              }
            }}
          />

          {/* Live Clock */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.6}
            sx={{ color: '#FFFFFF', display: { xs: 'none', md: 'flex' } }}
          >
            <AccessTime sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.7)' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, letterSpacing: '0.04em', fontSize: '0.85rem', color: '#FFFFFF' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
          </Stack>

          {/* Fullscreen Toggle */}
          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Edge-to-Edge Fullscreen'}>
            <IconButton
              onClick={toggleFullscreen}
              size="small"
              sx={{
                color: '#FFFFFF',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 2,
                p: { xs: 0.7, sm: 0.8 },
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.18)', color: '#FFFFFF' }
              }}
            >
              {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', p: { xs: 1.5, sm: 2.5, md: 3 }, gap: { xs: 2, md: 3 }, zIndex: 1, minHeight: 0, overflowY: { xs: 'auto', lg: 'hidden' } }}>
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
                  maxWidth: 780,
                  width: '100%',
                  p: { xs: 3.5, md: 5 },
                  textAlign: 'center',
                  borderRadius: 4.5,
                  bgcolor: 'rgba(15, 23, 42, 0.9)',
                  border: `1px solid ${themeAccent}66`,
                  backdropFilter: 'blur(28px)',
                  boxShadow: `0 30px 60px rgba(0, 0, 0, 0.7), 0 0 50px ${themeAccent}25`,
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}
              >
                <Box
                  sx={{
                    width: 84,
                    height: 84,
                    mx: 'auto',
                    mb: 2,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 30px rgba(16, 185, 129, 0.45)'
                  }}
                >
                  <CheckCircle sx={{ fontSize: 50, color: '#FFFFFF' }} />
                </Box>

                <Typography
                  variant="overline"
                  sx={{ color: themeAccent, letterSpacing: '0.24em', fontWeight: 800, fontSize: '0.85rem' }}
                >
                  SETTLEMENT COMPLETE
                </Typography>

                <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5, mb: 1, color: '#FFFFFF', fontSize: { xs: '1.7rem', md: '2.4rem' } }}>
                  Thank You, {customerName || 'Honoured Patron'}!
                </Typography>

                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.75)', mb: 3, maxWidth: 540, mx: 'auto', fontSize: '0.92rem' }}>
                  Your bespoke couture garments are being prepared with highest precision. A digital tax invoice receipt has been recorded.
                </Typography>

                {/* Amount Paid & Reward Points Card */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      flex: 1,
                      p: 2.2,
                      borderRadius: 3,
                      bgcolor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Settled Tender ({paymentMethod})
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: themeAccent, mt: 0.5, fontSize: { xs: '1.6rem', sm: '1.9rem' } }}>
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      flex: 1,
                      p: 2.2,
                      borderRadius: 3,
                      bgcolor: `${themeAccent}14`,
                      border: `1px solid ${themeAccent}44`
                    }}
                  >
                    <Typography variant="caption" sx={{ color: themeAccent, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                      Privilege Rewards Credited
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#34D399', mt: 0.5, fontSize: { xs: '1.6rem', sm: '1.9rem' } }}>
                      +{Math.max(15, Math.round(total * 0.05))} Points
                    </Typography>
                  </Box>
                </Stack>

                {/* Interactive Customer Feedback & Compliment Section */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3.5,
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${themeAccent}33`,
                    mb: 3,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em', mb: 0.5 }}>
                    Rate Your Atelier Experience
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 1.5 }}>
                    Tap a star below to share your experience with our master craftsmen
                  </Typography>

                  <Rating
                    name="patron-service-rating"
                    value={patronRating}
                    onChange={(event, newValue) => {
                      setPatronRating(newValue);
                      triggerHeartBurst();
                      setRatingToast(`✨ Thank you for rating us ${newValue} stars! We cherish your patronage.`);
                    }}
                    size="large"
                    sx={{
                      fontSize: '2.3rem',
                      '& .MuiRating-iconFilled': { color: themeAccent },
                      '& .MuiRating-iconHover': { color: '#FCD34D' }
                    }}
                  />

                  {/* Compliment Chips */}
                  <Typography variant="caption" sx={{ color: themeAccent, fontWeight: 700, display: 'block', mt: 1.5, mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    What did you love most today?
                  </Typography>
                  <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ gap: 1 }}>
                    {COMPLIMENT_OPTIONS.map((comp) => {
                      const isSelected = selectedCompliments.includes(comp);
                      return (
                        <Chip
                          key={comp}
                          label={comp}
                          onClick={() => toggleCompliment(comp)}
                          size="small"
                          sx={{
                            cursor: 'pointer',
                            bgcolor: isSelected ? themeAccent : 'rgba(255, 255, 255, 0.05)',
                            color: isSelected ? '#0F172A' : '#F1F5F9',
                            fontWeight: isSelected ? 800 : 600,
                            border: `1px solid ${isSelected ? themeAccent : 'rgba(255, 255, 255, 0.15)'}`,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'scale(1.04)',
                              bgcolor: isSelected ? themeAccent : `${themeAccent}25`
                            }
                          }}
                        />
                      );
                    })}
                  </Stack>

                  {/* Digital Receipt Via WhatsApp Button */}
                  <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 2.2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<WhatsApp sx={{ color: receiptRequested ? '#10B981' : '#25D366' }} />}
                      onClick={handleRequestReceipt}
                      sx={{
                        borderRadius: 2.5,
                        borderColor: receiptRequested ? '#10B981' : 'rgba(37, 211, 102, 0.5)',
                        color: receiptRequested ? '#34D399' : '#F1F5F9',
                        bgcolor: receiptRequested ? 'rgba(16, 185, 129, 0.12)' : 'rgba(37, 211, 102, 0.08)',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        px: 2,
                        '&:hover': {
                          borderColor: '#25D366',
                          bgcolor: 'rgba(37, 211, 102, 0.18)'
                        }
                      }}
                    >
                      {receiptRequested ? '✓ WhatsApp E-Receipt Dispatched' : 'Request WhatsApp E-Receipt'}
                    </Button>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Favorite sx={{ color: '#EF4444' }} />}
                      onClick={triggerHeartBurst}
                      sx={{
                        borderRadius: 2.5,
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        color: '#FCA5A5',
                        bgcolor: 'rgba(239, 68, 68, 0.08)',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        '&:hover': {
                          borderColor: '#EF4444',
                          bgcolor: 'rgba(239, 68, 68, 0.18)'
                        }
                      }}
                    >
                      Send Love
                    </Button>
                  </Stack>
                </Box>

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
                      background: `linear-gradient(135deg, ${themeAccent} 0%, ${themeAccent}AA 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 8px 25px ${themeAccent}60`
                    }}
                  >
                    <Stars sx={{ fontSize: 44, color: '#FFFFFF' }} />
                  </Box>

                  <Chip
                    icon={<CardMembership sx={{ fontSize: '1rem !important', color: `${themeAccent} !important` }} />}
                    label={`HONOURED ATELIER PATRON • ${customerTier.toUpperCase()} PRIVILEGE`}
                    sx={{
                      bgcolor: `${themeAccent}20`,
                      color: '#F8FAFC',
                      border: `1px solid ${themeAccent}55`,
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
                          border: `1px solid ${themeAccent}33`,
                          height: '100%',
                          textAlign: 'left'
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Redeem sx={{ color: themeAccent, fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: themeAccent }}>
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
                      bgcolor: `${themeAccent}18`,
                      border: `1px dashed ${themeAccent}50`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1.5
                    }}
                  >
                    <AutoAwesome sx={{ color: themeAccent, fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
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
                        background: `linear-gradient(135deg, ${themeAccent}40 0%, ${themeAccent}10 100%)`,
                        border: `1px solid ${themeAccent}60`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Diamond sx={{ fontSize: 46, color: themeAccent }} />
                    </Box>
                  </motion.div>

                  <Typography
                    variant="overline"
                    sx={{ color: themeAccent, letterSpacing: '0.24em', fontWeight: 800, fontSize: '0.85rem' }}
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
                      border: `1px solid ${themeAccent}40`,
                      my: 3,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: themeAccent,
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
                            bgcolor: `${themeAccent}18`,
                            color: '#F8FAFC',
                            border: `1px solid ${themeAccent}40`,
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
                            bgcolor: i === activeSlide ? themeAccent : 'rgba(255, 255, 255, 0.2)',
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
                      icon={<AutoAwesome sx={{ color: `${themeAccent} !important` }} />}
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
              <Box sx={{ flex: 1, display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: { xs: 2, sm: 2.5, md: 3 }, minHeight: 0, width: '100%' }}>
                {/* Left Panel: Itemized Live Bill Stream (60%) */}
                <Box
                  sx={{
                    flex: { xs: 'none', lg: 1.5 },
                    minHeight: { xs: 320, lg: 0 },
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    bgcolor: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(24px)',
                    overflow: 'hidden'
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
                      <LocalMall sx={{ color: themeAccent, fontSize: 22 }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem' }}>
                        Curated Ensemble for {customerName || 'Honoured Patron'} ({items.length} {items.length === 1 ? 'Item' : 'Items'})
                      </Typography>
                    </Stack>

                    {cfdState?.lastScannedItem && (
                      <Chip
                        size="small"
                        icon={<AutoAwesome sx={{ fontSize: '0.85rem !important', color: `${themeAccent} !important` }} />}
                        label={`Just Added: ${cfdState.lastScannedItem}`}
                        sx={{
                          bgcolor: `${themeAccent}20`,
                          color: '#F8FAFC',
                          border: `1px solid ${themeAccent}50`,
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
                        {items.map((item, idx) => {
                          const garmentMeta = getGarmentMeta(item.name);
                          return (
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
                                    borderColor: `${themeAccent}50`
                                  }
                                }}
                              >
                                <Box sx={{ flex: 1, pr: 2 }}>
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.4 }}>
                                    <Chip
                                      label={`${garmentMeta.icon} ${garmentMeta.tag}`}
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        bgcolor: `${themeAccent}18`,
                                        color: '#F8FAFC',
                                        border: `1px solid ${themeAccent}40`,
                                        fontWeight: 800,
                                        letterSpacing: '0.04em'
                                      }}
                                    />
                                  </Stack>
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
                                          bgcolor: 'rgba(255, 255, 255, 0.08)',
                                          color: '#E2E8F0',
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
                                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: themeAccent, fontSize: '1.15rem' }}>
                                    ₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                                    Qty: {item.quantity}
                                  </Typography>
                                </Box>
                              </Paper>
                            </motion.div>
                          );
                        })}
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
                    flex: { xs: 'none', lg: 1 },
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
                      bgcolor: 'rgba(15, 23, 42, 0.85)',
                      border: `1px solid ${themeAccent}33`,
                      backdropFilter: 'blur(20px)',
                      boxShadow: `0 15px 35px rgba(0, 0, 0, 0.5), 0 0 30px ${themeAccent}12`
                    }}
                  >
                    <Typography variant="overline" sx={{ color: themeAccent, letterSpacing: '0.15em', fontWeight: 800 }}>
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
                          color: themeAccent,
                          fontSize: { xs: '1.9rem', md: '2.3rem' }
                        }}
                      >
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Paper>

                  {/* Dynamic UPI Payment / Tender Card with Tap-to-Zoom */}
                  <Paper
                    elevation={0}
                    sx={{
                      flex: 1,
                      p: 2.5,
                      borderRadius: 4,
                      bgcolor: 'rgba(15, 23, 42, 0.85)',
                      border: `1px solid ${themeAccent}44`,
                      backdropFilter: 'blur(20px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {paymentMethod === 'UPI' && upiUrl ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        {/* Interactive Clickable QR Box with Zoom Badge */}
                        <Tooltip title="Tap to expand QR code for easier camera scanning">
                          <Box
                            onClick={() => setQrZoomOpen(true)}
                            sx={{
                              p: 1.5,
                              borderRadius: 3,
                              bgcolor: '#FFFFFF',
                              boxShadow: `0 12px 35px rgba(0, 0, 0, 0.6), 0 0 30px ${themeAccent}30`,
                              display: 'inline-block',
                              mb: 1.5,
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'all 0.25s ease',
                              '&:hover': {
                                transform: 'scale(1.03)',
                                boxShadow: `0 16px 45px rgba(0, 0, 0, 0.7), 0 0 40px ${themeAccent}60`
                              }
                            }}
                          >
                            <QRCodeSVG
                              value={upiUrl}
                              size={175}
                              level="M"
                              style={{ display: 'block' }}
                            />
                            {/* Tap To Zoom Overlay Indicator */}
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 6,
                                right: 6,
                                bgcolor: 'rgba(15, 23, 42, 0.88)',
                                color: themeAccent,
                                borderRadius: 1.5,
                                px: 0.8,
                                py: 0.3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.4,
                                border: `1px solid ${themeAccent}66`
                              }}
                            >
                              <ZoomIn sx={{ fontSize: 14 }} />
                              <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 800 }}>
                                TAP TO ENLARGE
                              </Typography>
                            </Box>
                          </Box>
                        </Tooltip>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <QrCode2 sx={{ color: themeAccent, fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                            Scan to Pay ₹{total.toLocaleString('en-IN')} via UPI
                          </Typography>
                        </Stack>

                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.55)', maxWidth: 280, mb: 1.5 }}>
                          GPay • PhonePe • Paytm • BHIM • All UPI Apps
                        </Typography>

                        {/* Interactive Patron Rating / Compliment Bar during checkout */}
                        <Box
                          sx={{
                            width: '100%',
                            pt: 1.5,
                            mt: 0.5,
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                          }}
                        >
                          <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.65)', fontWeight: 700, fontSize: '0.72rem' }}>
                              Experience:
                            </Typography>
                            <Rating
                              name="quick-cart-rating"
                              value={patronRating}
                              size="small"
                              onChange={(e, v) => {
                                setPatronRating(v);
                                triggerHeartBurst();
                                setRatingToast(`✨ Thank you for rating us ${v} stars!`);
                              }}
                              sx={{
                                '& .MuiRating-iconFilled': { color: themeAccent },
                                '& .MuiRating-iconHover': { color: '#FCD34D' }
                              }}
                            />
                          </Stack>
                        </Box>
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
                            bgcolor: `${themeAccent}18`,
                            border: `1px solid ${themeAccent}44`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Payments sx={{ color: themeAccent, fontSize: 32 }} />
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

      {/* FULL-SCREEN HIGH DEFINITION QR CODE MODAL FOR EASY TOUCH/SCANNING */}
      <Dialog
        open={qrZoomOpen}
        onClose={() => setQrZoomOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4.5,
            bgcolor: 'rgba(15, 23, 42, 0.95)',
            border: `1px solid ${themeAccent}66`,
            backdropFilter: 'blur(32px)',
            boxShadow: `0 25px 60px rgba(0, 0, 0, 0.8), 0 0 50px ${themeAccent}40`,
            p: 3,
            textAlign: 'center',
            color: '#FFFFFF'
          }
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <QrCode2 sx={{ color: themeAccent, fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.1rem' }}>
              High-Definition UPI Scan
            </Typography>
          </Stack>
          <IconButton onClick={() => setQrZoomOpen(false)} size="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            <Close fontSize="small" />
          </IconButton>
        </Stack>

        <Box
          sx={{
            p: 2,
            borderRadius: 4,
            bgcolor: '#FFFFFF',
            boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
            display: 'inline-block',
            mx: 'auto',
            mb: 2.5
          }}
        >
          {upiUrl && (
            <QRCodeSVG
              value={upiUrl}
              size={260}
              level="Q"
              style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
            />
          )}
        </Box>

        <Typography variant="overline" sx={{ color: themeAccent, letterSpacing: '0.18em', fontWeight: 800 }}>
          TOTAL AMOUNT DUE
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 900, color: '#FFFFFF', mb: 1, fontSize: '2.2rem' }}>
          ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Typography>

        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2.5 }}>
          Point any UPI scanner app (Google Pay, PhonePe, Paytm, BHIM) at the screen to settle instantly.
        </Typography>

        <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleCopyUpi}
            sx={{
              borderRadius: 2.5,
              py: 1.2,
              borderColor: `${themeAccent}88`,
              color: '#FFFFFF',
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.9rem',
              '&:hover': {
                borderColor: themeAccent,
                bgcolor: `${themeAccent}15`
              }
            }}
          >
            {copiedUpi ? '✓ UPI URL Copied' : 'Copy UPI Link'}
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={() => setQrZoomOpen(false)}
            sx={{
              borderRadius: 2.5,
              py: 1.2,
              background: `linear-gradient(135deg, ${themeAccent} 0%, ${themeAccent}CC 100%)`,
              color: '#0F172A',
              fontWeight: 800,
              textTransform: 'none',
              fontSize: '0.95rem'
            }}
          >
            Close Fullscreen QR
          </Button>
        </Stack>
      </Dialog>

      {/* Subtle Responsive Luxury Footer Bar */}
      <Box
        sx={{
          py: { xs: 1.2, sm: 1.5 },
          px: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: { xs: 0.6, sm: 2 },
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          bgcolor: 'rgba(10, 13, 20, 0.95)',
          backdropFilter: 'blur(24px)',
          zIndex: 10,
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: { xs: '0.68rem', sm: '0.74rem' }, fontWeight: 500 }}>
          ✨ Powered by {storeName} Atelier Engine • Real-Time Dual-Screen Synchronization
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: { xs: '0.64rem', sm: '0.72rem' } }}>
          🔒 Strictly Confidential & Encrypted Locally
        </Typography>
      </Box>
    </Box>
  );
}
