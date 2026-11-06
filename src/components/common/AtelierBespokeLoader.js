import React from 'react';
import { Box } from '@mui/material';
import { LoaderOne } from '../ui/loader';

/**
 * AtelierBespokeLoader
 * 
 * Signature loading state for Aleen.
 * Renders the clean Aceternity UI LoaderOne animation directly in the center.
 */
export default function AtelierBespokeLoader({
  compact = false,
  fullScreen = false
}) {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: fullScreen ? '100vh' : (compact ? 120 : '50vh'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      <LoaderOne />
    </Box>
  );
}
