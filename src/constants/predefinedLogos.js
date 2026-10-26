// Curated Luxury Atelier & Boutique Vector Logos
// Each logo is an inline SVG with embedded emerald, gold, and obsidian accents.

const createSvgDataUri = (svgContent) => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
};

export const PREDEFINED_LOGOS = [
  {
    id: 'crown-scissors',
    name: 'Imperial Crown & Shears',
    category: 'Haute Couture',
    description: 'Gold coronet with precision tailoring shears',
    dataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="gGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FDE68A" />
            <stop offset="50%" stop-color="#F59E0B" />
            <stop offset="100%" stop-color="#B45309" />
          </linearGradient>
          <linearGradient id="gBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#042F2E" />
            <stop offset="100%" stop-color="#0F766E" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#gBg)" stroke="#D97706" stroke-width="2.5" />
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(245, 158, 11, 0.25)" stroke-width="1.5" stroke-dasharray="3 3" />
        <!-- Crown -->
        <path d="M42 42 L48 54 L60 36 L72 54 L78 42 L80 60 L40 60 Z" fill="url(#gGold)" />
        <circle cx="42" cy="40" r="2.5" fill="#FDE68A" />
        <circle cx="60" cy="34" r="3" fill="#FDE68A" />
        <circle cx="78" cy="40" r="2.5" fill="#FDE68A" />
        <!-- Crossed Scissors -->
        <g stroke="url(#gGold)" stroke-width="3" stroke-linecap="round" fill="none">
          <line x1="42" y1="84" x2="78" y2="64" />
          <line x1="78" y1="84" x2="42" y2="64" />
          <circle cx="42" cy="88" r="5" stroke-width="2.5" fill="#042F2E" />
          <circle cx="78" cy="88" r="5" stroke-width="2.5" fill="#042F2E" />
          <circle cx="60" cy="74" r="2" fill="#FDE68A" />
        </g>
      </svg>
    `)
  },
  {
    id: 'diamond-needle',
    name: 'Solitaire & Silk Needle',
    category: 'Luxury Atelier',
    description: 'Faceted gem pierced by a golden needle & silk thread',
    dataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="gGold2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FCD34D" />
            <stop offset="50%" stop-color="#F59E0B" />
            <stop offset="100%" stop-color="#92400E" />
          </linearGradient>
          <linearGradient id="gBg2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#021C1C" />
            <stop offset="100%" stop-color="#064E3B" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#gBg2)" stroke="#F59E0B" stroke-width="2.5" />
        <!-- Diamond Facets -->
        <polygon points="60,26 84,46 60,82 36,46" fill="none" stroke="url(#gGold2)" stroke-width="2.5" stroke-linejoin="round" />
        <line x1="36" y1="46" x2="84" y2="46" stroke="url(#gGold2)" stroke-width="1.8" />
        <line x1="48" y1="26" x2="48" y2="46" stroke="url(#gGold2)" stroke-width="1.8" />
        <line x1="72" y1="26" x2="72" y2="46" stroke="url(#gGold2)" stroke-width="1.8" />
        <line x1="48" y1="46" x2="60" y2="82" stroke="url(#gGold2)" stroke-width="1.8" />
        <line x1="72" y1="46" x2="60" y2="82" stroke="url(#gGold2)" stroke-width="1.8" />
        <!-- Needle -->
        <g stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round">
          <line x1="60" y1="96" x2="60" y2="20" />
          <ellipse cx="60" cy="24" rx="1.2" ry="3" fill="#042F2E" />
        </g>
        <!-- Golden Thread loop -->
        <path d="M60 22 C 75 14, 88 28, 76 38 C 68 44, 52 50, 60 62" fill="none" stroke="url(#gGold2)" stroke-width="2" stroke-linecap="round" />
      </svg>
    `)
  },
  {
    id: 'royal-peacock',
    name: 'Regal Peacock & Feather',
    category: 'Bridal & Heritage',
    description: 'Heritage royal plume motif for festive & bridal wear',
    dataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="gGold3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FEF08A" />
            <stop offset="60%" stop-color="#F59E0B" />
            <stop offset="100%" stop-color="#78350F" />
          </linearGradient>
          <linearGradient id="gBg3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#042F2E" />
            <stop offset="100%" stop-color="#0F766E" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#gBg3)" stroke="#F59E0B" stroke-width="2.5" />
        <!-- Stylized Peacock Arch -->
        <path d="M34 68 C 34 38, 86 38, 86 68 C 86 92, 54 94, 46 80" fill="none" stroke="url(#gGold3)" stroke-width="2.8" stroke-linecap="round" />
        <circle cx="60" cy="46" r="6" fill="url(#gGold3)" />
        <circle cx="60" cy="46" r="2.5" fill="#042F2E" />
        <path d="M46 54 C 52 46, 68 46, 74 54" fill="none" stroke="url(#gGold3)" stroke-width="2" />
        <path d="M42 66 C 50 56, 70 56, 78 66" fill="none" stroke="url(#gGold3)" stroke-width="2" />
        <circle cx="46" cy="74" r="3" fill="#FEF08A" />
        <circle cx="74" cy="74" r="3" fill="#FEF08A" />
        <circle cx="60" cy="80" r="3.5" fill="#F59E0B" />
      </svg>
    `)
  },
  {
    id: 'geometric-monogram',
    name: 'Modern Atelier Octagon',
    category: 'Modern Couture',
    description: 'Sleek architectural crest with bespoke monogram & needle',
    dataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="gGold4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FDE68A" />
            <stop offset="50%" stop-color="#D97706" />
            <stop offset="100%" stop-color="#78350F" />
          </linearGradient>
          <linearGradient id="gBg4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0B1319" />
            <stop offset="100%" stop-color="#042F2E" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#gBg4)" stroke="#F59E0B" stroke-width="2.5" />
        <!-- Octagon Frame -->
        <polygon points="44,24 76,24 96,44 96,76 76,96 44,96 24,76 24,44" fill="none" stroke="url(#gGold4)" stroke-width="2.5" />
        <polygon points="46,30 74,30 90,46 90,74 74,90 46,90 30,74 30,46" fill="none" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1.2" />
        <!-- Modern Serif Monogram A -->
        <text x="60" y="74" font-family="'Plus Jakarta Sans', 'Cinzel', serif" font-weight="900" font-size="44" fill="url(#gGold4)" text-anchor="middle">A</text>
      </svg>
    `)
  },
  {
    id: 'heritage-shield',
    name: 'Imperial Heraldic Shield',
    category: 'Heritage Atelier',
    description: 'Timeless European crest with laurel wreath & royal crown',
    dataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="gGold5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FEF08A" />
            <stop offset="50%" stop-color="#F59E0B" />
            <stop offset="100%" stop-color="#92400E" />
          </linearGradient>
          <linearGradient id="gBg5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#042F2E" />
            <stop offset="100%" stop-color="#021C1C" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#gBg5)" stroke="#D97706" stroke-width="2.5" />
        <!-- Shield -->
        <path d="M38 34 L82 34 C82 58 74 78 60 92 C46 78 38 58 38 34 Z" fill="none" stroke="url(#gGold5)" stroke-width="3" stroke-linejoin="round" />
        <path d="M44 40 L76 40 C76 58 70 72 60 82 C50 72 44 58 44 40 Z" fill="rgba(15, 118, 110, 0.25)" stroke="url(#gGold5)" stroke-width="1.2" />
        <!-- Mini Crown on Shield -->
        <path d="M50 48 L54 55 L60 46 L66 55 L70 48 L70 58 L50 58 Z" fill="url(#gGold5)" />
        <circle cx="60" cy="70" r="3.5" fill="#FEF08A" />
      </svg>
    `)
  },
  {
    id: 'botanical-lotus',
    name: 'Silk Bloom & Golden Loom',
    category: 'Silk & Textile',
    description: 'Gold botanical lotus entwined with handloom silk threads',
    dataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <defs>
          <linearGradient id="gGold6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FEF08A" />
            <stop offset="60%" stop-color="#F59E0B" />
            <stop offset="100%" stop-color="#B45309" />
          </linearGradient>
          <linearGradient id="gBg6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#064E3B" />
            <stop offset="100%" stop-color="#042F2E" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#gBg6)" stroke="#F59E0B" stroke-width="2.5" />
        <!-- Lotus Petals -->
        <path d="M60 30 C 52 46, 52 64, 60 76 C 68 64, 68 46, 60 30 Z" fill="url(#gGold6)" />
        <path d="M60 46 C 46 52, 36 64, 42 76 C 50 78, 56 74, 60 72" fill="none" stroke="url(#gGold6)" stroke-width="2.5" stroke-linecap="round" />
        <path d="M60 46 C 74 52, 84 64, 78 76 C 70 78, 64 74, 60 72" fill="none" stroke="url(#gGold6)" stroke-width="2.5" stroke-linecap="round" />
        <path d="M34 84 C 48 88, 72 88, 86 84" fill="none" stroke="url(#gGold6)" stroke-width="2" stroke-linecap="round" />
        <circle cx="60" cy="86" r="3" fill="#FEF08A" />
      </svg>
    `)
  }
];
