// HolographicCard: Tarjeta de pasaporte / credencial con efecto foil holográfico e iridiscente (React Bits)
import React, { useState } from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';

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
  const [coords, setCoords] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false
  });

  const handlePointerMove = (e: any) => {
    if (Platform.OS !== 'web') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCoords({ x, y, active: true });
  };

  const handlePointerLeave = () => {
    if (Platform.OS !== 'web') return;
    setCoords((prev) => ({ ...prev, active: false }));
  };

  const webEvents =
    Platform.OS === 'web'
      ? {
          onPointerMove: handlePointerMove,
          onPointerLeave: handlePointerLeave
        }
      : {};

  return (
    <View
      style={[
        styles.container,
        { borderRadius },
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
            opacity: 0.08,
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
            opacity: coords.active ? 0.35 : 0.18,
            transition: 'opacity 0.3s ease',
            background: `radial-gradient(circle 350px at ${coords.x}% ${coords.y}%, rgba(255, 0, 128, 0.4), rgba(0, 229, 255, 0.4), rgba(245, 158, 11, 0.4), transparent 75%)`,
            mixBlendMode: 'screen',
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
            opacity: coords.active ? 0.25 : 0.1,
            transition: 'opacity 0.25s ease',
            background: `linear-gradient(${115 + (coords.x - 50) * 0.4}deg, transparent 20%, rgba(255, 255, 255, 0.35) 50%, transparent 80%)`,
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
