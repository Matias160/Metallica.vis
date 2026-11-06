// Tokens visuales de alta fidelidad: Deep Studio Obsidian, Molten Gold & Neon Analog Glass.
export const colors = {
  // Fondos y Superficies (Deep Obsidian / Midnight Studio Titanium)
  background: '#07080d',         // Negro ónix profundo con tinte carbón
  backgroundElevated: '#0d101a', // Cabeceras y barras de estudio elevadas
  surface: '#121624',            // Superficie principal de consolas y tarjetas
  surfaceLight: '#1b2236',       // Elevaciones, inputs y botones secundarios interactivos
  surfaceHover: '#26304d',       // Estados táctiles activos / hover
  surfaceDark: '#090c14',        // Compartimentos de cassette, bandejas y vúmetros
  surfaceGlass: 'rgba(18, 22, 36, 0.85)', // Vidrio ahumado de estudio
  surfaceGlassElevated: 'rgba(27, 34, 54, 0.92)',

  // Bordes Metálicos y Divisiones Analógicas
  border: '#232b40',             // Borde metálico sutil
  borderSubtle: '#171d2c',       // Separador interno discreto
  borderActive: '#f59e0b',       // Borde activo ámbar maestro
  borderGoldGlow: 'rgba(245, 158, 11, 0.45)',
  borderCyan: '#00e5ff',         // Borde digital de linaje de cinta
  borderCyanGlow: 'rgba(0, 229, 255, 0.4)',

  // Tipografía de Alta Fidelidad
  text: '#ffffff',               // Blanco puro de alto contraste para pantallas móviles OLED
  textSecondary: '#cbd5e1',      // Platino legible para metadatos
  muted: '#8493ad',              // Etiquetas técnicas, chips y pies
  mutedDark: '#4b5773',          // Placeholders y controles pasivos

  // Acentos Temáticos (Molten Studio Gold & Master Tape Amber)
  accent: '#f59e0b',             // Oro ámbar cálido de carrete de cinta
  accentHover: '#fbbf24',        // Resplandor dorado al presionar en celular
  accentBright: '#ffd166',       // Vúmetro analógico y filamento incandescente
  accentMuted: '#2d1e08',        // Fondo sutil con tinte ámbar
  accentBorder: '#8c590e',       // Borde de etiqueta máster
  accentGlow: 'rgba(245, 158, 11, 0.35)',

  // Acento Secundario (Neon Electric Cyan & Linaje Criptográfico)
  cyan: '#00e5ff',               // Cian eléctrico para códigos QR y linaje
  cyanHover: '#38bdf8',
  cyanBright: '#70f0ff',
  cyanMuted: '#062633',          // Fondo de linaje
  cyanBorder: '#0d5975',         // Borde de linaje
  cyanGlow: 'rgba(0, 229, 255, 0.35)',

  // Acento Terciario (Studio Purple & Vinilo Especial)
  purple: '#a855f7',
  purpleBright: '#c084fc',
  purpleMuted: '#2a1140',
  purpleBorder: '#6b21a8',
  purpleGlow: 'rgba(168, 85, 247, 0.35)',

  // Estados y Calificaciones Físicas (Semántica de Desgaste Magnético)
  success: '#10b981',            // Verde esmeralda (Condición Mint 100%)
  successMuted: '#072b1c',
  successBorder: '#146345',
  successGlow: 'rgba(16, 185, 129, 0.35)',

  warning: '#f59e0b',            // Ámbar vintage (Desgaste medio 40%-79%)
  warningMuted: '#2b1c06',
  warningBorder: '#6d450b',

  danger: '#ff2e54',             // Rojo rubí / corte magnético (<40% crítico)
  dangerHover: '#f43f5e',
  dangerMuted: '#380f18',
  dangerBorder: '#781f2f',
  dangerGlow: 'rgba(255, 46, 84, 0.35)',

  // Redes Sociales de Alta Gama
  google: '#ea4335',
  googleBg: '#2a1114',
  spotify: '#1db954',
  spotifyBg: '#082518',
  github: '#f8fafc',
  githubBg: '#1e232a',
  facebook: '#1877f2',
  facebookBg: '#0e2347',
  apple: '#f8fafc',
  appleBg: '#1e2538'
} as const;

export type Colors = typeof colors;

export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 14
  },
  glowAccent: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8
  },
  glowAccentHeavy: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 26,
    elevation: 14
  },
  glowCyan: {
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8
  },
  glowPurple: {
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8
  },
  glowSuccess: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6
  },
  glowDanger: {
    shadowColor: '#ff2e54',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8
  }
} as const;

export type Shadows = typeof shadows;
