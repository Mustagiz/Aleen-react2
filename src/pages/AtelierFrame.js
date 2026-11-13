import React from 'react';
import { Box } from '@mui/material';

const AtelierFrame = ({ src, title }) => {
  return (
    <Box sx={{ width: '100vw', height: '100vh', overflow: 'hidden', bgcolor: '#040906', m: 0, p: 0 }}>
      <iframe
        src={src}
        title={title || "Aleen Clothing — Consciously Curated"}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
      />
    </Box>
  );
};

export default AtelierFrame;

