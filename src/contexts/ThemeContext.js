import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { COLOR_THEMES } from '../constants/colorThemes';
import { DESIGN_SYSTEMS, DEFAULT_DESIGN_SYSTEM } from '../constants/designSystems';

const ThemeContext = createContext();

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        const savedMode = localStorage.getItem('themeMode');
        return savedMode || 'light';
    });

    const [density, setDensity] = useState(() => {
        const savedDensity = localStorage.getItem('themeDensity');
        return savedDensity || 'comfortable';
    });

    const [designSystem, setDesignSystem] = useState(() => {
        const savedSystem = localStorage.getItem('crmDesignSystem');
        return savedSystem || DEFAULT_DESIGN_SYSTEM;
    });

    const [colorTheme, setColorTheme] = useState(() => {
        const savedTheme = localStorage.getItem('crmColorTheme');
        return savedTheme || 'match-system';
    });

    useEffect(() => {
        localStorage.setItem('themeMode', mode);
    }, [mode]);

    useEffect(() => {
        localStorage.setItem('themeDensity', density);
    }, [density]);

    useEffect(() => {
        localStorage.setItem('crmDesignSystem', designSystem);
    }, [designSystem]);

    useEffect(() => {
        localStorage.setItem('crmColorTheme', colorTheme);
    }, [colorTheme]);

    // Active ecosystem configuration
    const activeSystemConfig = useMemo(() => {
        return DESIGN_SYSTEMS.find(s => s.id === designSystem) || DESIGN_SYSTEMS[0];
    }, [designSystem]);

    // Effective primary and secondary palette:
    // If colorTheme is 'match-system', use the ecosystem's native branding colors (Zoho Orange, Apple Blue, MS Blue, etc.)
    // If the user selected an explicit color theme, honor that color palette.
    const activePalette = useMemo(() => {
        if (colorTheme && colorTheme !== 'match-system') {
            const customColor = COLOR_THEMES.find(t => t.id === colorTheme);
            if (customColor) {
                return {
                    primary: customColor.primary,
                    secondary: customColor.secondary,
                    accentGlow: customColor.accentGlow,
                    name: customColor.name
                };
            }
        }
        return {
            primary: activeSystemConfig.palette.primary,
            secondary: activeSystemConfig.palette.secondary,
            accentGlow: activeSystemConfig.accentGlow,
            name: activeSystemConfig.name
        };
    }, [colorTheme, activeSystemConfig]);

    // Computed sidebar styles for the active ecosystem & color
    const computedSidebar = useMemo(() => {
        const sysSidebar = activeSystemConfig.sidebar;
        const isDarkSys = sysSidebar.isDarkSidebar || mode === 'dark';
        const bg = mode === 'light' ? sysSidebar.lightBg : sysSidebar.darkBg;
        
        return {
            bg,
            isDark: isDarkSys,
            textColor: isDarkSys ? (sysSidebar.textColor || '#CBD5E1') : (sysSidebar.textColor || '#334155'),
            textActiveColor: sysSidebar.textActiveColor || '#FFFFFF',
            subheadColor: sysSidebar.subheadColor || (isDarkSys ? '#94A3B8' : '#64748B'),
            activePillBg: sysSidebar.activePillBg || activePalette.primary.main,
            activePillText: sysSidebar.activePillText || '#FFFFFF',
            borderColor: sysSidebar.borderColor || (mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)')
        };
    }, [activeSystemConfig, mode, activePalette]);

    // Computed top navigation bar styles
    const computedTopBar = useMemo(() => {
        const sysTopBar = activeSystemConfig.topBar;
        const isColored = sysTopBar.style === 'colored';
        const bg = mode === 'light' ? sysTopBar.lightBg : sysTopBar.darkBg;
        const textColor = (isColored && mode === 'light') 
            ? '#FFFFFF' 
            : (mode === 'light' ? sysTopBar.textColor || '#0F172A' : '#F8FAFC');

        return {
            bg,
            textColor,
            isColored,
            borderColor: sysTopBar.borderColor || (mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)')
        };
    }, [activeSystemConfig, mode]);

    // User switches design system: resets color to match system automatically for immediate drastic impact
    const selectDesignSystem = (systemId) => {
        setDesignSystem(systemId);
        setColorTheme('match-system');
    };

    // Synchronize CSS custom variables for non-MUI components, loaders, borders and raw CSS
    useEffect(() => {
        const root = document.documentElement;
        if (activeSystemConfig && activePalette) {
            root.setAttribute('data-design-system', activeSystemConfig.id);
            document.body.style.fontFamily = activeSystemConfig.typography.fontFamily;
            root.style.setProperty('--emerald-primary', activePalette.primary.main);
            root.style.setProperty('--emerald-light', activePalette.primary.light);
            root.style.setProperty('--emerald-dark', activePalette.primary.dark);
            root.style.setProperty('--gold-accent', activePalette.secondary.main);
            root.style.setProperty('--gold-champagne', activePalette.secondary.light);
            root.style.setProperty('--accent-glow', activePalette.accentGlow);
            root.style.setProperty('--app-sidebar-bg', computedSidebar.bg);
            root.style.setProperty('--app-sidebar-text', computedSidebar.textColor);
            root.style.setProperty('--app-topbar-bg', computedTopBar.bg);
            root.style.setProperty('--app-topbar-text', computedTopBar.textColor);
            root.style.setProperty('--radius-card', `${activeSystemConfig.shape.cardRadius}px`);
            root.style.setProperty('--radius-control', `${activeSystemConfig.shape.buttonRadius}px`);
            root.style.setProperty('--radius-inner', `${activeSystemConfig.shape.inputRadius}px`);
            root.style.setProperty('--card-radius', `${activeSystemConfig.shape.cardRadius}px`);
            root.style.setProperty('--button-radius', `${activeSystemConfig.shape.buttonRadius}px`);
            root.style.setProperty('--card-border', mode === 'light' ? activeSystemConfig.cardStyle.borderLight : activeSystemConfig.cardStyle.borderDark);
            root.style.setProperty('--card-shadow', mode === 'light' ? activeSystemConfig.cardStyle.boxShadowLight : activeSystemConfig.cardStyle.boxShadowDark);
            root.style.setProperty('--font-sans', activeSystemConfig.typography.fontFamily);
            root.style.setProperty('--font-serif', activeSystemConfig.typography.h1Font);
        }
    }, [activeSystemConfig, activePalette, computedSidebar, computedTopBar, mode]);

    const toggleTheme = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    const toggleDensity = () => {
        setDensity((prev) => (prev === 'comfortable' ? 'compact' : 'comfortable'));
    };

    const theme = useMemo(() => {
        const muiTheme = createTheme({
            palette: {
                mode,
                primary: {
                    main: activePalette.primary.main,
                    light: activePalette.primary.light,
                    dark: activePalette.primary.dark,
                    contrastText: activePalette.primary.contrastText || '#FFFFFF'
                },
                secondary: {
                    main: activePalette.secondary.main,
                    light: activePalette.secondary.light,
                    dark: activePalette.secondary.dark,
                    contrastText: activePalette.secondary.contrastText || '#FFFFFF'
                },
                background: {
                    default: mode === 'light' 
                        ? (activeSystemConfig.palette.background?.lightDefault || '#F8FAFC') 
                        : (activeSystemConfig.palette.background?.darkDefault || '#081212'),
                    paper: mode === 'light' 
                        ? (activeSystemConfig.palette.background?.lightPaper || '#FFFFFF') 
                        : (activeSystemConfig.palette.background?.darkPaper || '#161618')
                },
                success: { main: '#10B981', light: '#D1FAE5', dark: '#047857' },
                error: { main: '#9F1239', light: '#FFE4E6', dark: '#881337' },
                warning: { main: '#D97706', light: '#FEF3C7', dark: '#B45309' },
                info: { main: '#0284C7', light: '#E0F2FE', dark: '#0369A1' },
                text: {
                    primary: mode === 'light' ? '#0F172A' : '#F8FAFC',
                    secondary: mode === 'light' ? '#5A6A80' : '#94A3B8'
                },
                divider: mode === 'light' ? `${activePalette.primary.main}1A` : 'rgba(255, 255, 255, 0.08)'
            },
            typography: {
                fontFamily: activeSystemConfig.typography.fontFamily,
                h1: { fontFamily: activeSystemConfig.typography.h1Font, fontWeight: activeSystemConfig.typography.fontWeightBold, fontSize: '2.5rem', letterSpacing: activeSystemConfig.typography.letterSpacing },
                h2: { fontFamily: activeSystemConfig.typography.h1Font, fontWeight: activeSystemConfig.typography.fontWeightBold, fontSize: '2.0rem', letterSpacing: activeSystemConfig.typography.letterSpacing },
                h3: { fontFamily: activeSystemConfig.typography.h1Font, fontWeight: 600, fontSize: '1.6rem', letterSpacing: activeSystemConfig.typography.letterSpacing },
                h4: { fontFamily: activeSystemConfig.typography.fontFamily, fontWeight: 700, fontSize: '1.25rem', letterSpacing: activeSystemConfig.typography.letterSpacing },
                h5: { fontFamily: activeSystemConfig.typography.fontFamily, fontWeight: 700, fontSize: '1.08rem', letterSpacing: activeSystemConfig.typography.letterSpacing },
                h6: { fontFamily: activeSystemConfig.typography.fontFamily, fontWeight: 700, fontSize: '0.96rem', letterSpacing: activeSystemConfig.typography.letterSpacing },
                subtitle1: { fontSize: '0.925rem', fontWeight: 600, letterSpacing: '0.01em' },
                subtitle2: { fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' },
                body1: { fontSize: '0.885rem', lineHeight: 1.55, fontFeatureSettings: '"tnum"' },
                body2: { fontSize: '0.82rem', lineHeight: 1.5, fontFeatureSettings: '"tnum"' },
                button: { fontFamily: activeSystemConfig.typography.fontFamily, textTransform: 'none', fontWeight: 700, letterSpacing: '0.02em' }
            },
            shape: { borderRadius: activeSystemConfig.shape.borderRadius },
            components: {
                MuiButton: {
                    defaultProps: {
                        disableElevation: true
                    },
                    styleOverrides: {
                        root: {
                            borderRadius: activeSystemConfig.shape.buttonRadius,
                            minHeight: 40,
                            padding: '8px 20px',
                            boxShadow: 'none',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            letterSpacing: '0.015em',
                            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: mode === 'light' ? `0 4px 14px ${activePalette.accentGlow}` : '0 4px 14px rgba(0, 0, 0, 0.4)'
                            },
                            '&:active': {
                                transform: 'translateY(0) scale(0.985)'
                            }
                        },
                        containedPrimary: {
                            background: activeSystemConfig.buttonStyle?.background || `linear-gradient(135deg, ${activePalette.primary.light} 0%, ${activePalette.primary.main} 100%)`,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${activePalette.primary.main} 0%, ${activePalette.primary.dark} 100%)`
                            }
                        },
                        containedSecondary: {
                            background: `linear-gradient(135deg, ${activePalette.secondary.main} 0%, ${activePalette.secondary.dark} 100%)`,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${activePalette.secondary.light} 0%, ${activePalette.secondary.main} 100%)`
                            }
                        },
                        outlined: {
                            borderColor: mode === 'light' ? `${activePalette.primary.main}2E` : 'rgba(255, 255, 255, 0.12)',
                            '&:hover': {
                                borderColor: activePalette.primary.main,
                                backgroundColor: mode === 'light' ? `${activePalette.primary.main}0A` : 'rgba(255, 255, 255, 0.04)'
                            }
                        }
                    }
                },
                MuiPaper: {
                    defaultProps: {
                        elevation: 0
                    },
                    styleOverrides: {
                        root: {
                            backgroundImage: 'none',
                            borderRadius: activeSystemConfig.shape.cardRadius
                        }
                    }
                },
                MuiCard: {
                    defaultProps: {
                        elevation: 0
                    },
                    styleOverrides: {
                        root: {
                            borderRadius: activeSystemConfig.shape.cardRadius,
                            border: mode === 'light' ? activeSystemConfig.cardStyle.borderLight : activeSystemConfig.cardStyle.borderDark,
                            boxShadow: mode === 'light' ? activeSystemConfig.cardStyle.boxShadowLight : activeSystemConfig.cardStyle.boxShadowDark,
                            backdropFilter: activeSystemConfig.cardStyle.backdropFilter || 'none',
                            WebkitBackdropFilter: activeSystemConfig.cardStyle.backdropFilter || 'none'
                        }
                    }
                },
                MuiTableHead: {
                    styleOverrides: {
                        root: {
                            backgroundColor: mode === 'light' ? `${activePalette.primary.main}08` : 'rgba(255, 255, 255, 0.03)',
                            '& .MuiTableCell-head': {
                                color: mode === 'light' ? activePalette.primary.dark : '#F8FAFC',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                borderBottom: mode === 'light' ? `1px solid ${activePalette.primary.main}1A` : '1px solid rgba(255, 255, 255, 0.08)'
                            }
                        }
                    }
                },
                MuiTableRow: {
                    styleOverrides: {
                        root: {
                            transition: 'background-color 0.15s ease',
                            '&:hover': {
                                backgroundColor: mode === 'light' ? `${activePalette.primary.main}08` : 'rgba(255, 255, 255, 0.03)'
                            },
                            '&:last-child td': {
                                borderBottom: 0
                            }
                        }
                    }
                },
                MuiTableCell: {
                    styleOverrides: {
                        root: {
                            padding: density === 'compact' ? '8px 12px' : '14px 18px',
                            fontFeatureSettings: '"tnum"',
                            borderColor: mode === 'light' ? `${activePalette.primary.main}12` : 'rgba(255, 255, 255, 0.06)'
                        }
                    }
                },
                MuiChip: {
                    styleOverrides: {
                        root: {
                            borderRadius: activeSystemConfig.shape.buttonRadius,
                            fontWeight: 700,
                            fontSize: '0.75rem'
                        }
                    }
                },
                MuiOutlinedInput: {
                    styleOverrides: {
                        root: {
                            borderRadius: activeSystemConfig.shape.inputRadius,
                            minHeight: 40,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: activePalette.primary.main
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: activePalette.primary.main,
                                borderWidth: '1.5px'
                            }
                        }
                    }
                }
            }
        });

        // Attach custom layout tokens to theme object for instant access across Layout
        muiTheme.custom = {
            sidebar: computedSidebar,
            topBar: computedTopBar,
            designSystem: activeSystemConfig,
            palette: activePalette
        };

        return muiTheme;
    }, [mode, density, activeSystemConfig, activePalette, computedSidebar, computedTopBar]);

    return (
        <ThemeContext.Provider value={{ 
            mode, 
            toggleTheme, 
            density, 
            toggleDensity, 
            setDensity,
            colorTheme,
            setColorTheme,
            availableThemes: COLOR_THEMES,
            activePalette,
            activeThemeConfig: activePalette,
            designSystem,
            setDesignSystem,
            selectDesignSystem,
            availableDesignSystems: DESIGN_SYSTEMS,
            activeSystemConfig,
            computedSidebar,
            computedTopBar
        }}>
            <MUIThemeProvider theme={theme}>
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
};
