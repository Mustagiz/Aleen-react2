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
import { numberToWordsRupees } from '../models/documentModel';
import WaxSealStamp from './common/WaxSealStamp';
import { generateUpiPaymentUrl } from '../engine/billingEngine';
import { formatSkuWithHyphen } from '../utils/helpers';
import instagramQrImg from '../assets/instagram_qr.jpg';

const InvoicePrint = forwardRef(({ invoice, template, settings, profile: profileProp }, ref) => {
  const dataCtx = useData() || {};
  const profile = profileProp || dataCtx.profile || {};
  const contextSettings = dataCtx.invoiceTemplateSettings;

  // Load settings: prop settings -> context settings -> stored settings
  const activeSettings = settings || contextSettings || getStoredInvoiceSettings();
  const activeTemplate = template || activeSettings?.template || invoice?.template || 'atelier-emerald';

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
      case 'royal-sapphire':
        return {
          primaryColor: '#1E3A8A',
          darkColor: '#0F172A',
          accentColor: '#0284C7',
          tableHeadBg: '#1E3A8A',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#F0F9FF',
          totalBoxBorder: '#0284C7',
          watermarkColor: 'rgba(30, 58, 138, 0.035)',
          borderStyle: '1px solid rgba(30, 58, 138, 0.3)',
          headerBg: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #2563EB 100%)'
        };
      case 'rose-plum':
        return {
          primaryColor: '#701A75',
          darkColor: '#4A044E',
          accentColor: '#DB2777',
          tableHeadBg: '#701A75',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#FDF2F8',
          totalBoxBorder: '#DB2777',
          watermarkColor: 'rgba(112, 26, 117, 0.035)',
          borderStyle: '1px solid rgba(112, 26, 117, 0.25)',
          headerBg: 'linear-gradient(135deg, #4A044E 0%, #701A75 60%, #9D174D 100%)'
        };
      case 'heritage-crimson':
        return {
          primaryColor: '#9F1239',
          darkColor: '#4C0519',
          accentColor: '#D97706',
          tableHeadBg: '#9F1239',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#FFF1F2',
          totalBoxBorder: '#BE123C',
          watermarkColor: 'rgba(159, 18, 57, 0.035)',
          borderStyle: 'double 3px #9F1239',
          headerBg: 'linear-gradient(135deg, #4C0519 0%, #881337 50%, #9F1239 100%)'
        };
      case 'executive-slate':
        return {
          primaryColor: '#1E293B',
          darkColor: '#0F172A',
          accentColor: '#059669',
          tableHeadBg: '#1E293B',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#F8FAFC',
          totalBoxBorder: '#059669',
          watermarkColor: 'rgba(30, 41, 59, 0.035)',
          borderStyle: '1px solid #334155',
          headerBg: 'linear-gradient(135deg, #0F172A 0%, #1E293B 70%, #334155 100%)'
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

  const storeVpa =
    profile?.bankDetails?.upiId ||
    profile?.upiId ||
    profile?.upiVpa ||
    activeSettings?.bankDetails?.upiId ||
    activeSettings?.upiId ||
    'aleenclothing@hdfcbank';

  const upiPayableAmount = Number(invoice?.balanceDue > 0 ? invoice.balanceDue : (invoice?.total || 0));
  const upiUrl = generateUpiPaymentUrl({
    vpa: storeVpa,
    payeeName: profile?.businessName || 'Aleen Clothing',
    amount: upiPayableAmount,
    invoiceNumber: invoice?.invoiceNumber || invoice?.id || ''
  });

  const qrImageUrl = upiUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(upiUrl)}`
    : '';

  const leftBoxMode = activeSettings?.leftBoxMode || profile?.leftBoxMode || 'luxury-composite';

  // Robust check for paid status across all invoice schemas, capitalizations, and template previews
  const isPaidInvoice = Boolean(
    String(invoice?.paymentStatus || '').toLowerCase() === 'paid' ||
    String(invoice?.status || '').toLowerCase() === 'paid' ||
    String(invoice?.status || '').toLowerCase() === 'settled' ||
    String(invoice?.status || '').toLowerCase() === 'completed' ||
    (invoice?.balanceDue !== undefined && Number(invoice?.balanceDue) <= 0 && Number(invoice?.total || 0) > 0) ||
    (invoice?.balance !== undefined && Number(invoice?.balance) <= 0 && Number(invoice?.total || 0) > 0) ||
    (invoice?.paidAmount !== undefined && Number(invoice?.paidAmount) >= Number(invoice?.total || 0) && Number(invoice?.total || 0) > 0) ||
    (invoice?.amountPaid !== undefined && Number(invoice?.amountPaid) >= Number(invoice?.total || 0) && Number(invoice?.total || 0) > 0) ||
    Boolean(invoice?.isSample) ||
    String(invoice?.id || '').includes('SAMPLE')
  );

  const stampVariant =
    activeTemplate === 'champagne-gold' ? 'gold' :
    activeTemplate === 'heritage-crimson' ? 'crimson' :
    activeTemplate === 'royal-sapphire' ? 'sapphire' :
    activeTemplate === 'rose-plum' ? 'plum' :
    activeTemplate === 'executive-slate' || activeTemplate === 'minimal-haute' ? 'slate' :
    'emerald';

  if (!invoice) return null;

  return (
    <Box
      ref={ref}
      id="printable-invoice"
      className="printable-area"
      sx={{
        p: isSlip ? 2.5 : 4,
        bgcolor: '#FFFFFF',
        color: '#0F172A',
        maxWidth: isSlip ? 480 : 800,
        minWidth: isSlip ? 360 : 760,
        width: isSlip ? '100%' : '800px',
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
          minWidth: 'auto',
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
            fontSize: '6.5rem',
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
          {profile.logoUrl && (
            <Box
              component="img"
              src={profile.logoUrl}
              alt={profile.businessName || 'Store Logo'}
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1.5,
                objectFit: 'contain',
                mx: 'auto',
                mb: 1,
                display: 'block'
              }}
            />
          )}
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
            RETAIL SLIP #{invoice.invoiceNumber || invoice.id}
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
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flex: 1, pr: 2 }}>
            {profile.logoUrl && (
              <Box
                component="img"
                src={profile.logoUrl}
                alt={profile.businessName || 'Store Logo'}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  objectFit: 'contain',
                  bgcolor: '#FFFFFF',
                  p: 0.5,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  flexShrink: 0
                }}
              />
            )}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ letterSpacing: 2, color: '#FDE68A', fontWeight: 800, textTransform: 'uppercase' }}>
                  ✂️ {profile.tagline || activeSettings.tagline || 'Haute Couture & Bespoke Craft'}
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5, mt: 0.5, color: '#FFFFFF', fontSize: '1.75rem' }}>
                {profile.businessName || 'Aleen Clothing'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5, fontSize: '0.82rem' }}>
                {profile.address}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', display: 'block', mt: 0.3 }}>
                Phone: {profile.phone} | GSTIN: {profile.gstin}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'right', minWidth: 220 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                letterSpacing: 2,
                color: '#FFFFFF',
                opacity: 0.95,
                fontSize: '2rem'
              }}
            >
              TAX INVOICE
            </Typography>
            <Box sx={{ display: 'inline-block', bgcolor: 'rgba(255,255,255,0.18)', px: 1.5, py: 0.4, borderRadius: 1, mt: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FDE68A', letterSpacing: 0.5 }}>
                #{invoice.invoiceNumber || invoice.id}
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
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
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

        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Payment Method: <b>{invoice.paymentMethod || 'Cash'}</b>
          </Typography>
          {invoice.payments && invoice.payments.length > 1 && (
            <Box sx={{ mt: 0.3, mb: 0.5 }}>
              {invoice.payments.map((p, pIdx) => (
                <Typography key={pIdx} variant="caption" sx={{ display: 'block', fontSize: '0.68rem', color: theme.primaryColor, fontWeight: 700 }}>
                  • {p.method}: ₹{Number(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
              ))}
            </Box>
          )}
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
                  {(item.variantSku || item.productId || item.sku) && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.67rem', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                      SKU: {formatSkuWithHyphen(item.variantSku || item.productId || item.sku)}
                    </Typography>
                  )}
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
        {/* Left: Atelier Privileges / Dynamic UPI QR / Settlement Box */}
        <Box sx={{ flex: 1, width: isSlip ? '100%' : '52%' }}>
          {(profile.showBankDetails ?? activeSettings.showBankDetails ?? true) && !isSlip && leftBoxMode !== 'none' ? (
            <Box
              sx={{
                p: 1.8,
                borderRadius: 2.5,
                bgcolor: 'rgba(15, 118, 110, 0.025)',
                border: `1.5px solid ${theme.primaryColor || '#0A4D46'}25`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box'
              }}
            >
              {leftBoxMode === 'luxury-composite' && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, pb: 0.6, borderBottom: `1px dashed ${theme.primaryColor || '#0A4D46'}30` }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>⚜️</span> Atelier Privileges & Quick Pay
                    </Typography>
                    <Box
                      sx={{
                        px: 0.9,
                        py: 0.15,
                        borderRadius: 1,
                        bgcolor: 'rgba(194, 141, 75, 0.12)',
                        border: '1px solid rgba(194, 141, 75, 0.35)',
                        color: '#B45309',
                        fontWeight: 800,
                        fontSize: '0.62rem',
                        letterSpacing: 0.4,
                        textTransform: 'uppercase'
                      }}
                    >
                      ✦ VIP Patron
                    </Box>
                  </Box>

                  {/* Both Barcodes / QR Codes on TOP, MORE BIG */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'flex-start', py: 0.75, mb: 1, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)' }}>
                    {/* UPI QR Code */}
                    {qrImageUrl && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Box
                          component="img"
                          src={qrImageUrl}
                          alt="UPI QR"
                          sx={{
                            width: 82,
                            height: 82,
                            display: 'block',
                            borderRadius: 1.5,
                            border: '1.5px solid rgba(0,0,0,0.12)',
                            p: 0.35,
                            bgcolor: '#FFFFFF',
                            boxShadow: '0 3px 8px rgba(0,0,0,0.06)'
                          }}
                        />
                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.62rem', fontWeight: 800, color: theme.primaryColor, mt: 0.4, lineHeight: 1.1 }}>
                          ⚡ Scan to Pay
                        </Typography>
                      </Box>
                    )}

                    {/* Instagram Barcode / QR Code */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Box
                        component="img"
                        src={instagramQrImg}
                        alt="Instagram QR"
                        sx={{
                          width: 82,
                          height: 82,
                          objectFit: 'contain',
                          display: 'block',
                          borderRadius: 1.5,
                          border: '1.5px solid rgba(225, 48, 108, 0.35)',
                          p: 0.3,
                          bgcolor: '#FFFFFF',
                          boxShadow: '0 3px 8px rgba(225, 48, 108, 0.08)'
                        }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', fontSize: '0.62rem', fontWeight: 800, color: '#E1306C', mt: 0.4, lineHeight: 1.1 }}>
                        📸 Instagram
                      </Typography>
                    </Box>
                  </Box>

                  {/* All Text Lines Arranged UNDER the QR Codes */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, px: 0.5, pt: 0.5, borderTop: `1px dashed ${theme.primaryColor || '#0A4D46'}20` }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', lineHeight: 1.3 }}>
                      <b style={{ color: '#D97706' }}>🎁 Loyalty Club:</b> +{invoice.loyaltyPointsEarned !== undefined ? Number(invoice.loyaltyPointsEarned) : Math.max(0, Math.floor(Number(invoice.total || 0) / 100))} reward pts accrued
                    </Typography>

                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', lineHeight: 1.3 }}>
                      <b style={{ color: (t) => t.palette.primary.main }}>✂️ Tailoring:</b> 30-Day complimentary alterations
                    </Typography>

                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', lineHeight: 1.3 }}>
                      <b style={{ color: '#4B5563' }}>✨ Garment Care:</b> Dry Clean Only • Hand-Finished
                    </Typography>

                    {storeVpa && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.66rem', mt: 0.1 }}>
                        UPI VPA: <b style={{ color: theme.primaryColor }}>{storeVpa}</b>
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {leftBoxMode === 'upi-qr' && (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {qrImageUrl && (
                    <Box sx={{ textAlign: 'center' }}>
                      <Box
                        component="img"
                        src={qrImageUrl}
                        alt="UPI QR"
                        sx={{
                          width: 80,
                          height: 80,
                          display: 'block',
                          borderRadius: 1.5,
                          border: '1.5px solid rgba(0,0,0,0.1)',
                          p: 0.4,
                          bgcolor: '#FFFFFF',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                        }}
                      />
                    </Box>
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.72rem', display: 'block', mb: 0.5 }}>
                      ⚡ Instant Scan & Pay via UPI
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                      UPI ID: <b style={{ color: theme.primaryColor }}>{storeVpa}</b>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.68rem', mt: 0.3 }}>
                      Payee: <b>{profile?.businessName || 'Aleen Clothing'}</b>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.62rem', mt: 0.5, opacity: 0.85 }}>
                      Supports Google Pay, PhonePe, Paytm, BHIM & all UPI apps
                    </Typography>
                  </Box>
                </Box>
              )}

              {leftBoxMode === 'loyalty-privileges' && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                    👑 Atelier Patron Privileges & Rewards
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                      🎁 <b>Loyalty Accrual:</b> +{invoice.loyaltyPointsEarned !== undefined ? Number(invoice.loyaltyPointsEarned) : Math.max(0, Math.floor(Number(invoice.total || 0) / 100))} points earned on this invoice
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                      ✂️ <b>Fitting Guarantee:</b> 30-Day complimentary alterations & adjustments
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                      ✦ <b>VIP Concierge:</b> Priority designer preview & bespoke bookings
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.66rem', mt: 0.5 }}>
                      UPI VPA: <b style={{ color: theme.primaryColor }}>{storeVpa}</b>
                    </Typography>
                  </Box>
                </Box>
              )}

              {leftBoxMode === 'garment-care' && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                    ✂️ Bespoke Tailoring & Garment Care
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                      ✨ <b>Fabric Care:</b> Professional dry clean only to preserve delicate zari and embroidery.
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                      ✂️ <b>Bespoke Alterations:</b> Complimentary sizing adjustments within 30 days of delivery.
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                      🏷️ <b>Exchanges:</b> Unworn garments with intact tag exchangeable within 7 days.
                    </Typography>
                  </Box>
                </Box>
              )}

              {leftBoxMode === 'concierge' && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                    💬 VIP Social & Concierge Connect
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                        📱 <b>WhatsApp VIP:</b> {profile?.phone || '+91 98765 43210'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                        📍 <b>Atelier Studio:</b> {profile?.address || 'Baba Jaan Chawk, Pune, Maharashtra'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.66rem', mt: 0.3 }}>
                        UPI ID: <b style={{ color: theme.primaryColor }}>{storeVpa}</b>
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', minWidth: 64 }}>
                      <Box
                        component="img"
                        src={instagramQrImg}
                        alt="Instagram QR"
                        sx={{
                          width: 64,
                          height: 64,
                          objectFit: 'contain',
                          display: 'block',
                          borderRadius: 1.2,
                          border: '1.5px solid rgba(225, 48, 108, 0.3)',
                          p: 0.25,
                          bgcolor: '#FFFFFF',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.06)'
                        }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', fontSize: '0.58rem', fontWeight: 800, color: '#E1306C', mt: 0.3, lineHeight: 1.1 }}>
                        📸 Instagram
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {leftBoxMode === 'banking' && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    🏛️ Settlement & Electronic Transfer Details:
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Bank: <b>{profile.bankDetails?.bankName || activeSettings.bankDetails?.bankName || 'HDFC Bank Ltd'}</b>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      A/C No: <b>{profile.bankDetails?.accountNumber || activeSettings.bankDetails?.accountNumber || '50200088992211'}</b>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      IFSC Code: <b>{profile.bankDetails?.ifsc || activeSettings.bankDetails?.ifsc || 'HDFC0001234'}</b>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      UPI VPA: <b style={{ color: theme.primaryColor }}>{storeVpa}</b>
                    </Typography>
                  </Box>
                </Box>
              )}

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

            {(Number(invoice.loyaltyDiscount) > 0 || Number(invoice.loyaltyPointsRedeemed) > 0) && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, color: '#D97706' }}>
                <Typography variant="body2">Loyalty Points ({invoice.loyaltyPointsRedeemed || 0} pts):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  -₹{Number(invoice.loyaltyDiscount || invoice.loyaltyPointsRedeemed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

            {invoice.paymentStatus !== 'paid' && invoice.paidAmount !== undefined && (
              <>
                <Divider sx={{ my: 0.8, borderColor: theme.totalBoxBorder, borderStyle: 'dashed' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.2, color: '#16A34A' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Amount Received:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                    ₹{Number(invoice.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.2, color: '#DC2626' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>Balance Due:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
                    ₹{Math.max(0, Number(invoice.total || 0) - Number(invoice.paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
          <Box sx={{ mt: 1, py: 0.6, px: 1.25, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1.5, border: '1px dashed #CBD5E1' }}>
            <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary', display: 'block' }}>
              <b>Amount in Words:</b> {numberToWordsRupees(invoice.total || 0)}
            </Typography>
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
        <Box sx={{ flex: 1, width: isSlip ? '100%' : '58%' }}>
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
          <Box sx={{ textAlign: 'center', width: '40%', minWidth: 240, position: 'relative' }}>
            {/* Retro Watermark Stamp centered directly behind / over the signature */}
            {isPaidInvoice && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '42%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 3,
                  pointerEvents: 'none'
                }}
              >
                <WaxSealStamp
                  label="PAID"
                  subtitle="ATELIER ALEEN"
                  variant={stampVariant}
                  isWatermark={true}
                  size={140}
                  animate={false}
                />
              </Box>
            )}

            {(profile.signatureImage || activeSettings.signatureImage) ? (
              <Box sx={{ minHeight: 95, maxHeight: 130, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', mb: 0.5, position: 'relative', zIndex: 1 }}>
                <img
                  src={profile.signatureImage || activeSettings.signatureImage}
                  alt="Authorized Signature"
                  style={{ maxHeight: 120, maxWidth: 280, objectFit: 'contain', mixBlendMode: 'multiply' }}
                />
              </Box>
            ) : (
              <Box sx={{ height: 80, position: 'relative', zIndex: 1 }} />
            )}
            <Box sx={{ borderBottom: '1.5px solid #94A3B8', mb: 0.5, position: 'relative', zIndex: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', fontSize: '0.75rem', position: 'relative', zIndex: 1 }}>
              {profile.signatureLabel || activeSettings.signatureLabel || 'Authorized Signatory'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', position: 'relative', zIndex: 1 }}>
              {profile.businessName || 'Aleen Clothing'}
            </Typography>
          </Box>
        )}

        {/* Fallback if signature block is disabled */}
        {(!profile.showSignatureStamp && !activeSettings.showSignatureStamp) && isPaidInvoice && (
          <Box sx={{ position: 'absolute', right: 30, bottom: 20, zIndex: 2, pointerEvents: 'none' }}>
            <WaxSealStamp
              label="PAID"
              subtitle="ATELIER ALEEN"
              variant={stampVariant}
              isWatermark={true}
              size={96}
              animate={false}
            />
          </Box>
        )}
      </Box>

      {/* Perforated Bottom Tear-Edge */}
      <Box sx={{
        mt: 2.5,
        pt: 1,
        borderTop: '2px dashed #CBD5E1',
        position: 'relative',
        textAlign: 'center',
        userSelect: 'none'
      }}>
        <Typography
          variant="caption"
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '0.64rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#94A3B8'
          }}
        >
          ✂ ┈┈┈ ATELIER CLIENT COPY • RETAIN FOR COMPLIMENTARY ALTERATIONS ┈┈┈ ✂
        </Typography>
      </Box>
    </Box>
  );
});

export default InvoicePrint;
