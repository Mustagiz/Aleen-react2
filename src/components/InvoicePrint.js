import React, { forwardRef } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Grid,
  Chip
} from '@mui/material';
import { useData } from '../contexts/DataContext';
import { getStoredInvoiceSettings } from '../constants/invoiceTemplates';

const InvoicePrint = forwardRef(({ invoice, template, settings }, ref) => {
  const { profile } = useData();

  // Load settings if not passed
  const activeSettings = settings || getStoredInvoiceSettings();
  const activeTemplate = template || activeSettings.template || 'atelier-emerald';

  // Template Theme Colors & Styles
  const getThemeStyles = () => {
    switch (activeTemplate) {
      case 'champagne-gold':
        return {
          primaryColor: '#D97706',
          darkColor: '#78350F',
          accentColor: '#B45309',
          tableHeadBg: '#D97706',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#FFFBEB',
          totalBoxBorder: '#F59E0B',
          watermarkColor: 'rgba(217, 119, 6, 0.04)',
          borderStyle: 'double 3px #D97706',
          headerBg: 'linear-gradient(135deg, #78350F 0%, #D97706 100%)'
        };
      case 'minimal-haute':
        return {
          primaryColor: '#18181B',
          darkColor: '#09090B',
          accentColor: '#52525B',
          tableHeadBg: '#18181B',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#F4F4F5',
          totalBoxBorder: '#27272A',
          watermarkColor: 'rgba(24, 24, 27, 0.03)',
          borderStyle: '1px solid #18181B',
          headerBg: 'linear-gradient(135deg, #09090B 0%, #27272A 100%)'
        };
      case 'boutique-slip':
        return {
          primaryColor: '#334155',
          darkColor: '#1E293B',
          accentColor: '#0F766E',
          tableHeadBg: '#F1F5F9',
          tableHeadText: '#0F172A',
          totalBoxBg: '#F8FAFC',
          totalBoxBorder: '#CBD5E1',
          watermarkColor: 'rgba(51, 65, 85, 0.02)',
          borderStyle: '1px dashed #64748B',
          headerBg: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)'
        };
      case 'atelier-emerald':
      default:
        return {
          primaryColor: '#0F766E',
          darkColor: '#042F2E',
          accentColor: '#D97706',
          tableHeadBg: '#0F766E',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#F0FDF4',
          totalBoxBorder: '#0F766E',
          watermarkColor: 'rgba(15, 118, 110, 0.035)',
          borderStyle: '1px solid rgba(15, 118, 110, 0.3)',
          headerBg: 'linear-gradient(135deg, #042F2E 0%, #0F766E 100%)'
        };
    }
  };

  const theme = getThemeStyles();
  const isSlip = activeTemplate === 'boutique-slip';

  return (
    <Box
      ref={ref}
      className="printable-area"
      sx={{
        p: isSlip ? { xs: 2, sm: 2.5 } : { xs: 2, sm: 4 },
        bgcolor: '#FFFFFF',
        color: '#0F172A',
        maxWidth: isSlip ? 480 : 840,
        mx: 'auto',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        borderRadius: 2,
        fontFamily: isSlip ? 'monospace, sans-serif' : 'system-ui, -apple-system, sans-serif',
        '@media print': {
          p: 0,
          maxWidth: isSlip ? '80mm' : 'none',
          boxShadow: 'none',
          borderRadius: 0,
          '@page': {
            size: isSlip ? '80mm auto' : 'A4',
            margin: isSlip ? '4mm' : '10mm'
          }
        }
      }}
    >
      {/* Background Watermark */}
      {activeSettings.showWatermark && !isSlip && (
        <Box
          sx={{
            position: 'absolute',
            top: '48%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            fontSize: { xs: '3.5rem', sm: '6.5rem' },
            fontWeight: 900,
            color: theme.watermarkColor,
            letterSpacing: '0.2em',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 0,
            textTransform: 'uppercase'
          }}
        >
          {activeSettings.watermarkText || 'ALEEN CLOTHING'}
        </Box>
      )}

      {/* HEADER SECTION */}
      {activeSettings.useCustomLetterhead && activeSettings.customLetterheadImage ? (
        <Box sx={{ mb: 3, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Box
            component="img"
            src={activeSettings.customLetterheadImage}
            alt="Atelier Letterhead"
            sx={{
              width: '100%',
              maxHeight: 160,
              objectFit: 'contain',
              borderRadius: 1
            }}
          />
        </Box>
      ) : isSlip ? (
        /* Slip Header */
        <Box sx={{ textAlign: 'center', pb: 2, mb: 2, borderBottom: '1px dashed #64748B', position: 'relative', zIndex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 1 }}>
            {profile.businessName?.toUpperCase() || 'ALEEN CLOTHING'}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
            {activeSettings.tagline || 'Boutique & Bespoke Atelier'}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            {profile.address}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            Ph: {profile.phone} | GST: {profile.gstin}
          </Typography>
          <Box sx={{ mt: 1.5, display: 'inline-block', px: 2, py: 0.5, bgcolor: '#f1f5f9', borderRadius: 1, fontWeight: 800, fontSize: '0.8rem' }}>
            RETAIL SLIP #{invoice.id}
          </Box>
        </Box>
      ) : (
        /* Full Luxury Header Banner */
        <Box
          sx={{
            background: theme.headerBg,
            color: '#FFFFFF',
            p: 3,
            borderRadius: 2,
            mb: 3,
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={7}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ letterSpacing: 2, color: '#FDE68A', fontWeight: 800, textTransform: 'uppercase' }}>
                  ✂️ Haute Couture & Bespoke Craft
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5, mt: 0.5, color: '#FFFFFF' }}>
                {profile.businessName || 'Aleen Clothing'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5, fontSize: '0.82rem' }}>
                {profile.address}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', display: 'block', mt: 0.3 }}>
                Phone: {profile.phone} | GSTIN: {profile.gstin}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={5} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  letterSpacing: 2,
                  color: '#FFFFFF',
                  opacity: 0.95,
                  fontSize: { xs: '1.6rem', sm: '2.2rem' }
                }}
              >
                TAX INVOICE
              </Typography>
              <Box sx={{ display: 'inline-block', bgcolor: 'rgba(255,255,255,0.15)', px: 1.5, py: 0.4, borderRadius: 1, mt: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FDE68A', letterSpacing: 0.5 }}>
                  #{invoice.id}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.8)', mt: 0.8 }}>
                Date: {new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* CLIENT & BILLING METADATA */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: isSlip ? 'transparent' : 'rgba(0,0,0,0.01)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={7}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: 1 }}>
              Billed To (Client Profile):
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.2 }}>
              {invoice.customer || 'Walk-in Patron'}
            </Typography>
            {invoice.phone && (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                Contact: {invoice.phone}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={5} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Box sx={{ display: 'inline-block', textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Payment Method: <b>{invoice.paymentMethod || 'Cash'}</b>
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Invoice Date: <b>{new Date(invoice.date).toLocaleDateString('en-IN')}</b>
              </Typography>
              {invoice.status && (
                <Chip
                  label={invoice.status.toUpperCase()}
                  size="small"
                  sx={{
                    mt: 0.5,
                    height: 20,
                    fontWeight: 800,
                    fontSize: '0.65rem',
                    bgcolor: invoice.status === 'paid' ? 'success.light' : 'warning.light',
                    color: invoice.status === 'paid' ? 'success.dark' : 'warning.dark'
                  }}
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ITEMS TABLE */}
      <Box sx={{ mb: 3, position: 'relative', zIndex: 1 }}>
        <Table size={isSlip ? 'small' : 'medium'}>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.tableHeadBg }}>
              <TableCell sx={{ color: theme.tableHeadText, fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                Garment / Merchandise
              </TableCell>
              {!isSlip && (
                <TableCell sx={{ color: theme.tableHeadText, fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  Category
                </TableCell>
              )}
              <TableCell align="center" sx={{ color: theme.tableHeadText, fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                Qty
              </TableCell>
              <TableCell align="right" sx={{ color: theme.tableHeadText, fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                Rate
              </TableCell>
              <TableCell align="right" sx={{ color: theme.tableHeadText, fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                Amount
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice.items?.map((item, idx) => (
              <TableRow
                key={idx}
                sx={{
                  '&:nth-of-type(even)': { bgcolor: isSlip ? 'transparent' : 'rgba(0,0,0,0.015)' },
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <TableCell sx={{ py: 1.2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {item.name}
                  </Typography>
                  {isSlip && item.category && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      {item.category}
                    </Typography>
                  )}
                </TableCell>
                {!isSlip && (
                  <TableCell sx={{ py: 1.2 }}>
                    <Chip
                      size="small"
                      label={item.category || 'Atelier Wear'}
                      sx={{ fontSize: '0.7rem', height: 22, fontWeight: 600, bgcolor: 'action.hover' }}
                    />
                  </TableCell>
                )}
                <TableCell align="center" sx={{ py: 1.2, fontWeight: 700 }}>
                  {item.quantity}
                </TableCell>
                <TableCell align="right" sx={{ py: 1.2 }}>
                  ₹{(item.price || 0).toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ py: 1.2, fontWeight: 800, color: 'text.primary' }}>
                  ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* SUMMARY & FINANCIAL LEDGER */}
      <Box sx={{ mb: 3, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={2}>
          {/* Left: Bank / UPI Details */}
          <Grid item xs={12} sm={isSlip ? 12 : 6}>
            {activeSettings.showBankDetails && !isSlip ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(0,0,0,0.02)',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%'
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  🏛️ Settlement & Electronic Transfer Details:
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Bank: <b>{activeSettings.bankDetails?.bankName}</b>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    A/C No: <b>{activeSettings.bankDetails?.accountNumber}</b>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    IFSC Code: <b>{activeSettings.bankDetails?.ifsc}</b>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    UPI VPA: <b style={{ color: theme.primaryColor }}>{activeSettings.bankDetails?.upiId}</b>
                  </Typography>
                </Box>
                {invoice.notes && (
                  <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      <b>Note:</b> {invoice.notes}
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : invoice.notes ? (
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  <b>Note:</b> {invoice.notes}
                </Typography>
              </Box>
            ) : null}
          </Grid>

          {/* Right: Calculations */}
          <Grid item xs={12} sm={isSlip ? 12 : 6}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: theme.totalBoxBorder,
                bgcolor: theme.totalBoxBg
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Subtotal:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{(invoice.subtotal || 0).toFixed(2)}</Typography>
              </Box>

              {invoice.discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, color: '#D97706' }}>
                  <Typography variant="body2">Discount ({invoice.discountPercentage || 0}%):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>-₹{(invoice.discount || 0).toFixed(2)}</Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>GST ({invoice.gst || 18}%):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{(invoice.tax || 0).toFixed(2)}</Typography>
              </Box>

              <Divider sx={{ my: 1, borderColor: theme.totalBoxBorder }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: theme.darkColor }}>
                  NET TOTAL:
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: theme.primaryColor }}>
                  ₹{(invoice.total || 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* FOOTER & TERMS */}
      <Box sx={{ pt: 2, borderTop: isSlip ? '1px dashed #64748B' : '1px solid #E2E8F0', position: 'relative', zIndex: 1 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={isSlip ? 12 : 8}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', display: 'block', mb: 0.3 }}>
              Terms & Conditions:
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'pre-line', display: 'block', fontSize: '0.68rem', lineHeight: 1.4 }}>
              {activeSettings.termsText}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, color: theme.primaryColor, fontSize: '0.78rem' }}>
              {activeSettings.customFooterNote || `Thank you for shopping with ${profile.businessName}!`}
            </Typography>
          </Grid>

          {!isSlip && activeSettings.showSignatureStamp && (
            <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'inline-block', textAlign: 'center', minWidth: 160 }}>
                <Box sx={{ height: 40 }} />
                <Box sx={{ borderBottom: '1px solid #94A3B8', mb: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                  {activeSettings.signatureLabel || 'Authorized Signatory'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                  {profile.businessName}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
});

export default InvoicePrint;
