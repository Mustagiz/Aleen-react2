import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import SalesReports from './pages/SalesReports';
import InventoryReports from './pages/InventoryReports';
import ProfitLoss from './pages/ProfitLoss';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import Vendors from './pages/Vendors';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import Barcodes from './pages/Barcodes';
import Marketing from './pages/Marketing';
import PaymentSummary from './pages/PaymentSummary';
import Loyalty from './pages/Loyalty';
import AdvancedReports from './pages/AdvancedReports';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>; // Or a nice centered spinner
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user && user.role === 'admin' ? children : <Navigate to="/" />;
};

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <DataProvider>
          <Router basename={process.env.PUBLIC_URL}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="customers" element={<Customers />} />
                <Route path="sales-reports" element={<SalesReports />} />
                <Route path="inventory-reports" element={<InventoryReports />} />
                <Route path="profit-loss" element={<AdminRoute><ProfitLoss /></AdminRoute>} />
                <Route path="expenses" element={<AdminRoute><Expenses /></AdminRoute>} />
                <Route path="vendors" element={<AdminRoute><Vendors /></AdminRoute>} />
                <Route path="purchases" element={<AdminRoute><Purchases /></AdminRoute>} />
                <Route path="barcodes" element={<Barcodes />} />
                <Route path="marketing" element={<Marketing />} />
                <Route path="payment-summary" element={<AdminRoute><PaymentSummary /></AdminRoute>} />
                <Route path="loyalty" element={<Loyalty />} />
                <Route path="advanced-reports" element={<AdminRoute><AdvancedReports /></AdminRoute>} />
                <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
