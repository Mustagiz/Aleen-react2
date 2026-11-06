import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Switch,
  Checkbox,
  Radio,
  LinearProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Icons using clean inline SVG helpers matching Tabler/Lucide in Mandate
const SvgIcon = ({ d, size = 18, color = 'currentColor', fill = 'none', strokeWidth = 2, sx = {} }) => (
  <Box
    component="svg"
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    sx={{ width: size, height: size, flexShrink: 0, display: 'inline-block', ...sx }}
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </Box>
);

const Icons = {
  Eye: (props) => <SvgIcon d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z" {...props} />,
  FileText: (props) => <SvgIcon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" {...props} />,
  Cloud: (props) => <SvgIcon d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" {...props} />,
  Sparkles: (props) => <SvgIcon d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" {...props} />,
  Check: (props) => <SvgIcon d="M20 6L9 17l-5-5" {...props} />,
  Shield: (props) => <SvgIcon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...props} />,
  ArrowRight: (props) => <SvgIcon d="M5 12h14 M12 5l7 7-7 7" {...props} />,
  ArrowLeft: (props) => <SvgIcon d="M19 12H5 M12 19l-7-7 7-7" {...props} />,
  Clock: (props) => <SvgIcon d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2" {...props} />,
  CheckCircle: (props) => <SvgIcon d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" {...props} />,
  Mail: (props) => <SvgIcon d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" {...props} />,
  Send: (props) => <SvgIcon d="M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z" {...props} />,
  Play: (props) => <SvgIcon d="M5 3l14 9-14 9V3z" fill="currentColor" {...props} />,
  RotateCcw: (props) => <SvgIcon d="M1 4v6h6 M3.51 15a9 9 0 1 0 2.13-9.36L1 10" {...props} />
};

