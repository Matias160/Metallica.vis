// Chip: Chips de filtro interactivos con animación de escala y acento ámbar
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { themeTokens } from '../../theme/theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  palette?: any;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected,
  onPress,
  icon,
  style,
  palette
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: selected ? 1.04 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 180
    }).start();
  }, [selected]);

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  const accentColor = palette?.accent || palette?.amber || '#F59E0B';
  const bgColor = selected
    ? palette?.accentMuted || 'rgba(245, 158, 11, 0.18)'
    : palette?.surfaceLight || '#182238';
  const borderColor = selected
    ? accentColor
    : palette?.border || '#232E47';
  const textColor = selected
    ? accentColor
    : palette?.textSecondary || '#E2E8F0';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.chip,
          {
            backgroundColor: bgColor,
            borderColor: borderColor
          },
          selected && themeTokens.shadows.amberGlow,
          style
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text
          style={[
            styles.label,
            {
              color: textColor,
              fontWeight: selected ? '800' : '600'
            }
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: themeTokens.radii.full,
    borderWidth: 1.2,
    marginRight: 8
  },
  iconContainer: {
    marginRight: 6
  },
  label: {
    fontSize: 12.5,
    letterSpacing: 0.3
  }
});
