// ShinyText: Texto con destello metálico continuo (efecto React Bits)
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TextStyle, View } from 'react-native';

interface ShinyTextProps {
  text: string;
  speed?: number; // en ms
  shimmerColor?: string;
  baseColor?: string;
  style?: TextStyle | TextStyle[];
  disabled?: boolean;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  speed = 2800,
  shimmerColor = '#FDE68A', // Oro ámbar claro brillante
  baseColor = '#F59E0B',
  style,
  disabled = false
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (disabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: speed,
          useNativeDriver: Platform.OS !== 'web'
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: speed,
          useNativeDriver: Platform.OS !== 'web'
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [disabled, speed]);

  const animatedColor = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [baseColor, shimmerColor, baseColor]
  });

  if (Platform.OS === 'web') {
    return (
      <Text
        style={[
          styles.text,
          { color: baseColor },
          style,
          // CSS Shimmer en navegadores web para máximo rendimiento a 120fps
          {
            backgroundImage: `linear-gradient(110deg, ${baseColor} 30%, ${shimmerColor} 50%, ${baseColor} 70%)`,
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: disabled ? 'none' : `shinyTextSweep ${speed}ms linear infinite`
          } as any
        ]}
      >
        {text}
      </Text>
    );
  }

  return (
    <Animated.Text style={[styles.text, style, { color: animatedColor }]}>
      {text}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: '700'
  }
});
