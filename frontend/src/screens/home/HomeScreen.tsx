// Catálogo oficial: exploración de pistas masterizadas, tiradas físicas, escáner QR y modo día/noche en TypeScript.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Search,
  X,
  Maximize2,
  Sun,
  Moon,
  Clock,
  ArrowDownAZ,
  ArrowUpZA,
  Calendar,
  Sparkles,
  Archive,
  Disc3,
  ArrowUp,
  Radio,
  SlidersHorizontal
} from '../../components/ui/Icons';

import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useSync } from '../../context/SyncContext';
import { useTheme } from '../../context/ThemeContext';
import QrScannerModal from '../../components/QrScannerModal';
import { themeTokens } from '../../theme/theme';
import { GlowCard } from '../../components/ui/GlowCard';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { Badge } from '../../components/ui/Badge';
import { Chip } from '../../components/ui/Chip';
import { Skeleton } from '../../components/ui/Skeleton';
import { Track } from '../../types';
import { ShinyText, SpotlightCard, DecryptedText, ShimmerButton } from '../../components/react-bits';

// Componente de Barra de Stock Animada con LinearGradient
function AnimatedStockBar({
  percentage,
  isSoldOut,
  palette
}: {
  percentage: number;
  isSoldOut: boolean;
  palette: any;
}) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.max(0, Math.min(percentage, 100)),
      duration: 800,
      useNativeDriver: false
    }).start();
  }, [percentage]);

  return (
    <View style={[styles.stockBarTrack, { backgroundColor: palette?.surfaceDark || '#0A0E17' }]}>
      <Animated.View
        style={{
          height: '100%',
          width: widthAnim.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%']
          }),
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        <LinearGradient
          colors={
            isSoldOut
              ? ['#EF4444', '#991B1B']
              : percentage > 35
              ? ['#FBBF24', '#D97706']
              : ['#F59E0B', '#B45309']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// Skeleton Loader para el Catálogo
function CatalogSkeletonList({ palette }: { palette: any }) {
  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((key) => (
        <View
          key={key}
          style={[
            styles.card,
            { backgroundColor: palette?.surface || '#111728', borderColor: palette?.border || '#232E47' }
          ]}
        >
          <View style={styles.cardHeader}>
            <Skeleton width={96} height={96} borderRadius={12} palette={palette} />
            <View style={{ flex: 1, marginLeft: 16, gap: 10 }}>
              <Skeleton width="60%" height={22} borderRadius={6} palette={palette} />
              <Skeleton width="40%" height={16} borderRadius={4} palette={palette} />
              <Skeleton width="30%" height={14} borderRadius={4} palette={palette} />
            </View>
          </View>
          <View style={{ marginTop: 18, gap: 10 }}>
            <Skeleton width="100%" height={14} borderRadius={4} palette={palette} />
          </View>
          <View style={{ marginTop: 16 }}>
            <Skeleton width="100%" height={44} borderRadius={10} palette={palette} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen({ navigation }: { navigation: any }): React.JSX.Element {
  const { token } = useAuth();
  const { palette, isDark, toggleTheme } = useTheme();
  const { notify } = useFeedback();
  const { syncVersion, triggerSync } = useSync();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 800;

  const [tracks, setTracks] = useState<Track[]>([]);
  const [pressings, setPressings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'az' | 'za' | 'oldest'>('recent');
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const listRef = useRef<FlatList>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent?.contentOffset?.y || 0;
    setShowScrollTop(offsetY > 260);
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const loadData = useCallback(async () => {
    try {
      const [tracksData, pressingsData] = await Promise.all([
        apiRequest('/tracks', { token }),
        apiRequest('/pressings', { token })
      ]);
      setTracks(tracksData.tracks || []);
      setPressings(pressingsData.pressings || []);
    } catch (err) {
      console.warn('Error cargando catálogo:', err);
    }
  }, [token]);

  // Actualización automática al recibir foco en la pestaña
  useFocusEffect(
    useCallback(() => {
      loadData().finally(() => setLoading(false));
    }, [loadData, syncVersion])
  );

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData, syncVersion]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleClaim(pressing: any, trackTitle: string) {
    if (!pressing || !pressing.id) {
      notify('Tirada no disponible', 'Esta pista no tiene una tirada física activa configurada.', 'warning');
      return;
    }
    if (!token) {
      notify('Inicio de sesión requerido', 'Iniciá sesión para adquirir y guardar cintas físicas en tu colección.', 'warning');
      return;
    }
    try {
      setClaimingId(pressing.id);
      const res = await apiRequest('/copies/claim', {
        method: 'POST',
        token,
        body: { pressingId: Number(pressing.id) }
      });
      notify(
        'Cinta física adquirida',
        `La copia #${res.copyNumber} de “${trackTitle}” se guardó en tu vitrina con condición 100% (Mint).`,
        'success'
      );
      await loadData();
      triggerSync('tape_claimed_from_home');
    } catch (error: any) {
      notify('No se pudo adquirir la copia', error.message, 'error');
    } finally {
      setClaimingId(null);
    }
  }

  const filteredTracks = useMemo(() => {
    const list = tracks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.artist_name && t.artist_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterType === 'featured') {
        return Boolean(t.is_featured);
      }

      const trackPressing = pressings.find((p) => p.track_id === t.id);
      if (filterType === 'available') {
        return trackPressing && trackPressing.available_copies > 0;
      }
      if (filterType === 'verified') {
        return Boolean(t.verified);
      }
      return true;
    });

    // Ordenamiento por Tiempo y de A a la Z
    return list.sort((a, b) => {
      if (sortBy === 'az') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'za') {
        return b.title.localeCompare(a.title);
      }
      if (sortBy === 'oldest') {
        const timeA = new Date((a as any).created_at || (a as any).createdAt || 0).getTime() || a.id;
        const timeB = new Date((b as any).created_at || (b as any).createdAt || 0).getTime() || b.id;
        return timeA - timeB;
      }
      // 'recent' (más reciente primero)
      const timeA = new Date((a as any).created_at || (a as any).createdAt || 0).getTime() || a.id;
      const timeB = new Date((b as any).created_at || (b as any).createdAt || 0).getTime() || b.id;
      return timeB - timeA;
    });
  }, [tracks, pressings, searchQuery, filterType, sortBy]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Top Banner de Consola de Estudio */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: palette.backgroundElevated,
            borderBottomColor: palette.borderSubtle
          }
        ]}
      >
        <View style={styles.topBarInner}>
          <View style={styles.topMetaRow}>
            <View style={styles.badgeRow}>
              <View style={[styles.liveIndicator, { backgroundColor: palette.accent }]} />
              <ShinyText text="TAPE TRADING ARCHIVE · CATÁLOGO MÁSTER" baseColor={palette.muted} shimmerColor={palette.accent} style={styles.badgeRowText} />
            </View>

            <View style={styles.headerRightActions}>
              {/* Botón QR */}
              <Pressable
                style={[
                  styles.headerBtn,
                  { backgroundColor: palette.cyanMuted, borderColor: palette.cyanBorder }
                ]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  setScannerVisible(true);
                }}
              >
                <Maximize2 size={13} color={palette.cyan} />
                <Text style={[styles.headerBtnText, { color: palette.cyan }]}>QR</Text>
              </Pressable>

              {/* Botón Día / Noche */}
              <Pressable
                style={[
                  styles.headerBtn,
                  { backgroundColor: palette.surfaceLight, borderColor: palette.border }
                ]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  toggleTheme();
                }}
              >
                {isDark ? (
                  <Sun size={13} color={palette.accent} />
                ) : (
                  <Moon size={13} color={palette.text} />
                )}
                <Text style={[styles.headerBtnText, { color: palette.text }]}>
                  {isDark ? 'DÍA' : 'NOCHE'}
                </Text>
              </Pressable>

              {/* Contador de Masters */}
              <View
                style={[
                  styles.badgeCount,
                  { backgroundColor: palette.surfaceLight, borderColor: palette.border }
                ]}
              >
                <Text style={[styles.badgeCountNumber, { color: palette.accent }]}>
                  {tracks.length}
                </Text>
                <Text style={[styles.badgeCountLabel, { color: palette.muted }]}>MÁSTERS</Text>
              </View>
            </View>
          </View>

          {/* Título de Cabecera */}
          <View style={styles.titleCol}>
            <Text style={[styles.title, { color: palette.text }]}>Catálogo de Tiradas</Text>
            <DecryptedText text="Cintas máster físicas en tiradas estrictamente limitadas, numeradas y custodiadas en bodega." style={[styles.subtitle, { color: palette.muted }]} speed={25} />
          </View>
        </View>

        {/* Buscador con Resplandor de Foco */}
        <View style={styles.searchFilterRow}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: palette.surfaceDark,
                borderColor: searchFocused ? palette.accent : palette.border
              },
              searchFocused && themeTokens.shadows.amberGlow
            ]}
          >
            <Search
              size={15}
              color={searchFocused ? palette.accent : palette.muted}
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Buscar por pista, artista, tirada o linaje..."
              placeholderTextColor={palette.mutedDark}
              style={[styles.searchInput, { color: palette.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchQuery ? (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={10}
                style={{ padding: 4 }}
              >
                <X size={15} color={palette.muted} />
              </Pressable>
            ) : null}
          </View>

          {/* Chips de Filtro con Alto Contraste */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {[
              { id: 'all', label: `Todas (${tracks.length})`, icon: null },
              {
                id: 'featured',
                label: `Destacadas (${tracks.filter((t) => t.is_featured).length})`,
                icon: <Sparkles size={13} color={filterType === 'featured' ? palette.accent : palette.textSecondary} />
              },
              {
                id: 'available',
                label: 'En Stock',
                icon: <Archive size={13} color={filterType === 'available' ? palette.accent : palette.textSecondary} />
              },
              {
                id: 'verified',
                label: 'Sellos',
                icon: <Disc3 size={13} color={filterType === 'verified' ? palette.accent : palette.textSecondary} />
              }
            ].map((f) => (
              <Chip
                key={f.id}
                label={f.label}
                selected={filterType === f.id}
                onPress={() => setFilterType(f.id)}
                icon={f.icon}
                palette={palette}
              />
            ))}
          </ScrollView>

          {/* Barra de Ordenamiento por Tiempo y de A a la Z */}
          <View style={styles.sortBarRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <SlidersHorizontal size={13} color={palette.muted} />
              <Text style={[styles.sortLabel, { color: palette.muted }]}>ORDEN:</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortScroll}
            >
              {[
                {
                  id: 'recent',
                  label: 'Más Recientes',
                  icon: <Clock size={11} color={sortBy === 'recent' ? palette.accent : palette.textSecondary} />
                },
                {
                  id: 'az',
                  label: 'A → Z',
                  icon: <ArrowDownAZ size={11} color={sortBy === 'az' ? palette.accent : palette.textSecondary} />
                },
                {
                  id: 'za',
                  label: 'Z → A',
                  icon: <ArrowUpZA size={11} color={sortBy === 'za' ? palette.accent : palette.textSecondary} />
                },
                {
                  id: 'oldest',
                  label: 'Primeras Tiradas',
                  icon: <Calendar size={11} color={sortBy === 'oldest' ? palette.accent : palette.textSecondary} />
                }
              ].map((s) => (
                <Pressable
                  key={s.id}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor:
                        sortBy === s.id
                          ? palette.accentMuted
                          : palette.surfaceLight,
                      borderColor: sortBy === s.id ? palette.accent : palette.border
                    },
                    sortBy === s.id && themeTokens.shadows.amberGlow
                  ]}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setSortBy(s.id as any);
                  }}
                >
                  <View style={{ marginRight: 5 }}>{s.icon}</View>
                  <Text
                    style={[
                      styles.sortChipText,
                      {
                        color: sortBy === s.id ? palette.accent : palette.textSecondary,
                        fontWeight: sortBy === s.id ? '800' : '600'
                      }
                    ]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Cuerpo del Catálogo: Skeletons vs Lista Oficial */}
      {loading ? (
        <CatalogSkeletonList palette={palette} />
      ) : (
        <FlatList
          ref={listRef}
          data={filteredTracks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.listContent, isDesktop && { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={palette.accent}
            />
          }
          renderItem={({ item }) => {
            const trackPressing = pressings.find((p) => p.track_id === item.id);
            const isClaiming = trackPressing && claimingId === trackPressing.id;
            const available = trackPressing ? trackPressing.available_copies : 0;
            const total = trackPressing ? trackPressing.total_copies : 0;
            const isSoldOut = trackPressing && available === 0;
            const percentageLeft = total > 0 ? (available / total) * 100 : 0;

            return (
              <SpotlightCard
                spotlightColor={item.is_featured ? 'rgba(245, 158, 11, 0.24)' : 'rgba(0, 229, 255, 0.15)'}
                borderColor={item.is_featured ? 'rgba(245, 158, 11, 0.55)' : 'rgba(30, 41, 59, 0.6)'}
                style={styles.card}
              >
                {/* Cabecera de la Pista: Portada de Vinilo y Metadatos */}
                <View style={styles.cardHeader}>
                  {item.cover_url ? (
                    <View style={styles.vinylSleeveWrapper}>
                      <Image
                        source={{ uri: item.cover_url }}
                        style={styles.vinylCoverImage}
                        resizeMode="cover"
                      />
                      {/* Disco de vinilo asomando con surcos analógicos */}
                      <View
                        style={[
                          styles.vinylDiscPeek,
                          {
                            backgroundColor: '#05070A',
                            borderColor: palette.border
                          }
                        ]}
                      >
                        <View style={[styles.vinylGroove, { borderColor: '#1F2937' }]} />
                        <View style={[styles.vinylGrooveInner, { borderColor: '#111827' }]} />
                        <View style={[styles.vinylLabelCenter, { backgroundColor: palette.accent }]} />
                      </View>
                    </View>
                  ) : (
                    /* Sleeve Analógico de Carrete */
                    <View
                      style={[
                        styles.cassetteThumb,
                        {
                          backgroundColor: palette.surfaceDark,
                          borderColor: palette.borderSubtle
                        }
                      ]}
                    >
                      <View style={styles.tapeSpools}>
                        <View style={[styles.tapeSpool, { borderColor: palette.accent }]} />
                        <View style={[styles.tapeWindow, { backgroundColor: palette.surfaceLight }]} />
                        <View style={[styles.tapeSpool, { borderColor: palette.accent }]} />
                      </View>
                      <Text style={[styles.tapeThumbText, { color: palette.muted }]}>
                        ANALOG REEL
                      </Text>
                    </View>
                  )}

                  <View style={styles.trackInfo}>
                    <View style={styles.trackTitleRow}>
                      <Text style={[styles.trackTitle, { color: palette.text }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                      {item.is_featured ? (
                        <Badge label="DESTACADA" variant="curator" palette={palette} />
                      ) : null}
                    </View>

                    <View style={styles.artistRow}>
                      <Text style={[styles.artistName, { color: palette.accent }]}>
                        {item.artist_name}
                      </Text>
                      {item.verified ? (
                        <Badge label="SELLO VERIFICADO" variant="verified" palette={palette} animatedPulse />
                      ) : null}
                    </View>

                    <View style={styles.metaRow}>
                      <View
                        style={[
                          styles.licenseTag,
                          { backgroundColor: palette.surfaceLight, borderColor: palette.border }
                        ]}
                      >
                        <Text style={[styles.licenseText, { color: palette.textSecondary }]}>
                          {item.license_type || 'ORIGINAL'}
                        </Text>
                      </View>
                      {trackPressing && (
                        <View
                          style={[
                            styles.licenseTag,
                            { backgroundColor: palette.cyanMuted, borderColor: palette.cyanBorder }
                          ]}
                        >
                          <Text style={[styles.licenseText, { color: palette.cyan }]}>
                            GEN {trackPressing.generation_limit}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {item.description ? (
                  <Text style={[styles.description, { color: palette.textSecondary }]}>
                    {item.description}
                  </Text>
                ) : null}

                {/* Caja de Tirada Física y Botón de Adquisición */}
                {trackPressing ? (
                  <View
                    style={[
                      styles.pressingBox,
                      {
                        backgroundColor: palette.surfaceDark,
                        borderColor: palette.borderSubtle
                      },
                      isDesktop && styles.pressingBoxDesktop
                    ]}
                  >
                    {/* Estadísticas de Stock */}
                    <View style={[styles.stockInfoCol, isDesktop && { flex: 1, marginRight: 24 }]}>
                      <View style={styles.pressingStats}>
                        <View>
                          <Text style={[styles.statLabel, { color: palette.muted }]}>
                            DISPONIBILIDAD EN BODEGA
                          </Text>
                          <Text style={[styles.statValue, { color: isSoldOut ? palette.danger : palette.accent }]}>
                            {available}{' '}
                            <Text style={[styles.statTotal, { color: palette.textSecondary }]}>
                              / {total} CINTAS FÍSICAS
                            </Text>
                          </Text>
                        </View>

                        <Badge
                          label={isSoldOut ? 'AGOTADA' : 'CUSTODIA MINT 100%'}
                          variant={isSoldOut ? 'admin' : 'mint'}
                          palette={palette}
                        />
                      </View>

                      {/* Barra de Progreso de Stock con Gradiente */}
                      <AnimatedStockBar
                        percentage={percentageLeft}
                        isSoldOut={isSoldOut}
                        palette={palette}
                      />
                    </View>

                    {/* Botón de Adquirir Proporcionado */}
                    <View style={[styles.claimBtnWrap, isDesktop && styles.claimBtnWrapDesktop]}>
                      <ShimmerButton
                        title={
                          isClaiming
                            ? 'PROCESANDO...'
                            : isSoldOut
                            ? 'TIRADA FÍSICA AGOTADA'
                            : 'ADQUIRIR CINTA FÍSICA - NUMERADA'
                        }
                        onPress={() => handleClaim(trackPressing, item.title)}
                        disabled={isSoldOut || Boolean(isClaiming)}
                        style={isDesktop ? { width: 300 } : { width: '100%' }}
                        gradientColors={isSoldOut ? ['#334155', '#1E293B'] : ['#F59E0B', '#D97706']}
                        icon={
                          isClaiming ? null : (
                            <Archive
                              size={14}
                              color={isSoldOut ? palette.muted : '#06080D'}
                            />
                          )
                        }
                      />
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.noPressingBox,
                      {
                        backgroundColor: palette.surfaceDark,
                        borderColor: palette.borderSubtle
                      }
                    ]}
                  >
                    <Text style={[styles.noPressingText, { color: palette.mutedDark }]}>
                      Sin tirada física activa configurada para este máster.
                    </Text>
                  </View>
                )}
              </SpotlightCard>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: palette.surfaceDark, borderColor: palette.border }
                ]}
              >
                <Radio size={36} color={palette.accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>
                Sin pistas encontradas
              </Text>
              <Text style={[styles.emptySub, { color: palette.muted }]}>
                {searchQuery
                  ? 'No hay resultados para tu búsqueda. Probá con otro término o limpiá el filtro.'
                  : 'Todavía no hay pistas ni tiradas registradas en el archivo de másters.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Botón Flotante para Scroll Top */}
      {showScrollTop && (
        <Pressable
          style={({ pressed }) => [
            styles.scrollTopBtn,
            { backgroundColor: palette.surface, borderColor: palette.accent },
            themeTokens.shadows.amberGlow,
            pressed && { opacity: 0.75, transform: [{ scale: 0.92 }] }
          ]}
          onPress={scrollToTop}
          accessibilityLabel="Subir al inicio del catálogo"
        >
          <ArrowUp size={16} color={palette.accent} />
        </Pressable>
      )}

      {/* Modal del Escáner QR */}
      <QrScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onOpenTape={(tape) => {
          notify('Cinta Validada', `Copia #${tape.copyNumber} lista en tu vitrina.`, 'success');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1
  },
  topBarInner: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%'
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  titleCol: {
    width: '100%'
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  liveIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4
  },
  badgeRowText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6
  },
  subtitle: {
    fontSize: 13.5,
    marginTop: 4,
    lineHeight: 19,
    maxWidth: 600
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8
  },
  headerBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  badgeCount: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeCountNumber: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 17
  },
  badgeCountLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6
  },
  searchFilterRow: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    marginTop: 14,
    gap: 12
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0
  },
  filtersScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2
  },
  sortBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  sortLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  sortScroll: {
    flexDirection: 'row',
    gap: 8
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6.5,
    borderRadius: 8,
    borderWidth: 1
  },
  sortChipText: {
    fontSize: 11
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center'
  },
  skeletonContainer: {
    padding: 20,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    gap: 16
  },
  card: {
    borderRadius: 18,
    padding: 22,
    marginBottom: 18
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18
  },
  vinylSleeveWrapper: {
    position: 'relative',
    width: 96,
    height: 96,
    justifyContent: 'center'
  },
  vinylCoverImage: {
    width: 88,
    height: 88,
    borderRadius: 12,
    zIndex: 2,
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)'
  },
  vinylDiscPeek: {
    position: 'absolute',
    right: -4,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6
  },
  vinylGroove: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1
  },
  vinylGrooveInner: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1
  },
  vinylLabelCenter: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10
  },
  cassetteThumb: {
    width: 88,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6
  },
  tapeSpools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  tapeSpool: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2
  },
  tapeWindow: {
    width: 18,
    height: 8,
    borderRadius: 2
  },
  tapeThumbText: {
    fontSize: 8.5,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 0.8
  },
  trackInfo: {
    flex: 1
  },
  trackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    flexShrink: 1
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap'
  },
  artistName: {
    fontWeight: '800',
    fontSize: 14.5
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10
  },
  licenseTag: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1
  },
  licenseText: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  description: {
    fontSize: 14,
    marginTop: 14,
    lineHeight: 20
  },
  pressingBox: {
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
    borderWidth: 1
  },
  pressingBoxDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18
  },
  stockInfoCol: {
    marginBottom: 12
  },
  pressingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2
  },
  statTotal: {
    fontSize: 12,
    fontWeight: '700'
  },
  stockBarTrack: {
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden'
  },
  claimBtnWrap: {
    marginTop: 6
  },
  claimBtnWrapDesktop: {
    marginTop: 0,
    alignItems: 'flex-end'
  },
  noPressingBox: {
    padding: 14,
    borderRadius: 10,
    marginTop: 14,
    borderWidth: 1
  },
  noPressingText: {
    fontSize: 12.5,
    fontStyle: 'italic',
    textAlign: 'center'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800'
  },
  emptySub: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 400
  },
  scrollTopBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99
  }
});
