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
                    main: '#0A4D46', // Velvet Atelier Emerald
                    light: '#14B8A6', // Luminous Jade
                    dark: '#042F2E',  // Deep Royal Forest
                    contrastText: '#FFFFFF'
                },
                secondary: {
                    main: '#C28D4B', // Burnished Imperial Gold
                    light: '#F59E0B', // Radiant Gold
                    dark: '#92400E',
                    contrastText: '#FFFFFF'
                },
                background: {
                    default: mode === 'light' ? '#FBFBF9' : '#081212', // Warm Alabaster Porcelain vs Midnight Obsidian
                    paper: mode === 'light' ? '#FFFFFF' : '#0F1E1D'
                },
                success: { main: '#10B981', light: '#D1FAE5', dark: '#047857' },
                error: { main: '#9F1239', light: '#FFE4E6', dark: '#881337' }, // Velvet Rose-Wine
                warning: { main: '#D97706', light: '#FEF3C7', dark: '#B45309' },
                info: { main: '#0284C7', light: '#E0F2FE', dark: '#0369A1' },
                text: {
                    primary: mode === 'light' ? '#0F172A' : '#F8FAFC',
                    secondary: mode === 'light' ? '#5A6A80' : '#94A3B8'
                },
                divider: mode === 'light' ? 'rgba(10, 77, 70, 0.08)' : 'rgba(255, 255, 255, 0.08)'
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
                                boxShadow: mode === 'light' ? '0 4px 14px rgba(15, 118, 110, 0.18)' : '0 4px 14px rgba(0, 0, 0, 0.4)'
                            },
                            '&:active': {
                                transform: 'translateY(0) scale(0.985)'
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
                            borderRadius: 16,
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
                            border: mode === 'light' ? '1px solid rgba(15, 118, 110, 0.1)' : '1px solid rgba(255, 255, 255, 0.07)'
                        }
                    }
                },
                MuiTableContainer: {
                    styleOverrides: {
                        root: {
                            borderRadius: 20,
                            border: mode === 'light' ? '1px solid rgba(15, 118, 110, 0.14)' : '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: mode === 'light' 
                                ? '0 10px 30px -10px rgba(15, 118, 110, 0.08), 0 1px 3px rgba(0, 0, 0, 0.03)' 
                                : '0 10px 30px rgba(0, 0, 0, 0.4)',
                            backgroundImage: 'none',
                            backgroundColor: mode === 'light' ? '#FFFFFF' : '#0F1E1D',
                            overflow: 'hidden'
                        }
                    }
                },
                MuiTableHead: {
                    styleOverrides: {
                        root: {
                            backgroundColor: mode === 'light' ? 'rgba(15, 118, 110, 0.04)' : 'rgba(255, 255, 255, 0.03)',
                            '& .MuiTableCell-head': {
                                fontWeight: 800,
                                fontSize: '0.74rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: mode === 'light' ? '#0F766E' : '#14B8A6',
                                borderBottom: mode === 'light' ? '1.5px solid rgba(15, 118, 110, 0.16)' : '1.5px solid rgba(255, 255, 255, 0.1)',
                                padding: '14px 18px'
                            }
                        }
                    }
                },
                MuiTableRow: {
                    styleOverrides: {
                        root: {
                            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                            '&.MuiTableRow-hover:hover, &:hover': {
                                backgroundColor: mode === 'light' ? 'rgba(15, 118, 110, 0.025)' : 'rgba(255, 255, 255, 0.025)'
                            },
                            '&:last-child td, &:last-child th': {
                                borderBottom: 0
                            }
                        }
                    }
                },
                MuiTableCell: {
                    styleOverrides: {
                        root: {
                            padding: '14px 18px',
                            fontFeatureSettings: '"tnum"',
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
                            minHeight: 40,
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
