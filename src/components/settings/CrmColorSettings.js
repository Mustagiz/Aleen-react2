import React, { useState } from 'react';
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
  InputAdornment,
  Tabs,
  Tab
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
  Star,
  Devices,
  Architecture
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
    activeThemeConfig,
    designSystem,
    selectDesignSystem,
    availableDesignSystems = [],
    activeSystemConfig
  } = useThemeContext();
  const { showToast } = useFeedback();
  const isDark = mode === 'dark';

  const [settingsMode, setSettingsMode] = useState(0); // 0 = Ecosystem Themes, 1 = Accent Palettes

  const handleSelectEcosystem = (sys) => {
    selectDesignSystem(sys.id);
    if (showToast) {
      showToast(`Switched CRM design system to ${sys.name}`, 'success');
    }
  };

  const handleSelectTheme = (themeItem) => {
    setColorTheme(themeItem.id);
    if (showToast) {
      showToast(`Accent palette updated to ${themeItem.name}`, 'success');
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
          borderRadius: `${activeSystemConfig.shape.cardRadius}px`,
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
                width: 42,
                height: 42,
                borderRadius: `${activeSystemConfig.shape.buttonRadius}px`,
                background: `linear-gradient(135deg, ${activeThemeConfig.primary.light} 0%, ${activeThemeConfig.primary.main} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: `0 4px 12px ${activeThemeConfig.accentGlow}`
              }}
            >
              <Architecture fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.015em' }}>
                CRM Design Systems & Ecosystem Themes
              </Typography>
              <Typography variant="caption" sx={{ color: activeThemeConfig.primary.main, fontWeight: 700, letterSpacing: '0.04em' }}>
                ACTIVE DESIGN SYSTEM: {activeSystemConfig.name.toUpperCase()} ({activeSystemConfig.company})
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 750, mt: 0.5 }}>
            Transform your Aleen CRM into renowned design languages (Apple macOS Liquid Glass, Microsoft Fluent 365, Zoho CRM Enterprise, Linear Minimalist, Salesforce Lightning, Stripe Pro FinTech, Google Material You, or Atelier Haute Couture). 
            Changes apply instantly to typography, geometry, shadows, buttons, and navigation.
          </Typography>
        </Box>

        {/* Quick Mode & Density Toggles */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={toggleTheme}
            startIcon={isDark ? <Brightness7 fontSize="small" sx={{ color: '#F59E0B' }} /> : <Brightness4 fontSize="small" />}
            sx={{
              borderRadius: `${activeSystemConfig.shape.buttonRadius}px`,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              borderColor: 'divider'
            }}
          >
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </Button>

          <Button
            variant="outlined"
            onClick={toggleDensity}
            startIcon={<ViewHeadline fontSize="small" />}
            sx={{
              borderRadius: `${activeSystemConfig.shape.buttonRadius}px`,
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

      {/* Sub-Tabs: Ecosystem Themes vs Accent Colors */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={settingsMode} 
          onChange={(e, val) => setSettingsMode(val)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.88rem',
              py: 1.5,
              minHeight: 48,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main' }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab icon={<Devices fontSize="small" />} iconPosition="start" label={`1. Ecosystem Design Themes (${availableDesignSystems.length})`} />
          <Tab icon={<Palette fontSize="small" />} iconPosition="start" label={`2. Accent Color Harmonizer (${availableThemes.length})`} />
        </Tabs>
      </Box>

      {/* SECTION 1: ECOSYSTEM DESIGN LANGUAGES */}
      {settingsMode === 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome sx={{ color: activeThemeConfig.secondary.main, fontSize: 20 }} />
            Select Ecosystem Design Language
          </Typography>

          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {availableDesignSystems.map((sys) => {
              const isSelected = designSystem === sys.id;
              return (
                <Grid item xs={12} sm={6} lg={3} key={sys.id}>
                  <motion.div
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Card
                      sx={{
                        borderRadius: `${sys.shape.cardRadius}px`,
                        border: '2px solid',
                        borderColor: isSelected ? sys.palette.primary.main : 'divider',
                        bgcolor: isDark ? 'background.paper' : '#FFFFFF',
                        boxShadow: isSelected
                          ? `0 10px 28px ${sys.accentGlow}`
                          : '0 2px 8px rgba(0,0,0,0.03)',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      <CardActionArea
                        onClick={() => handleSelectEcosystem(sys)}
                        sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                      >
                        {/* Top Icon & Badge Header */}
                        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>
                              {sys.icon}
                            </Typography>
                            <Chip
                              label={sys.badge}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                bgcolor: isSelected ? `${sys.palette.primary.main}18` : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                                color: isSelected ? sys.palette.primary.main : 'text.secondary',
                                border: isSelected ? `1px solid ${sys.palette.primary.main}40` : 'none'
                              }}
                            />
                          </Box>

                          {isSelected ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: sys.palette.primary.main }}>
                              <CheckCircle sx={{ fontSize: 18 }} />
                              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>
                                ACTIVE
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.72rem' }}>
                              Apply
                            </Typography>
                          )}
                        </Box>

                        {/* Name & Company */}
                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.02rem', mb: 0.25, color: isSelected ? sys.palette.primary.main : 'text.primary' }}>
                          {sys.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1 }}>
                          {sys.company}
                        </Typography>

                        {/* Tagline Description */}
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45, minHeight: 44, mb: 2 }}>
                          {sys.tagline}
                        </Typography>

                        {/* Geometry Specs Pill Footer */}
                        <Box sx={{ width: '100%', pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                            Card: {sys.shape.cardRadius}px • Btn: {sys.shape.buttonRadius}px
                          </Typography>
                          <Box sx={{ width: 14, height: 14, borderRadius: `${sys.shape.buttonRadius / 2}px`, bgcolor: sys.palette.primary.main }} />
                        </Box>
                      </CardActionArea>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* SECTION 2: ACCENT PALETTES */}
      {settingsMode === 1 && (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Palette sx={{ color: activeThemeConfig.secondary.main, fontSize: 20 }} />
            Customize Accent Color Harmony ({availableThemes.length} Curated Options)
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
                        borderRadius: `${activeSystemConfig.shape.cardRadius}px`,
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
                        {/* Swatches Bar */}
                        <Box sx={{ width: '100%', display: 'flex', height: 24, borderRadius: `${activeSystemConfig.shape.inputRadius}px`, overflow: 'hidden', mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
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
                          {isSelected && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: themeItem.primary.main }}>
                              <CheckCircle sx={{ fontSize: 18 }} />
                              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>
                                ACTIVE
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.02rem', mb: 0.5, color: isSelected ? themeItem.primary.main : 'text.primary' }}>
                          {themeItem.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, minHeight: 32 }}>
                          {themeItem.tagline}
                        </Typography>
                      </CardActionArea>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Live Interactive Preview Sandbox */}
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Star sx={{ color: activeThemeConfig.secondary.main, fontSize: 20 }} />
        Live Preview: {activeSystemConfig.name} Geometry & Materials
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: `${activeSystemConfig.shape.cardRadius}px`,
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
              Button Geometry ({activeSystemConfig.shape.buttonRadius}px Radius) & Tactile Press
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
              <Button variant="contained" color="primary">
                Primary Action
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
                label="Bespoke Order" 
                sx={{ 
                  borderRadius: `${activeSystemConfig.shape.buttonRadius}px`,
                  bgcolor: `${activeThemeConfig.primary.main}18`, 
                  color: activeThemeConfig.primary.main, 
                  fontWeight: 700 
                }} 
              />
              <Chip 
                label="Trial Fitting" 
                sx={{ 
                  borderRadius: `${activeSystemConfig.shape.buttonRadius}px`,
                  bgcolor: `${activeThemeConfig.secondary.main}18`, 
                  color: activeThemeConfig.secondary.main, 
                  fontWeight: 700 
                }} 
              />
              <Chip 
                label="VIP Client" 
                variant="outlined" 
                sx={{ 
                  borderRadius: `${activeSystemConfig.shape.buttonRadius}px`,
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
              Search Field ({activeSystemConfig.shape.inputRadius}px Radius)
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search garments, client records, barcode..."
              defaultValue="Royal Silk Sherwani"
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
                borderRadius: `${activeSystemConfig.shape.cardRadius}px`,
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
                  Today's Boutique Orders
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: activeThemeConfig.primary.main, mt: 0.25 }}>
                  ₹1,48,500
                </Typography>
              </Box>
              <Box
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: `${activeSystemConfig.shape.buttonRadius}px`,
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
              Table & Typography Hierarchy in {activeSystemConfig.name}
            </Typography>
            <Box sx={{ overflowX: 'auto', borderRadius: `${activeSystemConfig.shape.cardRadius}px`, border: '1px solid', borderColor: 'divider' }}>
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
                          borderRadius: `${activeSystemConfig.shape.buttonRadius}px`,
                          bgcolor: `${activeThemeConfig.primary.main}18`, 
                          color: activeThemeConfig.primary.main, 
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
