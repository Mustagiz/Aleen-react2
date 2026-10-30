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
  Stack,
  Dialog,
  DialogContent,
  IconButton
} from '@mui/material';
import {
  Download,
  Print,
  Phone,
  Receipt,
  AccessTime,
  WhatsApp,
  TimerOff,
  QrCode2,
  FlashOn,
  ContentCopy,
  CheckCircle,
  Close,
  AccountBalanceWallet
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
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

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
        const rawId = id || searchParams.get('id') || searchParams.get('bill') || searchParams.get('inv') || '';
        if (!rawId) {
          setError('No invoice ID specified.');
          return;
        }

        const cleanId = decodeURIComponent(String(rawId).replace(/^[#%23]+/, '').trim());
        const lowerId = cleanId.toLowerCase();
        let foundInvoice = null;

        // Comprehensive lookup candidates (case variations, prefix additions, sequence formats)
        const candSet = new Set([cleanId, cleanId.toUpperCase(), cleanId.toLowerCase()]);
        if (cleanId.startsWith('INV-')) {
          candSet.add(cleanId.replace('INV-', 'INV'));
          candSet.add(cleanId.replace('INV-', ''));
        } else if (cleanId.startsWith('INV')) {
          candSet.add(cleanId.replace('INV', 'INV-'));
          candSet.add(cleanId.replace('INV', ''));
        } else if (/^\d+$/.test(cleanId)) {
          const year = new Date().getFullYear().toString().slice(-2);
          const month = String(new Date().getMonth() + 1).padStart(2, '0');
          candSet.add(`INV${cleanId}`);
          candSet.add(`INV-${cleanId}`);
          const num = parseInt(cleanId, 10);
          if (!isNaN(num) && num > 0 && num < 10000) {
            candSet.add(`INV${year}${month}${String(num).padStart(4, '0')}`);
            candSet.add(`INV-${year}${month}${String(num).padStart(4, '0')}`);
          }
        }

        const candidates = Array.from(candSet).filter(Boolean);

        // Strategy 1: Direct document ID lookup
        for (const cand of candidates) {
          if (foundInvoice) break;
          try {
            const invoiceSnap = await getDoc(doc(db, 'invoices', cand));
            if (invoiceSnap.exists()) {
              foundInvoice = { id: invoiceSnap.id, ...invoiceSnap.data() };
            }
          } catch (dbErr) {
            console.warn('Direct Firestore fetch warning:', dbErr);
          }
        }

        // Strategy 2: Query by 'invoiceNumber' field (e.g. INV26100012)
        if (!foundInvoice) {
          for (const cand of candidates) {
            if (foundInvoice) break;
            try {
              const qInvNum = query(collection(db, 'invoices'), where('invoiceNumber', '==', cand));
              const snapInvNum = await getDocs(qInvNum);
              if (!snapInvNum.empty) {
                const d = snapInvNum.docs[0];
                foundInvoice = { id: d.id, ...d.data() };
              }
            } catch (qErr) {
              console.warn('Query by invoiceNumber warning:', qErr);
            }
          }
        }

        // Strategy 3: Query by 'id' field
        if (!foundInvoice) {
          for (const cand of candidates) {
            if (foundInvoice) break;
            try {
              const qId = query(collection(db, 'invoices'), where('id', '==', cand));
              const snapId = await getDocs(qId);
              if (!snapId.empty) {
                const d = snapId.docs[0];
                foundInvoice = { id: d.id, ...d.data() };
              }
            } catch (qErr) {
              console.warn('Query by id warning:', qErr);
            }
          }
        }

        // Strategy 4: Universal scan of collection with prefix, suffix, and sequence resolution
        if (!foundInvoice) {
          try {
            const allSnap = await getDocs(collection(db, 'invoices'));
            const allDocs = [];
            allSnap.forEach((d) => {
              allDocs.push({ id: d.id, ...d.data() });
            });

            // 4a. Case-insensitive exact match
            for (const d of allDocs) {
              const docId = String(d.id || '').toLowerCase();
              const invNo = String(d.invoiceNumber || '').toLowerCase();
              if (candidates.some((c) => c.toLowerCase() === docId || c.toLowerCase() === invNo)) {
                foundInvoice = { ...d };
                break;
              }
            }

            // 4b. Prefix match for sliced timestamp IDs (e.g., table displayed #17779892 matching 1777989218508)
            if (!foundInvoice) {
              for (const d of allDocs) {
                const docId = String(d.id || '').toLowerCase();
                if (cleanId.length >= 6 && docId.startsWith(lowerId)) {
                  foundInvoice = { ...d };
                  break;
                }
              }
            }

            // 4c. Sequence match for numeric numbers (e.g. invoice ending in 0012 or number 12)
            if (!foundInvoice) {
              const seqMatch = cleanId.match(/(\d{1,4})$/);
              if (seqMatch) {
                const targetSeq = parseInt(seqMatch[1], 10);
                allDocs.sort((a, b) => {
                  const tA = new Date(a.date || parseInt(a.id) || 0).getTime();
                  const tB = new Date(b.date || parseInt(b.id) || 0).getTime();
                  return tA - tB;
                });
                if (targetSeq > 0 && targetSeq <= allDocs.length) {
                  foundInvoice = { ...allDocs[targetSeq - 1] };
                }
              }
            }
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
              return docId === lowerId || invNo === lowerId || (cleanId.length >= 6 && docId.startsWith(lowerId));
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
  }, [id, searchParams]);

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

  // 6. Dynamic UPI & Outstanding Balance Calculations
  const totalAmount = Number(invoice?.total || invoice?.grandTotal || 0);
  const isPaidInFull = invoice?.paymentStatus === 'paid';
  const rawPaidAmount = Number(invoice?.paidAmount ?? (isPaidInFull ? totalAmount : 0));
  const paidAmount = isPaidInFull ? totalAmount : Math.min(totalAmount, rawPaidAmount);
  const balanceDue = isPaidInFull ? 0 : Math.max(0, totalAmount - paidAmount);
  const hasPendingBalance = balanceDue > 0.01;

  const storeVpa = profile?.bankDetails?.upiId || profile?.upiId || invoiceSettings?.bankDetails?.upiId || 'aleenclothing@hdfcbank';
  const storeName = profile?.businessName || 'Aleen Clothing';
  const invNumber = invoice?.invoiceNumber || invoice?.id || 'INV';

  // Clean UPI Deep Link for Google Pay / PhonePe / Paytm / BHIM
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(storeVpa)}&pn=${encodeURIComponent(storeName)}&am=${balanceDue.toFixed(2)}&cu=INR&tr=${encodeURIComponent(invNumber)}&tn=${encodeURIComponent(`Bill ${invNumber} ${storeName}`)}`;

  // High-res Dynamic QR Code generated for the UPI payment URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(upiPayUrl)}`;

  const handleCopyVpa = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(storeVpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2500);
    }
  };

  const handlePayClick = () => {
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    if (isMobile) {
      window.location.href = upiPayUrl;
      setTimeout(() => setUpiModalOpen(true), 1200);
    } else {
      setUpiModalOpen(true);
    }
  };

  const storePhone = profile?.phone || '+91 98765 43210';
  const cleanPhone = storePhone.replace(/[^0-9]/g, '');
  const waReceiptText = encodeURIComponent(
    `Hello ${storeName}, I have completed UPI payment of ₹${balanceDue.toFixed(2)} for Invoice #${invNumber}. Please confirm my receipt.`
  );
  const waReceiptUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waReceiptText}` : `https://wa.me/?text=${waReceiptText}`;

  // Loading Screen
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC', p: 3 }}>
        <CircularProgress sx={{ color: (t) => t.palette.primary.main, mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
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
                <Typography variant="caption" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main }}>
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#F1F5F9', py: { xs: 1.5, sm: 4 }, px: { xs: 1, sm: 3 } }}>
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
            background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
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
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems="stretch"
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
                bgcolor: '#D97706 !important',
                color: '#FFFFFF !important',
                fontWeight: 800,
                fontSize: '0.86rem',
                whiteSpace: 'nowrap',
                height: 44,
                px: 2.5,
                borderRadius: 2.5,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)',
                '&:hover': { bgcolor: '#B45309 !important' },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {downloading ? 'Generating PDF...' : 'Download PDF Bill'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Print sx={{ color: '#0F172A !important' }} />}
              onClick={() => window.print()}
              sx={{
                bgcolor: '#FFFFFF !important',
                color: '#0F172A !important',
                fontWeight: 800,
                fontSize: '0.86rem',
                whiteSpace: 'nowrap',
                height: 44,
                borderRadius: 2.5,
                textTransform: 'none',
                px: 2.5,
                border: '1.5px solid #FFFFFF',
                boxShadow: '0 3px 12px rgba(0, 0, 0, 0.15)',
                '&:hover': { bgcolor: '#F8FAFC !important', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.22)' },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Print Invoice
            </Button>
          </Stack>
        </Paper>

        {/* Dynamic UPI Payment Settlement Banner (Shown for Pending / Partial / Unpaid Bills) */}
        {hasPendingBalance ? (
          <Paper
            elevation={1}
            className="no-print"
            sx={{
              p: { xs: 2, sm: 2.2 },
              mb: 3,
              borderRadius: 3,
              border: '1.5px solid rgba(217, 119, 6, 0.4)',
              bgcolor: '#FFFBEB',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              boxShadow: '0 4px 16px rgba(217, 119, 6, 0.12)',
              '@media print': { display: 'none !important' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', md: 'auto' } }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  borderRadius: '50%',
                  bgcolor: 'rgba(217, 119, 6, 0.15)',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FlashOn sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Outstanding Balance Due
                  </Typography>
                  <Chip
                    label="Instant UPI Settlement"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(217, 119, 6, 0.15)',
                      color: '#B45309',
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      height: 20
                    }}
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#92400E', lineHeight: 1.2, mt: 0.2 }}>
                  ₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" sx={{ color: '#78350F', display: 'block', mt: 0.3 }}>
                  Tap below to pay via GPay, PhonePe, Paytm, or BHIM UPI
                </Typography>
              </Box>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' }, flexShrink: 0 }}>
              <Button
                variant="contained"
                startIcon={<FlashOn />}
                onClick={handlePayClick}
                sx={{
                  bgcolor: (t) => t.palette.primary.main,
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  height: 42,
                  px: 2.8,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)',
                  '&:hover': { bgcolor: 'text.primary' }
                }}
              >
                Pay via UPI App
              </Button>
              <Button
                variant="outlined"
                startIcon={<QrCode2 />}
                onClick={() => setUpiModalOpen(true)}
                sx={{
                  borderColor: '#D97706',
                  color: '#B45309',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  height: 42,
                  px: 2.5,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': { borderColor: '#92400E', bgcolor: '#FEF3C7' }
                }}
              >
                Scan QR Code
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Box
            className="no-print"
            sx={{
              mb: 2.5,
              p: 1.5,
              px: 2,
              borderRadius: 2.5,
              bgcolor: 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)',
              border: '1px solid rgba(var(--primary-rgb, 15, 118, 110), 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
              '@media print': { display: 'none !important' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ color: (t) => t.palette.primary.main, fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 800, color: (t) => t.palette.primary.main }}>
                Payment Settled in Full
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                • Official Boutique Tax Receipt
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Settled via: <b>{invoice.paymentMethod || 'Cash'}</b>
            </Typography>
          </Box>
        )}

        {/* Pixel-Perfect CRM Invoice Component */}
        {/* Renders the exact template active in the CRM (Atelier Emerald, Champagne Gold, Minimal Haute, or Boutique Slip) */}
        <Box
          sx={{
            width: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            pb: 2,
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.15)', borderRadius: 3 }
          }}
        >
          <InvoicePrint
            ref={printRef}
            invoice={invoice}
            template={activeTemplate}
            settings={invoiceSettings}
            profile={profile}
          />
        </Box>

        {/* Bottom Quick Action Bar for Mobile & Desktop */}
        <Paper
          elevation={1}
          className="no-print"
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 3,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
            '@media print': { display: 'none !important' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Invoice #{invoice.invoiceNumber || invoice.id}
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="contained"
              startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <Download />}
              onClick={handleDownloadPDF}
              disabled={downloading}
              sx={{
                bgcolor: '#D97706 !important',
                color: '#FFFFFF !important',
                fontWeight: 800,
                fontSize: '0.86rem',
                textTransform: 'none',
                height: 42,
                px: 2.5,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(217, 119, 6, 0.35)',
                '&:hover': { bgcolor: '#B45309 !important' }
              }}
            >
              {downloading ? 'Generating PDF...' : 'Download PDF Bill'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Print sx={{ color: '#FFFFFF' }} />}
              onClick={() => window.print()}
              sx={{
                bgcolor: '#0F172A !important',
                color: '#FFFFFF !important',
                fontWeight: 800,
                fontSize: '0.86rem',
                textTransform: 'none',
                height: 42,
                px: 2.5,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.25)',
                '&:hover': { bgcolor: '#1E293B !important' }
              }}
            >
              Print Invoice
            </Button>
          </Stack>
        </Paper>

        {/* Interactive Dynamic UPI QR Modal */}
        <Dialog
          open={upiModalOpen}
          onClose={() => setUpiModalOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3.5,
              overflow: 'hidden',
              p: 0,
              boxShadow: '0 24px 60px rgba(4, 47, 46, 0.3)'
            }
          }}
        >
          {/* Modal Header */}
          <Box
            sx={{
              p: 2.5,
              background: (t) => t.custom?.designSystem?.buttonStyle?.background || `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <AccountBalanceWallet sx={{ color: '#FEF08A', fontSize: 24 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                  Instant UPI Settlement
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  {storeName} • Invoice #{invNumber}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setUpiModalOpen(false)} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#FFFFFF' } }}>
              <Close />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 3, textAlign: 'center' }}>
            {/* Amount Badge */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                Outstanding Amount
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: (t) => t.palette.primary.main, mt: 0.5 }}>
                ₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>

            {/* Dynamic QR Code Frame */}
            <Box
              sx={{
                width: 240,
                height: 240,
                mx: 'auto',
                p: 1.5,
                borderRadius: 3,
                bgcolor: '#FFFFFF',
                border: '2px solid #0F766E',
                boxShadow: '0 10px 30px rgba(var(--primary-rgb, 15, 118, 110), 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                mb: 2.5
              }}
            >
              <img
                src={qrCodeUrl}
                alt={`UPI QR for ${storeName}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }}
              />
            </Box>

            {/* Supported UPI Apps Pills */}
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 700 }}>
              Scan with Any UPI App:
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.8, flexWrap: 'wrap', mb: 2.5 }}>
              {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Cred'].map((appName) => (
                <Chip
                  key={appName}
                  label={appName}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    bgcolor: '#F1F5F9',
                    color: '#334155',
                    border: '1px solid #E2E8F0'
                  }}
                />
              ))}
            </Box>

            {/* UPI ID Copy Card */}
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: '#F8FAFC',
                border: '1px dashed #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2.5
              }}
            >
              <Box sx={{ textAlign: 'left', minWidth: 0, pr: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                  Store UPI ID (VPA):
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', wordBreak: 'break-all' }}>
                  {storeVpa}
                </Typography>
              </Box>
              <Button
                size="small"
                variant={copiedVpa ? 'contained' : 'outlined'}
                startIcon={copiedVpa ? <CheckCircle sx={{ fontSize: 16 }} /> : <ContentCopy sx={{ fontSize: 16 }} />}
                onClick={handleCopyVpa}
                sx={{
                  flexShrink: 0,
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  borderRadius: 2,
                  bgcolor: copiedVpa ? '#0F766E' : 'transparent',
                  bordercolor: (t) => t.palette.primary.main,
                  color: copiedVpa ? '#FFFFFF' : '#0F766E',
                  '&:hover': { bgcolor: copiedVpa ? '#042F2E' : 'rgba(var(--primary-rgb, 15, 118, 110), 0.08)' }
                }}
              >
                {copiedVpa ? 'Copied!' : 'Copy'}
              </Button>
            </Paper>

            {/* Direct Open UPI Link for Mobile */}
            <Button
              variant="contained"
              fullWidth
              startIcon={<FlashOn />}
              onClick={() => { window.location.href = upiPayUrl; }}
              sx={{
                bgcolor: (t) => t.palette.primary.main,
                color: '#FFFFFF',
                fontWeight: 800,
                py: 1.2,
                borderRadius: 2.5,
                textTransform: 'none',
                mb: 1.5,
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)',
                '&:hover': { bgcolor: 'text.primary' }
              }}
            >
              Launch UPI App Now
            </Button>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<WhatsApp />}
              onClick={() => window.open(waReceiptUrl, '_blank')}
              sx={{
                borderColor: '#25D366',
                color: '#16A34A',
                fontWeight: 800,
                py: 1.1,
                borderRadius: 2.5,
                textTransform: 'none',
                '&:hover': { borderColor: '#16A34A', bgcolor: 'rgba(37, 211, 102, 0.08)' }
              }}
            >
              Send Payment Screenshot on WhatsApp
            </Button>
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
};

export default PublicBillView;
