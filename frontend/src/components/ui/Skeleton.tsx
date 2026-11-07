// Skeleton: Placeholders de carga animados con pulso de opacidad tipo shimmer
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ViewStyle } from 'react-native';
import { darkPalette, themeTokens } from '../../theme/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  palette?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = themeTokens.radii.sm,
  style,
  palette = darkPalette
}) => {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true
        })
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: palette.cardElevated,
          opacity: opacityAnim
        },
        style
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden'
  }
});
