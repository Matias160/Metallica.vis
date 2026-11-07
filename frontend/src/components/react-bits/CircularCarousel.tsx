// CircularCarousel: Carrusel 3D radial / circular con rotación cilíndrica (React Bits)
// https://reactbits.dev/components/circular-carousel
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
  StyleProp,
  ViewStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

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

  const currentItem = items[currentIndex];

  // Radio y ángulo para visualización cilíndrica 3D
  const radius = isDesktop ? 320 : 200;

  return (
    <View style={[styles.container, style]}>
      {/* Contenedor del Cilindro 3D */}
      <View style={[styles.scene3D, { height: isDesktop ? 380 : 320 }]}>
        {items.map((item, index) => {
          // Distancia relativa al item actual
          let offset = index - currentIndex;
          if (offset > total / 2) offset -= total;
          if (offset < -total / 2) offset += total;

          const isCenter = offset === 0;
          const isNear = Math.abs(offset) <= 1;

          // Solo renderizamos los que están a la vista
          if (Math.abs(offset) > 2) return null;

          const angle = offset * (isDesktop ? 38 : 45);
          const scale = isCenter ? 1.08 : Math.max(0.75, 1 - Math.abs(offset) * 0.18);
          const opacity = isCenter ? 1 : Math.max(0.35, 1 - Math.abs(offset) * 0.4);
          const zIndex = 10 - Math.abs(offset);

          return (
            <Pressable
              key={item.id}
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
                  transform: [
                    { perspective: 1000 },
                    { translateX: offset * (isDesktop ? 180 : 120) },
                    { scale }
                  ]
                },
                Platform.OS === 'web' && {
                  transform: `perspective(1000px) rotateY(${angle}deg) translateZ(${radius}px) scale(${scale})`,
                  transition: 'all 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
                  cursor: isCenter ? 'default' : 'pointer'
                } as any
              ]}
            >
              <LinearGradient
                colors={
                  isCenter
                    ? ['rgba(245, 158, 11, 0.22)', 'rgba(17, 23, 38, 0.95)']
                    : ['rgba(30, 41, 59, 0.6)', 'rgba(10, 14, 23, 0.92)']
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
                <View style={styles.cardImageArea}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '12px'
                      }}
                    />
                  ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: palette.surfaceDark }]}>
                      <Text style={[styles.cassetteSpoolIcon, { color: palette.accent }]}>📼</Text>
                      <Text style={[styles.tapeNumber, { color: palette.muted }]}>
                        RELIC #{String(item.id).padStart(3, '0')}
                      </Text>
                    </View>
                  )}

                  {item.badge && (
                    <View style={[styles.cardBadge, { backgroundColor: palette.accent }]}>
                      <Text style={styles.cardBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>

                {/* Info de la pieza histórica */}
                <View style={styles.cardInfo}>
                  <Text numberOfLines={1} style={[styles.cardTitle, { color: palette.text }]}>
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
          style={[styles.navBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
        >
          <Text style={[styles.navBtnText, { color: palette.text }]}>←</Text>
        </Pressable>

        <View style={styles.dotsIndicator}>
          {items.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => setCurrentIndex(i)}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? palette.accent : palette.border,
                  width: i === currentIndex ? 24 : 8
                }
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
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
    marginVertical: 16
  },
  scene3D: {
    width: '100%',
    maxWidth: 900,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        perspective: '1200px',
        transformStyle: 'preserve-3d'
      }
    })
  },
  carouselCard: {
    position: 'absolute',
    width: 250,
    height: 310,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backfaceVisibility: 'hidden',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.65)'
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
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12
  },
  cassetteSpoolIcon: {
    fontSize: 42,
    marginBottom: 6
  },
  tapeNumber: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace'
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
    marginTop: 18
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
  dot: {
    height: 6,
    borderRadius: 3,
    transition: 'all 0.3s ease'
  } as any
});
