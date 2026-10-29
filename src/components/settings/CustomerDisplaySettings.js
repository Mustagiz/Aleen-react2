import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Divider,
  TextField,
  Stack,
  Alert,
  Tooltip,
  IconButton,
  Switch,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab
} from '@mui/material';
import {
  Tv,
  AutoAwesome,
  Videocam,
  TextFields,
  PlayArrow,
  CheckCircle,
  Launch,
  Save,
  Diamond,
  Speed,
  Palette,
  Person,
  Star,
  Celebration,
  AspectRatio,
  CropFree,
  FitScreen,
  Refresh,
  Spa,
  Stars,
  Brush
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useFeedback } from '../../contexts/FeedbackContext';

// Verified, Cross-Origin Safe, Fast-Loading Video Presets
export const VIDEO_PRESETS = [
  {
    id: 'golden-runway',
    label: '✨ Golden Couture Silk Catwalk',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    desc: 'Dramatic golden atelier illumination and fluid couture fashion'
  },
  {
    id: 'atelier-craft',
    label: '✂️ Master Tailor Bespoke Atelier',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    desc: 'Artisanal silk flow and precision craftsmanship cinematic reel'
  },
  {
    id: 'interactive-runway',
    label: '👗 Interactive Virtual Haute Couture Catwalk',
    url: 'canvas-runway',
    desc: 'Built-in 60FPS luxury runway light show and walking couture model silhouette'
  }
];

export const ANIMATION_TYPES = [
  {
    id: 'couture-showcase',
    title: 'Haute Couture Editorial Cards',
    tagline: 'Bridal Heritage, Silk Brocades & Tailoring',
    desc: 'Active rotating collection cards with animated progress line and slide transitions.',
    icon: '👗'
  },
  {
    id: 'fabric-flow',
    title: 'Silken Fabric & Golden Stardust',
    tagline: 'Liquid Silk Wave & Drifting Shimmer',
    desc: 'Continuously undulating pure silk wave with floating golden stardust particles.',
    icon: '✨'
  },
  {
    id: 'golden-mandala',
    title: 'Royal Geometric Gold Mandala',
    tagline: 'Concentric Rotating Zardozi Filigree',
    desc: 'Dual concentric golden mandala rings continuously rotating in opposite directions.',
    icon: '💎'
  },
  {
    id: 'minimalist-aura',
    title: 'Modern Atelier Breathing Aura',
    tagline: 'Expanding Radiant Gold Atmospheric Rings',
    desc: 'Minimalist luxury aesthetic with expanding breathing radiant rings and manifesto.',
    icon: '🏛️'
  }
];

export const TEXT_ANIMATION_STYLES = [
  {
    id: 'marquee-glide',
    title: 'Luxury Marquee Glide',
    desc: 'Continuous smooth gliding ticker tape with diamond separators',
    icon: '↔️'
  },
  {
    id: 'pulse-glow',
    title: 'Shimmering Gold Breathing Glow',
    desc: 'Rhythmic scaling text with intense radiant golden drop-shadow halo',
    icon: '🌟'
  },
  {
    id: 'typewriter-fade',
    title: 'Poetic Word-by-Word Cycle',
    desc: 'Words smoothly fade and slide in sequence in a continuous loop',
    icon: '✍️'
  },
  {
    id: 'waterfall-cascade',
    title: 'Kinetic Cascading Wave',
    desc: 'Liquid undulating bounce wave with metallic reflection',
    icon: '🌊'
  }
];

export const CUSTOMER_ANIMATION_STYLES = [
  {
    id: 'golden-shimmer',
    title: 'Golden Silk Shimmer',
    desc: 'Metallic liquid gold light wave sweeping across the name continuously',
    icon: '✨'
  },
  {
    id: 'bounce-float',
    title: 'Floating VIP Starburst',
    desc: 'Gentle buoyant floating motion with sparkling star burst icons',
    icon: '⭐'
  },
  {
    id: 'pulse-glow',
    title: 'Radiant Golden Aura',
    desc: 'Deep royal gold breathing pulse with expanding luxury halo',
    icon: '🌟'
  },
  {
    id: 'sparkle-pop',
    title: 'Glittering Stardust Pop',
    desc: 'Playful rhythmic scaling with gold stardust reflections',
    icon: '🎉'
  },
  {
    id: 'neon-atelier',
    title: 'Haute Couture Neon Luminescence',
    desc: 'Sleek luxury luminescent boutique neon glow effect',
    icon: '💎'
  }
];

