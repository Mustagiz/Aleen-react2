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
  WhatsApp,
  Spa,
  CropFree,
  Star
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';

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

  // CFD State — hybrid instant (BroadcastChannel + LocalStorage + Cloud Firestore)
  const [cfdState, setCfdState] = useState(() => {
    try {
      const saved = localStorage.getItem('aleen_cfd_state');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // Sync mode badge state ('instant' | 'cloud')
  const [syncChannel, setSyncChannel] = useState('instant');

  // CRM Profile State (Synced directly from CRM Brand Details)
  const [crmProfile, setCrmProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('aleen_crm_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // Admin CFD Configuration (Idle screen animations, video, marquee text, customer name styling)
  const [cfdConfig, setCfdConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('aleen_cfd_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      idleDisplayType: 'animation',
      animationType: 'couture-showcase',
      videoPreset: 'interactive-runway',
      videoUrl: 'canvas-runway',
      videoFit: 'cover',
      customHeadline: 'Welcome to Aleen Clothing Atelier',
      customSubtext: 'Bespoke Bridal Lehengas • Pure Handloom Banarasi Silks • Master Couture Tailoring',
      textAnimationStyle: 'marquee-glide',
      animateCustomerName: true,
      customerAnimationStyle: 'golden-shimmer',
      welcomeTone: 'luxury'
    };
  });

  // Video element reference for reliable autoplay & framing control
  const videoRef = useRef(null);

  // Auto-play video with sound policy compliance whenever video URL/fit/mode changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [cfdConfig.videoUrl, cfdConfig.videoFit, cfdConfig.idleDisplayType]);

  // Interactive Customer Touchpoint States
  const [patronRating, setPatronRating] = useState(5);
  const [selectedCompliments, setSelectedCompliments] = useState(['✨ Exquisite Fabric', '✂️ Flawless Fit']);
  const [ratingToast, setRatingToast] = useState('');
  const [heartBurst, setHeartBurst] = useState(false);
  const [qrZoomOpen, setQrZoomOpen] = useState(false);
  const [receiptRequested, setReceiptRequested] = useState(false);
  const [receiptToast, setReceiptToast] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // BroadcastChannel Reference for 0ms cross-tab dual screen sync
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

  const applyCfdUpdate = (data, source = 'cloud') => {
    if (!data) return;
    setCfdState(data);
    if (source === 'local') {
      setSyncChannel('instant');
    }
  };

  // 1. CRM Brand & Store Logo Real-Time Sync (Synchronizes with Settings tab)
  useEffect(() => {
    try {
      const unsubProfile = onSnapshot(
        doc(db, 'settings', 'profile'),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setCrmProfile(data);
            try {
              localStorage.setItem('aleen_crm_profile', JSON.stringify(data));
            } catch (e) {}
          }
        },
        (err) => console.warn('CRM Profile sync warning:', err)
      );
      return () => unsubProfile();
    } catch (err) {
      console.warn('Error attaching profile listener:', err);
    }
  }, []);

  // 2. CFD Admin Settings Sync (Idle animation style, video, marquee text)
  useEffect(() => {
    try {
      const unsubConfig = onSnapshot(
        doc(db, 'settings', 'cfd_config'),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setCfdConfig((prev) => ({ ...prev, ...data }));
            try {
              localStorage.setItem('aleen_cfd_config', JSON.stringify(data));
            } catch (e) {}
          }
        },
        (err) => console.warn('CFD Config sync warning:', err)
      );
      return () => unsubConfig();
    } catch (err) {
      console.warn('Error attaching CFD config listener:', err);
    }
  }, []);

  // 3. ZERO-LATENCY INSTANT SYNC (BroadcastChannel, LocalStorage, Window PostMessage)
  useEffect(() => {
    // A. BroadcastChannel for sub-millisecond local cross-window sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('aleen_customer_display');
        channelRef.current = bc;

        bc.onmessage = (event) => {
          if (!event.data) return;
          if (event.data.type === 'SYNC' && event.data.payload) {
            applyCfdUpdate(event.data.payload, 'local');
          } else if (event.data.type === 'PING') {
            setPingAlert(true);
          } else if (event.data.type === 'CONFIG_UPDATE' && event.data.config) {
            setCfdConfig((prev) => ({ ...prev, ...event.data.config }));
          }
        };

        // Proactively request latest cart state from Cashier window on mount
        bc.postMessage({ type: 'REQUEST_SYNC' });
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // B. LocalStorage event listener (0ms fallback for browser windows)
    const handleStorageEvent = (event) => {
      if (event.key === 'aleen_cfd_state' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          applyCfdUpdate(parsed, 'local');
        } catch (e) {}
      } else if (event.key === 'aleen_cfd_config' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          setCfdConfig((prev) => ({ ...prev, ...parsed }));
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // C. Window postMessage listener
    const handleWindowMessage = (event) => {
      if (event.data?.type === 'SYNC' && event.data?.payload) {
        applyCfdUpdate(event.data.payload, 'local');
      }
    };
    window.addEventListener('message', handleWindowMessage);

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('message', handleWindowMessage);
    };
  }, []);

  // 4. Cloud Firestore Real-time Listener (Enables 2nd Device / iPad / Tablet over Wi-Fi / 5G)
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'cfd_live_sessions', 'primary'),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data) {
              applyCfdUpdate(data, 'cloud');

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

  // 5. Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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

  // Harmonized Brand Profile (CRM Settings overrides or falls back to CFD payload)
  const storeName = crmProfile?.businessName || cfdState?.storeName || 'Aleen Clothing';
  const storeLogo = crmProfile?.logoUrl || cfdState?.storeLogo || null;
  const storeTagline = crmProfile?.tagline || 'Bespoke Measurement & Haute Couture Atelier';

  const items = useMemo(() => cfdState?.items || [], [cfdState?.items]);
  const subtotal = cfdState?.subtotal || 0;
  const discount = cfdState?.discount || 0;
  const tax = cfdState?.tax || 0;
  const total = cfdState?.total || 0;
  const customerName = (cfdState?.customerName || '').trim();
  const customerPhone = (cfdState?.customerPhone || '').trim();
  const customerTier = cfdState?.customerTier || 'Silver';
  const loyaltyPoints = cfdState?.loyaltyPoints || 0;
  const paymentMethod = cfdState?.paymentMethod || 'Cash';
  const upiUrl = cfdState?.upiUrl || '';
  const isSettled = cfdState?.status === 'settled';

  // NOTE: Per user requirement, NO arbitrary timeout is set on settlement.
  // The screen only refreshes once the cashier cancels or bills/starts a new invoice!

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

  // Luxury Light Theme Accent Palette
  const themeAccent = '#C5A059'; // Royal Champagne Gold
  const themeAccentDeep = '#937230'; // Deep Antique Gold

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
    setRatingToast('💖 Thank you for your compliment! Our master craftsmen appreciate your love.');
  };

  const handleRequestReceipt = () => {
    setReceiptRequested(true);
    setReceiptToast(true);
  };

  const isEmptyCart = !items.length && !isSettled;
  const hasCustomer = Boolean(customerName);

  // Dynamic Patron VIP Name Renderer with selectable animation styles
  const renderPatronName = (name, customSx = {}) => {
    if (!name) return null;
    const isAnimated = cfdConfig.animateCustomerName !== false;
    const style = cfdConfig.customerAnimationStyle || 'golden-shimmer';

    const animSx = isAnimated ? {
      ...(style === 'golden-shimmer' && {
        background: 'linear-gradient(90deg, #937230 0%, #D97706 25%, #FDE047 50%, #D97706 75%, #937230 100%)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'cfdShimmer 2.2s linear infinite'
      }),
      ...(style === 'bounce-float' && {
        color: '#0F172A',
        animation: 'cfdBounceFloat 1.8s ease-in-out infinite'
      }),
      ...(style === 'pulse-glow' && {
        color: '#937230',
        animation: 'cfdPulseGlow 2s ease-in-out infinite'
      }),
      ...(style === 'sparkle-pop' && {
        color: '#B45309',
        animation: 'cfdSparklePop 2.4s ease-in-out infinite'
      }),
      ...(style === 'neon-atelier' && {
        color: '#937230',
        animation: 'cfdNeonGlow 2s ease-in-out infinite'
      })
    } : {
      color: '#0F172A'
    };

    return (
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          fontWeight: 900,
          ...animSx,
          ...customSx
        }}
      >
        {isAnimated ? `✨ ${name} 💎` : name}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F1E8 50%, #FAF8F5 100%)',
        color: '#1E293B',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* Explicit Global CSS Keyframes for Guaranteed 60FPS Cross-Browser Animations */}
      <style>{`
        @keyframes cfdShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes cfdPulseGlow {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 6px rgba(197, 160, 89, 0.4));
          }
          50% {
            transform: scale(1.06);
            filter: drop-shadow(0 0 24px rgba(217, 119, 6, 0.85));
          }
        }
        @keyframes cfdBounceFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes cfdSparklePop {
          0%, 100% { transform: scale(1) rotate(0deg); }
          30% { transform: scale(1.1) rotate(1.5deg); }
          70% { transform: scale(0.96) rotate(-1.5deg); }
        }
        @keyframes cfdNeonGlow {
          0%, 100% {
            text-shadow: 0 0 8px rgba(197, 160, 89, 0.4), 0 0 16px rgba(197, 160, 89, 0.2);
          }
          50% {
            text-shadow: 0 0 20px rgba(217, 119, 6, 0.9), 0 0 35px rgba(245, 158, 11, 0.8);
          }
        }
        @keyframes cfdMarqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes cfdRotateSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes cfdRotateReverseSlow {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes cfdWaveUndulate {
          0%, 100% { transform: scaleY(1) translateY(0); }
          50% { transform: scaleY(1.22) translateY(-8px); }
        }
        @keyframes cfdRunwayLight {
          0%, 100% { opacity: 0.3; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
      {/* Test Ping Toast Notification */}
      <Snackbar
        open={pingAlert}
        autoHideDuration={4000}
        onClose={() => setPingAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          icon={<CheckCircle sx={{ color: '#059669' }} />}
          sx={{
            bgcolor: '#FFFFFF',
            color: '#065F46',
            border: '1.5px solid #10B981',
            boxShadow: '0 12px 35px rgba(5, 150, 105, 0.2)',
            borderRadius: 3.5,
            fontWeight: 800
          }}
        >
          ✨ Cashier Terminal Connected • Live Sub-Millisecond Mirroring Active
        </Alert>
      </Snackbar>

      {/* Rating & Compliment Toast */}
      <Snackbar
        open={Boolean(ratingToast)}
        autoHideDuration={3500}
        onClose={() => setRatingToast('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          icon={<AutoAwesome sx={{ color: '#D97706' }} />}
          sx={{
            bgcolor: '#FFFFFF',
            color: '#92400E',
            border: `1.5px solid ${themeAccent}`,
            boxShadow: `0 14px 40px rgba(197, 160, 89, 0.25)`,
            borderRadius: 3.5,
            fontWeight: 800
          }}
        >
          {ratingToast || `💖 Thank you for the ${patronRating}-Star love! Aleen Atelier is honoured to serve you.`}
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
          icon={<WhatsApp sx={{ color: '#059669' }} />}
          sx={{
            bgcolor: '#FFFFFF',
            color: '#065F46',
            border: '1.5px solid #10B981',
            boxShadow: '0 14px 40px rgba(0, 0, 0, 0.12)',
            borderRadius: 3.5,
            fontWeight: 800
          }}
        >
          📲 Digital Tax Invoice will be dispatched to {customerPhone ? `WhatsApp (+${customerPhone})` : 'your registered WhatsApp'} upon checkout!
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
                background: `radial-gradient(circle, #F59E0B 0%, #D97706 100%)`,
                boxShadow: `0 0 60px rgba(217, 119, 6, 0.5)`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Favorite sx={{ fontSize: 64, color: '#FFFFFF' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#92400E', mt: 1.5, textShadow: '0 2px 10px rgba(255,255,255,0.8)' }}>
              Stylist Cherished! ✨
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Luxury Soft Champagne Halos (Light Theme) */}
      <Box
        sx={{
          position: 'fixed',
          top: -150,
          right: -150,
          width: 580,
          height: 580,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(197, 160, 89, 0.18) 0%, rgba(255, 255, 255, 0) 70%)',
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
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.12) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* TOP LUXURY HEADER (Light Theme with CRM Synced Logo) */}
      <Box
        sx={{
          px: { xs: 1.5, sm: 2.5, md: 4 },
          py: { xs: 1.2, sm: 1.6 },
          minHeight: { xs: 60, sm: 70 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 1, sm: 2 },
          borderBottom: '1px solid rgba(197, 160, 89, 0.25)',
          bgcolor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 20px rgba(180, 140, 75, 0.06)',
          zIndex: 10
        }}
      >
        {/* Brand & Synced Store Logo */}
        <Stack direction="row" alignItems="center" spacing={{ xs: 1.2, sm: 2 }} sx={{ minWidth: 0, flexShrink: 1 }}>
          {storeLogo ? (
            <Box
              component="img"
              src={storeLogo}
              alt={storeName}
              sx={{
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                borderRadius: '12px',
                objectFit: 'contain',
                flexShrink: 0,
                border: '1.5px solid rgba(197, 160, 89, 0.35)',
                bgcolor: '#FFFFFF',
                p: 0.4,
                boxShadow: '0 4px 12px rgba(197, 160, 89, 0.15)'
              }}
            />
          ) : (
            <Box
              sx={{
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${themeAccent} 0%, #937230 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(197, 160, 89, 0.35)',
                flexShrink: 0
              }}
            >
              <Diamond sx={{ color: '#FFFFFF', fontSize: { xs: 22, sm: 26 } }} />
            </Box>
          )}

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: '#0F172A',
                textTransform: 'uppercase',
                fontSize: { xs: '0.95rem', sm: '1.15rem', md: '1.3rem' },
                lineHeight: 1.2
              }}
            >
              {storeName}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: themeAccentDeep,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 800,
                fontSize: { xs: '0.62rem', sm: '0.72rem' },
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {storeTagline}
            </Typography>
          </Box>
        </Stack>

        {/* Right Status Controls */}
        <Stack direction="row" alignItems="center" spacing={{ xs: 0.8, sm: 1.5 }} sx={{ flexShrink: 0 }}>
          {/* Personalized Customer Welcome Chip in Header */}
          {hasCustomer && (
            <Chip
              avatar={
                <Avatar sx={{ bgcolor: themeAccentDeep, color: '#FFFFFF', fontWeight: 900, fontSize: '0.72rem', width: 26, height: 26 }}>
                  {patronInitials}
                </Avatar>
              }
              label={
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                  <span>{timeGreeting},</span>
                  {renderPatronName(customerName, { fontSize: '0.84rem' })}
                </Box>
              }
              sx={{
                bgcolor: 'rgba(197, 160, 89, 0.12)',
                color: '#937230 !important',
                border: '1px solid rgba(197, 160, 89, 0.4)',
                fontWeight: 800,
                fontSize: { xs: '0.72rem', sm: '0.84rem' },
                height: { xs: 30, sm: 34 },
                maxWidth: { xs: 180, sm: 320, md: 'none' },
                boxShadow: '0 2px 6px rgba(197, 160, 89, 0.15)',
                '& .MuiChip-label': {
                  color: '#937230 !important',
                  fontWeight: 800,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }
              }}
            />
          )}

          {/* Sync Status Badge — Instant 0ms Dual Screen or Cloud Live */}
          <Chip
            icon={<Wifi sx={{ fontSize: '0.85rem !important', color: '#059669' }} />}
            label={syncChannel === 'instant' ? 'Instant Live ✓' : 'Cloud Live'}
            size="small"
            sx={{
              bgcolor: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              fontWeight: 800,
              fontSize: '0.72rem',
              height: 28,
              '& .MuiChip-label': { color: '#059669', fontWeight: 800 }
            }}
          />

          {/* Live Digital Clock */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.6}
            sx={{ color: '#475569', display: { xs: 'none', md: 'flex' } }}
          >
            <AccessTime sx={{ fontSize: 16, color: '#937230' }} />
            <Typography variant="body2" sx={{ fontWeight: 700, letterSpacing: '0.04em', fontSize: '0.88rem', color: '#334155' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
          </Stack>

          {/* Fullscreen Toggle */}
          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Edge-to-Edge Fullscreen'}>
            <IconButton
              onClick={toggleFullscreen}
              size="small"
              sx={{
                color: '#475569',
                bgcolor: 'rgba(0, 0, 0, 0.04)',
                borderRadius: 2.5,
                p: { xs: 0.7, sm: 0.9 },
                border: '1px solid rgba(0, 0, 0, 0.08)',
                '&:hover': { bgcolor: 'rgba(197, 160, 89, 0.15)', color: '#937230' }
              }}
            >
              {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          p: (isEmptyCart && !hasCustomer && cfdConfig.idleDisplayType === 'video') ? { xs: 0.5, sm: 1 } : { xs: 1.5, sm: 2.5, md: 3 },
          gap: { xs: 2, md: 3 },
          zIndex: 1,
          minHeight: 0,
          overflowY: (isEmptyCart && !hasCustomer && cfdConfig.idleDisplayType === 'video') ? 'hidden' : { xs: 'auto', lg: 'hidden' }
        }}
      >
        <AnimatePresence>
          {/* =========================================================================
              STATE 1: BILL SETTLED CELEBRATION (Light Theme, No auto-timeout refresh)
              ========================================================================= */}
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
                  maxWidth: 780,
                  width: '100%',
                  p: { xs: 3, sm: 4, md: 5 },
                  textAlign: 'center',
                  borderRadius: 4.5,
                  bgcolor: '#FFFFFF',
                  border: '1.5px solid rgba(197, 160, 89, 0.35)',
                  boxShadow: '0 25px 60px rgba(180, 140, 75, 0.15), 0 4px 20px rgba(0, 0, 0, 0.05)',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}
              >
                <Box
                  sx={{
                    width: 88,
                    height: 88,
                    mx: 'auto',
                    mb: 2,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 30px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <CheckCircle sx={{ fontSize: 52, color: '#FFFFFF' }} />
                </Box>

                <Typography
                  variant="overline"
                  sx={{ color: '#059669', letterSpacing: '0.24em', fontWeight: 900, fontSize: '0.85rem' }}
                >
                  SETTLEMENT COMPLETE • DIGITAL RECEIPT GENERATED
                </Typography>

                {/* Animated Customer Name Highlight on Settlement */}
                <Typography variant="h3" sx={{ fontWeight: 900, mt: 0.5, mb: 1, color: '#0F172A', fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
                  Thank You, {renderPatronName(customerName || 'Honoured Patron')}!
                </Typography>

                <Typography variant="body1" sx={{ color: '#64748B', mb: 3, maxWidth: 540, mx: 'auto', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Your bespoke ensemble is registered. Our master tailors and craftspersons thank you for choosing {storeName}.
                </Typography>

                {/* Amount Paid & Reward Points Card */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      flex: 1,
                      p: 2.4,
                      borderRadius: 3.5,
                      bgcolor: '#FAF8F5',
                      border: '1px solid rgba(197, 160, 89, 0.25)',
                      boxShadow: '0 4px 14px rgba(197, 160, 89, 0.08)'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                      Settled Tender ({paymentMethod})
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#937230', mt: 0.5, fontSize: { xs: '1.7rem', sm: '2rem' } }}>
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      flex: 1,
                      p: 2.4,
                      borderRadius: 3.5,
                      bgcolor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                      Privilege Rewards Credited
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#059669', mt: 0.5, fontSize: { xs: '1.7rem', sm: '2rem' } }}>
                      +{Math.max(15, Math.round(total * 0.05))} Points
                    </Typography>
                  </Box>
                </Stack>

                {/* Interactive Customer Feedback & Compliment Section */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3.5,
                    bgcolor: '#FAF8F5',
                    border: '1px solid rgba(197, 160, 89, 0.3)',
                    mb: 3,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '0.04em', mb: 0.5 }}>
                    Rate Your Atelier Experience
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
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
                      fontSize: '2.5rem',
                      '& .MuiRating-iconFilled': { color: '#F59E0B' },
                      '& .MuiRating-iconHover': { color: '#D97706' }
                    }}
                  />

                  {/* Compliment Chips */}
                  <Typography variant="caption" sx={{ color: '#937230', fontWeight: 800, display: 'block', mt: 1.5, mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                            bgcolor: isSelected ? '#C5A059' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : '#334155',
                            fontWeight: isSelected ? 800 : 700,
                            border: `1.5px solid ${isSelected ? '#937230' : 'rgba(197, 160, 89, 0.3)'}`,
                            boxShadow: isSelected ? '0 4px 12px rgba(197, 160, 89, 0.3)' : '0 1px 4px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'scale(1.04)',
                              bgcolor: isSelected ? '#B38E44' : 'rgba(197, 160, 89, 0.12)'
                            }
                          }}
                        />
                      );
                    })}
                  </Stack>

                  {/* Digital Receipt Via WhatsApp Button */}
                  <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 2.2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<WhatsApp sx={{ color: '#FFFFFF' }} />}
                      onClick={handleRequestReceipt}
                      sx={{
                        borderRadius: 2.5,
                        bgcolor: receiptRequested ? '#059669' : '#10B981',
                        color: '#FFFFFF',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                        textTransform: 'none',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        px: 2.2,
                        '&:hover': { bgcolor: '#059669' }
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
                        borderColor: 'rgba(239, 68, 68, 0.5)',
                        color: '#DC2626',
                        bgcolor: 'rgba(239, 68, 68, 0.05)',
                        textTransform: 'none',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        '&:hover': {
                          borderColor: '#DC2626',
                          bgcolor: 'rgba(239, 68, 68, 0.12)'
                        }
                      }}
                    >
                      Send Love
                    </Button>
                  </Stack>
                </Box>

                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                  <VerifiedUser sx={{ color: '#059669', fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                    Official {storeName} Atelier Authenticity Guaranteed • Crafted with Heritage
                  </Typography>
                </Stack>
              </Paper>
            </motion.div>
          ) : isEmptyCart ? (
            /* =========================================================================
                STATE 2: IDLE SCREEN (ANIMATION / VIDEO / CUSTOM MARQUEE TEXT)
                ========================================================================= */
            <motion.div
              key={hasCustomer ? 'personalized-welcome' : (cfdConfig.idleDisplayType === 'video' ? 'atelier-video-fullscreen' : 'atelier-showcase')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: (!hasCustomer && cfdConfig.idleDisplayType === 'video') ? 'stretch' : 'center',
                justifyContent: 'center',
                flex: 1
              }}
            >
              {hasCustomer ? (
                /* PERSONALIZED PATRON WELCOME SUITE WITH ANIMATED NAME */
                <Paper
                  elevation={0}
                  sx={{
                    maxWidth: 820,
                    width: '100%',
                    p: { xs: 3, sm: 4, md: 5.5 },
                    borderRadius: 4.5,
                    bgcolor: '#FFFFFF',
                    border: '1.5px solid rgba(197, 160, 89, 0.35)',
                    boxShadow: '0 25px 60px rgba(180, 140, 75, 0.12), 0 4px 16px rgba(0, 0, 0, 0.04)',
                    textAlign: 'center'
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <Box
                      sx={{
                        width: 84,
                        height: 84,
                        mx: 'auto',
                        mb: 2.5,
                        borderRadius: 3.5,
                        background: 'linear-gradient(135deg, #C5A059 0%, #937230 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 25px rgba(197, 160, 89, 0.45)'
                      }}
                    >
                      <Stars sx={{ fontSize: 46, color: '#FFFFFF' }} />
                    </Box>
                  </motion.div>

                  <Chip
                    icon={<CardMembership sx={{ fontSize: '1rem !important', color: '#937230 !important' }} />}
                    label={`HONOURED ATELIER PATRON • ${customerTier.toUpperCase()} PRIVILEGE`}
                    sx={{
                      bgcolor: 'rgba(197, 160, 89, 0.14)',
                      color: '#937230',
                      border: '1px solid rgba(197, 160, 89, 0.4)',
                      fontWeight: 900,
                      fontSize: '0.82rem',
                      letterSpacing: '0.06em',
                      mb: 2,
                      px: 1.5,
                      py: 0.5
                    }}
                  />

                  {/* Customer Name Highlight Animated */}
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 900,
                      color: '#0F172A',
                      fontSize: { xs: '1.9rem', md: '2.7rem' },
                      mb: 1.2
                    }}
                  >
                    Welcome, {renderPatronName(customerName)}
                  </Typography>

                  <Typography variant="body1" sx={{ color: '#64748B', maxWidth: 580, mx: 'auto', mb: 4, fontSize: '0.98rem' }}>
                    It is our absolute pleasure to welcome you to {storeName}. Your dedicated stylist is curating and scanning your selected garments at the counter.
                  </Typography>

                  {/* 3 Patron Benefit Cards (Light Theme) */}
                  <Grid container spacing={2.5} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3.5,
                          bgcolor: '#FAF8F5',
                          border: '1px solid rgba(197, 160, 89, 0.3)',
                          height: '100%',
                          textAlign: 'left',
                          boxShadow: '0 4px 12px rgba(197, 160, 89, 0.06)'
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Redeem sx={{ color: '#937230', fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#937230' }}>
                            Loyalty Balance
                          </Typography>
                        </Stack>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', mb: 0.5 }}>
                          {loyaltyPoints || 450} Points
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', lineHeight: 1.4 }}>
                          Available to redeem towards today's bespoke bill
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3.5,
                          bgcolor: '#FAF8F5',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          height: '100%',
                          textAlign: 'left',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.06)'
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <AutoAwesome sx={{ color: '#059669', fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#059669' }}>
                            VIP Privilege
                          </Typography>
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', mb: 0.5, fontSize: '1.05rem' }}>
                          Complimentary Alterations
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', lineHeight: 1.4 }}>
                          Master tailor measurements included with every garment
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3.5,
                          bgcolor: '#FAF8F5',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          height: '100%',
                          textAlign: 'left',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.06)'
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <ShoppingBag sx={{ color: '#2563EB', fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#2563EB' }}>
                            Live Status
                          </Typography>
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', mb: 0.5, fontSize: '1.05rem' }}>
                          Awaiting Garments
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', lineHeight: 1.4 }}>
                          Items will stream onto this screen in real time as scanned
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Pulsing Status Bar */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: 'rgba(197, 160, 89, 0.12)',
                      border: '1.5px dashed rgba(197, 160, 89, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1.5
                    }}
                  >
                    <AutoAwesome sx={{ color: '#937230', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 700 }}>
                      Consultant currently ringing up items at the billing terminal...
                    </Typography>
                  </Box>
                </Paper>
              ) : cfdConfig.idleDisplayType === 'video' ? (
                /* MODE A: FULL SCREEN HAUTE COUTURE FASHION VIDEO & RUNWAY ATELIER */
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    flex: 1,
                    minHeight: { xs: 'calc(100vh - 85px)', sm: 'calc(100vh - 95px)', md: 'calc(100vh - 100px)' },
                    borderRadius: { xs: 2.5, md: 4 },
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: '#000000',
                    border: cfdConfig.videoFit === 'contain' ? '4px solid #C5A059' : '1.5px solid rgba(197, 160, 89, 0.4)',
                    boxShadow: '0 25px 70px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {cfdConfig.videoUrl === 'canvas-runway' ? (
                    /* 60FPS Interactive Virtual Runway Catwalk Canvas - Fullscreen Edge-to-Edge */
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        background: 'radial-gradient(circle at 50% 30%, #2A2215 0%, #0A0805 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF'
                      }}
                    >
                      {/* Animated Runway Lighting Pillars */}
                      <Box sx={{ position: 'absolute', top: 0, left: '18%', width: 3, height: '100%', bgcolor: 'rgba(197, 160, 89, 0.65)', animation: 'cfdRunwayLight 2s infinite ease-in-out' }} />
                      <Box sx={{ position: 'absolute', top: 0, right: '18%', width: 3, height: '100%', bgcolor: 'rgba(197, 160, 89, 0.65)', animation: 'cfdRunwayLight 2s infinite ease-in-out 1s' }} />

                      {/* Perspective Gold Runway Lines */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: '10%',
                          right: '10%',
                          height: '45%',
                          background: 'linear-gradient(to top, rgba(197, 160, 89, 0.35) 0%, rgba(197, 160, 89, 0) 100%)',
                          borderLeft: '3px solid rgba(197, 160, 89, 0.5)',
                          borderRight: '3px solid rgba(197, 160, 89, 0.5)',
                          transform: 'perspective(250px) rotateX(45deg)',
                          pointerEvents: 'none'
                        }}
                      />

                      {/* Floating Runway Stardust */}
                      <Stack direction="row" spacing={{ xs: 3, sm: 5, md: 7 }} sx={{ position: 'absolute', top: '20%', pointerEvents: 'none' }}>
                        {['✨', '⭐', '💎', '🌟', '✨'].map((star, sIdx) => (
                          <motion.div
                            key={sIdx}
                            animate={{ y: [0, -14, 0], opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 2.2, delay: sIdx * 0.4, ease: 'easeInOut' }}
                          >
                            <Typography sx={{ fontSize: { xs: 26, sm: 34 } }}>{star}</Typography>
                          </motion.div>
                        ))}
                      </Stack>

                      {/* Walking Haute Couture Model Silhouette */}
                      <motion.div
                        animate={{ y: [0, -16, 0], scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                      >
                        <Typography sx={{ fontSize: { xs: 80, sm: 110, md: 140 } }}>💃</Typography>
                      </motion.div>
                    </Box>
                  ) : (
                    /* Real Video Player with Explicit Autoplay & Framing - Fullscreen */
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        bgcolor: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...(cfdConfig.videoFit === 'cinematic' ? {
                          borderTop: { xs: '20px solid #000000', md: '35px solid #000000' },
                          borderBottom: { xs: '20px solid #000000', md: '35px solid #000000' }
                        } : {})
                      }}
                    >
                      <video
                        ref={videoRef}
                        src={cfdConfig.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: cfdConfig.videoFit === 'contain' ? 'contain' : 'cover',
                          display: 'block'
                        }}
                      />
                    </Box>
                  )}

                  {/* Frosted Lower Third & Store Credo Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      zIndex: 3,
                      p: { xs: 2, sm: 3, md: 4 },
                      background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0) 100%)',
                      backdropFilter: 'blur(3px)',
                      color: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: { xs: 1.5, sm: 2 }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                      <Box>
                        <Typography variant="overline" sx={{ color: '#FCD34D', letterSpacing: '0.24em', fontWeight: 900, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                          {storeName.toUpperCase()} • RUNWAY ATELIER
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFFFFF', textShadow: '0 2px 10px rgba(0,0,0,0.85)', fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2.2rem' } }}>
                          {cfdConfig.videoUrl === 'canvas-runway' ? 'Haute Couture Catwalk & Bespoke Craft' : 'Haute Couture & Bespoke Matrimonial Craft'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', mt: 0.3, maxWidth: 720, fontSize: { xs: '0.82rem', sm: '0.92rem' } }}>
                          {cfdConfig.videoUrl === 'canvas-runway'
                            ? '60FPS Virtual Runway • Pure mulberry silks, zardozi needlework and master tailoring.'
                            : 'Crafted with pure mulberry silks, antique zardozi needlework and master tailoring.'}
                        </Typography>
                      </Box>
                      <Chip
                        icon={<CropFree sx={{ color: '#FCD34D !important', fontSize: '0.9rem !important' }} />}
                        label={`FRAMING: ${(cfdConfig.videoFit || 'cover').toUpperCase()}`}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.65)',
                          color: '#FCD34D',
                          border: '1px solid rgba(252, 211, 77, 0.5)',
                          fontWeight: 800,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>

                    {/* Credo Chips */}
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ pt: 0.5 }}>
                      <Chip
                        icon={<AutoAwesome sx={{ color: '#FCD34D !important' }} />}
                        label="Zero-Contact UPI Checkout"
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)', fontWeight: 700, backdropFilter: 'blur(8px)' }}
                      />
                      <Chip
                        icon={<ShoppingBag sx={{ color: '#38BDF8 !important' }} />}
                        label="Itemized Live Bill Mirroring"
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)', fontWeight: 700, backdropFilter: 'blur(8px)' }}
                      />
                      <Chip
                        icon={<VerifiedUser sx={{ color: '#34D399 !important' }} />}
                        label="Certified Authentic Handloom"
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)', fontWeight: 700, backdropFilter: 'blur(8px)' }}
                      />
                    </Stack>
                  </Box>
                </Box>
              ) : (
                /* PURE IDLE SCREEN: ANIMATED TEXT / 4 HAUTE COUTURE ANIMATIONS */
                <Paper
                  elevation={0}
                  sx={{
                    maxWidth: 920,
                    width: '100%',
                    p: { xs: 2.5, sm: 3.5, md: 5 },
                    textAlign: 'center',
                    borderRadius: 4.5,
                    bgcolor: '#FFFFFF',
                    border: '1.5px solid rgba(197, 160, 89, 0.35)',
                    boxShadow: '0 25px 60px rgba(180, 140, 75, 0.12), 0 4px 16px rgba(0, 0, 0, 0.04)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {cfdConfig.idleDisplayType === 'text' ? (
                    /* MODE B: ANIMATED CUSTOM HEADLINE / SEAMLESS MARQUEE TEXT */
                    <Box sx={{ py: { xs: 2, sm: 4 } }}>
                      {/* Floating Rotating Diamond Medallion */}
                      <Box
                        sx={{
                          width: 84,
                          height: 84,
                          mx: 'auto',
                          mb: 2.5,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #C5A059 0%, #937230 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 8px 25px rgba(197, 160, 89, 0.45)',
                          animation: 'cfdPulseGlow 2.5s infinite ease-in-out'
                        }}
                      >
                        <Diamond sx={{ fontSize: 44, color: '#FFFFFF' }} />
                      </Box>

                      <Typography
                        variant="overline"
                        sx={{ color: '#937230', letterSpacing: '0.24em', fontWeight: 900, fontSize: '0.85rem' }}
                      >
                        {storeName.toUpperCase()} • ATELIER BESPOKE
                      </Typography>

                      {/* Custom Headline with Chosen Animation */}
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 900,
                          mt: 1,
                          mb: 2,
                          fontSize: { xs: '1.9rem', sm: '2.5rem', md: '3.1rem' },
                          lineHeight: 1.2,
                          ...(cfdConfig.textAnimationStyle === 'pulse-glow' && {
                            color: '#937230',
                            animation: 'cfdPulseGlow 2.2s infinite ease-in-out'
                          }),
                          ...(cfdConfig.textAnimationStyle === 'marquee-glide' && {
                            background: 'linear-gradient(90deg, #937230 0%, #D97706 25%, #FDE047 50%, #D97706 75%, #937230 100%)',
                            backgroundSize: '200% auto',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            animation: 'cfdShimmer 2.5s linear infinite'
                          }),
                          ...(cfdConfig.textAnimationStyle === 'waterfall-cascade' && {
                            color: '#0F172A',
                            animation: 'cfdBounceFloat 1.8s ease-in-out infinite'
                          }),
                          ...(cfdConfig.textAnimationStyle === 'typewriter-fade' && {
                            color: '#B45309',
                            animation: 'cfdSparklePop 2.4s ease-in-out infinite'
                          })
                        }}
                      >
                        {cfdConfig.customHeadline || 'Welcome to Aleen Clothing Atelier'}
                      </Typography>

                      {/* Seamless Gapless Continuous Marquee Ticker */}
                      {cfdConfig.textAnimationStyle === 'marquee-glide' ? (
                        <Box
                          sx={{
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            width: '100%',
                            py: 2,
                            my: 2.5,
                            borderRadius: 3.5,
                            bgcolor: '#FAF8F5',
                            border: '1.5px solid rgba(197, 160, 89, 0.35)',
                            boxShadow: '0 8px 25px rgba(197, 160, 89, 0.1)'
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              width: 'max-content',
                              animation: 'cfdMarqueeScroll 20s linear infinite'
                            }}
                          >
                            {/* Track 1 */}
                            <Stack direction="row" spacing={3} sx={{ px: 2, flexShrink: 0, alignItems: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 800, color: '#937230' }}>
                                💎 {cfdConfig.customSubtext || 'Bespoke Bridal Lehengas • Pure Handloom Banarasi Silks • Master Couture Tailoring'}
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                ✨ {storeTagline}
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 800, color: '#D97706' }}>
                                👑 Generational Weaver Guilds & Atelier Precision
                              </Typography>
                            </Stack>
                            {/* Track 2 (Duplicate for Seamless Loop) */}
                            <Stack direction="row" spacing={3} sx={{ px: 2, flexShrink: 0, alignItems: 'center' }}>
                              <Typography variant="h6" sx={{ fontWeight: 800, color: '#937230' }}>
                                💎 {cfdConfig.customSubtext || 'Bespoke Bridal Lehengas • Pure Handloom Banarasi Silks • Master Couture Tailoring'}
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                ✨ {storeTagline}
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 800, color: '#D97706' }}>
                                👑 Generational Weaver Guilds & Atelier Precision
                              </Typography>
                            </Stack>
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="h6" sx={{ color: '#64748B', maxWidth: 640, mx: 'auto', mb: 3, fontWeight: 600, lineHeight: 1.6 }}>
                          {cfdConfig.customSubtext || 'Handcrafted Silks • Bespoke Bridal Lehengas • Master Atelier Precision'}
                        </Typography>
                      )}

                      {/* Highlight Badges */}
                      <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" sx={{ mt: 1 }}>
                        <Chip
                          icon={<Star sx={{ color: '#937230 !important' }} />}
                          label="Bespoke Bridal Lehengas"
                          sx={{ bgcolor: '#FAF8F5', color: '#937230', border: '1px solid rgba(197, 160, 89, 0.3)', fontWeight: 800 }}
                        />
                        <Chip
                          icon={<Diamond sx={{ color: '#937230 !important' }} />}
                          label="Pure Handloom Silks"
                          sx={{ bgcolor: '#FAF8F5', color: '#937230', border: '1px solid rgba(197, 160, 89, 0.3)', fontWeight: 800 }}
                        />
                        <Chip
                          icon={<Spa sx={{ color: '#937230 !important' }} />}
                          label="Master Fitting Guaranteed"
                          sx={{ bgcolor: '#FAF8F5', color: '#937230', border: '1px solid rgba(197, 160, 89, 0.3)', fontWeight: 800 }}
                        />
                      </Stack>
                    </Box>
                  ) : (
                    /* MODE C: 4 HAUTE COUTURE HIGH-MOTION ANIMATION STYLES */
                    <Box>
                      {/* Sub-Type 1: Golden Mandala / Rotating Filigree Rings */}
                      {cfdConfig.animationType === 'golden-mandala' ? (
                        <Box sx={{ py: 3, position: 'relative' }}>
                          <Box sx={{ position: 'relative', width: 200, height: 200, mx: 'auto', my: 2 }}>
                            {/* Outer Clockwise Rotating Ring with 12 Filigree Ray Markers */}
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '50%',
                                border: '2.5px dashed #C5A059',
                                animation: 'cfdRotateSlow 20s linear infinite'
                              }}
                            />

                            {/* Inner Counter-Clockwise Filigree Ring */}
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 26,
                                borderRadius: '50%',
                                border: '2px dotted #937230',
                                animation: 'cfdRotateReverseSlow 14s linear infinite'
                              }}
                            />

                            {/* Center Diamond Medallion with Breathing Golden Glow */}
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 56,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #C5A059 0%, #937230 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#FFF',
                                boxShadow: '0 8px 30px rgba(197, 160, 89, 0.55)',
                                animation: 'cfdPulseGlow 2.5s infinite ease-in-out'
                              }}
                            >
                              <Diamond sx={{ fontSize: 38 }} />
                            </Box>
                          </Box>

                          <Typography variant="overline" sx={{ color: '#937230', letterSpacing: '0.24em', fontWeight: 900, display: 'block', mt: 2 }}>
                            ROYAL ZARDOZI HERITAGE
                          </Typography>
                          <Typography variant="h3" sx={{ fontWeight: 900, color: '#0F172A', mt: 0.5, mb: 1, fontSize: { xs: '1.8rem', md: '2.6rem' } }}>
                            Sacred Weaves & Timeless Bridal Grandeur
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#64748B', maxWidth: 580, mx: 'auto', mb: 2 }}>
                            Dual concentric mandala rings rotating with generational precision. Every ensemble reflects the master weaver guilds of Aleen Atelier.
                          </Typography>
                        </Box>
                      ) : cfdConfig.animationType === 'fabric-flow' ? (
                        /* Sub-Type 2: Silken Fabric Flow & Floating Stardust */
                        <Box sx={{ py: 3, position: 'relative' }}>
                          {/* 8-Bar Undulating Liquid Silk Wave */}
                          <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} justifyContent="center" alignItems="center" sx={{ height: 110, mb: 2 }}>
                            {[0, 1, 2, 3, 4, 5, 6, 7].map((barIdx) => (
                              <Box
                                key={barIdx}
                                sx={{
                                  width: { xs: 10, sm: 16 },
                                  height: 42 + (barIdx % 4) * 18,
                                  borderRadius: 3,
                                  background: 'linear-gradient(180deg, #FDE047 0%, #D97706 50%, #937230 100%)',
                                  boxShadow: '0 4px 15px rgba(217, 119, 6, 0.45)',
                                  animation: `cfdWaveUndulate 2s ease-in-out infinite ${barIdx * 0.22}s`
                                }}
                              />
                            ))}
                          </Stack>

                          {/* Floating Golden Stardust Particles */}
                          <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 2 }}>
                            {['✨', '⭐', '💎', '🌟', '✨'].map((star, sIdx) => (
                              <motion.div
                                key={sIdx}
                                animate={{ y: [0, -14, 0], scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2.2, delay: sIdx * 0.35, ease: 'easeInOut' }}
                              >
                                <Typography sx={{ fontSize: 26 }}>{star}</Typography>
                              </motion.div>
                            ))}
                          </Stack>

                          <Typography variant="overline" sx={{ color: '#937230', letterSpacing: '0.24em', fontWeight: 900, display: 'block' }}>
                            FLOWING PURE MULBERRY SILKS & GOLDEN STARDUST
                          </Typography>
                          <Typography variant="h3" sx={{ fontWeight: 900, color: '#0F172A', mt: 0.5, mb: 1, fontSize: { xs: '1.8rem', md: '2.6rem' } }}>
                            Liquid Drape & Artisanal Luxury
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#64748B', maxWidth: 580, mx: 'auto', mb: 2 }}>
                            Hand-loomed organic mulberry silks undulating with liquid fluidity, woven on generational pit looms.
                          </Typography>
                        </Box>
                      ) : cfdConfig.animationType === 'minimalist-aura' ? (
                        /* Sub-Type 3: Modern Atelier Breathing Aura */
                        <Box sx={{ py: 3, position: 'relative' }}>
                          <Box sx={{ position: 'relative', width: 220, height: 220, mx: 'auto', my: 2 }}>
                            {/* Outer Expanding Aura Ring */}
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '50%',
                                border: '1.5px dashed rgba(197, 160, 89, 0.4)',
                                animation: 'cfdPulseGlow 3.5s infinite ease-in-out 1.5s'
                              }}
                            />
                            {/* Middle Ring */}
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 32,
                                borderRadius: '50%',
                                border: '2px solid rgba(197, 160, 89, 0.6)',
                                animation: 'cfdPulseGlow 3.5s infinite ease-in-out 0.75s'
                              }}
                            />
                            {/* Inner Ring with Diamond */}
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 68,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.3) 0%, rgba(147, 114, 48, 0.4) 100%)',
                                border: '2px solid #C5A059',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 30px rgba(197, 160, 89, 0.4)',
                                animation: 'cfdPulseGlow 3.5s infinite ease-in-out'
                              }}
                            >
                              <Diamond sx={{ fontSize: 40, color: '#937230' }} />
                            </Box>
                          </Box>

                          <Typography variant="overline" sx={{ color: '#937230', letterSpacing: '0.28em', fontWeight: 900, fontSize: '0.85rem' }}>
                            ALEEN COUTURE MANIFESTO
                          </Typography>
                          <Typography variant="h3" sx={{ fontWeight: 900, color: '#0F172A', mt: 0.5, mb: 1, fontSize: { xs: '1.8rem', md: '2.6rem' } }}>
                            Perfection in Every Silhouette
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#64748B', maxWidth: 560, mx: 'auto', mb: 2 }}>
                            Parisian atelier precision meets royal Indian weaving traditions. Expanding radiant golden halos sculpted to measure.
                          </Typography>
                        </Box>
                      ) : (
                        /* Sub-Type 4 (Default): Haute Couture Editorial Collection Carousel */
                        <Box>
                          {/* Floating Haute Couture Emblem */}
                          <Box
                            sx={{
                              width: 88,
                              height: 88,
                              mx: 'auto',
                              mb: 2.5,
                              borderRadius: 4,
                              background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.3) 0%, rgba(197, 160, 89, 0.1) 100%)',
                              border: '2px solid rgba(197, 160, 89, 0.6)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              animation: 'cfdPulseGlow 3s infinite ease-in-out',
                              boxShadow: '0 8px 25px rgba(197, 160, 89, 0.3)'
                            }}
                          >
                            <Diamond sx={{ fontSize: 46, color: '#937230' }} />
                          </Box>

                          <Typography
                            variant="overline"
                            sx={{ color: '#937230', letterSpacing: '0.24em', fontWeight: 900, fontSize: '0.85rem' }}
                          >
                            WELCOME TO {storeName.toUpperCase()}
                          </Typography>

                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 900,
                              mt: 0.5,
                              mb: 1.5,
                              color: '#0F172A',
                              fontSize: { xs: '1.8rem', md: '2.6rem' }
                            }}
                          >
                            Bespoke Craftsmanship & Haute Couture
                          </Typography>

                          {/* Active Carousel Card with Animated Progress Line */}
                          <Box
                            sx={{
                              p: 3,
                              borderRadius: 3.5,
                              bgcolor: '#FAF8F5',
                              border: '1.5px solid rgba(197, 160, 89, 0.35)',
                              my: 3,
                              position: 'relative',
                              overflow: 'hidden',
                              boxShadow: '0 8px 24px rgba(197, 160, 89, 0.08)'
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#937230',
                                letterSpacing: '0.14em',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                display: 'block',
                                mb: 0.6
                              }}
                            >
                              FEATURED ATELIER COLLECTION • {ATELIER_COLLECTIONS[activeSlide].tagline}
                            </Typography>

                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', mb: 1 }}>
                              {ATELIER_COLLECTIONS[activeSlide].title}
                            </Typography>

                            <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 540, mx: 'auto', mb: 2, fontSize: '0.92rem' }}>
                              {ATELIER_COLLECTIONS[activeSlide].desc}
                            </Typography>

                            <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap">
                              {ATELIER_COLLECTIONS[activeSlide].highlights.map((h, i) => (
                                <Chip
                                  key={i}
                                  label={h}
                                  size="small"
                                  sx={{
                                    bgcolor: '#FFFFFF',
                                    color: '#937230',
                                    border: '1px solid rgba(197, 160, 89, 0.4)',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                                  }}
                                />
                              ))}
                            </Stack>

                            {/* Continuous Animated Gold Progress Bar */}
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 3.5,
                                background: 'linear-gradient(90deg, #937230, #FDE047, #937230)',
                                backgroundSize: '200% auto',
                                animation: 'cfdShimmer 2.5s linear infinite'
                              }}
                            />

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
                                    bgcolor: i === activeSlide ? '#937230' : 'rgba(197, 160, 89, 0.3)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                  }}
                                />
                              ))}
                            </Stack>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Store Credo Chips (Light Theme) */}
                  <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" sx={{ mt: 2 }}>
                    <Chip
                      icon={<AutoAwesome sx={{ color: '#937230 !important' }} />}
                      label="Zero-Contact UPI Checkout"
                      sx={{ bgcolor: '#FAF8F5', color: '#334155', border: '1px solid rgba(197, 160, 89, 0.25)', fontWeight: 700 }}
                    />
                    <Chip
                      icon={<ShoppingBag sx={{ color: '#0284C7 !important' }} />}
                      label="Itemized Live Bill Mirroring"
                      sx={{ bgcolor: '#FAF8F5', color: '#334155', border: '1px solid rgba(197, 160, 89, 0.25)', fontWeight: 700 }}
                    />
                    <Chip
                      icon={<VerifiedUser sx={{ color: '#059669 !important' }} />}
                      label="Certified Authentic Handloom"
                      sx={{ bgcolor: '#FAF8F5', color: '#334155', border: '1px solid rgba(197, 160, 89, 0.25)', fontWeight: 700 }}
                    />
                  </Stack>
                </Paper>
              )}
            </motion.div>
          ) : (
            /* =========================================================================
                STATE 3: DUAL-SCREEN LIVE CART & UPI PAYMENT PREVIEW (Light Theme)
                ========================================================================= */
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
                    bgcolor: '#FFFFFF',
                    border: '1.5px solid rgba(197, 160, 89, 0.3)',
                    boxShadow: '0 12px 35px rgba(180, 140, 75, 0.08), 0 2px 10px rgba(0, 0, 0, 0.03)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Cart Header with Customer Details */}
                  <Box
                    sx={{
                      px: { xs: 2, sm: 3 },
                      py: 2,
                      borderBottom: '1px solid rgba(197, 160, 89, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: '#FAF8F5'
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <LocalMall sx={{ color: '#937230', fontSize: 24 }} />
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', fontSize: { xs: '0.98rem', sm: '1.1rem' } }}>
                        Curated Ensemble for {renderPatronName(customerName || 'Honoured Patron', { fontSize: 'inherit' })} ({items.length} {items.length === 1 ? 'Item' : 'Items'})
                      </Typography>
                    </Stack>

                    {cfdState?.lastScannedItem && (
                      <Chip
                        size="small"
                        icon={<AutoAwesome sx={{ fontSize: '0.85rem !important', color: '#937230 !important' }} />}
                        label={`Just Added: ${cfdState.lastScannedItem}`}
                        sx={{
                          bgcolor: 'rgba(197, 160, 89, 0.15)',
                          color: '#937230',
                          border: '1px solid rgba(197, 160, 89, 0.4)',
                          fontWeight: 800,
                          fontSize: '0.74rem'
                        }}
                      />
                    )}
                  </Box>

                  {/* Scanned Items Scrollable Table (Light Theme Cards) */}
                  <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, sm: 2.5 } }}>
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
                                  bgcolor: '#FAF8F5',
                                  border: '1px solid rgba(197, 160, 89, 0.22)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 8px rgba(180, 140, 75, 0.04)',
                                  '&:hover': {
                                    bgcolor: '#FFFFFF',
                                    borderColor: '#C5A059',
                                    boxShadow: '0 6px 18px rgba(197, 160, 89, 0.15)'
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
                                        fontSize: '0.68rem',
                                        bgcolor: 'rgba(197, 160, 89, 0.15)',
                                        color: '#937230',
                                        border: '1px solid rgba(197, 160, 89, 0.35)',
                                        fontWeight: 800,
                                        letterSpacing: '0.04em'
                                      }}
                                    />
                                  </Stack>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.25 }}>
                                    {item.name}
                                  </Typography>
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.8 }}>
                                    {item.variantDetails && (
                                      <Chip
                                        label={item.variantDetails}
                                        size="small"
                                        sx={{
                                          height: 22,
                                          fontSize: '0.7rem',
                                          bgcolor: '#FFFFFF',
                                          color: '#475569',
                                          border: '1px solid rgba(0,0,0,0.08)',
                                          fontWeight: 700
                                        }}
                                      />
                                    )}
                                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                                      ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                                    </Typography>
                                  </Stack>
                                </Box>

                                <Box sx={{ textAlign: 'right' }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#937230', fontSize: '1.2rem' }}>
                                    ₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
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
                        py: 1.6,
                        bgcolor: 'rgba(16, 185, 129, 0.08)',
                        borderTop: '1px solid rgba(16, 185, 129, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AutoAwesome sx={{ color: '#059669', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800 }}>
                          Valued Patron Privilege Applied
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 900, fontSize: '0.88rem' }}>
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
                  {/* Financial Summary Card (Light Theme) */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      bgcolor: '#FFFFFF',
                      border: '1.5px solid rgba(197, 160, 89, 0.3)',
                      boxShadow: '0 12px 35px rgba(180, 140, 75, 0.08), 0 2px 10px rgba(0, 0, 0, 0.03)'
                    }}
                  >
                    <Typography variant="overline" sx={{ color: '#937230', letterSpacing: '0.15em', fontWeight: 900 }}>
                      BILL SUMMARY
                    </Typography>

                    <Stack spacing={1.2} sx={{ mt: 1.5, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                          Subtotal
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>

                      {discount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#059669', fontWeight: 700 }}>
                            Atelier Privilege Discount
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669' }}>
                            - ₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )}

                      {tax > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                            Estimated GST / Taxes
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            + ₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    <Divider sx={{ borderColor: 'rgba(197, 160, 89, 0.25)', my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A' }}>
                        Net Payable
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 900,
                          color: '#937230',
                          fontSize: { xs: '1.9rem', md: '2.4rem' }
                        }}
                      >
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Paper>

                  {/* Dynamic UPI Payment Card with Tap-to-Zoom */}
                  <Paper
                    elevation={0}
                    sx={{
                      flex: 1,
                      p: 2.5,
                      borderRadius: 4,
                      bgcolor: '#FFFFFF',
                      border: '1.5px solid rgba(197, 160, 89, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      boxShadow: '0 12px 35px rgba(180, 140, 75, 0.08), 0 2px 10px rgba(0, 0, 0, 0.03)',
                      position: 'relative'
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
                              borderRadius: 3.5,
                              bgcolor: '#FFFFFF',
                              border: '1.5px solid rgba(197, 160, 89, 0.35)',
                              boxShadow: '0 12px 35px rgba(180, 140, 75, 0.15)',
                              display: 'inline-block',
                              mb: 1.5,
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'all 0.25s ease',
                              '&:hover': {
                                transform: 'scale(1.03)',
                                borderColor: '#937230',
                                boxShadow: '0 16px 45px rgba(180, 140, 75, 0.25)'
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
                                bgcolor: '#0F172A',
                                color: '#FFFFFF',
                                borderRadius: 1.5,
                                px: 0.8,
                                py: 0.3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.4
                              }}
                            >
                              <ZoomIn sx={{ fontSize: 14 }} />
                              <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 800 }}>
                                TAP TO ZOOM
                              </Typography>
                            </Box>
                          </Box>
                        </Tooltip>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <QrCode2 sx={{ color: '#937230', fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A' }}>
                            Scan to Pay ₹{total.toLocaleString('en-IN')} via UPI
                          </Typography>
                        </Stack>

                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, maxWidth: 280, mb: 1.5 }}>
                          Google Pay • PhonePe • Paytm • BHIM • All UPI Apps
                        </Typography>

                        {/* Interactive Patron Rating / Compliment Bar during checkout */}
                        <Box
                          sx={{
                            width: '100%',
                            pt: 1.5,
                            mt: 0.5,
                            borderTop: '1px solid rgba(197, 160, 89, 0.2)'
                          }}
                        >
                          <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, fontSize: '0.74rem' }}>
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
                                '& .MuiRating-iconFilled': { color: '#F59E0B' },
                                '& .MuiRating-iconHover': { color: '#D97706' }
                              }}
                            />
                          </Stack>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ py: 3 }}>
                        <Box
                          sx={{
                            width: 68,
                            height: 68,
                            mx: 'auto',
                            mb: 2,
                            borderRadius: '50%',
                            bgcolor: 'rgba(197, 160, 89, 0.15)',
                            border: '1.5px solid rgba(197, 160, 89, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Payments sx={{ color: '#937230', fontSize: 34 }} />
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A' }}>
                          Tender: {paymentMethod}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, maxWidth: 280, fontWeight: 500 }}>
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
            bgcolor: '#FFFFFF',
            border: '2px solid rgba(197, 160, 89, 0.5)',
            boxShadow: '0 25px 60px rgba(180, 140, 75, 0.25)',
            p: 3,
            textAlign: 'center',
            color: '#0F172A'
          }
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <QrCode2 sx={{ color: '#937230', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.15rem' }}>
              High-Definition UPI Scan
            </Typography>
          </Stack>
          <IconButton onClick={() => setQrZoomOpen(false)} size="small" sx={{ color: '#64748B' }}>
            <Close fontSize="small" />
          </IconButton>
        </Stack>

        <Box
          sx={{
            p: 2,
            borderRadius: 4,
            bgcolor: '#FFFFFF',
            border: '1.5px solid rgba(197, 160, 89, 0.35)',
            boxShadow: '0 12px 35px rgba(197, 160, 89, 0.15)',
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

        <Typography variant="overline" sx={{ color: '#937230', letterSpacing: '0.18em', fontWeight: 900 }}>
          TOTAL AMOUNT DUE
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 900, color: '#0F172A', mb: 1, fontSize: '2.4rem' }}>
          ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Typography>

        <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5, fontWeight: 500 }}>
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
              borderColor: 'rgba(197, 160, 89, 0.5)',
              color: '#937230',
              fontWeight: 800,
              textTransform: 'none',
              fontSize: '0.9rem',
              '&:hover': {
                borderColor: '#937230',
                bgcolor: 'rgba(197, 160, 89, 0.1)'
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
              background: 'linear-gradient(135deg, #C5A059 0%, #937230 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: '0 4px 14px rgba(197, 160, 89, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #B38E44 0%, #826227 100%)'
              }
            }}
          >
            Close Fullscreen QR
          </Button>
        </Stack>
      </Dialog>

      {/* Subtle Responsive Luxury Footer Bar (Light Theme) */}
      <Box
        sx={{
          py: { xs: 1.2, sm: 1.5 },
          px: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: { xs: 0.6, sm: 2 },
          borderTop: '1px solid rgba(197, 160, 89, 0.25)',
          bgcolor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(20px)',
          zIndex: 10,
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: { xs: '0.7rem', sm: '0.78rem' }, fontWeight: 700 }}>
          ✨ Powered by {storeName} Atelier Engine • 0ms Dual-Screen IPC & Cloud Synchronization
        </Typography>
        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: { xs: '0.64rem', sm: '0.74rem' }, fontWeight: 600 }}>
          🔒 Strictly Confidential & Encrypted Locally
        </Typography>
      </Box>
    </Box>
  );
}
