export const colors = {
  // Fondos y Superficies
  background: '#09090b',       // Negro profundo analógico
  backgroundElevated: '#101014', // Fondo con elevación sutil
  surface: '#151518',          // Superficie principal de tarjetas
  surfaceLight: '#1f1f24',     // Superficie interactiva / inputs
  surfaceHover: '#282830',     // Estado activo / press
  surfaceDark: '#0d0d10',      // Huecos, ranuras de casete, tocadiscos

  // Bordes y Divisiones
  border: '#27272f',           // Borde sutil estándar
  borderSubtle: '#1d1d23',     // Separador discreto
  borderActive: '#d8ff3e',     // Borde resaltado con acento

  // Tipografía
  text: '#f4f4f6',             // Blanco cálido legible (alta jerarquía)
  textSecondary: '#c4c4cc',    // Texto intermedio de lectura
  muted: '#80808a',            // Metadatos, etiquetas y pies de tarjeta
  mutedDark: '#52525c',        // Placeholder y estados inactivos

  // Acentos Temáticos
  accent: '#d8ff3e',           // Amarillo ácido / verde neón tape-trading
  accentHover: '#c4eb32',      // Hover del botón principal
  accentMuted: '#242b10',      // Fondo tenue con acento
  accentBorder: '#556910',     // Borde intermedio con acento

  // Estados y Semántica
  success: '#4ade80',          // Verde verificado / disponible
  successMuted: '#102616',     // Fondo de tag de éxito
  successBorder: '#1c4d29',    // Borde de tag de éxito

  warning: '#facc15',          // Amarillo desgaste intermedio
  warningMuted: '#2b2308',     // Fondo de desgaste
  warningBorder: '#54460f',    // Borde de desgaste

  danger: '#fb7185',           // Rojo alerta / condición crítica / baja
  dangerHover: '#f43f5e',
  dangerMuted: '#2c1218',      // Fondo de alerta / botón eliminar
  dangerBorder: '#5c1f2b',     // Borde de peligro

  cyan: '#38bdf8',             // Azul de linaje / histórico
  cyanMuted: '#0e2436',
  cyanBorder: '#1b4566',

  // Redes Sociales
  google: '#ea4335',
  facebook: '#1877f2',
  apple: '#f4f4f6'
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4
  },
  glowAccent: {
    shadowColor: '#d8ff3e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5
  }
};
