export const INVOICE_TEMPLATES = [
  {
    id: 'atelier-emerald',
    name: 'Atelier Royal Emerald',
    tagline: 'Signature Luxury Couture',
    primaryColor: '#155D46',
    secondaryColor: '#B08D57',
    darkColor: '#08281F',
    headerBg: 'linear-gradient(135deg, #08281F 0%, #155D46 100%)',
    badge: 'Signature',
    description: 'Full colour header banner, split ledger with atelier privileges panel and a filled net-total band.',
    format: {
      header: 'banner',
      sheet: 'soft',
      meta: 'card',
      items: 'banded-table',
      summary: 'split-privileges',
      footer: 'signature-right',
      tear: 'client-copy'
    }
  },
  {
    id: 'champagne-gold',
    name: 'Classic Champagne Gold',
    tagline: 'Regal Boutique Heritage',
    primaryColor: '#8A6A27',
    secondaryColor: '#C9A227',
    darkColor: '#3D2C10',
    headerBg: 'linear-gradient(135deg, #3D2C10 0%, #8A6A27 100%)',
    badge: 'Regal',
    description: 'Centred crest letterhead inside a double-rule certificate frame, ledger table and stacked settlement footer.',
    format: {
      header: 'crest',
      sheet: 'double-rule',
      meta: 'inline-centered',
      items: 'ledger-table',
      summary: 'stacked-ledger',
      footer: 'centered-seal',
      tear: 'original-client'
    }
  },
  {
    id: 'royal-sapphire',
    name: 'Royal Velvet Sapphire',
    tagline: 'Aristocratic Prestige & Seal',
    primaryColor: '#0F5C8B',
    secondaryColor: '#4FB4E8',
    darkColor: '#06263C',
    headerBg: 'linear-gradient(135deg, #06263C 0%, #0F5C8B 60%, #1976B8 100%)',
    badge: 'Prestige',
    description: 'Filled identity rail beside a document title block, ruled tinted ledger and a headed summary rail.',
    format: {
      header: 'rail',
      sheet: 'spine',
      meta: 'split-grid',
      items: 'ruled-table',
      summary: 'dark-rail',
      footer: 'corner-seal',
      tear: 'client-copy'
    }
  },
  {
    id: 'rose-plum',
    name: 'Rose Gold & Dusty Plum',
    tagline: 'Haute Bridal Trousseau',
    primaryColor: '#8A4A76',
    secondaryColor: '#C97BA6',
    darkColor: '#3F2340',
    headerBg: 'linear-gradient(135deg, #3F2340 0%, #8A4A76 60%, #A85C82 100%)',
    badge: 'Bridal',
    description: 'Editorial masthead with hairline rules, dotted-leader garment list and a soft blush totals card.',
    format: {
      header: 'masthead',
      sheet: 'hairline',
      meta: 'ledger-columns',
      items: 'editorial-list',
      summary: 'blush-card',
      footer: 'monogram-centered',
      tear: 'trousseau-copy'
    }
  },
  {
    id: 'heritage-crimson',
    name: 'Kashmiri Heritage Crimson',
    tagline: 'Pashmina & Royal Tilla',
    primaryColor: '#93261F',
    secondaryColor: '#C08A3E',
    darkColor: '#4A130F',
    headerBg: 'linear-gradient(135deg, #4A130F 0%, #7C1B18 55%, #93261F 100%)',
    badge: 'Heritage',
    description: 'Ornamental framed sheet with corner ticks, provenance ledger rows and a brass-ruled artisan note.',
    format: {
      header: 'framed-crest',
      sheet: 'ornament',
      meta: 'inline-centered',
      items: 'provenance-table',
      summary: 'framed-ledger',
      footer: 'framed-seal',
      tear: 'heritage-ornament'
    }
  },
  {
    id: 'executive-slate',
    name: 'Executive Monolith Slate',
    tagline: 'Architectural Minimalist Luxury',
    primaryColor: '#4B4A47',
    secondaryColor: '#C05621',
    darkColor: '#232220',
    headerBg: 'linear-gradient(135deg, #232220 0%, #4B4A47 70%, #6E6B65 100%)',
    badge: 'Executive',
    description: 'Compact data-strip header, fully bordered dense grid with tabular figures and KPI total tiles.',
    format: {
      header: 'data-strip',
      sheet: 'flat',
      meta: 'split-grid',
      items: 'grid-table',
      summary: 'kpi-tiles',
      footer: 'terms-split',
      tear: 'official-record'
    }
  },
  {
    id: 'minimal-haute',
    name: 'Modern Minimalist Haute',
    tagline: 'High-Fashion Monochromatic',
    primaryColor: '#221C3A',
    secondaryColor: '#7C6FE8',
    darkColor: '#100C1F',
    headerBg: 'linear-gradient(135deg, #100C1F 0%, #3A3163 100%)',
    badge: 'Modern',
    description: 'Swiss editorial sheet: oversized document number, airy hairline rows and a single-line total.',
    format: {
      header: 'wordmark',
      sheet: 'airy',
      meta: 'ledger-columns',
      items: 'airy-list',
      summary: 'hairline-stack',
      footer: 'minimal-hairline',
      tear: 'hairline'
    }
  },
  {
    id: 'boutique-slip',
    name: 'Compact POS Boutique Slip',
    tagline: '80mm Thermal & Counter Bill',
    primaryColor: '#5B4636',
    secondaryColor: '#8B6F52',
    darkColor: '#2E2119',
    headerBg: 'linear-gradient(135deg, #2E2119 0%, #5B4636 100%)',
    badge: 'POS Slip',
    description: 'Compact monospace counter slip with dashed separators and a tear-off footer.',
    format: {
      header: 'receipt',
      sheet: 'dashed',
      meta: 'slip-lines',
      items: 'mono-slip',
      summary: 'slip-stack',
      footer: 'slip-thanks',
      tear: 'counter-slip'
    }
  }
];

export const DEFAULT_INVOICE_SETTINGS = {
  template: 'atelier-emerald',
  useCustomLetterhead: false,
  customLetterheadImage: '',
  showWatermark: true,
  watermarkText: 'ALEEN CLOTHING',
  tagline: 'Haute Couture & Bespoke Craftsmanship',
  showBankDetails: true,
  leftBoxMode: 'luxury-composite', // 'luxury-composite' | 'upi-qr' | 'loyalty-privileges' | 'garment-care' | 'concierge' | 'banking' | 'none'
  bankDetails: {
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200088992211',
    ifsc: 'HDFC0001234',
    upiId: 'aleenclothing@hdfcbank'
  },
  showSignatureStamp: true,
  signatureLabel: 'Authorized Atelier Signatory',
  signatureImage: '',
  termsText: '1. Goods once sold may be exchanged within 7 days with original price tag and invoice.\n2. Bespoke alterations are complimentary within 30 days of delivery.\n3. Custom tailored and made-to-measure bridal orders are non-refundable.',
  customFooterNote: 'Thank you for shopping with Aleen Clothing! We cherish dressing your finest moments.'
};

export const getStoredInvoiceSettings = () => {
  try {
    const stored = localStorage.getItem('aleen_invoice_template_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_INVOICE_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error reading invoice template settings', e);
  }
  return DEFAULT_INVOICE_SETTINGS;
};
