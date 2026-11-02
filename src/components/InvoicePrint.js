import React, { forwardRef } from 'react';
import { Box } from '@mui/material';
import { useData } from '../contexts/DataContext';
import { getStoredInvoiceSettings } from '../constants/invoiceTemplates';
import { generateUpiPaymentUrl } from '../engine/billingEngine';
import {
  resolveInvoiceFormat,
  getSheetStyles,
  SheetCornerTicks,
  InvoiceHeader,
  BillingMeta,
  ItemsSection,
  SummarySection,
  FooterSection,
  TearStrip
} from './invoice/InvoiceSections';

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
          primaryColor: '#8A6A27',
          darkColor: '#3D2C10',
          accentColor: '#C9A227',
          tableHeadBg: '#8A6A27',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#FAF5E9',
          totalBoxBorder: '#DCC48B',
          watermarkColor: 'rgba(138, 106, 39, 0.04)',
          borderStyle: 'double 3px #8A6A27',
          headerBg: 'linear-gradient(135deg, #3D2C10 0%, #8A6A27 100%)'
        };
      case 'royal-sapphire':
        return {
          primaryColor: '#0F5C8B',
          darkColor: '#06263C',
          accentColor: '#4FB4E8',
          tableHeadBg: '#0F5C8B',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#EDF6FB',
          totalBoxBorder: '#A5CFE4',
          watermarkColor: 'rgba(15, 92, 139, 0.035)',
          borderStyle: '1px solid rgba(15, 92, 139, 0.28)',
          headerBg: 'linear-gradient(135deg, #06263C 0%, #0F5C8B 60%, #1976B8 100%)'
        };
      case 'rose-plum':
        return {
          primaryColor: '#8A4A76',
          darkColor: '#3F2340',
          accentColor: '#C97BA6',
          tableHeadBg: '#8A4A76',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#F9F1F7',
          totalBoxBorder: '#DCC0D4',
          watermarkColor: 'rgba(138, 74, 118, 0.035)',
          borderStyle: '1px solid rgba(138, 74, 118, 0.25)',
          headerBg: 'linear-gradient(135deg, #3F2340 0%, #8A4A76 60%, #A85C82 100%)'
        };
      case 'heritage-crimson':
        return {
          primaryColor: '#93261F',
          darkColor: '#4A130F',
          accentColor: '#C08A3E',
          tableHeadBg: '#93261F',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#FCF2F0',
          totalBoxBorder: '#E3B3AA',
          watermarkColor: 'rgba(147, 38, 31, 0.035)',
          borderStyle: 'double 3px #93261F',
          headerBg: 'linear-gradient(135deg, #4A130F 0%, #7C1B18 55%, #93261F 100%)'
        };
      case 'executive-slate':
        return {
          primaryColor: '#4B4A47',
          darkColor: '#232220',
          accentColor: '#C05621',
          tableHeadBg: '#4B4A47',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#F6F5F3',
          totalBoxBorder: '#D5D1C8',
          watermarkColor: 'rgba(75, 74, 71, 0.035)',
          borderStyle: '1px solid #6B6862',
          headerBg: 'linear-gradient(135deg, #232220 0%, #4B4A47 70%, #6E6B65 100%)'
        };
      case 'minimal-haute':
        return {
          primaryColor: '#221C3A',
          darkColor: '#100C1F',
          accentColor: '#7C6FE8',
          tableHeadBg: '#221C3A',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#F3F2FA',
          totalBoxBorder: '#C9C3F0',
          watermarkColor: 'rgba(34, 28, 58, 0.03)',
          borderStyle: '1px solid #3A3163',
          headerBg: 'linear-gradient(135deg, #100C1F 0%, #3A3163 100%)'
        };
      case 'boutique-slip':
        return {
          primaryColor: '#5B4636',
          darkColor: '#2E2119',
          accentColor: '#8B6F52',
          tableHeadBg: '#2E2119',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#F8F4F0',
          totalBoxBorder: '#D9CDC2',
          watermarkColor: 'rgba(91, 70, 54, 0.02)',
          borderStyle: '1px dashed #8B6F52',
          headerBg: 'linear-gradient(135deg, #2E2119 0%, #5B4636 100%)'
        };
      case 'atelier-emerald':
      default:
        return {
          primaryColor: '#155D46',
          darkColor: '#08281F',
          accentColor: '#B08D57',
          tableHeadBg: '#155D46',
          tableHeadText: '#FFFFFF',
          totalBoxBg: '#EFF6F1',
          totalBoxBorder: '#B4D3C2',
          watermarkColor: 'rgba(21, 93, 70, 0.035)',
          borderStyle: '1px solid rgba(21, 93, 70, 0.28)',
          headerBg: 'linear-gradient(135deg, #08281F 0%, #155D46 100%)'
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

  // Per-template document format — presentation only, never touches the figures
  const format = resolveInvoiceFormat(activeTemplate);
  const sheet = getSheetStyles({ theme, format, isSlip });

  const ctx = {
    invoice,
    profile,
    activeSettings,
    theme,
    format,
    isSlip,
    storeVpa,
    qrImageUrl,
    leftBoxMode,
    isPaidInvoice,
    stampVariant,
    headerFormat: isSlip ? 'receipt' : format.header,
    metaFormat: isSlip ? 'slip-lines' : format.meta,
    itemsFormat: isSlip ? 'mono-slip' : format.items,
    summaryFormat: isSlip ? 'slip-stack' : format.summary,
    footerFormat: isSlip ? 'slip-thanks' : format.footer,
    tearFormat: isSlip ? 'counter-slip' : format.tear
  };

  if (!invoice) return null;

  const useCustomLetterhead =
    (profile.useCustomLetterhead || activeSettings.useCustomLetterhead) &&
    (profile.customLetterheadImage || activeSettings.customLetterheadImage);

  return (
    <Box
      ref={ref}
      id="printable-invoice"
      className="printable-area invoice-print-container"
      sx={{
        p: sheet.pagePad,
        bgcolor: '#FFFFFF',
        color: '#0F172A',
        maxWidth: isSlip ? 480 : 800,
        minWidth: { xs: '100%', sm: isSlip ? 360 : 760 },
        width: '100%',
        mx: 'auto',
        position: 'relative',
        boxShadow: { xs: 'none', sm: '0 4px 20px rgba(0,0,0,0.06)' },
        borderRadius: sheet.pageRadius,
        fontFamily: isSlip ? 'monospace, sans-serif' : '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        colorAdjust: 'exact',
        boxSizing: 'border-box',
        '@media print': {
          p: isSlip ? '3mm 2mm' : sheet.printPad,
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

      {/* Sheet frame: certificate rules, identity spine, ornament ticks or bare paper */}
      <Box sx={sheet.inner}>
        <SheetCornerTicks theme={theme} kind={sheet.ticks} />

        {useCustomLetterhead ? (
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
        ) : (
          <InvoiceHeader ctx={ctx} />
        )}

        <BillingMeta ctx={ctx} />
        <ItemsSection ctx={ctx} />
        <SummarySection ctx={ctx} />
        <FooterSection ctx={ctx} />
        <TearStrip ctx={ctx} />
      </Box>
    </Box>
  );
});

export default InvoicePrint;
