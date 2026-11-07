// GlowCard: Tarjeta de archivo premium con borde glow, gradiente de profundidad y soporte hover/press
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { darkPalette, themeTokens } from '../../theme/theme';

interface GlowCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'surface' | 'elevated' | 'amberGlow' | 'cyanGlow' | 'purpleGlow';
  onPress?: () => void;
  palette?: any;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  style,
  variant = 'surface',
  onPress,
  palette = darkPalette
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
      tension: 140
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 140
    }).start();
  };

  const getBorderGradient = (): [string, string] => {
    switch (variant) {
      case 'amberGlow':
        return ['#FBBF24', '#B45309'];
      case 'cyanGlow':
        return ['#38BDF8', '#0284C7'];
      case 'purpleGlow':
        return ['#C084FC', '#7E22CE'];
      case 'elevated':
        return [palette.border, palette.borderSubtle];
      default:
        return [palette.border, 'rgba(255,255,255,0.03)'];
    }
  };

  const getGlowShadow = () => {
    switch (variant) {
      case 'amberGlow':
        return themeTokens.shadows.amberGlow;
      case 'cyanGlow':
        return themeTokens.shadows.cyanGlow;
      case 'purpleGlow':
        return themeTokens.shadows.purpleGlow;
      case 'elevated':
        return themeTokens.shadows.surfaceDepth;
      default:
        return {};
    }
  };

  const content = (
    <LinearGradient
      colors={getBorderGradient()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.borderWrapper, getGlowShadow()]}
    >
      <LinearGradient
        colors={
          variant === 'elevated'
            ? [palette.cardElevated, palette.card]
            : [palette.card, palette.backgroundSecondary]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.innerContent, style]}
      >
        {children}
      </LinearGradient>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.pressable}
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  pressable: {
    width: '100%'
  },
  borderWrapper: {
    padding: 1,
    borderRadius: themeTokens.radii.lg,
    overflow: 'hidden'
  },
  innerContent: {
    borderRadius: themeTokens.radii.lg - 1,
    padding: themeTokens.spacing.lg
  }
});
