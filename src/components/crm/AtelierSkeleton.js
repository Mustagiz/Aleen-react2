import React from 'react';
import { Box, Skeleton, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

/**
 * Luxury Atelier Shimmer Skeleton Components
 * High-performance, anti-layout-shift placeholders with custom emerald/champagne shimmer.
 */

export const TableSkeleton = ({ rows = 6, cols = 7, isDark = false }) => (
  <TableContainer
    component={Paper}
    elevation={0}
    sx={{
      border: '1px solid',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'divider',
      borderRadius: 2.5,
      overflow: 'hidden',
      bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'background.paper'
    }}
  >
    <Table size="small">
      <TableHead sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 118, 110, 0.04)' }}>
        <TableRow>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <TableCell key={cIdx} sx={{ py: 1.5 }}>
              <Skeleton
                variant="text"
                width={cIdx === 0 ? 60 : cIdx === 1 ? 120 : 80}
                height={20}
                sx={{ borderRadius: 1 }}
              />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, rIdx) => (
          <TableRow key={rIdx} sx={{ '&:last-child td': { border: 0 } }}>
            {Array.from({ length: cols }).map((_, cIdx) => (
              <TableCell key={cIdx} sx={{ py: 1.75 }}>
                <Skeleton
                  variant={cIdx === 1 ? 'rectangular' : 'text'}
                  width={cIdx === 0 ? 50 : cIdx === 1 ? '85%' : cIdx === cols - 1 ? 70 : '60%'}
                  height={cIdx === 1 ? 24 : 18}
                  sx={{ borderRadius: 1 }}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export const KpiGridSkeleton = ({ count = 4 }) => (
  <Grid container spacing={2} sx={{ mb: 3 }}>
    {Array.from({ length: count }).map((_, idx) => (
      <Grid item xs={12} sm={6} md={12 / count} key={idx}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton variant="text" width={100} height={18} sx={{ borderRadius: 1 }} />
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
          <Skeleton variant="text" width={140} height={36} sx={{ borderRadius: 1 }} />
          <Skeleton variant="text" width={80} height={16} sx={{ borderRadius: 1 }} />
        </Paper>
      </Grid>
    ))}
  </Grid>
);

export const CardGridSkeleton = ({ count = 6 }) => (
  <Grid container spacing={2}>
    {Array.from({ length: count }).map((_, idx) => (
      <Grid item xs={12} sm={6} md={4} key={idx}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="70%" height={22} sx={{ borderRadius: 1 }} />
              <Skeleton variant="text" width="40%" height={16} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
          <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Skeleton variant="text" width={60} height={20} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rounded" width={80} height={28} sx={{ borderRadius: 2 }} />
          </Box>
        </Paper>
      </Grid>
    ))}
  </Grid>
);

export default {
  TableSkeleton,
  KpiGridSkeleton,
  CardGridSkeleton
};
