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
                fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                h1: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 800, fontSize: '2.4rem', letterSpacing: '-0.02em' },
                h2: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 800, fontSize: '1.9rem', letterSpacing: '-0.015em' },
                h3: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.01em' },
                h4: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, fontSize: '1.3rem', letterSpacing: '-0.005em' },
                h5: { fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.01em' },
                h6: { fontWeight: 700, fontSize: '1rem' },
                subtitle1: { fontSize: '0.95rem', fontWeight: 600 },
                subtitle2: { fontSize: '0.85rem', fontWeight: 700 },
                body1: { fontSize: '0.925rem', lineHeight: 1.6 },
                body2: { fontSize: '0.85rem', lineHeight: 1.5 },
                button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' }
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
                            borderRadius: 14,
                            boxShadow: mode === 'light' 
                                ? '0 4px 20px -2px rgba(15, 118, 110, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)' 
                                : '0 4px 24px rgba(0, 0, 0, 0.5)',
                            backgroundImage: 'none',
                            border: mode === 'light' ? '1px solid rgba(15, 118, 110, 0.1)' : '1px solid rgba(255, 255, 255, 0.07)'
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
