import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import SalesReports from './pages/SalesReports';
import InventoryReports from './pages/InventoryReports';
import ProfitLoss from './pages/ProfitLoss';
import Settings from './pages/Settings';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    primary: { main: '#880e4f', light: '#bc477b', dark: '#560027' }, // Deep Maroon
    secondary: { main: '#f57f17', light: '#ffb04c', dark: '#bc5100' }, // Deep Gold/Ochre
    background: { default: '#fffdf7', paper: '#ffffff' }, // Warm Off-White
    success: { main: '#2e7d32' },
    error: { main: '#c62828' },
    warning: { main: '#ff8f00' },
    info: { main: '#0277bd' },
    text: { primary: '#212121', secondary: '#546e7a' }
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
  shadows: [
    'none',
    '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.06)',
    '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.06)',
    '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)',
    '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    ...Array(19).fill('0 25px 50px -12px rgba(0,0,0,0.25)')
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '10px 24px', boxShadow: 'none' },
        contained: { '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' } }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: { '& .MuiOutlinedInput-root': { borderRadius: 8 } }
      }
    }
  }
});

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <DataProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="sales-reports" element={<SalesReports />} />
                <Route path="inventory-reports" element={<InventoryReports />} />
                <Route path="profit-loss" element={<ProfitLoss />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
