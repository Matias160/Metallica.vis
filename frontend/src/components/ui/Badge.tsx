// Badge: Etiquetas semánticas con pulso suave para sellos verificados y estados
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, ViewStyle } from 'react-native';
import { CheckCircle2, ShieldCheck, Sparkles, Award } from './Icons';
import { themeTokens } from '../../theme/theme';

export type BadgeVariant = 'verified' | 'curator' | 'admin' | 'artist' | 'mint' | 'cyan' | 'amber' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  animatedPulse?: boolean;
  palette?: any;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  animatedPulse = false,
  palette
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
          bg: palette?.successMuted || 'rgba(16, 185, 129, 0.16)',
          border: palette?.successBorder || 'rgba(16, 185, 129, 0.45)',
          text: palette?.success || '#10B981',
          icon: <CheckCircle2 size={12} color={palette?.success || '#10B981'} />
        };
      case 'curator':
        return {
          bg: palette?.purpleMuted || 'rgba(168, 85, 247, 0.16)',
          border: palette?.purpleBorder || 'rgba(168, 85, 247, 0.45)',
          text: palette?.purple || '#C084FC',
          icon: <Sparkles size={12} color={palette?.purple || '#C084FC'} />
        };
      case 'admin':
        return {
          bg: palette?.dangerMuted || 'rgba(239, 68, 68, 0.16)',
          border: palette?.dangerBorder || 'rgba(239, 68, 68, 0.45)',
          text: palette?.danger || '#F87171',
          icon: <ShieldCheck size={12} color={palette?.danger || '#F87171'} />
        };
      case 'artist':
      case 'amber':
        return {
          bg: palette?.accentMuted || 'rgba(245, 158, 11, 0.16)',
          border: palette?.accentBorder || 'rgba(245, 158, 11, 0.45)',
          text: palette?.accent || '#FBBF24',
          icon: <Award size={12} color={palette?.accent || '#FBBF24'} />
        };
      case 'cyan':
        return {
          bg: palette?.cyanMuted || 'rgba(0, 229, 255, 0.16)',
          border: palette?.cyanBorder || 'rgba(0, 229, 255, 0.45)',
          text: palette?.cyan || '#00E5FF',
          icon: null
        };
      case 'mint':
        return {
          bg: 'rgba(16, 185, 129, 0.16)',
          border: 'rgba(16, 185, 129, 0.45)',
          text: '#34D399',
          icon: null
        };
      default:
        return {
          bg: palette?.surfaceLight || '#182238',
          border: palette?.border || '#232E47',
          text: palette?.muted || '#CBD5E1',
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
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    borderRadius: themeTokens.radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start'
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8
  }
});
