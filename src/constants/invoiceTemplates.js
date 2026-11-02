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
    description: 'Deep forest emerald banner with antique brass accents, atelier monogram crest, and refined styling.'
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
    description: 'Champagne bronze double-line borders, boutique crest, and classical luxury typography.'
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
    description: 'Deep azure with frost-blue highlights, aristocratic seal header, and crisp dual-tone financial columns.'
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
    description: 'Dusty plum with warm rose gold hairline dividers, designed for luxury bridal suites & couture bespoke orders.'
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
    description: 'Kashmiri vermillion red with brass gold highlights, ornamental frame, and artisanal lineage typography.'
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
    description: 'Warm titanium graphite layout with razor-crisp grid dividers, burnt amber accents, and modern high-end data tables.'
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
    description: 'Crisp Swiss typographic editorial grid, razor-sharp dividers, and ink-violet accents.'
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
    description: 'Compact receipt format in warm mocha with dashed rules, optimized for rapid counter bills & thermal slips.'
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
