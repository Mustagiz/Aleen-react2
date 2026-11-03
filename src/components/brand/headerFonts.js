// Curated header typography for the CRM brand block. Every family here is
// loaded in public/index.html, so a saved choice renders immediately.
export const HEADER_FONTS = [
  { id: 'great-vibes', label: 'Great Vibes', kind: 'script', weight: 400, stack: '"Great Vibes", "Snell Roundhand", "Apple Chancery", cursive' },
  { id: 'parisienne', label: 'Parisienne', kind: 'script', weight: 400, stack: '"Parisienne", cursive' },
  { id: 'allura', label: 'Allura', kind: 'script', weight: 400, stack: '"Allura", cursive' },
  { id: 'italianno', label: 'Italianno', kind: 'script', weight: 400, stack: '"Italianno", cursive' },
  { id: 'alex-brush', label: 'Alex Brush', kind: 'script', weight: 400, stack: '"Alex Brush", cursive' },
  { id: 'pinyon-script', label: 'Pinyon Script', kind: 'script', weight: 400, stack: '"Pinyon Script", cursive' },
  { id: 'sacramento', label: 'Sacramento', kind: 'script', weight: 400, stack: '"Sacramento", cursive' },
  { id: 'playfair', label: 'Playfair Display', kind: 'serif', weight: 600, stack: '"Playfair Display", Georgia, serif' },
  { id: 'cormorant', label: 'Cormorant Garamond', kind: 'serif', weight: 600, stack: '"Cormorant Garamond", Georgia, serif' },
  { id: 'libre-baskerville', label: 'Libre Baskerville', kind: 'serif', weight: 400, stack: '"Libre Baskerville", Georgia, serif' },
  { id: 'marcellus', label: 'Marcellus', kind: 'serif', weight: 400, stack: '"Marcellus", Georgia, serif' },
  { id: 'cinzel', label: 'Cinzel', kind: 'serif', weight: 600, stack: '"Cinzel", Georgia, serif' },
  { id: 'dm-sans', label: 'DM Sans', kind: 'sans', weight: 700, stack: '"DM Sans", "Inter", sans-serif' },
  { id: 'jost', label: 'Jost', kind: 'sans', weight: 600, stack: '"Jost", "DM Sans", sans-serif' },
  { id: 'montserrat', label: 'Montserrat', kind: 'sans', weight: 700, stack: '"Montserrat", "DM Sans", sans-serif' },
  { id: 'manrope', label: 'Manrope', kind: 'sans', weight: 700, stack: '"Manrope", "DM Sans", sans-serif' }
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
