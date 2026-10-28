// Full Ecosystem Design Systems for Aleen CRM
// Emulates the design languages of Apple HIG, Microsoft Fluent, Zoho CRM, Linear, Salesforce, Stripe, Google Material 3, and Atelier Luxury.

export const DESIGN_SYSTEMS = [
  {
    id: 'apple',
    name: 'Apple macOS & iOS',
    company: 'Apple HIG',
    badge: 'Liquid Glass',
    tagline: 'Ultra-refined frosted glass, San Francisco typography, super-elliptical curves, and tactile elegance.',
    icon: '🍏',
    shape: {
      borderRadius: 16,
      buttonRadius: 12,
      inputRadius: 10,
      cardRadius: 18
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", sans-serif',
      h1Font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      fontWeightBold: 700,
      letterSpacing: '-0.022em'
    },
    palette: {
      primary: {
        main: '#0071E3', // Apple Iconic Blue
        light: '#479BFF',
        dark: '#0051A8',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#86868B', // Apple Space Gray
        light: '#A1A1A6',
        dark: '#6E6E73',
        contrastText: '#FFFFFF'
      },
      background: {
        lightDefault: '#F5F5F7', // Classic Apple Aluminum Light
        lightPaper: '#FFFFFF',
        darkDefault: '#000000', // Pure Apple OLED Dark
        darkPaper: '#161618'
      }
    },
    cardStyle: {
      backdropFilter: 'blur(20px)',
      borderLight: '1px solid rgba(0, 0, 0, 0.08)',
      borderDark: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadowLight: '0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
      boxShadowDark: '0 8px 30px rgba(0, 0, 0, 0.5)'
    },
    buttonStyle: {
      textTransform: 'none',
      fontWeight: 600,
      background: 'linear-gradient(180deg, #0077ED 0%, #0066CC 100%)',
      boxShadow: '0 2px 8px rgba(0, 113, 227, 0.28)'
    },
    accentGlow: 'rgba(0, 113, 227, 0.2)'
  },
  {
    id: 'microsoft',
    name: 'Microsoft Fluent 365',
    company: 'Microsoft Design',
    badge: 'Mica & Acrylic',
    tagline: 'Fluent 2 design system with Mica materials, subtle acrylic depth, Segoe UI clarity, and enterprise productivity.',
    icon: '🪟',
    shape: {
      borderRadius: 8,
      buttonRadius: 6,
      inputRadius: 4,
      cardRadius: 8
    },
    typography: {
      fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
      h1Font: '"Segoe UI Semibold", "Segoe UI", sans-serif',
      fontWeightBold: 600,
      letterSpacing: '-0.01em'
    },
    palette: {
      primary: {
        main: '#0078D4', // Fluent Communication Blue
        light: '#2B88D8',
        dark: '#004E8C',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#605E5C', // Fluent Neutral Secondary
        light: '#8A8886',
        dark: '#323130',
        contrastText: '#FFFFFF'
      },
      background: {
        lightDefault: '#F0F2F5',
        lightPaper: '#FFFFFF',
        darkDefault: '#202020', // Windows 11 Dark Mica
        darkPaper: '#2B2B2B'
      }
    },
    cardStyle: {
      backdropFilter: 'none',
      borderLight: '1px solid #E1DFDD',
      borderDark: '1px solid #3B3A39',
      boxShadowLight: '0 1.6px 3.6px 0 rgba(0,0,0,0.13), 0 0.3px 0.9px 0 rgba(0,0,0,0.11)',
      boxShadowDark: '0 4px 16px rgba(0, 0, 0, 0.36)'
    },
    buttonStyle: {
      textTransform: 'none',
      fontWeight: 600,
      background: '#0078D4',
      boxShadow: 'none'
    },
    accentGlow: 'rgba(0, 120, 212, 0.2)'
  },
  {
    id: 'zoho',
    name: 'Zoho CRM Enterprise',
    company: 'Zoho Corporation',
    badge: 'High Density',
    tagline: 'Energetic Zoho enterprise style with vibrant Zoho accents, high information density, and structured CRM workflows.',
    icon: '💼',
    shape: {
      borderRadius: 6,
      buttonRadius: 5,
      inputRadius: 4,
      cardRadius: 6
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1Font: '"Inter", sans-serif',
      fontWeightBold: 700,
      letterSpacing: '0em'
    },
    palette: {
      primary: {
        main: '#F15A24', // Zoho Energetic Red-Orange
        light: '#FF7A45',
        dark: '#D4380D',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#0F62FE', // Zoho Blue
        light: '#4589FF',
        dark: '#0043CE',
        contrastText: '#FFFFFF'
      },
      background: {
        lightDefault: '#F4F5F7',
        lightPaper: '#FFFFFF',
        darkDefault: '#17191C',
        darkPaper: '#22252A'
      }
    },
    cardStyle: {
      backdropFilter: 'none',
      borderLight: '1px solid #DFE1E6',
      borderDark: '1px solid #2F353D',
      boxShadowLight: '0 1px 3px rgba(9, 30, 66, 0.08)',
      boxShadowDark: '0 2px 8px rgba(0, 0, 0, 0.3)'
    },
    buttonStyle: {
      textTransform: 'none',
      fontWeight: 700,
      background: '#F15A24',
      boxShadow: '0 2px 6px rgba(241, 90, 36, 0.3)'
    },
    accentGlow: 'rgba(241, 90, 36, 0.22)'
  },
  {
    id: 'linear',
    name: 'Linear & Notion Minimalist',
    company: 'Linear App',
    badge: 'Craft & Precision',
    tagline: 'Ultra-clean monospaced precision, dark obsidian surfaces, electric violet accents, and zero visual clutter.',
    icon: '⚡',
    shape: {
      borderRadius: 8,
      buttonRadius: 6,
      inputRadius: 6,
      cardRadius: 8
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, monospace, sans-serif',
      h1Font: '"Inter", sans-serif',
      fontWeightBold: 600,
      letterSpacing: '-0.025em'
    },
    palette: {
      primary: {
        main: '#5E6AD2', // Linear Electric Indigo
        light: '#828DF8',
        dark: '#434EAE',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#22C55E', // Linear Signal Green
        light: '#4ADE80',
        dark: '#16A34A',
        contrastText: '#FFFFFF'
      },
      background: {
        lightDefault: '#FAF9F8',
        lightPaper: '#FFFFFF',
        darkDefault: '#0D0E11', // Linear Obsidian Black
        darkPaper: '#16171B'
      }
    },
    cardStyle: {
      backdropFilter: 'none',
      borderLight: '1px solid #E5E7EB',
      borderDark: '1px solid #23252A',
      boxShadowLight: '0 1px 2px rgba(0, 0, 0, 0.04)',
      boxShadowDark: '0 1px 3px rgba(0, 0, 0, 0.4)'
    },
    buttonStyle: {
      textTransform: 'none',
      fontWeight: 600,
      background: '#5E6AD2',
      boxShadow: '0 1px 4px rgba(94, 106, 210, 0.3)'
    },
    accentGlow: 'rgba(94, 106, 210, 0.25)'
  },
  {
    id: 'stripe',
    name: 'Stripe FinTech Pro',
    company: 'Stripe Design',
    badge: 'Fintech Luxury',
    tagline: 'Sophisticated fintech purple gradient, crisp tabular metrics, vibrant success chips, and world-class polish.',
    icon: '💳',
    shape: {
      borderRadius: 10,
      buttonRadius: 8,
      inputRadius: 6,
      cardRadius: 12
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
      h1Font: '"Plus Jakarta Sans", sans-serif',
      fontWeightBold: 700,
      letterSpacing: '-0.015em'
    },
    palette: {
      primary: {
        main: '#635BFF', // Stripe Iconic Blurple
        light: '#7F78FF',
        dark: '#4B43E0',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#00D4B2', // Stripe Aqua Teal
        light: '#33E0C4',
        dark: '#00A88D',
        contrastText: '#FFFFFF'
      },
      background: {
        lightDefault: '#F8FBFD',
        lightPaper: '#FFFFFF',
        darkDefault: '#0A2540', // Stripe Deep Navy Dark
        darkPaper: '#113255'
      }
    },
    cardStyle: {
      backdropFilter: 'none',
      borderLight: '1px solid #E3E8EE',
      borderDark: '1px solid #1E466E',
      boxShadowLight: '0 2px 5px rgba(60, 66, 87, 0.08), 0 1px 1px rgba(0, 0, 0, 0.04)',
      boxShadowDark: '0 8px 24px rgba(0, 0, 0, 0.4)'
    },
    buttonStyle: {
      textTransform: 'none',
      fontWeight: 700,
      background: 'linear-gradient(180deg, #635BFF 0%, #5248E5 100%)',
      boxShadow: '0 2px 8px rgba(99, 91, 255, 0.3)'
    },
    accentGlow: 'rgba(99, 91, 255, 0.22)'
  },
  {
    id: 'salesforce',
    name: 'Salesforce Lightning',
    company: 'Salesforce SLDS',
    badge: 'Enterprise Cloud',
    tagline: 'Salesforce Lightning Design System with Einstein Blue, clear badges, high visual contrast, and executive layouts.',
    icon: '☁️',
    shape: {
      borderRadius: 6,
      buttonRadius: 4,
      inputRadius: 4,
      cardRadius: 8
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
      h1Font: '-apple-system, BlinkMacSystemFont, sans-serif',
      fontWeightBold: 700,
      letterSpacing: '0em'
    },
    palette: {
      primary: {
        main: '#0176D3', // Salesforce Brand Blue
        light: '#1B96FF',
        dark: '#014486',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#00857C', // Salesforce Teal Accent
        light: '#04A79D',
        dark: '#005F58',
        contrastText: '#FFFFFF'
      },
      background: {
        lightDefault: '#F3F3F3',
        lightPaper: '#FFFFFF',
        darkDefault: '#181B20',
        darkPaper: '#252930'
      }
    },
    cardStyle: {
      backdropFilter: 'none',
      borderLight: '1px solid #DDDBDA',
      borderDark: '1px solid #3E434D',
      boxShadowLight: '0 2px 4px 0 rgba(0, 0, 0, 0.07)',
      boxShadowDark: '0 4px 12px rgba(0, 0, 0, 0.3)'
    },
    buttonStyle: {
      textTransform: 'none',
      fontWeight: 700,
      background: '#0176D3',
      boxShadow: 'none'
    },
    accentGlow: 'rgba(1, 118, 211, 0.2)'
  },
  {
    id: 'material',
    name: 'Google Material You (M3)',
    company: 'Google Material Design',
    badge: 'Pill & Expressive',
    tagline: 'Material 3 design language with pill buttons, extra-soft container corners, Google Blue accents, and fluid warmth.',
    icon: '🎨',
    shape: {
      borderRadius: 24, // Iconic M3 extra-rounded
      buttonRadius: 20,
      inputRadius: 14,
      cardRadius: 24
    },
    typography: {
      fontFamily: '"Roboto", "Plus Jakarta Sans", -apple-system, sans-serif',
      h1Font: '"Roboto", sans-serif',
      fontWeightBold: 700,
      letterSpacing: '0em'
    },
    palette: {
      primary: {
        main: '#1A73E8', // Google Blue
        light: '#4285F4',
        dark: '#0D47A1',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#34A853', // Google Green
        light: '#5BB974',
        dark: '#1E8E3E',
        contrastText: '#FFFFFF'
      },
      background: {
        lightDefault: '#F0F4F9',
        lightPaper: '#FFFFFF',
        darkDefault: '#111318',
        darkPaper: '#1D2026'
      }
    },
    cardStyle: {
      backdropFilter: 'none',
      borderLight: '1px solid #E0E2EC',
      borderDark: '1px solid #33363F',
      boxShadowLight: '0 1px 3px 1px rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.1)',
      boxShadowDark: '0 4px 16px rgba(0, 0, 0, 0.35)'
    },
    buttonStyle: {
      textTransform: 'none',
      fontWeight: 700,
      background: '#1A73E8',
      boxShadow: 'none'
    },
    accentGlow: 'rgba(26, 115, 232, 0.22)'
  },
  {
    id: 'atelier',
    name: 'Aleen Atelier Haute Couture',
    company: 'Aleen Bespoke Studio',
    badge: 'Signature Luxury',
    tagline: 'Velvet Atelier Emerald, Burnished Imperial Gold, Cormorant Garamond serif headers, and bespoke luxury tailoring.',
    icon: '👑',
    shape: {
      borderRadius: 14,
      buttonRadius: 10,
      inputRadius: 10,
      cardRadius: 16
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
      h1Font: '"Cormorant Garamond", Georgia, serif',
      fontWeightBold: 800,
      letterSpacing: '-0.015em'
    },
    palette: {
      primary: {
        main: '#0A4D46', // Velvet Atelier Emerald
        light: '#14B8A6',
        dark: '#042F2E',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#C28D4B', // Burnished Imperial Gold
        light: '#F59E0B',
        dark: '#92400E',
        contrastText: '#FFFFFF'
      },
      background: {
        lightDefault: '#FBFBF9',
        lightPaper: '#FFFFFF',
        darkDefault: '#081212',
        darkPaper: '#0F1E1D'
      }
    },
    cardStyle: {
      backdropFilter: 'blur(16px)',
      borderLight: '1px solid rgba(10, 77, 70, 0.08)',
      borderDark: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadowLight: '0 1px 3px rgba(0,0,0,0.02), 0 10px 25px -5px rgba(0,0,0,0.03)',
      boxShadowDark: '0 4px 20px rgba(0, 0, 0, 0.4)'
    },
    buttonStyle: {
      textTransform: 'none',
      fontWeight: 700,
      background: 'linear-gradient(135deg, #14B8A6 0%, #0A4D46 100%)',
      boxShadow: '0 4px 14px rgba(10, 77, 70, 0.22)'
    },
    accentGlow: 'rgba(10, 77, 70, 0.22)'
  }
];

export const DEFAULT_DESIGN_SYSTEM = 'atelier';
