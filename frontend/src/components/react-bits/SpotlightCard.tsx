// SpotlightCard: Tarjeta con foco de luz radial interactivo que sigue el cursor / toque (React Bits)
import React, { useRef, useState } from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp, Pressable } from 'react-native';

interface SpotlightCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  spotlightColor?: string; // Color del haz (ej: 'rgba(245, 158, 11, 0.18)')
  borderColor?: string;
  borderRadius?: number;
  onPress?: () => void;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  style,
  spotlightColor = 'rgba(245, 158, 11, 0.18)',
  borderColor = 'rgba(245, 158, 11, 0.25)',
  borderRadius = 16,
  onPress
}) => {
  const cardRef = useRef<View>(null);
  const [position, setPosition] = useState<{ x: number; y: number; opacity: number }>({
    x: 0,
    y: 0,
    opacity: 0
  });

  const handlePointerMove = (e: any) => {
    if (Platform.OS !== 'web') return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1
    });
  };

  const handlePointerLeave = () => {
    if (Platform.OS !== 'web') return;
    setPosition((prev) => ({ ...prev, opacity: 0 }));
  };

  const webEvents =
    Platform.OS === 'web'
      ? {
          onPointerMove: handlePointerMove,
          onPointerLeave: handlePointerLeave
        }
      : {};

  const content = (
    <View
      ref={cardRef}
      style={[
        styles.cardContainer,
        { borderRadius },
        style
      ]}
      {...(webEvents as any)}
    >
      {/* Capa de Spotlight reactiva */}
      {Platform.OS === 'web' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: `${borderRadius}px`,
            pointerEvents: 'none',
            opacity: position.opacity,
            transition: 'opacity 0.3s ease',
            background: `radial-gradient(420px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
            zIndex: 1
          }}
        />
      )}

      {/* Borde reactivo que brilla cerca del cursor en web */}
      {Platform.OS === 'web' && (
        <div
          style={{
            position: 'absolute',
            inset: '-1px',
            borderRadius: `${borderRadius + 1}px`,
            pointerEvents: 'none',
            opacity: position.opacity,
            transition: 'opacity 0.25s ease',
            background: `radial-gradient(300px circle at ${position.x}px ${position.y}px, ${borderColor}, transparent 70%)`,
            zIndex: 0
          }}
        />
      )}

      <View style={[styles.innerContent, { borderRadius }]}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={{ width: '100%' }}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0F1523',
    borderWidth: 1,
    borderColor: '#1E293B',
    // Sombra sutil
    ...Platform.select({
      web: {
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }
    })
  },
  innerContent: {
    position: 'relative',
    zIndex: 2,
    width: '100%'
  }
});
