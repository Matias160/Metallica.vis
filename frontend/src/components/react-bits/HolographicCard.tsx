// HolographicCard: Tarjeta de pasaporte / credencial con efecto foil holográfico e iridiscente (React Bits)
import React, { useState } from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface HolographicCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

export const HolographicCard: React.FC<HolographicCardProps> = ({
  children,
  style,
  borderRadius = 20
}) => {
  const { palette, isDark } = useTheme();
  const [active, setActive] = useState(false);

  const handlePointerMove = (e: any) => {
    if (Platform.OS !== 'web') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty('--foil-x', `${x}%`);
    e.currentTarget.style.setProperty('--foil-y', `${y}%`);
    e.currentTarget.style.setProperty('--foil-angle', `${115 + (x - 50) * 0.4}deg`);
  };

  const handlePointerLeave = () => {
    if (Platform.OS !== 'web') return;
    setActive(false);
  };

  const webEvents =
    Platform.OS === 'web'
      ? {
          onPointerEnter: () => setActive(true),
          onPointerMove: handlePointerMove,
          onPointerLeave: handlePointerLeave
        }
      : {};

  return (
    <View
      style={[
        styles.container,
        { borderRadius, backgroundColor: palette.card, borderColor: palette.borderGlowAmber },
        style
      ]}
      {...(webEvents as any)}
    >
      {/* Patrón Guilloche / Líneas finas de seguridad */}
      {Platform.OS === 'web' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: `${borderRadius}px`,
            opacity: isDark ? 0.08 : 0.06,
            backgroundImage: `repeating-linear-gradient(45deg, #FFF 0, #FFF 1px, transparent 0, transparent 8px), repeating-linear-gradient(-45deg, #F59E0B 0, #F59E0B 1px, transparent 0, transparent 8px)`,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      )}

      {/* Capa de foil holográfico iridiscente reactivo */}
      {Platform.OS === 'web' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: `${borderRadius}px`,
            opacity: active ? (isDark ? 0.35 : 0.18) : (isDark ? 0.18 : 0.08),
            transition: 'opacity 0.3s ease',
            background: 'radial-gradient(circle 350px at var(--foil-x, 50%) var(--foil-y, 50%), rgba(255, 0, 128, 0.4), rgba(0, 229, 255, 0.4), rgba(245, 158, 11, 0.4), transparent 75%)',
            mixBlendMode: isDark ? 'screen' : 'multiply',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />
      )}

      {/* Brillo reflectante de superficie */}
      {Platform.OS === 'web' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: `${borderRadius}px`,
            opacity: active ? 0.25 : 0.1,
            transition: 'opacity 0.25s ease',
            background: 'linear-gradient(var(--foil-angle, 115deg), transparent 20%, rgba(255, 255, 255, 0.35) 50%, transparent 80%)',
            pointerEvents: 'none',
            zIndex: 3
          }}
        />
      )}

      <View style={[styles.innerContent, { borderRadius }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0D1322',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    ...Platform.select({
      web: {
        boxShadow: '0 12px 35px -8px rgba(0, 0, 0, 0.7), 0 0 20px rgba(245, 158, 11, 0.15)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease'
      }
    })
  },
  innerContent: {
    position: 'relative',
    zIndex: 4,
    width: '100%'
  }
});
