// Badge: Etiquetas semánticas con pulso suave para sellos verificados y estados
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, ViewStyle } from 'react-native';
import { CheckCircle2, ShieldCheck, Sparkles, Award } from 'lucide-react-native';
import { darkPalette, themeTokens } from '../../theme/theme';

export type BadgeVariant = 'verified' | 'curator' | 'admin' | 'artist' | 'mint' | 'cyan' | 'amber' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  animatedPulse?: boolean;
  palette?: typeof darkPalette;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  animatedPulse = false,
  palette = darkPalette
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animatedPulse || variant === 'verified') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 900,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true
          })
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [animatedPulse, variant]);

  const getConfig = () => {
    switch (variant) {
      case 'verified':
        return {
          bg: palette.emeraldMuted,
          border: palette.emeraldBorder,
          text: palette.emerald,
          icon: <CheckCircle2 size={12} color={palette.emerald} />
        };
      case 'curator':
        return {
          bg: palette.purpleMuted,
          border: palette.purpleBorder,
          text: palette.purple,
          icon: <Sparkles size={12} color={palette.purple} />
        };
      case 'admin':
        return {
          bg: palette.roseMuted,
          border: palette.roseBorder,
          text: palette.rose,
          icon: <ShieldCheck size={12} color={palette.rose} />
        };
      case 'artist':
      case 'amber':
        return {
          bg: palette.amberMuted,
          border: palette.amberBorder,
          text: palette.amber,
          icon: <Award size={12} color={palette.amber} />
        };
      case 'cyan':
        return {
          bg: palette.cyanMuted,
          border: palette.cyanBorder,
          text: palette.cyan,
          icon: null
        };
      case 'mint':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: '#10B981',
          text: '#34D399',
          icon: null
        };
      default:
        return {
          bg: palette.cardElevated,
          border: palette.border,
          text: palette.textMuted,
          icon: null
        };
    }
  };

  const config = getConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }, style]}>
      {config.icon && (
        <Animated.View style={[{ marginRight: 4 }, (animatedPulse || variant === 'verified') && { transform: [{ scale: pulseAnim }] }]}>
          {config.icon}
        </Animated.View>
      )}
      <Text style={[styles.badgeText, { color: config.text }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: themeTokens.radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start'
  },
  badgeText: {
    fontFamily: themeTokens.typography.fontFamilies.body,
    fontSize: themeTokens.typography.sizes.micro,
    fontWeight: themeTokens.typography.weights.bold,
    letterSpacing: themeTokens.typography.letterSpacing.caps
  }
});
