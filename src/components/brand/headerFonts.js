// Curated header typography for the CRM brand block. Every family listed here
// is requested in public/index.html, so a saved choice renders immediately.
// `weights` reflects the weights actually loaded; `italic` means the family
// ships an italic cut. Anything unsupported is disabled in Settings rather than
// faked by the browser.
const script = (id, label, weights = [400], italic = false) => ({
  id,
  label,
  kind: 'script',
  stack: `"${label}", "Great Vibes", cursive`,
  weights,
  italic
});

const serif = (id, label, weights = [400], italic = false) => ({
  id,
  label,
  kind: 'serif',
  stack: `"${label}", Georgia, serif`,
  weights,
  italic
});

const sans = (id, label, weights = [400], italic = false) => ({
  id,
  label,
  kind: 'sans',
  stack: `"${label}", "DM Sans", sans-serif`,
  weights,
  italic
});

export const HEADER_FONTS = [
  // Signature scripts
  script('great-vibes', 'Great Vibes'),
  script('parisienne', 'Parisienne'),
  script('allura', 'Allura'),
  script('italianno', 'Italianno'),
  script('alex-brush', 'Alex Brush'),
  script('pinyon-script', 'Pinyon Script'),
  script('sacramento', 'Sacramento'),
  script('dancing-script', 'Dancing Script', [400, 700]),
  script('lobster-two', 'Lobster Two', [400, 700], true),
  script('pacifico', 'Pacifico'),
  script('caveat', 'Caveat', [400, 700]),
  script('kaushan-script', 'Kaushan Script'),
  script('courgette', 'Courgette'),
  script('yellowtail', 'Yellowtail'),
  script('tangerine', 'Tangerine', [400, 700]),
  script('marck-script', 'Marck Script'),
  script('mrs-saint-delafield', 'Mrs Saint Delafield'),
  script('petit-formal-script', 'Petit Formal Script'),

  // Serif & display
  serif('playfair', 'Playfair Display', [400, 600, 700], true),
  serif('cormorant', 'Cormorant Garamond', [400, 500, 600, 700], true),
  serif('libre-baskerville', 'Libre Baskerville', [400, 700], true),
  serif('marcellus', 'Marcellus'),
  serif('cinzel', 'Cinzel', [400, 600, 700]),
  serif('eb-garamond', 'EB Garamond', [400, 600, 700], true),
  serif('lora', 'Lora', [400, 600, 700], true),
  serif('merriweather', 'Merriweather', [400, 700], true),
  serif('crimson-text', 'Crimson Text', [400, 600, 700], true),
  serif('bodoni-moda', 'Bodoni Moda', [400, 600, 700], true),
  serif('dm-serif-display', 'DM Serif Display', [400], true),
  serif('dm-serif-text', 'DM Serif Text', [400], true),
  serif('rozha-one', 'Rozha One'),
  serif('prata', 'Prata'),
  serif('cardo', 'Cardo', [400, 700], true),
  serif('spectral', 'Spectral', [400, 600, 700], true),
  serif('gilda-display', 'Gilda Display'),
  serif('forum', 'Forum'),

  // Modern sans
  sans('dm-sans', 'DM Sans', [400, 700], true),
  sans('jost', 'Jost', [400, 600, 700], true),
  sans('montserrat', 'Montserrat', [400, 600, 700], true),
  sans('manrope', 'Manrope', [400, 600, 700]),
  sans('inter', 'Inter', [400, 600, 700]),
  sans('raleway', 'Raleway', [400, 600, 700], true),
  sans('poppins', 'Poppins', [400, 600, 700], true),
  sans('nunito-sans', 'Nunito Sans', [400, 600, 700], true),
  sans('work-sans', 'Work Sans', [400, 600, 700], true),
  sans('outfit', 'Outfit', [400, 600, 700]),
  sans('sora', 'Sora', [400, 600, 700]),
  sans('barlow', 'Barlow', [400, 600, 700], true),
  sans('karla', 'Karla', [400, 600, 700], true),
  sans('rubik', 'Rubik', [400, 600, 700], true)
];

export const FONT_GROUPS = [
  { kind: 'script', label: 'Signature scripts' },
  { kind: 'serif', label: 'Serif & display' },
  { kind: 'sans', label: 'Modern sans' }
];

export const DEFAULT_NAME_FONT = 'great-vibes';
export const DEFAULT_NAME_SIZE = 27.5;
export const DEFAULT_TAGLINE_FONT = 'dm-sans';
export const DEFAULT_TAGLINE_SIZE = 9;

export const NAME_SIZE_RANGE = { min: 18, max: 38, step: 0.5 };
export const TAGLINE_SIZE_RANGE = { min: 7, max: 15, step: 0.5 };

export const getHeaderFont = (id) => HEADER_FONTS.find((font) => font.id === id) || HEADER_FONTS[0];

export const fontSupportsBold = (font) => font.weights.some((weight) => weight >= 600);

export const getFontWeight = (font, bold) => {
  if (!bold) return 400;
  const boldWeight = [700, 600].find((weight) => font.weights.includes(weight));
  return boldWeight || 400;
};

export const getFontStyle = (font, italic) => (italic && font.italic ? 'italic' : 'normal');
