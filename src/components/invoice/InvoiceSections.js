import React from 'react';
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
import { INVOICE_TEMPLATES } from '../../constants/invoiceTemplates';
import { numberToWordsRupees } from '../../models/documentModel';
import { formatSkuWithHyphen } from '../../utils/helpers';
import { ScriptWordmark, TrackedTagline } from '../brand/BrandLockup';
import WaxSealStamp from '../common/WaxSealStamp';
import instagramQrImg from '../../assets/instagram_qr.jpg';

const DISPLAY_STACK = '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const SERIF_STACK = 'Georgia, "Times New Roman", serif';
const MONO_STACK = 'monospace, sans-serif';

const EXACT = { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' };

const money = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const longDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const FALLBACK_FORMAT = {
  header: 'banner',
  sheet: 'soft',
  meta: 'card',
  items: 'banded-table',
  summary: 'split-privileges',
  footer: 'signature-right',
  tear: 'client-copy'
};

export const resolveInvoiceFormat = (templateId) => {
  const found = INVOICE_TEMPLATES.find((t) => t.id === templateId);
  return { ...FALLBACK_FORMAT, ...(found && found.format ? found.format : {}) };
};

/* ------------------------------------------------------------------ *
 * Sheet frame: the paper treatment wrapped around the document body
 * ------------------------------------------------------------------ */

const SHEET_PAGES = {
  soft: { pagePad: { xs: 1.5, sm: 4 }, printPad: '6mm 6mm 10mm 6mm', pageRadius: { xs: 1, sm: 1.5 } },
  'double-rule': { pagePad: { xs: 1, sm: 2 }, printPad: '3mm', pageRadius: 1 },
  spine: { pagePad: { xs: 1.25, sm: 2 }, printPad: '4mm', pageRadius: 1 },
  hairline: { pagePad: { xs: 1.25, sm: 2.5 }, printPad: '4mm', pageRadius: 0.5 },
  ornament: { pagePad: { xs: 1, sm: 2 }, printPad: '3mm', pageRadius: 0.5 },
  flat: { pagePad: { xs: 1, sm: 1.5 }, printPad: '3mm', pageRadius: 0 },
  airy: { pagePad: { xs: 1.5, sm: 4.5 }, printPad: '8mm 8mm 10mm 8mm', pageRadius: { xs: 1, sm: 1.5 } },
  dashed: { pagePad: { xs: 1.5, sm: 2.5 }, printPad: '3mm 2mm', pageRadius: { xs: 1, sm: 1.5 } }
};

export const getSheetStyles = ({ theme, format, isSlip }) => {
  const key = isSlip ? 'dashed' : format.sheet;
  const page = SHEET_PAGES[key] || SHEET_PAGES.soft;
  const inner = { position: 'relative', zIndex: 1 };
  let ticks = null;

  switch (key) {
    case 'double-rule':
      Object.assign(inner, {
        p: { xs: 1.5, sm: 2.5 },
        borderRadius: 0.5,
        border: `1px solid ${theme.primaryColor}`,
        boxShadow: `inset 0 0 0 3px #FFFFFF, inset 0 0 0 4px ${theme.accentColor}`,
        ...EXACT
      });
      break;
    case 'spine':
      Object.assign(inner, {
        p: { xs: 1.5, sm: 2.5 },
        pl: { xs: 1.75, sm: 2.75 },
        borderTop: `1px solid ${theme.totalBoxBorder}`,
        borderRight: `1px solid ${theme.totalBoxBorder}`,
        borderBottom: `1px solid ${theme.totalBoxBorder}`,
        borderLeft: `6px solid ${theme.primaryColor}`,
        ...EXACT
      });
      break;
    case 'hairline':
      Object.assign(inner, {
        p: { xs: 1.5, sm: 2.75 },
        borderRadius: 0.5,
        border: `1px solid ${theme.totalBoxBorder}`,
        boxShadow: `inset 0 0 0 4px #FFFFFF, inset 0 0 0 5px ${theme.totalBoxBorder}`,
        ...EXACT
      });
      break;
    case 'ornament':
      Object.assign(inner, {
        p: { xs: 2, sm: 3 },
        borderRadius: 0.5,
        border: `3px double ${theme.primaryColor}`,
        ...EXACT
      });
      ticks = 'brass';
      break;
    case 'flat':
      Object.assign(inner, {
        p: { xs: 1.5, sm: 2.25 },
        borderRadius: 0,
        border: `1px solid ${theme.primaryColor}`,
        ...EXACT
      });
      break;
    case 'airy':
      Object.assign(inner, { p: { xs: 0.5, sm: 1.5 } });
      break;
    default:
      break;
  }

  return { ...page, inner, ticks };
};

export const SheetCornerTicks = ({ theme, kind }) => {
  if (kind !== 'brass') return null;
  const corners = [
    { top: 6, left: 6, borderTop: `2px solid ${theme.accentColor}`, borderLeft: `2px solid ${theme.accentColor}` },
    { top: 6, right: 6, borderTop: `2px solid ${theme.accentColor}`, borderRight: `2px solid ${theme.accentColor}` },
    { bottom: 6, left: 6, borderBottom: `2px solid ${theme.accentColor}`, borderLeft: `2px solid ${theme.accentColor}` },
    { bottom: 6, right: 6, borderBottom: `2px solid ${theme.accentColor}`, borderRight: `2px solid ${theme.accentColor}` }
  ];
  return (
    <>
      {corners.map((corner, idx) => (
        <Box
          key={idx}
          sx={{ position: 'absolute', width: 14, height: 14, pointerEvents: 'none', ...EXACT, ...corner }}
        />
      ))}
    </>
  );
};

/* ------------------------------------------------------------------ *
 * Item ledger layouts
 * ------------------------------------------------------------------ */

const ITEM_LAYOUTS = {
  'banded-table': {
    kind: 'table',
    size: 'medium',
    headerBg: 'band',
    headerPy: 1.2,
    headerFont: { xs: '0.72rem', sm: '0.78rem' },
    headerWeight: 800,
    headerSpacing: 0.3,
    headerRule: null,
    bodyPy: 1.2,
    cellPx: { xs: 1, sm: 2 },
    numPx: { xs: 0.5, sm: 1.5 },
    zebra: 'neutral',
    rowRule: 'divider',
    vRule: false,
    cellBorder: null,
    index: false,
    categoryMode: 'chip',
    categoryLabel: 'Category',
    nameWeight: 700,
    nameFamily: DISPLAY_STACK,
    nameSize: { xs: '0.8rem', sm: '0.86rem' },
    nameCase: 'none',
    widths: {
      name: { xs: '44%', sm: '42%' },
      category: '18%',
      qty: { xs: '14%', sm: '10%' },
      rate: { xs: '20%', sm: '15%' },
      amount: { xs: '22%', sm: '15%' }
    }
  },
  'ledger-table': {
    kind: 'table',
    size: 'medium',
    headerBg: 'band',
    headerPy: 1,
    headerFont: { xs: '0.7rem', sm: '0.76rem' },
    headerWeight: 800,
    headerSpacing: 1.4,
    headerRule: 'double',
    bodyPy: 1.15,
    cellPx: { xs: 1, sm: 1.75 },
    numPx: { xs: 0.5, sm: 1.25 },
    zebra: 'none',
    rowRule: 'soft',
    vRule: false,
    cellBorder: null,
    index: false,
    categoryMode: 'text',
    categoryLabel: 'Category',
    nameWeight: 700,
    nameFamily: SERIF_STACK,
    nameSize: { xs: '0.82rem', sm: '0.9rem' },
    nameCase: 'none',
    widths: {
      name: { xs: '40%', sm: '38%' },
      category: '17%',
      qty: { xs: '12%', sm: '10%' },
      rate: { xs: '19%', sm: '16%' },
      amount: { xs: '22%', sm: '19%' }
    }
  },
  'ruled-table': {
    kind: 'table',
    size: 'medium',
    headerBg: 'band',
    headerPy: 0.9,
    headerFont: { xs: '0.68rem', sm: '0.74rem' },
    headerWeight: 800,
    headerSpacing: 1,
    headerRule: 'thick',
    bodyPy: 1.05,
    cellPx: { xs: 1, sm: 1.75 },
    numPx: { xs: 0.5, sm: 1.25 },
    zebra: 'tint',
    rowRule: 'none',
    vRule: true,
    cellBorder: null,
    index: false,
    categoryMode: 'outline-chip',
    categoryLabel: 'Category',
    nameWeight: 600,
    nameFamily: DISPLAY_STACK,
    nameSize: { xs: '0.8rem', sm: '0.86rem' },
    nameCase: 'none',
    widths: {
      name: { xs: '40%', sm: '38%' },
      category: '18%',
      qty: { xs: '12%', sm: '10%' },
      rate: { xs: '18%', sm: '16%' },
      amount: { xs: '22%', sm: '18%' }
    }
  },
  'provenance-table': {
    kind: 'table',
    size: 'medium',
    headerBg: 'band',
    headerPy: 1,
    headerFont: { xs: '0.68rem', sm: '0.74rem' },
    headerWeight: 800,
    headerSpacing: 1.2,
    headerRule: 'double',
    bodyPy: 1.15,
    cellPx: { xs: 1, sm: 1.5 },
    numPx: { xs: 0.5, sm: 1.25 },
    zebra: 'none',
    rowRule: 'none',
    vRule: false,
    cellBorder: 'soft',
    index: true,
    categoryMode: 'text',
    categoryLabel: 'Provenance',
    nameWeight: 700,
    nameFamily: SERIF_STACK,
    nameSize: { xs: '0.82rem', sm: '0.9rem' },
    nameCase: 'none',
    widths: {
      index: '5%',
      name: { xs: '33%', sm: '31%' },
      category: '20%',
      qty: '8%',
      rate: '17%',
      amount: '19%'
    }
  },
  'grid-table': {
    kind: 'table',
    size: 'small',
    headerBg: 'flat',
    headerPy: 0.6,
    headerFont: { xs: '0.6rem', sm: '0.66rem' },
    headerWeight: 700,
    headerSpacing: 1,
    headerRule: 'none',
    bodyPy: 0.6,
    cellPx: { xs: 0.75, sm: 1 },
    numPx: { xs: 0.75, sm: 1 },
    zebra: 'neutral',
    rowRule: 'none',
    vRule: false,
    cellBorder: 'hard',
    index: true,
    categoryMode: 'plain',
    categoryLabel: 'Category',
    nameWeight: 600,
    nameFamily: DISPLAY_STACK,
    nameSize: { xs: '0.76rem', sm: '0.82rem' },
    nameCase: 'uppercase',
    widths: {
      index: '5%',
      name: { xs: '35%', sm: '33%' },
      category: '15%',
      qty: '9%',
      rate: '18%',
      amount: '20%'
    }
  },
  'editorial-list': {
    kind: 'list',
    listStyle: 'editorial',
    categoryLabel: 'Category',
    widths: {}
  },
  'airy-list': {
    kind: 'list',
    listStyle: 'airy',
    categoryLabel: 'Category',
    widths: {}
  },
  'mono-slip': {
    kind: 'table',
    size: 'small',
    headerBg: 'flat',
    headerPy: 0.75,
    headerFont: { xs: '0.72rem', sm: '0.78rem' },
    headerWeight: 800,
    headerSpacing: 0.3,
    headerRule: null,
    bodyPy: 1.2,
    cellPx: { xs: 0.75, sm: 1.25 },
    numPx: { xs: 0.25, sm: 0.5 },
    numSize: { xs: '0.66rem', sm: '0.72rem' },
    zebra: 'none',
    rowRule: 'divider',
    vRule: false,
    cellBorder: null,
    index: false,
    categoryMode: 'inline',
    categoryLabel: 'Category',
    nameWeight: 700,
    nameFamily: MONO_STACK,
    nameSize: { xs: '0.76rem', sm: '0.82rem' },
    nameCase: 'none',
    widths: {
      name: { xs: '38%', sm: '38%' },
      qty: { xs: '12%', sm: '12%' },
      rate: { xs: '25%', sm: '25%' },
      amount: { xs: '25%', sm: '25%' }
    }
  }
};

/* ------------------------------------------------------------------ *
 * Letterhead / header block — 8 distinct document identities
 * ------------------------------------------------------------------ */

const LogoTile = ({ profile, sx }) =>
  profile.logoUrl ? (
    <Box
      component="img"
      src={profile.logoUrl}
      alt={profile.businessName || 'Store Logo'}
      sx={{ display: 'block', objectFit: 'contain', ...sx }}
    />
  ) : null;

export const InvoiceHeader = ({ ctx }) => {
  const { invoice, profile, activeSettings, theme, headerFormat } = ctx;
  const tagline = profile.tagline || activeSettings.tagline || 'Haute Couture & Bespoke Craft';
  const businessName = profile.businessName || 'Aleen Clothing';
  const docNumber = invoice.invoiceNumber || invoice.id;

  const shell = { position: 'relative', zIndex: 1, pageBreakInside: 'avoid', breakInside: 'avoid' };

  if (headerFormat === 'receipt') {
    return (
      <Box sx={{ ...shell, textAlign: 'center', pb: 2, mb: 2, borderBottom: '1px dashed #64748B' }}>
        <LogoTile profile={profile} sx={{ width: 48, height: 48, borderRadius: 1, mx: 'auto', mb: 0.5 }} />
        <ScriptWordmark name={businessName} fontSize={{ xs: '1.6rem', sm: '1.85rem' }} align="center" sx={{ mb: 0.25 }} />
        <TrackedTagline text={tagline} align="center" rules fontSize="0.54rem" ruleWidth={22} sx={{ mb: 0.5 }} />
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
          {profile.address}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
          Ph: {profile.phone} | GST: {profile.gstin}
        </Typography>
        <Box sx={{ mt: 1.5, display: 'inline-block', px: 2, py: 0.5, bgcolor: '#f1f5f9', borderRadius: 0.5, fontWeight: 800, fontSize: '0.8rem' }}>
          RETAIL SLIP #{docNumber}
        </Box>
      </Box>
    );
  }

  if (headerFormat === 'crest') {
    return (
      <Box sx={{ ...shell, mb: { xs: 2, sm: 3 }, textAlign: 'center', px: { xs: 0.5, sm: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.25, mb: 1 }}>
          <Box sx={{ width: 34, height: 1, bgcolor: theme.accentColor, ...EXACT }} />
          {profile.logoUrl ? (
            <LogoTile
              profile={profile}
              sx={{
                width: 52,
                height: 52,
                borderRadius: 0.5,
                p: 0.5,
                border: `1px solid ${theme.primaryColor}`,
                bgcolor: '#FFFFFF'
              }}
            />
          ) : (
            <Box sx={{ width: 10, height: 10, transform: 'rotate(45deg)', bgcolor: theme.accentColor, ...EXACT }} />
          )}
          <Box sx={{ width: 34, height: 1, bgcolor: theme.accentColor, ...EXACT }} />
        </Box>
        <ScriptWordmark
          name={businessName}
          color={theme.darkColor}
          fontSize={{ xs: '2.35rem', sm: '3rem' }}
          lineHeight={1.05}
          align="center"
          sx={{ mt: -0.5 }}
        />
        <TrackedTagline
          text={tagline}
          color={theme.primaryColor}
          align="center"
          rules
          ruleColor={theme.accentColor}
          ruleWidth={44}
          fontSize="0.62rem"
          sx={{ mt: 0.5 }}
        />
        <Box sx={{ height: 5, mx: { xs: 2, sm: 6 }, my: 1.25, borderTop: `1px solid ${theme.primaryColor}`, borderBottom: `1px solid ${theme.primaryColor}`, ...EXACT }} />
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.74rem' }}>
          {profile.address}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.7rem', mt: 0.2 }}>
          Phone: {profile.phone} | GSTIN: {profile.gstin}
        </Typography>
        <Box
          sx={{
            mt: 1.75,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr auto 1fr' },
            alignItems: 'center',
            gap: { xs: 0.5, sm: 2 },
            borderTop: `1px solid ${theme.totalBoxBorder}`,
            borderBottom: `1px solid ${theme.totalBoxBorder}`,
            py: 0.85
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.68rem', color: theme.darkColor, fontFamily: MONO_STACK, textAlign: { xs: 'center', sm: 'left' } }}>
            Invoice #{docNumber}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontFamily: SERIF_STACK, fontWeight: 700, letterSpacing: { xs: 3, sm: 6 }, textTransform: 'uppercase', color: theme.primaryColor, fontSize: { xs: '1rem', sm: '1.2rem' }, textAlign: 'center' }}
          >
            Tax Invoice
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.68rem', color: theme.darkColor, textAlign: { xs: 'center', sm: 'right' } }}>
            Dated {longDate(invoice.date)}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (headerFormat === 'rail') {
    return (
      <Box
        sx={{
          ...shell,
          mb: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'stretch',
          border: `1px solid ${theme.totalBoxBorder}`,
          borderRadius: 1,
          overflow: 'hidden',
          ...EXACT
        }}
      >
        <Box
          sx={{
            flex: { sm: '0 0 58%' },
            p: { xs: 1.75, sm: 2.25 },
            background: theme.headerBg,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.75,
            ...EXACT
          }}
        >
          <LogoTile
            profile={profile}
            sx={{ width: 52, height: 52, borderRadius: 0.75, bgcolor: '#FFFFFF', p: 0.5, flexShrink: 0, boxShadow: '0 3px 10px rgba(0,0,0,0.18)' }}
          />
          <Box sx={{ minWidth: 0 }}>
            <ScriptWordmark name={businessName} color="#FFFFFF" fontSize={{ xs: '1.85rem', sm: '2.3rem' }} sx={{ mb: 0.1 }} />
            <TrackedTagline text={tagline} color="rgba(255,255,255,0.9)" fontSize="0.58rem" />
            <Typography variant="caption" sx={{ display: 'block', mt: 0.6, color: 'rgba(255,255,255,0.82)', fontSize: '0.72rem', lineHeight: 1.35 }}>
              {profile.address}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.2, color: 'rgba(255,255,255,0.72)', fontSize: '0.68rem' }}>
              Phone: {profile.phone} | GSTIN: {profile.gstin}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flex: 1, p: { xs: 1.75, sm: 2.25 }, bgcolor: theme.totalBoxBg, textAlign: { xs: 'left', sm: 'right' }, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.5, ...EXACT }}>
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: theme.primaryColor, fontSize: '0.66rem' }}>
            Tax Invoice
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: MONO_STACK, color: theme.darkColor, letterSpacing: -0.5, fontSize: { xs: '1.15rem', sm: '1.45rem' }, lineHeight: 1.15 }}>
            #{docNumber}
          </Typography>
          <Box sx={{ height: 1, width: { xs: '40%', sm: '60%' }, bgcolor: theme.primaryColor, opacity: 0.35, my: 0.25, ml: { xs: 0, sm: 'auto' }, ...EXACT }} />
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: theme.darkColor, fontSize: '0.7rem' }}>
            {longDate(invoice.date)}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (headerFormat === 'masthead') {
    return (
      <Box sx={{ ...shell, mb: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, pb: 0.5, borderBottom: `1px solid ${theme.primaryColor}` }}>
          <ScriptWordmark name={businessName} color={theme.darkColor} fontSize={{ xs: '1.7rem', sm: '2.05rem' }} lineHeight={1.15} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrackedTagline text={tagline} color={theme.primaryColor} fontSize="0.58rem" align="right" />
            <LogoTile profile={profile} sx={{ width: 34, height: 34, borderRadius: 0.5 }} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mt: 1.75 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: SERIF_STACK,
                fontWeight: 400,
                letterSpacing: { xs: 2, sm: 5 },
                textTransform: 'uppercase',
                color: theme.darkColor,
                fontSize: { xs: '1.3rem', sm: '1.85rem' },
                lineHeight: 1.1
              }}
            >
              Tax Invoice
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontFamily: MONO_STACK, fontWeight: 700, letterSpacing: 1.2, color: theme.primaryColor, fontSize: '0.76rem' }}>
              NO. {docNumber}
            </Typography>
          </Box>
          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.72rem' }}>
              {profile.address}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.7rem', mt: 0.15 }}>
              {profile.phone} | GSTIN {profile.gstin}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.4, fontWeight: 800, letterSpacing: 1.6, textTransform: 'uppercase', color: theme.darkColor, fontSize: '0.7rem' }}>
              Dated {longDate(invoice.date)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 1.25, height: 4, borderTop: `1px solid ${theme.accentColor}`, borderBottom: `1px solid ${theme.accentColor}`, ...EXACT }} />
      </Box>
    );
  }

  if (headerFormat === 'framed-crest') {
    return (
      <Box sx={{ ...shell, mb: { xs: 2, sm: 3 }, textAlign: 'center', px: { xs: 0.5, sm: 2 } }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 58, height: 58, transform: 'none', border: `1px solid ${theme.accentColor}`, borderRadius: 0.5, p: 0.5, mb: 1, ...EXACT }}>
          {profile.logoUrl ? (
            <LogoTile profile={profile} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <Box sx={{ width: 16, height: 16, transform: 'rotate(45deg)', bgcolor: theme.accentColor, ...EXACT }} />
          )}
        </Box>
        <ScriptWordmark
          name={businessName}
          color={theme.darkColor}
          fontSize={{ xs: '2.2rem', sm: '2.85rem' }}
          lineHeight={1.05}
          align="center"
          sx={{ mt: -0.5 }}
        />
        <TrackedTagline
          text={tagline}
          color={theme.primaryColor}
          align="center"
          rules
          ruleColor={theme.primaryColor}
          ruleWidth={90}
          fontSize="0.6rem"
          sx={{ mt: 0.75 }}
        />
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary', fontSize: '0.74rem' }}>
          {profile.address}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.7rem', mt: 0.15 }}>
          Phone: {profile.phone} | GSTIN: {profile.gstin}
        </Typography>
        <Box sx={{ mt: 1.5, border: `1px solid ${theme.totalBoxBorder}`, py: 0.8, px: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', ...EXACT }}>
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: theme.darkColor, fontSize: '0.68rem', fontFamily: MONO_STACK }}>
            #{docNumber}
          </Typography>
          <Typography variant="h6" sx={{ fontFamily: SERIF_STACK, fontWeight: 700, letterSpacing: { xs: 2, sm: 5 }, textTransform: 'uppercase', color: theme.primaryColor, fontSize: { xs: '0.95rem', sm: '1.15rem' } }}>
            Tax Invoice
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: theme.darkColor, fontSize: '0.68rem' }}>
            {longDate(invoice.date)}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (headerFormat === 'data-strip') {
    const fields = [
      { label: 'DOC', value: `#${docNumber}` },
      { label: 'DATE', value: longDate(invoice.date) },
      { label: 'GSTIN', value: profile.gstin },
      { label: 'PHONE', value: profile.phone }
    ];
    return (
      <Box sx={{ ...shell, mb: { xs: 2, sm: 2.5 } }}>
        <Box
          sx={{
            bgcolor: theme.darkColor,
            color: '#FFFFFF',
            px: { xs: 1.5, sm: 2 },
            py: 1.35,
            borderRadius: 0,
            borderBottom: `3px solid ${theme.accentColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            flexWrap: 'wrap',
            ...EXACT
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <LogoTile profile={profile} sx={{ width: 30, height: 30, bgcolor: '#FFFFFF', p: 0.25, borderRadius: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <ScriptWordmark name={businessName} color="#FFFFFF" fontSize={{ xs: '1.5rem', sm: '1.8rem' }} lineHeight={1.1} />
              <TrackedTagline text={tagline} color="rgba(255,255,255,0.62)" fontSize="0.52rem" tracking="0.3em" />
              <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.62rem', letterSpacing: 0.6 }}>
                {profile.address}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0, flexWrap: 'wrap' }}>
            {fields.map((field, idx) => (
              <Box key={field.label} sx={{ px: { xs: 1, sm: 1.25 }, borderLeft: idx === 0 ? 'none' : `1px solid rgba(255,255,255,0.22)` }}>
                <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: '0.54rem', fontWeight: 700, letterSpacing: 1.4 }}>
                  {field.label}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#FFFFFF', fontFamily: MONO_STACK, fontWeight: 700, fontSize: '0.72rem', mt: 0.1, whiteSpace: 'nowrap' }}>
                  {field.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: { xs: 1.5, sm: 2 }, py: 0.6, borderBottom: `1px solid ${theme.primaryColor}`, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: theme.primaryColor, fontSize: '0.72rem' }}>
            Tax Invoice
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: MONO_STACK, fontWeight: 700, letterSpacing: 0.8, color: theme.darkColor, fontSize: '0.66rem' }}>
            ORIGINAL COPY • {businessName.toUpperCase()}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (headerFormat === 'wordmark') {
    return (
      <Box sx={{ ...shell, mb: { xs: 2.5, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LogoTile profile={profile} sx={{ width: 22, height: 22, borderRadius: 0.5, flexShrink: 0 }} />
              <Box sx={{ width: 9, height: 9, bgcolor: theme.accentColor, flexShrink: 0, ...EXACT }} />
              <ScriptWordmark name={businessName} color={theme.darkColor} fontSize={{ xs: '1.9rem', sm: '2.4rem' }} lineHeight={1.1} />
            </Box>
            <TrackedTagline text={tagline} color="text.secondary" fontSize="0.58rem" tracking="0.42em" sx={{ mt: 0.35 }} />
            <Typography variant="caption" sx={{ display: 'block', mt: 0.35, color: 'text.secondary', fontSize: '0.66rem', lineHeight: 1.4 }}>
              {profile.address}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.64rem' }}>
              {profile.phone} | {profile.gstin}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: theme.accentColor, fontSize: '0.64rem' }}>
              Tax Invoice
            </Typography>
            <Typography
              variant="h2"
              sx={{ fontWeight: 300, letterSpacing: -0.5, color: theme.darkColor, fontSize: { xs: '1.5rem', sm: '2.35rem' }, lineHeight: 1.15, mt: 0.3, fontVariantNumeric: 'tabular-nums' }}
            >
              {docNumber}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.4, letterSpacing: 1.6, textTransform: 'uppercase', color: 'text.secondary', fontSize: '0.64rem' }}>
              {longDate(invoice.date)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: { xs: 1.5, sm: 2.5 }, height: 1, bgcolor: 'rgba(34,28,58,0.14)' }} />
      </Box>
    );
  }

  /* banner — house emerald identity */
  return (
    <Box
      style={{ background: theme.headerBg, color: '#FFFFFF', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      sx={{
        ...shell,
        background: theme.headerBg,
        color: '#FFFFFF',
        p: { xs: 2, sm: 3 },
        borderRadius: 1.5,
        mb: { xs: 2, sm: 3 },
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1.5, sm: 2.5 }, flex: 1, pr: { xs: 0, sm: 2 }, width: { xs: '100%', sm: 'auto' } }}>
        <LogoTile
          profile={profile}
          sx={{
            width: { xs: 50, sm: 64 },
            height: { xs: 50, sm: 64 },
            borderRadius: 1,
            bgcolor: '#FFFFFF',
            p: 0.5,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            flexShrink: 0
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <ScriptWordmark name={businessName} color="#FFFFFF" fontSize={{ xs: '1.9rem', sm: '2.5rem' }} lineHeight={1.1} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.35 }}>
            <Box sx={{ width: 3, height: 11, borderRadius: 0.25, bgcolor: theme.accentColor, flexShrink: 0, ...EXACT }} />
            <TrackedTagline text={tagline} color="rgba(255,255,255,0.92)" fontSize="0.56rem" tracking="0.3em" />
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5, fontSize: { xs: '0.74rem', sm: '0.82rem' }, wordBreak: 'break-word' }}>
            {profile.address}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', display: 'block', mt: 0.3, fontSize: { xs: '0.68rem', sm: '0.75rem' }, wordBreak: 'break-word' }}>
            Phone: {profile.phone} | GSTIN: {profile.gstin}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          textAlign: { xs: 'left', sm: 'right' },
          minWidth: { xs: 'auto', sm: 220 },
          width: { xs: '100%', sm: 'auto' },
          pt: { xs: 1.5, sm: 0 },
          borderTop: { xs: '1px solid rgba(255,255,255,0.2)', sm: 'none' },
          display: 'flex',
          flexDirection: { xs: 'row', sm: 'column' },
          justifyContent: { xs: 'space-between', sm: 'flex-start' },
          alignItems: { xs: 'center', sm: 'flex-end' },
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: { xs: 1, sm: 2 }, color: '#FFFFFF', opacity: 0.95, fontSize: { xs: '1.3rem', sm: '2rem' }, lineHeight: 1.1 }}>
            TAX INVOICE
          </Typography>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, bgcolor: 'rgba(255,255,255,0.14)', pl: 1, pr: 1.25, py: 0.35, borderRadius: 0.75, mt: 0.6, border: '1px solid rgba(255,255,255,0.28)', ...EXACT }}>
            <Box sx={{ width: 2, height: 13, borderRadius: 0.25, bgcolor: theme.accentColor, flexShrink: 0 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: 0.5, fontSize: { xs: '0.78rem', sm: '0.875rem' }, fontFamily: 'monospace' }}>
              #{docNumber}
            </Typography>
          </Box>
        </Box>
        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.85)', mt: { xs: 0, sm: 0.8 }, fontSize: { xs: '0.72rem', sm: '0.75rem' } }}>
          Date: {longDate(invoice.date)}
        </Typography>
      </Box>
    </Box>
  );
};

/* ------------------------------------------------------------------ *
 * Client & billing metadata block
 * ------------------------------------------------------------------ */

const StatusChip = ({ invoice, shape = 0.75, outlined = false }) =>
  invoice.paymentStatus ? (
    <Chip
      label={(invoice.paymentStatus || 'paid').toUpperCase()}
      size="small"
      variant={outlined ? 'outlined' : 'filled'}
      sx={{
        mt: 0.5,
        height: 20,
        borderRadius: shape,
        fontWeight: 800,
        fontSize: '0.65rem',
        letterSpacing: 0.6,
        bgcolor: outlined ? 'transparent' : invoice.paymentStatus === 'paid' ? 'success.light' : 'warning.light',
        color: invoice.paymentStatus === 'paid' ? 'success.dark' : 'warning.dark',
        borderColor: invoice.paymentStatus === 'paid' ? 'success.light' : 'warning.light'
      }}
    />
  ) : null;

const SplitPayments = ({ invoice, color }) =>
  invoice.payments && invoice.payments.length > 1 ? (
    <Box sx={{ mt: 0.3, mb: 0.5 }}>
      {invoice.payments.map((p, pIdx) => (
        <Typography key={pIdx} variant="caption" sx={{ display: 'block', fontSize: '0.68rem', color, fontWeight: 700 }}>
          • {p.method}: ₹{Number(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Typography>
      ))}
    </Box>
  ) : null;

export const BillingMeta = ({ ctx }) => {
  const { invoice, theme, metaFormat } = ctx;
  const shell = { position: 'relative', zIndex: 1, pageBreakInside: 'avoid', breakInside: 'avoid' };

  if (metaFormat === 'inline-centered') {
    return (
      <Box sx={{ ...shell, mb: 3, py: 1.5, textAlign: 'center', borderTop: `1px solid ${theme.primaryColor}`, borderBottom: `1px solid ${theme.totalBoxBorder}`, ...EXACT }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.62rem' }}>
          Billed To
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: SERIF_STACK, color: theme.darkColor, mt: 0.15, fontSize: { xs: '0.98rem', sm: '1.05rem' } }}>
          {invoice.customer || 'Walk-in Patron'}
        </Typography>
        <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: { xs: 0.75, sm: 1.75 } }}>
          {invoice.phone && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
              Contact: <b>{invoice.phone}</b>
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            Payment: <b>{invoice.paymentMethod || 'Cash'}</b>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
            Dated: <b>{new Date(invoice.date).toLocaleDateString('en-IN')}</b>
          </Typography>
          <StatusChip invoice={invoice} shape={0.5} outlined />
        </Box>
        <SplitPayments invoice={invoice} color={theme.primaryColor} />
      </Box>
    );
  }

  if (metaFormat === 'split-grid') {
    const cellSx = { p: { xs: 1.1, sm: 1.4 }, bgcolor: '#FFFFFF' };
    const labelSx = { display: 'block', fontWeight: 800, color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: 1.4, fontSize: '0.6rem', mb: 0.2 };
    const valueSx = { display: 'block', fontWeight: 700, color: 'text.primary', fontSize: '0.86rem' };
    return (
      <Box
        sx={{
          ...shell,
          mb: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: '1px',
          bgcolor: theme.totalBoxBorder,
          border: `1px solid ${theme.totalBoxBorder}`,
          borderRadius: 1,
          overflow: 'hidden',
          ...EXACT
        }}
      >
        <Box sx={cellSx}>
          <Typography variant="caption" sx={labelSx}>
            Client
          </Typography>
          <Typography sx={valueSx}>{invoice.customer || 'Walk-in Patron'}</Typography>
        </Box>
        <Box sx={cellSx}>
          <Typography variant="caption" sx={labelSx}>
            Contact
          </Typography>
          <Typography sx={valueSx}>{invoice.phone || '—'}</Typography>
        </Box>
        <Box sx={cellSx}>
          <Typography variant="caption" sx={labelSx}>
            Document
          </Typography>
          <Typography sx={{ ...valueSx, fontFamily: MONO_STACK, fontWeight: 700 }}>
            #{invoice.invoiceNumber || invoice.id}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
            Dated {longDate(invoice.date)}
          </Typography>
        </Box>
        <Box sx={cellSx}>
          <Typography variant="caption" sx={labelSx}>
            Payment
          </Typography>
          <Typography sx={valueSx}>{invoice.paymentMethod || 'Cash'}</Typography>
          <SplitPayments invoice={invoice} color={theme.primaryColor} />
          <StatusChip invoice={invoice} shape={0.5} />
        </Box>
      </Box>
    );
  }

  if (metaFormat === 'ledger-columns') {
    const columns = [
      { label: 'Client', value: invoice.customer || 'Walk-in Patron' },
      { label: 'Contact', value: invoice.phone || '—' },
      { label: 'Payment', value: invoice.paymentMethod || 'Cash' },
      { label: 'Date', value: new Date(invoice.date).toLocaleDateString('en-IN') }
    ];
    return (
      <Box sx={{ ...shell, mb: 3, py: 1.25, borderTop: `1px solid ${theme.primaryColor}`, borderBottom: `1px solid ${theme.totalBoxBorder}` }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {columns.map((column, idx) => (
            <Box
              key={column.label}
              sx={{
                flex: { xs: '1 1 46%', sm: `1 1 ${idx === columns.length - 1 ? '22%' : '26%'} ` },
                pr: 1,
                pl: idx === 0 ? 0 : { xs: 1, sm: 1.25 },
                borderLeft: idx === 0 ? 'none' : `1px solid ${theme.totalBoxBorder}`,
                minWidth: 120
              }}
            >
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: theme.primaryColor, fontSize: '0.58rem' }}>
                {column.label}
              </Typography>
              <Typography
                sx={{
                  display: 'block',
                  mt: 0.2,
                  fontFamily: SERIF_STACK,
                  fontWeight: 600,
                  color: theme.darkColor,
                  fontSize: '0.86rem',
                  lineHeight: 1.3
                }}
              >
                {column.value}
              </Typography>
            </Box>
          ))}
          <Box sx={{ flex: '0 1 auto', display: 'flex', alignItems: 'center', gap: 1, pl: { xs: 1, sm: 1.25 }, mt: { xs: 0.75, sm: 0 } }}>
            <StatusChip invoice={invoice} shape={0.5} outlined />
          </Box>
        </Box>
        <SplitPayments invoice={invoice} color={theme.primaryColor} />
      </Box>
    );
  }

  /* card — house emerald / slip metadata */
  const isSlip = ctx.isSlip;
  return (
    <Box
      sx={{
        ...shell,
        mb: 3,
        p: { xs: 1.5, sm: 2 },
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `4px solid ${theme.primaryColor}`,
        bgcolor: isSlip ? 'transparent' : 'rgba(0,0,0,0.01)',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'flex-start' },
        gap: { xs: 1.5, sm: 2 }
      }}
    >
      <Box sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
          {isSlip ? 'Billed To:' : 'Billed To (Client Profile):'}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.2, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
          {invoice.customer || 'Walk-in Patron'}
        </Typography>
        {invoice.phone && (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
            Contact: {invoice.phone}
          </Typography>
        )}
      </Box>

      <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, width: { xs: '100%', sm: 'auto' }, pt: { xs: 1, sm: 0 }, borderTop: { xs: '1px dashed #E2E8F0', sm: 'none' } }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          Payment Method: <b>{invoice.paymentMethod || 'Cash'}</b>
        </Typography>
        <SplitPayments invoice={invoice} color={theme.primaryColor} />
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          Invoice Date: <b>{new Date(invoice.date).toLocaleDateString('en-IN')}</b>
        </Typography>
        <StatusChip invoice={invoice} />
      </Box>
    </Box>
  );
};

/* ------------------------------------------------------------------ *
 * Item ledger: table variants and editorial list variants
 * ------------------------------------------------------------------ */

const ItemTh = ({ cfg, theme, label, width, align, isLast }) => {
  const rule =
    cfg.headerRule === 'double'
      ? { borderBottom: `3px double ${theme.accentColor}` }
      : cfg.headerRule === 'thick'
        ? { borderBottom: `2px solid ${theme.accentColor}` }
        : cfg.cellBorder
          ? { borderBottom: `1px solid ${cfg.cellBorder === 'hard' ? '#E2E8F0' : theme.totalBoxBorder}` }
          : {};

  return (
    <TableCell
      align={align}
      className="invoice-table-header-cell"
      style={{ backgroundColor: theme.tableHeadBg, color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
      sx={{
        width,
        color: '#FFFFFF !important',
        bgcolor: `${theme.tableHeadBg} !important`,
        WebkitTextFillColor: '#FFFFFF !important',
        '&.MuiTableCell-head': { color: '#FFFFFF !important', WebkitTextFillColor: '#FFFFFF !important' },
        fontWeight: cfg.headerWeight,
        fontSize: cfg.headerFont,
        textTransform: 'uppercase',
        letterSpacing: cfg.headerSpacing,
        py: cfg.headerPy,
        px: cfg.cellPx,
        fontFamily: cfg.nameFamily,
        borderTop: cfg.cellBorder ? `1px solid ${cfg.cellBorder === 'hard' ? '#E2E8F0' : theme.totalBoxBorder}` : 'none',
        borderRight: cfg.vRule && !isLast ? `1px solid ${theme.tableHeadBg}` : 'none',
        ...rule,
        ...EXACT
      }}
    >
      {label}
    </TableCell>
  );
};

const ItemTd = ({ cfg, theme, children, align, width, isLast, emphasis, px }) => {
  const border = cfg.cellBorder
    ? { border: `1px solid ${cfg.cellBorder === 'hard' ? '#E2E8F0' : theme.totalBoxBorder}` }
    : {};
  return (
    <TableCell
      align={align}
      sx={{
        width,
        py: cfg.bodyPy,
        px: px || (align === 'left' || !align ? cfg.cellPx : cfg.numPx),
        fontVariantNumeric: 'tabular-nums',
        verticalAlign: 'middle',
        borderRight: cfg.vRule && !isLast ? `1px solid ${theme.totalBoxBorder}` : undefined,
        borderBottom: cfg.cellBorder
          ? border.border
          : cfg.rowRule === 'soft'
            ? `1px solid ${theme.totalBoxBorder}`
            : undefined,
        fontWeight: emphasis ? 800 : undefined,
        color: emphasis ? theme.darkColor : undefined,
        ...border
      }}
    >
      {children}
    </TableCell>
  );
};

export const ItemsSection = ({ ctx }) => {
  const { invoice, theme, itemsFormat, isSlip } = ctx;
  const cfg = ITEM_LAYOUTS[itemsFormat] || ITEM_LAYOUTS['banded-table'];

  if (cfg.kind === 'list') {
    return <ItemList ctx={ctx} cfg={cfg} />;
  }

  const showCategoryColumn = cfg.categoryMode !== 'inline';
  const zebraColor =
    cfg.zebra === 'tint' ? theme.totalBoxBg : cfg.zebra === 'neutral' ? 'rgba(0,0,0,0.015)' : 'transparent';

  return (
    <Box sx={{ mb: 3, position: 'relative', zIndex: 1, overflowX: 'auto' }}>
      <Table size={cfg.size} sx={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
        <TableHead>
          <TableRow
            className="invoice-table-header-row"
            style={{ backgroundColor: theme.tableHeadBg, color: '#FFFFFF', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            sx={{ bgcolor: `${theme.tableHeadBg} !important`, ...EXACT }}
          >
            {cfg.index && <ItemTh cfg={cfg} theme={theme} label="#" width={cfg.widths.index} align="center" />}
            <ItemTh cfg={cfg} theme={theme} label="Garment / Item" width={cfg.widths.name} />
            {showCategoryColumn && !isSlip && (
              <ItemTh cfg={cfg} theme={theme} label={cfg.categoryLabel} width={cfg.widths.category} />
            )}
            <ItemTh cfg={cfg} theme={theme} label="Qty" width={cfg.widths.qty} align="center" />
            <ItemTh cfg={cfg} theme={theme} label="Rate" width={cfg.widths.rate} align="right" />
            <ItemTh cfg={cfg} theme={theme} label="Amount" width={cfg.widths.amount} align="right" isLast />
          </TableRow>
        </TableHead>
        <TableBody>
          {invoice.items?.map((item, idx) => (
            <TableRow
              key={idx}
              sx={{
                '&:nth-of-type(even)': { bgcolor: zebraColor, ...EXACT },
                borderBottom: cfg.rowRule === 'divider' ? '1px solid' : undefined,
                borderColor: cfg.rowRule === 'divider' ? 'divider' : undefined,
                pageBreakInside: 'avoid',
                breakInside: 'avoid'
              }}
            >
              {cfg.index && (
                <ItemTd cfg={cfg} theme={theme} align="center" width={cfg.widths.index} isLast={false}>
                  <Typography variant="caption" sx={{ fontFamily: MONO_STACK, fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem' }}>
                    {idx + 1}
                  </Typography>
                </ItemTd>
              )}
              <ItemTd cfg={cfg} theme={theme} width={cfg.widths.name}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: cfg.nameWeight,
                    fontFamily: cfg.nameFamily,
                    fontSize: cfg.nameSize,
                    textTransform: cfg.nameCase === 'uppercase' ? 'uppercase' : 'none',
                    letterSpacing: cfg.nameCase === 'uppercase' ? 0.4 : 0,
                    color: cfg.nameFamily === SERIF_STACK ? theme.darkColor : 'text.primary',
                    wordBreak: 'break-word'
                  }}
                >
                  {item.name}
                </Typography>
                {(item.variantSku || item.productId || item.sku) && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.66rem', fontFamily: MONO_STACK, textTransform: 'uppercase' }}>
                    SKU: {formatSkuWithHyphen(item.variantSku || item.productId || item.sku)}
                  </Typography>
                )}
                {item.category && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: { xs: 'block', sm: showCategoryColumn ? 'none' : 'block' },
                      color: 'text.secondary',
                      fontSize: '0.66rem'
                    }}
                  >
                    {item.category}
                  </Typography>
                )}
              </ItemTd>
              {showCategoryColumn && !isSlip && (
                <ItemTd cfg={cfg} theme={theme} width={cfg.widths.category}>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    {cfg.categoryMode === 'chip' && (
                      <Chip
                        size="small"
                        label={item.category || 'Atelier Wear'}
                        sx={{ fontSize: '0.7rem', height: 22, borderRadius: 0.75, fontWeight: 600, bgcolor: 'action.hover' }}
                      />
                    )}
                    {cfg.categoryMode === 'outline-chip' && (
                      <Chip
                        size="small"
                        variant="outline"
                        label={item.category || 'Atelier Wear'}
                        sx={{ fontSize: '0.68rem', height: 21, borderRadius: 0.5, fontWeight: 700, color: theme.primaryColor, borderColor: `${theme.primaryColor}66` }}
                      />
                    )}
                    {(cfg.categoryMode === 'text' || cfg.categoryMode === 'plain') && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.72rem',
                          fontWeight: cfg.categoryMode === 'text' ? 600 : 700,
                          fontStyle: cfg.categoryMode === 'text' ? 'italic' : 'normal',
                          fontFamily: cfg.categoryMode === 'text' ? SERIF_STACK : MONO_STACK,
                          letterSpacing: cfg.categoryMode === 'plain' ? 0.6 : 0,
                          textTransform: cfg.categoryMode === 'plain' ? 'uppercase' : 'none',
                          color: cfg.categoryMode === 'text' ? theme.darkColor : 'text.secondary'
                        }}
                      >
                        {item.category || 'Atelier Wear'}
                      </Typography>
                    )}
                  </Box>
                </ItemTd>
              )}
              <ItemTd cfg={cfg} theme={theme} align="center" width={cfg.widths.qty}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: cfg.nameSize, fontFamily: cfg.nameFamily === MONO_STACK ? MONO_STACK : DISPLAY_STACK }}>
                  {item.quantity}
                </Typography>
              </ItemTd>
              <ItemTd cfg={cfg} theme={theme} align="right" width={cfg.widths.rate}>
                <Typography variant="body2" sx={{ fontSize: cfg.numSize || { xs: '0.78rem', sm: '0.86rem' }, fontFamily: cfg.nameFamily === MONO_STACK ? MONO_STACK : DISPLAY_STACK }}>
                  ₹{money(item.price)}
                </Typography>
              </ItemTd>
              <ItemTd cfg={cfg} theme={theme} align="right" width={cfg.widths.amount} isLast emphasis px={cfg.numPx || cfg.cellPx}>
                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: cfg.numSize || { xs: '0.8rem', sm: '0.86rem' }, color: theme.darkColor, fontFamily: cfg.nameFamily === MONO_STACK ? MONO_STACK : DISPLAY_STACK }}>
                  ₹{money(Number(item.price || 0) * (item.quantity || 1))}
                </Typography>
              </ItemTd>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

const ItemList = ({ ctx, cfg }) => {
  const { invoice, theme } = ctx;
  const editorial = cfg.listStyle === 'editorial';

  return (
    <Box sx={{ mb: 3, position: 'relative', zIndex: 1, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 2,
          pb: editorial ? 0.6 : 0.5,
          mb: 0.5,
          borderBottom: editorial ? `1px solid ${theme.primaryColor}` : '1px solid rgba(34,28,58,0.16)'
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 2.4, textTransform: 'uppercase', fontSize: '0.6rem', color: theme.primaryColor }}>
          {editorial ? 'Garment Ledger' : 'Items'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 2.4, textTransform: 'uppercase', fontSize: '0.6rem', color: theme.primaryColor, minWidth: 46, textAlign: 'center' }}>
            Qty
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 2.4, textTransform: 'uppercase', fontSize: '0.6rem', color: theme.primaryColor, minWidth: 72, textAlign: 'right' }}>
            Rate
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 2.4, textTransform: 'uppercase', fontSize: '0.6rem', color: theme.primaryColor, minWidth: 80, textAlign: 'right' }}>
            Amount
          </Typography>
        </Box>
      </Box>

      {invoice.items?.map((item, idx) =>
        editorial ? (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 1,
              py: 1.5,
              borderBottom: `1px solid ${theme.totalBoxBorder}`,
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            <Box sx={{ minWidth: 0, flex: '0 1 auto' }}>
              <Typography sx={{ fontFamily: SERIF_STACK, fontWeight: 600, color: theme.darkColor, fontSize: '0.92rem', lineHeight: 1.25 }}>
                {item.name}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontFamily: MONO_STACK, letterSpacing: 0.6, fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase' }}>
                {(item.category || 'Atelier Wear')}{(item.variantSku || item.productId || item.sku) ? ` · SKU ${formatSkuWithHyphen(item.variantSku || item.productId || item.sku)}` : ''}
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 12px', minWidth: 12, mb: 0.6, borderBottom: `1px dotted ${theme.accentColor}` }} />
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              <Typography variant="caption" sx={{ minWidth: 46, textAlign: 'center', fontWeight: 700, color: theme.darkColor, fontSize: '0.8rem' }}>
                ×{item.quantity}
              </Typography>
              <Typography variant="caption" sx={{ minWidth: 72, textAlign: 'right', color: 'text.secondary', fontSize: '0.78rem' }}>
                ₹{money(item.price)}
              </Typography>
              <Typography sx={{ minWidth: 80, textAlign: 'right', fontWeight: 800, color: theme.primaryColor, fontSize: '0.92rem' }}>
                ₹{money(Number(item.price || 0) * (item.quantity || 1))}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3,
              py: 2.25,
              borderBottom: '1px solid rgba(34,28,58,0.07)',
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 500, letterSpacing: 1.4, textTransform: 'uppercase', color: theme.darkColor, fontSize: '0.78rem', lineHeight: 1.4 }}>
                {item.name}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontFamily: MONO_STACK, fontSize: '0.62rem', color: 'text.secondary', letterSpacing: 0.5, mt: 0.3 }}>
                {(item.category || 'Atelier Wear').toUpperCase()}
                {(item.variantSku || item.productId || item.sku) ? ` · ${formatSkuWithHyphen(item.variantSku || item.productId || item.sku).toUpperCase()}` : ''}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              <Typography sx={{ fontWeight: 300, color: theme.darkColor, fontSize: '1.05rem', lineHeight: 1.2 }}>
                ₹{money(Number(item.price || 0) * (item.quantity || 1))}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontSize: '0.62rem', color: 'text.secondary', letterSpacing: 0.8 }}>
                QTY {item.quantity} · ₹{money(item.price)} EACH
              </Typography>
            </Box>
          </Box>
        )
      )}
    </Box>
  );
};

/* ------------------------------------------------------------------ *
 * Summary block: privileges / payment panel + financial ledger
 * ------------------------------------------------------------------ */

const PANEL_STYLES = (theme) => ({
  soft: {
    p: 1.8,
    borderRadius: 1.5,
    bgcolor: theme.totalBoxBg,
    border: `1.5px solid ${theme.primaryColor || '#155D46'}25`,
    ...EXACT
  },
  parchment: {
    p: 1.8,
    borderRadius: 0.5,
    bgcolor: theme.totalBoxBg,
    border: `3px double ${theme.accentColor}`,
    ...EXACT
  },
  ruled: {
    p: 1.8,
    borderRadius: 1,
    bgcolor: '#FFFFFF',
    border: `1px solid ${theme.totalBoxBorder}`,
    borderTop: `3px solid ${theme.primaryColor}`,
    ...EXACT
  },
  'accent-left': {
    p: 1.8,
    borderRadius: 1,
    bgcolor: theme.totalBoxBg,
    borderLeft: `4px solid ${theme.accentColor}`,
    ...EXACT
  },
  'brass-frame': {
    p: 1.8,
    borderRadius: 0,
    bgcolor: '#FFFFFF',
    border: `1px solid ${theme.accentColor}`,
    boxShadow: `inset 0 0 0 3px #FFFFFF, inset 0 0 0 4px ${theme.totalBoxBorder}`,
    ...EXACT
  },
  'flat-frame': {
    p: 1.8,
    borderRadius: 0,
    bgcolor: '#FFFFFF',
    border: `1px solid ${theme.totalBoxBorder}`,
    ...EXACT
  },
  'hairline-top': {
    p: 1.75,
    borderRadius: 0,
    bgcolor: 'transparent',
    borderTop: `1px solid ${theme.totalBoxBorder}`,
    borderBottom: `1px solid ${theme.totalBoxBorder}`
  }
});

const PanelLuxuryComposite = ({ ctx }) => {
  const { invoice, theme, storeVpa, qrImageUrl } = ctx;
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, pb: 0.6, borderBottom: `1px dashed ${theme.primaryColor || '#155D46'}30` }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primaryColor, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span>⚜️</span> Atelier Privileges & Quick Pay
        </Typography>
        <Box
          sx={{
            px: 0.9,
            py: 0.15,
            borderRadius: 0.5,
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
      <Box sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'flex-start', py: 0.75, mb: 1, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 1, border: '1px solid rgba(0,0,0,0.05)' }}>
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
                borderRadius: 0.75,
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
              borderRadius: 0.75,
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, px: 0.5, pt: 0.5, borderTop: `1px dashed ${theme.primaryColor || '#155D46'}20` }}>
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
  );
};

