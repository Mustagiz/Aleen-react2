import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const STAGES = [
  { id: 'measurement', label: '1. Measure' },
  { id: 'cutting', label: '2. Cutting' },
  { id: 'stitching', label: '3. Stitching' },
  { id: 'fitting', label: '4. Fitting' },
  { id: 'delivered', label: '5. Ready' }
];

export default function NeedleThreadTracker({
  currentStage = 'stitching',
  sx = {}
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const normalized = String(currentStage || '').toLowerCase();
  const currentIndex = STAGES.findIndex(s => normalized.includes(s.id));
  const activeIdx = currentIndex >= 0 ? currentIndex : 2;

  return (
    <Box
      sx={{
        width: '100%',
        py: 0.8,
        px: 1,
        ...sx
      }}
    >
      {/* Stitch Thread Track */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative'
        }}
      >
        {/* Background Basting Stitch Line */}
        <Box
          sx={{
            position: 'absolute',
            left: '12px',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            borderBottom: '2px dashed',
            borderColor: isDark ? 'rgba(217, 119, 6, 0.25)' : 'rgba(217, 119, 6, 0.2)',
            zIndex: 0
          }}
        />

        {/* Active Golden Thread */}
        <Box
          sx={{
            position: 'absolute',
            left: '12px',
            width: `${(activeIdx / (STAGES.length - 1)) * 92}%`,
            top: '50%',
            transform: 'translateY(-50%)',
            borderBottom: '2px solid',
            borderColor: '#D97706',
            zIndex: 1,
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />

        {/* Stage Nodes */}
        {STAGES.map((stage, idx) => {
          const isPassed = idx <= activeIdx;
          const isCurrent = idx === activeIdx;

          return (
            <Box
              key={stage.id}
              sx={{
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              <Box
                component={isCurrent ? motion.div : 'div'}
                {...(isCurrent ? {
                  animate: { scale: [1, 1.15, 1] },
                  transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
                } : {})}
                sx={{
                  width: isCurrent ? 14 : 10,
                  height: isCurrent ? 14 : 10,
                  borderRadius: '50%',
                  bgcolor: isCurrent
                    ? '#D97706'
                    : isPassed
                      ? (isDark ? '#2DD4BF' : '#0F766E')
                      : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.15)'),
                  border: isCurrent
                    ? '2.5px solid #FFFFFF'
                    : isPassed
                      ? '1.5px solid #FFFFFF'
                      : 'none',
                  boxShadow: isCurrent
                    ? '0 0 10px rgba(217, 119, 6, 0.6)'
                    : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </Box>
          );
        })}
      </Box>

      {/* Clean, Non-Overlapping Phase Status */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 0.85,
          px: 0.5
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.68rem',
            fontWeight: 800,
            color: isDark ? '#FBBF24' : '#0F766E',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {STAGES[activeIdx]?.label || 'Stage'}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.62rem',
            fontWeight: 700,
            color: 'text.secondary',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap'
          }}
        >
          Phase {activeIdx + 1} of {STAGES.length}
        </Typography>
      </Box>
    </Box>
  );
}
