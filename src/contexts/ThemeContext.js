import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { COLOR_THEMES, DEFAULT_COLOR_THEME } from '../constants/colorThemes';

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
        localStorage.setItem('crmColorTheme', colorTheme);
    }, [colorTheme]);

    const activeThemeConfig = useMemo(() => {
        return COLOR_THEMES.find(t => t.id === colorTheme) || COLOR_THEMES[0];
    }, [colorTheme]);

    // Synchronize CSS custom variables for non-MUI components, loaders, borders and raw CSS
    useEffect(() => {
        const root = document.documentElement;
        if (activeThemeConfig) {
            root.style.setProperty('--emerald-primary', activeThemeConfig.primary.main);
            root.style.setProperty('--emerald-light', activeThemeConfig.primary.light);
            root.style.setProperty('--emerald-dark', activeThemeConfig.primary.dark);
            root.style.setProperty('--gold-accent', activeThemeConfig.secondary.main);
            root.style.setProperty('--gold-champagne', activeThemeConfig.secondary.light);
            root.style.setProperty('--accent-glow', activeThemeConfig.accentGlow);
        }
    }, [activeThemeConfig]);

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
                        ? (activeThemeConfig.background?.lightDefault || '#FBFBF9') 
                        : (activeThemeConfig.background?.darkDefault || '#081212'),
                    paper: mode === 'light' 
                        ? (activeThemeConfig.background?.lightPaper || '#FFFFFF') 
                        : (activeThemeConfig.background?.darkPaper || '#0F1E1D')
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
                fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                h1: { fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif', fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-0.015em' },
                h2: { fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif', fontWeight: 700, fontSize: '2.0rem', letterSpacing: '-0.01em' },
                h3: { fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif', fontWeight: 600, fontSize: '1.6rem', letterSpacing: '-0.01em' },
                h4: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.015em' },
                h5: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700, fontSize: '1.08rem', letterSpacing: '-0.01em' },
                h6: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700, fontSize: '0.96rem', letterSpacing: '-0.005em' },
                subtitle1: { fontSize: '0.925rem', fontWeight: 600, letterSpacing: '0.01em' },
                subtitle2: { fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' },
                body1: { fontSize: '0.885rem', lineHeight: 1.55, fontFeatureSettings: '"tnum"' },
                body2: { fontSize: '0.82rem', lineHeight: 1.5, fontFeatureSettings: '"tnum"' },
                button: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', textTransform: 'none', fontWeight: 700, letterSpacing: '0.02em' }
            },
            shape: { borderRadius: 10 },
            components: {
                MuiButton: {
                    defaultProps: {
                        disableElevation: true
                    },
                    styleOverrides: {
                        root: {
                            borderRadius: 10,
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
                            background: `linear-gradient(135deg, ${activeThemeConfig.primary.light} 0%, ${activeThemeConfig.primary.main} 100%)`,
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
                            borderRadius: 16
                        }
                    }
                },
                MuiCard: {
                    defaultProps: {
                        elevation: 0
                    },
                    styleOverrides: {
                        root: {
                            borderRadius: 16,
                            border: mode === 'light' ? `1px solid ${activeThemeConfig.primary.main}14` : '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: mode === 'light' ? '0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 10px 25px -5px rgba(0, 0, 0, 0.03)' : '0 4px 20px rgba(0, 0, 0, 0.4)'
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
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: '0.75rem'
                        }
                    }
                },
                MuiOutlinedInput: {
                    styleOverrides: {
                        root: {
                            borderRadius: 10,
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
        }), [mode, density, activeThemeConfig]
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
            activeThemeConfig
        }}>
            <MUIThemeProvider theme={theme}>
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
};
