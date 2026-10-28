import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Card,
  CardActionArea,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  CheckCircle,
  Palette,
  Brightness4,
  Brightness7,
  ViewHeadline,
  TrendingUp,
  Search,
  AutoAwesome,
  Star
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useFeedback } from '../../contexts/FeedbackContext';

export default function CrmColorSettings() {
  const { 
    mode, 
    toggleTheme, 
    density, 
    toggleDensity, 
    colorTheme, 
    setColorTheme, 
    availableThemes = [], 
    activeThemeConfig 
  } = useThemeContext();
  const { showToast } = useFeedback();
  const isDark = mode === 'dark';

  const handleSelectTheme = (themeItem) => {
    setColorTheme(themeItem.id);
    if (showToast) {
      showToast(`CRM Theme updated to ${themeItem.name}`, 'success');
    }
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 3.5,
          borderRadius: 3.5,
          border: '1px solid',
          borderColor: 'divider',
          background: isDark
            ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
            : `linear-gradient(135deg, ${activeThemeConfig.primary.main}08 0%, #FFFFFF 100%)`,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2.5
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${activeThemeConfig.primary.light} 0%, ${activeThemeConfig.primary.main} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: `0 4px 12px ${activeThemeConfig.accentGlow}`
              }}
            >
              <Palette fontSize="small" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.015em' }}>
              CRM Haute Couture Themes & Palette
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 700 }}>
            Choose from 8 meticulously tailored luxury color palettes designed for high-end boutique ateliers. 
            All changes apply instantly across your navigation, cards, buttons, badges, tables, and invoice headers.
          </Typography>
        </Box>

        {/* Quick Mode & Density Toggles */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={toggleTheme}
            startIcon={isDark ? <Brightness7 fontSize="small" sx={{ color: '#F59E0B' }} /> : <Brightness4 fontSize="small" />}
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              borderColor: 'divider'
            }}
          >
            {isDark ? 'Dark Mode Active' : 'Light Mode Active'}
          </Button>

          <Button
            variant="outlined"
            onClick={toggleDensity}
            startIcon={<ViewHeadline fontSize="small" />}
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              borderColor: 'divider'
            }}
          >
            Density: {density === 'compact' ? 'Compact' : 'Comfortable'}
          </Button>
        </Box>
      </Paper>

      {/* 8 Curated Luxury Color Themes Grid */}
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesome sx={{ color: activeThemeConfig.secondary.main, fontSize: 20 }} />
        Select Workspace Color Harmony ({availableThemes.length} Curated Options)
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {availableThemes.map((themeItem) => {
          const isSelected = colorTheme === themeItem.id;
          return (
            <Grid item xs={12} sm={6} lg={3} key={themeItem.id}>
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Card
                  sx={{
                    borderRadius: 3.5,
                    border: '2px solid',
                    borderColor: isSelected ? themeItem.primary.main : 'divider',
                    bgcolor: isDark ? 'background.paper' : '#FFFFFF',
                    boxShadow: isSelected
                      ? `0 8px 24px ${themeItem.accentGlow}`
                      : '0 2px 10px rgba(0,0,0,0.03)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <CardActionArea
                    onClick={() => handleSelectTheme(themeItem)}
                    sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    {/* Top Palette Swatches */}
                    <Box sx={{ width: '100%', display: 'flex', height: 26, borderRadius: 1.5, overflow: 'hidden', mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                      {themeItem.previewColors.map((colorVal, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            flex: 1,
                            bgcolor: colorVal,
                            borderRight: idx < themeItem.previewColors.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none'
                          }}
                        />
                      ))}
                    </Box>

                    {/* Badge & Active Indicator */}
                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Chip
                        label={themeItem.badge}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          bgcolor: isSelected ? `${themeItem.primary.main}18` : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                          color: isSelected ? themeItem.primary.main : 'text.secondary',
                          border: isSelected ? `1px solid ${themeItem.primary.main}40` : 'none'
                        }}
                      />
                      {isSelected ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: themeItem.primary.main }}>
                          <CheckCircle sx={{ fontSize: 18 }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>
                            ACTIVE
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.72rem' }}>
                          Click to apply
                        </Typography>
                      )}
                    </Box>

                    {/* Theme Name & Tagline */}
                    <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.02rem', mb: 0.5, color: isSelected ? themeItem.primary.main : 'text.primary' }}>
                      {themeItem.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, minHeight: 32 }}>
                      {themeItem.tagline}
                    </Typography>

                    {/* Color Swatch Dots */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: themeItem.primary.main, border: '1px solid rgba(255,255,255,0.3)' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 600 }}>
                          {themeItem.primary.main}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 'auto' }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: themeItem.secondary.main, border: '1px solid rgba(255,255,255,0.3)' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 600 }}>
                          {themeItem.secondary.main}
                        </Typography>
                      </Box>
                    </Box>
                  </CardActionArea>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      {/* Live Interactive Preview Sandbox */}
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Star sx={{ color: activeThemeConfig.secondary.main, fontSize: 20 }} />
        Live Component Preview in "{activeThemeConfig.name}"
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}
      >
        <Grid container spacing={3}>
          {/* Section 1: Buttons & Interactive Elements */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
              Button Variants & Accent Lighting
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
              <Button variant="contained" color="primary">
                Contained Primary
              </Button>
              <Button variant="contained" color="secondary">
                Secondary Accent
              </Button>
              <Button variant="outlined" color="primary">
                Outlined
              </Button>
            </Box>

            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
              Status Badges & Chips
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label="Ready for Fitting" 
                sx={{ 
                  bgcolor: `${activeThemeConfig.primary.main}18`, 
                  color: activeThemeConfig.primary.main, 
                  fontWeight: 700 
                }} 
              />
              <Chip 
                label="Bespoke Order" 
                sx={{ 
                  bgcolor: `${activeThemeConfig.secondary.main}18`, 
                  color: activeThemeConfig.secondary.main, 
                  fontWeight: 700 
                }} 
              />
              <Chip 
                label="VIP Client" 
                variant="outlined" 
                sx={{ 
                  borderColor: activeThemeConfig.primary.main, 
                  color: activeThemeConfig.primary.main, 
                  fontWeight: 700 
                }} 
              />
            </Box>
          </Grid>

          {/* Section 2: Input Field & KPI Card Preview */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
              Input Focus & Search Field
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search garments, client records, barcode..."
              defaultValue="Royal Velvet Sherwani"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: activeThemeConfig.primary.main }} />
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2.5 }}
            />

            {/* Micro KPI Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: '1px solid',
                borderColor: `${activeThemeConfig.primary.main}22`,
                background: isDark
                  ? 'rgba(255,255,255,0.03)'
                  : `linear-gradient(135deg, ${activeThemeConfig.primary.main}08 0%, #FFFFFF 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  Today's Boutique Revenue
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: activeThemeConfig.primary.main, mt: 0.25 }}>
                  ₹1,48,500
                </Typography>
              </Box>
              <Box
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: `${activeThemeConfig.primary.main}18`,
                  color: activeThemeConfig.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontWeight: 800,
                  fontSize: '0.75rem'
                }}
              >
                <TrendingUp sx={{ fontSize: 16 }} /> +24.8%
              </Box>
            </Paper>
          </Grid>

          {/* Section 3: Table Styling Preview */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', my: 2 }}>
              Table Row & Typography Presentation
            </Typography>
            <Box sx={{ overflowX: 'auto', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
              <Table size={density === 'compact' ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Client Name</TableCell>
                    <TableCell>Garment & Fabric</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Atelier Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>#ALN-2026-089</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Nawab Saif Ali</TableCell>
                    <TableCell>Hand-embroidered Raw Silk Achkan</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: activeThemeConfig.primary.main }}>₹85,000</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label="In Embroidery" 
                        size="small" 
                        sx={{ 
                          height: 22, 
                          bgcolor: `${activeThemeConfig.primary.main}18`, 
                          color: activeThemeConfig.primary.main, 
                          fontWeight: 700 
                        }} 
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>#ALN-2026-090</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Begum Zoya Khan</TableCell>
                    <TableCell>Zardozi Bridal Lehenga (Pure Velvet)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: activeThemeConfig.primary.main }}>₹1,65,000</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label="Trial Fitting Ready" 
                        size="small" 
                        sx={{ 
                          height: 22, 
                          bgcolor: `${activeThemeConfig.secondary.main}18`, 
                          color: activeThemeConfig.secondary.main, 
                          fontWeight: 700 
                        }} 
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
