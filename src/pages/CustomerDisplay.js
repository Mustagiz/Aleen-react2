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
  Button,
  LinearProgress
} from '@mui/material';
import {
  Fullscreen,
  FullscreenExit,
  QrCode2,
  CheckCircle,
  Diamond,
  ShoppingBag,
  AccessTime,
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
  Star,
  VolumeUp,
  VolumeOff,
  AccountBalanceWallet,
  WorkspacePremium,
  ContentCopy
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { playLuxuryChime } from '../utils/posVoiceEngine';
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

// High-fidelity celebration confetti & golden stardust particles
const CELEBRATION_PARTICLES = [
  { icon: '✨', xOffset: -160, yOffset: -220, size: 28, duration: 2.2, delay: 0.05, rotation: 45, finalScale: 1 },
  { icon: '🎉', xOffset: 160, yOffset: -240, size: 34, duration: 2.5, delay: 0.15, rotation: -30, finalScale: 1.1 },
  { icon: '💎', xOffset: -240, yOffset: -120, size: 30, duration: 2.4, delay: 0.1, rotation: 60, finalScale: 1 },
  { icon: '🌟', xOffset: 220, yOffset: -140, size: 32, duration: 2.3, delay: 0.2, rotation: -45, finalScale: 1.2 },
  { icon: '🎊', xOffset: -120, yOffset: -280, size: 32, duration: 2.6, delay: 0.25, rotation: 25, finalScale: 1 },
  { icon: '⭐', xOffset: 110, yOffset: -290, size: 26, duration: 2.1, delay: 0.1, rotation: -60, finalScale: 1 },
  { icon: '✨', xOffset: -270, yOffset: 40, size: 24, duration: 2.4, delay: 0.3, rotation: 90, finalScale: 0.9 },
  { icon: '👗', xOffset: 250, yOffset: 50, size: 28, duration: 2.5, delay: 0.2, rotation: -20, finalScale: 1 },
  { icon: '💎', xOffset: -70, yOffset: -320, size: 28, duration: 2.7, delay: 0.25, rotation: 40, finalScale: 1.1 },
  { icon: '🎉', xOffset: 70, yOffset: -330, size: 32, duration: 2.6, delay: 0.25, rotation: -35, finalScale: 1 },
  { icon: '💛', xOffset: -180, yOffset: 150, size: 26, duration: 2.8, delay: 0.35, rotation: 15, finalScale: 1 },
  { icon: '💚', xOffset: 180, yOffset: 160, size: 26, duration: 2.8, delay: 0.35, rotation: -15, finalScale: 1 },
  { icon: '✨', xOffset: 0, yOffset: -350, size: 36, duration: 2.5, delay: 0.1, rotation: 0, finalScale: 1.3 },
  { icon: '💫', xOffset: -130, yOffset: 90, size: 28, duration: 2.3, delay: 0.28, rotation: 50, finalScale: 1 },
  { icon: '💫', xOffset: 140, yOffset: 100, size: 28, duration: 2.3, delay: 0.3, rotation: -50, finalScale: 1 }
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
      if (saved) {
        const parsed = JSON.parse(saved);
        // If an active session was left open over 60 seconds ago without activity, default to idle
        if (parsed.status === 'active' && parsed.updatedAt && (Date.now() - parsed.updatedAt > 60000)) {
          return { status: 'idle', items: [] };
        }
        return parsed;
      }
    } catch (e) {}
    return { status: 'idle', items: [] };
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
  const [chunkedVideoUrl, setChunkedVideoUrl] = useState(null);
  const [videoLoadError, setVideoLoadError] = useState(false);

  // Cross-device chunk reassembly for uploaded videos
  useEffect(() => {
    let active = true;
    if (cfdConfig.idleDisplayType === 'video' && cfdConfig.videoUrl === 'firestore-chunked') {
      const fetchChunkedVideo = async () => {
        try {
          setVideoLoadError(false);
          const snap = await getDocs(collection(db, 'cfd_video_chunks'));
          if (!active) return;
          if (snap.empty) {
            console.warn('No video chunks found in firestore collection');
            setVideoLoadError(true);
            return;
          }
          const chunks = [];
          snap.forEach((d) => chunks.push(d.data()));
          chunks.sort((a, b) => (a.index || 0) - (b.index || 0));

          const byteArrays = chunks.map((chunk) => {
            const binary = atob(chunk.data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
          });

          const blob = new Blob(byteArrays, { type: cfdConfig.videoMimeType || 'video/mp4' });
          const url = URL.createObjectURL(blob);
          if (active) {
            setChunkedVideoUrl(url);
            setVideoLoadError(false);
          }
        } catch (err) {
          console.warn('Error fetching chunked video on this device:', err);
          if (active) setVideoLoadError(true);
        }
      };
      fetchChunkedVideo();
    } else {
      setChunkedVideoUrl(null);
      setVideoLoadError(false);
    }
    return () => {
      active = false;
    };
  }, [cfdConfig.videoUrl, cfdConfig.videoUpdatedAt, cfdConfig.idleDisplayType, cfdConfig.videoMimeType]);

  // Video Sound preference (default false = sound is enabled)
  const [isVideoMuted, setIsVideoMuted] = useState(() => {
    try {
      const saved = localStorage.getItem('aleen_cfd_video_muted');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const handleToggleVideoSound = (e) => {
    if (e) e.stopPropagation();
    setIsVideoMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aleen_cfd_video_muted', String(next));
      } catch (err) {}
      if (videoRef.current) {
        videoRef.current.muted = next;
        if (!next) {
          videoRef.current.volume = 1.0;
          videoRef.current.play().catch(() => {});
        }
      }
      return next;
    });
  };

  // Auto-play video with audio or seamless fallback on mode/url change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isVideoMuted;
      videoRef.current.volume = 1.0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // If browser autoplay policy blocked unmuted sound, mute and play
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [cfdConfig.videoUrl, cfdConfig.videoFit, cfdConfig.idleDisplayType, chunkedVideoUrl, isVideoMuted]);

  // Unlock video audio on first user touch / click
  useEffect(() => {
    const unlockAudio = () => {
      if (videoRef.current && !isVideoMuted && videoRef.current.muted) {
        videoRef.current.muted = false;
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => {});
      }
    };
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, [isVideoMuted]);

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
  const lastAppliedUpdateRef = useRef({ seq: 0, updatedAt: 0 });

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
    const packetSeq = typeof data.seq === 'number' ? data.seq : 0;
    const packetTime = typeof data.updatedAt === 'number' ? data.updatedAt : 0;

    // 1. Explicit IDLE command: ALWAYS apply immediately to return to homepage/video
    if (data.status === 'idle' || (!data.items?.length && data.status !== 'settled')) {
      lastAppliedUpdateRef.current = {
        seq: Math.max(lastAppliedUpdateRef.current.seq, packetSeq),
        updatedAt: Math.max(lastAppliedUpdateRef.current.updatedAt, packetTime || Date.now())
      };
      setCfdState(data);
      if (source === 'local') setSyncChannel('instant');
      return;
    }

    // 2. Play chime when active bill arrives or updates
    if (data.status === 'active' && data.items?.length > 0) {
      if (cfdState?.status !== 'active' || (data.items?.length !== cfdState?.items?.length)) {
        playLuxuryChime('scan');
      }
    } else if (data.status === 'settled') {
      playLuxuryChime('success');
    }

    // 3. Detect new cashier billing session (e.g. cashier refreshed or new invoice started)
    if (packetTime > lastAppliedUpdateRef.current.updatedAt + 1000) {
      lastAppliedUpdateRef.current = { seq: packetSeq, updatedAt: packetTime };
      setCfdState(data);
      if (source === 'local') {
        setSyncChannel('instant');
      }
      return;
    }

    // 4. Monotonic guard: reject out-of-order stale packets
    if (packetSeq && lastAppliedUpdateRef.current.seq && packetSeq < lastAppliedUpdateRef.current.seq) {
      return;
    }
    if (packetTime && lastAppliedUpdateRef.current.updatedAt && packetTime < lastAppliedUpdateRef.current.updatedAt) {
      return;
    }

    lastAppliedUpdateRef.current = {
      seq: Math.max(lastAppliedUpdateRef.current.seq, packetSeq),
      updatedAt: Math.max(lastAppliedUpdateRef.current.updatedAt, packetTime)
    };

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

  // 2b. Loyalty Program Settings Real-Time Sync
  const [loyaltySettings, setLoyaltySettings] = useState(null);
  useEffect(() => {
    try {
      const unsubLoyalty = onSnapshot(
        doc(db, 'settings', 'loyalty'),
        (snapshot) => {
          if (snapshot.exists()) {
            setLoyaltySettings(snapshot.data());
          }
        },
        (err) => console.warn('CFD Loyalty settings sync warning:', err)
      );
      return () => unsubLoyalty();
    } catch (err) {
      console.warn('Error attaching Loyalty listener:', err);
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
  const taxPercent = cfdState?.taxPercent || 0;
  const total = cfdState?.total || 0;
  const customerName = (cfdState?.customerName || '').trim();
  const customerPhone = (cfdState?.customerPhone || '').trim();
  const customerTier = cfdState?.customerTier || 'Bronze';
  const loyaltyPoints = typeof cfdState?.loyaltyPoints === 'number' ? cfdState.loyaltyPoints : (Number(cfdState?.loyaltyPoints) || 0);
  const loyaltyPointsRedeemed = typeof cfdState?.loyaltyPointsRedeemed === 'number' ? cfdState.loyaltyPointsRedeemed : (Number(cfdState?.loyaltyPointsRedeemed) || 0);
  const loyaltyPointsRemaining = typeof cfdState?.loyaltyPointsRemaining === 'number'
    ? cfdState.loyaltyPointsRemaining
    : Math.max(0, loyaltyPoints - loyaltyPointsRedeemed);
  const loyaltyDiscount = typeof cfdState?.loyaltyDiscount === 'number' ? cfdState.loyaltyDiscount : (Number(cfdState?.loyaltyDiscount) || 0);
  const flatDiscount = typeof cfdState?.flatDiscount === 'number' ? cfdState.flatDiscount : (Number(cfdState?.flatDiscount) || 0);
  const percentDiscount = typeof cfdState?.percentDiscount === 'number' ? cfdState.percentDiscount : (Number(cfdState?.percentDiscount) || 0);
  const cgst = typeof cfdState?.cgst === 'number' ? cfdState.cgst : (Number(cfdState?.cgst) || 0);
  const sgst = typeof cfdState?.sgst === 'number' ? cfdState.sgst : (Number(cfdState?.sgst) || 0);
  const roundOff = typeof cfdState?.roundOff === 'number' ? cfdState.roundOff : (Number(cfdState?.roundOff) || 0);
  const customerTotalSpent = typeof cfdState?.customerTotalSpent === 'number' ? cfdState.customerTotalSpent : (Number(cfdState?.customerTotalSpent) || 0);

  const spendPerPoint = cfdState?.spendPerPoint || loyaltySettings?.spendPerPoint || 100;
  const tierMultiplier = cfdState?.tierMultiplier || (
    customerTier === 'Platinum' ? (loyaltySettings?.platinumMultiplier || 2)
    : customerTier === 'Gold' ? (loyaltySettings?.goldMultiplier || 1.5)
    : customerTier === 'Silver' ? (loyaltySettings?.silverMultiplier || 1.25)
    : (loyaltySettings?.bronzeMultiplier || 1)
  );

  const loyaltyPointsEarned = typeof cfdState?.loyaltyPointsEarned === 'number' && cfdState.loyaltyPointsEarned > 0
    ? cfdState.loyaltyPointsEarned
    : Math.floor((total / spendPerPoint) * tierMultiplier);

  // Helper for Tier progression and badge styling
  const getTierMeta = (tier) => {
    switch (tier) {
      case 'Platinum':
        return {
          label: 'Platinum VIP',
          color: '#0F766E',
          bg: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
          border: '#14B8A6',
          icon: '👑',
          nextTier: 'Haute Imperial Elite (Max Tier)',
          target: 100000,
          progress: 100
        };
      case 'Gold':
        return {
          label: 'Gold VIP',
          color: '#D97706',
          bg: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
          border: '#F59E0B',
          icon: '⚜️',
          nextTier: 'Platinum (₹1,00,000)',
          target: 100000,
          progress: Math.min(100, (customerTotalSpent / 100000) * 100)
        };
      case 'Silver':
        return {
          label: 'Silver VIP',
          color: '#64748B',
          bg: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
          border: '#94A3B8',
          icon: '✦',
          nextTier: 'Gold (₹50,000)',
          target: 50000,
          progress: Math.min(100, (customerTotalSpent / 50000) * 100)
        };
      default:
        return {
          label: 'Bronze Patron',
          color: '#B45309',
          bg: 'linear-gradient(135deg, #B45309 0%, #78350F 100%)',
          border: '#D97706',
          icon: '💎',
          nextTier: 'Silver (₹25,000)',
          target: 25000,
          progress: Math.min(100, (customerTotalSpent / 25000) * 100)
        };
    }
  };
  const paymentMethod = cfdState?.paymentMethod || 'Cash';
  const upiUrl = cfdState?.upiUrl || '';
  const isSettled = cfdState?.status === 'settled';
  const isIdle = cfdState?.status === 'idle';

  // Retain last known customer name during active invoice so thank-you receipt never loses the patron name
  const [lastKnownCustomerName, setLastKnownCustomerName] = useState('');
  useEffect(() => {
    if (cfdState?.status === 'idle') {
      setLastKnownCustomerName('');
      return;
    }
    if (customerName && customerName.toLowerCase() !== 'honoured patron' && customerName.toLowerCase() !== 'walk-in') {
      setLastKnownCustomerName(customerName);
    }
  }, [customerName, cfdState?.status]);

  const activeCustomerName = !isIdle
    ? (customerName && customerName.toLowerCase() !== 'honoured patron' ? customerName : (isSettled ? lastKnownCustomerName : ''))
    : '';

  // Celebration state triggered on settlement + Auto return to homepage
  const [showCelebration, setShowCelebration] = useState(false);
  useEffect(() => {
    if (isSettled) {
      setShowCelebration(true);
      const celebrationTimer = setTimeout(() => setShowCelebration(false), 3000);

      // Auto-return to Atelier Home Showcase after 4 seconds
      const autoReturnTimer = setTimeout(() => {
        setCfdState((prev) => ({
          ...prev,
          status: 'idle',
          items: [],
          total: 0,
          customerName: '',
          updatedAt: Date.now()
        }));
        try {
          localStorage.setItem('aleen_cfd_state', JSON.stringify({
            status: 'idle',
            items: [],
            total: 0,
            customerName: '',
            updatedAt: Date.now()
          }));
        } catch (e) {}
      }, 4000);

      return () => {
        clearTimeout(celebrationTimer);
        clearTimeout(autoReturnTimer);
      };
    } else {
      setShowCelebration(false);
    }
  }, [isSettled]);

  // Time-aware greeting
  const timeGreeting = useMemo(() => {
    const hr = currentTime.getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, [currentTime]);

  // Patron Initials
  const patronInitials = useMemo(() => {
    if (!activeCustomerName) return 'VIP';
    const parts = activeCustomerName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [activeCustomerName]);

  // Luxury Light Theme Accent Palette
  const themeAccent = '#C5A059'; // Royal Champagne Gold
  const themeAccentDeep = '#937230'; // Deep Antique Gold
  const tierMeta = getTierMeta(customerTier);
  const storeVpa = crmProfile?.bankDetails?.upiId || crmProfile?.upiId || 'aleenclothing@hdfcbank';

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

  const isEmptyCart = (!items.length || isIdle) && !isSettled;
  const hasCustomer = Boolean(activeCustomerName) && cfdState?.status === 'active';

  // Resume video playback immediately when invoice is cancelled or closed
  useEffect(() => {
    if (isEmptyCart && !hasCustomer && videoRef.current) {
      videoRef.current.muted = isVideoMuted;
      videoRef.current.volume = 1.0;
      const p = videoRef.current.play();
      if (p !== undefined) {
        p.catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [isEmptyCart, hasCustomer, isVideoMuted, chunkedVideoUrl]);

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
        height: '100dvh',
        maxHeight: '100dvh',
        background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F1E8 50%, #FAF8F5 100%)',
        color: '#1E293B',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
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
          px: { xs: 1.2, sm: 2.5, md: 4 },
          py: { xs: 0.8, sm: 1.2 },
          minHeight: { xs: 52, sm: 64 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 0.8, sm: 2 },
          borderBottom: '1px solid rgba(197, 160, 89, 0.25)',
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 20px rgba(180, 140, 75, 0.06)',
          zIndex: 10,
          overflow: 'hidden'
        }}
      >
        {/* Brand & Synced Store Logo */}
        <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 1.8 }} sx={{ minWidth: 0, flexShrink: 0 }}>
          {storeLogo ? (
            <Box
              component="img"
              src={storeLogo}
              alt={storeName}
              sx={{
                width: { xs: 34, sm: 42, md: 46 },
                height: { xs: 34, sm: 42, md: 46 },
                borderRadius: { xs: '8px', sm: '12px' },
                objectFit: 'contain',
                flexShrink: 0,
                border: '1.5px solid rgba(197, 160, 89, 0.35)',
                bgcolor: '#FFFFFF',
                p: 0.3,
                boxShadow: '0 2px 8px rgba(197, 160, 89, 0.15)'
              }}
            />
          ) : (
            <Box
              sx={{
                width: { xs: 34, sm: 42, md: 46 },
                height: { xs: 34, sm: 42, md: 46 },
                borderRadius: { xs: '8px', sm: '12px' },
                background: `linear-gradient(135deg, ${themeAccent} 0%, #937230 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 12px rgba(197, 160, 89, 0.35)',
                flexShrink: 0
              }}
            >
              <Diamond sx={{ color: '#FFFFFF', fontSize: { xs: 18, sm: 24 } }} />
            </Box>
          )}

          <Box sx={{ minWidth: 0, flexShrink: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                letterSpacing: '0.03em',
                color: '#0F172A',
                textTransform: 'uppercase',
                fontSize: { xs: '0.84rem', sm: '1.05rem', md: '1.25rem' },
                lineHeight: 1.15,
                whiteSpace: 'nowrap'
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
                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                display: { xs: 'none', md: 'block' }
              }}
            >
              {storeTagline}
            </Typography>
          </Box>
        </Stack>

        {/* Right Status Controls */}
        <Stack direction="row" alignItems="center" spacing={{ xs: 0.6, sm: 1.2 }} sx={{ minWidth: 0, flexShrink: 1, justifyContent: 'flex-end' }}>
          {/* Personalized Customer Welcome Chip in Header */}
          {hasCustomer && (
            <Tooltip title={`${timeGreeting}, ${activeCustomerName}`}>
              <Chip
                avatar={
                  <Avatar sx={{ bgcolor: themeAccentDeep, color: '#FFFFFF', fontWeight: 900, fontSize: { xs: '0.62rem', sm: '0.72rem' }, width: { xs: 22, sm: 26 }, height: { xs: 22, sm: 26 } }}>
                    {patronInitials}
                  </Avatar>
                }
                label={
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{timeGreeting},</Box>
                    {renderPatronName(activeCustomerName, { fontSize: { xs: '0.72rem', sm: '0.82rem' } })}
                  </Box>
                }
                sx={{
                  bgcolor: 'rgba(197, 160, 89, 0.12)',
                  color: '#937230 !important',
                  border: '1px solid rgba(197, 160, 89, 0.4)',
                  fontWeight: 800,
                  fontSize: { xs: '0.68rem', sm: '0.82rem' },
                  height: { xs: 26, sm: 32 },
                  maxWidth: { xs: 125, sm: 240, md: 'none' },
                  boxShadow: '0 2px 6px rgba(197, 160, 89, 0.12)',
                  '& .MuiChip-label': {
                    px: { xs: 0.6, sm: 1 },
                    color: '#937230 !important',
                    fontWeight: 800,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                }}
              />
            </Tooltip>
          )}

          {/* Sync Status Badge — Responsive: Pill on xs, Full on sm+ */}
          <Chip
            icon={
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: '#10B981',
                  boxShadow: '0 0 6px #10B981',
                  animation: 'cfdPulseGlow 2s infinite',
                  ml: { xs: '6px !important', sm: '8px !important' },
                  mr: { xs: '4px !important', sm: '6px !important' }
                }}
              />
            }
            label={
              <Box component="span">
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {syncChannel === 'instant' ? 'Instant Live ✓' : 'Cloud Live'}
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Live
                </Box>
              </Box>
            }
            size="small"
            sx={{
              bgcolor: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              fontWeight: 800,
              fontSize: { xs: '0.65rem', sm: '0.72rem' },
              height: { xs: 26, sm: 28 },
              px: { xs: 0.2, sm: 0.5 },
              '& .MuiChip-label': { color: '#059669', fontWeight: 800, px: 0.6 }
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
                borderRadius: 2,
                width: { xs: 28, sm: 34 },
                height: { xs: 28, sm: 34 },
                p: { xs: 0.4, sm: 0.8 },
                border: '1px solid rgba(0, 0, 0, 0.08)',
                '&:hover': { bgcolor: 'rgba(197, 160, 89, 0.15)', color: '#937230' }
              }}
            >
              {isFullscreen ? <FullscreenExit sx={{ fontSize: { xs: 16, sm: 20 } }} /> : <Fullscreen sx={{ fontSize: { xs: 16, sm: 20 } }} />}
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
          overflowY: (isEmptyCart && !hasCustomer && cfdConfig.idleDisplayType === 'video') ? 'hidden' : 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' }
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
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                margin: 'auto'
              }}
            >
              {/* Celebration Confetti & Sparkles Particle Explosion */}
              {showCelebration && (
                <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, overflow: 'hidden' }}>
                  {CELEBRATION_PARTICLES.map((p, pIdx) => (
                    <motion.div
                      key={pIdx}
                      initial={{
                        opacity: 0,
                        x: '50vw',
                        y: '45vh',
                        scale: 0.2,
                        rotate: 0
                      }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        x: `calc(50vw + ${p.xOffset}px)`,
                        y: `calc(45vh + ${p.yOffset}px)`,
                        scale: [0.2, 1.4, p.finalScale],
                        rotate: p.rotation
                      }}
                      transition={{
                        duration: p.duration,
                        delay: p.delay,
                        ease: 'easeOut',
                        repeat: 1,
                        repeatDelay: 0.4
                      }}
                      style={{
                        position: 'absolute',
                        fontSize: p.size,
                        willChange: 'transform, opacity'
                      }}
                    >
                      {p.icon}
                    </motion.div>
                  ))}
                </Box>
              )}

              <Paper
                elevation={0}
                sx={{
                  maxWidth: 680,
                  width: '100%',
                  mx: 'auto',
                  p: { xs: 2.2, sm: 3.5, md: 4.5 },
                  textAlign: 'center',
                  borderRadius: 4,
                  bgcolor: '#FFFFFF',
                  border: '1.5px solid rgba(197, 160, 89, 0.35)',
                  boxShadow: '0 25px 60px rgba(180, 140, 75, 0.15), 0 4px 20px rgba(0, 0, 0, 0.05)',
                  position: 'relative'
                }}
              >
                {/* Animated Pulsating Checkmark with Golden Halo */}
                <Box
                  sx={{
                    width: { xs: 72, sm: 84 },
                    height: { xs: 72, sm: 84 },
                    mx: 'auto',
                    mb: 1.8,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 30px rgba(16, 185, 129, 0.4)',
                    animation: 'cfdPulseGlow 2.5s infinite ease-in-out'
                  }}
                >
                  <CheckCircle sx={{ fontSize: { xs: 44, sm: 50 }, color: '#FFFFFF' }} />
                </Box>

                <Typography
                  variant="overline"
                  sx={{
                    color: '#059669',
                    letterSpacing: '0.22em',
                    fontWeight: 900,
                    fontSize: { xs: '0.74rem', sm: '0.85rem' },
                    display: 'block'
                  }}
                >
                  SETTLEMENT COMPLETE • DIGITAL RECEIPT GENERATED
                </Typography>

                {/* Animated Customer Name Highlight on Settlement (Custom name if available) */}
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    mt: 0.5,
                    mb: 1,
                    color: '#0F172A',
                    fontSize: { xs: '1.6rem', sm: '2.2rem', md: '2.5rem' },
                    lineHeight: 1.2
                  }}
                >
                  Thank You, {renderPatronName(activeCustomerName || 'Honoured Patron')}!
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: '#64748B',
                    mb: 2.8,
                    maxWidth: 520,
                    mx: 'auto',
                    fontSize: { xs: '0.86rem', sm: '0.95rem' },
                    lineHeight: 1.5
                  }}
                >
                  Your bespoke ensemble is registered. Our master tailors and craftspersons cherish your patronage at {storeName}.
                </Typography>

                {/* Amount Paid & Reward Points Cards matching Box 2 Clean Luxury Style */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.8} sx={{ mb: 2.8 }}>
                  <Box
                    sx={{
                      flex: 1,
                      p: 2.5,
                      borderRadius: 4,
                      bgcolor: '#FFFFFF',
                      border: '1.5px solid rgba(197, 160, 89, 0.3)',
                      boxShadow: '0 8px 25px rgba(180, 140, 75, 0.08)'
                    }}
                  >
                    <Typography variant="overline" sx={{ color: '#64748B', letterSpacing: '0.12em', fontWeight: 800, display: 'block' }}>
                      Settled Tender ({paymentMethod})
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#937230', mt: 0.5, fontSize: { xs: '1.6rem', sm: '1.9rem' } }}>
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800, display: 'block', mt: 0.3 }}>
                      ✓ Payment Verified
                    </Typography>
                  </Box>

                  {/* Highlights Points Earned in Emerald Green */}
                  <Box
                    sx={{
                      flex: 1,
                      p: 2.5,
                      borderRadius: 4,
                      bgcolor: 'rgba(16, 185, 129, 0.08)',
                      border: '1.5px solid rgba(16, 185, 129, 0.35)',
                      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.08)'
                    }}
                  >
                    <Typography variant="overline" sx={{ color: '#047857', letterSpacing: '0.12em', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      ✨ Privilege Rewards Credited
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#059669', mt: 0.5, fontSize: { xs: '1.6rem', sm: '1.9rem' } }}>
                      +{loyaltyPointsEarned} Points
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#047857', fontWeight: 800, display: 'block', mt: 0.3 }}>
                      💎 Added to your Loyalty Account
                    </Typography>
                  </Box>
                </Stack>

                {/* Interactive Customer Feedback & Compliment Section */}
                <Box
                  sx={{
                    p: 2.8,
                    borderRadius: 4,
                    bgcolor: '#FFFFFF',
                    border: '1.5px solid rgba(197, 160, 89, 0.3)',
                    boxShadow: '0 8px 25px rgba(180, 140, 75, 0.06)',
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
                          {loyaltyPoints} Points
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
                  {/* If canvas-runway, or if video load failed, or foreign invalid blob: fallback gracefully to 60FPS Virtual Runway Catwalk Canvas */}
                  {(cfdConfig.videoUrl === 'canvas-runway' || videoLoadError || (cfdConfig.videoUrl === 'firestore-chunked' && !chunkedVideoUrl) || (cfdConfig.videoUrl?.startsWith('blob:') && !chunkedVideoUrl)) ? (
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
                    /* Real Video Player with Explicit Autoplay & Mobile Compliance - Fullscreen */
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
                          borderTop: { xs: '16px solid #000000', md: '35px solid #000000' },
                          borderBottom: { xs: '16px solid #000000', md: '35px solid #000000' }
                        } : {})
                      }}
                    >
                      <video
                        ref={videoRef}
                        src={cfdConfig.videoUrl === 'firestore-chunked' ? chunkedVideoUrl : cfdConfig.videoUrl}
                        autoPlay
                        loop
                        muted={isVideoMuted}
                        playsInline
                        webkit-playsinline="true"
                        x5-playsinline="true"
                        preload="auto"
                        controls={false}
                        onClick={handleToggleVideoSound}
                        onError={() => {
                          console.warn('Video playback error on this device, falling back to 60FPS Virtual Runway Catwalk Canvas');
                          setVideoLoadError(true);
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: cfdConfig.videoFit === 'contain' ? 'contain' : 'cover',
                          display: 'block',
                          cursor: 'pointer'
                        }}
                      />

                      {/* Luxury Floating Sound Toggle Button */}
                      <Button
                        onClick={handleToggleVideoSound}
                        size="small"
                        startIcon={isVideoMuted ? <VolumeOff sx={{ fontSize: 18, color: '#FFFFFF !important' }} /> : <VolumeUp sx={{ fontSize: 18, color: '#FFFFFF !important' }} />}
                        sx={{
                          position: 'absolute',
                          bottom: { xs: 16, sm: 24 },
                          right: { xs: 16, sm: 24 },
                          zIndex: 30,
                          bgcolor: isVideoMuted ? 'rgba(15, 23, 42, 0.85)' : 'rgba(197, 160, 89, 0.95)',
                          color: '#FFFFFF !important',
                          border: '1.5px solid rgba(255, 255, 255, 0.45)',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
                          borderRadius: 3,
                          px: 2,
                          py: 0.8,
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: isVideoMuted ? 'rgba(15, 23, 42, 0.95)' : '#B38E44'
                          }
                        }}
                      >
                        {isVideoMuted ? '🔇 Unmute Video' : '🔊 Sound Active'}
                      </Button>
                    </Box>
                  )}
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
                {/* Left Panel: Itemized Live Bill Stream (Haute Couture Atelier Styling) */}
                <Paper
                  elevation={0}
                  sx={{
                    flex: { xs: 'none', lg: 1.5 },
                    minHeight: { xs: 340, lg: 0 },
                    display: 'flex',
                    flexDirection: 'column',
                    p: { xs: 2.2, sm: 3 },
                    borderRadius: 4,
                    bgcolor: '#FFFFFF',
                    border: '1.5px solid rgba(197, 160, 89, 0.35)',
                    boxShadow: '0 12px 35px rgba(180, 140, 75, 0.08), 0 2px 10px rgba(0, 0, 0, 0.03)'
                  }}
                >
                  {/* Atelier Master Header */}
                  <Box sx={{ pb: 2, mb: 2, borderBottom: '1px solid rgba(197, 160, 89, 0.2)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            bgcolor: 'rgba(197, 160, 89, 0.15)',
                            border: '1.5px solid rgba(197, 160, 89, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#937230'
                          }}
                        >
                          <Diamond sx={{ fontSize: 19 }} />
                        </Box>
                        <Box>
                          <Typography
                            variant="overline"
                            sx={{
                              color: '#937230',
                              letterSpacing: '0.18em',
                              fontWeight: 900,
                              fontSize: '0.74rem',
                              lineHeight: 1
                            }}
                          >
                            ALEEN ATELIER • CURATED ENSEMBLE
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 600, fontSize: '0.7rem' }}>
                            Sub-Millisecond Mirroring • Live Checkout Stream
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981', mr: 0.5 }} />}
                          label={`${items.reduce((sum, it) => sum + (parseInt(it.quantity) || 1), 0)} Pieces`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(16, 185, 129, 0.1)',
                            color: '#059669',
                            fontWeight: 900,
                            fontSize: '0.7rem',
                            height: 24,
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}
                        />
                        <Chip
                          label={`${items.length} ${items.length === 1 ? 'ITEM' : 'ITEMS'}`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(197, 160, 89, 0.15)',
                            color: '#937230',
                            fontWeight: 900,
                            fontSize: '0.68rem',
                            height: 24,
                            border: '1px solid rgba(197, 160, 89, 0.3)'
                          }}
                        />
                      </Stack>
                    </Box>

                    {/* Patron VIP Identification Ribbon */}
                    {activeCustomerName ? (
                      <Box
                        sx={{
                          mt: 1.5,
                          p: 1.5,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.45) 0%, rgba(240, 253, 250, 0.55) 100%)',
                          border: '1px solid rgba(197, 160, 89, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 1.2
                        }}
                      >
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              bgcolor: '#0F766E',
                              color: '#FFFFFF',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              border: '2px solid #C5A059'
                            }}
                          >
                            {activeCustomerName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Stack direction="row" spacing={0.8} alignItems="center">
                              <Typography sx={{ fontWeight: 900, color: '#0F172A', fontSize: '0.96rem' }}>
                                {renderPatronName(activeCustomerName, { fontSize: 'inherit' })}
                              </Typography>
                              <Chip
                                icon={<Stars sx={{ fontSize: '13px !important', color: '#937230 !important' }} />}
                                label={`${customerTier} VIP`}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  fontWeight: 900,
                                  bgcolor: 'rgba(197, 160, 89, 0.2)',
                                  color: '#937230',
                                  border: '1px solid rgba(197, 160, 89, 0.4)'
                                }}
                              />
                            </Stack>
                            {customerPhone && (
                              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                                Patron Account • {customerPhone}
                              </Typography>
                            )}
                          </Box>
                        </Stack>

                        <Box sx={{ bgcolor: '#FFFFFF', px: 1.5, py: 0.6, borderRadius: 2, border: '1px solid rgba(197, 160, 89, 0.25)' }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.62rem', display: 'block', textTransform: 'uppercase' }}>
                            Privilege Balance
                          </Typography>
                          <Typography sx={{ fontWeight: 900, color: '#0F766E', fontSize: '0.88rem' }}>
                            💎 {loyaltyPoints} pts
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          mt: 1.2,
                          px: 1.8,
                          py: 0.8,
                          borderRadius: 2.5,
                          bgcolor: '#FAF8F5',
                          border: '1px dashed rgba(197, 160, 89, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <AutoAwesome sx={{ color: '#C5A059', fontSize: 16 }} />
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.74rem' }}>
                          Honoured Atelier Patron • Items reflect automatically as our master stylers curate your ensemble
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Scanned Items Stream (Bespoke Garment Cards) */}
                  <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
                    <Stack spacing={1.3}>
                      <AnimatePresence initial={false}>
                        {items.map((item, idx) => {
                          const garmentMeta = getGarmentMeta(item.name);
                          const itemPrice = parseFloat(item.price) || 0;
                          const itemQty = parseInt(item.quantity) || 1;
                          const lineTotal = itemPrice * itemQty;
                          const isJustScanned = cfdState?.lastScannedItem && (
                            cfdState.lastScannedItem.name === item.name || cfdState.lastScannedItem.id === item.id
                          );

                          return (
                            <motion.div
                              key={item.id || idx}
                              initial={{ opacity: 0, y: 8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            >
                              <Box
                                sx={{
                                  p: 1.6,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  borderRadius: 3,
                                  bgcolor: isJustScanned ? 'rgba(254, 243, 199, 0.35)' : '#FAF8F5',
                                  border: isJustScanned ? '1.5px solid #D97706' : '1px solid rgba(197, 160, 89, 0.22)',
                                  boxShadow: isJustScanned ? '0 4px 18px rgba(217, 119, 6, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.02)',
                                  transition: 'all 0.25s ease',
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}
                              >
                                {isJustScanned && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      right: 0,
                                      bgcolor: '#D97706',
                                      color: '#FFFFFF',
                                      px: 1,
                                      py: 0.2,
                                      fontSize: '0.62rem',
                                      fontWeight: 900,
                                      letterSpacing: '0.05em',
                                      borderBottomLeftRadius: 6
                                    }}
                                  >
                                    ✦ JUST SCANNED
                                  </Box>
                                )}

                                {/* Garment Icon & Typography */}
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, pr: 2 }}>
                                  <Box
                                    sx={{
                                      width: 44,
                                      height: 44,
                                      borderRadius: 2.5,
                                      bgcolor: '#FFFFFF',
                                      border: '1px solid rgba(197, 160, 89, 0.3)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '1.4rem',
                                      flexShrink: 0,
                                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                                    }}
                                  >
                                    {garmentMeta.icon}
                                  </Box>

                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.3, flexWrap: 'wrap', gap: 0.4 }}>
                                      <Chip
                                        label={garmentMeta.label}
                                        size="small"
                                        sx={{
                                          height: 19,
                                          fontSize: '0.62rem',
                                          bgcolor: 'rgba(15, 118, 110, 0.1)',
                                          color: '#0F766E',
                                          border: '1px solid rgba(15, 118, 110, 0.25)',
                                          fontWeight: 800
                                        }}
                                      />
                                      {item.variantDetails && (
                                        <Chip
                                          label={item.variantDetails}
                                          size="small"
                                          sx={{
                                            height: 19,
                                            fontSize: '0.62rem',
                                            bgcolor: 'rgba(197, 160, 89, 0.12)',
                                            color: '#937230',
                                            border: '1px solid rgba(197, 160, 89, 0.25)',
                                            fontWeight: 700
                                          }}
                                        />
                                      )}
                                    </Stack>

                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        fontWeight: 800,
                                        color: '#0F172A',
                                        fontSize: { xs: '0.94rem', sm: '1.04rem' },
                                        lineHeight: 1.25,
                                        fontFamily: '"Plus Jakarta Sans", sans-serif'
                                      }}
                                    >
                                      {item.name}
                                    </Typography>

                                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, mt: 0.3, display: 'inline-block' }}>
                                      ₹{itemPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })} each
                                    </Typography>
                                  </Box>
                                </Stack>

                                {/* Quantity & Line Total */}
                                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                  <Box
                                    sx={{
                                      display: 'inline-block',
                                      px: 1,
                                      py: 0.25,
                                      borderRadius: 1.5,
                                      bgcolor: '#FFFFFF',
                                      border: '1px solid rgba(197, 160, 89, 0.3)',
                                      mb: 0.4
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 800, fontSize: '0.72rem' }}>
                                      QTY: {itemQty}
                                    </Typography>
                                  </Box>

                                  <Typography
                                    variant="subtitle1"
                                    sx={{
                                      fontWeight: 900,
                                      color: '#937230',
                                      fontSize: { xs: '1.02rem', sm: '1.15rem' },
                                      fontVariantNumeric: 'tabular-nums',
                                      fontFamily: '"JetBrains Mono", monospace'
                                    }}
                                  >
                                    ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </Typography>
                                </Box>
                              </Box>
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
                        mt: 2,
                        p: 1.5,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.18) 100%)',
                        border: '1.5px solid rgba(16, 185, 129, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.08)'
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AutoAwesome sx={{ color: '#059669', fontSize: 18 }} />
                        <Box>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#065F46', lineHeight: 1.2 }}>
                            Valued Patron Privilege Applied
                          </Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: '#047857', fontWeight: 600 }}>
                            Direct couture savings credited to your bespoke invoice
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 900, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                        Saving ₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} today!
                      </Typography>
                    </Box>
                  )}
                </Paper>

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
                      bgcolor: '#FFFFFF',
                      border: '1.5px solid rgba(197, 160, 89, 0.35)',
                      boxShadow: '0 12px 35px rgba(180, 140, 75, 0.08), 0 2px 10px rgba(0, 0, 0, 0.03)'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8 }}>
                      <Box>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <AccountBalanceWallet sx={{ fontSize: 18, color: '#937230' }} />
                          <Typography variant="overline" sx={{ color: '#937230', letterSpacing: '0.18em', fontWeight: 900, fontSize: '0.74rem', lineHeight: 1 }}>
                            ATELIER BILL SUMMARY
                          </Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 600, fontSize: '0.68rem', mt: 0.3 }}>
                          Official Tax & Privilege Statement
                        </Typography>
                      </Box>
                      <Chip
                        icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: isSettled ? '#FFFFFF' : '#10B981', mr: 0.5 }} />}
                        label={isSettled ? "PAID & VERIFIED" : "LIVE TENDER"}
                        size="small"
                        sx={{
                          bgcolor: isSettled ? '#059669' : 'rgba(16, 185, 129, 0.15)',
                          color: isSettled ? '#FFFFFF' : '#059669',
                          border: isSettled ? 'none' : '1px solid rgba(16, 185, 129, 0.35)',
                          fontWeight: 900,
                          fontSize: '0.68rem',
                          height: 24,
                          px: 0.5
                        }}
                      />
                    </Box>

                    <Stack spacing={1.3} sx={{ mt: 1, mb: 2 }}>
                      {/* Gross Subtotal */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                          Gross Atelier Subtotal:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                          ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>

                      {/* GST Statement */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={0.6} alignItems="center" flexWrap="wrap">
                          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                            GST ({taxPercent > 0 ? `${taxPercent}%` : '0%'}):
                          </Typography>
                          {taxPercent > 0 && (
                            <Stack direction="row" spacing={0.5}>
                              <Chip
                                label={`CGST ${(taxPercent / 2).toFixed(1)}%: ₹${(cgst || tax / 2).toFixed(2)}`}
                                size="small"
                                sx={{ height: 18, fontSize: '0.58rem', fontWeight: 700, bgcolor: 'rgba(100, 116, 139, 0.08)' }}
                              />
                              <Chip
                                label={`SGST ${(taxPercent / 2).toFixed(1)}%: ₹${(sgst || tax / 2).toFixed(2)}`}
                                size="small"
                                sx={{ height: 18, fontSize: '0.58rem', fontWeight: 700, bgcolor: 'rgba(100, 116, 139, 0.08)' }}
                              />
                            </Stack>
                          )}
                        </Stack>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                          ₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>

                      {/* Courtesy / General Privilege Discount */}
                      {discount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Stack direction="row" spacing={0.6} alignItems="center">
                            <Typography variant="body2" sx={{ color: '#DC2626', fontWeight: 700 }}>
                              Privilege Discount:
                            </Typography>
                            {percentDiscount > 0 ? (
                              <Chip
                                label={`${percentDiscount}% OFF`}
                                size="small"
                                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}
                              />
                            ) : flatDiscount > 0 ? (
                              <Chip
                                label="Flat Courtesy"
                                size="small"
                                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}
                              />
                            ) : null}
                          </Stack>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                            - ₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )}

                      {/* Loyalty Privilege Redemption */}
                      {(loyaltyDiscount > 0 || loyaltyPointsRedeemed > 0) && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Stack direction="row" spacing={0.6} alignItems="center">
                            <Typography variant="body2" sx={{ color: '#059669', fontWeight: 700 }}>
                              Loyalty Redemption:
                            </Typography>
                            <Chip
                              label={`${loyaltyPointsRedeemed || Math.round(loyaltyDiscount)} pts`}
                              size="small"
                              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}
                            />
                          </Stack>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                            - ₹{loyaltyDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )}

                      {/* Round Off */}
                      {roundOff !== 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                            Round Off:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                            ₹{(roundOff > 0 ? '+' : '') + roundOff.toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    <Divider sx={{ borderColor: 'rgba(197, 160, 89, 0.25)', my: 2 }} />

                    {/* Hero Net Payable Jewel Capsule */}
                    <Box
                      sx={{
                        p: 2.2,
                        borderRadius: 3.5,
                        background: 'linear-gradient(135deg, #FFFDF8 0%, #FAF4E5 100%)',
                        border: '2px solid rgba(197, 160, 89, 0.55)',
                        boxShadow: '0 8px 25px rgba(180, 140, 75, 0.15)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box>
                        <Typography variant="caption" sx={{ color: '#937230', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Diamond sx={{ fontSize: 14 }} /> TOTAL NET PAYABLE
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 900,
                            color: '#8D6A28',
                            fontSize: { xs: '1.9rem', md: '2.3rem' },
                            lineHeight: 1.1,
                            mt: 0.4,
                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                            fontVariantNumeric: 'tabular-nums'
                          }}
                        >
                          ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>

                      <Chip
                        label={isSettled ? "SETTLED" : "DUE"}
                        sx={{
                          bgcolor: isSettled ? '#059669' : '#D97706',
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: '0.82rem',
                          height: 32,
                          px: 1.5,
                          boxShadow: isSettled ? '0 4px 12px rgba(5, 150, 105, 0.3)' : '0 4px 12px rgba(217, 119, 6, 0.3)'
                        }}
                      />
                    </Box>

                    {/* Royal Patron Privilege & Rewards Card */}
                    {activeCustomerName ? (
                      <Box
                        sx={{
                          mt: 2,
                          p: 1.8,
                          borderRadius: 3,
                          bgcolor: '#FAF8F5',
                          border: '1.5px solid rgba(197, 160, 89, 0.4)',
                          boxShadow: '0 4px 15px rgba(180, 140, 75, 0.08)'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                background: tierMeta.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.95rem',
                                border: `1.5px solid ${tierMeta.border}`,
                                color: '#FFFFFF'
                              }}
                            >
                              {tierMeta.icon}
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: '0.82rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>
                                {tierMeta.label}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.65rem' }}>
                                ₹{spendPerPoint}/pt • {tierMultiplier}x Multiplier • Balance: {loyaltyPoints} pts{loyaltyPointsRedeemed > 0 ? ` (${loyaltyPointsRemaining} rem)` : ''}
                              </Typography>
                            </Box>
                          </Stack>

                          <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                              +{loyaltyPointsEarned} pts
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, fontSize: '0.62rem' }}>
                              {isSettled ? 'Accrued & Credited' : 'Accrues on Payment'}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Balance & Progress */}
                        <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed rgba(197, 160, 89, 0.25)' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.68rem' }}>
                              Privilege Milestone • {tierMeta.nextTier}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#937230', fontWeight: 800, fontSize: '0.68rem' }}>
                              {Math.round(tierMeta.progress)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={tierMeta.progress}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'rgba(197, 160, 89, 0.15)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                background: 'linear-gradient(90deg, #C5A059 0%, #0F766E 100%)'
                              }
                            }}
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          mt: 2,
                          p: 1.6,
                          borderRadius: 3,
                          bgcolor: 'rgba(197, 160, 89, 0.08)',
                          border: '1.5px dashed rgba(197, 160, 89, 0.45)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1.5
                        }}
                      >
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: 'rgba(197, 160, 89, 0.2)',
                              border: '1.5px solid rgba(197, 160, 89, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#937230'
                            }}
                          >
                            <WorkspacePremium sx={{ fontSize: 18 }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 900, color: '#937230', lineHeight: 1.2 }}>
                              Join Aleen Privilege Club
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.68rem' }}>
                              Share mobile at billing to earn rewards on this order
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip
                          label={`+${loyaltyPointsEarned} pts`}
                          size="small"
                          sx={{
                            bgcolor: '#059669',
                            color: '#FFFFFF',
                            fontWeight: 900,
                            fontSize: '0.72rem',
                            height: 24
                          }}
                        />
                      </Box>
                    )}
                  </Paper>

                  {/* Dynamic Payment Terminal Card with Tap-to-Zoom */}
                  <Paper
                    elevation={0}
                    sx={{
                      flex: 1,
                      p: 2.8,
                      borderRadius: 4,
                      bgcolor: '#FFFFFF',
                      border: '1.5px solid rgba(197, 160, 89, 0.35)',
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
                        {/* Terminal Header */}
                        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 1.2 }}>
                          <VerifiedUser sx={{ color: '#0F766E', fontSize: 18 }} />
                          <Typography variant="overline" sx={{ color: '#0F766E', fontWeight: 900, letterSpacing: '0.12em', fontSize: '0.7rem' }}>
                            VERIFIED INSTANT UPI CHECKOUT
                          </Typography>
                        </Stack>

                        {/* Store VPA Pill with Copy */}
                        {storeVpa && (
                          <Chip
                            icon={<ContentCopy sx={{ fontSize: '13px !important', color: copiedUpi ? '#059669 !important' : '#937230 !important' }} />}
                            label={copiedUpi ? "UPI ID Copied!" : `UPI: ${storeVpa}`}
                            onClick={handleCopyUpi}
                            size="small"
                            sx={{
                              mb: 1.5,
                              bgcolor: copiedUpi ? 'rgba(16, 185, 129, 0.12)' : 'rgba(197, 160, 89, 0.1)',
                              color: copiedUpi ? '#059669' : '#937230',
                              border: '1px solid rgba(197, 160, 89, 0.3)',
                              fontWeight: 800,
                              fontSize: '0.68rem',
                              cursor: 'pointer'
                            }}
                          />
                        )}

                        {/* Reticle QR Frame */}
                        <Box
                          onClick={() => setQrZoomOpen(true)}
                          sx={{
                            p: 2,
                            borderRadius: 3.5,
                            bgcolor: '#FFFFFF',
                            border: '2px solid rgba(197, 160, 89, 0.5)',
                            boxShadow: '0 8px 30px rgba(180, 140, 75, 0.18)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                            '&:hover': {
                              transform: 'scale(1.04)',
                              borderColor: '#937230',
                              boxShadow: '0 12px 35px rgba(180, 140, 75, 0.28)'
                            }
                          }}
                        >
                          <QRCodeSVG
                            value={upiUrl}
                            size={185}
                            level="M"
                            style={{ display: 'block' }}
                          />
                        </Box>

                        <Chip
                          icon={<ZoomIn sx={{ fontSize: '1.05rem !important', color: '#937230 !important' }} />}
                          label="Tap to Expand Fullscreen QR"
                          onClick={() => setQrZoomOpen(true)}
                          size="small"
                          sx={{
                            mt: 1.5,
                            mb: 1.2,
                            bgcolor: 'rgba(197, 160, 89, 0.12)',
                            color: '#937230',
                            border: '1px solid rgba(197, 160, 89, 0.35)',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'rgba(197, 160, 89, 0.22)' }
                          }}
                        />

                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A', mb: 0.3 }}>
                          Scan to Pay ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Typography>

                        {/* Branded UPI App Badges */}
                        <Stack direction="row" spacing={0.6} flexWrap="wrap" justifyContent="center" sx={{ mt: 0.5, mb: 1.5 }}>
                          {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'Cred'].map((appName) => (
                            <Chip
                              key={appName}
                              label={appName}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                bgcolor: '#F8FAFC',
                                color: '#475569',
                                border: '1px solid #E2E8F0'
                              }}
                            />
                          ))}
                        </Stack>

                        {/* Interactive Experience Rating */}
                        <Box
                          sx={{
                            width: '100%',
                            pt: 1.5,
                            mt: 0.5,
                            borderTop: '1px solid rgba(197, 160, 89, 0.2)'
                          }}
                        >
                          <Stack direction="row" spacing={0.8} justifyContent="center" alignItems="center">
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, fontSize: '0.74rem' }}>
                              Atelier Service:
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
                      <Box sx={{ py: 3, textAlign: 'center', width: '100%' }}>
                        <Box
                          sx={{
                            width: 72,
                            height: 72,
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
                          <Payments sx={{ color: '#937230', fontSize: 36 }} />
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A' }}>
                          Tender Method: {paymentMethod}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748B', mt: 0.8, maxWidth: 300, mx: 'auto', fontWeight: 500, fontSize: '0.85rem' }}>
                          Please proceed with {paymentMethod} settlement at the cashier counter. Your invoice will update instantly upon confirmation.
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

      {/* Responsive Luxury Footer Bar (Pinned at Screen Bottom) */}
      <Box
        sx={{
          flexShrink: 0,
          py: { xs: 0.8, sm: 1.1 },
          px: { xs: 1.5, sm: 3, md: 4 },
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(197, 160, 89, 0.25)',
          bgcolor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          zIndex: 10,
          boxShadow: '0 -2px 10px rgba(180, 140, 75, 0.04)'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: '#475569',
            fontSize: { xs: '0.68rem', sm: '0.78rem' },
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <Box component="span" sx={{ color: '#D97706' }}>✨</Box>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Powered by </Box>
          {storeName} Atelier
          <Box component="span" sx={{ color: '#94A3B8', mx: 0.5 }}>•</Box>
          <Box component="span" sx={{ color: '#059669', fontWeight: 800 }}>Instant Live Sync</Box>
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: '#64748B',
            fontSize: { xs: '0.65rem', sm: '0.74rem' },
            fontWeight: 700,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 0.4
          }}
        >
          🔒 <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Strictly Confidential & </Box>Secure
        </Typography>
      </Box>
    </Box>
  );
}
