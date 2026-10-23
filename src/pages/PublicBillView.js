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
  Security
} from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
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

        let foundInvoice = null;
        try {
          const invoiceSnap = await getDoc(doc(db, 'invoices', id));
          if (invoiceSnap.exists()) {
            foundInvoice = { id: invoiceSnap.id, ...invoiceSnap.data() };
          }
        } catch (dbErr) {
          console.warn('Firestore fetch failed, checking local storage:', dbErr);
        }

        // Fallback: check localStorage for recent invoices
        if (!foundInvoice) {
          try {
            const localInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            foundInvoice = localInvoices.find(inv => String(inv.id) === String(id));
          } catch (localErr) {
            console.warn('Local storage invoice check failed:', localErr);
          }
        }

        if (foundInvoice) {
          setInvoice(foundInvoice);
        } else {
          setError(`Invoice #${id} could not be found. Please check your link or contact the store.`);
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
      const invoiceNumber = `INV-${invoice.id}`;
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

  // Auto download trigger if query param download=true
  useEffect(() => {
    if (autoDownload && invoice && !loading) {
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, invoice, loading]);

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
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Official E-Invoice #{invoice.id}
              </Typography>
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
                Invoice #{invoice.id}
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
