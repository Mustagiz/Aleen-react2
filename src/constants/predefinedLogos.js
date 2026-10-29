// Curated Luxury Atelier & Boutique Vector Logos
// Each logo is a crafted high-resolution SVG crest featuring luxury metallic gold, jewelry faceting, and haute couture emblems.

const createSvgDataUri = (svgContent) => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
};

export const PREDEFINED_LOGOS = [
  {
    id: 'crown-scissors',
    name: 'Imperial Crown & Shears',
    category: 'Haute Couture',
    badgeColor: '#D97706',
    accentGlow: 'rgba(217, 119, 6, 0.35)',
    description: 'Gold coronet with precision tailoring shears on obsidian sapphire ground',
    dataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <defs>
          <linearGradient id="goldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFBEB" />
            <stop offset="25%" stop-color="#FDE68A" />
            <stop offset="55%" stop-color="#F59E0B" />
            <stop offset="85%" stop-color="#D97706" />
            <stop offset="100%" stop-color="#78350F" />
          </linearGradient>
          <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0F172A" />
            <stop offset="60%" stop-color="#064E3B" />
            <stop offset="100%" stop-color="#022C22" />
          </linearGradient>
          <filter id="shadow1" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.4" />
          </filter>
        </defs>
        <!-- Luxury Canvas -->
        <rect width="160" height="160" rx="34" fill="url(#bgGrad1)" stroke="url(#goldGrad1)" stroke-width="2.5" />
        <circle cx="80" cy="80" r="66" fill="none" stroke="rgba(253, 230, 138, 0.2)" stroke-width="1.2" stroke-dasharray="2 3" />
        <circle cx="80" cy="80" r="59" fill="none" stroke="url(#goldGrad1)" stroke-width="0.8" opacity="0.6" />
        
        <!-- Imperial Crown -->
        <g filter="url(#shadow1)">
          <path d="M52 56 L60 70 L80 46 L100 70 L108 56 L112 78 L48 78 Z" fill="url(#goldGrad1)" />
          <circle cx="52" cy="54" r="3" fill="#FFFBEB" />
          <circle cx="80" cy="43" r="3.8" fill="#FFFBEB" />
          <circle cx="108" cy="54" r="3" fill="#FFFBEB" />
          <ellipse cx="80" cy="74" rx="26" ry="3" fill="#78350F" opacity="0.6" />
          <!-- Crown Jewels -->
          <circle cx="68" cy="74" r="2.2" fill="#FEF08A" />
          <circle cx="80" cy="74" r="2.6" fill="#FFFBEB" />
          <circle cx="92" cy="74" r="2.2" fill="#FEF08A" />
        </g>

        <!-- Tailoring Shears -->
        <g stroke="url(#goldGrad1)" stroke-linecap="round" fill="none" filter="url(#shadow1)">
          <line x1="56" y1="110" x2="104" y2="82" stroke-width="3.5" />
          <line x1="104" y1="110" x2="56" y2="82" stroke-width="3.5" />
          <!-- Shears Handles -->
          <ellipse cx="54" cy="115" rx="7" ry="5.5" stroke-width="3" fill="#022C22" />
          <ellipse cx="106" cy="115" rx="7" ry="5.5" stroke-width="3" fill="#022C22" />
          <!-- Golden Pivot Screw -->
          <circle cx="80" cy="96" r="3.2" fill="#FFFBEB" stroke="#78350F" stroke-width="1" />
        </g>
      </svg>
    `)
  },
  {
    id: 'diamond-needle',
    name: 'Solitaire & Silk Needle',
    category: 'Luxury Atelier',
    badgeColor: '#7C3AED',
    accentGlow: 'rgba(124, 58, 237, 0.35)',
    description: 'Precision cut solitaire gem with golden couture needle and flowing thread',
    dataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <defs>
          <linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFBEB" />
            <stop offset="40%" stop-color="#FCD34D" />
            <stop offset="80%" stop-color="#D97706" />
            <stop offset="100%" stop-color="#92400E" />
          </linearGradient>
          <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1E1B4B" />
            <stop offset="60%" stop-color="#0F172A" />
            <stop offset="100%" stop-color="#020617" />
          </linearGradient>
          <linearGradient id="gemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(196, 181, 253, 0.25)" />
            <stop offset="100%" stop-color="rgba(124, 58, 237, 0.08)" />
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="34" fill="url(#bgGrad2)" stroke="url(#goldGrad2)" stroke-width="2.5" />
        <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(245, 158, 11, 0.18)" stroke-width="1.2" stroke-dasharray="3 4" />

        <!-- Faceted Solitaire Diamond -->
        <polygon points="80,32 114,60 80,112 46,60" fill="url(#gemGrad)" stroke="url(#goldGrad2)" stroke-width="2.6" stroke-linejoin="round" />
        <!-- Crown Facets -->
        <line x1="46" y1="60" x2="114" y2="60" stroke="url(#goldGrad2)" stroke-width="1.8" />
        <line x1="64" y1="32" x2="60" y2="60" stroke="url(#goldGrad2)" stroke-width="1.6" />
        <line x1="96" y1="32" x2="100" y2="60" stroke="url(#goldGrad2)" stroke-width="1.6" />
        <!-- Pavilion Facets -->
        <line x1="60" y1="60" x2="80" y2="112" stroke="url(#goldGrad2)" stroke-width="1.8" />
        <line x1="100" y1="60" x2="80" y2="112" stroke="url(#goldGrad2)" stroke-width="1.8" />
        <!-- Table facet -->
        <polygon points="64,32 96,32 100,44 60,44" fill="rgba(255,255,255,0.15)" stroke="url(#goldGrad2)" stroke-width="1.4" />

        <!-- Master Needle -->
        <g stroke="#FFFFFF" stroke-linecap="round">
          <line x1="80" y1="128" x2="80" y2="22" stroke-width="3" />
          <ellipse cx="80" cy="28" rx="1.5" ry="4" fill="#1E1B4B" stroke="url(#goldGrad2)" stroke-width="1.2" />
        </g>

        <!-- Golden Silk Loop -->
        <path d="M80 26 C 102 14, 120 32, 104 46 C 92 56, 68 64, 80 80 C 90 94, 102 96, 100 106" fill="none" stroke="url(#goldGrad2)" stroke-width="2.4" stroke-linecap="round" />
        <circle cx="80" cy="112" r="2.8" fill="#FFFBEB" />
      </svg>
    `)
  },
  {
    id: 'royal-peacock',
    name: 'Regal Peacock & Feather',
    category: 'Bridal & Heritage',
    badgeColor: '#059669',
    accentGlow: 'rgba(5, 150, 105, 0.35)',
    description: 'Heritage royal plume crest for grand bridal and festive ateliers',
    dataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <defs>
          <linearGradient id="goldGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFBEB" />
            <stop offset="30%" stop-color="#FEF08A" />
            <stop offset="70%" stop-color="#F59E0B" />
            <stop offset="100%" stop-color="#78350F" />
          </linearGradient>
          <linearGradient id="bgGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#022C22" />
            <stop offset="60%" stop-color="#064E3B" />
            <stop offset="100%" stop-color="#0F766E" />
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="34" fill="url(#bgGrad3)" stroke="url(#goldGrad3)" stroke-width="2.5" />
        <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(253, 230, 138, 0.2)" stroke-width="1.2" stroke-dasharray="2 3" />

        <!-- Majestic Peacock Plume Arc -->
        <path d="M44 94 C 44 48, 116 48, 116 94 C 116 122, 72 126, 62 108" fill="none" stroke="url(#goldGrad3)" stroke-width="3.2" stroke-linecap="round" />
        <path d="M54 94 C 54 58, 106 58, 106 94" fill="none" stroke="url(#goldGrad3)" stroke-width="1.8" stroke-dasharray="2 3" />

        <!-- Peacock Eye of the Feather -->
        <ellipse cx="80" cy="56" rx="14" ry="17" fill="url(#goldGrad3)" />
        <ellipse cx="80" cy="58" rx="9" ry="11" fill="#022C22" />
        <circle cx="80" cy="60" r="4.5" fill="#10B981" />
        <circle cx="80" cy="60" r="2" fill="#FFFBEB" />

        <!-- Radiant Plume Whisps -->
        <path d="M60 76 C 68 68, 92 68, 100 76" fill="none" stroke="url(#goldGrad3)" stroke-width="2.2" stroke-linecap="round" />
        <path d="M52 90 C 64 80, 96 80, 108 90" fill="none" stroke="url(#goldGrad3)" stroke-width="2.2" stroke-linecap="round" />

        <!-- Crown Droplets -->
        <circle cx="58" cy="100" r="3.2" fill="#FFFBEB" />
        <circle cx="102" cy="100" r="3.2" fill="#FFFBEB" />
        <circle cx="80" cy="108" r="4" fill="url(#goldGrad3)" />
      </svg>
    `)
  },
  {
    id: 'geometric-monogram',
    name: 'Modern Atelier Monogram',
    category: 'Modern Couture',
    badgeColor: '#2563EB',
    accentGlow: 'rgba(37, 99, 235, 0.35)',
    description: 'Sleek architectural octagon with bespoke monogram and tailored accents',
    dataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <defs>
          <linearGradient id="goldGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFBEB" />
            <stop offset="35%" stop-color="#FCD34D" />
            <stop offset="75%" stop-color="#D97706" />
            <stop offset="100%" stop-color="#78350F" />
          </linearGradient>
          <linearGradient id="bgGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#090D16" />
            <stop offset="50%" stop-color="#0F172A" />
            <stop offset="100%" stop-color="#1E293B" />
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="34" fill="url(#bgGrad4)" stroke="url(#goldGrad4)" stroke-width="2.5" />

        <!-- Architectural Octagon Frame -->
        <polygon points="56,26 104,26 134,56 134,104 104,134 56,134 26,104 26,56" fill="none" stroke="url(#goldGrad4)" stroke-width="3" stroke-linejoin="round" />
        <polygon points="60,34 100,34 126,60 126,100 100,126 60,126 34,100 34,60" fill="none" stroke="rgba(253, 230, 138, 0.28)" stroke-width="1.4" stroke-linejoin="round" />

        <!-- Stylized Serif Monogram 'A' -->
        <text x="80" y="99" font-family="'Cinzel', 'Playfair Display', Georgia, serif" font-weight="900" font-size="60" fill="url(#goldGrad4)" text-anchor="middle" letter-spacing="0.02em">A</text>
        <circle cx="80" cy="116" r="3.2" fill="#FFFBEB" />
        <line x1="62" y1="120" x2="98" y2="120" stroke="url(#goldGrad4)" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    `)
  },
  {
    id: 'heritage-shield',
    name: 'Imperial Heraldic Shield',
    category: 'Heritage Atelier',
    badgeColor: '#EA580C',
    accentGlow: 'rgba(234, 88, 12, 0.35)',
    description: 'Timeless coat of arms with royal coronet and fleur-de-lis insignia',
    dataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <defs>
          <linearGradient id="goldGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFBEB" />
            <stop offset="40%" stop-color="#FDE68A" />
            <stop offset="75%" stop-color="#D97706" />
            <stop offset="100%" stop-color="#78350F" />
          </linearGradient>
          <linearGradient id="bgGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1C1917" />
            <stop offset="60%" stop-color="#292524" />
            <stop offset="100%" stop-color="#0C0A09" />
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="34" fill="url(#bgGrad5)" stroke="url(#goldGrad5)" stroke-width="2.5" />
        <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(253, 230, 138, 0.18)" stroke-width="1.2" stroke-dasharray="2 3" />

        <!-- Double Inset Shield -->
        <path d="M48 42 L112 42 C112 76 100 106 80 126 C60 106 48 76 48 42 Z" fill="rgba(217, 119, 6, 0.08)" stroke="url(#goldGrad5)" stroke-width="3.2" stroke-linejoin="round" />
        <path d="M56 50 L104 50 C104 76 94 100 80 116 C66 100 56 76 56 50 Z" fill="none" stroke="rgba(253, 230, 138, 0.3)" stroke-width="1.4" />

        <!-- Mini Imperial Crown on Shield -->
        <path d="M66 60 L72 70 L80 58 L88 70 L94 60 L94 74 L66 74 Z" fill="url(#goldGrad5)" />
        <circle cx="66" cy="58" r="2" fill="#FFFBEB" />
        <circle cx="80" cy="55" r="2.5" fill="#FFFBEB" />
        <circle cx="94" cy="58" r="2" fill="#FFFBEB" />

        <!-- Fleur-de-lis Emblem in Center -->
        <path d="M80 82 C76 86, 73 91, 74 97 C78 98, 80 94, 80 94 C80 94, 82 98, 86 97 C87 91, 84 86, 80 82 Z" fill="url(#goldGrad5)" />
        <circle cx="80" cy="104" r="3" fill="#FFFBEB" />
      </svg>
    `)
  },
  {
    id: 'botanical-lotus',
    name: 'Silk Bloom & Golden Loom',
    category: 'Silk & Textile',
    badgeColor: '#DB2777',
    accentGlow: 'rgba(219, 39, 119, 0.35)',
    description: 'Gold botanical lotus blossom entwined with handloom silk threads',
    dataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <defs>
          <linearGradient id="goldGrad6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFBEB" />
            <stop offset="35%" stop-color="#FDE68A" />
            <stop offset="70%" stop-color="#F59E0B" />
            <stop offset="100%" stop-color="#92400E" />
          </linearGradient>
          <linearGradient id="bgGrad6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3B0764" />
            <stop offset="50%" stop-color="#1E1B4B" />
            <stop offset="100%" stop-color="#020617" />
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="34" fill="url(#bgGrad6)" stroke="url(#goldGrad6)" stroke-width="2.5" />
        <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(253, 230, 138, 0.2)" stroke-width="1.2" stroke-dasharray="2 3" />

        <!-- Lotus Petals in Sacred Geometry -->
        <path d="M80 38 C 70 58, 70 82, 80 98 C 90 82, 90 58, 80 38 Z" fill="url(#goldGrad6)" />
        <path d="M80 60 C 62 68, 48 84, 56 100 C 66 102, 74 96, 80 94" fill="none" stroke="url(#goldGrad6)" stroke-width="3" stroke-linecap="round" />
        <path d="M80 60 C 98 68, 112 84, 104 100 C 94 102, 86 96, 80 94" fill="none" stroke="url(#goldGrad6)" stroke-width="3" stroke-linecap="round" />
        <path d="M46 110 C 64 116, 96 116, 114 110" fill="none" stroke="url(#goldGrad6)" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="80" cy="112" r="3.5" fill="#FFFBEB" />
      </svg>
    `)
  }
];
