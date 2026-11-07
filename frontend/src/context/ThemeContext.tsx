// Estado global del tema con persistencia y paletas de alta fidelidad unificadas.
import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkPalette as baseDark, lightPalette as baseLight, ThemePalette as BaseThemePalette } from '../theme/theme';

export type ThemeMode = 'dark' | 'light';

export type ThemePalette = Omit<BaseThemePalette, 'mode'> & {
  mode: ThemeMode;
  surface: string;
  surfaceLight: string;
  surfaceHover: string;
  surfaceDark: string;
  surfaceGlass: string;
  backgroundElevated: string;
  borderActive: string;
  muted: string;
  mutedDark: string;
  accent: string;
  accentHover: string;
  accentBright: string;
  accentMuted: string;
  accentBorder: string;
  cyanHover: string;
  cyanBright: string;
  success: string;
  successMuted: string;
  successBorder: string;
  warning: string;
  warningMuted: string;
  warningBorder: string;
  danger: string;
  dangerMuted: string;
  dangerBorder: string;
};

const darkThemePalette: ThemePalette = {
  ...baseDark,
  surface: baseDark.card,
  surfaceLight: baseDark.cardElevated,
  surfaceHover: baseDark.cardHighlight,
  surfaceDark: baseDark.backgroundSecondary,
  surfaceGlass: baseDark.glass,
  backgroundElevated: baseDark.cardElevated,
  borderActive: baseDark.amber,
  muted: baseDark.textMuted,
  mutedDark: baseDark.textDark,
  accent: baseDark.amber,
  accentHover: '#FBBF24',
  accentBright: '#FCD34D',
  accentMuted: 'rgba(245, 158, 11, 0.16)',
  accentBorder: 'rgba(245, 158, 11, 0.45)',
  cyanHover: '#38BDF8',
  cyanBright: '#70F0FF',
  success: baseDark.emerald,
  successMuted: 'rgba(16, 185, 129, 0.16)',
  successBorder: 'rgba(16, 185, 129, 0.45)',
  warning: baseDark.amber,
  warningMuted: 'rgba(245, 158, 11, 0.16)',
  warningBorder: 'rgba(245, 158, 11, 0.45)',
  danger: baseDark.rose,
  dangerMuted: 'rgba(239, 68, 68, 0.16)',
  dangerBorder: 'rgba(239, 68, 68, 0.45)',
};

const lightThemePalette: ThemePalette = {
  ...baseLight,
  surface: baseLight.card,
  surfaceLight: baseLight.cardElevated,
  surfaceHover: baseLight.cardHighlight,
  surfaceDark: baseLight.backgroundSecondary,
  surfaceGlass: baseLight.glass,
  backgroundElevated: baseLight.cardElevated,
  borderActive: baseLight.amber,
  muted: baseLight.textMuted,
  mutedDark: baseLight.textDark,
  accent: baseLight.amber,
  accentHover: '#F59E0B',
  accentBright: '#FBBF24',
  accentMuted: '#FEF3C7',
  accentBorder: '#FCD34D',
  cyanHover: '#0284C7',
  cyanBright: '#38BDF8',
  success: baseLight.emerald,
  successMuted: '#DCFCE7',
  successBorder: '#A7F3D0',
  warning: baseLight.amber,
  warningMuted: '#FEF3C7',
  warningBorder: '#FCD34D',
  danger: baseLight.rose,
  dangerMuted: '#FEE2E2',
  dangerBorder: '#FECACA',
};

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  success: string;
  warning: string;
  danger: string;
  gold: string;
  bronze: string;
  silver: string;
  rarityOriginal: string;
  raritySafety: string;
  rarityDuplicate: string;
  rarityReference: string;
}

interface ThemeContextType {
  mode: ThemeMode;
  palette: ThemePalette;
  colors: ThemeColors;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const STORAGE_KEY = '@tape_theme_mode_v2';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') {
          setModeState(saved);
        }
      } catch (err) {
        console.warn('Error loading theme:', err);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode).catch(() => {});
  };

  const toggleTheme = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  const palette = useMemo(() => {
    return mode === 'dark' ? darkThemePalette : lightThemePalette;
  }, [mode]);

  const colors = useMemo<ThemeColors>(() => {
    return {
      primary: palette.accent,
      primaryLight: palette.accentHover,
      primaryDark: palette.amberBorder,
      accent: palette.cyan,
      accentLight: palette.cyanBright,
      accentDark: palette.cyanBorder,
      background: palette.background,
      surface: palette.surface,
      surfaceElevated: palette.surfaceLight,
      card: palette.card,
      text: palette.text,
      textSecondary: palette.textSecondary,
      textMuted: palette.textMuted,
      border: palette.border,
      borderLight: palette.borderSubtle,
      success: palette.success,
      warning: palette.warning,
      danger: palette.danger,
      gold: '#F59E0B',
      bronze: '#B45309',
      silver: '#94A3B8',
      rarityOriginal: '#F59E0B',
      raritySafety: '#00E5FF',
      rarityDuplicate: '#A855F7',
      rarityReference: '#10B981'
    };
  }, [palette]);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        palette,
        colors,
        toggleTheme,
        setMode,
        isDark: mode === 'dark'
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
