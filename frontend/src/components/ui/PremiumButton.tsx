// PremiumButton: Botón de acción con LinearGradient, brillo superior interior y spring feedback
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { darkPalette, themeTokens } from '../../theme/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'cyan' | 'purple' | 'danger' | 'ghost';

interface PremiumButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'sm' | 'md' | 'lg';
  palette?: any;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  style,
  textStyle,
  size = 'md',
  palette = darkPalette
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
      tension: 180
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 180
    }).start();
  };

  const getGradientColors = (): [string, string] => {
    if (disabled) return ['#334155', '#1E293B'];
    switch (variant) {
      case 'primary':
        return ['#FBBF24', '#D97706'];
      case 'cyan':
        return ['#38BDF8', '#0284C7'];
      case 'purple':
        return ['#C084FC', '#7E22CE'];
      case 'danger':
        return ['#F87171', '#DC2626'];
      case 'secondary':
        return [palette.cardElevated, palette.card];
      default:
        return ['transparent', 'transparent'];
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 12 };
      case 'lg':
        return { paddingVertical: 15, paddingHorizontal: 22 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 18 };
    }
  };

  const isGradient = ['primary', 'cyan', 'purple', 'danger', 'secondary'].includes(variant);

  const buttonInner = (
    <View style={[styles.innerRow, getPadding()]}>
      {/* Brillo interior superior para botones primarios */}
      {variant === 'primary' && !disabled && <View style={styles.topInnerShine} />}
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.textBase,
          size === 'sm' && styles.textSm,
          size === 'lg' && styles.textLg,
          variant === 'primary' && styles.textPrimary,
          variant === 'outline' && { color: palette.amber },
          variant === 'ghost' && { color: palette.textSecondary },
          disabled && styles.textDisabled,
          textStyle
        ]}
      >
        {children}
      </Text>
    </View>
  );

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, disabled && { opacity: 0.6 }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.container,
          variant === 'outline' && { borderColor: palette.amber, borderWidth: 1.2 },
          variant === 'ghost' && { backgroundColor: 'transparent' },
          style
        ]}
      >
        {isGradient ? (
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientWrapper, variant === 'primary' && themeTokens.shadows.amberGlow]}
          >
            {buttonInner}
          </LinearGradient>
        ) : (
          buttonInner
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: themeTokens.radii.md,
    overflow: 'hidden',
    alignSelf: 'flex-start'
  },
  gradientWrapper: {
    borderRadius: themeTokens.radii.md
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  topInnerShine: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)'
  },
  iconContainer: {
    marginRight: themeTokens.spacing.sm
  },
  textBase: {
    fontFamily: themeTokens.typography.fontFamilies.body,
    fontSize: themeTokens.typography.sizes.body,
    fontWeight: themeTokens.typography.weights.semibold,
    color: '#FFFFFF',
    textAlign: 'center'
  },
  textSm: {
    fontSize: themeTokens.typography.sizes.bodySm
  },
  textLg: {
    fontSize: themeTokens.typography.sizes.subtitle
  },
  textPrimary: {
    color: '#06080D',
    fontWeight: themeTokens.typography.weights.bold
  },
  textDisabled: {
    color: '#94A3B8'
  }
});
