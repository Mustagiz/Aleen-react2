import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Card,
  CardActionArea,
  CardContent,
  Divider,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Stack,
  Alert,
  Tooltip,
  IconButton,
  Switch,
  MenuItem,
  Select,
  FormControl,
  InputLabel
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
  Brush,
  Speed,
  Palette,
  MotionPhotosAuto,
  Sparkles,
  Star,
  Celebration
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useFeedback } from '../../contexts/FeedbackContext';

// Default Curated Fashion Video Presets
export const VIDEO_PRESETS = [
  {
    id: 'golden-runway',
    label: 'Golden Couture Silk Runway',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-golden-dress-41551-large.mp4',
    desc: 'Golden evening gown runway catwalk with dramatic atelier lighting'
  },
  {
    id: 'tailor-craft',
    label: 'Master Tailor Atelier Craftsmanship',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-tailor-working-with-cloth-42861-large.mp4',
    desc: 'Artisanal tailor precision measuring, cutting and sewing luxury fabric'
  },
  {
    id: 'bridal-embroidery',
    label: 'Embroidered Royal Bridal Silks',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-showing-an-embroidered-dress-41549-large.mp4',
    desc: 'Intricate zardozi embroidery and flowing handloom bridal ensemble'
  }
];

export const ANIMATION_TYPES = [
  {
    id: 'couture-showcase',
    title: 'Haute Couture Editorial Cards',
    tagline: 'Bridal Heritage, Silk Brocades & Tailoring',
    desc: 'Cycles through curated atelier collection cards with smooth slide transitions and highlight tags.',
    icon: '👗'
  },
  {
    id: 'fabric-flow',
    title: 'Silken Fabric & Golden Shimmer',
    tagline: 'Organic Wave & Drifting Gold Dust',
    desc: 'Liquid silk waves undulating softly across the screen with floating stardust particles.',
    icon: '✨'
  },
  {
    id: 'golden-mandala',
    title: 'Royal Geometric Gold Mandala',
    tagline: 'Zardozi Heritage Sacred Geometry',
    desc: 'Hypnotic rotating golden filigree rings and royal atelier emblem with gentle pulse.',
    icon: '💎'
  },
  {
    id: 'minimalist-aura',
    title: 'Modern Atelier Breathing Aura',
    tagline: 'Clean Parisian Typography & Brand Manifesto',
    desc: 'Minimalist haute couture aesthetic with soft champagne breathing aura and brand credo.',
    icon: '🏛️'
  }
];

export const TEXT_ANIMATION_STYLES = [
  {
    id: 'marquee-glide',
    title: 'Luxury Marquee Glide',
    desc: 'Continuous smooth gliding ticker tape with golden separators',
    icon: '↔️'
  },
  {
    id: 'typewriter-fade',
    title: 'Poetic Word-by-Word Reveal',
    desc: 'Words smoothly fade and slide in with haute couture elegance',
    icon: '✍️'
  },
  {
    id: 'pulse-glow',
    title: 'Shimmering Gold Breathing Glow',
    desc: 'Rich metallic gold gradient typography with rhythmic glowing pulse',
    icon: '🌟'
  },
  {
    id: 'waterfall-cascade',
    title: 'Kinetic Cascading Shine',
    desc: 'Light beam wipes across the letters with shimmering metallic reflection',
    icon: '🌊'
  }
];

export const DEFAULT_CFD_CONFIG = {
  idleDisplayType: 'animation', // 'animation' | 'video' | 'text'
  animationType: 'couture-showcase',
  videoPreset: 'golden-runway',
  videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-golden-dress-41551-large.mp4',
  videoFit: 'cover',
  customHeadline: 'Welcome to Aleen Clothing Atelier',
  customSubtext: 'Bespoke Bridal Lehengas • Pure Handloom Banarasi Silks • Master Couture Tailoring',
  textAnimationStyle: 'marquee-glide',
  animateCustomerName: true,
  welcomeTone: 'luxury', // 'luxury' | 'matrimonial' | 'contemporary'
  themeMode: 'light' // CFD is now strictly light theme
};

