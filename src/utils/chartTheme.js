// src/utils/chartTheme.js
// Utility to produce consistent, theme-adaptive chart colors and options across all design systems (Apple, Zoho, Salesforce, Atelier, etc.)

/**
 * Generates an array of theme-derived colors for categorical/doughnut/bar charts
 * @param {import('@mui/material').Theme} theme 
 * @param {number} count 
 * @returns {string[]} Array of hex/rgba color strings
 */
export const getThemeChartPalette = (theme, count = 6) => {
  const primary = theme?.palette?.primary?.main || '#0F766E';
  const secondary = theme?.palette?.secondary?.main || '#D97706';
  const info = theme?.palette?.info?.main || '#0284C7';
  const success = theme?.palette?.success?.main || '#10B981';
  const warning = theme?.palette?.warning?.main || '#F59E0B';
  const primaryLight = theme?.palette?.primary?.light || primary;
  const secondaryLight = theme?.palette?.secondary?.light || secondary;
  const primaryDark = theme?.palette?.primary?.dark || primary;

  // Curated harmonized sequence starting with theme primary and secondary
  const basePalette = [
    primary,
    secondary,
    info,
    success,
    warning,
    primaryLight,
    secondaryLight,
    primaryDark,
    '#8B5CF6', // Purple accent
    '#EC4899', // Pink accent
    '#06B6D4', // Cyan accent
    '#F97316'  // Orange accent
  ];

  if (count <= basePalette.length) {
    return basePalette.slice(0, count);
  }

  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(basePalette[i % basePalette.length]);
  }
  return result;
};

/**
 * Returns common chart options adapted to the active theme & dark/light mode
 * @param {import('@mui/material').Theme} theme 
 * @param {object} customConfig 
 */
export const getThemeChartOptions = (theme, {
  currency = '₹',
  showLegend = false,
  legendPosition = 'bottom',
  indexAxis = 'x',
  beginAtZero = true
} = {}) => {
  const isDark = theme?.palette?.mode === 'dark';
  const textColor = theme?.palette?.text?.secondary || '#94A3B8';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.92)';

  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis,
    plugins: {
      legend: {
        display: showLegend,
        position: legendPosition,
        labels: {
          color: theme?.palette?.text?.primary || '#0F172A',
          font: { family: theme?.typography?.fontFamily || "'Plus Jakarta Sans', sans-serif", size: 12 },
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: '#FFFFFF',
        bodyColor: '#F8FAFC',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: theme?.typography?.fontFamily || "'Plus Jakarta Sans', sans-serif", size: 13, weight: '700' },
        bodyFont: { family: theme?.typography?.fontFamily || "'Plus Jakarta Sans', sans-serif", size: 12 }
      }
    },
    scales: {
      x: {
        grid: { display: indexAxis === 'y', color: gridColor, borderDash: [4, 4] },
        ticks: {
          color: textColor,
          font: { family: theme?.typography?.fontFamily || "'Plus Jakarta Sans', sans-serif", size: 11 }
        }
      },
      y: {
        beginAtZero,
        grid: { display: indexAxis === 'x', color: gridColor, borderDash: [4, 4] },
        ticks: {
          color: textColor,
          font: { family: theme?.typography?.fontFamily || "'Plus Jakarta Sans', sans-serif", size: 11 },
          callback: (value) => (currency && typeof value === 'number' && indexAxis === 'x' ? `${currency}${value.toLocaleString('en-IN')}` : value)
        }
      }
    }
  };
};
