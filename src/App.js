import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { FeedbackProvider } from './contexts/FeedbackContext';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';

// Eagerly loaded critical pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Code-split route chunks for lightning-fast boutique tablet and desktop load
const Inventory = lazy(() => import('./pages/Inventory'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Customers = lazy(() => import('./pages/Customers'));
const SalesReports = lazy(() => import('./pages/SalesReports'));
const InventoryReports = lazy(() => import('./pages/InventoryReports'));
const ProfitLoss = lazy(() => import('./pages/ProfitLoss'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Vendors = lazy(() => import('./pages/Vendors'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Barcodes = lazy(() => import('./pages/Barcodes'));
const Marketing = lazy(() => import('./pages/Marketing'));
const PaymentSummary = lazy(() => import('./pages/PaymentSummary'));
const Loyalty = lazy(() => import('./pages/Loyalty'));
const AdvancedReports = lazy(() => import('./pages/AdvancedReports'));
const Settings = lazy(() => import('./pages/Settings'));
const TailoringKanban = lazy(() => import('./pages/TailoringKanban'));
const Devices = lazy(() => import('./pages/Devices'));
const MobileScanner = lazy(() => import('./pages/MobileScanner'));
const PublicBillView = lazy(() => import('./pages/PublicBillView'));

// Luxury Atelier Page Suspense Fallback
const AtelierPageLoader = () => (
  <Box
    sx={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2
    }}
  >
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress size={48} thickness={3.6} sx={{ color: '#0F766E' }} />
    </Box>
    <Typography
      variant="caption"
      sx={{
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontSize: '0.72rem',
        color: 'text.secondary',
        opacity: 0.8
      }}
    >
      Aleen Clothing • Loading
    </Typography>
  </Box>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading && !user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0B1313' }}>
        <CircularProgress sx={{ color: '#0F766E' }} />
      </Box>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
    style={{ width: '100%', height: '100%' }}
  >
    <Suspense fallback={<AtelierPageLoader />}>
      {children}
    </Suspense>
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/mobile-scanner" element={<Suspense fallback={<AtelierPageLoader />}><MobileScanner /></Suspense>} />
        <Route path="/bill/:id" element={<Suspense fallback={<AtelierPageLoader />}><PublicBillView /></Suspense>} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="inventory" element={<PageWrapper><Inventory /></PageWrapper>} />
          <Route path="tailoring" element={<PageWrapper><TailoringKanban /></PageWrapper>} />
          <Route path="kanban" element={<Navigate to="/tailoring" replace />} />
          <Route path="workshop" element={<Navigate to="/tailoring" replace />} />
          <Route path="invoices" element={<PageWrapper><Invoices /></PageWrapper>} />
          <Route path="customers" element={<PageWrapper><Customers /></PageWrapper>} />
          <Route path="sales-reports" element={<PageWrapper><SalesReports /></PageWrapper>} />
          <Route path="inventory-reports" element={<PageWrapper><InventoryReports /></PageWrapper>} />
          <Route path="profit-loss" element={<PageWrapper><ProfitLoss /></PageWrapper>} />
          <Route path="expenses" element={<PageWrapper><Expenses /></PageWrapper>} />
          <Route path="vendors" element={<PageWrapper><Vendors /></PageWrapper>} />
          <Route path="purchases" element={<PageWrapper><Purchases /></PageWrapper>} />
          <Route path="barcodes" element={<PageWrapper><Barcodes /></PageWrapper>} />
          <Route path="devices" element={<PageWrapper><Devices /></PageWrapper>} />
          <Route path="marketing" element={<PageWrapper><Marketing /></PageWrapper>} />
          <Route path="payment-summary" element={<PageWrapper><PaymentSummary /></PageWrapper>} />
          <Route path="loyalty" element={<PageWrapper><Loyalty /></PageWrapper>} />
          <Route path="advanced-reports" element={<PageWrapper><AdvancedReports /></PageWrapper>} />
          <Route path="settings" element={<PageWrapper><Settings /></PageWrapper>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <DataProvider>
            <FeedbackProvider>
              <Router basename={process.env.PUBLIC_URL}>
                <AnimatedRoutes />
              </Router>
            </FeedbackProvider>
          </DataProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
