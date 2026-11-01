import React from 'react';
import { Box, MenuItem, Select, useTheme } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

// Shared quick-range presets used by in-card chart filters
export const CHART_RANGE_OPTIONS = [
  { id: '7days', label: 'Last 7 days' },
  { id: '30days', label: 'Last 30 days' },
  { id: 'thisMonth', label: 'This month' },
  { id: 'all', label: 'All time' }
];

export const dateToInputStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Returns { from, to } input-date strings for a preset, or nulls for 'all'
export const computeRangePreset = (preset) => {
  const today = new Date();
  const todayStr = dateToInputStr(today);
  const daysAgo = (n) => {
    const d = new Date(today);
    d.setDate(today.getDate() - n);
    return dateToInputStr(d);
  };
  switch (preset) {
    case '7days': return { from: daysAgo(7), to: todayStr };
    case '30days': return { from: daysAgo(30), to: todayStr };
    case 'thisMonth': return { from: dateToInputStr(new Date(today.getFullYear(), today.getMonth(), 1)), to: todayStr };
    default: return { from: '', to: '' };
  }
};

// Derives which preset (if any) the current from/to pair corresponds to
export const getActiveRangePreset = (dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return 'all';
  const today = new Date();
  const todayStr = dateToInputStr(today);
  if (dateTo === todayStr) {
    if (dateFrom === computeRangePreset('7days').from) return '7days';
    if (dateFrom === computeRangePreset('30days').from) return '30days';
    if (dateFrom === computeRangePreset('thisMonth').from) return 'thisMonth';
  }
  return '';
};

/**
 * Horizon-style compact range selector rendered inside chart card headers.
 * Purely presentational — value/onChange mirror the page's existing filter state.
 */
export default function ChartRangeSelect({ value, onChange, options = CHART_RANGE_OPTIONS, placeholder = 'Custom range', sx }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const selectedLabel = options.find(o => o.id === value)?.label || placeholder;

  return (
    <Select
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      renderValue={() => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <CalendarMonthIcon sx={{ fontSize: 14, color: isDark ? '#9B8FF5' : '#5B4BD1' }} />
          <span>{selectedLabel}</span>
        </Box>
      )}
      MenuProps={{
        PaperProps: {
          sx: {
            mt: 0.5,
            minWidth: 168,
            borderRadius: '12px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#EFEFF4'}`,
            boxShadow: isDark ? '0 12px 32px rgba(0, 0, 0, 0.55)' : '0 12px 32px -8px rgba(31, 27, 46, 0.16)',
            backgroundImage: 'none',
            bgcolor: isDark ? '#1D1A2E' : '#FFFFFF'
          }
        }
      }}
      sx={{
        minWidth: 138,
        height: 30,
        fontSize: '0.72rem',
        fontWeight: 700,
        color: 'text.primary',
        borderRadius: '10px',
        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F9F9FC',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#EFEFF4'}`,
        '& .MuiSelect-select': { py: 0.4, pr: 2.6, display: 'flex', alignItems: 'center' },
        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
        '& .MuiSelect-icon': { fontSize: 16, color: 'text.secondary', right: 6 },
        '&:hover': {
          borderColor: isDark ? 'rgba(155, 143, 245, 0.4)' : '#7C6FE8',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF'
        },
        '&.Mui-focused': {
          borderColor: 'primary.main',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF'
        },
        ...sx
      }}
    >
      {options.map(opt => (
        <MenuItem key={opt.id} value={opt.id} sx={{ fontSize: '0.78rem', fontWeight: 600, py: 0.9 }}>
          {opt.label}
        </MenuItem>
      ))}
    </Select>
  );
}
