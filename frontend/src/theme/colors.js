// Tokens visuales de alta fidelidad: Deep Titanium & Studio Amber Gold.
export const colors = {
  // Fondos y Superficies (Deep Obsidian / Midnight Titanium)
  background: '#090a0f',         // Negro ónix puro con matiz titanio
  backgroundElevated: '#0f121a', // Fondo superior / cabeceras con profundidad
  surface: '#141824',            // Superficie principal de tarjetas con textura de estudio
  surfaceLight: '#1c2233',       // Superficies elevadas, inputs interactivos y botones secundarios
  surfaceHover: '#252d42',       // Hover y estados presionados
  surfaceDark: '#0b0d14',        // Huecos, bandejas de casete y fondo de inputs
  surfaceGlass: 'rgba(20, 24, 36, 0.85)', // Efecto cristal oscuro

  // Bordes y Divisiones
  border: '#232b3e',             // Borde metálico sutil
  borderSubtle: '#181e2b',       // Separador discreto interior
  borderActive: '#f59e0b',       // Borde resaltado con acento ámbar
  borderCyan: '#00e5ff',         // Borde digital de linaje

  // Tipografía de Alta Fidelidad
  text: '#f8fafc',               // Blanco cristal de máxima legibilidad
  textSecondary: '#cbd5e1',      // Texto secundario platino
  muted: '#7e8ea6',              // Metadatos, etiquetas técnicas y pies
  mutedDark: '#4b556b',          // Placeholder y controles inactivos

  // Acentos Temáticos (Electric Studio Gold & Tape Amber)
  accent: '#f59e0b',             // Oro cálido / Ámbar de carrete de cinta máster
  accentHover: '#fbbf24',        // Resplandor dorado al presionar
  accentBright: '#ffd166',       // Resplandor de filamento / vúmetro analógico
  accentMuted: '#2d1f08',        // Fondo sutil con tinte ámbar
  accentBorder: '#784e0e',       // Borde de etiqueta ámbar

  // Acento Secundario (Neon Cyan / Linaje Digital)
  cyan: '#00e5ff',               // Cian eléctrico para linaje y verificaciones
  cyanHover: '#38bdf8',
  cyanMuted: '#062633',          // Fondo de linaje
  cyanBorder: '#0d5975',         // Borde de linaje

  // Estados y Calificaciones Físicas (Semántica de Desgaste)
  success: '#10b981',            // Verde esmeralda (Condición Mint / Nuevo 100%)
  successMuted: '#082a1d',       // Fondo de tag verificado / excelente
  successBorder: '#146345',      // Borde de tag verificado

  warning: '#f59e0b',            // Ámbar vintage (Desgaste medio 40%-79%)
  warningMuted: '#2b1c06',
  warningBorder: '#6d450b',

  danger: '#ff3b5c',             // Rojo rubí / corte magnético (<40% crítico)
  dangerHover: '#f43f5e',
  dangerMuted: '#330f16',        // Fondo de alerta
  dangerBorder: '#731e2d',       // Borde de alerta

  // Redes Sociales de Alta Gama
  google: '#ea4335',
  googleBg: '#2a1114',
  facebook: '#1877f2',
  facebookBg: '#0e2347',
  apple: '#f8fafc',
  appleBg: '#1e2538'
};

export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 6
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 10
  },
  glowAccent: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6
  },
  glowCyan: {
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6
  },
  glowSuccess: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5
  }
};
