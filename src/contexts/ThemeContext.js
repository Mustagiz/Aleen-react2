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
                    main: '#B76E79', // Rose Gold
                    light: '#D4A5A9',
                    dark: '#8E5059',
                    contrastText: '#ffffff'
                },
                secondary: {
                    main: '#F472B6', // Pink highlight
                    light: '#F9A8D4',
                    dark: '#BE185D',
                    contrastText: '#ffffff'
                },
                background: {
                    default: mode === 'light' ? '#FFF5F6' : '#0B0B14', // Very light pink vs Deep Midnight
                    paper: mode === 'light' ? '#ffffff' : '#151521'
                },
                success: { main: '#10B981' },
                error: { main: '#EF4444' },
                warning: { main: '#F59E0B' },
                info: { main: '#3B82F6' },
                text: {
                    primary: mode === 'light' ? '#374151' : '#F3F4F6',
                    secondary: mode === 'light' ? '#6B7280' : '#9CA3AF'
                }
            },
            typography: {
                fontFamily: '"Poppins", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                h1: { fontWeight: 700, fontSize: '2.5rem' },
                h2: { fontWeight: 700, fontSize: '2rem' },
                h3: { fontWeight: 700, fontSize: '1.75rem' },
                h4: { fontWeight: 600, fontSize: '1.5rem' },
                h5: { fontWeight: 600, fontSize: '1.25rem' },
                h6: { fontWeight: 600, fontSize: '1rem' },
                button: { textTransform: 'none', fontWeight: 600 }
            },
            shape: { borderRadius: 12 },
            components: {
                MuiButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 8,
                            padding: '10px 24px',
                            boxShadow: 'none',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: mode === 'light' ? '0 4px 12px rgba(183, 110, 121, 0.2)' : '0 4px 12px rgba(0,0,0,0.4)',
                            },
                            '&:active': {
                                transform: 'translateY(0) scale(0.98)',
                            }
                        },
                        contained: {
                            '&:hover': {
                                boxShadow: '0 6px 15px rgba(183, 110, 121, 0.3)'
                            }
                        }
                    }
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            borderRadius: 12,
                            boxShadow: mode === 'light' ? '0 10px 25px -5px rgba(183, 110, 121, 0.1), 0 8px 10px -6px rgba(183, 110, 121, 0.05)' : '0 4px 20px rgba(0,0,0,0.4)',
                            backgroundImage: 'none'
                        }
                    }
                },
                MuiCard: {
                    styleOverrides: {
                        root: {
                            borderRadius: 12,
                            boxShadow: mode === 'light' ? '0 10px 25px -5px rgba(183, 110, 121, 0.1), 0 8px 10px -6px rgba(183, 110, 121, 0.05)' : '0 4px 20px rgba(0,0,0,0.4)',
                            backgroundImage: 'none',
                            border: mode === 'light' ? '1px solid rgba(183, 110, 121, 0.1)' : '1px solid rgba(255,255,255,0.05)'
                        }
                    }
                },
                MuiAppBar: {
                    styleOverrides: {
                        root: {
                            boxShadow: 'none',
                            borderBottom: mode === 'light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)'
                        }
                    }
                },
                MuiTextField: {
                    styleOverrides: {
                        root: { '& .MuiOutlinedInput-root': { borderRadius: 8 } }
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
