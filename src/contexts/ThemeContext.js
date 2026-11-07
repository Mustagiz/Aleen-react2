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
        if (!savedSystem || savedSystem === 'atelier') {
            try { localStorage.setItem('crmDesignSystem', 'mandate'); } catch (e) {}
            return 'mandate';
        }
        return savedSystem || 'mandate';
    });

    const [colorTheme, setColorTheme] = useState(() => {
        const savedTheme = localStorage.getItem('crmColorTheme');
        if (!savedTheme || savedTheme === 'atelier-emerald') {
            try { localStorage.setItem('crmColorTheme', 'match-system'); } catch (e) {}
            return 'match-system';
        }
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

    // Computed sidebar styles — supports Mandate Discovery and existing styles
    const computedSidebar = useMemo(() => {
        if (activeSystemConfig?.id === 'mandate') {
            return {
                bg: mode === 'light' ? '#FAFCFA' : '#080F1C',
                isDark: mode === 'dark',
                textColor: mode === 'dark' ? '#CBD5E1' : '#66707B',
                textActiveColor: '#080F1C',
                subheadColor: mode === 'dark' ? '#94A3B8' : '#969DA7',
                activePillBg: mode === 'light' ? '#080F1C' : 'rgba(255, 255, 255, 0.14)',
                activePillText: '#FFFFFF',
                borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(225, 228, 234, 0.8)'
            };
        }
        return {
            bg: mode === 'light' ? '#FFFFFF' : '#1D1A2E',
            isDark: mode === 'dark',
            textColor: mode === 'dark' ? '#CBD5E1' : '#5B5B66',
            textActiveColor: '#7C6FE8',
            subheadColor: mode === 'dark' ? '#94A3B8' : '#9A9AA6',
            activePillBg: mode === 'light' ? '#F1EFFC' : 'rgba(124, 111, 232, 0.16)',
            activePillText: mode === 'light' ? '#5B4BD1' : '#9B8FF5',
            borderColor: mode === 'dark' ? 'transparent' : '#EFEFF4'
        };
    }, [mode, activeSystemConfig]);

    // Computed top navigation bar styles
    const computedTopBar = useMemo(() => {
        const sysTopBar = activeSystemConfig.topBar;
        const isColored = sysTopBar.style === 'colored';
        const bg = mode === 'light' ? sysTopBar.lightBg : sysTopBar.darkBg;
        const textColor = (isColored && mode === 'light') 
            ? '#FFFFFF' 
            : (mode === 'light' 
                ? ((sysTopBar.textColor && sysTopBar.textColor !== '#FFFFFF' && sysTopBar.textColor !== '#F8FAFC') ? sysTopBar.textColor : '#0F172A')
                : '#F8FAFC');

        return {
            bg,
            textColor,
            isColored,
            borderColor: mode === 'dark' ? 'transparent' : (sysTopBar.borderColor || 'rgba(0,0,0,0.08)')
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
            const hexToRgb = (hex) => {
                if (!hex) return '124, 111, 232';
                let c = hex.replace('#', '');
                if (c.length === 3) {
                    c = c.split('').map(char => char + char).join('');
                }
                const num = parseInt(c, 16);
                return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
            };

            root.setAttribute('data-design-system', activeSystemConfig.id);
            document.body.style.fontFamily = activeSystemConfig.typography.fontFamily;
            root.style.setProperty('--emerald-primary', activePalette.primary.main);
            root.style.setProperty('--emerald-light', activePalette.primary.light);
            root.style.setProperty('--emerald-dark', activePalette.primary.dark);
            root.style.setProperty('--primary-main', activePalette.primary.main);
            root.style.setProperty('--primary-light', activePalette.primary.light);
            root.style.setProperty('--primary-dark', activePalette.primary.dark);
            root.style.setProperty('--primary-contrast', activePalette.primary.contrastText || '#FFFFFF');
            root.style.setProperty('--primary-rgb', hexToRgb(activePalette.primary.main));
            root.style.setProperty('--secondary-rgb', hexToRgb(activePalette.secondary.main));
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
            const effectiveButtonBg = (colorTheme && colorTheme !== 'match-system')
                ? `linear-gradient(135deg, ${activePalette.primary.light} 0%, ${activePalette.primary.main} 100%)`
                : (activeSystemConfig.buttonStyle?.background || activePalette.primary.main);
            root.style.setProperty('--button-bg', effectiveButtonBg);
            root.style.setProperty('--card-border', mode === 'light' ? activeSystemConfig.cardStyle.borderLight : activeSystemConfig.cardStyle.borderDark);
            root.style.setProperty('--card-shadow', mode === 'light' ? activeSystemConfig.cardStyle.boxShadowLight : activeSystemConfig.cardStyle.boxShadowDark);
            root.style.setProperty('--font-sans', activeSystemConfig.typography.fontFamily);
            root.style.setProperty('--font-serif', activeSystemConfig.typography.h1Font);

            // Mandate Design System Specific Tokens
            root.style.setProperty('--stage', '#D7DBDF');
            root.style.setProperty('--app-shell', mode === 'light' ? '#ECEEF2' : '#080F1C');
            root.style.setProperty('--surface', mode === 'light' ? '#FAFCFA' : '#111827');
            root.style.setProperty('--surface-soft', mode === 'light' ? '#F2F3F6' : '#172033');
            root.style.setProperty('--surface-inset', mode === 'light' ? '#E9EBF0' : '#1D273B');
            root.style.setProperty('--ink', '#080F1C');
            root.style.setProperty('--ink-hover', '#1D2531');
            root.style.setProperty('--outline', mode === 'light' ? '#E1E4EA' : 'rgba(255, 255, 255, 0.1)');
            root.style.setProperty('--violet', '#6F4CED');
            root.style.setProperty('--violet-soft', '#EFEBFF');
            root.style.setProperty('--risk-low', '#2A875B');
            root.style.setProperty('--risk-mid', '#CE8F0B');
            root.style.setProperty('--risk-high', '#D46521');
            root.style.setProperty('--risk-critical', '#C33A4D');
        }
    }, [activeSystemConfig, activePalette, computedSidebar, computedTopBar, mode, colorTheme]);

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
                        : (activeSystemConfig.palette.background?.darkDefault || '#14121F'),
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
                            minHeight: activeSystemConfig.id === 'zoho' || activeSystemConfig.id === 'microsoft' ? 36 : 40,
                            padding: activeSystemConfig.id === 'material' ? '10px 24px' : (activeSystemConfig.id === 'microsoft' || activeSystemConfig.id === 'zoho' ? '6px 16px' : '8px 20px'),
                            boxShadow: 'none',
                            fontWeight: activeSystemConfig.id === 'microsoft' || activeSystemConfig.id === 'atelier' ? 600 : 700,
                            fontSize: activeSystemConfig.id === 'zoho' || activeSystemConfig.id === 'microsoft' ? '0.81rem' : '0.84rem',
                            letterSpacing: activeSystemConfig.typography.letterSpacing || '0.015em',
                            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                            '&:hover': {
                                transform: activeSystemConfig.id === 'microsoft' ? 'none' : 'translateY(-1px)',
                                boxShadow: mode === 'light' ? `0 4px 14px ${activePalette.accentGlow}` : '0 4px 14px rgba(0, 0, 0, 0.4)'
                            },
                            '&:active': {
                                transform: 'translateY(0) scale(0.985)'
                            }
                        },
                        containedPrimary: {
                            background: activeSystemConfig.buttonStyle?.background || `linear-gradient(135deg, ${activePalette.primary.light} 0%, ${activePalette.primary.main} 100%)`,
                            '&:hover': {
                                background: activeSystemConfig.id === 'microsoft' ? activePalette.primary.dark : `linear-gradient(135deg, ${activePalette.primary.main} 0%, ${activePalette.primary.dark} 100%)`
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
                MuiTableContainer: {
                    styleOverrides: {
                        root: {
                            borderRadius: 14,
                            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#EFEFF4'}`,
                            boxShadow: mode === 'dark'
                                ? '0 4px 24px rgba(0, 0, 0, 0.35)'
                                : '0 2px 12px rgba(112, 114, 176, 0.08)',
                            overflow: 'hidden'
                        }
                    }
                },
                MuiTableHead: {
                    styleOverrides: {
                        root: {
                            backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
                            borderTop: 'none',
                            '& .MuiTableCell-head': {
                                color: mode === 'dark' ? '#94A3B8' : '#5A6A80',
                                fontWeight: 800,
                                fontSize: '0.72rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.07em',
                                fontFamily: activeSystemConfig.typography.fontFamily,
                                borderBottom: mode === 'light' ? '1px solid #EFEFF4' : '1px solid rgba(255, 255, 255, 0.08)'
                            }
                        }
                    }
                },
                MuiTableRow: {
                    styleOverrides: {
                        root: {
                            transition: 'background-color 0.15s ease',
                            '&:nth-of-type(even)': {
                                backgroundColor: 'transparent'
                            },
                            '&:hover': {
                                backgroundColor: mode === 'light' ? `${activePalette.primary.main}0C` : 'rgba(255, 255, 255, 0.04)'
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
                            fontFamily: activeSystemConfig.typography.fontFamily,
                            fontFeatureSettings: '"tnum"',
                            borderColor: mode === 'light' ? '#EFEFF4' : 'rgba(255, 255, 255, 0.06)'
                        }
                    }
                },
                MuiTablePagination: {
                    styleOverrides: {
                        root: {
                            borderTop: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#EFEFF4'}`
                        },
                        toolbar: {
                            minHeight: 52,
                            paddingLeft: 16,
                            paddingRight: 16
                        },
                        selectLabel: {
                            fontSize: '0.78rem',
                            fontWeight: 600
                        },
                        displayedRows: {
                            fontSize: '0.78rem',
                            fontWeight: 600
                        }
                    }
                },
                MuiChip: {
                    styleOverrides: {
                        root: {
                            borderRadius: 7,
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            fontFamily: activeSystemConfig.id === 'linear' ? 'monospace' : activeSystemConfig.typography.fontFamily
                        }
                    }
                },
                MuiDialog: {
                    styleOverrides: {
                        paper: {
                            borderRadius: activeSystemConfig.shape.cardRadius || 18,
                            backgroundImage: 'none',
                            backgroundColor: mode === 'dark' ? activePalette.background.paper : '#FFFFFF',
                            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(225, 228, 234, 0.85)'}`,
                            boxShadow: mode === 'dark'
                                ? '0 28px 72px rgba(0, 0, 0, 0.65)'
                                : '0 24px 64px -8px rgba(8, 15, 28, 0.16), 0 8px 24px -4px rgba(8, 15, 28, 0.08)',
                            overflow: 'hidden'
                        }
                    }
                },
                MuiBackdrop: {
                    styleOverrides: {
                        root: {
                            backgroundColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.72)' : 'rgba(8, 15, 28, 0.45)',
                            backdropFilter: 'blur(6px)',
                            WebkitBackdropFilter: 'blur(6px)'
                        }
                    }
                },
                MuiDialogTitle: {
                    styleOverrides: {
                        root: {
                            fontFamily: activeSystemConfig.typography.fontFamily,
                            fontWeight: 700,
                            fontSize: '1.08rem',
                            letterSpacing: '-0.01em',
                            lineHeight: 1.3,
                            color: mode === 'dark' ? '#F9FAFB' : '#080F1C',
                            backgroundColor: mode === 'dark' ? activePalette.background.paper : '#FFFFFF',
                            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(225, 228, 234, 0.75)'}`,
                            padding: '18px 24px'
                        }
                    }
                },
                MuiDialogContent: {
                    styleOverrides: {
                        root: {
                            padding: '20px 24px'
                        },
                        dividers: {
                            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(225, 228, 234, 0.75)'
                        }
                    }
                },
                MuiDialogContentText: {
                    styleOverrides: {
                        root: {
                            color: mode === 'dark' ? '#9CA3AF' : '#66707B',
                            fontSize: '0.875rem',
                            lineHeight: 1.6
                        }
                    }
                },
                MuiDialogActions: {
                    styleOverrides: {
                        root: {
                            padding: '16px 24px',
                            gap: 10,
                            borderTop: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(225, 228, 234, 0.75)'}`,
                            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(248, 249, 252, 0.75)'
                        }
                    }
                },
                MuiPopover: {
                    styleOverrides: {
                        paper: {
                            borderRadius: 10
                        }
                    }
                },
                MuiMenu: {
                    styleOverrides: {
                        paper: {
                            borderRadius: 10
                        }
                    }
                },
                MuiOutlinedInput: {
                    styleOverrides: {
                        root: {
                            borderRadius: activeSystemConfig.shape.inputRadius || 9,
                            minHeight: activeSystemConfig.id === 'zoho' || activeSystemConfig.id === 'microsoft' ? 36 : 40,
                            fontFamily: activeSystemConfig.typography.fontFamily,
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