export default function CustomerDisplaySettings() {
  const { showToast } = useFeedback();
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('aleen_cfd_config');
      if (saved) return { ...DEFAULT_CFD_CONFIG, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_CFD_CONFIG;
  });

  const [saving, setSaving] = useState(false);
  const [pingSending, setPingSending] = useState(false);

  // Subscribe to real-time Firestore config
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'cfd_config'), (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data();
          setConfig(prev => ({ ...prev, ...remoteData }));
          try {
            localStorage.setItem('aleen_cfd_config', JSON.stringify({ ...config, ...remoteData }));
          } catch (e) {}
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn('Failed to subscribe to CFD config:', e);
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...config,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'settings', 'cfd_config'), payload, { merge: true });
      localStorage.setItem('aleen_cfd_config', JSON.stringify(payload));

      // Broadcast to any open Customer Display window
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('aleen_customer_display');
          bc.postMessage({ type: 'CONFIG_UPDATE', config: payload });
          bc.close();
        }
      } catch (e) {}

      showToast('Customer Display settings updated live across all screens!', 'success');
    } catch (err) {
      console.error('Error saving CFD config:', err);
      showToast('Failed to save settings to cloud: ' + err.message, 'error');
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

      showToast('Live test ping broadcasted to Customer Screen!', 'success');
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
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%)',
          border: '1px solid rgba(197, 160, 89, 0.28)',
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
                width: 42,
                height: 42,
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
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                Customer Display Terminal (CFD) Settings
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Haute Couture Light Theme • 0ms Instant Dual-Screen Sync • Cloud Mirroring for iPads
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
              fontWeight: 700,
              textTransform: 'none',
              borderColor: 'rgba(197, 160, 89, 0.5)',
              color: '#937230',
              '&:hover': { borderColor: '#937230', bgcolor: 'rgba(197, 160, 89, 0.08)' }
            }}
          >
            {pingSending ? 'Broadcasting...' : 'Test Ping Screen'}
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={handleLaunchDisplay}
            startIcon={<Launch />}
            sx={{
              borderRadius: 2.5,
              fontWeight: 700,
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
              fontWeight: 800,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #C5A059 0%, #937230 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(197, 160, 89, 0.35)',
              '&:hover': { background: 'linear-gradient(135deg, #B38E44 0%, #826227 100%)' }
            }}
          >
            {saving ? 'Saving...' : 'Save CFD Settings'}
          </Button>
        </Stack>
      </Paper>

      {/* Main Grid: Options & Live Preview */}
      <Grid container spacing={3}>
        {/* Left Column: Configuration Controls (7 Cols) */}
        <Grid item xs={12} lg={7}>
          {/* SECTION 1: IDLE SCREEN MEDIA MODE */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
              1. Idle Screen Experience
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
              Choose what honoured patrons see when no active billing cart is currently being scanned:
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Option A: Animations */}
              <Grid item xs={12} sm={4}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: config.idleDisplayType === 'animation' ? '#C5A059' : 'divider',
                    bgcolor: config.idleDisplayType === 'animation' ? 'rgba(197, 160, 89, 0.06)' : 'background.paper',
                    transition: 'all 0.2s ease',
                    height: '100%'
                  }}
                >
                  <CardActionArea
                    onClick={() => setConfig({ ...config, idleDisplayType: 'animation' })}
                    sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <Stack direction="row" justifyContent="space-between" width="100%" sx={{ mb: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2.5,
                          bgcolor: 'rgba(197, 160, 89, 0.15)',
                          color: '#937230',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <AutoAwesome fontSize="small" />
                      </Box>
                      <Radio
                        checked={config.idleDisplayType === 'animation'}
                        size="small"
                        sx={{ p: 0, color: '#C5A059', '&.Mui-checked': { color: '#C5A059' } }}
                      />
                    </Stack>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                      Couture Animation
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
                      Pick from 4 handcrafted luxury animations (silks, mandalas, cards, aura)
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>

              {/* Option B: Video */}
              <Grid item xs={12} sm={4}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: config.idleDisplayType === 'video' ? '#C5A059' : 'divider',
                    bgcolor: config.idleDisplayType === 'video' ? 'rgba(197, 160, 89, 0.06)' : 'background.paper',
                    transition: 'all 0.2s ease',
                    height: '100%'
                  }}
                >
                  <CardActionArea
                    onClick={() => setConfig({ ...config, idleDisplayType: 'video' })}
                    sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <Stack direction="row" justifyContent="space-between" width="100%" sx={{ mb: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2.5,
                          bgcolor: 'rgba(59, 130, 246, 0.15)',
                          color: '#2563EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Videocam fontSize="small" />
                      </Box>
                      <Radio
                        checked={config.idleDisplayType === 'video'}
                        size="small"
                        sx={{ p: 0, color: '#C5A059', '&.Mui-checked': { color: '#C5A059' } }}
                      />
                    </Stack>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                      Fashion Video
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
                      Play high-definition couture video or paste your own custom store video URL
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>

              {/* Option C: Animated Text */}
              <Grid item xs={12} sm={4}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: config.idleDisplayType === 'text' ? '#C5A059' : 'divider',
                    bgcolor: config.idleDisplayType === 'text' ? 'rgba(197, 160, 89, 0.06)' : 'background.paper',
                    transition: 'all 0.2s ease',
                    height: '100%'
                  }}
                >
                  <CardActionArea
                    onClick={() => setConfig({ ...config, idleDisplayType: 'text' })}
                    sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <Stack direction="row" justifyContent="space-between" width="100%" sx={{ mb: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2.5,
                          bgcolor: 'rgba(16, 185, 129, 0.15)',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <TextFields fontSize="small" />
                      </Box>
                      <Radio
                        checked={config.idleDisplayType === 'text'}
                        size="small"
                        sx={{ p: 0, color: '#C5A059', '&.Mui-checked': { color: '#C5A059' } }}
                      />
                    </Stack>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                      Animated Text
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
                      Type your custom headline & announcement with choice of text animations
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>

            {/* SUB-SECTION A: ANIMATION OPTIONS */}
            {config.idleDisplayType === 'animation' && (
              <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.5 }}>
                  Select Animation Style (3-4 Curated Atelier Themes):
                </Typography>
                <Grid container spacing={1.5}>
                  {ANIMATION_TYPES.map((anim) => {
                    const isSelected = config.animationType === anim.id;
                    return (
                      <Grid item xs={12} sm={6} key={anim.id}>
                        <Paper
                          elevation={0}
                          onClick={() => setConfig({ ...config, animationType: anim.id })}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: '1.5px solid',
                            borderColor: isSelected ? '#C5A059' : 'divider',
                            bgcolor: isSelected ? '#FFFFFF' : 'background.paper',
                            boxShadow: isSelected ? '0 4px 14px rgba(197, 160, 89, 0.18)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': { borderColor: '#C5A059' }
                          }}
                        >
                          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography sx={{ fontSize: '1.2rem' }}>{anim.icon}</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isSelected ? '#937230' : 'text.primary' }}>
                              {anim.title}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                            {anim.desc}
                          </Typography>
                          <Chip
                            label={anim.tagline}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: isSelected ? 'rgba(197, 160, 89, 0.15)' : 'rgba(0,0,0,0.04)',
                              color: isSelected ? '#937230' : 'text.secondary'
                            }}
                          />
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {/* SUB-SECTION B: VIDEO OPTIONS */}
            {config.idleDisplayType === 'video' && (
              <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.5 }}>
                  Configure Haute Couture Video:
                </Typography>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Curated Video Preset</InputLabel>
                  <Select
                    value={config.videoPreset || 'golden-runway'}
                    label="Curated Video Preset"
                    onChange={(e) => {
                      const selected = VIDEO_PRESETS.find(p => p.id === e.target.value);
                      setConfig({
                        ...config,
                        videoPreset: e.target.value,
                        videoUrl: selected ? selected.url : config.videoUrl
                      });
                    }}
                  >
                    {VIDEO_PRESETS.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.label}
                      </MenuItem>
                    ))}
                    <MenuItem value="custom">Paste Custom Store Video URL (MP4 / WebM)</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Direct Video URL (.mp4 or .webm)"
                  placeholder="https://example.com/aleen-couture-reel.mp4"
                  value={config.videoUrl}
                  onChange={(e) => setConfig({ ...config, videoUrl: e.target.value, videoPreset: 'custom' })}
                  helperText="Provide direct link to any MP4 or WebM video file. It plays silently on continuous loop."
                  sx={{ mb: 2 }}
                />

                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    Video Framing Fit:
                  </Typography>
                  <Chip
                    label="Cover Screen (Fill)"
                    clickable
                    size="small"
                    onClick={() => setConfig({ ...config, videoFit: 'cover' })}
                    sx={{
                      bgcolor: config.videoFit === 'cover' ? 'primary.main' : 'default',
                      color: config.videoFit === 'cover' ? '#FFF' : 'text.secondary',
                      fontWeight: 700
                    }}
                  />
                  <Chip
                    label="Contain (Fit Whole Video)"
                    clickable
                    size="small"
                    onClick={() => setConfig({ ...config, videoFit: 'contain' })}
                    sx={{
                      bgcolor: config.videoFit === 'contain' ? 'primary.main' : 'default',
                      color: config.videoFit === 'contain' ? '#FFF' : 'text.secondary',
                      fontWeight: 700
                    }}
                  />
                </Stack>
              </Box>
            )}

            {/* SUB-SECTION C: ANIMATED TEXT OPTIONS */}
            {config.idleDisplayType === 'text' && (
              <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.5 }}>
                  Custom Animated Announcement & Marquee Text:
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  label="Primary Headline Text"
                  placeholder="e.g. Welcome to Aleen Clothing Atelier"
                  value={config.customHeadline}
                  onChange={(e) => setConfig({ ...config, customHeadline: e.target.value })}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Secondary Subtitle / Marquee Announcement"
                  placeholder="e.g. Unveiling Festive Bridal Lehengas & Handcrafted Silks"
                  value={config.customSubtext}
                  onChange={(e) => setConfig({ ...config, customSubtext: e.target.value })}
                  sx={{ mb: 2.5 }}
                />

                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                  Choose Text Animation Style:
                </Typography>

                <Grid container spacing={1.5}>
                  {TEXT_ANIMATION_STYLES.map((tStyle) => {
                    const isSelected = config.textAnimationStyle === tStyle.id;
                    return (
                      <Grid item xs={12} sm={6} key={tStyle.id}>
                        <Paper
                          elevation={0}
                          onClick={() => setConfig({ ...config, textAnimationStyle: tStyle.id })}
                          sx={{
                            p: 1.8,
                            borderRadius: 2.5,
                            border: '1.5px solid',
                            borderColor: isSelected ? '#C5A059' : 'divider',
                            bgcolor: isSelected ? '#FFFFFF' : 'background.paper',
                            boxShadow: isSelected ? '0 4px 14px rgba(197, 160, 89, 0.18)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': { borderColor: '#C5A059' }
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography>{tStyle.icon}</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isSelected ? '#937230' : 'text.primary' }}>
                              {tStyle.title}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {tStyle.desc}
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
          </Paper>

          {/* SECTION 2: CUSTOMER VIP ANIMATED HIGHLIGHT */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
              2. Patron VIP Recognition & Animations
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Make customers feel pampered and appreciated the instant they are chosen at the counter:
            </Typography>

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2.5, mb: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  Animate Patron Name & Golden Starburst
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Highlights the customer name with a shimmering gold gradient and animated entrance banner
                </Typography>
              </Box>
              <Switch
                checked={config.animateCustomerName !== false}
                onChange={(e) => setConfig({ ...config, animateCustomerName: e.target.checked })}
                color="primary"
              />
            </Stack>

            <FormControl fullWidth size="small">
              <InputLabel>Welcome Tone & Greeting Style</InputLabel>
              <Select
                value={config.welcomeTone || 'luxury'}
                label="Welcome Tone & Greeting Style"
                onChange={(e) => setConfig({ ...config, welcomeTone: e.target.value })}
              >
                <MenuItem value="luxury">Haute Couture Atelier (✨ Honoured Atelier Patron)</MenuItem>
                <MenuItem value="matrimonial">Royal Matrimonial & Festive (👑 Matrimonial Royalty)</MenuItem>
                <MenuItem value="contemporary">Contemporary Chic Studio (💎 Valued VIP Patron)</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* Right Column: Live Screen Simulation Preview (5 Cols) */}
        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3.5,
              border: '1px solid rgba(197, 160, 89, 0.3)',
              bgcolor: '#FFFFFF',
              boxShadow: '0 10px 30px rgba(197, 160, 89, 0.1)',
              position: 'sticky',
              top: 24
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Diamond sx={{ color: '#C5A059', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B' }}>
                  Live Customer Screen Preview
                </Typography>
              </Stack>
              <Chip
                label="Light Theme Active"
                size="small"
                sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontWeight: 700, fontSize: '0.7rem' }}
              />
            </Stack>

            {/* Simulated iPad / Customer Screen Frame */}
            <Box
              sx={{
                width: '100%',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid rgba(197, 160, 89, 0.3)',
                background: 'linear-gradient(135deg, #FAF8F5 0%, #F5F1E8 100%)',
                color: '#1E293B',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.03)',
                minHeight: 380,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Screen Top Bar */}
              <Box
                sx={{
                  px: 2,
                  py: 1.2,
                  borderBottom: '1px solid rgba(197, 160, 89, 0.2)',
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #C5A059 0%, #937230 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF'
                    }}
                  >
                    <Diamond sx={{ fontSize: 14 }} />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E293B', fontSize: '0.75rem' }}>
                    ALEEN CLOTHING
                  </Typography>
                </Stack>
                <Chip
                  label="Instant Live ✓"
                  size="small"
                  sx={{ height: 20, fontSize: '0.62rem', bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontWeight: 800 }}
                />
              </Box>

              {/* Animated Screen Center Content */}
              <Box
                sx={{
                  flex: 1,
                  p: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                {/* PREVIEW: VIDEO MODE */}
                {config.idleDisplayType === 'video' && (
                  <Box sx={{ width: '100%', borderRadius: 2.5, overflow: 'hidden', border: '1px solid rgba(197, 160, 89, 0.25)', bgcolor: '#000' }}>
                    {config.videoUrl ? (
                      <video
                        src={config.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{
                          width: '100%',
                          height: 180,
                          objectFit: config.videoFit || 'cover',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <Box sx={{ p: 4, color: '#FFF' }}>
                        <Typography variant="caption">Enter video URL to preview</Typography>
                      </Box>
                    )}
                    <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderTop: '1px solid rgba(197, 160, 89, 0.2)' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#937230', display: 'block' }}>
                        ALEEN COUTURE RUNWAY
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
                        Bespoke Silks & Bridal Mastercraft
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* PREVIEW: ANIMATED TEXT MODE */}
                {config.idleDisplayType === 'text' && (
                  <Box
                    sx={{
                      p: 2.5,
                      width: '100%',
                      borderRadius: 3,
                      bgcolor: '#FFFFFF',
                      border: '1px solid rgba(197, 160, 89, 0.3)',
                      boxShadow: '0 8px 24px rgba(197, 160, 89, 0.08)'
                    }}
                  >
                    <Box sx={{ width: 40, height: 40, mx: 'auto', mb: 1.5, borderRadius: '50%', bgcolor: 'rgba(197, 160, 89, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AutoAwesome sx={{ color: '#937230', fontSize: 20 }} />
                    </Box>

                    {/* Headline with Chosen Animation */}
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 900,
                        mb: 1,
                        lineHeight: 1.3,
                        background: 'linear-gradient(90deg, #937230 0%, #D97706 50%, #937230 100%)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: config.textAnimationStyle === 'pulse-glow' ? 'pulse 2s infinite ease-in-out' : 'shimmer 3s linear infinite'
                      }}
                    >
                      {config.customHeadline || 'Welcome to Aleen Clothing Atelier'}
                    </Typography>

                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5, lineHeight: 1.4 }}>
                      {config.customSubtext || 'Bespoke Bridal Lehengas & Handcrafted Silks'}
                    </Typography>

                    <Chip
                      label={`Animation: ${config.textAnimationStyle || 'marquee-glide'}`}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(197, 160, 89, 0.15)', color: '#937230' }}
                    />
                  </Box>
                )}

                {/* PREVIEW: ANIMATION MODE */}
                {config.idleDisplayType === 'animation' && (
                  <Box
                    sx={{
                      p: 2.5,
                      width: '100%',
                      borderRadius: 3,
                      bgcolor: '#FFFFFF',
                      border: '1px solid rgba(197, 160, 89, 0.3)',
                      boxShadow: '0 8px 24px rgba(197, 160, 89, 0.08)'
                    }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Box sx={{ width: 48, height: 48, mx: 'auto', mb: 1.5, borderRadius: '50%', background: 'linear-gradient(135deg, #C5A059 0%, #937230 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                        <Diamond sx={{ fontSize: 26 }} />
                      </Box>
                    </motion.div>

                    <Typography variant="overline" sx={{ color: '#937230', fontWeight: 800, letterSpacing: '0.15em', fontSize: '0.68rem' }}>
                      ALEEN ATELIER COUTURE
                    </Typography>

                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#1E293B', mb: 0.5 }}>
                      {ANIMATION_TYPES.find(a => a.id === config.animationType)?.title || 'Editorial Collection'}
                    </Typography>

                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                      {ANIMATION_TYPES.find(a => a.id === config.animationType)?.tagline}
                    </Typography>

                    <Stack direction="row" spacing={0.8} justifyContent="center">
                      <Chip label="Pure Silks" size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(197, 160, 89, 0.12)', color: '#937230', fontWeight: 700 }} />
                      <Chip label="Bespoke Fit" size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(197, 160, 89, 0.12)', color: '#937230', fontWeight: 700 }} />
                    </Stack>
                  </Box>
                )}

                {/* Simulated Customer VIP Entrance Badge */}
                {config.animateCustomerName && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      width: '100%',
                      borderRadius: 2.5,
                      bgcolor: 'rgba(197, 160, 89, 0.08)',
                      border: '1px dashed rgba(197, 160, 89, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.2
                    }}
                  >
                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#937230', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem' }}>
                      AK
                    </Box>
                    <Box sx={{ textAlign: 'left', flex: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#937230', display: 'block', fontSize: '0.72rem' }}>
                        ✨ Welcome, Mrs. Ayesha Khan
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
                        Honoured Platinum Patron • VIP Measurements on File
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Screen Footer */}
              <Box sx={{ px: 2, py: 1, borderTop: '1px solid rgba(197, 160, 89, 0.15)', bgcolor: 'rgba(255, 255, 255, 0.9)', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#94A3B8' }}>
                  Touch-Enabled Interactive Customer Terminal • Aleen CRM Sync
                </Typography>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mt: 2, borderRadius: 2.5, fontSize: '0.78rem' }}>
              Changes saved here apply immediately to any active Customer Display terminal over real-time Firebase & local BroadcastChannel.
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
