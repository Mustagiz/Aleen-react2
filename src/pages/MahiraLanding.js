import React from 'react';
import { Box } from '@mui/material';

const MahiraLanding = () => {
  return (
    <Box sx={{ width: '100vw', height: '100vh', overflow: 'hidden', bgcolor: '#040906', m: 0, p: 0 }}>
      <iframe
        src="/mahira.html"
        title="Mahira Select — Tradition Meets Tomorrow"
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

export default MahiraLanding;