export const DEFAULT_CFD_CONFIG = {
  idleDisplayType: 'animation', // 'animation' | 'video' | 'text'
  animationType: 'couture-showcase',
  videoPreset: 'interactive-runway',
  videoUrl: 'canvas-runway',
  videoFit: 'cover', // 'cover' | 'contain' | 'cinematic'
  customHeadline: 'Welcome to Aleen Clothing Atelier',
  customSubtext: 'Bespoke Bridal Lehengas • Pure Handloom Banarasi Silks • Master Couture Tailoring',
  textAnimationStyle: 'marquee-glide',
  animateCustomerName: true,
  customerAnimationStyle: 'golden-shimmer',
  testCustomerName: 'Mrs. Ayesha Khan',
  welcomeTone: 'luxury', // 'luxury' | 'matrimonial' | 'contemporary'
  themeMode: 'light'
};

export default function CustomerDisplaySettings() {
  const { showToast } = useFeedback();

  // Active Sub-Tab in Settings: 0 = Idle Animations, 1 = Fashion Video, 2 = Animated Text, 3 = Patron VIP Animations
  const [activeSettingsTab, setActiveSettingsTab] = useState(0);

  // Configuration State
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('aleen_cfd_config');
      if (saved) return { ...DEFAULT_CFD_CONFIG, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_CFD_CONFIG;
  });

  const [saving, setSaving] = useState(false);
  const [pingSending, setPingSending] = useState(false);
  const videoRef = useRef(null);

  // Sync with Firestore once on mount (without clobbering active edits)
  useEffect(() => {
    let isInitial = true;
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'cfd_config'), (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data();
          if (isInitial) {
            setConfig((prev) => ({ ...prev, ...remoteData }));
            isInitial = false;
          }
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn('Failed to subscribe to CFD config:', e);
    }
  }, []);

  // Guarantee video plays when element mounts or URL/fit changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [config.videoUrl, config.videoFit, config.idleDisplayType, activeSettingsTab]);

  // Robust update helper: updates React state, localStorage, and broadcasts to CFD in 0ms!
  const updateConfig = (key, value) => {
    setConfig((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem('aleen_cfd_config', JSON.stringify(updated));
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('aleen_customer_display');
          bc.postMessage({ type: 'CONFIG_UPDATE', config: updated });
          bc.close();
        }
      } catch (e) {}
      return updated;
    });
  };

  const updateMultipleConfig = (updates) => {
    setConfig((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem('aleen_cfd_config', JSON.stringify(updated));
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('aleen_customer_display');
          bc.postMessage({ type: 'CONFIG_UPDATE', config: updated });
          bc.close();
        }
      } catch (e) {}
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...config,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'settings', 'cfd_config'), payload, { merge: true });
      localStorage.setItem('aleen_cfd_config', JSON.stringify(payload));

      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('aleen_customer_display');
          bc.postMessage({ type: 'CONFIG_UPDATE', config: payload });
          bc.close();
        }
      } catch (e) {}

      showToast('✨ Customer Display settings saved and live synced across all screens!', 'success');
    } catch (err) {
      console.error('Error saving CFD config:', err);
      showToast('Failed to save settings: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestPing = async () => {
    setPingSending(true);
    try {
      const pingPayload = {
        testPing: Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(doc(db, 'cfd_live_sessions', 'primary'), pingPayload, { merge: true });

      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('aleen_customer_display');
          bc.postMessage({ type: 'PING' });
          bc.close();
        }
      } catch (e) {}

      showToast('✨ Live test ping broadcasted to Customer Screen!', 'success');
    } catch (e) {
      showToast('Failed to send test ping: ' + e.message, 'error');
    } finally {
      setTimeout(() => setPingSending(false), 800);
    }
  };

  const handleLaunchDisplay = () => {
    window.open('/customer-display', 'AleenCustomerDisplay', 'width=1280,height=800,menubar=no,toolbar=no');
  };

  return (
    <Box sx={{ width: '100%', py: 1 }}>
      {/* Explicit Global CSS Keyframes for guaranteed cross-browser smooth animations */}
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
          50% { transform: scaleY(1.18) translateY(-6px); }
        }
        @keyframes cfdRunwayLight {
          0%, 100% { opacity: 0.3; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>

      {/* Top Header Card with Quick Actions */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%)',
          border: '1.5px solid rgba(197, 160, 89, 0.35)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2
        }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #C5A059 0%, #937230 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(197, 160, 89, 0.4)'
              }}
            >
              <Tv />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>
                Customer Display Terminal (CFD) Controls
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                Haute Couture Light Theme • 0ms Instant Dual-Screen Sync • Interactive Animations
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            size="small"
            onClick={handleSendTestPing}
            disabled={pingSending}
            startIcon={<Speed />}
            sx={{
              borderRadius: 2.5,
              fontWeight: 800,
              textTransform: 'none',
              borderColor: 'rgba(197, 160, 89, 0.5)',
              color: '#937230',
              '&:hover': { borderColor: '#937230', bgcolor: 'rgba(197, 160, 89, 0.08)' }
            }}
          >
            {pingSending ? 'Pinging...' : 'Test Ping Screen'}
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={handleLaunchDisplay}
            startIcon={<Launch />}
            sx={{
              borderRadius: 2.5,
              fontWeight: 800,
              textTransform: 'none',
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': { bgcolor: 'primary.lighter' }
            }}
          >
            Launch Customer Screen ↗
          </Button>

          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
            disabled={saving}
            startIcon={<Save />}
            sx={{
              borderRadius: 2.5,
              fontWeight: 900,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #C5A059 0%, #937230 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(197, 160, 89, 0.35)',
              '&:hover': { background: 'linear-gradient(135deg, #B38E44 0%, #826227 100%)' }
            }}
          >
            {saving ? 'Saving...' : 'Save & Sync to Screen'}
          </Button>
        </Stack>
      </Paper>

      {/* Main Grid: Controls on Left, Live Simulator on Right */}
      <Grid container spacing={3}>
        {/* Left Column: Interactive Controls */}
        <Grid item xs={12} lg={7}>
          {/* NAVIGATION TABS FOR CFD SETTINGS */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3.5,
              border: '1.5px solid rgba(197, 160, 89, 0.28)',
              bgcolor: '#FFFFFF',
              mb: 3,
              overflow: 'hidden'
            }}
          >
            <Tabs
              value={activeSettingsTab}
              onChange={(e, val) => {
                setActiveSettingsTab(val);
                if (val === 0) updateConfig('idleDisplayType', 'animation');
                if (val === 1) updateConfig('idleDisplayType', 'video');
                if (val === 2) updateConfig('idleDisplayType', 'text');
              }}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 1,
                bgcolor: '#FAF8F5',
                borderBottom: '1px solid rgba(197, 160, 89, 0.2)',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  py: 1.8,
                  color: '#64748B',
                  '&.Mui-selected': { color: '#937230' }
                },
                '& .MuiTabs-indicator': {
                  bgcolor: '#937230',
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              <Tab icon={<AutoAwesome fontSize="small" />} iconPosition="start" label="1. Couture Animations" />
              <Tab icon={<Videocam fontSize="small" />} iconPosition="start" label="2. Fashion Video" />
              <Tab icon={<TextFields fontSize="small" />} iconPosition="start" label="3. Animated Text" />
              <Tab icon={<Person fontSize="small" />} iconPosition="start" label="4. Patron VIP Name" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* TAB 0: HAUTE COUTURE ANIMATIONS (4 TYPES) */}
              {activeSettingsTab === 0 && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A' }}>
                        Haute Couture Idle Animations
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        Select which luxury animated experience patrons see during idle:
                      </Typography>
                    </Box>
                    <Chip
                      label={config.idleDisplayType === 'animation' ? 'Active on Screen' : 'Set as Idle Mode'}
                      clickable
                      onClick={() => updateConfig('idleDisplayType', 'animation')}
                      size="small"
                      sx={{
                        bgcolor: config.idleDisplayType === 'animation' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.06)',
                        color: config.idleDisplayType === 'animation' ? '#059669' : '#64748B',
                        fontWeight: 800
                      }}
                    />
                  </Stack>

                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    {ANIMATION_TYPES.map((anim) => {
                      const isSelected = config.animationType === anim.id;
                      return (
                        <Grid item xs={12} sm={6} key={anim.id}>
                          <Box
                            onClick={() => {
                              updateMultipleConfig({
                                animationType: anim.id,
                                idleDisplayType: 'animation'
                              });
                            }}
                            sx={{
                              p: 2.2,
                              borderRadius: 3,
                              border: '2px solid',
                              borderColor: isSelected ? '#C5A059' : 'rgba(0,0,0,0.08)',
                              bgcolor: isSelected ? 'rgba(197, 160, 89, 0.08)' : '#FAF8F5',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: isSelected ? '0 6px 18px rgba(197, 160, 89, 0.2)' : 'none',
                              '&:hover': {
                                borderColor: '#C5A059',
                                bgcolor: 'rgba(197, 160, 89, 0.06)'
                              }
                            }}
                          >
                            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.8 }}>
                              <Typography sx={{ fontSize: '1.4rem' }}>{anim.icon}</Typography>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: isSelected ? '#937230' : '#0F172A' }}>
                                  {anim.title}
                                </Typography>
                              </Box>
                              {isSelected && <CheckCircle sx={{ color: '#937230', fontSize: 20 }} />}
                            </Stack>
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1, lineHeight: 1.35 }}>
                              {anim.desc}
                            </Typography>
                            <Chip
                              label={anim.tagline}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                bgcolor: isSelected ? '#FFFFFF' : 'rgba(0,0,0,0.05)',
                                color: isSelected ? '#937230' : '#475569',
                                border: '1px solid rgba(197, 160, 89, 0.3)'
                              }}
                            />
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

              {/* TAB 1: FASHION VIDEO & VIDEO FRAMING */}
              {activeSettingsTab === 1 && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A' }}>
                        Haute Couture Runway Video & Framing
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        Play high-definition couture video or use the built-in virtual luxury runway:
                      </Typography>
                    </Box>
                    <Chip
                      label={config.idleDisplayType === 'video' ? 'Active on Screen' : 'Set as Idle Mode'}
                      clickable
                      onClick={() => updateConfig('idleDisplayType', 'video')}
                      size="small"
                      sx={{
                        bgcolor: config.idleDisplayType === 'video' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.06)',
                        color: config.idleDisplayType === 'video' ? '#059669' : '#64748B',
                        fontWeight: 800
                      }}
                    />
                  </Stack>

                  {/* Video Preset Selector */}
                  <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                    <InputLabel>Video Source Preset</InputLabel>
                    <Select
                      value={config.videoPreset || 'interactive-runway'}
                      label="Video Source Preset"
                      onChange={(e) => {
                        const val = e.target.value;
                        const preset = VIDEO_PRESETS.find((p) => p.id === val);
                        updateMultipleConfig({
                          videoPreset: val,
                          videoUrl: preset ? preset.url : config.videoUrl,
                          idleDisplayType: 'video'
                        });
                      }}
                    >
                      {VIDEO_PRESETS.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.label}
                        </MenuItem>
                      ))}
                      <MenuItem value="custom">🔗 Paste Custom Direct Video URL (.mp4 / .webm)</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Custom URL Input */}
                  {config.videoPreset === 'custom' && (
                    <TextField
                      fullWidth
                      size="small"
                      label="Direct Video URL (.mp4 or .webm)"
                      placeholder="https://example.com/aleen-couture-runway.mp4"
                      value={config.videoUrl}
                      onChange={(e) => updateConfig('videoUrl', e.target.value)}
                      helperText="Paste direct link to your own fashion video reel. Plays silently on continuous loop."
                      sx={{ mb: 2.5 }}
                    />
                  )}

                  {/* Video Framing Control (Cover, Contain, Cinematic) */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: '#FAF8F5',
                      border: '1.5px solid rgba(197, 160, 89, 0.3)',
                      mb: 2
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A', mb: 0.5 }}>
                      Video Framing & Screen Ratio:
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                      Select how the video frames on the customer display terminal:
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box
                          onClick={() => updateConfig('videoFit', 'cover')}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: '2px solid',
                            borderColor: config.videoFit === 'cover' ? '#C5A059' : 'rgba(0,0,0,0.08)',
                            bgcolor: config.videoFit === 'cover' ? '#FFFFFF' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'center',
                            boxShadow: config.videoFit === 'cover' ? '0 4px 12px rgba(197, 160, 89, 0.2)' : 'none'
                          }}
                        >
                          <CropFree sx={{ color: config.videoFit === 'cover' ? '#937230' : '#64748B', fontSize: 28 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 0.5, color: config.videoFit === 'cover' ? '#937230' : '#0F172A' }}>
                            Full Bleed Cover
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Fills the entire screen edge-to-edge
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Box
                          onClick={() => updateConfig('videoFit', 'contain')}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: '2px solid',
                            borderColor: config.videoFit === 'contain' ? '#C5A059' : 'rgba(0,0,0,0.08)',
                            bgcolor: config.videoFit === 'contain' ? '#FFFFFF' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'center',
                            boxShadow: config.videoFit === 'contain' ? '0 4px 12px rgba(197, 160, 89, 0.2)' : 'none'
                          }}
                        >
                          <FitScreen sx={{ color: config.videoFit === 'contain' ? '#937230' : '#64748B', fontSize: 28 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 0.5, color: config.videoFit === 'contain' ? '#937230' : '#0F172A' }}>
                            Contain / Letterbox
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Fits whole video with gold borders
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Box
                          onClick={() => updateConfig('videoFit', 'cinematic')}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: '2px solid',
                            borderColor: config.videoFit === 'cinematic' ? '#C5A059' : 'rgba(0,0,0,0.08)',
                            bgcolor: config.videoFit === 'cinematic' ? '#FFFFFF' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'center',
                            boxShadow: config.videoFit === 'cinematic' ? '0 4px 12px rgba(197, 160, 89, 0.2)' : 'none'
                          }}
                        >
                          <AspectRatio sx={{ color: config.videoFit === 'cinematic' ? '#937230' : '#64748B', fontSize: 28 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 0.5, color: config.videoFit === 'cinematic' ? '#937230' : '#0F172A' }}>
                            Cinematic 21:9
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Ultra-wide luxury cinema scope
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              )}

              {/* TAB 2: ANIMATED TEXT & MARQUEE */}
              {activeSettingsTab === 2 && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A' }}>
                        Custom Animated Announcement & Marquee
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        Type your announcement and select an eye-catching text animation style:
                      </Typography>
                    </Box>
                    <Chip
                      label={config.idleDisplayType === 'text' ? 'Active on Screen' : 'Set as Idle Mode'}
                      clickable
                      onClick={() => updateConfig('idleDisplayType', 'text')}
                      size="small"
                      sx={{
                        bgcolor: config.idleDisplayType === 'text' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.06)',
                        color: config.idleDisplayType === 'text' ? '#059669' : '#64748B',
                        fontWeight: 800
                      }}
                    />
                  </Stack>

                  <TextField
                    fullWidth
                    size="small"
                    label="Primary Headline Text"
                    value={config.customHeadline || ''}
                    onChange={(e) => updateConfig('customHeadline', e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Secondary Subtitle / Marquee Announcement"
                    value={config.customSubtext || ''}
                    onChange={(e) => updateConfig('customSubtext', e.target.value)}
                    sx={{ mb: 2.5 }}
                  />

                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A', mb: 1 }}>
                    Choose Text Animation Style:
                  </Typography>

                  <Grid container spacing={1.5}>
                    {TEXT_ANIMATION_STYLES.map((tStyle) => {
                      const isSelected = config.textAnimationStyle === tStyle.id;
                      return (
                        <Grid item xs={12} sm={6} key={tStyle.id}>
                          <Box
                            onClick={() => {
                              updateMultipleConfig({
                                textAnimationStyle: tStyle.id,
                                idleDisplayType: 'text'
                              });
                            }}
                            sx={{
                              p: 2,
                              borderRadius: 2.5,
                              border: '2px solid',
                              borderColor: isSelected ? '#C5A059' : 'rgba(0,0,0,0.08)',
                              bgcolor: isSelected ? 'rgba(197, 160, 89, 0.08)' : '#FAF8F5',
                              cursor: 'pointer',
                              boxShadow: isSelected ? '0 4px 14px rgba(197, 160, 89, 0.2)' : 'none'
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Typography sx={{ fontSize: '1.2rem' }}>{tStyle.icon}</Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: isSelected ? '#937230' : '#0F172A' }}>
                                {tStyle.title}
                              </Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              {tStyle.desc}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

              {/* TAB 3: PATRON VIP NAME ANIMATIONS */}
              {activeSettingsTab === 3 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A', mb: 0.5 }}>
                    Patron VIP Recognition & Name Animation Styles
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5 }}>
                    Delight valued patrons (like Mrs. Ayesha Khan) with captivating animated name entrances:
                  </Typography>

                  {/* Toggle Switch */}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ p: 2, bgcolor: '#FAF8F5', borderRadius: 2.5, border: '1px solid rgba(197, 160, 89, 0.25)', mb: 2.5 }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A' }}>
                        Animate Patron Name & Golden Starburst
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Enables dynamic animated text effects when customer name is chosen
                      </Typography>
                    </Box>
                    <Switch
                      checked={config.animateCustomerName !== false}
                      onChange={(e) => updateConfig('animateCustomerName', e.target.checked)}
                      color="primary"
                    />
                  </Stack>

                  {/* Test Customer Name Field */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Test Patron Name for Live Preview"
                    value={config.testCustomerName || 'Mrs. Ayesha Khan'}
                    onChange={(e) => updateConfig('testCustomerName', e.target.value)}
                    helperText="Type any patron name here to test the live animation preview on the right"
                    sx={{ mb: 2.5 }}
                  />

                  {/* Selectable Name Animation Styles */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A', mb: 1.5 }}>
                    Select Patron Name Animation Effect:
                  </Typography>

                  <Grid container spacing={1.5}>
                    {CUSTOMER_ANIMATION_STYLES.map((cStyle) => {
                      const isSelected = (config.customerAnimationStyle || 'golden-shimmer') === cStyle.id;
                      return (
                        <Grid item xs={12} sm={6} key={cStyle.id}>
                          <Box
                            onClick={() => updateConfig('customerAnimationStyle', cStyle.id)}
                            sx={{
                              p: 2,
                              borderRadius: 2.5,
                              border: '2px solid',
                              borderColor: isSelected ? '#C5A059' : 'rgba(0,0,0,0.08)',
                              bgcolor: isSelected ? 'rgba(197, 160, 89, 0.08)' : '#FAF8F5',
                              cursor: 'pointer',
                              boxShadow: isSelected ? '0 4px 14px rgba(197, 160, 89, 0.2)' : 'none'
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Typography sx={{ fontSize: '1.2rem' }}>{cStyle.icon}</Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: isSelected ? '#937230' : '#0F172A' }}>
                                {cStyle.title}
                              </Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              {cStyle.desc}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Live Responsive Simulator Preview */}
        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3.5,
              border: '1.5px solid rgba(197, 160, 89, 0.35)',
              bgcolor: '#FFFFFF',
              boxShadow: '0 10px 30px rgba(197, 160, 89, 0.12)',
              position: 'sticky',
              top: 24
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Diamond sx={{ color: '#C5A059', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A' }}>
                  Live Terminal Simulator
                </Typography>
              </Stack>
              <Chip
                label={`Mode: ${config.idleDisplayType.toUpperCase()}`}
                size="small"
                sx={{ bgcolor: 'rgba(197, 160, 89, 0.15)', color: '#937230', fontWeight: 800, fontSize: '0.7rem' }}
              />
            </Stack>

            {/* Simulated iPad / Customer Screen Frame */}
            <Box
              sx={{
                width: '100%',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1.5px solid rgba(197, 160, 89, 0.35)',
                background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F1E8 100%)',
                color: '#1E293B',
                boxShadow: '0 12px 35px rgba(180, 140, 75, 0.1)',
                minHeight: 440,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Screen Top Bar */}
              <Box
                sx={{
                  px: 2,
                  py: 1.2,
                  borderBottom: '1px solid rgba(197, 160, 89, 0.25)',
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #C5A059 0%, #937230 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF'
                    }}
                  >
                    <Diamond sx={{ fontSize: 16 }} />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '0.78rem' }}>
                    ALEEN CLOTHING
                  </Typography>
                </Stack>
                <Chip
                  label="Instant Live ✓"
                  size="small"
                  sx={{ height: 20, fontSize: '0.62rem', bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontWeight: 800 }}
                />
              </Box>

              {/* Dynamic Center Simulation Content */}
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                {/* 1. SIMULATE ACTIVE CUSTOMER NAME ANIMATION */}
                {config.animateCustomerName && (
                  <Box
                    sx={{
                      width: '100%',
                      mb: 2,
                      p: 1.8,
                      borderRadius: 3,
                      bgcolor: '#FFFFFF',
                      border: '1.5px solid rgba(197, 160, 89, 0.35)',
                      boxShadow: '0 4px 14px rgba(197, 160, 89, 0.1)'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#937230', fontWeight: 900, letterSpacing: '0.12em', display: 'block', mb: 0.5 }}>
                      ✨ HONOURED ATELIER PATRON
                    </Typography>

                    {/* DYNAMIC ANIMATED CUSTOMER NAME */}
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        fontWeight: 900,
                        fontSize: '1.35rem',
                        lineHeight: 1.2,
                        ...(config.customerAnimationStyle === 'golden-shimmer' && {
                          background: 'linear-gradient(90deg, #937230 0%, #D97706 25%, #FDE047 50%, #D97706 75%, #937230 100%)',
                          backgroundSize: '200% auto',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          animation: 'cfdShimmer 2.2s linear infinite'
                        }),
                        ...(config.customerAnimationStyle === 'bounce-float' && {
                          color: '#0F172A',
                          animation: 'cfdBounceFloat 1.8s ease-in-out infinite'
                        }),
                        ...(config.customerAnimationStyle === 'pulse-glow' && {
                          color: '#937230',
                          animation: 'cfdPulseGlow 2s ease-in-out infinite'
                        }),
                        ...(config.customerAnimationStyle === 'sparkle-pop' && {
                          color: '#B45309',
                          animation: 'cfdSparklePop 2.4s ease-in-out infinite'
                        }),
                        ...(config.customerAnimationStyle === 'neon-atelier' && {
                          color: '#937230',
                          animation: 'cfdNeonGlow 2s ease-in-out infinite'
                        })
                      }}
                    >
                      ✨ {config.testCustomerName || 'Mrs. Ayesha Khan'} 💎
                    </Box>

                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5, fontSize: '0.68rem', fontWeight: 600 }}>
                      Style: <strong>{CUSTOMER_ANIMATION_STYLES.find(c => c.id === config.customerAnimationStyle)?.title || 'Golden Silk Shimmer'}</strong>
                    </Typography>
                  </Box>
                )}

                {/* 2. SIMULATE IDLE DISPLAY: FASHION VIDEO */}
                {config.idleDisplayType === 'video' && (
                  <Box sx={{ width: '100%' }}>
                    {config.videoUrl === 'canvas-runway' ? (
                      /* Virtual Runway Catwalk Canvas Animation */
                      <Box
                        sx={{
                          width: '100%',
                          height: 200,
                          borderRadius: 2.5,
                          overflow: 'hidden',
                          border: '1.5px solid rgba(197, 160, 89, 0.4)',
                          background: 'radial-gradient(circle at 50% 30%, #2A2215 0%, #0A0805 100%)',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF'
                        }}
                      >
                        {/* Animated Catwalk Lighting Pillars */}
                        <Box sx={{ position: 'absolute', top: 0, left: '20%', width: 2, height: '100%', bgcolor: 'rgba(197, 160, 89, 0.5)', animation: 'cfdRunwayLight 2s infinite ease-in-out' }} />
                        <Box sx={{ position: 'absolute', top: 0, right: '20%', width: 2, height: '100%', bgcolor: 'rgba(197, 160, 89, 0.5)', animation: 'cfdRunwayLight 2s infinite ease-in-out 1s' }} />

                        {/* Walking Couture Silhouette */}
                        <motion.div
                          animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                        >
                          <Typography sx={{ fontSize: 46 }}>💃</Typography>
                        </motion.div>

                        <Typography variant="overline" sx={{ color: '#FCD34D', letterSpacing: '0.2em', fontWeight: 900, mt: 1 }}>
                          HAUTE COUTURE CATWALK
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          Framing: <strong>{config.videoFit.toUpperCase()}</strong>
                        </Typography>
                      </Box>
                    ) : (
                      /* Real Video Player with explicit framing & autoplay */
                      <Box
                        sx={{
                          width: '100%',
                          height: config.videoFit === 'cinematic' ? 160 : 200,
                          borderRadius: 2.5,
                          overflow: 'hidden',
                          border: config.videoFit === 'contain' ? '3px solid #C5A059' : '1.5px solid rgba(197, 160, 89, 0.4)',
                          bgcolor: '#000000',
                          position: 'relative'
                        }}
                      >
                        <video
                          ref={videoRef}
                          src={config.videoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: config.videoFit === 'contain' ? 'contain' : 'cover',
                            display: 'block'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 6,
                            left: 8,
                            bgcolor: 'rgba(0,0,0,0.75)',
                            color: '#FCD34D',
                            px: 1,
                            py: 0.3,
                            borderRadius: 1,
                            fontSize: '0.62rem',
                            fontWeight: 800
                          }}
                        >
                          Framing: {config.videoFit.toUpperCase()}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                {/* 3. SIMULATE IDLE DISPLAY: ANIMATED TEXT */}
                {config.idleDisplayType === 'text' && (
                  <Box
                    sx={{
                      p: 2.5,
                      width: '100%',
                      borderRadius: 3,
                      bgcolor: '#FFFFFF',
                      border: '1.5px solid rgba(197, 160, 89, 0.35)',
                      boxShadow: '0 8px 24px rgba(197, 160, 89, 0.1)'
                    }}
                  >
                    <Box sx={{ width: 44, height: 44, mx: 'auto', mb: 1.5, borderRadius: '50%', background: 'linear-gradient(135deg, #C5A059 0%, #937230 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                      <AutoAwesome fontSize="small" />
                    </Box>

                    {/* Headline with Chosen Animation */}
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 900,
                        mb: 1,
                        lineHeight: 1.3,
                        color: '#0F172A',
                        ...(config.textAnimationStyle === 'pulse-glow' && {
                          animation: 'cfdPulseGlow 2s infinite ease-in-out'
                        }),
                        ...(config.textAnimationStyle === 'marquee-glide' && {
                          color: '#937230'
                        })
                      }}
                    >
                      {config.customHeadline || 'Welcome to Aleen Clothing Atelier'}
                    </Typography>

                    {/* Smooth Continuous Gliding Marquee Ticker */}
                    {config.textAnimationStyle === 'marquee-glide' ? (
                      <Box
                        sx={{
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          width: '100%',
                          py: 1,
                          my: 1,
                          bgcolor: '#FAF8F5',
                          borderRadius: 2,
                          border: '1px solid rgba(197, 160, 89, 0.3)'
                        }}
                      >
                        <Box
                          component={motion.div}
                          animate={{ x: ['0%', '-50%'] }}
                          transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                          sx={{ display: 'inline-flex', gap: 2 }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#937230' }}>
                            💎 {config.customSubtext || 'Handcrafted Silks • Bespoke Bridal Lehengas • Master Fitting'}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            ✨ Pure Handloom Banarasi & Royal Chanderi
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#937230' }}>
                            💎 {config.customSubtext || 'Handcrafted Silks • Bespoke Bridal Lehengas • Master Fitting'}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5, lineHeight: 1.4 }}>
                        {config.customSubtext || 'Bespoke Bridal Lehengas & Handcrafted Silks'}
                      </Typography>
                    )}

                    <Chip
                      label={`Animation: ${config.textAnimationStyle || 'marquee-glide'}`}
                      size="small"
                      sx={{ height: 22, fontSize: '0.68rem', fontWeight: 800, bgcolor: 'rgba(197, 160, 89, 0.15)', color: '#937230' }}
                    />
                  </Box>
                )}

                {/* 4. SIMULATE IDLE DISPLAY: COUTURE ANIMATIONS (4 DYNAMIC TYPES) */}
                {config.idleDisplayType === 'animation' && (
                  <Box
                    sx={{
                      p: 2.5,
                      width: '100%',
                      borderRadius: 3,
                      bgcolor: '#FFFFFF',
                      border: '1.5px solid rgba(197, 160, 89, 0.35)',
                      boxShadow: '0 8px 24px rgba(197, 160, 89, 0.1)'
                    }}
                  >
                    {/* SUB-TYPE: MANDALA (Concentric Rotating Rings) */}
                    {config.animationType === 'golden-mandala' && (
                      <Box sx={{ py: 2, position: 'relative' }}>
                        <Box
                          sx={{
                            width: 100,
                            height: 100,
                            mx: 'auto',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              border: '2px dashed #C5A059',
                              animation: 'cfdRotateSlow 16s linear infinite'
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              width: '74%',
                              height: '74%',
                              borderRadius: '50%',
                              border: '1.5px solid #937230',
                              animation: 'cfdRotateReverseSlow 10s linear infinite'
                            }}
                          />
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #C5A059 0%, #937230 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFF',
                              animation: 'cfdPulseGlow 2.5s infinite ease-in-out'
                            }}
                          >
                            <Diamond sx={{ fontSize: 24 }} />
                          </Box>
                        </Box>
                        <Typography variant="overline" sx={{ color: '#937230', fontWeight: 900, display: 'block', mt: 1.5 }}>
                          ROTATING GOLD MANDALA
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Continuous dual concentric rotation in opposite directions
                        </Typography>
                      </Box>
                    )}

                    {/* SUB-TYPE: SILK FABRIC FLOW */}
                    {config.animationType === 'fabric-flow' && (
                      <Box sx={{ py: 2 }}>
                        <Box
                          sx={{
                            width: 90,
                            height: 90,
                            mx: 'auto',
                            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
                            background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.4) 0%, rgba(217, 119, 6, 0.3) 100%)',
                            border: '1.5px solid #C5A059',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'cfdWaveUndulate 3s infinite ease-in-out'
                          }}
                        >
                          <Spa sx={{ fontSize: 44, color: '#937230' }} />
                        </Box>
                        <Typography variant="overline" sx={{ color: '#937230', fontWeight: 900, display: 'block', mt: 1.5 }}>
                          FLOWING MULBERRY SILK
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Organic undulating silk waves with floating shimmer
                        </Typography>
                      </Box>
                    )}

                    {/* SUB-TYPE: MINIMALIST AURA */}
                    {config.animationType === 'minimalist-aura' && (
                      <Box sx={{ py: 2 }}>
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            mx: 'auto',
                            borderRadius: '50%',
                            bgcolor: 'rgba(197, 160, 89, 0.15)',
                            border: '2px solid #C5A059',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'cfdPulseGlow 2.5s infinite ease-in-out'
                          }}
                        >
                          <Diamond sx={{ fontSize: 38, color: '#937230' }} />
                        </Box>
                        <Typography variant="overline" sx={{ color: '#937230', fontWeight: 900, display: 'block', mt: 1.5 }}>
                          PARISIAN ATELIER AURA
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Expanding atmospheric golden light rings
                        </Typography>
                      </Box>
                    )}

                    {/* SUB-TYPE: EDITORIAL COUTURE CAROUSEL */}
                    {config.animationType === 'couture-showcase' && (
                      <Box sx={{ py: 1 }}>
                        <motion.div
                          animate={{ y: [0, -6, 0] }}
                          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                        >
                          <Box sx={{ width: 64, height: 64, mx: 'auto', mb: 1, borderRadius: 3, background: 'linear-gradient(135deg, #C5A059 0%, #937230 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                            <Diamond sx={{ fontSize: 32 }} />
                          </Box>
                        </motion.div>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A' }}>
                          Bridal Heritage & Silk Lehengas
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#937230', fontWeight: 800, display: 'block', mb: 1 }}>
                          HAUTE COUTURE EMBELLISHMENTS
                        </Typography>
                        {/* Animated Loading Bar */}
                        <Box sx={{ width: '80%', height: 4, borderRadius: 2, bgcolor: 'rgba(197, 160, 89, 0.2)', mx: 'auto', overflow: 'hidden' }}>
                          <Box component={motion.div} animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }} sx={{ width: '50%', height: '100%', bgcolor: '#937230' }} />
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              {/* Screen Footer */}
              <Box sx={{ px: 2, py: 1, borderTop: '1px solid rgba(197, 160, 89, 0.2)', bgcolor: 'rgba(255, 255, 255, 0.95)', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>
                  Aleen Atelier Dual-Screen Synchronized Display
                </Typography>
              </Box>
            </Box>

            <Alert severity="success" sx={{ mt: 2, borderRadius: 2.5, fontSize: '0.78rem', fontWeight: 700 }}>
              Live 0ms updates: Changing tabs or animation options immediately previews in this simulator and sends to any open customer screen!
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
