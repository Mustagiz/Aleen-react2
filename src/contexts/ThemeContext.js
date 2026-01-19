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
                    main: '#880e4f',
                    light: '#bc477b',
                    dark: '#560027',
                    contrastText: '#ffffff'
                },
                secondary: {
                    main: '#f57f17',
                    light: '#ffb04c',
                    dark: '#bc5100',
                    contrastText: '#ffffff'
                },
                background: {
                    default: mode === 'light' ? '#fffdf7' : '#121212',
                    paper: mode === 'light' ? '#ffffff' : '#1e1e1e'
                },
                success: { main: '#2e7d32' },
                error: { main: '#c62828' },
                warning: { main: '#ff8f00' },
                info: { main: '#0277bd' },
                text: {
                    primary: mode === 'light' ? '#212121' : '#e0e0e0',
                    secondary: mode === 'light' ? '#546e7a' : '#90a4ae'
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
                        root: { borderRadius: 8, padding: '10px 24px', boxShadow: 'none' },
                        contained: { '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' } }
                    }
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            borderRadius: 12,
                            boxShadow: mode === 'light' ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : '0 4px 20px rgba(0,0,0,0.4)',
                            backgroundImage: 'none'
                        }
                    }
                },
                MuiCard: {
                    styleOverrides: {
                        root: {
                            borderRadius: 12,
                            boxShadow: mode === 'light' ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : '0 4px 20px rgba(0,0,0,0.4)',
                            backgroundImage: 'none'
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
