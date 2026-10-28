import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { COLOR_THEMES, DEFAULT_COLOR_THEME } from '../constants/colorThemes';
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
        return savedTheme || DEFAULT_COLOR_THEME;
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

    const activeSystemConfig = useMemo(() => {
        return DESIGN_SYSTEMS.find(s => s.id === designSystem) || DESIGN_SYSTEMS[0];
    }, [designSystem]);

    const activeThemeConfig = useMemo(() => {
        // If user is using an ecosystem theme like Apple/Microsoft/Zoho and hasn't manually customized a color, use system palette
        const matchingColor = COLOR_THEMES.find(t => t.id === colorTheme);
        return matchingColor || COLOR_THEMES[0];
    }, [colorTheme]);

    // Convenient helper to apply an ecosystem theme and optionally synchronize default colors
    const selectDesignSystem = (systemId) => {
        setDesignSystem(systemId);
        const sys = DESIGN_SYSTEMS.find(s => s.id === systemId);
        if (sys && sys.palette?.primary?.main) {
            // Find if there is a matching color theme or update custom primary
            const matchingColor = COLOR_THEMES.find(c => c.primary.main.toLowerCase() === sys.palette.primary.main.toLowerCase());
            if (matchingColor) {
                setColorTheme(matchingColor.id);
            }
        }
    };

    // Synchronize CSS custom variables for non-MUI components, loaders, borders and raw CSS
    useEffect(() => {
        const root = document.documentElement;
        if (activeSystemConfig && activeThemeConfig) {
            root.style.setProperty('--emerald-primary', activeThemeConfig.primary.main);
            root.style.setProperty('--emerald-light', activeThemeConfig.primary.light);
            root.style.setProperty('--emerald-dark', activeThemeConfig.primary.dark);
            root.style.setProperty('--gold-accent', activeThemeConfig.secondary.main);
            root.style.setProperty('--gold-champagne', activeThemeConfig.secondary.light);
            root.style.setProperty('--accent-glow', activeThemeConfig.accentGlow || activeSystemConfig.accentGlow);
            root.style.setProperty('--radius-card', `${activeSystemConfig.shape.cardRadius}px`);
            root.style.setProperty('--radius-control', `${activeSystemConfig.shape.buttonRadius}px`);
            root.style.setProperty('--radius-inner', `${activeSystemConfig.shape.inputRadius}px`);
            root.style.setProperty('--font-sans', activeSystemConfig.typography.fontFamily);
            root.style.setProperty('--font-serif', activeSystemConfig.typography.h1Font);
        }
    }, [activeSystemConfig, activeThemeConfig]);

    const toggleTheme = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    const toggleDensity = () => {
        setDensity((prev) => (prev === 'comfortable' ? 'compact' : 'comfortable'));
    };

    const theme = useMemo(() =>
        createTheme({
            palette: {
                mode,
                primary: {
                    main: activeThemeConfig.primary.main,
                    light: activeThemeConfig.primary.light,
                    dark: activeThemeConfig.primary.dark,
                    contrastText: activeThemeConfig.primary.contrastText || '#FFFFFF'
                },
                secondary: {
                    main: activeThemeConfig.secondary.main,
                    light: activeThemeConfig.secondary.light,
                    dark: activeThemeConfig.secondary.dark,
                    contrastText: activeThemeConfig.secondary.contrastText || '#FFFFFF'
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
                divider: mode === 'light' ? `${activeThemeConfig.primary.main}1A` : 'rgba(255, 255, 255, 0.08)'
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
                                boxShadow: mode === 'light' ? `0 4px 14px ${activeThemeConfig.accentGlow}` : '0 4px 14px rgba(0, 0, 0, 0.4)'
                            },
                            '&:active': {
                                transform: 'translateY(0) scale(0.985)'
                            }
                        },
                        containedPrimary: {
                            background: activeSystemConfig.buttonStyle?.background || `linear-gradient(135deg, ${activeThemeConfig.primary.light} 0%, ${activeThemeConfig.primary.main} 100%)`,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${activeThemeConfig.primary.main} 0%, ${activeThemeConfig.primary.dark} 100%)`
                            }
                        },
                        containedSecondary: {
                            background: `linear-gradient(135deg, ${activeThemeConfig.secondary.main} 0%, ${activeThemeConfig.secondary.dark} 100%)`,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${activeThemeConfig.secondary.light} 0%, ${activeThemeConfig.secondary.main} 100%)`
                            }
                        },
                        outlined: {
                            borderColor: mode === 'light' ? `${activeThemeConfig.primary.main}2E` : 'rgba(255, 255, 255, 0.12)',
                            '&:hover': {
                                borderColor: activeThemeConfig.primary.main,
                                backgroundColor: mode === 'light' ? `${activeThemeConfig.primary.main}0A` : 'rgba(255, 255, 255, 0.04)'
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
                            backgroundColor: mode === 'light' ? `${activeThemeConfig.primary.main}08` : 'rgba(255, 255, 255, 0.03)',
                            '& .MuiTableCell-head': {
                                color: mode === 'light' ? activeThemeConfig.primary.dark : '#F8FAFC',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                borderBottom: mode === 'light' ? `1px solid ${activeThemeConfig.primary.main}1A` : '1px solid rgba(255, 255, 255, 0.08)'
                            }
                        }
                    }
                },
                MuiTableRow: {
                    styleOverrides: {
                        root: {
                            transition: 'background-color 0.15s ease',
                            '&:hover': {
                                backgroundColor: mode === 'light' ? `${activeThemeConfig.primary.main}08` : 'rgba(255, 255, 255, 0.03)'
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
                            borderColor: mode === 'light' ? `${activeThemeConfig.primary.main}12` : 'rgba(255, 255, 255, 0.06)'
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
                                borderColor: activeThemeConfig.primary.main
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: activeThemeConfig.primary.main,
                                borderWidth: '1.5px'
                            }
                        }
                    }
                }
            }
        }), [mode, density, activeSystemConfig, activeThemeConfig]
    );

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
            activeThemeConfig,
            designSystem,
            setDesignSystem,
            selectDesignSystem,
            availableDesignSystems: DESIGN_SYSTEMS,
            activeSystemConfig
        }}>
            <MUIThemeProvider theme={theme}>
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
};
