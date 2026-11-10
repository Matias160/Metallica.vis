// DepthCarousel: Carrusel con profundidad en el eje Z (React Bits)
// https://reactbits.dev/components/depth-carousel
import React, { useState } from 'react';
import {
  View,
  Text,
  useWindowDimensions,
  StyleSheet,
  Pressable,
  Platform,
  StyleProp,
  ViewStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from './useReducedMotion';

interface DepthItem {
  id: string | number;
  title: string;
  artist?: string;
  genre?: string;
  duration?: string;
  status?: string;
  cover?: string;
}

interface DepthCarouselProps {
  items: DepthItem[];
  onSelect?: (item: DepthItem) => void;
  style?: StyleProp<ViewStyle>;
  palette: any;
}

export const DepthCarousel: React.FC<DepthCarouselProps> = ({
  items,
  onSelect,
  style,
  palette
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  if (!items || items.length === 0) return null;

  const handleNext = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 768;
  const cardWidth = Math.min(windowWidth - 36, 480);
  const cardHeight = isDesktop ? 190 : 172;
  const current = items[activeIndex];

  return (
    <View style={[styles.container, style]}>
      {/* Pila de Tarjetas con Profundidad Z */}
      <View style={styles.stackArea}>
        {items.map((item, index) => {
          let diff = index - activeIndex;
          if (diff < 0) diff += items.length;

          // Solo mostramos las 3 primeras tarjetas en profundidad
          if (diff > 2) return null;

          const translateY = diff * -18;
          const scale = 1 - diff * 0.08;
          const opacity = 1 - diff * 0.25;
          const zIndex = 10 - diff;

          const isFront = diff === 0;

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${isFront ? 'configurar tirada' : 'mostrar pista'}`}
              onPress={() => {
                if (isFront && onSelect) {
                  onSelect(item);
                } else {
                  setActiveIndex(index);
                }
              }}
              style={[
                styles.depthCard,
                {
                  zIndex,
                  opacity,
                  width: cardWidth,
                  height: cardHeight,
                  transform: [
                    { perspective: 1000 },
                    { translateY: translateY },
                    { scale }
                  ]
                },
                Platform.OS === 'web' && {
                  cursor: isFront ? 'default' : 'pointer',
                  transition: reducedMotion ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                  filter: diff > 0 ? `brightness(${0.88 - diff * 0.12})` : 'none',
                  boxShadow: isFront
                    ? (palette.mode === 'light'
                        ? '0 16px 36px rgba(15, 23, 42, 0.14), 0 0 20px rgba(217, 119, 6, 0.18)'
                        : '0 20px 48px rgba(0, 0, 0, 0.75), 0 0 24px rgba(245, 158, 11, 0.14)')
                    : (palette.mode === 'light'
                        ? '0 8px 20px rgba(15, 23, 42, 0.08)'
                        : '0 10px 24px rgba(0, 0, 0, 0.4)')
                } as any
              ]}
            >
              <LinearGradient
                colors={
                  isFront
                    ? [palette.amberMuted || 'rgba(245, 158, 11, 0.16)', palette.cardElevated || '#172036']
                    : [palette.surfaceLight || '#172036', palette.card || '#111726']
                }
                style={[
                  styles.cardInner,
                  {
                    borderColor: isFront ? palette.accent : palette.border,
                    borderWidth: isFront ? 1.5 : 1
                  }
                ]}
              >
                {/* Cabecera de la pista en el estudio */}
                <View style={styles.cardTopRow}>
                  <View style={styles.tapeBadge}>
                    <Text style={styles.tapeBadgeText}>ESTUDIO MÁSTER</Text>
                  </View>
                  <Text style={[styles.tapeId, { color: palette.muted }]}>
                    TRK-{String(item.id).padStart(3, '0')}
                  </Text>
                </View>

                {/* Título y artista */}
                <View style={styles.cardCenter}>
                  <Text numberOfLines={1} style={[styles.itemTitle, { color: palette.text }]}>
                    {item.title}
                  </Text>
                  {item.artist && (
                    <Text numberOfLines={1} style={[styles.itemArtist, { color: palette.accent }]}>
                      {item.artist}
                    </Text>
                  )}
                  {item.genre && (
                    <Text style={[styles.itemGenre, { color: palette.muted }]}>
                      Linaje: {item.genre}
                    </Text>
                  )}
                </View>

                {/* Footer de consola */}
                <View style={[styles.cardBottomRow, { borderTopColor: palette.borderSubtle }]}>
                  <Text style={[styles.statusTag, { color: palette.emerald || '#10B981' }]}>
                    ● LISTO PARA PRENSAR
                  </Text>
                  {isFront && (
                    <Text style={[styles.clickHint, { color: palette.cyan }]}>
                      Configurar Tirada →
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>

      {/* Botones de navegación de consola */}
      <View style={styles.footerControls}>
        <Pressable
          onPress={handlePrev}
          accessibilityRole="button"
          accessibilityLabel="Pista anterior"
          style={[styles.ctrlBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
        >
          <Text style={[styles.ctrlBtnText, { color: palette.text }]}>ANTERIOR</Text>
        </Pressable>

        <Text style={[styles.counterText, { color: palette.muted }]}>
          {activeIndex + 1} / {items.length}
        </Text>

        <Pressable
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel="Pista siguiente"
          style={[styles.ctrlBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
        >
          <Text style={[styles.ctrlBtnText, { color: palette.text }]}>SIGUIENTE</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12
  },
  stackArea: {
    width: '100%',
    maxWidth: 580,
    height: 240,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }
    })
  },
  depthCard: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.7)'
      }
    })
  },
  cardInner: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    justifyContent: 'space-between'
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tapeBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  tapeBadgeText: {
    color: '#06080D',
    fontSize: 9,
    fontWeight: '800'
  },
  tapeId: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700'
  },
  cardCenter: {
    marginVertical: 6
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3
  },
  itemArtist: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2
  },
  itemGenre: {
    fontSize: 11.5,
    marginTop: 4
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10
  },
  statusTag: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  clickHint: {
    fontSize: 11.5,
    fontWeight: '700'
  },
  footerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 18
  },
  ctrlBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1
  },
  ctrlBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  counterText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700'
  }
});
