// Sistema de Diseño Unificado: Tape Trading Archive (Luxury Collector Archive & Analog Studio)
import { Platform } from 'react-native';

export const themeTokens = {
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    hero: 48
  },
  radii: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    full: 9999
  },
  typography: {
    fontFamilies: {
      display: Platform.select({
        ios: 'System',
        android: 'sans-serif-medium',
        default: 'Space Grotesk, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }),
      body: Platform.select({
        ios: 'System',
        android: 'sans-serif',
        default: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }),
      mono: Platform.select({
        ios: 'Courier New',
        android: 'monospace',
        default: '"JetBrains Mono", "SF Mono", Consolas, monospace'
      })
    },
    sizes: {
      h1: 30,
      h2: 24,
      h3: 20,
      subtitle: 16,
      body: 14.5,
      bodySm: 13,
      caption: 11,
      micro: 10
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      heavy: '800' as const
    },
    letterSpacing: {
      tight: -0.6,
      normal: 0,
      wide: 0.8,
      caps: 1.5
    }
  },
  durations: {
    fast: 120,
    normal: 220,
    slow: 380,
    staggerStep: 60
  },
  shadows: {
    amberGlow: {
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 6
    },
    cyanGlow: {
      shadowColor: '#00E5FF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6
    },
    purpleGlow: {
      shadowColor: '#A855F7',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6
    },
    surfaceDepth: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 18,
      elevation: 8
    }
  }
};

export const darkPalette = {
  mode: 'dark' as const,
  // 3 Niveles de Superficie
  background: '#06080D',          // Nivel 0: Casi negro profundo con tinte carbón
  backgroundSecondary: '#0B101D', // Degradado inferior azul noche
  card: '#111726',                // Nivel 1: Superficie base de tarjetas de archivo
  cardElevated: '#172036',        // Nivel 2: Tarjetas elevadas, inputs e interacciones
  cardHighlight: '#1F2B48',       // Nivel 3: Cards con hover o selección activa
  glass: 'rgba(17, 23, 38, 0.82)',// Vidrio ahumado con blur de estudio
  glassHeader: 'rgba(6, 8, 13, 0.88)',

  // Bordes con contraste y glow
  border: '#232E47',
  borderSubtle: '#182033',
  borderGlowAmber: 'rgba(245, 158, 11, 0.45)',
  borderGlowCyan: 'rgba(0, 229, 255, 0.4)',
  borderGlowPurple: 'rgba(168, 85, 247, 0.4)',

  // Tipografía con alto contraste (WCAG AA)
  text: '#FFFFFF',
  textSecondary: '#E2E8F0',
  textMuted: '#94A3B8',
  textDark: '#64748B',

  // Acentos temáticos
  amber: '#F59E0B',
  amberGradient: ['#FBBF24', '#D97706'] as [string, string],
  amberMuted: '#2D1F08',
  amberBorder: '#B45309',

  cyan: '#00E5FF',
  cyanGradient: ['#38BDF8', '#0284C7'] as [string, string],
  cyanMuted: '#062837',
  cyanBorder: '#0284C7',

  purple: '#A855F7',
  purpleGradient: ['#C084FC', '#7E22CE'] as [string, string],
  purpleMuted: '#28133E',
  purpleBorder: '#7E22CE',

  emerald: '#10B981',
  emeraldGradient: ['#34D399', '#059669'] as [string, string],
  emeraldMuted: '#062E20',
  emeraldBorder: '#059669',

  rose: '#EF4444',
  roseGradient: ['#F87171', '#DC2626'] as [string, string],
  roseMuted: '#381313',
  roseBorder: '#DC2626'
};

export const lightPalette = {
  mode: 'light' as const,
  // 3 Niveles de Superficie modo claro
  background: '#F8FAFC',
  backgroundSecondary: '#EEF2F6',
  card: '#FFFFFF',
  cardElevated: '#F1F5F9',
  cardHighlight: '#E2E8F0',
  glass: 'rgba(255, 255, 255, 0.88)',
  glassHeader: 'rgba(248, 250, 252, 0.92)',

  border: '#CBD5E1',
  borderSubtle: '#E2E8F0',
  borderGlowAmber: 'rgba(217, 119, 6, 0.35)',
  borderGlowCyan: 'rgba(2, 132, 199, 0.35)',
  borderGlowPurple: 'rgba(126, 34, 206, 0.35)',

  text: '#0F172A',
  textSecondary: '#1E293B',
  textMuted: '#475569',
  textDark: '#94A3B8',

  amber: '#D97706',
  amberGradient: ['#F59E0B', '#B45309'] as [string, string],
  amberMuted: '#FEF3C7',
  amberBorder: '#FCD34D',

  cyan: '#0284C7',
  cyanGradient: ['#0EA5E9', '#0369A1'] as [string, string],
  cyanMuted: '#E0F2FE',
  cyanBorder: '#BAE6FD',

  purple: '#7E22CE',
  purpleGradient: ['#9333EA', '#6B21A8'] as [string, string],
  purpleMuted: '#F3E8FF',
  purpleBorder: '#E9D5FF',

  emerald: '#059669',
  emeraldGradient: ['#10B981', '#047857'] as [string, string],
  emeraldMuted: '#DCFCE7',
  emeraldBorder: '#A7F3D0',

  rose: '#DC2626',
  roseGradient: ['#EF4444', '#B91C1C'] as [string, string],
  roseMuted: '#FEE2E2',
  roseBorder: '#FECACA'
};

export type ThemePalette = typeof darkPalette;
