import React from 'react';
import { Box, Typography } from '@mui/material';

// The house wordmark is a monoline calligraphy signature, and the tagline is
// set as wide-tracked capitals between hairlines — the same lockup on paper and
// on screen.
export const SCRIPT_STACK = '"Great Vibes", "Snell Roundhand", "Apple Chancery", "Segoe Script", cursive';

const ROSE_GOLD = 'linear-gradient(96deg, #A85E3F 0%, #D89A72 24%, #F5DCC6 44%, #C97F5C 66%, #E9B694 84%, #B76E4F 100%)';

export const ScriptWordmark = ({ name, color, metallic = false, fontSize, lineHeight = 1, align = 'left', sx = {} }) => (
  <Typography
    sx={{
      display: 'block',
      fontFamily: SCRIPT_STACK,
      fontWeight: 400,
      fontSize,
      lineHeight,
      letterSpacing: '0.015em',
      textAlign: align,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      ...(metallic
        ? {
            background: ROSE_GOLD,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
          }
        : { color }),
      ...sx
    }}
  >
    {name}
  </Typography>
);

export const TrackedTagline = ({
  text,
  color,
  fontSize = '0.6rem',
  tracking = '0.34em',
  rules = false,
  ruleColor,
  ruleWidth = 30,
  align = 'left',
  sx = {}
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
      gap: rules ? 1.25 : 0,
      minWidth: 0
    }}
  >
    {rules && (
      <Box sx={{ width: ruleWidth, height: '1px', bgcolor: ruleColor || color, flexShrink: 0, opacity: ruleColor ? 1 : 0.75 }} />
    )}
    <Typography
      sx={{
        fontSize,
        fontWeight: 700,
        letterSpacing: tracking,
        textTransform: 'uppercase',
        color,
        lineHeight: 1.35,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        ...sx
      }}
    >
      {text}
    </Typography>
    {rules && (
      <Box sx={{ width: ruleWidth, height: '1px', bgcolor: ruleColor || color, flexShrink: 0, opacity: ruleColor ? 1 : 0.75 }} />
    )}
  </Box>
);
