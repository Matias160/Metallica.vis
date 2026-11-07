// ShimmerButton: Botón de acción con haz de luz giratorio/destellante en el borde y respuesta táctil (React Bits)
import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ShimmerButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  disabled?: boolean;
  shimmerColor?: string;
  gradientColors?: [string, string];
  borderRadius?: number;
}

export const ShimmerButton: React.FC<ShimmerButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  icon,
  disabled = false,
  shimmerColor = '#FDE68A',
  gradientColors = ['#F59E0B', '#D97706'],
  borderRadius = 12
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
      tension: 150
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 120
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[styles.pressable, { borderRadius }]}
      >
        {/* Shimmer Border en Web */}
        {Platform.OS === 'web' && (
          <div
            style={{
              position: 'absolute',
              inset: '-1px',
              borderRadius: `${borderRadius + 1}px`,
              background: `linear-gradient(90deg, transparent 20%, ${shimmerColor} 50%, transparent 80%)`,
              backgroundSize: '200% 100%',
              animation: 'shinyTextSweep 2.5s ease-in-out infinite',
              opacity: 0.75,
              pointerEvents: 'none',
              zIndex: 0
            }}
          />
        )}

        {/* Superficie del botón */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderRadius }]}
        >
          {/* Brillo superior interno */}
          <View style={[styles.innerGlow, { borderRadius }]} />

          <View style={styles.contentRow}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[styles.text, textStyle]}>{title}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pressable: {
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 4px 18px rgba(245, 158, 11, 0.35)'
      }
    })
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  iconContainer: {
    marginRight: 8
  },
  text: {
    color: '#070A12',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  }
});
