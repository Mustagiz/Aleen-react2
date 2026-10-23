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
  Chip
} from '@mui/material';
import { useData } from '../contexts/DataContext';
import { getStoredInvoiceSettings } from '../constants/invoiceTemplates';

const InvoicePrint = forwardRef(({ invoice, template, settings }, ref) => {
  const { profile = {} } = useData();

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

  if (!invoice) return null;

  return (
    <Box
      ref={ref}
      id="printable-invoice"
      className="printable-area"
      sx={{
        p: isSlip ? { xs: 2, sm: 2.5 } : { xs: 2.5, sm: 4 },
        bgcolor: '#FFFFFF',
        color: '#0F172A',
        maxWidth: isSlip ? 480 : 840,
        width: '100%',
        mx: 'auto',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        borderRadius: 2,
        fontFamily: isSlip ? 'monospace, sans-serif' : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        colorAdjust: 'exact',
        boxSizing: 'border-box',
        '@media print': {
          p: isSlip ? '3mm 2mm' : '6mm 6mm 10mm 6mm',
          maxWidth: isSlip ? '80mm' : '100%',
          width: '100%',
          boxShadow: 'none',
          borderRadius: 0,
          margin: '0 auto',
          position: 'relative'
        }
      }}
    >
      {/* Background Watermark */}
      {(profile.showWatermark ?? activeSettings.showWatermark) && !isSlip && (
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
          {profile.watermarkText || activeSettings.watermarkText || profile.businessName || 'ALEEN CLOTHING'}
        </Box>
      )}

      {/* HEADER SECTION */}
      {(profile.useCustomLetterhead || activeSettings.useCustomLetterhead) && (profile.customLetterheadImage || activeSettings.customLetterheadImage) ? (
        <Box sx={{ mb: 3, textAlign: 'center', position: 'relative', zIndex: 1, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <Box
            component="img"
            src={profile.customLetterheadImage || activeSettings.customLetterheadImage}
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
        <Box sx={{ textAlign: 'center', pb: 2, mb: 2, borderBottom: '1px dashed #64748B', position: 'relative', zIndex: 1, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 1 }}>
            {profile.businessName?.toUpperCase() || 'ALEEN CLOTHING'}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
            {profile.tagline || activeSettings.tagline || 'Boutique & Bespoke Atelier'}
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
          style={{
            background: theme.headerBg,
            color: '#FFFFFF',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          }}
          sx={{
            background: theme.headerBg,
            color: '#FFFFFF',
            p: 3,
            borderRadius: 2,
            mb: 3,
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          }}
        >
          <Box sx={{ flex: 1, pr: { sm: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ letterSpacing: 2, color: '#FDE68A', fontWeight: 800, textTransform: 'uppercase' }}>
                ✂️ {profile.tagline || activeSettings.tagline || 'Haute Couture & Bespoke Craft'}
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5, mt: 0.5, color: '#FFFFFF', fontSize: { xs: '1.4rem', sm: '1.75rem' } }}>
              {profile.businessName || 'Aleen Clothing'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5, fontSize: '0.82rem' }}>
              {profile.address}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', display: 'block', mt: 0.3 }}>
              Phone: {profile.phone} | GSTIN: {profile.gstin}
            </Typography>
          </Box>

          <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, minWidth: { sm: 220 } }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                letterSpacing: 2,
                color: '#FFFFFF',
                opacity: 0.95,
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}
            >
              TAX INVOICE
            </Typography>
            <Box sx={{ display: 'inline-block', bgcolor: 'rgba(255,255,255,0.18)', px: 1.5, py: 0.4, borderRadius: 1, mt: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FDE68A', letterSpacing: 0.5 }}>
                #{invoice.id}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.8)', mt: 0.8 }}>
              Date: {new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Typography>
          </Box>
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
          zIndex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'flex-start' },
          gap: 2,
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <Box sx={{ flex: 1 }}>
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
        </Box>

        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Payment Method: <b>{invoice.paymentMethod || 'Cash'}</b>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Invoice Date: <b>{new Date(invoice.date).toLocaleDateString('en-IN')}</b>
          </Typography>
          {invoice.paymentStatus && (
            <Chip
              label={(invoice.paymentStatus || 'paid').toUpperCase()}
              size="small"
              sx={{
                mt: 0.5,
                height: 20,
                fontWeight: 800,
                fontSize: '0.65rem',
                bgcolor: invoice.paymentStatus === 'paid' ? 'success.light' : 'warning.light',
                color: invoice.paymentStatus === 'paid' ? 'success.dark' : 'warning.dark'
              }}
            />
          )}
        </Box>
      </Box>

      {/* ITEMS TABLE */}
      <Box sx={{ mb: 3, position: 'relative', zIndex: 1, overflowX: 'auto' }}>
        <Table size={isSlip ? 'small' : 'medium'} sx={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow
              style={{ backgroundColor: theme.tableHeadBg, color: theme.tableHeadText, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              sx={{ bgcolor: theme.tableHeadBg, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            >
              <TableCell style={{ backgroundColor: theme.tableHeadBg, color: theme.tableHeadText }} sx={{ width: isSlip ? '48%' : '42%', color: theme.tableHeadText, fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', py: 1.2 }}>
                Garment / Merchandise
              </TableCell>
              {!isSlip && (
                <TableCell style={{ backgroundColor: theme.tableHeadBg, color: theme.tableHeadText }} sx={{ width: '18%', color: theme.tableHeadText, fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', py: 1.2 }}>
                  Category
                </TableCell>
              )}
              <TableCell align="center" style={{ backgroundColor: theme.tableHeadBg, color: theme.tableHeadText }} sx={{ width: isSlip ? '14%' : '10%', color: theme.tableHeadText, fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', py: 1.2 }}>
                Qty
              </TableCell>
              <TableCell align="right" style={{ backgroundColor: theme.tableHeadBg, color: theme.tableHeadText }} sx={{ width: isSlip ? '18%' : '15%', color: theme.tableHeadText, fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', py: 1.2 }}>
                Rate
              </TableCell>
              <TableCell align="right" style={{ backgroundColor: theme.tableHeadBg, color: theme.tableHeadText }} sx={{ width: isSlip ? '20%' : '15%', color: theme.tableHeadText, fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', py: 1.2 }}>
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
                  borderColor: 'divider',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                }}
              >
                <TableCell sx={{ py: 1.2, wordBreak: 'break-word' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.86rem' }}>
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
                <TableCell align="center" sx={{ py: 1.2, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '0.86rem' }}>
                  {item.quantity}
                </TableCell>
                <TableCell align="right" sx={{ py: 1.2, fontVariantNumeric: 'tabular-nums', fontSize: '0.86rem' }}>
                  ₹{Number(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell align="right" sx={{ py: 1.2, fontWeight: 800, color: 'text.primary', fontVariantNumeric: 'tabular-nums', fontSize: '0.86rem' }}>
                  ₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* SUMMARY & FINANCIAL LEDGER */}
      <Box sx={{
        mb: 3,
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: isSlip ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        gap: 2,
        pageBreakInside: 'avoid',
        breakInside: 'avoid'
      }}>
        {/* Left: Bank / UPI Details */}
        <Box sx={{ flex: 1, width: isSlip ? '100%' : '52%' }}>
          {(profile.showBankDetails ?? activeSettings.showBankDetails) && !isSlip ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(0,0,0,0.02)',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  🏛️ Settlement & Electronic Transfer Details:
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Bank: <b>{profile.bankDetails?.bankName || activeSettings.bankDetails?.bankName}</b>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    A/C No: <b>{profile.bankDetails?.accountNumber || activeSettings.bankDetails?.accountNumber}</b>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    IFSC Code: <b>{profile.bankDetails?.ifsc || activeSettings.bankDetails?.ifsc}</b>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    UPI VPA: <b style={{ color: theme.primaryColor }}>{profile.bankDetails?.upiId || activeSettings.bankDetails?.upiId}</b>
                  </Typography>
                </Box>
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
        </Box>

        {/* Right: Calculations */}
        <Box sx={{ width: isSlip ? '100%' : '44%' }}>
          <Box
            style={{
              backgroundColor: theme.totalBoxBg,
              borderColor: theme.totalBoxBorder,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.totalBoxBorder,
              bgcolor: theme.totalBoxBg,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Subtotal:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                ₹{Number(invoice.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>

            {invoice.discount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, color: '#D97706' }}>
                <Typography variant="body2">Discount ({invoice.discountPercent || invoice.discountPercentage || 0}%):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  -₹{Number(invoice.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>GST ({invoice.gst || 18}%):</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                ₹{Number(invoice.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>

            <Divider sx={{ my: 1, borderColor: theme.totalBoxBorder }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: theme.darkColor, fontSize: '0.98rem' }}>
                NET TOTAL:
              </Typography>
              <Typography variant="h5" style={{ color: theme.primaryColor }} sx={{ fontWeight: 900, color: theme.primaryColor, fontSize: '1.25rem', fontVariantNumeric: 'tabular-nums' }}>
                ₹{Number(invoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* FOOTER & TERMS */}
      <Box sx={{
        pt: 2.5,
        pb: isSlip ? 1.5 : 2.5,
        borderTop: isSlip ? '1px dashed #64748B' : '1px solid #E2E8F0',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: isSlip ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 2,
        pageBreakInside: 'avoid',
        breakInside: 'avoid'
      }}>
        <Box sx={{ flex: 1, width: isSlip ? '100%' : '65%' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', display: 'block', mb: 0.3 }}>
            Terms & Conditions:
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'pre-line', display: 'block', fontSize: '0.68rem', lineHeight: 1.4 }}>
            {profile.termsText || activeSettings.termsText}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, color: theme.primaryColor, fontSize: '0.78rem' }}>
            {profile.customFooterNote || activeSettings.customFooterNote || `Thank you for shopping with ${profile.businessName || 'Aleen Clothing'}!`}
          </Typography>
        </Box>

        {!isSlip && (profile.showSignatureStamp ?? activeSettings.showSignatureStamp) && (
          <Box sx={{ textAlign: 'center', width: { xs: '100%', sm: '30%' }, minWidth: 160 }}>
            {(profile.signatureImage || activeSettings.signatureImage) ? (
              <Box sx={{ minHeight: 46, maxHeight: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', mb: 0.5 }}>
                <img
                  src={profile.signatureImage || activeSettings.signatureImage}
                  alt="Authorized Signature"
                  style={{ maxHeight: 52, maxWidth: 150, objectFit: 'contain' }}
                />
              </Box>
            ) : (
              <Box sx={{ height: 40 }} />
            )}
            <Box sx={{ borderBottom: '1px solid #94A3B8', mb: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
              {profile.signatureLabel || activeSettings.signatureLabel || 'Authorized Signatory'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
              {profile.businessName || 'Aleen Clothing'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
});

export default InvoicePrint;
