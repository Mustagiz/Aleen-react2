import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import {
  Download,
  Print,
  Phone,
  Receipt,
  AccessTime,
  WhatsApp,
  TimerOff
} from '@mui/icons-material';
import { doc, getDoc, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useData } from '../contexts/DataContext';
import InvoicePrint from '../components/InvoicePrint';
import { generatePdfFromElement } from '../utils/pdfExport';
import { getStoredInvoiceSettings } from '../constants/invoiceTemplates';

const PublicBillView = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoDownload = searchParams.get('download') === 'true' || searchParams.get('download') === '1';

  const dataCtx = useData() || {};
  const contextSettings = dataCtx.invoiceTemplateSettings;

  const [invoice, setInvoice] = useState(null);
  const [profile, setProfile] = useState(dataCtx.profile || null);
  const [invoiceSettings, setInvoiceSettings] = useState(() => contextSettings || getStoredInvoiceSettings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const printRef = useRef(null);

  // 1. Real-time subscription to CRM invoice template settings
  // If staff changes the template or boutique styling in the CRM, this public bill link
  // and its downloaded PDF will dynamically match the new CRM template in real time.
  useEffect(() => {
    const unsubTemplate = onSnapshot(
      doc(db, 'settings', 'invoiceTemplate'),
      (snap) => {
        if (snap.exists()) {
          setInvoiceSettings(snap.data());
        }
      },
      (err) => {
        console.warn('Real-time template settings subscription error:', err);
      }
    );

    return () => unsubTemplate();
  }, []);

  // 2. Fetch invoice & profile data
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        setError('');

        // A. Fetch Profile from Firestore
        try {
          const profileSnap = await getDoc(doc(db, 'settings', 'profile'));
          if (profileSnap.exists()) {
            setProfile(profileSnap.data());
          } else if (!profile) {
            const localProfile = localStorage.getItem('profile');
            if (localProfile) setProfile(JSON.parse(localProfile));
          }
        } catch (e) {
          console.warn('Profile fetch warning:', e);
        }

        // B. Fetch Invoice
        if (!id) {
          setError('No invoice ID specified.');
          return;
        }

        const cleanId = String(id).trim();
        let foundInvoice = null;

        // Strategy 1: Direct document ID lookup
        try {
          const invoiceSnap = await getDoc(doc(db, 'invoices', cleanId));
          if (invoiceSnap.exists()) {
            foundInvoice = { id: invoiceSnap.id, ...invoiceSnap.data() };
          }
        } catch (dbErr) {
          console.warn('Direct Firestore fetch warning:', dbErr);
        }

        // Strategy 2: Query by 'invoiceNumber' field (e.g. INV26100012)
        if (!foundInvoice) {
          try {
            const qInvNum = query(collection(db, 'invoices'), where('invoiceNumber', '==', cleanId));
            const snapInvNum = await getDocs(qInvNum);
            if (!snapInvNum.empty) {
              const d = snapInvNum.docs[0];
              foundInvoice = { id: d.id, ...d.data() };
            }
          } catch (qErr) {
            console.warn('Query by invoiceNumber warning:', qErr);
          }
        }

        // Strategy 3: Query by 'id' field
        if (!foundInvoice) {
          try {
            const qId = query(collection(db, 'invoices'), where('id', '==', cleanId));
            const snapId = await getDocs(qId);
            if (!snapId.empty) {
              const d = snapId.docs[0];
              foundInvoice = { id: d.id, ...d.data() };
            }
          } catch (qErr) {
            console.warn('Query by id warning:', qErr);
          }
        }

        // Strategy 4: Flexible scan of collection
        if (!foundInvoice) {
          try {
            const allSnap = await getDocs(collection(db, 'invoices'));
            const lowerId = cleanId.toLowerCase();
            allSnap.forEach((d) => {
              if (foundInvoice) return;
              const data = d.data();
              const docId = String(d.id).toLowerCase();
              const invNo = String(data.invoiceNumber || '').toLowerCase();
              const fieldId = String(data.id || '').toLowerCase();
              if (docId === lowerId || invNo === lowerId || fieldId === lowerId) {
                foundInvoice = { id: d.id, ...data };
              }
            });
          } catch (scanErr) {
            console.warn('All invoices scan warning:', scanErr);
          }
        }

        // Strategy 5: Fallback to localStorage (for offline/local testing)
        if (!foundInvoice) {
          try {
            const localInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            const lowerId = cleanId.toLowerCase();
            foundInvoice = localInvoices.find((inv) => {
              const docId = String(inv.id || '').toLowerCase();
              const invNo = String(inv.invoiceNumber || '').toLowerCase();
              return docId === lowerId || invNo === lowerId;
            });
          } catch (localErr) {
            console.warn('Local storage invoice check failed:', localErr);
          }
        }

        if (foundInvoice) {
          setInvoice(foundInvoice);
        } else {
          setError(`Invoice #${cleanId} could not be found. Please check your link or contact the store.`);
        }
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError('Unable to load invoice. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id]);

  // Determine active template: current CRM template takes precedence
  const activeTemplate = invoiceSettings?.template || invoice?.template || 'atelier-emerald';

  // 3. Generate and download branded PDF using the exact CRM template
  const handleDownloadPDF = async () => {
    if (!invoice || !printRef.current) return;
    setDownloading(true);

    try {
      const isSlip = activeTemplate === 'boutique-slip';
      const docPdf = await generatePdfFromElement(printRef.current, isSlip);
      const invNumber = invoice.invoiceNumber || (String(invoice.id).startsWith('INV') ? invoice.id : `INV-${invoice.id}`);
      docPdf.save(`${invNumber}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Graceful fallback to browser print dialog
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  // 4. 1-Week (7 Days) Expiration Evaluation
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const getInvoiceTimestamp = () => {
    if (!invoice) return null;
    if (invoice.date) {
      const parsed = new Date(invoice.date).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (invoice.createdAt) {
      const parsed = new Date(invoice.createdAt).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (invoice.id && !isNaN(Number(invoice.id)) && Number(invoice.id) > 1000000000000) {
      return Number(invoice.id);
    }
    return null;
  };

  const invoiceTimestamp = getInvoiceTimestamp();
  const isExpired = invoiceTimestamp ? (Date.now() - invoiceTimestamp > SEVEN_DAYS_MS) : false;
  const expiryTimestamp = invoiceTimestamp ? (invoiceTimestamp + SEVEN_DAYS_MS) : null;
  const expiryDateFormatted = expiryTimestamp
    ? new Date(expiryTimestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const daysRemaining = expiryTimestamp
    ? Math.max(0, Math.ceil((expiryTimestamp - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  // 5. Auto download trigger if query param download=true (only if link is not expired)
  useEffect(() => {
    if (autoDownload && invoice && !loading && !isExpired && printRef.current) {
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, invoice, loading, isExpired]);

  // Loading Screen
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC', p: 3 }}>
        <CircularProgress sx={{ color: '#0F766E', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#042F2E' }}>
          Loading Your Official E-Bill...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {profile?.businessName || 'Aleen Clothing Boutique'}
        </Typography>
      </Box>
    );
  }

  // Error Screen
  if (error || !invoice) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3.5, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error || 'Invoice not found.'}
          </Alert>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            {profile?.businessName || 'Aleen Clothing'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If you believe this is an error, please contact the boutique desk at {profile?.phone || '+91 98765 43210'}.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Expired Screen (7 days passed)
  if (isExpired) {
    const storePhone = profile?.phone || '+91 98765 43210';
    const storeName = profile?.businessName || 'Aleen Clothing';
    const cleanPhone = storePhone.replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(
      `Hello ${storeName}, my digital bill download link for Invoice #${invoice.invoiceNumber || invoice.id} has expired (7 days passed). Could you please re-issue a duplicate PDF bill copy for me? Thank you.`
    );
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : `https://wa.me/?text=${waText}`;

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', py: { xs: 4, sm: 8 }, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              border: '1.5px solid',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              bgcolor: '#FFFFFF',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)',
              textAlign: 'center'
            }}
          >
            {/* Expired Clock Icon */}
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5
              }}
            >
              <TimerOff sx={{ fontSize: 38 }} />
            </Box>

            <Chip
              icon={<AccessTime sx={{ fontSize: '14px !important', color: '#DC2626 !important' }} />}
              label="Link Expired • 7-Day Validity Passed"
              size="small"
              sx={{
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                color: '#DC2626',
                fontWeight: 800,
                fontSize: '0.74rem',
                mb: 2
              }}
            />

            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', mb: 1.5, letterSpacing: '-0.02em' }}>
              Digital Bill Link Has Expired
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 3 }}>
              For customer privacy and billing protection, digital bill download links expire <strong>7 days</strong> after purchase. This link expired on <strong>{expiryDateFormatted}</strong>.
            </Typography>

            {/* Invoice Reference Card */}
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', mb: 3, textAlign: 'left' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  Invoice Reference:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F766E' }}>
                  #{invoice.invoiceNumber || invoice.id}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  Billed To:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {invoice.customer || 'Customer'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  Issued On:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                </Typography>
              </Box>
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2.5, fontWeight: 600 }}>
              Need an official duplicate PDF bill copy or accounts statement?
            </Typography>

            {/* Action Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<WhatsApp />}
                onClick={() => window.open(waUrl, '_blank')}
                sx={{
                  bgcolor: '#25D366',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  py: 1.2,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
                  '&:hover': { bgcolor: '#1EBE5D' }
                }}
              >
                Request Copy via WhatsApp
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Phone />}
                onClick={() => window.open(`tel:${cleanPhone}`, '_self')}
                sx={{
                  borderColor: 'divider',
                  color: 'text.primary',
                  fontWeight: 700,
                  py: 1.2,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  '&:hover': { borderColor: 'text.primary', bgcolor: 'action.hover' }
                }}
              >
                Call Boutique Desk
              </Button>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.72rem' }}>
              {storeName} • {profile?.address || 'Baba Jaan Chawk, Pune, Maharashtra'}
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F1F5F9', py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ maxWidth: activeTemplate === 'boutique-slip' ? 480 : 840, mx: 'auto', width: '100%' }}>
        {/* Top Floating Download Bar */}
        <Paper
          elevation={2}
          className="no-print"
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            borderRadius: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(4, 47, 46, 0.2)',
            '@media print': {
              display: 'none !important'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', sm: 'auto' }, flex: 1, minWidth: 0 }}>
            <Box sx={{ width: 42, height: 42, minWidth: 42, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt sx={{ color: '#FFFFFF' }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  Official E-Invoice #{invoice.invoiceNumber || invoice.id}
                </Typography>
                {expiryDateFormatted && (
                  <Chip
                    icon={<AccessTime sx={{ fontSize: '13px !important', color: '#FEF08A !important' }} />}
                    label={`Valid until ${expiryDateFormatted} (${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left)`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.16)',
                      color: '#FEF08A',
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      height: 22
                    }}
                  />
                )}
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mt: 0.25 }}>
                Matches current boutique invoice template • Tap below to download PDF
              </Typography>
            </Box>
          </Box>

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'stretch', sm: 'flex-end' },
              flexShrink: 0
            }}
          >
            <Button
              variant="contained"
              startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <Download />}
              onClick={handleDownloadPDF}
              disabled={downloading}
              sx={{
                bgcolor: '#D97706',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.84rem',
                whiteSpace: 'nowrap',
                height: 42,
                px: 2.5,
                borderRadius: 2.5,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)',
                '&:hover': { bgcolor: '#B45309' },
                flex: { xs: 1, sm: 'none' }
              }}
            >
              {downloading ? 'Generating PDF...' : 'Download PDF Bill'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={() => window.print()}
              sx={{
                borderColor: 'rgba(255,255,255,0.4)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.84rem',
                whiteSpace: 'nowrap',
                height: 42,
                borderRadius: 2.5,
                textTransform: 'none',
                minWidth: 'auto',
                px: 2.5,
                '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' },
                flexShrink: 0
              }}
            >
              Print
            </Button>
          </Stack>
        </Paper>

        {/* Pixel-Perfect CRM Invoice Component */}
        {/* Renders the exact template active in the CRM (Atelier Emerald, Champagne Gold, Minimal Haute, or Boutique Slip) */}
        <Box sx={{ width: '100%' }}>
          <InvoicePrint
            ref={printRef}
            invoice={invoice}
            template={activeTemplate}
            settings={invoiceSettings}
            profile={profile}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default PublicBillView;