const PanelUpiQr = ({ ctx }) => {
  const { theme, storeVpa, qrImageUrl, profile } = ctx;
  return (
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
              borderRadius: 0.75,
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
  );
};

const PanelLoyalty = ({ ctx }) => {
  const { invoice, theme, storeVpa } = ctx;
  return (
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
  );
};

const PanelGarmentCare = ({ ctx }) => {
  const { theme } = ctx;
  return (
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
  );
};

const PanelConcierge = ({ ctx }) => {
  const { theme, profile, storeVpa } = ctx;
  return (
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
              borderRadius: 0.75,
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
  );
};

const PanelBanking = ({ ctx }) => {
  const { profile, activeSettings, theme, storeVpa } = ctx;
  return (
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
  );
};

const PanelNotes = ({ invoice }) =>
  invoice.notes ? (
    <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #e2e8f0' }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
        <b>Note:</b> {invoice.notes}
      </Typography>
    </Box>
  ) : null;

const LeftPanel = ({ ctx, panelKey, width }) => {
  const { invoice, profile, activeSettings, theme, leftBoxMode, isSlip } = ctx;
  const panelSx = PANEL_STYLES(theme)[panelKey] || PANEL_STYLES(theme).soft;

  const modeBody =
    leftBoxMode === 'upi-qr' ? <PanelUpiQr ctx={ctx} /> :
    leftBoxMode === 'loyalty-privileges' ? <PanelLoyalty ctx={ctx} /> :
    leftBoxMode === 'garment-care' ? <PanelGarmentCare ctx={ctx} /> :
    leftBoxMode === 'concierge' ? <PanelConcierge ctx={ctx} /> :
    leftBoxMode === 'banking' ? <PanelBanking ctx={ctx} /> :
    <PanelLuxuryComposite ctx={ctx} />;

  return (
    <Box sx={{ flex: 1, width: { xs: '100%', sm: width } }}>
      {(profile.showBankDetails ?? activeSettings.showBankDetails ?? true) && !isSlip && leftBoxMode !== 'none' ? (
        <Box
          sx={{
            ...panelSx,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          {modeBody}
          <PanelNotes invoice={invoice} />
        </Box>
      ) : invoice.notes ? (
        <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            <b>Note:</b> {invoice.notes}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
};

/* ------------------------------------------------------------------ *
 * Financial ledger: one set of figures, eight arrangements
 * ------------------------------------------------------------------ */

const TOTALS_CONFIG = {
  'split-privileges': {
    arrangement: 'row',
    panel: 'soft',
    panelWidth: '52%',
    totalsWidth: '44%',
    container: (t) => ({ p: 2, borderRadius: 1.5, border: '1px solid', borderColor: t.totalBoxBorder, bgcolor: t.totalBoxBg, ...EXACT }),
    tone: 'ink',
    net: 'band',
    words: 'dashed'
  },
  'stacked-ledger': {
    arrangement: 'stack',
    panel: 'parchment',
    panelWidth: '100%',
    totalsWidth: '100%',
    rowsGrid: true,
    container: (t) => ({ p: { xs: 1.75, sm: 2.25 }, borderRadius: 0, bgcolor: '#FFFFFF', borderTop: `3px double ${t.primaryColor}`, borderBottom: `3px double ${t.primaryColor}`, ...EXACT }),
    tone: 'ink',
    labelFamily: SERIF_STACK,
    net: 'band-square',
    words: 'centered-rule'
  },
  'dark-rail': {
    arrangement: 'row',
    panel: 'ruled',
    panelWidth: '50%',
    totalsWidth: '46%',
    container: (t) => ({ p: 2, borderRadius: 1, bgcolor: t.tableHeadBg, color: '#FFFFFF', ...EXACT }),
    tone: 'inverse',
    wordsInside: true,
    net: 'inverse-outline',
    words: 'inverse-rule'
  },
  'blush-card': {
    arrangement: 'row',
    panel: 'accent-left',
    panelWidth: '54%',
    totalsWidth: '42%',
    container: (t) => ({ p: 2, borderRadius: 1, bgcolor: t.totalBoxBg, borderLeft: `3px solid ${t.accentColor}`, ...EXACT }),
    tone: 'ink',
    labelFamily: SERIF_STACK,
    net: 'rule-caps',
    words: 'hairline-rule'
  },
  'framed-ledger': {
    arrangement: 'row',
    panel: 'brass-frame',
    panelWidth: '52%',
    totalsWidth: '44%',
    container: (t) => ({ p: 2, borderRadius: 0, bgcolor: t.totalBoxBg, border: `1px solid ${t.accentColor}`, boxShadow: `inset 0 0 0 3px #FFFFFF, inset 0 0 0 4px ${t.totalBoxBorder}`, ...EXACT }),
    tone: 'ink',
    labelFamily: SERIF_STACK,
    net: 'rule-caps',
    words: 'centered-rule'
  },
  'kpi-tiles': {
    arrangement: 'tiles',
    panel: 'flat-frame',
    panelWidth: '100%',
    totalsWidth: '100%',
    container: () => ({ }),
    tone: 'ink',
    net: 'tile',
    words: 'hairline-rule'
  },
  'hairline-stack': {
    arrangement: 'row',
    panel: 'hairline-top',
    panelWidth: '56%',
    totalsWidth: '40%',
    container: () => ({ p: 0 }),
    bareRows: true,
    tone: 'ink',
    net: 'single-line',
    words: 'hairline-rule'
  },
  'slip-stack': {
    arrangement: 'row',
    panel: 'soft',
    panelWidth: '100%',
    totalsWidth: '100%',
    container: (t) => ({ p: 2, borderRadius: 1.5, border: '1px solid', borderColor: t.totalBoxBorder, bgcolor: t.totalBoxBg, ...EXACT }),
    tone: 'ink',
    net: 'band',
    words: 'dashed'
  }
};

const LedgerRow = ({ cfg, theme, label, value, accent, strong, small }) => {
  const inverse = cfg.tone === 'inverse';
  const labelSx = {
    color: accent || (inverse ? 'rgba(255,255,255,0.75)' : 'text.secondary'),
    fontFamily: cfg.labelFamily,
    fontSize: small ? '0.7rem' : undefined,
    letterSpacing: cfg.bareRows ? 0.8 : 0,
    textTransform: cfg.bareRows ? 'uppercase' : 'none',
    fontWeight: cfg.bareRows ? 700 : undefined
  };
  const valueSx = {
    fontWeight: strong ? 800 : 700,
    color: inverse ? '#FFFFFF' : accent || 'text.primary',
    fontVariantNumeric: 'tabular-nums',
    fontFamily: cfg.labelFamily === SERIF_STACK ? SERIF_STACK : cfg.labelFamily === MONO_STACK ? MONO_STACK : DISPLAY_STACK,
    fontSize: small ? '0.7rem' : undefined
  };
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: cfg.bareRows ? 0.75 : 0.4, borderBottom: cfg.bareRows ? `1px solid ${theme.totalBoxBorder}` : 'none', gap: 1 }}>
      <Typography variant="body2" sx={labelSx}>
        {label}
      </Typography>
      <Typography variant="body2" sx={valueSx}>
        {value}
      </Typography>
    </Box>
  );
};

const DiscountRows = ({ ctx, cfg, hideDiscount = false }) => {
  const { invoice } = ctx;
  return (
    <>
      {!hideDiscount && invoice.discount > 0 && (
        <LedgerRow
          cfg={cfg}
          theme={ctx.theme}
          accent={cfg.tone === 'inverse' ? '#FDE68A' : '#D97706'}
          label={`Discount (${invoice.discountPercent || invoice.discountPercentage || 0}%):`}
          value={`-₹${money(invoice.discount)}`}
        />
      )}
      {(Number(invoice.loyaltyDiscount) > 0 || Number(invoice.loyaltyPointsRedeemed) > 0) && (
        <LedgerRow
          cfg={cfg}
          theme={ctx.theme}
          accent={cfg.tone === 'inverse' ? '#FDE68A' : '#D97706'}
          label={`Loyalty Points (${invoice.loyaltyPointsRedeemed || 0} pts):`}
          value={`-₹${money(invoice.loyaltyDiscount || invoice.loyaltyPointsRedeemed || 0)}`}
        />
      )}
    </>
  );
};

const SettlementRows = ({ ctx, cfg }) => {
  const { invoice, theme } = ctx;
  const inverse = cfg.tone === 'inverse';
  if (!(invoice.paymentStatus !== 'paid' && invoice.paidAmount !== undefined)) return null;
  return (
    <>
      <Divider sx={{ my: inverse ? 0.8 : 0.8, borderColor: inverse ? 'rgba(255,255,255,0.3)' : theme.totalBoxBorder, borderStyle: 'dashed' }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.2, color: inverse ? '#BBF7D0' : '#16A34A' }}>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>Amount Received:</Typography>
        <Typography variant="caption" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
          ₹{money(invoice.paidAmount)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.2, color: inverse ? '#FECACA' : '#DC2626' }}>
        <Typography variant="caption" sx={{ fontWeight: 800 }}>Balance Due:</Typography>
        <Typography variant="caption" sx={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
          ₹{money(Math.max(0, Number(invoice.total || 0) - Number(invoice.paidAmount || 0)))}
        </Typography>
      </Box>
    </>
  );
};

const NetLine = ({ ctx, cfg }) => {
  const { invoice, theme } = ctx;
  const total = `₹${money(invoice.total)}`;

  if (cfg.net === 'band' || cfg.net === 'band-square') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 1.75,
          py: 1.1,
          borderRadius: cfg.net === 'band-square' ? 0 : 1,
          bgcolor: theme.primaryColor,
          color: '#FFFFFF',
          letterSpacing: cfg.net === 'band-square' ? 1 : undefined,
          fontFamily: cfg.net === 'band-square' ? SERIF_STACK : undefined,
          ...EXACT
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: 1.2, textTransform: 'uppercase', fontSize: '0.78rem' }}>
          Net Total
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: cfg.net === 'band-square' ? 700 : 900, color: '#FFFFFF', fontSize: '1.15rem', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
          {total}
        </Typography>
      </Box>
    );
  }

  if (cfg.net === 'inverse-outline') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.5, py: 1, borderRadius: 0.75, bgcolor: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.45)', ...EXACT }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.72rem' }}>
          Net Total
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 900, color: '#FFFFFF', fontSize: '1.2rem', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
          {total}
        </Typography>
      </Box>
    );
  }

  if (cfg.net === 'rule-caps') {
    return (
      <Box sx={{ mt: 0.5, pt: 0.9, borderTop: `2px solid ${theme.accentColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', ...EXACT }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primaryColor, letterSpacing: 2.4, textTransform: 'uppercase', fontSize: '0.68rem' }}>
          Net Total
        </Typography>
        <Typography sx={{ fontFamily: SERIF_STACK, fontWeight: 700, color: theme.darkColor, fontSize: '1.3rem', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
          {total}
        </Typography>
      </Box>
    );
  }

  if (cfg.net === 'tile') {
    return null;
  }

  /* single-line */
  return (
    <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${theme.darkColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'text.secondary', fontSize: '0.64rem' }}>
        Net Total
      </Typography>
      <Typography sx={{ fontWeight: 300, color: theme.darkColor, fontSize: '1.6rem', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
        {total}
      </Typography>
    </Box>
  );
};

const KpiTiles = ({ ctx, cfg }) => {
  const { invoice, theme } = ctx;
  const tiles = [{ label: 'Subtotal', value: `₹${money(invoice.subtotal)}` }];
  if (invoice.discount > 0) {
    tiles.push({
      label: `Discount (${invoice.discountPercent || invoice.discountPercentage || 0}%)`,
      value: `-₹${money(invoice.discount)}`,
      accent: true
    });
  }
  tiles.push({ label: `GST (${invoice.gst || 18}%)`, value: `₹${money(invoice.tax)}` });
  tiles.push({ label: 'Net Total', value: `₹${money(invoice.total)}`, emphasis: true });

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: `repeat(${tiles.length}, 1fr)` }, gap: 1.25, mb: cfg.bareRows ? 0 : 1.25 }}>
      {tiles.map((tile) => (
        <Box
          key={tile.label}
          sx={{
            p: 1.25,
            borderRadius: 0,
            bgcolor: tile.emphasis ? theme.darkColor : '#FFFFFF',
            border: `1px solid ${tile.emphasis ? theme.darkColor : theme.totalBoxBorder}`,
            borderTop: `3px solid ${tile.emphasis ? theme.accentColor : tile.accent ? '#D97706' : theme.primaryColor}`,
            ...EXACT
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', fontSize: '0.58rem', color: tile.emphasis ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
            {tile.label}
          </Typography>
          <Typography sx={{ display: 'block', mt: 0.35, fontWeight: tile.emphasis ? 800 : 700, fontSize: '1.1rem', lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', color: tile.emphasis ? '#FFFFFF' : tile.accent ? '#D97706' : theme.darkColor }}>
            {tile.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const AmountInWords = ({ ctx, cfg }) => {
  const { invoice, theme } = ctx;
  const content = (
    <>
      <b>Amount in Words:</b> {numberToWordsRupees(invoice.total || 0)}
    </>
  );

  if (cfg.words === 'inverse-rule') {
    return (
      <Box sx={{ mt: 1, px: 1.25, py: 0.6, borderRadius: 0.75, border: '1px dashed rgba(255,255,255,0.4)', ...EXACT }}>
        <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.9)', display: 'block' }}>
          {content}
        </Typography>
      </Box>
    );
  }
  if (cfg.words === 'centered-rule') {
    return (
      <Box sx={{ mt: 1, py: 0.7, textAlign: 'center', borderTop: `1px solid ${theme.totalBoxBorder}`, borderBottom: `1px solid ${theme.totalBoxBorder}` }}>
        <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary', display: 'block', letterSpacing: 0.4 }}>
          {content}
        </Typography>
      </Box>
    );
  }
  if (cfg.words === 'hairline-rule') {
    return (
      <Box sx={{ mt: 1, pt: 0.7 }}>
        <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary', display: 'block', letterSpacing: cfg.bareRows ? 0.6 : 0, textTransform: cfg.bareRows ? 'uppercase' : 'none' }}>
          {content}
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ mt: 1, py: 0.6, px: 1.25, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1, border: '1px dashed #CBD5E1' }}>
      <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary', display: 'block' }}>
        {content}
      </Typography>
    </Box>
  );
};

export const TotalsCard = ({ ctx, cfg }) => {
  const { invoice, theme } = ctx;
  const inverse = cfg.tone === 'inverse';
  const containerSx = cfg.container(theme) || {};

  if (cfg.net === 'tile') {
    return (
      <Box>
        <KpiTiles ctx={ctx} cfg={cfg} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <DiscountRows ctx={ctx} cfg={cfg} hideDiscount />
          <SettlementRows ctx={ctx} cfg={cfg} />
        </Box>
      </Box>
    );
  }

  const rows = (
    <>
      <LedgerRow cfg={cfg} theme={theme} label="Subtotal:" value={`₹${money(invoice.subtotal)}`} />
      <DiscountRows ctx={ctx} cfg={cfg} />
      <LedgerRow cfg={cfg} theme={theme} label={`GST (${invoice.gst || 18}%):`} value={`₹${money(invoice.tax)}`} />
    </>
  );

  return (
    <Box sx={containerSx}>
      {cfg.rowsGrid ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2, rowGap: 0.25 }}>
          {rows}
        </Box>
      ) : (
        rows
      )}
      {!cfg.bareRows && <Divider sx={{ my: 1, borderColor: inverse ? 'rgba(255,255,255,0.3)' : theme.totalBoxBorder }} />}
      <NetLine ctx={ctx} cfg={cfg} />
      <SettlementRows ctx={ctx} cfg={cfg} />
      {cfg.wordsInside && <AmountInWords ctx={ctx} cfg={cfg} />}
    </Box>
  );
};

export const SummarySection = ({ ctx }) => {
  const cfg = TOTALS_CONFIG[ctx.summaryFormat] || TOTALS_CONFIG['split-privileges'];

  if (cfg.arrangement === 'tiles') {
    return (
      <Box sx={{ mb: 3, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 2, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <Box>
          <TotalsCard ctx={ctx} cfg={cfg} />
          <AmountInWords ctx={ctx} cfg={cfg} />
        </Box>
        <LeftPanel ctx={ctx} panelKey={cfg.panel} width={cfg.panelWidth} />
      </Box>
    );
  }

  const flexDirection = { xs: 'column-reverse', sm: cfg.arrangement === 'stack' || ctx.isSlip ? 'column' : 'row' };

  return (
    <Box
      sx={{
        mb: 3,
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection,
        justifyContent: 'space-between',
        alignItems: 'stretch',
        gap: 2,
        pageBreakInside: 'avoid',
        breakInside: 'avoid'
      }}
    >
      <LeftPanel ctx={ctx} panelKey={cfg.panel} width={cfg.panelWidth} />
      <Box sx={{ width: { xs: '100%', sm: cfg.totalsWidth } }}>
        <TotalsCard ctx={ctx} cfg={cfg} />
        {!cfg.wordsInside && <AmountInWords ctx={ctx} cfg={cfg} />}
      </Box>
    </Box>
  );
};

/* ------------------------------------------------------------------ *
 * Footer: terms, signature and the PAID seal
 * ------------------------------------------------------------------ */

const TermsBlock = ({ ctx, centered, caps, width }) => {
  const { profile, activeSettings, theme } = ctx;
  return (
    <Box sx={{ flex: 1, width: { xs: '100%', sm: width }, textAlign: centered ? 'center' : 'left' }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          color: caps ? theme.primaryColor : 'text.primary',
          letterSpacing: caps ? 2 : 0,
          textTransform: caps ? 'uppercase' : 'none',
          fontSize: caps ? '0.62rem' : undefined,
          display: 'block',
          mb: 0.3
        }}
      >
        Terms & Conditions:
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          whiteSpace: 'pre-line',
          display: 'block',
          fontSize: '0.68rem',
          lineHeight: 1.4,
          textAlign: centered ? 'center' : 'left'
        }}
      >
        {profile.termsText || activeSettings.termsText}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          mt: 1,
          fontWeight: 700,
          color: theme.primaryColor,
          fontSize: '0.78rem',
          fontFamily: caps ? SERIF_STACK : DISPLAY_STACK,
          fontStyle: caps ? 'italic' : 'normal'
        }}
      >
        {profile.customFooterNote || activeSettings.customFooterNote || `Thank you for shopping with ${profile.businessName || 'Aleen Clothing'}!`}
      </Typography>
    </Box>
  );
};

const Seal = ({ ctx, size = 140, sx }) => {
  const { isPaidInvoice, stampVariant } = ctx;
  if (!isPaidInvoice) return null;
  return (
    <Box sx={{ pointerEvents: 'none', ...sx }}>
      <WaxSealStamp label="PAID" subtitle="ATELIER ALEEN" variant={stampVariant} isWatermark={true} size={size} animate={false} />
    </Box>
  );
};

const SignatureLines = ({ ctx, labelColor, ruleStyle = '1.5px solid #94A3B8' }) => {
  const { profile, activeSettings, theme } = ctx;
  return (
    <>
      {profile.signatureImage || activeSettings.signatureImage ? (
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
      <Box sx={{ borderBottom: ruleStyle, mb: 0.5, position: 'relative', zIndex: 1, borderColor: theme.primaryColor }} />
      <Typography variant="caption" sx={{ fontWeight: 700, color: labelColor || 'text.secondary', display: 'block', fontSize: '0.75rem', position: 'relative', zIndex: 1 }}>
        {profile.signatureLabel || activeSettings.signatureLabel || 'Authorized Signatory'}
      </Typography>
      <Typography variant="caption" sx={{ color: labelColor || 'text.secondary', fontSize: '0.68rem', position: 'relative', zIndex: 1 }}>
        {profile.businessName || 'Aleen Clothing'}
      </Typography>
    </>
  );
};

export const FooterSection = ({ ctx }) => {
  const { profile, activeSettings, theme, footerFormat, isSlip, isPaidInvoice } = ctx;
  const showSignature = !isSlip && (profile.showSignatureStamp ?? activeSettings.showSignatureStamp);
  const signatureDisabled = !profile.showSignatureStamp && !activeSettings.showSignatureStamp;

  const shell = { position: 'relative', zIndex: 1, pageBreakInside: 'avoid', breakInside: 'avoid' };

  if (footerFormat === 'slip-thanks') {
    return (
      <Box sx={{ ...shell, pt: 2.5, pb: 1.5, borderTop: '1px dashed #64748B', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TermsBlock ctx={ctx} centered width="100%" />
        {signatureDisabled && <Seal ctx={ctx} size={96} sx={{ position: 'absolute', right: 30, bottom: 20, zIndex: 2 }} />}
      </Box>
    );
  }

  if (footerFormat === 'centered-seal') {
    return (
      <Box sx={{ ...shell, pt: 2.5, pb: 1, borderTop: `3px double ${theme.primaryColor}`, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 2.5 }}>
        <TermsBlock ctx={ctx} caps width="56%" />
        {showSignature && (
          <Box sx={{ textAlign: 'center', width: { xs: '100%', sm: '40%' }, minWidth: { xs: 'auto', sm: 240 }, position: 'relative', pt: 1 }}>
            {isPaidInvoice && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: -2 }}>
                <Seal ctx={ctx} size={112} />
              </Box>
            )}
            <SignatureLines ctx={ctx} ruleStyle={`1px solid ${theme.primaryColor}`} />
          </Box>
        )}
        {signatureDisabled && <Seal ctx={ctx} size={96} sx={{ position: 'absolute', right: 30, bottom: 20, zIndex: 2 }} />}
      </Box>
    );
  }

  if (footerFormat === 'corner-seal') {
    return (
      <Box sx={{ ...shell, pt: 2.5, pb: 2, pr: { xs: 0, sm: 11 }, borderTop: `1px solid ${theme.totalBoxBorder}`, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 2.5 }}>
        <Box sx={{ pl: 1.5, borderLeft: `3px solid ${theme.primaryColor}`, flex: 1, width: { xs: '100%', sm: '60%' } }}>
          <TermsBlock ctx={ctx} width="100%" />
        </Box>
        {showSignature && (
          <Box sx={{ textAlign: 'center', width: { xs: '100%', sm: '36%' }, minWidth: { xs: 'auto', sm: 190 } }}>
            <SignatureLines ctx={ctx} labelColor={theme.darkColor} ruleStyle={`1px solid ${theme.primaryColor}`} />
          </Box>
        )}
        <Seal ctx={ctx} size={104} sx={{ position: { xs: 'relative', sm: 'absolute' }, right: { sm: 10 }, bottom: { sm: 0 }, alignSelf: { xs: 'flex-end' }, mt: { xs: -3, sm: 0 }, zIndex: 2 }} />
        {signatureDisabled && isPaidInvoice && <Seal ctx={ctx} size={96} sx={{ position: { xs: 'relative', sm: 'absolute' }, right: { sm: 34 }, bottom: { sm: 18 }, alignSelf: { xs: 'flex-end' }, mt: { xs: -3, sm: 0 }, zIndex: 2 }} />}
      </Box>
    );
  }

  if (footerFormat === 'monogram-centered') {
    return (
      <Box sx={{ ...shell, pt: 2.5, pb: 1, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.25, mb: 1.5 }}>
          <Box sx={{ flex: '0 1 120px', height: 1, bgcolor: theme.accentColor, opacity: 0.7 }} />
          <Box sx={{ width: 8, height: 8, transform: 'rotate(45deg)', bgcolor: theme.accentColor, ...EXACT }} />
          <Box sx={{ flex: '0 1 120px', height: 1, bgcolor: theme.accentColor, opacity: 0.7 }} />
        </Box>
        <Box sx={{ mx: 'auto', maxWidth: 520 }}>
          <TermsBlock ctx={ctx} centered caps width="100%" />
        </Box>
        {showSignature && (
          <Box sx={{ mx: 'auto', mt: 2, width: 250, textAlign: 'center', position: 'relative' }}>
            {isPaidInvoice && (
              <Box sx={{ position: 'absolute', top: -6, right: -34, zIndex: 3 }}>
                <Seal ctx={ctx} size={92} />
              </Box>
            )}
            <SignatureLines ctx={ctx} ruleStyle={`1px solid ${theme.primaryColor}`} />
          </Box>
        )}
        {signatureDisabled && <Seal ctx={ctx} size={96} sx={{ position: 'absolute', right: 30, bottom: 20, zIndex: 2 }} />}
      </Box>
    );
  }

  if (footerFormat === 'framed-seal') {
    return (
      <Box
        sx={{
          ...shell,
          p: { xs: 1.75, sm: 2.25 },
          border: `1px solid ${theme.accentColor}`,
          boxShadow: `inset 0 0 0 3px #FFFFFF, inset 0 0 0 4px ${theme.totalBoxBorder}`,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'flex-end' },
          gap: 2.5,
          ...EXACT
        }}
      >
        <TermsBlock ctx={ctx} width="58%" />
        {showSignature && (
          <Box sx={{ textAlign: 'center', width: { xs: '100%', sm: '38%' }, minWidth: { xs: 'auto', sm: 230 }, position: 'relative' }}>
            <Box sx={{ borderTop: `2px solid ${theme.accentColor}`, pt: 1, position: 'relative' }}>
              {isPaidInvoice && (
                <Box sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
                  <Seal ctx={ctx} size={104} />
                </Box>
              )}
              <SignatureLines ctx={ctx} ruleStyle={`1px solid ${theme.accentColor}`} />
            </Box>
          </Box>
        )}
        {signatureDisabled && <Seal ctx={ctx} size={96} sx={{ position: 'absolute', right: 30, bottom: 20, zIndex: 2 }} />}
      </Box>
    );
  }

  if (footerFormat === 'terms-split') {
    return (
      <Box sx={{ ...shell, pt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 240px' }, gap: 2, borderTop: `1px solid ${theme.primaryColor}` }}>
        <Box sx={{ pr: { sm: 2 }, borderRight: { sm: `1px solid ${theme.totalBoxBorder}` } }}>
          <TermsBlock ctx={ctx} caps width="100%" />
        </Box>
        {showSignature ? (
          <Box sx={{ p: 1.25, border: `1px solid ${theme.totalBoxBorder}`, borderRadius: 0, position: 'relative', textAlign: 'center', bgcolor: theme.totalBoxBg, ...EXACT }}>
            {isPaidInvoice && (
              <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 3 }}>
                <Seal ctx={ctx} size={64} />
              </Box>
            )}
            <SignatureLines ctx={ctx} labelColor={theme.darkColor} ruleStyle={`1px solid ${theme.primaryColor}`} />
          </Box>
        ) : (
          <Box />
        )}
        {signatureDisabled && <Seal ctx={ctx} size={96} sx={{ position: 'absolute', right: 30, bottom: 20, zIndex: 2 }} />}
      </Box>
    );
  }

  if (footerFormat === 'minimal-hairline') {
    return (
      <Box sx={{ ...shell, pt: 2.5, pb: 1, borderTop: '1px solid rgba(34,28,58,0.14)', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 2.5 }}>
        <Box sx={{ maxWidth: 420 }}>
          <TermsBlock ctx={ctx} width="100%" />
        </Box>
        {showSignature && (
          <Box sx={{ width: 210, textAlign: 'center', position: 'relative', flexShrink: 0 }}>
            {isPaidInvoice && (
              <Box sx={{ position: 'absolute', top: 0, right: -8, zIndex: 3 }}>
                <Seal ctx={ctx} size={78} />
              </Box>
            )}
            <SignatureLines ctx={ctx} ruleStyle='1px solid rgba(34,28,58,0.35)' />
          </Box>
        )}
        {signatureDisabled && <Seal ctx={ctx} size={96} sx={{ position: 'absolute', right: 30, bottom: 20, zIndex: 2 }} />}
      </Box>
    );
  }

  /* signature-right — house emerald footer */
  return (
    <Box
      sx={{
        ...shell,
        pt: 2.5,
        pb: isSlip ? 1.5 : 2.5,
        borderTop: isSlip ? '1px dashed #64748B' : '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: { xs: 'column', sm: isSlip ? 'column' : 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'flex-end' },
        gap: 2.5
      }}
    >
      <TermsBlock ctx={ctx} width={isSlip ? '100%' : '58%'} />

      {showSignature && (
        <Box sx={{ textAlign: 'center', width: { xs: '100%', sm: '40%' }, minWidth: { xs: 'auto', sm: 240 }, position: 'relative', pt: { xs: 2, sm: 0 }, borderTop: { xs: '1px dashed #E2E8F0', sm: 'none' } }}>
          {isPaidInvoice && (
            <Box sx={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 3 }}>
              <Seal ctx={ctx} size={140} />
            </Box>
          )}
          <SignatureLines ctx={ctx} />
        </Box>
      )}

      {signatureDisabled && isPaidInvoice && (
        <Box sx={{ position: 'absolute', right: 30, bottom: 20, zIndex: 2, pointerEvents: 'none' }}>
          <WaxSealStamp label="PAID" subtitle="ATELIER ALEEN" variant={ctx.stampVariant} isWatermark={true} size={96} animate={false} />
        </Box>
      )}
    </Box>
  );
};

