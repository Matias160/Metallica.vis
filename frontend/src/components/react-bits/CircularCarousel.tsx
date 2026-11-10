// CircularCarousel: Carrusel 3D radial / circular con rotación cilíndrica (React Bits)
// https://reactbits.dev/components/circular-carousel
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
  StyleProp,
  ViewStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from './useReducedMotion';

interface CarouselItem {
  id: string | number;
  title: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  year?: string | number;
  data?: any;
}

interface CircularCarouselProps {
  items: CarouselItem[];
  onSelectItem?: (item: CarouselItem) => void;
  style?: StyleProp<ViewStyle>;
  palette: any;
}

export const CircularCarousel: React.FC<CircularCarouselProps> = ({
  items,
  onSelectItem,
  style,
  palette
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const total = items.length;
  if (total === 0) return null;

  const handlePrev = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  // Tres piezas visibles: la central nunca sale del alto reservado.
  const cardWidth = isDesktop ? 292 : Math.min(280, Math.max(220, width - 56));
  const cardHeight = isDesktop ? 326 : 308;
  const sideOffset = isDesktop ? 230 : Math.round(cardWidth * 0.72);

  return (
    <View style={[styles.container, style]}>
      {/* Escenario acotado para que las tapas no invadan el resto del museo. */}
      <View style={[
        styles.scene3D,
        { height: cardHeight + 24, borderColor: palette.borderSubtle }
      ]}>
        <LinearGradient
          colors={[palette.cardElevated, palette.backgroundSecondary]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {items.map((item, index) => {
          // Distancia relativa al item actual
          let offset = index - currentIndex;
          if (offset > total / 2) offset -= total;
          if (offset < -total / 2) offset += total;

          const isCenter = offset === 0;
          if (Math.abs(offset) > 1) return null;

          const angle = offset * -17;
          const scale = isCenter ? 1 : 0.8;
          const opacity = isCenter ? 1 : 0.72;
          const zIndex = isCenter ? 10 : 1;

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${isCenter ? 'ver pieza' : 'mostrar pieza'}`}
              onPress={() => {
                if (isCenter && onSelectItem) {
                  onSelectItem(item);
                } else {
                  setCurrentIndex(index);
                }
              }}
              style={[
                styles.carouselCard,
                {
                  zIndex,
                  opacity,
                  width: cardWidth,
                  height: cardHeight,
                  transform: [
                    { perspective: 1000 },
                    { translateX: -cardWidth / 2 + offset * sideOffset },
                    { translateY: -cardHeight / 2 },
                    { rotateY: `${angle}deg` },
                    { scale }
                  ]
                },
                Platform.OS === 'web' && {
                  cursor: 'pointer',
                  transition: reducedMotion ? 'none' : 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease',
                  boxShadow: isCenter
                    ? (palette.mode === 'light'
                        ? '0 14px 32px rgba(15, 23, 42, 0.14), 0 0 20px rgba(217, 119, 6, 0.18)'
                        : '0 18px 42px rgba(0, 0, 0, 0.48), 0 0 28px rgba(245, 158, 11, 0.12)')
                    : (palette.mode === 'light'
                        ? '0 6px 18px rgba(15, 23, 42, 0.08)'
                        : '0 10px 24px rgba(0, 0, 0, 0.3)')
                } as any
              ]}
            >
              <LinearGradient
                colors={
                  isCenter
                    ? [palette.amberMuted || 'rgba(245, 158, 11, 0.18)', palette.cardElevated || '#172036']
                    : [palette.surfaceLight || '#172036', palette.card || '#111726']
                }
                style={[
                  styles.cardGradient,
                  {
                    borderColor: isCenter ? palette.accent : palette.border,
                    borderWidth: isCenter ? 1.5 : 1
                  }
                ]}
              >
                {/* Portada o Ícono de Museo */}
                <View style={[styles.cardImageArea, { height: isDesktop ? 194 : 176 }]}>
                  <LinearGradient
                    colors={[palette.cardHighlight, palette.card]}
                    style={styles.imagePlaceholder}
                  >
                    <Text style={[styles.placeholderKicker, { color: palette.cyan }]}>ARCHIVO · BÓVEDA</Text>
                    <View style={styles.placeholderReels}>
                      <View style={[styles.placeholderReel, { borderColor: palette.amber }]} />
                      <View style={[styles.placeholderReel, { borderColor: palette.amber }]} />
                    </View>
                    <Text style={[styles.placeholderYear, { color: palette.textMuted }]}>{item.year || 'MÁSTER'}</Text>
                  </LinearGradient>
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      onLoad={() => setLoadedImages((previous) => ({ ...previous, [item.image!]: true }))}
                      style={[styles.coverImage, { opacity: loadedImages[item.image] ? 1 : 0 }]}
                      resizeMode="cover"
                    />
                  ) : null}

                  {item.badge && (
                    <View style={[styles.cardBadge, { backgroundColor: palette.accent }]}>
                      <Text style={styles.cardBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>

                {/* Info de la pieza histórica */}
                <View style={styles.cardInfo}>
                  <Text numberOfLines={2} style={[styles.cardTitle, { color: palette.text }]}>
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text numberOfLines={1} style={[styles.cardSubtitle, { color: palette.accent }]}>
                      {item.subtitle}
                    </Text>
                  )}
                  {item.year && (
                    <Text style={[styles.cardYear, { color: palette.muted }]}>
                      Año {item.year} · Vault Master
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>

      {/* Controles del Carrusel (Flechas e Indicador de Posición) */}
      <View style={styles.controlsRow}>
        <Pressable
          onPress={handlePrev}
          accessibilityRole="button"
          accessibilityLabel="Pieza anterior"
          style={[styles.navBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
        >
          <Text style={[styles.navBtnText, { color: palette.text }]}>←</Text>
        </Pressable>

        <View style={styles.dotsIndicator}>
          {items.length <= 9 ? items.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => setCurrentIndex(i)}
              accessibilityRole="button"
              accessibilityLabel={`Ir a pieza ${i + 1} de ${total}`}
              accessibilityState={{ selected: i === currentIndex }}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? palette.accent : palette.border,
                  width: i === currentIndex ? 24 : 8
                }
              ]}
            />
          )) : <Text style={[styles.counterText, { color: palette.textMuted || palette.text }]}>{currentIndex + 1} / {total}</Text>}
        </View>

        <Pressable
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel="Pieza siguiente"
          style={[styles.navBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
        >
          <Text style={[styles.navBtnText, { color: palette.text }]}>→</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16
  },
  scene3D: {
    width: '100%',
    maxWidth: 820,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 22,
    ...Platform.select({
      web: {
        perspective: '1200px'
      }
    })
  },
  carouselCard: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backfaceVisibility: 'hidden'
      }
    })
  },
  cardGradient: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    justifyContent: 'space-between'
  },
  cardImageArea: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  coverImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%'
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 12
  },
  placeholderKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4
  },
  placeholderReels: {
    flexDirection: 'row',
    gap: 28
  },
  placeholderReel: {
    width: 46,
    height: 46,
    borderWidth: 5,
    borderRadius: 23,
    opacity: 0.8
  },
  placeholderYear: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  cardBadgeText: {
    color: '#06080D',
    fontSize: 9,
    fontWeight: '800'
  },
  cardInfo: {
    marginTop: 10
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2
  },
  cardSubtitle: {
    fontSize: 12.5,
    fontWeight: '600'
  },
  cardYear: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'monospace'
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  navBtnText: {
    fontSize: 16,
    fontWeight: '800'
  },
  dotsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  counterText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700'
  },
  dot: {
    height: 6,
    borderRadius: 3,
    transition: 'all 0.3s ease'
  } as any
});
