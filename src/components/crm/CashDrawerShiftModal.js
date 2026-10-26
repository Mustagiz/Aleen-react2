import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Paper,
  Divider,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  PointOfSale,
  AccountBalanceWallet,
  WhatsApp,
  Print,
  CheckCircle,
  WarningAmber,
  Close,
  Save,
  Refresh,
  History,
  Summarize,
  CurrencyRupee,
  ReceiptLong,
  InfoOutlined,
  Send
} from '@mui/icons-material';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const DENOMINATIONS = [
  { value: 500, label: '₹500 Note' },
  { value: 200, label: '₹200 Note' },
  { value: 100, label: '₹100 Note' },
  { value: 50, label: '₹50 Note' },
  { value: 20, label: '₹20 Note' },
  { value: 10, label: '₹10 Note' }
];

export default function CashDrawerShiftModal({ open, onClose }) {
  const { invoices = [], expenses = [], profile = {} } = useData();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(0); // 0: Reconciliation, 1: WhatsApp EOD, 2: History
  const [openingFloat, setOpeningFloat] = useState(() => {
    return Number(localStorage.getItem('aleen_opening_float') || 2000);
  });
  const [cashierName, setCashierName] = useState(() => {
    return user?.name || user?.email?.split('@')[0] || 'Front Counter Cashier';
  });
  const [shiftNotes, setShiftNotes] = useState('');
  const [counts, setCounts] = useState({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    coins: 0
  });

  const [pastShifts, setPastShifts] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingShift, setSavingShift] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Store owner phone number for WhatsApp EOD
  const [ownerPhone, setOwnerPhone] = useState(() => {
    const defaultPhone = profile?.phone || '+91 98765 43210';
    return localStorage.getItem('aleen_owner_whatsapp') || defaultPhone;
  });

  // Calculate today's time range
  const todayRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, []);

  // Filter today's invoices
  const todayInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const d = new Date(inv.date || inv.createdAt);
      return d >= todayRange.start && d <= todayRange.end;
    });
  }, [invoices, todayRange]);

  // Filter today's cash expenses
  const todayExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const d = new Date(exp.date || exp.createdAt);
      return d >= todayRange.start && d <= todayRange.end;
    });
  }, [expenses, todayRange]);

  // Breakdown of Today's Collections by Tender
  const tenderSummary = useMemo(() => {
    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let creditSales = 0;
    let grossTotal = 0;

    todayInvoices.forEach((inv) => {
      const invTotal = Number(inv.total || 0);
      grossTotal += invTotal;

      if (inv.payments && Array.isArray(inv.payments) && inv.payments.length > 0) {
        inv.payments.forEach((p) => {
          const amt = Number(p.amount || 0);
          const method = String(p.method || '').toLowerCase();
          if (method.includes('cash')) cashSales += amt;
          else if (method.includes('upi')) upiSales += amt;
          else if (method.includes('card')) cardSales += amt;
          else if (method.includes('credit')) creditSales += amt;
          else cashSales += amt;
        });
      } else {
        const method = String(inv.paymentMethod || 'cash').toLowerCase();
        if (method.includes('cash')) cashSales += invTotal;
        else if (method.includes('upi')) upiSales += invTotal;
        else if (method.includes('card')) cardSales += invTotal;
        else if (method.includes('credit')) creditSales += invTotal;
        else cashSales += invTotal;
      }
    });

    return { cashSales, upiSales, cardSales, creditSales, grossTotal };
  }, [todayInvoices]);

  // Today's Cash Expenses (Cash Out from drawer)
  const cashExpensesTotal = useMemo(() => {
    return todayExpenses.reduce((sum, exp) => {
      const method = String(exp.paymentMethod || exp.method || 'cash').toLowerCase();
      if (method.includes('cash')) {
        return sum + Number(exp.amount || 0);
      }
      return sum;
    }, 0);
  }, [todayExpenses]);

  // Expected Cash in Drawer
  const expectedCash = useMemo(() => {
    return Number(openingFloat || 0) + tenderSummary.cashSales - cashExpensesTotal;
  }, [openingFloat, tenderSummary.cashSales, cashExpensesTotal]);

  // Counted Physical Cash in Drawer
  const countedPhysicalCash = useMemo(() => {
    let sum = 0;
    DENOMINATIONS.forEach((d) => {
      sum += (Number(counts[d.value]) || 0) * d.value;
    });
    sum += Number(counts.coins || 0);
    return sum;
  }, [counts]);

  // Variance: Counted vs Expected
  const cashVariance = useMemo(() => {
    return Number((countedPhysicalCash - expectedCash).toFixed(2));
  }, [countedPhysicalCash, expectedCash]);

  // Fetch shift history from Firestore
  const fetchShiftHistory = async () => {
    try {
      setLoadingHistory(true);
      const q = query(collection(db, 'cash_shifts'), orderBy('timestamp', 'desc'), limit(15));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setPastShifts(list);
    } catch (err) {
      console.warn('Failed to load shift history:', err);
      // Fallback to local storage
      const local = JSON.parse(localStorage.getItem('aleen_past_shifts') || '[]');
      setPastShifts(local);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchShiftHistory();
      setSaveSuccess(false);
    }
  }, [open]);

  // Handle Save Shift (Z-Report Close)
  const handleSaveShift = async () => {
    try {
      setSavingShift(true);
      const shiftDoc = {
        shiftDate: new Date().toLocaleDateString('en-IN'),
        timestamp: serverTimestamp(),
        closedAt: new Date().toISOString(),
        cashier: cashierName,
        openingFloat: Number(openingFloat),
        cashSales: tenderSummary.cashSales,
        upiSales: tenderSummary.upiSales,
        cardSales: tenderSummary.cardSales,
        grossTotal: tenderSummary.grossTotal,
        invoicesCount: todayInvoices.length,
        cashExpenses: cashExpensesTotal,
        expectedCash,
        countedCash: countedPhysicalCash,
        variance: cashVariance,
        denominations: counts,
        notes: shiftNotes.trim()
      };

      try {
        await addDoc(collection(db, 'cash_shifts'), shiftDoc);
      } catch (dbErr) {
        console.warn('Writing to Firestore failed, saving locally:', dbErr);
      }

      // Also persist to localStorage
      const local = JSON.parse(localStorage.getItem('aleen_past_shifts') || '[]');
      local.unshift({ id: `local_${Date.now()}`, ...shiftDoc, timestamp: new Date().toISOString() });
      localStorage.setItem('aleen_past_shifts', JSON.stringify(local.slice(0, 30)));
      localStorage.setItem('aleen_opening_float', String(openingFloat));

      setSaveSuccess(true);
      fetchShiftHistory();
    } catch (err) {
      console.error('Error closing shift:', err);
      alert('Failed to save shift: ' + err.message);
    } finally {
      setSavingShift(false);
    }
  };

  // Compile Executive EOD WhatsApp Digest Text
  const generateWhatsAppEodText = () => {
    const storeName = profile?.businessName || 'Aleen Clothing Boutique';
    const todayFormatted = new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timeFormatted = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const varianceLabel =
      cashVariance === 0
        ? '✨ PERFECTLY BALANCED (₹0.00)'
        : cashVariance > 0
        ? `🟢 OVERAGE +₹${cashVariance.toFixed(2)}`
        : `🔴 SHORTAGE -₹${Math.abs(cashVariance).toFixed(2)}`;

    return `🌟 *${storeName.toUpperCase()} • DAILY EOD Z-REPORT* 🌟
📅 *Date:* ${todayFormatted} | ⏰ *Time:* ${timeFormatted}
👤 *Cashier / Shift:* ${cashierName}
═══════════════════════════
📊 *SALES & REVENUE SUMMARY*
• 💰 *Gross Revenue:* ₹${tenderSummary.grossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• 🧾 *Total Bills Raised:* ${todayInvoices.length} orders
• 💵 *Cash Collections:* ₹${tenderSummary.cashSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• ⚡ *UPI QR Collections:* ₹${tenderSummary.upiSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• 💳 *Card POS Collections:* ₹${tenderSummary.cardSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• 📋 *Credit / Khata:* ₹${tenderSummary.creditSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}

📉 *STORE EXPENSES (PETTY CASH OUT)*
• 💸 *Total Cash Payouts:* ₹${cashExpensesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${todayExpenses.length} entries)

🏦 *CASH DRAWER RECONCILIATION*
• 🪙 *Morning Opening Float:* ₹${Number(openingFloat).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• 🎯 *Expected Cash in Drawer:* ₹${expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• 💼 *Physical Counted Cash:* ₹${countedPhysicalCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• ⚖️ *Shift Variance:* ${varianceLabel}
${shiftNotes ? `\n📝 *Notes:* ${shiftNotes}` : ''}
═══════════════════════════
🔒 *Status:* Official Store Shift Closed & Verified.`;
  };

  const handleSendWhatsAppEod = () => {
    localStorage.setItem('aleen_owner_whatsapp', ownerPhone);
    const cleanPhone = ownerPhone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(generateWhatsAppEodText());
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: 'hidden',
          bgcolor: '#FFFFFF',
          boxShadow: '0 24px 60px rgba(4, 47, 46, 0.25)'
        }
      }}
    >
      {/* Luxury Header */}
      <Box
        sx={{
          p: 2.5,
          background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <PointOfSale sx={{ color: '#FEF08A', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
              Daily Shift & Cash Drawer Reconciliation
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              End of Day (EOD) Z-Report Console • {profile?.businessName || 'Aleen Clothing'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#FFFFFF' } }}>
          <Close />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#F8FAFC', px: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.86rem',
              minHeight: 48,
              color: 'text.secondary',
              '&.Mui-selected': { color: '#0F766E' }
            },
            '& .MuiTabs-indicator': { bgcolor: '#0F766E', height: 3, borderRadius: '3px 3px 0 0' }
          }}
        >
          <Tab icon={<PointOfSale sx={{ fontSize: 18 }} />} iconPosition="start" label="Drawer Reconciliation (Z-Report)" />
          <Tab icon={<WhatsApp sx={{ fontSize: 18 }} />} iconPosition="start" label="Store Owner WhatsApp Digest" />
          <Tab icon={<History sx={{ fontSize: 18 }} />} iconPosition="start" label={`Shift History (${pastShifts.length})`} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#F8FAFC' }}>
        {/* ============================================================== */}
        {/* TAB 0: RECONCILIATION & DENOMINATIONS                          */}
        {/* ============================================================== */}
        {activeTab === 0 && (
          <Box>
            {saveSuccess && (
              <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setSaveSuccess(false)}>
                <strong>Shift Successfully Closed & Recorded!</strong> Z-Report has been archived. You can now dispatch the WhatsApp summary to the store owner.
              </Alert>
            )}

            {/* Shift Context Info Bar */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Cashier / Register"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    size="small"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Opening Cash Float (₹)"
                    type="number"
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                    helperText="Morning drawer float"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#F1F5F9', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 700 }}>
                      Today's Bills Raised
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F766E' }}>
                      {todayInvoices.length} Orders • ₹{tenderSummary.grossTotal.toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Reconciliation KPI Ledger */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Expected Cash in Drawer */}
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1.5px solid #CBD5E1',
                    bgcolor: '#FFFFFF',
                    height: '100%',
                    position: 'relative'
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
                    Expected Cash in Drawer
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F766E', mt: 0.5 }}>
                    ₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                  <Box sx={{ mt: 1, fontSize: '0.74rem', color: 'text.secondary' }}>
                    <div>+ Opening Float: ₹{Number(openingFloat).toFixed(2)}</div>
                    <div>+ Cash Sales Today: ₹{tenderSummary.cashSales.toFixed(2)}</div>
                    <div>- Cash Expenses: ₹{cashExpensesTotal.toFixed(2)}</div>
                  </Box>
                </Paper>
              </Grid>

              {/* Physical Counted Cash */}
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1.5px solid #CBD5E1',
                    bgcolor: '#FFFFFF',
                    height: '100%'
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase' }}>
                    Physical Counted Cash
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', mt: 0.5 }}>
                    ₹{countedPhysicalCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                    Summed from currency count below
                  </Typography>
                </Paper>
              </Grid>

              {/* Variance Indicator */}
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1.5px solid',
                    borderColor:
                      cashVariance === 0 ? '#10B981' : cashVariance > 0 ? '#F59E0B' : '#EF4444',
                    bgcolor:
                      cashVariance === 0
                        ? 'rgba(16, 185, 129, 0.08)'
                        : cashVariance > 0
                        ? 'rgba(245, 158, 11, 0.08)'
                        : 'rgba(239, 68, 68, 0.08)',
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                      Drawer Variance
                    </Typography>
                    {cashVariance === 0 ? (
                      <CheckCircle sx={{ color: '#10B981', fontSize: 18 }} />
                    ) : (
                      <WarningAmber sx={{ color: cashVariance > 0 ? '#F59E0B' : '#EF4444', fontSize: 18 }} />
                    )}
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      color: cashVariance === 0 ? '#047857' : cashVariance > 0 ? '#B45309' : '#DC2626',
                      mt: 0.5
                    }}
                  >
                    {cashVariance >= 0 ? `+₹${cashVariance.toFixed(2)}` : `-₹${Math.abs(cashVariance).toFixed(2)}`}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mt: 0.5 }}>
                    {cashVariance === 0
                      ? '✨ Perfectly Balanced'
                      : cashVariance > 0
                      ? '⚠️ Cash Overage / Surplus'
                      : '🚨 Cash Shortage Detected'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Currency Denomination Counter */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  💵 Physical Currency Denomination Counter
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setCounts({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, coins: 0 })}
                  sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.75rem' }}
                >
                  Reset Counts
                </Button>
              </Box>

              <Grid container spacing={1.5}>
                {DENOMINATIONS.map((den) => {
                  const count = counts[den.value] || 0;
                  const lineTotal = count * den.value;
                  return (
                    <Grid item xs={6} sm={4} key={den.value}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: count > 0 ? 'rgba(15, 118, 110, 0.04)' : '#F8FAFC',
                          border: '1px solid',
                          borderColor: count > 0 ? '#0F766E' : '#E2E8F0'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            {den.label}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F766E' }}>
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </Typography>
                        </Box>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          placeholder="0 notes"
                          value={count || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setCounts((prev) => ({ ...prev, [den.value]: Math.max(0, val) }));
                          }}
                          inputProps={{ min: 0 }}
                          sx={{ bgcolor: '#FFFFFF', borderRadius: 1.5 }}
                        />
                      </Paper>
                    </Grid>
                  );
                })}

                {/* Loose Coins / Small change */}
                <Grid item xs={12} sm={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: counts.coins > 0 ? 'rgba(15, 118, 110, 0.04)' : '#F8FAFC',
                      border: '1px solid',
                      borderColor: counts.coins > 0 ? '#0F766E' : '#E2E8F0'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        🪙 Loose Coins / Cash
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F766E' }}>
                        ₹{Number(counts.coins || 0).toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      placeholder="₹ amount"
                      value={counts.coins || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setCounts((prev) => ({ ...prev, coins: Math.max(0, val) }));
                      }}
                      inputProps={{ min: 0 }}
                      sx={{ bgcolor: '#FFFFFF', borderRadius: 1.5 }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </Paper>

            {/* Shift Closing Observations & Notes */}
            <TextField
              label="Shift Closing Notes / Handover Remarks"
              placeholder="e.g. ₹500 kept aside for morning milk vendor, register balance verified with manager."
              multiline
              rows={2}
              fullWidth
              value={shiftNotes}
              onChange={(e) => setShiftNotes(e.target.value)}
              sx={{ mb: 3, bgcolor: '#FFFFFF', borderRadius: 2 }}
            />

            {/* Action Bar */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<WhatsApp />}
                onClick={() => setActiveTab(1)}
                sx={{
                  borderColor: '#25D366',
                  color: '#16A34A',
                  fontWeight: 800,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.08)', borderColor: '#16A34A' }
                }}
              >
                Preview WhatsApp EOD Report
              </Button>
              <Button
                variant="contained"
                startIcon={savingShift ? <CircularProgress size={18} color="inherit" /> : <Save />}
                onClick={handleSaveShift}
                disabled={savingShift}
                sx={{
                  bgcolor: '#0F766E',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  px: 3,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)',
                  '&:hover': { bgcolor: '#042F2E' }
                }}
              >
                {savingShift ? 'Saving Z-Report...' : 'Save & Close Shift (Record Z-Report)'}
              </Button>
            </Stack>
          </Box>
        )}

        {/* ============================================================== */}
        {/* TAB 1: STORE OWNER WHATSAPP DIGEST                             */}
        {/* ============================================================== */}
        {activeTab === 1 && (
          <Box>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                📲 Nightly Store Owner WhatsApp Digest
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Sends a high-level executive financial and register summary directly to the store owner's personal WhatsApp.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2.5 }}>
                <TextField
                  label="Store Owner WhatsApp Number"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="+91 98765 43210"
                  helperText="Include country code (+91 for India)"
                />
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleSendWhatsAppEod}
                  sx={{
                    bgcolor: '#25D366',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    height: 40,
                    px: 3,
                    borderRadius: 2.5,
                    whiteSpace: 'nowrap',
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                    '&:hover': { bgcolor: '#1EBE5D' }
                  }}
                >
                  Send to WhatsApp
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                Live Message Preview:
              </Typography>

              {/* Message Preview Bubble */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  color: '#14532D',
                  maxHeight: 380,
                  overflowY: 'auto'
                }}
              >
                {generateWhatsAppEodText()}
              </Box>
            </Paper>
          </Box>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SHIFT RECONCILIATION HISTORY (Z-REPORTS LOG)           */}
        {/* ============================================================== */}
        {activeTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F766E' }}>
                Archived Shift Reconciliation Records
              </Typography>
              <IconButton onClick={fetchShiftHistory} size="small" sx={{ color: '#0F766E' }}>
                <Refresh />
              </IconButton>
            </Box>

            {loadingHistory ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={28} sx={{ color: '#0F766E' }} />
              </Box>
            ) : pastShifts.length === 0 ? (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: 2.5 }}>
                <Typography variant="body2" color="text.secondary">
                  No archived shift records found. Closed shifts will appear here automatically.
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#0F766E' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.76rem' }}>Date / Shift</TableCell>
                      <TableCell sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.76rem' }}>Cashier</TableCell>
                      <TableCell align="right" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.76rem' }}>Expected</TableCell>
                      <TableCell align="right" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.76rem' }}>Counted</TableCell>
                      <TableCell align="center" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.76rem' }}>Variance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pastShifts.map((shift, idx) => (
                      <TableRow key={shift.id || idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                          {shift.shiftDate || (shift.closedAt ? new Date(shift.closedAt).toLocaleDateString('en-IN') : 'Recent')}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>{shift.cashier || 'Cashier'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                          ₹{Number(shift.expectedCash || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                          ₹{Number(shift.countedCash || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={
                              shift.variance === 0
                                ? 'Balanced'
                                : shift.variance > 0
                                ? `+₹${shift.variance}`
                                : `-₹${Math.abs(shift.variance)}`
                            }
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.68rem',
                              bgcolor:
                                shift.variance === 0
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : shift.variance > 0
                                  ? 'rgba(245, 158, 11, 0.12)'
                                  : 'rgba(239, 68, 68, 0.12)',
                              color:
                                shift.variance === 0
                                  ? '#047857'
                                  : shift.variance > 0
                                  ? '#B45309'
                                  : '#DC2626'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'none' }}>
          Close Console
        </Button>
      </DialogActions>
    </Dialog>
  );
}