/* ------------------------------------------------------------------ *
 * Perforated tear-off edge
 * ------------------------------------------------------------------ */

const getTearStyle = (key, theme) => {
  switch (key) {
    case 'original-client':
      return { rule: `3px double ${theme.primaryColor}`, color: theme.primaryColor, family: SERIF_STACK, spacing: 0.18, label: '✂ ┈┈┈ ORIGINAL • ATELIER ARCHIVE • CLIENT COPY ┈┈┈ ✂' };
    case 'trousseau-copy':
      return { rule: `1px solid ${theme.accentColor}`, color: theme.primaryColor, family: SERIF_STACK, spacing: 0.22, label: '✂ ┈┈┈ TROUSSEAU CLIENT COPY • COMPLIMENTARY FITTING ┈┈┈ ✂' };
    case 'heritage-ornament':
      return { rule: `3px double ${theme.accentColor}`, color: theme.darkColor, family: SERIF_STACK, spacing: 0.2, label: 'ATELIER HERITAGE CLIENT COPY', ornament: true };
    case 'official-record':
      return { rule: 'none', color: '#FFFFFF', family: MONO_STACK, spacing: 0.14, label: 'OFFICIAL RECORD • CLIENT COPY • RETAIN FOR REFERENCE', band: theme.darkColor };
    case 'hairline':
      return { rule: '1px solid rgba(34,28,58,0.14)', color: 'rgba(34,28,58,0.55)', family: DISPLAY_STACK, spacing: 0.3, label: 'CLIENT COPY — RETAIN FOR COMPLIMENTARY ALTERATIONS' };
    case 'counter-slip':
    case 'client-copy':
    default:
      return { rule: '2px dashed #CBD5E1', color: '#94A3B8', family: '"DM Sans", sans-serif', spacing: 0.12, label: '✂ ┈┈┈ ATELIER CLIENT COPY • RETAIN FOR COMPLIMENTARY ALTERATIONS ┈┈┈ ✂' };
  }
};

export const TearStrip = ({ ctx }) => {
  const { theme, tearFormat } = ctx;
  const cfg = getTearStyle(tearFormat, theme);

  if (cfg.band) {
    return (
      <Box sx={{ mt: 2.5, py: 0.75, px: 1.25, bgcolor: cfg.band, textAlign: 'center', userSelect: 'none', borderRadius: 0, ...EXACT }}>
        <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: `${cfg.spacing}em`, textTransform: 'uppercase', color: cfg.color, fontFamily: cfg.family }}>
          {cfg.label}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2.5, pt: 1, borderTop: cfg.rule, position: 'relative', textAlign: 'center', userSelect: 'none' }}>
      {cfg.ornament && (
        <Box sx={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 14, height: 14, bgcolor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: theme.accentColor }}>
          ◆
        </Box>
      )}
      <Typography
        variant="caption"
        sx={{
          fontFamily: cfg.family,
          fontSize: '0.64rem',
          fontWeight: 700,
          letterSpacing: `${cfg.spacing}px`,
          textTransform: 'uppercase',
          color: cfg.color
        }}
      >
        {cfg.label}
      </Typography>
    </Box>
  );
};
