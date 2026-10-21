export const INVOICE_TEMPLATES = [
  {
    id: 'atelier-emerald',
    name: 'Atelier Royal Emerald',
    tagline: 'Signature Luxury Couture',
    primaryColor: '#0F766E',
    secondaryColor: '#D97706',
    darkColor: '#042F2E',
    headerBg: 'linear-gradient(135deg, #042F2E 0%, #0F766E 100%)',
    badge: 'Signature',
    description: 'Deep emerald banner with champagne gold accents, atelier monogram crest, and refined styling.'
  },
  {
    id: 'champagne-gold',
    name: 'Classic Champagne Gold',
    tagline: 'Regal Boutique Heritage',
    primaryColor: '#D97706',
    secondaryColor: '#B45309',
    darkColor: '#78350F',
    headerBg: 'linear-gradient(135deg, #78350F 0%, #D97706 100%)',
    badge: 'Regal',
    description: 'Warm gold double-line borders, boutique crest, and classical luxury typography.'
  },
  {
    id: 'minimal-haute',
    name: 'Modern Minimalist Haute',
    tagline: 'High-Fashion Monochromatic',
    primaryColor: '#18181B',
    secondaryColor: '#52525B',
    darkColor: '#09090B',
    headerBg: 'linear-gradient(135deg, #09090B 0%, #27272A 100%)',
    badge: 'Modern',
    description: 'Crisp Swiss typographic editorial grid, razor-sharp dividers, and obsidian accents.'
  },
  {
    id: 'boutique-slip',
    name: 'Compact POS Boutique Slip',
    tagline: '80mm Thermal & Counter Bill',
    primaryColor: '#334155',
    secondaryColor: '#0F766E',
    darkColor: '#1E293B',
    headerBg: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
    badge: 'POS Slip',
    description: 'Compact receipt format with dashed rules, optimized for rapid counter bills & thermal slips.'
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
  bankDetails: {
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200088992211',
    ifsc: 'HDFC0001234',
    upiId: 'aleenclothing@hdfcbank'
  },
  showSignatureStamp: true,
  signatureLabel: 'Authorized Atelier Signatory',
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
