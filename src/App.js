import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataProvider';
import { AnimatePresence, motion } from 'framer-motion';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
// ... other imports unchanged

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
    style={{ width: '100%', height: '100%' }}
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="inventory" element={<PageWrapper><Inventory /></PageWrapper>} />
          <Route path="invoices" element={<PageWrapper><Invoices /></PageWrapper>} />
          <Route path="customers" element={<PageWrapper><Customers /></PageWrapper>} />
          <Route path="sales-reports" element={<PageWrapper><SalesReports /></PageWrapper>} />
          <Route path="inventory-reports" element={<PageWrapper><InventoryReports /></PageWrapper>} />
          <Route path="profit-loss" element={<PageWrapper><ProfitLoss /></PageWrapper>} />
          <Route path="expenses" element={<PageWrapper><Expenses /></PageWrapper>} />
          <Route path="vendors" element={<PageWrapper><Vendors /></PageWrapper>} />
          <Route path="purchases" element={<PageWrapper><Purchases /></PageWrapper>} />
          <Route path="barcodes" element={<PageWrapper><Barcodes /></PageWrapper>} />
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
      <AuthProvider>
        <DataProvider>
          <Router basename={process.env.PUBLIC_URL}>
            <AnimatedRoutes />
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