export default function MandateDiscoveryFlow({ onNavigateVendor }) {
  // Navigation states: 'discovery' | 'wizard' | 'success'
  const [screen, setScreen] = useState('discovery');
  const [wizardStep, setWizardStep] = useState(1);
  const [isPlayingTour, setIsPlayingTour] = useState(false);
  const [tourTime, setTourTime] = useState(0);

  // Discovery interactive state
  const [activeTab, setActiveTab] = useState('discovery'); // 'directory' | 'discovery'
  const [hoveredWeek, setHoveredWeek] = useState(null);

  // Wizard form state
  const [formData, setFormData] = useState({
    legalName: 'Glimpse Labs Ltd',
    tradingName: 'Glimpse Notes',
    website: 'glimpsenotes.com',
    country: 'Ireland',
    category: 'AI meeting notes',
    regNumber: 'IE 712448',
    securityContact: 'security@glimpsenotes.com',
    companySize: '51 to 200 people',
    description: 'Records video meetings, writes transcripts and summaries, and adds action items to the calendar.',
    owner: 'Lea Moreau',
    spend: '9,800',
    usersCount: '41',
    plannedUsers: '60',
    impact: 'low', // 'low' | 'medium' | 'high'
    personalData: true,
    employeeData: true,
    confidentialData: true,
    paymentData: false,
    healthData: false,
    modelProvider: 'Azure OpenAI',
    trainsOnData: 'No, contractually opted out',
    retention: '90 days',
    humanReview: 'No, fully automated',
    featureSummaries: true,
    featureActions: true,
    featureDeals: false,
    selectedTier: 2, // 1 | 2 | 3
    questionnaire: 'standard_ai', // 'light' | 'standard_ai' | 'full'
    docSoc2: true,
    docDpa: true,
    docAiModel: true,
    docPenTest: true,
    docBcp: false,
    sendEmailAfterReview: true
  });

  // Animated risk score
  const targetScore = useMemo(() => {
    if (wizardStep === 1) return 23;
    if (wizardStep === 2) return 42;
    if (wizardStep === 3) return 54;
    if (wizardStep === 4) return 61;
    if (wizardStep === 5) return 66;
    if (wizardStep >= 6) return 66;
    return 0;
  }, [wizardStep]);

  const [displayScore, setDisplayScore] = useState(23);

  // Smooth integer counter interpolation
  useEffect(() => {
    let start = displayScore;
    let end = targetScore;
    if (start === end) return;
    let duration = 600;
    let startTime = performance.now();

    const animateNumber = (currentTime) => {
      let elapsed = currentTime - startTime;
      let progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      let ease = 1 - Math.pow(1 - progress, 3);
      let currentVal = Math.round(start + (end - start) * ease);
      setDisplayScore(currentVal);
      if (progress < 1) {
        requestAnimationFrame(animateNumber);
      }
    };
    requestAnimationFrame(animateNumber);
  }, [targetScore]);

  // Intake completion counter
  const intakeFilled = useMemo(() => {
    return Math.min(14 + (wizardStep - 1) * 2, 31);
  }, [wizardStep]);

  // Video Tour Auto-Play Script (28.7s reproduction from frame-index.csv)
  useEffect(() => {
    if (!isPlayingTour) return;
    const interval = setInterval(() => {
      setTourTime((prev) => {
        const next = prev + 0.25;
        if (next >= 28.7) {
          setIsPlayingTour(false);
          setScreen('discovery');
          return 0;
        }

        // Timeline events mapped to frame-index.csv
        if (next < 6.4) {
          setScreen('discovery');
        } else if (next >= 6.4 && next < 9.7) {
          setScreen('wizard');
          setWizardStep(1);
        } else if (next >= 9.7 && next < 10.8) {
          setWizardStep(2);
        } else if (next >= 10.8 && next < 12.0) {
          setWizardStep(3);
        } else if (next >= 12.0 && next < 14.5) {
          setWizardStep(4);
        } else if (next >= 14.5 && next < 16.7) {
          setWizardStep(5);
        } else if (next >= 16.7 && next < 17.7) {
          setWizardStep(6);
        } else if (next >= 17.7 && next < 18.8) {
          setWizardStep(7);
        } else if (next >= 18.8 && next < 19.7) {
          setWizardStep(8);
        } else if (next >= 19.7 && next < 22.3) {
          setWizardStep(9);
        } else if (next >= 22.3 && next < 26.3) {
          setScreen('success');
        } else if (next >= 26.3) {
          setScreen('discovery');
        }

        return next;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isPlayingTour]);

  const handleStartReview = () => {
    setScreen('wizard');
    setWizardStep(1);
  };

  const handleLaunchVendor = () => {
    setScreen('success');
  };

  const handleReturnDiscovery = () => {
    setScreen('discovery');
    setWizardStep(1);
  };

  // Sparkline generator SVG
  const renderSparkline = (data, color = '#66707B', fill = 'rgba(102, 112, 123, 0.08)') => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 240;
    const height = 44;
    const points = data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - min) / range) * (height - 8) - 4;
        return `${x},${y}`;
      })
      .join(' ');

    const areaPath = `M0,${height} L${points} L${width},${height} Z`;

    return (
      <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: '100%', height: 44, overflow: 'visible' }}>
        <path d={areaPath} fill={fill} />
        <polyline fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', position: 'relative', pb: 4 }}>
      {/* Scripted Video Tour Status Bar */}
      <Box
        sx={{
          mb: 2.5,
          p: 1.25,
          px: 2,
          borderRadius: '9999px',
          bgcolor: '#080F1C',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          boxShadow: '0 4px 16px rgba(8, 15, 28, 0.2)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: isPlayingTour ? '#22C55E' : '#6F4CED',
              boxShadow: `0 0 8px ${isPlayingTour ? '#22C55E' : '#6F4CED'}`
            }}
          />
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.01em' }}>
            {isPlayingTour
              ? `Video Reenactment Active · ${tourTime.toFixed(1)}s / 28.8s (Frame ${Math.round(tourTime * 30)})`
              : 'Mandate Discovery & Vendor Onboarding Flow (Interactive Spec)'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            onClick={() => {
              if (isPlayingTour) {
                setIsPlayingTour(false);
              } else {
                setTourTime(0);
                setIsPlayingTour(true);
              }
            }}
            sx={{
              bgcolor: isPlayingTour ? '#EF4444' : '#6F4CED',
              color: '#FFFFFF',
              borderRadius: '9999px',
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              px: 1.75,
              py: 0.4,
              '&:hover': { bgcolor: isPlayingTour ? '#DC2626' : '#5B3BD4' }
            }}
          >
            {isPlayingTour ? 'Pause Tour' : '▶ Play 28.7s Video Tour'}
          </Button>

          <Button
            size="small"
            onClick={handleReturnDiscovery}
            sx={{
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '0.75rem',
              textTransform: 'none',
              px: 1.25,
              '&:hover': { color: '#FFFFFF' }
            }}
          >
            Reset to Start
          </Button>
        </Box>
      </Box>

      {/* Main Flow Views */}
      <AnimatePresence mode="wait">
        {screen === 'discovery' && (
          <motion.div
            key="discovery"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Discovery Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography sx={{ fontSize: '1.9rem', fontWeight: 550, color: '#161922', letterSpacing: '-0.025em', mb: 0.4 }}>
                  Discovery
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#66707B', fontWeight: 400 }}>
                  Intake Agent scans Okta, Google Workspace and AWS billing every day at 07:00
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75, mt: 1.75 }}>
                  <Box
                    onClick={() => setActiveTab('directory')}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      bgcolor: activeTab === 'directory' ? '#080F1C' : '#FFFFFF',
                      color: activeTab === 'directory' ? '#FFFFFF' : '#66707B',
                      border: '1px solid rgba(225, 228, 234, 0.9)'
                    }}
                  >
                    Directory 412
                  </Box>
                  <Box
                    onClick={() => setActiveTab('discovery')}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      bgcolor: activeTab === 'discovery' ? '#080F1C' : '#FFFFFF',
                      color: activeTab === 'discovery' ? '#FFFFFF' : '#66707B',
                      border: '1px solid rgba(225, 228, 234, 0.9)'
                    }}
                  >
                    Discovery 3
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  sx={{
                    borderRadius: '9999px',
                    border: '1px solid #E1E4EA',
                    bgcolor: '#FFFFFF',
                    color: '#161922',
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    px: 1.75,
                    py: 0.6,
                    '&:hover': { bgcolor: '#F8F9FA' }
                  }}
                >
                  Scan settings
                </Button>
                <Button
                  sx={{
                    borderRadius: '9999px',
                    border: '1px solid #E1E4EA',
                    bgcolor: '#FFFFFF',
                    color: '#6F4CED',
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    px: 1.75,
                    py: 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    '&:hover': { bgcolor: '#F5F3FF' }
                  }}
                >
                  <Icons.Sparkles size={14} color="#6F4CED" /> Scan now
                </Button>
              </Box>
            </Box>

            {/* Dark Intake Summary Banner */}
            <Box
              sx={{
                bgcolor: '#080F1C',
                color: '#FFFFFF',
                borderRadius: '18px',
                p: { xs: 2.5, md: 3 },
                mb: 3.5,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' },
                gap: 3,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6F4CED' }} />
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: '#969DA7', textTransform: 'uppercase' }}>
                    INTAKE AGENT · LAST SCAN TODAY AT 07:00
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: '1.45rem', fontWeight: 550, letterSpacing: '-0.02em', mb: 0.75 }}>
                  3 new apps found this week
                </Typography>
                <Typography sx={{ fontSize: '0.825rem', color: '#969DA7', maxWidth: 520, lineHeight: 1.5, mb: 2 }}>
                  Two AI tools are in use without a review. Kestrel Cloud also added two AWS accounts while its exit plan is open.
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {[
                    { label: 'Okta', count: '188 apps' },
                    { label: 'Google Workspace', count: '96 apps' },
                    { label: 'AWS billing', count: '14 accounts' }
                  ].map((s) => (
                    <Box
                      key={s.label}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.4,
                        py: 0.45,
                        borderRadius: '9999px',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.72rem'
                      }}
                    >
                      <Typography sx={{ color: '#FAFCFA', fontWeight: 600 }}>{s.label},</Typography>
                      <Typography sx={{ color: '#969DA7' }}>{s.count}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Discrete Bar Chart: Apps Found Per Week */}
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: { lg: '1px solid rgba(255, 255, 255, 0.1)' }, pl: { lg: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: '#969DA7', textTransform: 'uppercase' }}>
                    APPS FOUND PER WEEK
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '0.7rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: '#6F4CED' }} />
                      <Typography sx={{ fontSize: '0.7rem', color: '#969DA7' }}>This week</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: '#333D4B' }} />
                      <Typography sx={{ fontSize: '0.7rem', color: '#969DA7' }}>Earlier</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Bars */}
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 72, mb: 1.5, position: 'relative' }}>
                  {[
                    { week: 'Jul 20', count: 1, isCurrent: false },
                    { week: 'Aug 03', count: 0, isCurrent: false },
                    { week: 'Aug 10', count: 2, isCurrent: false },
                    { week: 'Aug 24', count: 3, isCurrent: false },
                    { week: 'Aug 31', count: 1, isCurrent: false },
                    { week: 'Sep 28', count: 5, isCurrent: false, tooltip: true },
                    { week: 'Now', count: 3, isCurrent: true }
                  ].map((b, idx) => (
                    <Box
                      key={idx}
                      onMouseEnter={() => setHoveredWeek(b)}
                      onMouseLeave={() => setHoveredWeek(null)}
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5,
                        cursor: 'pointer'
                      }}
                    >
                      <Typography sx={{ fontSize: '0.65rem', color: '#66707B' }}>{b.count || ''}</Typography>
                      <Box
                        sx={{
                          width: '100%',
                          height: b.count ? b.count * 10 : 2,
                          bgcolor: b.isCurrent ? '#6F4CED' : '#333D4B',
                          borderRadius: '3px 3px 0 0',
                          transition: 'all 0.2s ease',
                          '&:hover': { bgcolor: '#8E72F3' }
                        }}
                      />
                      <Typography sx={{ fontSize: '0.6rem', color: '#66707B', whiteSpace: 'nowrap' }}>
                        {b.week}
                      </Typography>
                    </Box>
                  ))}

                  {/* Interactive Tooltip matching the video reference */}
                  {hoveredWeek && hoveredWeek.tooltip && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -12,
                        right: 48,
                        bgcolor: '#FAFCFA',
                        color: '#161922',
                        borderRadius: '10px',
                        p: 1.25,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                        border: '1px solid #E1E4EA',
                        zIndex: 10,
                        minWidth: 150
                      }}
                    >
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#66707B', textTransform: 'uppercase', mb: 0.5 }}>
                        WEEK OF 28 SEP
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600 }}>5 apps found</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#66707B' }}>
                        <span>Became vendors</span>
                        <span style={{ fontWeight: 600, color: '#161922' }}>2</span>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#66707B' }}>
                        <span>Allowed or blocked</span>
                        <span style={{ fontWeight: 600, color: '#161922' }}>3</span>
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Sub metrics */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  {[
                    { num: '21', text: 'found since July' },
                    { num: '6', text: 'became vendors' },
                    { num: '9', text: 'allowed after review' },
                    { num: '6', text: 'blocked in Okta' }
                  ].map((m, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#FAFCFA' }}>{m.num}</Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#969DA7' }}>{m.text}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Three App Discovery Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
              {/* Card 1: Glimpse Notes */}
              <Box
                sx={{
                  bgcolor: '#FAFCFA',
                  border: '1px solid rgba(225, 228, 234, 0.8)',
                  borderRadius: '18px',
                  p: 2.75,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 12px rgba(8, 15, 28, 0.03)',
                  position: 'relative',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(8, 15, 28, 0.06)'
                  }
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '9px',
                          bgcolor: '#F2F3F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icons.Eye size={18} color="#080F1C" />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 650, color: '#161922', lineHeight: 1.2 }}>
                          Glimpse Notes
                        </Typography>
                        <Typography sx={{ fontSize: '0.74rem', color: '#66707B' }}>AI meeting notes</Typography>
                      </Box>
                    </Box>
                    <Chip
                      label="AI TOOL"
                      size="small"
                      sx={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        bgcolor: '#F2F3F6',
                        color: '#66707B',
                        borderRadius: '6px',
                        height: 20
                      }}
                    />
                  </Box>

                  {/* Metadata list */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
                    {[
                      { k: 'Users', v: '41 people in Okta' },
                      { k: 'First seen', v: '28 Sep in Okta' },
                      { k: 'Data access', v: 'Calendar and meeting audio' },
                      { k: 'Review on file', v: 'None' }
                    ].map((row, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                        <Typography sx={{ color: '#66707B', fontSize: 'inherit' }}>{row.k}</Typography>
                        <Typography sx={{ color: '#161922', fontWeight: 550, fontSize: 'inherit' }}>{row.v}</Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Sparkline */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#66707B', mb: 0.5 }}>
                      <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>PEOPLE USING IT, LAST 14 DAYS</span>
                      <span style={{ fontWeight: 600, color: '#161922' }}>Up from 3 to 41</span>
                    </Box>
                    {renderSparkline([3, 5, 8, 12, 16, 21, 28, 32, 35, 41])}
                  </Box>

                  {/* Department chips */}
                  <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
                    <Chip label="Sales 18" size="small" sx={{ fontSize: '0.68rem', bgcolor: '#F2F3F6', borderRadius: '6px' }} />
                    <Chip label="Customer success 14" size="small" sx={{ fontSize: '0.68rem', bgcolor: '#F2F3F6', borderRadius: '6px' }} />
                    <Chip label="Product 9" size="small" sx={{ fontSize: '0.68rem', bgcolor: '#F2F3F6', borderRadius: '6px' }} />
                  </Box>

                  {/* Intake Agent Suggestion Box */}
                  <Box sx={{ bgcolor: '#EFEBFF', p: 1.5, borderRadius: '12px', mb: 2.5, border: '1px solid rgba(111, 76, 237, 0.15)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                      <Icons.Sparkles size={13} color="#6F4CED" />
                      <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#6F4CED', letterSpacing: '0.06em' }}>
                        INTAKE AGENT
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.72rem', color: '#161922', lineHeight: 1.45 }}>
                      Suggested: Tier 2 with the AI addendum. Recorded meetings can include customer details.
                    </Typography>
                  </Box>
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 1, borderTop: '1px solid rgba(225, 228, 234, 0.6)' }}>
                  <Button
                    onClick={handleStartReview}
                    sx={{
                      bgcolor: '#080F1C',
                      color: '#FFFFFF',
                      borderRadius: '9999px',
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      px: 2,
                      py: 0.6,
                      '&:hover': { bgcolor: '#1D2531' }
                    }}
                  >
                    Start review
                  </Button>
                  <Button
                    sx={{
                      color: '#66707B',
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      p: 0,
                      minWidth: 'auto',
                      '&:hover': { color: '#161922', bgcolor: 'transparent' }
                    }}
                  >
                    Dismiss
                  </Button>
                </Box>
              </Box>

              {/* Card 2: Parsewell */}
              <Box
                sx={{
                  bgcolor: '#FAFCFA',
                  border: '1px solid rgba(225, 228, 234, 0.8)',
                  borderRadius: '18px',
                  p: 2.75,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 12px rgba(8, 15, 28, 0.03)'
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '9px',
                          bgcolor: '#F2F3F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icons.FileText size={18} color="#080F1C" />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 650, color: '#161922', lineHeight: 1.2 }}>
                          Parsewell
                        </Typography>
                        <Typography sx={{ fontSize: '0.74rem', color: '#66707B' }}>AI document parser</Typography>
                      </Box>
                    </Box>
                    <Chip
                      label="AI TOOL"
                      size="small"
                      sx={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        bgcolor: '#F2F3F6',
                        color: '#66707B',
                        borderRadius: '6px',
                        height: 20
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
                    {[
                      { k: 'Users', v: '12 people in Google Workspace' },
                      { k: 'First seen', v: '1 Oct in Google Workspace' },
                      { k: 'Data access', v: 'Supplier contracts and invoices' },
                      { k: 'Review on file', v: 'None' }
                    ].map((row, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                        <Typography sx={{ color: '#66707B', fontSize: 'inherit' }}>{row.k}</Typography>
                        <Typography sx={{ color: '#161922', fontWeight: 550, fontSize: 'inherit' }}>{row.v}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#66707B', mb: 0.5 }}>
                      <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>PEOPLE USING IT, LAST 14 DAYS</span>
                      <span style={{ fontWeight: 600, color: '#161922' }}>Up from 1 to 12</span>
                    </Box>
                    {renderSparkline([1, 1, 2, 3, 4, 6, 8, 9, 11, 12])}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
                    <Chip label="Finance 9" size="small" sx={{ fontSize: '0.68rem', bgcolor: '#F2F3F6', borderRadius: '6px' }} />
                    <Chip label="Procurement 3" size="small" sx={{ fontSize: '0.68rem', bgcolor: '#F2F3F6', borderRadius: '6px' }} />
                  </Box>

                  <Box sx={{ bgcolor: '#EFEBFF', p: 1.5, borderRadius: '12px', mb: 2.5, border: '1px solid rgba(111, 76, 237, 0.15)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                      <Icons.Sparkles size={13} color="#6F4CED" />
                      <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#6F4CED', letterSpacing: '0.06em' }}>
                        INTAKE AGENT
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.72rem', color: '#161922', lineHeight: 1.45 }}>
                      Suggested: Tier 2, full assessment plus the AI addendum. Finance uploads supplier contracts.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 1, borderTop: '1px solid rgba(225, 228, 234, 0.6)' }}>
                  <Button
                    onClick={handleStartReview}
                    sx={{
                      bgcolor: '#080F1C',
                      color: '#FFFFFF',
                      borderRadius: '9999px',
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      px: 2,
                      py: 0.6,
                      '&:hover': { bgcolor: '#1D2531' }
                    }}
                  >
                    Start review
                  </Button>
                  <Button
                    sx={{
                      color: '#66707B',
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      p: 0,
                      minWidth: 'auto',
                      '&:hover': { color: '#161922', bgcolor: 'transparent' }
                    }}
                  >
                    Dismiss
                  </Button>
                </Box>
              </Box>

              {/* Card 3: Kestrel Cloud */}
              <Box
                sx={{
                  bgcolor: '#FAFCFA',
                  border: '1px solid rgba(225, 228, 234, 0.8)',
                  borderRadius: '18px',
                  p: 2.75,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 12px rgba(8, 15, 28, 0.03)'
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '9px',
                          bgcolor: '#F2F3F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icons.Cloud size={18} color="#080F1C" />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 650, color: '#161922', lineHeight: 1.2 }}>
                          Kestrel Cloud
                        </Typography>
                        <Typography sx={{ fontSize: '0.74rem', color: '#66707B' }}>Known vendor V-0063, new usage</Typography>
                      </Box>
                    </Box>
                    <Chip
                      label="NEW USAGE"
                      size="small"
                      sx={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        bgcolor: '#F2F3F6',
                        color: '#66707B',
                        borderRadius: '6px',
                        height: 20
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
                    {[
                      { k: 'Change', v: '2 new AWS accounts billed' },
                      { k: 'First seen', v: '3 Oct in AWS billing' },
                      { k: 'Current tier', v: 'Tier 1, exit plan open' },
                      { k: 'Spend change', v: 'Up EUR 4,200 a month' }
                    ].map((row, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                        <Typography sx={{ color: '#66707B', fontSize: 'inherit' }}>{row.k}</Typography>
                        <Typography sx={{ color: '#161922', fontWeight: 550, fontSize: 'inherit' }}>{row.v}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#66707B', mb: 0.5 }}>
                      <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>AWS SPEND, LAST 6 MONTHS</span>
                      <span style={{ fontWeight: 600, color: '#161922' }}>EUR 38k to 45k a month</span>
                    </Box>
                    {renderSparkline([38, 38.5, 39, 40, 42, 45])}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
                    <Chip label="Platform 2" size="small" sx={{ fontSize: '0.68rem', bgcolor: '#F2F3F6', borderRadius: '6px' }} />
                    <Chip label="Data 1" size="small" sx={{ fontSize: '0.68rem', bgcolor: '#F2F3F6', borderRadius: '6px' }} />
                  </Box>

                  <Box sx={{ bgcolor: '#EFEBFF', p: 1.5, borderRadius: '12px', mb: 2.5, border: '1px solid rgba(111, 76, 237, 0.15)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                      <Icons.Sparkles size={13} color="#6F4CED" />
                      <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#6F4CED', letterSpacing: '0.06em' }}>
                        INTAKE AGENT
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.72rem', color: '#161922', lineHeight: 1.45 }}>
                      Suggested: update the scope of V-0063 and ask Jonas Weber why usage grew during the exit plan.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 1, borderTop: '1px solid rgba(225, 228, 234, 0.6)' }}>
                  <Button
                    onClick={handleStartReview}
                    sx={{
                      bgcolor: '#080F1C',
                      color: '#FFFFFF',
                      borderRadius: '9999px',
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      px: 2,
                      py: 0.6,
                      '&:hover': { bgcolor: '#1D2531' }
                    }}
                  >
                    Update scope
                  </Button>
                  <Button
                    sx={{
                      color: '#66707B',
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      p: 0,
                      minWidth: 'auto',
                      '&:hover': { color: '#161922', bgcolor: 'transparent' }
                    }}
                  >
                    Dismiss
                  </Button>
                </Box>
              </Box>
            </Box>
          </motion.div>
        )}

        {screen === 'wizard' && (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Wizard Header Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#66707B', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 0.5 }}>
                  VENDORS · ADD VENDOR
                </Typography>
                <Typography sx={{ fontSize: '1.85rem', fontWeight: 550, color: '#161922', letterSpacing: '-0.02em', mb: 0.25 }}>
                  Add Glimpse Notes
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#66707B' }}>
                  Started from Discovery. Intake Agent filled what it could. Check each step and confirm.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#66707B', cursor: 'pointer', '&:hover': { color: '#161922' } }}>
                  Save draft
                </Typography>
                <Button
                  onClick={handleReturnDiscovery}
                  sx={{
                    borderRadius: '9999px',
                    border: '1px solid #E1E4EA',
                    bgcolor: '#FFFFFF',
                    color: '#161922',
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    px: 2,
                    py: 0.5,
                    '&:hover': { bgcolor: '#F8F9FA' }
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>

            {/* 3-Column Layout: Stepper | Interactive Form | Live Risk & Sources Sidebar */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '250px 1fr 320px' }, gap: 3, alignItems: 'start' }}>
              {/* Column 1: Left Stepper */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ bgcolor: '#FAFCFA', border: '1px solid rgba(225, 228, 234, 0.8)', borderRadius: '18px', p: 2 }}>
                  {[
                    'Vendor basics',
                    'Business context',
                    'Data and access',
                    'AI usage',
                    'Tiering',
                    'Assessment plan',
                    'Approvers',
                    'Owner and team',
                    'Review and launch'
                  ].map((stepName, idx) => {
                    const stepNum = idx + 1;
                    const isDone = stepNum < wizardStep;
                    const isCurrent = stepNum === wizardStep;

                    return (
                      <Box
                        key={stepName}
                        onClick={() => setWizardStep(stepNum)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 0.85,
                          px: 1.25,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          bgcolor: isCurrent ? '#F2F3F6' : 'transparent',
                          transition: 'background-color 0.18s ease',
                          '&:hover': { bgcolor: isCurrent ? '#F2F3F6' : 'rgba(0,0,0,0.02)' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              bgcolor: isDone ? '#080F1C' : isCurrent ? '#080F1C' : '#E9EBF0',
                              color: isDone || isCurrent ? '#FFFFFF' : '#66707B'
                            }}
                          >
                            {isDone ? <Icons.Check size={12} color="#FFFFFF" strokeWidth={3} /> : stepNum}
                          </Box>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: isCurrent ? 650 : 450, color: isCurrent ? '#161922' : '#66707B' }}>
                            {stepName}
                          </Typography>
                        </Box>
                        {isDone && (
                          <Typography sx={{ fontSize: '0.68rem', color: '#66707B', fontWeight: 500 }}>Done</Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>

                {/* Progress Status Card */}
                <Box sx={{ bgcolor: '#FAFCFA', border: '1px solid rgba(225, 228, 234, 0.8)', borderRadius: '18px', p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#161922' }}>
                      Step {wizardStep} of 9
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#66707B' }}>
                      {Math.round(((wizardStep - 1) / 9) * 100)}% done
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={((wizardStep - 1) / 9) * 100}
                    sx={{
                      height: 5,
                      borderRadius: '9999px',
                      bgcolor: '#E9EBF0',
                      mb: 1,
                      '& .MuiLinearProgress-bar': { bgcolor: '#080F1C', borderRadius: '9999px' }
                    }}
                  />
                  <Typography sx={{ fontSize: '0.7rem', color: '#66707B' }}>
                    About {Math.max(1, 10 - wizardStep)} min left. Saves on its own.
                  </Typography>
                </Box>

                {/* Found by Intake Agent card */}
                <Box sx={{ bgcolor: '#FAFCFA', border: '1px solid rgba(225, 228, 234, 0.8)', borderRadius: '18px', p: 2 }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', color: '#969DA7', textTransform: 'uppercase', mb: 0.5 }}>
                    FOUND BY INTAKE AGENT
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Icons.Eye size={15} color="#080F1C" />
                    <Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 650, color: '#161922', lineHeight: 1.2 }}>
                        Glimpse Notes
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#66707B' }}>41 people in Okta since 28 Sep</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Column 2: Central Interactive Step Content */}
              <Box sx={{ bgcolor: '#FAFCFA', border: '1px solid rgba(225, 228, 234, 0.8)', borderRadius: '18px', p: 3.5 }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#66707B', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 0.25 }}>
                  STEP {wizardStep} OF 9
                </Typography>

                {wizardStep === 1 && (
                  <Box className="step-enter">
                    <Typography sx={{ fontSize: '1.35rem', fontWeight: 600, color: '#161922', mb: 0.5 }}>
                      Vendor basics
                    </Typography>
                    <Typography sx={{ fontSize: '0.825rem', color: '#66707B', mb: 3 }}>
                      Who the vendor is. Intake Agent filled these from the companies registry and the vendor website.
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Legal name</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={formData.legalName}
                          onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                          helperText="From the Irish companies registry"
                        />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Trading name</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={formData.tradingName}
                          onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Website</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Country</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          helperText="Registered office in Dublin"
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Category</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Registration number</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={formData.regNumber}
                          onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Security contact</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={formData.securityContact}
                          onChange={(e) => setFormData({ ...formData, securityContact: e.target.value })}
                          helperText="From the vendor security page"
                        />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Company size</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={formData.companySize}
                          onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>What the vendor does</Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        helperText="Assessment Agent uses this to pick questions. (97 / 500)"
                      />
                    </Box>
                  </Box>
                )}

                {wizardStep === 2 && (
                  <Box className="step-enter">
                    <Typography sx={{ fontSize: '1.35rem', fontWeight: 600, color: '#161922', mb: 0.5 }}>
                      Business context
                    </Typography>
                    <Typography sx={{ fontSize: '0.825rem', color: '#66707B', mb: 3 }}>
                      Who owns the vendor internally and what happens if it fails.
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Business owner</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={formData.owner}
                          onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                          helperText="Sales Operations"
                        />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Yearly spend (EUR)</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={formData.spend}
                          onChange={(e) => setFormData({ ...formData, spend: e.target.value })}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>People using it today</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={formData.usersCount}
                          onChange={(e) => setFormData({ ...formData, usersCount: e.target.value })}
                        />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>People planned in 12 months</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={formData.plannedUsers}
                          onChange={(e) => setFormData({ ...formData, plannedUsers: e.target.value })}
                        />
                      </Box>
                    </Box>

                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, mb: 1 }}>
                      If Glimpse Notes stopped working for a day:
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 3 }}>
                      {[
                        { id: 'low', title: 'Little impact', desc: 'Work continues normally' },
                        { id: 'medium', title: 'Work slows down', desc: 'Minor operational lag' },
                        { id: 'high', title: 'Customers affected', desc: 'Immediate business halt' }
                      ].map((opt) => (
                        <Box
                          key={opt.id}
                          onClick={() => setFormData({ ...formData, impact: opt.id })}
                          sx={{
                            p: 1.75,
                            borderRadius: '12px',
                            border: formData.impact === opt.id ? '2px solid #080F1C' : '1px solid #E1E4EA',
                            cursor: 'pointer',
                            bgcolor: formData.impact === opt.id ? '#F8F9FA' : '#FAFCFA'
                          }}
                        >
                          <Radio checked={formData.impact === opt.id} size="small" sx={{ p: 0, mb: 0.5 }} />
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 650 }}>{opt.title}</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: '#66707B' }}>{opt.desc}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {wizardStep === 3 && (
                  <Box className="step-enter">
                    <Typography sx={{ fontSize: '1.35rem', fontWeight: 600, color: '#161922', mb: 0.5 }}>
                      Data and access
                    </Typography>
                    <Typography sx={{ fontSize: '0.825rem', color: '#66707B', mb: 3 }}>
                      What customer and employee data the tool processes and stores.
                    </Typography>

                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, mb: 1 }}>Data categories handled:</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 3 }}>
                      {[
                        { k: 'personalData', label: 'Customer personal data (transcripts, meeting notes)' },
                        { k: 'employeeData', label: 'Employee personal data (Google / Okta SSO profile)' },
                        { k: 'confidentialData', label: 'Confidential business data (pipeline discussions)' },
                        { k: 'paymentData', label: 'Payment or card data' },
                        { k: 'healthData', label: 'Special category or health data' }
                      ].map((item) => (
                        <Box key={item.k} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Checkbox
                            checked={Boolean(formData[item.k])}
                            onChange={(e) => setFormData({ ...formData, [item.k]: e.target.checked })}
                            size="small"
                          />
                          <Typography sx={{ fontSize: '0.78rem' }}>{item.label}</Typography>
                        </Box>
                      ))}
                    </Box>

                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, mb: 1 }}>Subprocessors found in DPA:</Typography>
                    <Box sx={{ border: '1px solid #E1E4EA', borderRadius: '10px', overflow: 'hidden', mb: 3 }}>
                      {[
                        { name: 'Amazon Web Services', location: 'EU, Ireland', tag: 'EU' },
                        { name: 'Sonance AI (Speech-to-text)', location: 'United States', tag: 'OUTSIDE EU' },
                        { name: 'Azure OpenAI', location: 'EU, Sweden', tag: 'EU' }
                      ].map((sub, i) => (
                        <Box key={i} sx={{ p: 1.25, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < 2 ? '1px solid #E1E4EA' : 'none' }}>
                          <Box>
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{sub.name}</Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#66707B' }}>{sub.location}</Typography>
                          </Box>
                          <Chip
                            label={sub.tag}
                            size="small"
                            sx={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              bgcolor: sub.tag === 'EU' ? '#E7F2EA' : '#FEE2E2',
                              color: sub.tag === 'EU' ? '#2A875B' : '#C33A4D',
                              borderRadius: '4px'
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {wizardStep === 4 && (
                  <Box className="step-enter">
                    <Typography sx={{ fontSize: '1.35rem', fontWeight: 600, color: '#161922', mb: 0.5 }}>
                      AI usage
                    </Typography>
                    <Typography sx={{ fontSize: '0.825rem', color: '#66707B', mb: 3 }}>
                      Third-party language models, retention policies, and human review guarantees.
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Model provider</Typography>
                        <TextField fullWidth size="small" value={formData.modelProvider} disabled />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Trains on customer data?</Typography>
                        <TextField fullWidth size="small" value={formData.trainsOnData} disabled />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Audio recordings kept for</Typography>
                        <TextField fullWidth size="small" value={formData.retention} disabled />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Human review of outputs</Typography>
                        <TextField fullWidth size="small" value={formData.humanReview} disabled />
                      </Box>
                    </Box>

                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, mb: 1 }}>AI features in use at Halden:</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      {[
                        { k: 'featureSummaries', title: 'Meeting summaries', desc: 'Generates automated bullet summaries after calls' },
                        { k: 'featureActions', title: 'Action items to calendar', desc: 'Parses next steps into Google Calendar invites' },
                        { k: 'featureDeals', title: 'Deal insights for Salesforce', desc: 'Pushes sentiment and objections into CRM' }
                      ].map((item) => (
                        <Box key={item.k} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, border: '1px solid #E1E4EA', borderRadius: '10px' }}>
                          <Box>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.title}</Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#66707B' }}>{item.desc}</Typography>
                          </Box>
                          <Switch
                            checked={Boolean(formData[item.k])}
                            onChange={(e) => setFormData({ ...formData, [item.k]: e.target.checked })}
                            size="small"
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {wizardStep === 5 && (
                  <Box className="step-enter">
                    <Typography sx={{ fontSize: '1.35rem', fontWeight: 600, color: '#161922', mb: 0.5 }}>
                      Tiering
                    </Typography>
                    <Typography sx={{ fontSize: '0.825rem', color: '#66707B', mb: 3 }}>
                      Determine governance intensity and assessment frequency based on inherent risk.
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                      {[
                        {
                          t: 1,
                          name: 'Tier 1 — Critical',
                          desc: 'Assessment every 12 months, executive committee approval. Appetite 50.',
                          suggested: false
                        },
                        {
                          t: 2,
                          name: 'Tier 2 — High',
                          desc: 'Assessment every 24 months, risk manager approval. Appetite 65.',
                          suggested: true
                        },
                        {
                          t: 3,
                          name: 'Tier 3 — Low',
                          desc: 'Assessment every 36 months, business owner approval. Appetite 75.',
                          suggested: false
                        }
                      ].map((card) => {
                        const isSelected = formData.selectedTier === card.t;
                        return (
                          <Box
                            key={card.t}
                            onClick={() => setFormData({ ...formData, selectedTier: card.t })}
                            sx={{
                              p: 2,
                              borderRadius: '14px',
                              border: isSelected ? '2px solid #080F1C' : '1px solid #E1E4EA',
                              bgcolor: isSelected ? '#FFFFFF' : '#FAFCFA',
                              boxShadow: isSelected ? '0 4px 16px rgba(8, 15, 28, 0.08)' : 'none',
                              cursor: 'pointer',
                              position: 'relative'
                            }}
                          >
                            {card.suggested && (
                              <Chip
                                label="SUGGESTED"
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 12,
                                  right: 12,
                                  fontSize: '0.6rem',
                                  fontWeight: 800,
                                  bgcolor: '#EFEBFF',
                                  color: '#6F4CED',
                                  height: 18
                                }}
                              />
                            )}
                            <Radio checked={isSelected} size="small" sx={{ p: 0, mb: 1 }} />
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 0.5 }}>{card.name}</Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: '#66707B', lineHeight: 1.4 }}>{card.desc}</Typography>
                          </Box>
                        );
                      })}
                    </Box>

                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, mb: 1 }}>Risk factor evaluation:</Typography>
                    <Box sx={{ border: '1px solid #E1E4EA', borderRadius: '10px', overflow: 'hidden' }}>
                      {[
                        { factor: 'Data sensitivity (Customer meeting audio)', level: 'HIGH', color: '#C33A4D' },
                        { factor: 'Business interruption (Little disruption)', level: 'LOW', color: '#2A875B' },
                        { factor: 'AI Model & training (Azure OpenAI, opted out)', level: 'MID', color: '#CE8F0B' },
                        { factor: 'Subprocessor geography (US transcription)', level: 'HIGH', color: '#C33A4D' }
                      ].map((f, i) => (
                        <Box key={i} sx={{ p: 1.25, px: 2, display: 'flex', justifyContent: 'space-between', borderBottom: i < 3 ? '1px solid #E1E4EA' : 'none' }}>
                          <Typography sx={{ fontSize: '0.75rem', color: '#161922' }}>{f.factor}</Typography>
                          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: f.color }}>{f.level}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {wizardStep === 6 && (
                  <Box className="step-enter">
                    <Typography sx={{ fontSize: '1.35rem', fontWeight: 600, color: '#161922', mb: 0.5 }}>
                      Assessment plan
                    </Typography>
                    <Typography sx={{ fontSize: '0.825rem', color: '#66707B', mb: 3 }}>
                      Configure questionnaires and evidence collection for Glimpse Labs.
                    </Typography>

                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, mb: 1 }}>Questionnaire template:</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 3 }}>
                      {[
                        { id: 'light', name: 'Light', q: '18 questions · 45 min' },
                        { id: 'standard_ai', name: 'Standard + AI addendum', q: '46 questions · ~3 hours' },
                        { id: 'full', name: 'Full Enterprise', q: '84 questions · ~6 hours' }
                      ].map((item) => (
                        <Box
                          key={item.id}
                          onClick={() => setFormData({ ...formData, questionnaire: item.id })}
                          sx={{
                            p: 1.5,
                            borderRadius: '12px',
                            border: formData.questionnaire === item.id ? '2px solid #080F1C' : '1px solid #E1E4EA',
                            bgcolor: formData.questionnaire === item.id ? '#FFFFFF' : '#FAFCFA',
                            cursor: 'pointer'
                          }}
                        >
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{item.name}</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: '#66707B' }}>{item.q}</Typography>
                        </Box>
                      ))}
                    </Box>

                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, mb: 1 }}>Evidence requested:</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 3 }}>
                      {[
                        { k: 'docSoc2', label: 'SOC 2 Type II Report (within 12 months)' },
                        { k: 'docDpa', label: 'Executed Data Processing Agreement with Standard Contractual Clauses' },
                        { k: 'docAiModel', label: 'AI Model Safety Card & Opt-Out Addendum' },
                        { k: 'docPenTest', label: 'Independent Penetration Test Executive Summary' },
                        { k: 'docBcp', label: 'Business Continuity & Disaster Recovery Plan (Optional)' }
                      ].map((item) => (
                        <Box key={item.k} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Checkbox
                            checked={Boolean(formData[item.k])}
                            onChange={(e) => setFormData({ ...formData, [item.k]: e.target.checked })}
                            size="small"
                          />
                          <Typography sx={{ fontSize: '0.78rem' }}>{item.label}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {wizardStep === 7 && (
                  <Box className="step-enter">
                    <Typography sx={{ fontSize: '1.35rem', fontWeight: 600, color: '#161922', mb: 0.5 }}>
                      Approvers
                    </Typography>
                    <Typography sx={{ fontSize: '0.825rem', color: '#66707B', mb: 3 }}>
                      Decision-makers required by Policy P-03 for Tier 2 vendors with AI integrations.
                    </Typography>

                    <Box sx={{ border: '1px solid #E1E4EA', borderRadius: '12px', overflow: 'hidden', mb: 3 }}>
                      {[
                        { name: 'Hannah Price', role: 'Risk Manager', detail: 'Primary reviewer for Tier 2 vendors' },
                        { name: 'Elena Varga', role: 'Head of Third-Party Risk', detail: 'Mandatory approval for AI models handling PII' }
                      ].map((person, idx) => (
                        <Box key={idx} sx={{ p: 1.75, px: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: idx === 0 ? '1px solid #E1E4EA' : 'none' }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: '#080F1C', fontSize: '0.75rem', fontWeight: 700 }}>
                            {person.name.split(' ').map(w => w[0]).join('')}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '0.825rem', fontWeight: 650 }}>{person.name}</Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#66707B' }}>{person.role} · {person.detail}</Typography>
                          </Box>
                          <Chip label="Required" size="small" sx={{ fontSize: '0.625rem', fontWeight: 700, bgcolor: '#F2F3F6' }} />
                        </Box>
                      ))}
                    </Box>

                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, mb: 1 }}>Decision milestones:</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: '#F8F9FA', borderRadius: '12px' }}>
                      {[
                        { date: 'Today', label: 'Intake Launch' },
                        { date: '20 Oct', label: 'Answers Due' },
                        { date: '21 Oct', label: 'Risk Review' },
                        { date: '27 Oct', label: 'Final Approval' }
                      ].map((m, i) => (
                        <Box key={i} sx={{ textAlign: 'center' }}>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{m.date}</Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: '#66707B' }}>{m.label}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {wizardStep === 8 && (
                  <Box className="step-enter">
                    <Typography sx={{ fontSize: '1.35rem', fontWeight: 600, color: '#161922', mb: 0.5 }}>
                      Owner and team
                    </Typography>
                    <Typography sx={{ fontSize: '0.825rem', color: '#66707B', mb: 3 }}>
                      Assign operational ownership and review stakeholders.
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Vendor owner</Typography>
                        <TextField fullWidth size="small" value="Hannah Price" disabled />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Business owner</Typography>
                        <TextField fullWidth size="small" value="Lea Moreau" disabled />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Security reviewer</Typography>
                        <TextField fullWidth size="small" value="Daniel Okafor" disabled />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>Legal reviewer</Typography>
                        <TextField fullWidth size="small" value="Sofia Lindqvist" disabled />
                      </Box>
                    </Box>

                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, mb: 1 }}>Who hears about risk updates:</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.25, border: '1px solid #E1E4EA', borderRadius: '8px' }}>
                        <Typography sx={{ fontSize: '0.78rem' }}>Alert Hannah Price on vendor risk score changes</Typography>
                        <Switch defaultChecked size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.25, border: '1px solid #E1E4EA', borderRadius: '8px' }}>
                        <Typography sx={{ fontSize: '0.78rem' }}>Weekly summary report sent to Lea Moreau</Typography>
                        <Switch defaultChecked size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.25, border: '1px solid #E1E4EA', borderRadius: '8px' }}>
                        <Typography sx={{ fontSize: '0.78rem' }}>Renewal reminder 60 days before contract expiry</Typography>
                        <Switch defaultChecked size="small" />
                      </Box>
                    </Box>
                  </Box>
                )}

                {wizardStep === 9 && (
                  <Box className="step-enter">
                    <Typography sx={{ fontSize: '1.35rem', fontWeight: 600, color: '#161922', mb: 0.5 }}>
                      Review and launch
                    </Typography>
                    <Typography sx={{ fontSize: '0.825rem', color: '#66707B', mb: 3 }}>
                      Verify intake inputs before registering Glimpse Notes and generating the assessment email.
                    </Typography>

                    {/* 2x3 Review Grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                      {[
                        { title: 'Vendor', step: 1, text: `${formData.legalName} · Ireland · Category: ${formData.category}` },
                        { title: 'Business', step: 2, text: `Owner: ${formData.owner} · EUR ${formData.spend} spend · 41 Okta users` },
                        { title: 'Data & Access', step: 3, text: 'Customer PII, Employee SSO, Calendar audio, US Subprocessor' },
                        { title: 'AI Usage', step: 4, text: `${formData.modelProvider} · No customer training · 90-day retention` },
                        { title: 'Tiering', step: 5, text: `Tier 2 High · Inherent risk 66 / Appetite 65 · Hannah & Elena` },
                        { title: 'Assessment', step: 6, text: 'Standard + AI addendum (46 questions) · 4 documents · Due 20 Oct' }
                      ].map((item, idx) => (
                        <Box key={idx} sx={{ p: 2, border: '1px solid #E1E4EA', borderRadius: '12px', bgcolor: '#FAFCFA' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{item.title}</Typography>
                            <Typography
                              onClick={() => setWizardStep(item.step)}
                              sx={{ fontSize: '0.72rem', color: '#6F4CED', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            >
                              Edit
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: '0.74rem', color: '#66707B', lineHeight: 1.45 }}>{item.text}</Typography>
                        </Box>
                      ))}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Checkbox
                        checked={formData.sendEmailAfterReview}
                        onChange={(e) => setFormData({ ...formData, sendEmailAfterReview: e.target.checked })}
                        size="small"
                      />
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
                        Send the assessment after I review the email
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.7rem', color: '#66707B', mb: 3, pl: 3.5 }}>
                      Assessment Agent drafts it and nothing goes to Glimpse Labs until you press Send.
                    </Typography>
                  </Box>
                )}

                {/* Bottom Navigation Controls */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 3, borderTop: '1px solid #E1E4EA' }}>
                  <Button
                    disabled={wizardStep === 1}
                    onClick={() => setWizardStep((s) => Math.max(1, s - 1))}
                    sx={{
                      color: '#66707B',
                      textTransform: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      '&:hover': { color: '#161922', bgcolor: 'transparent' }
                    }}
                  >
                    <Icons.ArrowLeft size={16} /> Back
                  </Button>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#969DA7' }}>
                      Draft saved just now
                    </Typography>

                    {wizardStep < 9 ? (
                      <Button
                        onClick={() => setWizardStep((s) => Math.min(9, s + 1))}
                        sx={{
                          bgcolor: '#080F1C',
                          color: '#FFFFFF',
                          borderRadius: '9999px',
                          textTransform: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          px: 2.75,
                          py: 0.75,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          '&:hover': { bgcolor: '#1D2531' }
                        }}
                      >
                        Continue <Icons.ArrowRight size={16} />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleLaunchVendor}
                        sx={{
                          bgcolor: '#080F1C',
                          color: '#FFFFFF',
                          borderRadius: '9999px',
                          textTransform: 'none',
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          px: 3,
                          py: 0.85,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          boxShadow: '0 4px 14px rgba(8, 15, 28, 0.25)',
                          '&:hover': { bgcolor: '#1D2531' }
                        }}
                      >
                        Launch vendor <Icons.ArrowRight size={16} />
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Column 3: Right Sidebar — Live Risk + Provenance */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Risk Agent · Live Preview Card */}
                <Box
                  sx={{
                    bgcolor: '#080F1C',
                    color: '#FFFFFF',
                    borderRadius: '18px',
                    p: 2.75,
                    boxShadow: '0 8px 24px rgba(8, 15, 28, 0.25)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6F4CED' }} />
                    <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.08em', color: '#969DA7', textTransform: 'uppercase' }}>
                      RISK AGENT · LIVE PREVIEW
                    </Typography>
                  </Box>

                  {/* Large animated score counter */}
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontSize: '4.75rem', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.04em' }}>
                      {displayScore}
                    </Typography>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#FAFCFA' }}>
                        inherent risk
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: '#969DA7' }}>
                        Tier 2, appetite 65
                      </Typography>
                    </Box>
                  </Box>

                  {/* Horizontal Segmented Risk Gauge */}
                  <Box sx={{ my: 2 }}>
                    <Box sx={{ position: 'relative', width: '100%', height: 6, borderRadius: '9999px', overflow: 'hidden' }}>
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, #2A875B 0% 27%, #CE8F0B 27% 50%, #D46521 50% 73%, #C33A4D 73% 100%)'
                        }}
                      />
                    </Box>
                    {/* Gauge indicator marker */}
                    <Box sx={{ position: 'relative', width: '100%', height: 10, mt: 0.5 }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: `${Math.min(95, Math.max(5, displayScore))}%`,
                          top: 0,
                          transform: 'translateX(-50%)',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#FFFFFF',
                          boxShadow: '0 0 6px rgba(255,255,255,0.8)',
                          transition: 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#66707B' }}>
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </Box>
                  </Box>

                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#969DA7', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1 }}>
                    WHAT MOVED IT
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, fontSize: '0.74rem' }}>
                    {[
                      { item: 'Customer personal data', change: '+18' },
                      { item: 'Meeting audio processing', change: '+12' },
                      { item: 'US transcription subprocessor', change: '+9' },
                      { item: 'Third-party language model', change: '+8' },
                      { item: 'Recordings kept 90 days', change: '+5' }
                    ].slice(0, Math.min(5, wizardStep)).map((d, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
                        <span>{d.item}</span>
                        <span style={{ color: '#F87171', fontWeight: 600 }}>{d.change}</span>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Filled by Intake Agent Provenance Card */}
                <Box sx={{ bgcolor: '#FAFCFA', border: '1px solid rgba(225, 228, 234, 0.8)', borderRadius: '18px', p: 2.75 }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#161922', mb: 0.25 }}>
                    Filled by Intake Agent
                  </Typography>
                  <Typography sx={{ fontSize: '0.74rem', color: '#66707B', mb: 2 }}>
                    {intakeFilled} of 31 fields so far
                  </Typography>

                  {/* Provenance rows with tiny line icons */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2.5 }}>
                    {[
                      { source: 'Okta', desc: '41 users, SSO since 28 Sep' },
                      { source: 'Irish companies registry', desc: 'Glimpse Labs Ltd, IE 712448' },
                      { source: 'glimpsenotes.com', desc: 'Security page and DPA' },
                      { source: 'Google Workspace', desc: 'Calendar access granted' }
                    ].map((row, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#EFEBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.25 }}>
                          <Icons.Check size={9} color="#6F4CED" strokeWidth={3} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.76rem', fontWeight: 650, color: '#161922', lineHeight: 1.2 }}>
                            {row.source}
                          </Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: '#66707B' }}>{row.desc}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ pt: 2, borderTop: '1px solid #E1E4EA' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', color: '#969DA7', textTransform: 'uppercase' }}>
                        LEFT FOR YOU
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#6F4CED' }}>
                        {31 - intakeFilled} remaining
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(intakeFilled / 31) * 100}
                      sx={{
                        height: 6,
                        borderRadius: '9999px',
                        bgcolor: '#E9EBF0',
                        '& .MuiLinearProgress-bar': { bgcolor: '#6F4CED', borderRadius: '9999px' }
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </motion.div>
        )}

        {screen === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#66707B', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 0.5 }}>
                  VENDORS · GLIMPSE NOTES
                </Typography>
                <Typography sx={{ fontSize: '1.95rem', fontWeight: 550, color: '#161922', letterSpacing: '-0.025em', mb: 0.4 }}>
                  Glimpse Notes is added
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#66707B' }}>
                  V-0413 · Tier 2 · Owner Hannah Price · launched today at 10:42
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.25 }}>
                <Button
                  onClick={handleReturnDiscovery}
                  sx={{
                    borderRadius: '9999px',
                    border: '1px solid #E1E4EA',
                    bgcolor: '#FFFFFF',
                    color: '#161922',
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    px: 2,
                    py: 0.6,
                    '&:hover': { bgcolor: '#F8F9FA' }
                  }}
                >
                  View vendor
                </Button>
                <Button
                  onClick={handleReturnDiscovery}
                  sx={{
                    borderRadius: '9999px',
                    bgcolor: '#080F1C',
                    color: '#FFFFFF',
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    px: 2.25,
                    py: 0.6,
                    '&:hover': { bgcolor: '#1D2531' }
                  }}
                >
                  Return to Discovery
                </Button>
              </Box>
            </Box>

            {/* Dark Hero Banner with Email Ready + Oversized Inset Email Preview */}
            <Box
              sx={{
                bgcolor: '#080F1C',
                color: '#FFFFFF',
                borderRadius: '20px',
                p: { xs: 3, md: 4 },
                mb: 3.5,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 1.35fr' },
                gap: 4,
                boxShadow: '0 12px 36px rgba(8, 15, 28, 0.25)'
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '1.75rem', fontWeight: 550, letterSpacing: '-0.02em', mb: 1.25, lineHeight: 1.25 }}>
                    Your assessment email is ready to send
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: '#969DA7', lineHeight: 1.6, maxWidth: 440, mb: 4 }}>
                    Assessment Agent drafted 46 questions and 4 evidence requests for security@glimpsenotes.com. Review it and press send. Answers are due on 20 Oct.
                  </Typography>
                </Box>

                {/* Counting Metric Stats (46 / 4 / 14) */}
                <Box sx={{ display: 'flex', gap: 4, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Box>
                    <Typography sx={{ fontSize: '3rem', fontWeight: 350, lineHeight: 1 }}>46</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#969DA7', mt: 0.5 }}>questions</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '3rem', fontWeight: 350, lineHeight: 1 }}>4</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#969DA7', mt: 0.5 }}>documents</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '3rem', fontWeight: 350, lineHeight: 1 }}>14</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#969DA7', mt: 0.5 }}>days to answer</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Inset White Email Draft Preview */}
              <Box
                sx={{
                  bgcolor: '#FAFCFA',
                  color: '#161922',
                  borderRadius: '16px',
                  p: 3,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1.5, borderBottom: '1px solid #E1E4EA' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: '#EFEBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icons.Sparkles size={13} color="#6F4CED" />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700 }}>
                          Draft from Assessment Agent
                        </Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: '#66707B' }}>
                          From risk@halden.eu · not sent yet
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label="DRAFT"
                      size="small"
                      sx={{ fontSize: '0.625rem', fontWeight: 800, bgcolor: '#EFEBFF', color: '#6F4CED', height: 20 }}
                    />
                  </Box>

                  <Box sx={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <span style={{ color: '#66707B', width: 55 }}>To:</span>
                      <span style={{ fontWeight: 600 }}>security@glimpsenotes.com</span>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <span style={{ color: '#66707B', width: 55 }}>Subject:</span>
                      <span style={{ fontWeight: 600 }}>Halden Financial security review for Glimpse Notes</span>
                    </Box>
                  </Box>

                  <Box sx={{ p: 2, bgcolor: '#F8F9FA', borderRadius: '10px', fontSize: '0.75rem', color: '#334155', lineHeight: 1.6, mb: 2 }}>
                    <p style={{ margin: 0, marginBottom: 8 }}>Hello Glimpse Labs team,</p>
                    <p style={{ margin: 0, marginBottom: 8 }}>
                      Halden Financial has approved Glimpse Notes for deployment across our Sales and Customer Success teams. As part of our annual Tier 2 intake governance, please complete the standard EU questionnaire and upload the following required compliance evidence:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 18, marginBottom: 8 }}>
                      <li>SOC 2 Type II audit report</li>
                      <li>Standard Contractual Clauses DPA</li>
                      <li>AI Model Card & training opt-out certification</li>
                      <li>Latest penetration test executive summary</li>
                    </ul>
                    <p style={{ margin: 0 }}>Responses are requested by 20 October 2026.</p>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, pt: 1 }}>
                  <Button
                    onClick={() => alert('Assessment email dispatched to security@glimpsenotes.com')}
                    sx={{
                      bgcolor: '#080F1C',
                      color: '#FFFFFF',
                      borderRadius: '9999px',
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      px: 2.5,
                      py: 0.65,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      '&:hover': { bgcolor: '#1D2531' }
                    }}
                  >
                    <Icons.Send size={14} /> Send now
                  </Button>
                  <Button
                    sx={{
                      color: '#66707B',
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      '&:hover': { color: '#161922', bgcolor: 'transparent' }
                    }}
                  >
                    Edit email
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Bottom 3 Information Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
              {/* Card 1: What agents do next */}
              <Box sx={{ bgcolor: '#FAFCFA', border: '1px solid #E1E4EA', borderRadius: '16px', p: 2.75 }}>
                <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#161922', mb: 2 }}>
                  What agents do next
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[
                    { agent: 'Assessment Agent', desc: 'Sends a reminder if there is no reply in 3 days' },
                    { agent: 'Evidence Agent', desc: 'Reads each document as it arrives and drafts findings' },
                    { agent: 'Monitoring Agent', desc: 'Watches Glimpse Notes for breaches and news every day' },
                    { agent: 'Risk Agent', desc: 'Recalculates appetite score as answers are submitted' }
                  ].map((a, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                      <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: '#EFEBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.25 }}>
                        <Icons.Sparkles size={11} color="#6F4CED" />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.76rem', fontWeight: 650 }}>{a.agent}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#66707B' }}>{a.desc}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Card 2: Who was told */}
              <Box sx={{ bgcolor: '#FAFCFA', border: '1px solid #E1E4EA', borderRadius: '16px', p: 2.75 }}>
                <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#161922', mb: 2 }}>
                  Who was told
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[
                    { name: 'Hannah Price', role: 'Vendor owner, will approve first' },
                    { name: 'Elena Varga', role: 'Second approver for AI vendors' },
                    { name: 'Lea Moreau', role: 'Business owner, gets a weekly summary' },
                    { name: 'Daniel Okafor', role: 'Security reviewer on standby' }
                  ].map((p, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Avatar sx={{ width: 26, height: 26, bgcolor: '#080F1C', fontSize: '0.65rem', fontWeight: 700 }}>
                        {p.name.split(' ').map(w => w[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: '0.76rem', fontWeight: 650 }}>{p.name}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#66707B' }}>{p.role}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Card 3: Still in Discovery */}
              <Box sx={{ bgcolor: '#FAFCFA', border: '1px solid #E1E4EA', borderRadius: '16px', p: 2.75, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#161922', mb: 0.25 }}>
                    Still in Discovery
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: '#66707B', mb: 2 }}>
                    2 more apps to review
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icons.FileText size={16} color="#080F1C" />
                        <Box>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Parsewell</Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: '#66707B' }}>AI document parser · 12 users</Typography>
                        </Box>
                      </Box>
                      <Button size="small" sx={{ fontSize: '0.7rem', color: '#6F4CED', textTransform: 'none', fontWeight: 600 }}>
                        Review
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icons.Cloud size={16} color="#080F1C" />
                        <Box>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Kestrel Cloud</Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: '#66707B' }}>2 new AWS accounts · V-0063</Typography>
                        </Box>
                      </Box>
                      <Button size="small" sx={{ fontSize: '0.7rem', color: '#6F4CED', textTransform: 'none', fontWeight: 600 }}>
                        Review
                      </Button>
                    </Box>
                  </Box>
                </Box>

                <Button
                  onClick={handleReturnDiscovery}
                  fullWidth
                  sx={{
                    mt: 3,
                    borderRadius: '9999px',
                    border: '1px solid #E1E4EA',
                    color: '#161922',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    py: 0.75,
                    '&:hover': { bgcolor: '#F8F9FA' }
                  }}
                >
                  Return to Discovery
                </Button>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

