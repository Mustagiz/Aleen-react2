// Full Ecosystem Design Systems for Aleen CRM
// Complete visual paradigms for Apple HIG, Microsoft Fluent, Zoho CRM, Linear, Salesforce, Stripe, Google Material 3, and Atelier Luxury.

export const DESIGN_SYSTEMS = [
  {
    id: 'zoho',
    name: 'Zoho CRM Enterprise',
    company: 'Zoho Corporation',
    badge: 'Navy Sidebar & Orange',
    tagline: 'Iconic Zoho deep navy sidebar with high-contrast orange action pills, structured 6px cards, and enterprise density.',
    icon: '💼',
    shape: {
      borderRadius: 9,
      buttonRadius: 8,
      inputRadius: 8,
      cardRadius: 12
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1Font: '"Inter", sans-serif',
      fontWeightBold: 700,
      letterSpacing: '0em'
    },
    palette: {
      primary: {
        main: '#F15A24', // Iconic Zoho Orange
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
        lightDefault: '#F0F2F5',
        lightPaper: '#FFFFFF',
        darkDefault: '#121620',
        darkPaper: '#1A202E'
      }
    },
    sidebar: {
      isDarkSidebar: true, // Zoho has an iconic dark navy sidebar in both light and dark mode
      lightBg: '#182033',  // Zoho Signature Deep Navy
      darkBg: '#0F1522',
      textColor: '#94A3B8',
      textActiveColor: '#FFFFFF',
      subheadColor: '#64748B',
      activePillBg: '#F15A24', // Bright Zoho Orange active pill
      activePillText: '#FFFFFF',
      borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    topBar: {
      style: 'clean',
      lightBg: '#FFFFFF',
      darkBg: '#1A202E',
      textColor: '#0F172A',
      borderColor: '#E2E8F0'
    },
    cardStyle: {
      backdropFilter: 'none',
      borderLight: '1px solid #E2E8F0',
      borderDark: '1px solid #283142',
      boxShadowLight: '0 1px 3px rgba(15, 23, 42, 0.08)',
      boxShadowDark: '0 4px 12px rgba(0, 0, 0, 0.3)'
    },
    buttonStyle: {
      textTransform: 'none',
      fontWeight: 700,
      background: 'linear-gradient(180deg, #F15A24 0%, #D4380D 100%)',
      boxShadow: '0 2px 8px rgba(241, 90, 36, 0.32)'
    },
    accentGlow: 'rgba(241, 90, 36, 0.25)'
  },
  {
    id: 'microsoft',
    name: 'Microsoft Fluent 365',
    company: 'Microsoft Design',
    badge: 'Cobalt Header Bar',
    tagline: 'Signature Microsoft 365 Cobalt Blue header bar, Mica neutral sidebar, Segoe UI typography, and 6px Fluent geometry.',
    icon: '🪟',
    shape: {
      borderRadius: 9,
      buttonRadius: 8,
      inputRadius: 8,
      cardRadius: 12
    },
    typography: {
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
      h1Font: '"Segoe UI Semibold", "Segoe UI", sans-serif',
      fontWeightBold: 600,
      letterSpacing: '-0.01em'
    },
    palette: {
      primary: {
        main: '#0078D4', // Microsoft Fluent Cobalt Blue
        light: '#2B88D8',
        dark: '#004E8C',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#107C41', // Microsoft Excel / Office Green
        light: '#27A862',
        dark: '#0B5A2E',
        contrastText: '#FFFFFF'
      },
      background: {
        lightDefault: '#F5F5F5',
        lightPaper: '#FFFFFF',
        darkDefault: '#202020',
        darkPaper: '#2B2B2B'
      }
    },
    sidebar: {
      isDarkSidebar: false,
      lightBg: '#F3F2F1', // Fluent Mica sidebar
      darkBg: '#252525',
      textColor: '#323130',
      textActiveColor: '#0078D4',
      subheadColor: '#605E5C',
      activePillBg: '#E1DFDD',
      activePillText: '#0078D4',
      borderColor: '#E1DFDD'
    },
    topBar: {
      style: 'colored', // Office 365 iconic colored banner
      lightBg: '#0078D4', // Microsoft Cobalt Header
      darkBg: '#106EBE',
      textColor: '#FFFFFF',
      borderColor: '#005A9E'
    },
    cardStyle: {
      backdropFilter: 'none',
      borderLight: '1px solid #E1DFDD',
      borderDark: '1px solid #3B3A39',
      boxShadowLight: '0 1.6px 3.6px 0 rgba(0,0,0,0.11), 0 0.3px 0.9px 0 rgba(0,0,0,0.08)',
      boxShadowDark: '0 4px 16px rgba(0, 0, 0, 0.4)'
    },
    buttonStyle: {
      textTransform: 'none',
      fontWeight: 600,
      background: '#0078D4',
      boxShadow: 'none'
    },
    accentGlow: 'rgba(0, 120, 212, 0.22)'
  },
  {
    id: 'apple',
    name: 'Apple macOS & iOS',
    company: 'Apple HIG',
    badge: 'Liquid Frosted Glass',
    tagline: 'Ultra-refined translucent frosted glass, SF Pro typography, 18px super-elliptical curves, and Apple Blue accents.',
    icon: '🍏',
    shape: {
      borderRadius: 10,
      buttonRadius: 9,
      inputRadius: 9,
      cardRadius: 14
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", sans-serif',
      h1Font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      fontWeightBold: 700,
      letterSpacing: '-0.022em'
    },
    palette: {
      primary: {
        main: '#0071E3', // Apple Blue
        light: '#479BFF',
        dark: '#0051A8',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#FF9500', // Apple Amber
        light: '#FFB340',
        dark: '#C97500',
        contrastText: '#FFFFFF'
      },
      background: {
        lightDefault: '#F5F5F7', // Apple Silver Alabaster
        lightPaper: '#FFFFFF',
        darkDefault: '#000000', // Pure Apple OLED Dark
        darkPaper: '#161618'
      }
    },
    sidebar: {
      isDarkSidebar: false,
      lightBg: 'rgba(242, 242, 247, 0.85)', // macOS Vibrancy Sidebar
      darkBg: '#1C1C1E',
      textColor: '#1D1D1F',
      textActiveColor: '#FFFFFF',
      subheadColor: '#86868B',
      activePillBg: '#0071E3', // Apple Blue selection pill
      activePillText: '#FFFFFF',
      borderColor: 'rgba(0, 0, 0, 0.08)'
    },
    topBar: {
      style: 'frosted',
      lightBg: 'rgba(255, 255, 255, 0.8)',
      darkBg: 'rgba(22, 22, 24, 0.8)',
      textColor: '#1D1D1F',
      borderColor: 'rgba(0, 0, 0, 0.08)'
    },
    cardStyle: {
      backdropFilter: 'blur(24px)',
      borderLight: '1px solid rgba(0, 0, 0, 0.06)',
      borderDark: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadowLight: '0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
      boxShadowDark: '0 8px 30px rgba(0, 0, 0, 0.5)'
    },
    buttonStyle: {
      textTransform: 'none',
      fontWeight: 600,
      background: 'linear-gradient(180deg, #0077ED 0%, #0066CC 100%)',
      boxShadow: '0 3px 12px rgba(0, 113, 227, 0.28)'
    },
    accentGlow: 'rgba(0, 113, 227, 0.22)'
  },
  {
    id: 'stripe',
    name: 'Stripe FinTech Pro',
    company: 'Stripe Design',
    badge: 'Midnight Navy & Blurple',
    tagline: 'Deep Midnight Navy sidebar with iconic Stripe Blurple (#635BFF) highlights, aqua metrics, and luxury SaaS crispness.',
    icon: '💳',
    shape: {
      borderRadius: 10,
      buttonRadius: 8,
      inputRadius: 8,
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
        main: '#635BFF', // Stripe Blurple
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
        darkDefault: '#0A2540',
        darkPaper: '#113255'
      }
    },
    sidebar: {
      isDarkSidebar: true, // Stripe iconic Navy Sidebar
      lightBg: '#0A2540',  // Deep Stripe Navy
      darkBg: '#071A2E',
      textColor: '#A1B0CB',
      textActiveColor: '#FFFFFF',
      subheadColor: '#637599',
      activePillBg: 'rgba(99, 91, 255, 0.25)',
      activePillText: '#FFFFFF',
      borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    topBar: {
      style: 'clean',
      lightBg: '#FFFFFF',
      darkBg: '#0D2D4D',
      textColor: '#0A2540',
      borderColor: '#E3E8EE'
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
      boxShadow: '0 3px 10px rgba(99, 91, 255, 0.35)'
    },
    accentGlow: 'rgba(99, 91, 255, 0.25)'
  },
  {
    id: 'linear',
    name: 'Linear & Notion Minimalist',
    company: 'Linear App',
    badge: 'Obsidian Dark & Violet',
    tagline: 'Precision obsidian surfaces, ultra-thin 1px borders, Electric Violet accents, and zero visual clutter.',
    icon: '⚡',
    shape: {
      borderRadius: 9,
      buttonRadius: 8,
      inputRadius: 8,
      cardRadius: 12
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
        main: '#22C55E', // Signal Green
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
    sidebar: {
      isDarkSidebar: true,
      lightBg: '#121316',
      darkBg: '#090A0C',
      textColor: '#8A8F98',
      textActiveColor: '#FFFFFF',
      subheadColor: '#565A61',
      activePillBg: 'rgba(94, 106, 210, 0.25)',
      activePillText: '#FFFFFF',
      borderColor: '#23252A'
    },
    topBar: {
      style: 'clean',
      lightBg: '#FFFFFF',
      darkBg: '#121316',
      textColor: '#0F172A',
      borderColor: '#23252A'
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
      boxShadow: '0 1px 6px rgba(94, 106, 210, 0.3)'
    },
    accentGlow: 'rgba(94, 106, 210, 0.25)'
  },
  {
    id: 'salesforce',
    name: 'Salesforce Lightning',
    company: 'Salesforce SLDS',
    badge: 'Einstein Blue Header',
    tagline: 'Classic Salesforce SLDS with Einstein Blue top bar, high-contrast badges, and enterprise cloud tables.',
    icon: '☁️',
    shape: {
      borderRadius: 9,
      buttonRadius: 8,
      inputRadius: 8,
      cardRadius: 12
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
    sidebar: {
      isDarkSidebar: false,
      lightBg: '#FFFFFF',
      darkBg: '#20242B',
      textColor: '#444444',
      textActiveColor: '#0176D3',
      subheadColor: '#706E6B',
      activePillBg: '#EBF4FD',
      activePillText: '#0176D3',
      borderColor: '#DDDBDA'
    },
    topBar: {
      style: 'colored',
      lightBg: '#0176D3', // Salesforce Blue Header
      darkBg: '#014486',
      textColor: '#FFFFFF',
      borderColor: '#014486'
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
    accentGlow: 'rgba(1, 118, 211, 0.22)'
  },
  {
    id: 'material',
    name: 'Google Material You (M3)',
    company: 'Google Material Design',
    badge: '24px Pill & Tonal Surfaces',
    tagline: 'Material 3 design language with 24px pill buttons, pastel container surfaces, and fluid touch ergonomics.',
    icon: '🎨',
    shape: {
      borderRadius: 10,
      buttonRadius: 9,
      inputRadius: 9,
      cardRadius: 14
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
    sidebar: {
      isDarkSidebar: false,
      lightBg: '#E9EEF6',
      darkBg: '#1E2129',
      textColor: '#444746',
      textActiveColor: '#001D35',
      subheadColor: '#747775',
      activePillBg: '#D3E3FD', // M3 Pill Container
      activePillText: '#041E49',
      borderColor: 'transparent'
    },
    topBar: {
      style: 'clean',
      lightBg: '#F0F4F9',
      darkBg: '#1D2026',
      textColor: '#1F1F1F',
      borderColor: '#E0E2EC'
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
    badge: 'Velvet Forest & Gold',
    tagline: 'Deep Royal Forest Velvet Emerald sidebar, Burnished Imperial Gold highlights, and Cormorant serif luxury.',
    icon: '👑',
    shape: {
      borderRadius: 10,
      buttonRadius: 9,
      inputRadius: 9,
      cardRadius: 14
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
    sidebar: {
      isDarkSidebar: true, // Atelier signature deep forest sidebar
      lightBg: '#042F2E',  // Deep Forest Velvet Emerald
      darkBg: '#031F1E',
      textColor: '#A7F3D0',
      textActiveColor: '#FFFFFF',
      subheadColor: '#C28D4B', // Imperial Gold subheaders
      activePillBg: 'rgba(20, 184, 166, 0.25)',
      activePillText: '#FFFFFF',
      borderColor: 'rgba(194, 141, 75, 0.2)'
    },
    topBar: {
      style: 'frosted',
      lightBg: 'rgba(255, 255, 255, 0.94)',
      darkBg: 'rgba(15, 30, 29, 0.94)',
      textColor: '#042F2E',
      borderColor: 'rgba(10, 77, 70, 0.12)'
    },
    cardStyle: {
      backdropFilter: 'blur(16px)',
      borderLight: '1px solid rgba(10, 77, 70, 0.1)',
      borderDark: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadowLight: '0 1px 3px rgba(0,0,0,0.02), 0 10px 25px -5px rgba(0,0,0,0.04)',
      boxShadowDark: '0 4px 20px rgba(0, 0, 0, 0.4)'
    },
    buttonStyle: {
      textTransform: 'none',
      fontWeight: 700,
      background: 'linear-gradient(135deg, #14B8A6 0%, #0A4D46 100%)',
      boxShadow: '0 4px 14px rgba(10, 77, 70, 0.25)'
    },
    accentGlow: 'rgba(10, 77, 70, 0.25)'
  }
];

export const DEFAULT_DESIGN_SYSTEM = 'atelier';
