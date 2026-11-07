// Chip: Chips de filtro interactivos con animación de escala y acento ámbar
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { darkPalette, themeTokens } from '../../theme/theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  palette?: typeof darkPalette;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected,
  onPress,
  icon,
  style,
  palette = darkPalette
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

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? palette.amberMuted : palette.cardElevated,
            borderColor: selected ? palette.amber : palette.border
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
              color: selected ? palette.amber : palette.textMuted,
              fontWeight: selected
                ? themeTokens.typography.weights.bold
                : themeTokens.typography.weights.medium
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
    borderWidth: 1,
    marginRight: themeTokens.spacing.sm
  },
  iconContainer: {
    marginRight: 6
  },
  label: {
    fontFamily: themeTokens.typography.fontFamilies.body,
    fontSize: themeTokens.typography.sizes.bodySm,
    letterSpacing: 0.2
  }
});
