import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Card
} from '@mui/material';
import {
  Download,
  Print,
  CheckCircle,
  Phone,
  LocationOn,
  Receipt,
  Security,
  AccessTime,
  WhatsApp,
  TimerOff
} from '@mui/icons-material';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PublicBillView = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoDownload = searchParams.get('download') === 'true' || searchParams.get('download') === '1';

  const [invoice, setInvoice] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Fetch invoice & profile from Firestore or local fallback
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. Fetch Profile
        try {
          const profileSnap = await getDoc(doc(db, 'settings', 'profile'));
          if (profileSnap.exists()) {
            setProfile(profileSnap.data());
          } else {
            const localProfile = localStorage.getItem('profile');
            if (localProfile) setProfile(JSON.parse(localProfile));
          }
        } catch (e) {
          console.warn('Profile fetch warning:', e);
        }

        // 2. Fetch Invoice
        if (!id) {
          setError('No invoice ID specified.');
          return;
        }

        const cleanId = String(id).trim();
        let foundInvoice = null;

        // Strategy A: Direct document ID lookup
        try {
          const invoiceSnap = await getDoc(doc(db, 'invoices', cleanId));
          if (invoiceSnap.exists()) {
            foundInvoice = { id: invoiceSnap.id, ...invoiceSnap.data() };
          }
        } catch (dbErr) {
          console.warn('Direct Firestore fetch warning:', dbErr);
        }

        // Strategy B: Query by 'invoiceNumber' field (e.g. INV26100012)
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

        // Strategy C: Query by 'id' field
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

        // Strategy D: Flexible scan of collection (handles case differences, timestamp vs INV prefixes)
        if (!foundInvoice) {
          try {
            const allSnap = await getDocs(collection(db, 'invoices'));
            const lowerId = cleanId.toLowerCase();
            allSnap.forEach(d => {
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

        // Strategy E: Fallback to localStorage (for offline or local testing)
        if (!foundInvoice) {
          try {
            const localInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            const lowerId = cleanId.toLowerCase();
            foundInvoice = localInvoices.find(inv => {
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

  // Generate and download branded PDF
  const handleDownloadPDF = () => {
    if (!invoice) return;
    setDownloading(true);

    try {
      const docPdf = new jsPDF();
      const primaryColor = [15, 118, 110]; // #0F766E
      const darkText = [30, 41, 59];
      const mutedText = [100, 116, 139];

      const businessName = profile?.businessName || 'ALEEN CLOTHING';
      const address = profile?.address || 'Baba Jaan Chawk, Pune, Maharashtra 411001';
      const phone = profile?.phone || '+91 98765 43210';
      const gstin = profile?.gstin || '27XXXXX1234X1ZX';
      const invoiceNumber = invoice.invoiceNumber || (String(invoice.id).startsWith('INV') ? invoice.id : `INV-${invoice.id}`);
      const invoiceDate = invoice.date
        ? new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN');

      // Top Luxury Header Banner
      docPdf.setFillColor(...primaryColor);
      docPdf.rect(0, 0, 210, 32, 'F');

      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(20);
      docPdf.setTextColor(255, 255, 255);
      docPdf.text(businessName.toUpperCase(), 14, 18);

      docPdf.setFont('helvetica', 'normal');
      docPdf.setFontSize(8.5);
      docPdf.setTextColor(204, 251, 241);
      docPdf.text('HAUTE COUTURE & READY-TO-WEAR • OFFICIAL TAX INVOICE', 14, 25);

      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(14);
      docPdf.setTextColor(255, 255, 255);
      docPdf.text('TAX INVOICE', 196, 18, { align: 'right' });

      docPdf.setFont('helvetica', 'normal');
      docPdf.setFontSize(10);
      docPdf.setTextColor(253, 230, 138);
      docPdf.text(invoiceNumber, 196, 25, { align: 'right' });

      // Two Column Store & Customer Info
      let yPos = 42;

      // Store Details
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(8.5);
      docPdf.setTextColor(...primaryColor);
      docPdf.text('BILLED BY (STORE):', 14, yPos);

      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(10);
      docPdf.setTextColor(...darkText);
      docPdf.text(businessName, 14, yPos + 6);

      docPdf.setFont('helvetica', 'normal');
      docPdf.setFontSize(8.5);
      docPdf.setTextColor(...mutedText);
      docPdf.text(address, 14, yPos + 11, { maxWidth: 85 });
      docPdf.text(`Phone: ${phone}`, 14, yPos + 20);
      docPdf.text(`GSTIN: ${gstin}`, 14, yPos + 25);

      // Customer Details
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(8.5);
      docPdf.setTextColor(...primaryColor);
      docPdf.text('BILLED TO (CUSTOMER):', 110, yPos);

      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(10);
      docPdf.setTextColor(...darkText);
      docPdf.text(invoice.customer || 'Valued Patron', 110, yPos + 6);

      docPdf.setFont('helvetica', 'normal');
      docPdf.setFontSize(8.5);
      docPdf.setTextColor(...mutedText);
      docPdf.text(`Phone: ${invoice.phone || 'N/A'}`, 110, yPos + 11);
      docPdf.text(`Payment: ${invoice.paymentMethod || 'Cash'} (${(invoice.paymentStatus || 'PAID').toUpperCase()})`, 110, yPos + 16);
      docPdf.text(`Invoice Date: ${invoiceDate}`, 110, yPos + 21);

      // Metadata summary strip
      yPos = 74;
      docPdf.setFillColor(248, 250, 252);
      docPdf.setDrawColor(226, 232, 240);
      docPdf.roundedRect(14, yPos, 182, 14, 2, 2, 'FD');

      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(7.5);
      docPdf.setTextColor(...mutedText);
      docPdf.text('INVOICE NO.', 20, yPos + 5.5);
      docPdf.text('DATE', 75, yPos + 5.5);
      docPdf.text('PAYMENT TENDER', 125, yPos + 5.5);
      docPdf.text('STATUS', 170, yPos + 5.5);

      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(8.5);
      docPdf.setTextColor(...darkText);
      docPdf.text(invoiceNumber, 20, yPos + 10);
      docPdf.text(invoiceDate, 75, yPos + 10);
      docPdf.text((invoice.paymentMethod || 'Cash').toUpperCase(), 125, yPos + 10);
      docPdf.text((invoice.paymentStatus || 'PAID').toUpperCase(), 170, yPos + 10);

      // Items table
      const items = Array.isArray(invoice.items) ? invoice.items : [];
      const tableBody = items.map((it, idx) => {
        const qty = Number(it.quantity) || 1;
        const price = Number(it.price) || 0;
        const lineTotal = qty * price;
        const discountAmt = Number(it.discount) || 0;
        return [
          idx + 1,
          it.name || 'Garment Item',
          it.variantSku || it.size || it.color || '-',
          qty.toString(),
          `Rs. ${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          discountAmt > 0 ? `-Rs. ${discountAmt.toLocaleString('en-IN')}` : '-',
          `Rs. ${lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        ];
      });

      autoTable(docPdf, {
        startY: yPos + 18,
        head: [['#', 'Garment Description', 'Size/SKU', 'Qty', 'Unit Price', 'Disc.', 'Amount']],
        body: tableBody,
        headStyles: {
          fillColor: [15, 118, 110],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [30, 41, 59]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 70 },
          2: { cellWidth: 26 },
          3: { cellWidth: 14, halign: 'center' },
          4: { cellWidth: 22, halign: 'right' },
          5: { cellWidth: 18, halign: 'right' },
          6: { cellWidth: 22, halign: 'right' }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: 14, right: 14 }
      });

      const finalY = docPdf.lastAutoTable.finalY + 8;
      const subtotal = Number(invoice.subtotal || invoice.total || 0);
      const discount = Number(invoice.discount || invoice.discountAmount || 0);
      const tax = Number(invoice.tax || 0);
      const total = Number(invoice.total || 0);

      // Totals Card on right
      docPdf.setFillColor(248, 250, 252);
      docPdf.setDrawColor(226, 232, 240);
      docPdf.roundedRect(120, finalY, 76, 32, 2, 2, 'FD');

      docPdf.setFont('helvetica', 'normal');
      docPdf.setFontSize(8.5);
      docPdf.setTextColor(...darkText);
      docPdf.text('Subtotal:', 125, finalY + 7);
      docPdf.text(`Rs. ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY + 7, { align: 'right' });

      if (discount > 0) {
        docPdf.text('Discount:', 125, finalY + 13);
        docPdf.setTextColor(220, 38, 38);
        docPdf.text(`-Rs. ${discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY + 13, { align: 'right' });
        docPdf.setTextColor(...darkText);
      }

      if (tax > 0) {
        docPdf.text(`GST (${invoice.gst || 0}%):`, 125, finalY + 19);
        docPdf.text(`Rs. ${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY + 19, { align: 'right' });
      }

      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(9.5);
      docPdf.setTextColor(...primaryColor);
      docPdf.text('Grand Total:', 125, finalY + 26);
      docPdf.text(`Rs. ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, finalY + 26, { align: 'right' });

      // Terms on left
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(8);
      docPdf.setTextColor(...primaryColor);
      docPdf.text('TERMS & APPRECIATION:', 14, finalY + 6);

      docPdf.setFont('helvetica', 'normal');
      docPdf.setFontSize(7.5);
      docPdf.setTextColor(...mutedText);
      docPdf.text('1. Thank you for shopping with Aleen Clothing.', 14, finalY + 12);
      docPdf.text('2. Fitting adjustments complimentary within 7 days with invoice.', 14, finalY + 17);
      docPdf.text('3. Dry clean only recommended for fine embroidered apparel.', 14, finalY + 22);

      // Footer
      docPdf.setFontSize(7.5);
      docPdf.setTextColor(148, 163, 184);
      docPdf.text('Official Customer E-Bill • Generated by Aleen Boutique Operating System', 105, 287, { align: 'center' });

      docPdf.save(`invoice-${invoice.id}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Could not generate PDF. Please try again or use the Print button.');
    } finally {
      setDownloading(false);
    }
  };

  // 1-Week (7 Days) Expiration Evaluation
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

  // Auto download trigger if query param download=true (only if link is not expired)
  useEffect(() => {
    if (autoDownload && invoice && !loading && !isExpired) {
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, invoice, loading, isExpired]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC', p: 3 }}>
        <CircularProgress sx={{ color: '#0F766E', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#042F2E' }}>
          Loading Your Official E-Bill...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aleen Clothing Boutique
        </Typography>
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3.5, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error || 'Invoice not found.'}
          </Alert>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Aleen Clothing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If you believe this is an error, please contact the boutique desk at {profile?.phone || '+91 98765 43210'}.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // If link has expired (1 week / 7 days passed since purchase)
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

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const businessName = profile?.businessName || 'Aleen Clothing';
  const address = profile?.address || 'Baba Jaan Chawk, Pune, Maharashtra 411001';
  const phone = profile?.phone || '+91 98765 43210';
  const gstin = profile?.gstin || '27XXXXX1234X1ZX';
  const subtotal = Number(invoice.subtotal || invoice.total || 0);
  const discount = Number(invoice.discount || invoice.discountAmount || 0);
  const tax = Number(invoice.tax || 0);
  const total = Number(invoice.total || 0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F1F5F9', py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      <Container maxWidth="md">
        {/* Top Floating Download Bar */}
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            background: 'linear-gradient(135deg, #0F766E 0%, #042F2E 100%)',
            color: '#FFFFFF'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
            <Box sx={{ width: 42, height: 42, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt sx={{ color: '#FFFFFF' }} />
            </Box>
            <Box>
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
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Tap below to download your official PDF invoice
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <Download />}
              onClick={handleDownloadPDF}
              disabled={downloading}
              sx={{
                bgcolor: '#D97706',
                color: '#FFFFFF',
                fontWeight: 800,
                px: 3,
                py: 1,
                borderRadius: 2.5,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)',
                '&:hover': { bgcolor: '#B45309' }
              }}
            >
              {downloading ? 'Downloading...' : 'Download PDF Bill'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={() => window.print()}
              sx={{
                borderColor: 'rgba(255,255,255,0.4)',
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: 2.5,
                textTransform: 'none',
                minWidth: 'auto',
                px: 2,
                '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Print
            </Button>
          </Stack>
        </Paper>

        {/* Printable/Viewable Luxury Digital Bill Card */}
        <Paper
          elevation={0}
          id="printable-bill"
          sx={{
            p: { xs: 2.5, sm: 4.5 },
            borderRadius: 3.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: '#FFFFFF',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F766E', letterSpacing: '0.04em' }}>
                {businessName.toUpperCase()}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#D97706', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Haute Couture & Ready-to-Wear
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn sx={{ fontSize: 16, color: '#0F766E' }} />
                {address}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Phone sx={{ fontSize: 16, color: '#0F766E' }} />
                {phone} • GSTIN: {gstin}
              </Typography>
            </Box>

            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Chip
                label="PAID RECEIPT"
                color="success"
                icon={<CheckCircle sx={{ fontSize: '1rem !important' }} />}
                sx={{ fontWeight: 800, fontSize: '0.78rem', mb: 1 }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#042F2E' }}>
                Invoice #{invoice.invoiceNumber || invoice.id}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Date: {invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN')}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Customer & Billing Summary */}
          <Card elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid', borderColor: '#E2E8F0' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                  Billed To Customer
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {invoice.customer || 'Valued Patron'}
                </Typography>
                {invoice.phone && (
                  <Typography variant="body2" color="text.secondary">
                    Mobile: {invoice.phone}
                  </Typography>
                )}
              </Box>
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                  Payment Method & Status
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#059669' }}>
                  {invoice.paymentMethod || 'Cash'} • {(invoice.paymentStatus || 'PAID').toUpperCase()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  E-Bill Verified & Stamped
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Items Table */}
          <TableContainer sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'rgba(15, 118, 110, 0.05)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Item Description</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Variant</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Price</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((it, idx) => {
                  const qty = it.quantity || 1;
                  const price = Number(it.price || 0);
                  const lineTotal = price * qty;
                  return (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ py: 1.5, fontWeight: 700, color: 'text.secondary' }}>{idx + 1}</TableCell>
                      <TableCell sx={{ py: 1.5, fontWeight: 700 }}>{it.name || 'Garment Item'}</TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip label={it.variantSku || it.size || it.color || 'Standard'} size="small" sx={{ fontSize: '0.72rem' }} />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.5, fontWeight: 700 }}>{qty}</TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }}>₹{price.toLocaleString('en-IN')}</TableCell>
                      <TableCell align="right" sx={{ py: 1.5, fontWeight: 800, color: '#0F766E' }}>₹{lineTotal.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals Section */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Box sx={{ width: { xs: '100%', sm: 300 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
              </Box>

              {discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography variant="body2" sx={{ color: '#DC2626', fontWeight: 600 }}>Discount:</Typography>
                  <Typography variant="body2" sx={{ color: '#DC2626', fontWeight: 700 }}>-₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                </Box>
              )}

              {tax > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">GST ({invoice.gst || 0}%):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, bgcolor: 'rgba(15, 118, 110, 0.08)', px: 1.5, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F766E' }}>Grand Total:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F766E' }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Terms & Footer */}
          <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#F8FAFC', border: '1px dashed #CBD5E1', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F766E', display: 'block', mb: 0.5 }}>
              Thank You for Shopping at Aleen Clothing! ✨
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Complimentary alteration & fitting support within 7 days with this digital invoice.
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <Security sx={{ fontSize: 14 }} /> Secure Computer-Generated Electronic Receipt
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PublicBillView;
