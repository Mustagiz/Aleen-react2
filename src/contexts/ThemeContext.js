import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        const savedMode = localStorage.getItem('themeMode');
        return savedMode || 'light';
    });

    useEffect(() => {
        localStorage.setItem('themeMode', mode);
    }, [mode]);

    const toggleTheme = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    const theme = useMemo(() =>
        createTheme({
            palette: {
                mode,
                primary: {
                    main: '#0F766E', // Deep Emerald
                    light: '#14B8A6', // Luminous Emerald
                    dark: '#042F2E',  // Royal Forest
                    contrastText: '#FFFFFF'
                },
                secondary: {
                    main: '#D97706', // Champagne Gold
                    light: '#F59E0B',
                    dark: '#92400E',
                    contrastText: '#FFFFFF'
                },
                background: {
                    default: mode === 'light' ? '#F8FAFC' : '#081212', // Porcelain vs Midnight Atelier
                    paper: mode === 'light' ? '#FFFFFF' : '#102020'
                },
                success: { main: '#10B981', light: '#D1FAE5', dark: '#047857' },
                error: { main: '#EF4444', light: '#FEE2E2', dark: '#B91C1C' },
                warning: { main: '#D97706', light: '#FEF3C7', dark: '#B45309' },
                info: { main: '#0284C7', light: '#E0F2FE', dark: '#0369A1' },
                text: {
                    primary: mode === 'light' ? '#0F172A' : '#F8FAFC',
                    secondary: mode === 'light' ? '#64748B' : '#94A3B8'
                },
                divider: mode === 'light' ? 'rgba(15, 118, 110, 0.12)' : 'rgba(255, 255, 255, 0.08)'
            },
            typography: {
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                h1: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 800, fontSize: '2.2rem', letterSpacing: '-0.03em' },
                h2: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.025em' },
                h3: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.02em' },
                h4: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.015em' },
                h5: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 600, fontSize: '1.05rem', letterSpacing: '-0.01em' },
                h6: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 600, fontSize: '0.95rem', letterSpacing: '-0.005em' },
                subtitle1: { fontSize: '0.925rem', fontWeight: 600, letterSpacing: '-0.01em' },
                subtitle2: { fontSize: '0.84rem', fontWeight: 600, letterSpacing: '-0.005em' },
                body1: { fontSize: '0.885rem', lineHeight: 1.55 },
                body2: { fontSize: '0.82rem', lineHeight: 1.5 },
                button: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' }
            },
            shape: { borderRadius: 12 },
            components: {
                MuiButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 10,
                            padding: '8px 20px',
                            boxShadow: 'none',
                            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: mode === 'light' ? '0 4px 14px rgba(15, 118, 110, 0.18)' : '0 4px 14px rgba(0, 0, 0, 0.4)'
                            },
                            '&:active': {
                                transform: 'translateY(0) scale(0.98)'
                            }
                        },
                        containedPrimary: {
                            background: 'linear-gradient(135deg, #0F766E 0%, #0D6962 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #115E59 0%, #042F2E 100%)'
                            }
                        },
                        containedSecondary: {
                            background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                            color: '#FFFFFF',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #B45309 0%, #78350F 100%)'
                            }
                        }
                    }
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            borderRadius: 14,
                            boxShadow: mode === 'light' 
                                ? '0 4px 20px -2px rgba(15, 118, 110, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)' 
                                : '0 4px 24px rgba(0, 0, 0, 0.5)',
                            backgroundImage: 'none',
                            border: mode === 'light' ? '1px solid rgba(15, 118, 110, 0.1)' : '1px solid rgba(255, 255, 255, 0.07)'
                        }
                    }
                },
                MuiCard: {
                    styleOverrides: {
                        root: {
                            borderRadius: 16,
                            boxShadow: mode === 'light' 
                                ? '0 4px 20px -2px rgba(15, 118, 110, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)' 
                                : '0 4px 24px rgba(0, 0, 0, 0.5)',
                            backgroundImage: 'none',
                            border: mode === 'light' ? '1px solid rgba(15, 118, 110, 0.12)' : '1px solid rgba(255, 255, 255, 0.08)',
                            transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, border-color 0.22s ease',
                            '&:hover': {
                                transform: 'translateY(-3px)',
                                borderColor: mode === 'light' ? 'rgba(15, 118, 110, 0.35)' : 'rgba(20, 184, 166, 0.35)',
                                boxShadow: mode === 'light'
                                    ? '0 12px 28px -4px rgba(15, 118, 110, 0.14), 0 2px 8px rgba(0, 0, 0, 0.04)'
                                    : '0 14px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(20, 184, 166, 0.12)'
                            }
                        }
                    }
                },
                MuiTableHead: {
                    styleOverrides: {
                        root: {
                            backgroundColor: mode === 'light' ? 'rgba(15, 118, 110, 0.04)' : 'rgba(255, 255, 255, 0.03)',
                            '& .MuiTableCell-head': {
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                color: mode === 'light' ? '#0F766E' : '#14B8A6',
                                borderBottom: mode === 'light' ? '1.5px solid rgba(15, 118, 110, 0.15)' : '1.5px solid rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                },
                MuiTableCell: {
                    styleOverrides: {
                        root: {
                            padding: '12px 16px',
                            borderColor: mode === 'light' ? 'rgba(15, 118, 110, 0.08)' : 'rgba(255, 255, 255, 0.06)'
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
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#0F766E'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#0F766E',
                                borderWidth: '1.5px'
                            }
                        }
                    }
                }
            }
        }), [mode]
    );

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <MUIThemeProvider theme={theme}>
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
};
