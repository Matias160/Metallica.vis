// Estado global del tema con persistencia y paletas de alta fidelidad.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';

const ThemeContext = createContext(null);

const palettes = {
  dark: colors,
  light: {
    ...colors,
    background: '#f1f5f9',
    backgroundElevated: '#ffffff',
    surface: '#ffffff',
    surfaceLight: '#f8fafc',
    surfaceHover: '#e2e8f0',
    surfaceDark: '#edf2f7',
    surfaceGlass: 'rgba(255, 255, 255, 0.9)',
    border: '#cbd5e1',
    borderSubtle: '#e2e8f0',
    borderActive: '#d97706',
    borderCyan: '#0284c7',
    text: '#0f172a',
    textSecondary: '#334155',
    muted: '#64748b',
    mutedDark: '#94a3b8',
    accent: '#d97706',
    accentHover: '#b45309',
    accentBright: '#f59e0b',
    accentMuted: '#fef3c7',
    accentBorder: '#fde68a',
    cyan: '#0284c7',
    cyanMuted: '#e0f2fe',
    cyanBorder: '#bae6fd',
    successMuted: '#dcfce7',
    successBorder: '#bbf7d0',
    warningMuted: '#fef3c7',
    warningBorder: '#fde68a',
    dangerMuted: '#fee2e2',
    dangerBorder: '#fecaca'
  }
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark');

  useEffect(() => {
    AsyncStorage.getItem('metallica_theme').then((saved) => {
      if (saved === 'light' || saved === 'dark') setMode(saved);
    });
  }, []);

  const toggleTheme = async () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    await AsyncStorage.setItem('metallica_theme', next);
  };

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      palette: palettes[mode],
      toggleTheme
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
