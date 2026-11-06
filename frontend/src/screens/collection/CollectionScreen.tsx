// Colección personal: estantería/vitrina digital, casetes, vinilos, escaneo QR y degradación analógica en TypeScript.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { soundPlayer } from '../../utils/soundPlayer';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useSync } from '../../context/SyncContext';
import { useTheme } from '../../context/ThemeContext';
import QrCodeModal from '../../components/QrCodeModal';
import QrScannerModal from '../../components/QrScannerModal';
import { shadows } from '../../theme/colors';
import { downloadTrackOffline, getOfflineTracksMap, removeTrackOffline } from '../../utils/offlineStorage';
import { Copy } from '../../types';

export default function CollectionScreen(): React.JSX.Element {
  const { token, user } = useAuth();
  const { palette, isDark, toggleTheme } = useTheme();
  const { notify } = useFeedback();
  const { syncVersion, triggerSync } = useSync();

  const [copies, setCopies] = useState<Copy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [playingId, setPlayingId] = useState<number | null>(null);

  // Selector de vista: 'showcase' (vitrina/estantería) o 'list' (lista detallada)
  const [viewMode, setViewMode] = useState<'showcase' | 'list'>('showcase');
  const [formatFilter, setFormatFilter] = useState<'all' | 'cassette' | 'vinyl' | 'special'>('all');

  // Inspección de Vitrina (item seleccionado)
  const [inspectedCopy, setInspectedCopy] = useState<Copy | null>(null);

  // Modales de Código QR y Escáner QR
  const [qrModalCopy, setQrModalCopy] = useState<Copy | null>(null);
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [offlineMap, setOfflineMap] = useState<Record<string, any>>({});
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Dubbing state
  const [dubModalVisible, setDubModalVisible] = useState<boolean>(false);
  const [selectedCopyForDub, setSelectedCopyForDub] = useState<Copy | null>(null);
  const [recipientUserId, setRecipientUserId] = useState<string>('');
  const [dubbing, setDubbing] = useState<boolean>(false);

  // Lineage state
  const [lineageModalVisible, setLineageModalVisible] = useState<boolean>(false);
  const [lineageData, setLineageData] = useState<any[]>([]);
  const [loadingLineage, setLoadingLineage] = useState<boolean>(false);

  const showcaseScrollRef = useRef<any>(null);
  const listRef = useRef<any>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent?.contentOffset?.y || 0;
    setShowScrollTop(offsetY > 260);
  };

  const scrollToTop = () => {
    if (viewMode === 'showcase') {
      (showcaseScrollRef.current as any)?.scrollTo?.({ y: 0, animated: true });
    } else {
      (listRef.current as any)?.scrollToOffset?.({ offset: 0, animated: true });
    }
  };
  const [selectedCopyForLineage, setSelectedCopyForLineage] = useState<Copy | null>(null);

  const spin = useRef(new Animated.Value(0)).current;

  const reload = useCallback(async () => {
    try {
      const [data, offlineData] = await Promise.all([
        apiRequest('/collection', { token }),
        getOfflineTracksMap()
      ]);
      setCopies(data.copies || []);
      setOfflineMap(offlineData || {});
    } catch (e) {
      console.warn('Error cargando colección:', e);
      try {
        const offlineData = await getOfflineTracksMap();
        setOfflineMap(offlineData || {});
      } catch {}
    }
  }, [token]);

  // Actualización instantánea al cambiar pestaña o disparar sincronización (sin reiniciar)
  useFocusEffect(
    useCallback(() => {
      reload().finally(() => setLoading(false));
    }, [reload, syncVersion])
  );

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload, syncVersion]);

  useEffect(() => {
    return () => {
      soundPlayer.stop();
    };
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  async function handleToggleOffline(copy) {
    if (!copy?.audio_url) {
      notify('Audio no disponible', 'Esta copia no tiene archivo de audio asociado.', 'warning');
      return;
    }

    const isDownloaded = Boolean(offlineMap[copy.audio_url]);

    if (isDownloaded) {
      try {
        await removeTrackOffline(copy.audio_url);
        const updated = await getOfflineTracksMap();
        setOfflineMap(updated);
        notify('Descarga eliminada', 'La copia fue removida del almacenamiento local.', 'info');
      } catch (err) {
        notify('Error al eliminar', err.message, 'error');
      }
      return;
    }

    try {
      setDownloadingId(copy.id);
      await downloadTrackOffline(copy);
      const updated = await getOfflineTracksMap();
      setOfflineMap(updated);
      notify('¡Descarga completa!', `“${copy.track_title || 'Cinta'}” guardada para reproducir sin conexión.`, 'success');
    } catch (err) {
      notify('No se pudo descargar', err.message, 'error');
    } finally {
      setDownloadingId(null);
    }
  }

  async function play(copy) {
    try {
      soundPlayer.stop();

      if (playingId === copy.id) {
        setPlayingId(null);
        return;
      }

      setPlayingId(copy.id);
      Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 2000, useNativeDriver: true })
      ).start();

      const audioUrl = copy.audio_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      await soundPlayer.play(audioUrl, () => {
        setPlayingId((curr) => (curr === copy.id ? null : curr));
      });

      // Registrar desgaste en backend (tolerante a modo offline sin internet)
      try {
        const data = await apiRequest(`/copies/${copy.id}/play`, { method: 'POST', token });
        notify(
          'Reproducción en cabezal',
          `Condición: ${data.conditionValue}%. Desgaste acumulado: ${data.degradationApplied}%.`,
          'success'
        );
        await reload();
      } catch (netErr) {
        notify('Modo Offline Activo', 'Reproduciendo pieza directamente desde la memoria interna.', 'info');
      }
    } catch (error) {
      soundPlayer.stop();
      setPlayingId(null);
      notify('No se pudo reproducir la cinta', error.message, 'error');
    }
  }

  function openDubModal(copy) {
    setSelectedCopyForDub(copy);
    setRecipientUserId('');
    setDubModalVisible(true);
  }

  async function executeDub() {
    if (!recipientUserId.trim()) {
      notify('Destinatario requerido', 'Ingresá el ID numérico del usuario destinatario.', 'warning');
      return;
    }
    try {
      setDubbing(true);
      const res = await apiRequest(`/copies/${selectedCopyForDub.id}/dub`, {
        method: 'POST',
        token,
        body: { recipientUserId: Number(recipientUserId) }
      });
      setDubModalVisible(false);
      notify(
        'Cinta dubbeada con éxito',
        `La nueva copia de Generación ${res.generation} fue transferida al usuario #${recipientUserId}.`,
        'success'
      );
      await reload();
    } catch (error) {
      notify('No se pudo dubbear la cinta', error.message, 'error');
    } finally {
      setDubbing(false);
    }
  }

  async function openLineage(copy) {
    try {
      setSelectedCopyForLineage(copy);
      setLineageModalVisible(true);
      setLoadingLineage(true);
      const data = await apiRequest(`/copies/${copy.id}/lineage`, { token });
      setLineageData(data.lineage || []);
    } catch (error) {
      notify('No se pudo consultar el linaje', error.message, 'error');
    } finally {
      setLoadingLineage(false);
    }
  }

  async function handleDelete(copy) {
    try {
      await apiRequest(`/copies/${copy.id}`, { method: 'DELETE', token });
      notify('Cinta retirada', `La copia #${copy.copy_number} fue archivada de tu estantería activa.`, 'info');
      await reload();
      if (inspectedCopy?.id === copy.id) setInspectedCopy(null);
    } catch (err) {
      notify('No se pudo archivar la copia', err.message, 'error');
    }
  }

  const rotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const avgCondition = useMemo(() => {
    if (!copies.length) return 100;
    const sum = copies.reduce((acc, c) => acc + Number(c.condition_value || 100), 0);
    return Math.round(sum / copies.length);
  }, [copies]);

  // Filtrado de formato para la vitrina
  const filteredCopies = useMemo(() => {
    return copies.filter((c, idx) => {
      // Determinación de formato: casete vs vinilo según índice o copia
      const isVinyl = (c.id % 2 === 0);
      const isSpecial = (c.generation === 0 || c.copy_number <= 2);

      if (formatFilter === 'cassette') return !isVinyl;
      if (formatFilter === 'vinyl') return isVinyl;
      if (formatFilter === 'special') return isSpecial;
      return true;
    });
  }, [copies, formatFilter]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Top Bar con Controles de Vista, Escáner QR y Tema Día/Noche */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: palette.backgroundElevated, borderBottomColor: palette.borderSubtle }
        ]}
      >
        <View style={styles.topBarInner}>
          <View style={styles.topMetaRow}>
            <View style={styles.badgeRow}>
              <View style={[styles.deckPulse, { backgroundColor: palette.accent }]} />
              <Text style={[styles.badgeRowText, { color: palette.muted }]}>
                VITRINA ANALÓGICA & TAPE DECK
              </Text>
            </View>

            {/* Acciones de Cabecera: Escáner QR y Tema */}
            <View style={styles.headerActions}>
              <Pressable
                style={[styles.qrScanBtn, { backgroundColor: palette.cyanMuted, borderColor: palette.cyanBorder }]}
                onPress={() => setScannerVisible(true)}
              >
                <Feather name="maximize" size={13} color={palette.cyan} />
                <Text style={[styles.qrScanBtnText, { color: palette.cyan }]}>QR</Text>
              </Pressable>

              <Pressable
                style={[styles.themeToggleBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
                onPress={toggleTheme}
              >
                <Feather name={isDark ? 'sun' : 'moon'} size={13} color={palette.text} />
                <Text style={[styles.themeToggleText, { color: palette.text }]}>
                  {isDark ? 'DÍA' : 'NOCHE'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.titleCol}>
            <Text style={[styles.title, { color: palette.text }]}>Mi Colección</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>
              Estantería de casetes y vinilos físicos con desgaste real y validación QR.
            </Text>
          </View>
        </View>

        {/* Selector de Modo de Visualización y Filtros */}
        <View style={styles.viewModeRow}>
          <View style={[styles.modeToggleWrap, { backgroundColor: palette.surfaceDark, borderColor: palette.border }]}>
            <Pressable
              style={[
                styles.modeBtn,
                viewMode === 'showcase' && [styles.modeBtnActive, { backgroundColor: palette.accent }]
              ]}
              onPress={() => setViewMode('showcase')}
            >
              <Feather
                name="grid"
                size={12}
                color={viewMode === 'showcase' ? palette.background : palette.muted}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: viewMode === 'showcase' ? palette.background : palette.muted }
                ]}
              >
                Vitrina 3D
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.modeBtn,
                viewMode === 'list' && [styles.modeBtnActive, { backgroundColor: palette.accent }]
              ]}
              onPress={() => setViewMode('list')}
            >
              <Feather
                name="list"
                size={12}
                color={viewMode === 'list' ? palette.background : palette.muted}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: viewMode === 'list' ? palette.background : palette.muted }
                ]}
              >
                Lista Deck
              </Text>
            </Pressable>
          </View>

          {/* Filtros de formato */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {([
              { id: 'all', label: `Todos (${copies.length})`, icon: null },
              { id: 'cassette', label: 'Casetes', icon: 'archive' },
              { id: 'vinyl', label: 'Vinilos', icon: 'disc' },
              { id: 'special', label: 'Edición Especial', icon: 'star' }
            ] as const).map((f) => (
              <Pressable
                key={f.id}
                style={[
                  styles.formatChip,
                  { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle },
                  formatFilter === f.id && [styles.formatChipActive, { backgroundColor: palette.accentMuted, borderColor: palette.accent }]
                ]}
                onPress={() => setFormatFilter(f.id)}
              >
                {f.icon ? (
                  <Feather
                    name={f.icon as any}
                    size={11}
                    color={formatFilter === f.id ? palette.accent : palette.muted}
                    style={{ marginRight: 5 }}
                  />
                ) : null}
                <Text
                  style={[
                    styles.formatChipText,
                    { color: formatFilter === f.id ? palette.accent : palette.muted }
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={palette.accent} size="large" />
          <Text style={[styles.loadingText, { color: palette.muted }]}>
            Cargando vitrina de coleccionista...
          </Text>
        </View>
      ) : viewMode === 'showcase' ? (
        /* ================= VISTA VITRINA / ESTANTERÍA DIGITAL ================= */
        <ScrollView
          ref={showcaseScrollRef as any}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.shelfScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accent} />
          }
        >
          {/* Estante Superior: Cintas & Rarezas */}
          <View style={[styles.shelfContainer, { borderColor: palette.border }]}>
            <View style={styles.shelfHeaderRow}>
              <Text style={[styles.shelfLabel, { color: palette.accent }]}>
                ESTANTE 1 · CASSETTES & MÁSTERS DE CINTA
              </Text>
              <Text style={[styles.shelfCount, { color: palette.muted }]}>
                {filteredCopies.length} EJEMPLARES
              </Text>
            </View>

            {filteredCopies.length === 0 ? (
              <View style={styles.emptyShelfBox}>
                <Text style={[styles.emptyShelfText, { color: palette.muted }]}>
                  Estantería vacía con este filtro. Adquirí copias en el Catálogo.
                </Text>
              </View>
            ) : (
              <View style={styles.shelfGrid}>
                {filteredCopies.map((item, idx) => {
                  const isVinyl = item.id % 2 === 0;
                  const isPlaying = playingId === item.id;
                  const cond = Number(item.condition_value);
                  const isSpecial = item.generation === 0 || item.copy_number <= 2;

                  return (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [
                        styles.shelfItem,
                        pressed && { transform: [{ translateY: -4 }] }
                      ]}
                      onPress={() => setInspectedCopy(item)}
                    >
                      {/* Formato: Casete vertical o Carátula de Vinilo */}
                      {!isVinyl ? (
                        <View
                          style={[
                            styles.cassetteSpine,
                            {
                              backgroundColor: isSpecial ? '#261b05' : palette.surface,
                              borderColor: isSpecial ? palette.accent : palette.border
                            },
                            shadows.md
                          ]}
                        >
                          {/* Insignia dorada de edición especial */}
                          {isSpecial && (
                            <View style={[styles.specialRibbon, { backgroundColor: palette.accent }]}>
                              <Text style={styles.specialRibbonText}>★ GOLD</Text>
                            </View>
                          )}

                          {item.cover_url ? (
                            <View style={styles.spineCoverThumbBox}>
                              <Image
                                source={{ uri: item.cover_url }}
                                style={styles.spineCoverThumb}
                                resizeMode="cover"
                              />
                            </View>
                          ) : (
                            <View style={styles.spineWindow}>
                              <View style={[styles.miniSpool, isPlaying && styles.miniSpoolPlaying]} />
                              <View style={[styles.miniSpool, isPlaying && styles.miniSpoolPlaying]} />
                            </View>
                          )}

                          <Text style={[styles.spineTitle, { color: palette.text }]} numberOfLines={1}>
                            {item.track_title}
                          </Text>

                          <View style={styles.spineFooter}>
                            <Text style={[styles.spineCopyNum, { color: palette.accent }]}>
                              #{item.copy_number}
                            </Text>
                            <View
                              style={[
                                styles.spineLed,
                                {
                                  backgroundColor:
                                    cond > 75
                                      ? palette.success
                                      : cond > 40
                                      ? palette.warning
                                      : palette.danger
                                }
                              ]}
                            />
                          </View>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.vinylSleeveBox,
                            {
                              backgroundColor: '#121622',
                              borderColor: isSpecial ? palette.accent : palette.border
                            },
                            shadows.md
                          ]}
                        >
                          {item.cover_url ? (
                            <View style={styles.sleeveCoverContainer}>
                              <Image
                                source={{ uri: item.cover_url }}
                                style={styles.sleeveCoverImage}
                                resizeMode="cover"
                              />
                              <View style={styles.sleeveGroovesOverlay}>
                                <View style={styles.vinylEdgeCircle} />
                              </View>
                            </View>
                          ) : (
                            <View style={styles.sleeveGroovesPreview}>
                              <View style={styles.vinylEdgeCircle} />
                            </View>
                          )}

                          <Text style={[styles.sleeveTitle, { color: palette.text }]} numberOfLines={1}>
                            {item.track_title}
                          </Text>
                          <Text style={[styles.sleeveArtist, { color: palette.accent }]}>
                            VINILO 33 RPM · #{item.copy_number}
                          </Text>

                          <View style={styles.sleeveFooter}>
                            <Text style={[styles.sleeveGen, { color: palette.cyan }]}>
                              GEN {item.generation}
                            </Text>
                            <Text style={[styles.sleeveCond, { color: palette.muted }]}>
                              {cond}%
                            </Text>
                          </View>
                        </View>
                      )}

                      <Text style={[styles.itemSubText, { color: palette.muted }]} numberOfLines={1}>
                        {item.track_title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Viga de madera / titanio del estante */}
            <View style={[styles.shelfBeam, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}>
              <View style={[styles.shelfBeamHighlight, { backgroundColor: palette.border }]} />
            </View>
          </View>
        </ScrollView>
      ) : (
        /* ================= VISTA LISTA DETALLADA TRADICIONAL ================= */
        <FlatList
          ref={listRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          data={filteredCopies}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accent} />
          }
          renderItem={({ item }) => {
            const isPlaying = playingId === item.id;
            const cond = Number(item.condition_value);
            const condColor = cond > 75 ? palette.success : cond > 40 ? palette.warning : palette.danger;
            const condBg = cond > 75 ? palette.successMuted : cond > 40 ? palette.warningMuted : palette.dangerMuted;
            const condBorder = cond > 75 ? palette.successBorder : cond > 40 ? palette.warningBorder : palette.dangerBorder;

            return (
              <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.sm]}>
                <View style={[styles.cassetteFrame, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                  <View style={styles.cassetteHeaderRow}>
                    <View style={[styles.cassetteBrandBadge, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                      <Text style={[styles.cassetteBrandText, { color: palette.accent }]}>
                        TYPE II · CHROME TAPE
                      </Text>
                    </View>
                    <View style={styles.headerRightControls}>
                      <Pressable
                        style={[styles.qrPillBtn, { backgroundColor: palette.cyanMuted, borderColor: palette.cyanBorder }]}
                        onPress={() => setQrModalCopy(item)}
                      >
                        <Text style={[styles.qrPillText, { color: palette.cyan }]}>⛶ QR OFICIAL</Text>
                      </Pressable>
                      <Text style={[styles.tapeSideText, { color: palette.muted }]}>SIDE A</Text>
                    </View>
                  </View>

                  {/* Ventana de carretes analógicos */}
                  <View style={[styles.tapeDeckWindow, { backgroundColor: palette.background, borderColor: palette.borderSubtle }]}>
                    <Animated.View
                      style={[
                        styles.spoolWheel,
                        { borderColor: palette.accent, backgroundColor: palette.surfaceLight },
                        isPlaying && { transform: [{ rotate: rotation }] }
                      ]}
                    >
                      <View style={styles.spoolTeeth} />
                      <View style={[styles.spoolHub, { backgroundColor: palette.background }]} />
                    </Animated.View>

                    <View style={styles.tapeRibbon}>
                      <View style={[styles.ribbonFill, { width: `${100 - cond * 0.4}%`, backgroundColor: palette.accent }]} />
                    </View>

                    <Animated.View
                      style={[
                        styles.spoolWheel,
                        { borderColor: palette.accent, backgroundColor: palette.surfaceLight },
                        isPlaying && { transform: [{ rotate: rotation }] }
                      ]}
                    >
                      <View style={styles.spoolTeeth} />
                      <View style={[styles.spoolHub, { backgroundColor: palette.background }]} />
                    </Animated.View>
                  </View>

                  <View style={styles.tapeLabelArea}>
                    {item.cover_url ? (
                      <Image
                        source={{ uri: item.cover_url }}
                        style={styles.deckListCoverThumb}
                        resizeMode="cover"
                      />
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.trackTitle, { color: palette.text }]}>{item.track_title}</Text>
                      <View style={styles.tapeBadgeRow}>
                        <View style={[styles.copyBadge, { backgroundColor: palette.surfaceLight }]}>
                          <Text style={[styles.copyBadgeText, { color: palette.textSecondary }]}>
                            COPIA #{item.copy_number}
                          </Text>
                        </View>
                        <View style={[styles.genBadge, { backgroundColor: palette.cyanMuted, borderColor: palette.cyanBorder }]}>
                          <Text style={[styles.genBadgeText, { color: palette.cyan }]}>
                            GENERACIÓN {item.generation}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Medidor de Condición */}
                  <View style={[styles.conditionSection, { backgroundColor: palette.surface, borderColor: palette.borderSubtle }]}>
                    <View style={styles.conditionHeader}>
                      <Text style={[styles.conditionLabel, { color: palette.muted }]}>INTEGRIDAD DE CINTA</Text>
                      <View style={[styles.conditionPill, { backgroundColor: condBg, borderColor: condBorder }]}>
                        <Text style={[styles.conditionValueText, { color: condColor }]}>
                          {cond}% {cond > 75 ? '· ÓPTIMA' : cond > 40 ? '· DESGASTADA' : '· CRÍTICA'}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.conditionMeterBg, { backgroundColor: palette.surfaceDark }]}>
                      <View
                        style={[
                          styles.conditionMeterFill,
                          {
                            width: `${Math.max(4, Math.min(100, cond))}%`,
                            backgroundColor: condColor
                          }
                        ]}
                      />
                    </View>
                  </View>
                </View>

                {/* Acciones */}
                <View style={styles.actionRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.playBtn,
                      { backgroundColor: isPlaying ? palette.success : palette.accent },
                      pressed && { opacity: 0.85 }
                    ]}
                    onPress={() => play(item)}
                  >
                    <Text style={[styles.playBtnText, { color: palette.background }]}>
                      {isPlaying ? '❚❚ DETENER' : '▶ REPRODUCIR'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
                    onPress={() => openDubModal(item)}
                  >
                    <Text style={[styles.actionBtnText, { color: palette.textSecondary }]}>📼 DUBBEAR</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.actionBtn,
                      offlineMap[item.audio_url]
                        ? { backgroundColor: palette.successMuted, borderColor: palette.successBorder }
                        : { backgroundColor: palette.surfaceLight, borderColor: palette.border }
                    ]}
                    onPress={() => handleToggleOffline(item)}
                    disabled={downloadingId === item.id}
                  >
                    {downloadingId === item.id ? (
                      <ActivityIndicator size="small" color={palette.accent} />
                    ) : (
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: offlineMap[item.audio_url] ? palette.success : palette.textSecondary }
                        ]}
                      >
                        {offlineMap[item.audio_url] ? '✓ OFFLINE' : '⬇ OFFLINE'}
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
                    onPress={() => openLineage(item)}
                  >
                    <Text style={[styles.actionBtnText, { color: palette.textSecondary }]}>📜 LINAJE</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Botón flotante pequeño para subir al inicio al hacer scroll hacia abajo */}
      {showScrollTop && (
        <Pressable
          style={({ pressed }) => [
            (styles as any).scrollTopBtn,
            { backgroundColor: palette.surface, borderColor: palette.accent },
            pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] }
          ]}
          onPress={scrollToTop}
          accessibilityLabel="Subir al inicio"
        >
          <Feather name="arrow-up" size={16} color={palette.accent} />
        </Pressable>
      )}

      {/* ================= MODAL DE INSPECCIÓN 3D DE VITRINA ================= */}
      <Modal visible={Boolean(inspectedCopy)} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.inspectedModalBox,
              { backgroundColor: palette.surface, borderColor: palette.border },
              shadows.lg
            ]}
          >
            {inspectedCopy && (
              <>
                <View style={styles.inspectedHeader}>
                  <View style={[styles.badgePill, { backgroundColor: palette.accentMuted, borderColor: palette.accentBorder }]}>
                    <Text style={[styles.badgePillText, { color: palette.accent }]}>
                      INSPECCIÓN 3D · VITRINA DE COLECCIÓN
                    </Text>
                  </View>
                  <Pressable onPress={() => setInspectedCopy(null)}>
                    <Text style={[styles.closeIcon, { color: palette.muted }]}>✕</Text>
                  </Pressable>
                </View>

                {/* Vista Principal de la Cinta/Vinilo Inspeccionado */}
                <View style={[styles.bigCassettePreview, { backgroundColor: palette.surfaceDark, borderColor: palette.border }]}>
                  {inspectedCopy.cover_url ? (
                    <View style={styles.inspectedArtworkWrapper}>
                      <Image
                        source={{ uri: inspectedCopy.cover_url }}
                        style={styles.inspectedArtworkImage}
                        resizeMode="cover"
                      />
                      <View style={[styles.inspectedVinylRim, { borderColor: palette.accent }]} />
                    </View>
                  ) : null}

                  <Text style={[styles.inspectedTrackTitle, { color: palette.text }]}>
                    {inspectedCopy.track_title}
                  </Text>
                  <Text style={[styles.inspectedMeta, { color: palette.accent }]}>
                    Copia Física #{inspectedCopy.copy_number} · Generación {inspectedCopy.generation}
                  </Text>

                  {/* Carretes de Audio Animados en Inspección */}
                  <View style={[styles.inspectedReelWindow, { backgroundColor: palette.background, borderColor: palette.borderSubtle }]}>
                    <Animated.View
                      style={[
                        styles.spoolWheel,
                        { borderColor: palette.accent, backgroundColor: palette.surfaceLight },
                        playingId === inspectedCopy.id && { transform: [{ rotate: rotation }] }
                      ]}
                    >
                      <View style={styles.spoolTeeth} />
                      <View style={[styles.spoolHub, { backgroundColor: palette.background }]} />
                    </Animated.View>

                    <Text style={[styles.inspectedReelStatus, { color: palette.muted }]}>
                      {playingId === inspectedCopy.id ? '● REPRODUCIENDO EN VIVO' : 'EN CABEZAL'}
                    </Text>

                    <Animated.View
                      style={[
                        styles.spoolWheel,
                        { borderColor: palette.accent, backgroundColor: palette.surfaceLight },
                        playingId === inspectedCopy.id && { transform: [{ rotate: rotation }] }
                      ]}
                    >
                      <View style={styles.spoolTeeth} />
                      <View style={[styles.spoolHub, { backgroundColor: palette.background }]} />
                    </Animated.View>
                  </View>

                  {/* Estado de Desgaste y Reproducciones */}
                  <View style={styles.inspectedTelemetryRow}>
                    <View style={[styles.telemetryCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                      <Text style={[styles.telemetryLab, { color: palette.muted }]}>CONDICIÓN FÍSICA</Text>
                      <Text style={[styles.telemetryVal, { color: palette.accent }]}>
                        {inspectedCopy.condition_value}%
                      </Text>
                    </View>

                    <View style={[styles.telemetryCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                      <Text style={[styles.telemetryLab, { color: palette.muted }]}>PLAYS TOTALES</Text>
                      <Text style={[styles.telemetryVal, { color: palette.text }]}>
                        {inspectedCopy.playback_count}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Acciones Directas de Vitrina */}
                <View style={styles.inspectedActions}>
                  <Pressable
                    style={[
                      styles.inspectedPlayBtn,
                      { backgroundColor: playingId === inspectedCopy.id ? palette.success : palette.accent }
                    ]}
                    onPress={() => play(inspectedCopy)}
                  >
                    <Text style={[styles.inspectedPlayText, { color: palette.background }]}>
                      {playingId === inspectedCopy.id ? '❚❚ DETENER AUDIO' : '▶ REPRODUCIR PIEZA'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.inspectedQrBtn, { backgroundColor: palette.cyanMuted, borderColor: palette.cyanBorder }]}
                    onPress={() => {
                      setQrModalCopy(inspectedCopy);
                    }}
                  >
                    <Text style={[styles.inspectedQrText, { color: palette.cyan }]}>
                      ⛶ VER QR & STICKER
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.inspectedOfflineBtn,
                      offlineMap[inspectedCopy.audio_url]
                        ? { backgroundColor: palette.successMuted, borderColor: palette.successBorder }
                        : { backgroundColor: palette.surfaceLight, borderColor: palette.border }
                    ]}
                    onPress={() => handleToggleOffline(inspectedCopy)}
                    disabled={downloadingId === inspectedCopy.id}
                  >
                    {downloadingId === inspectedCopy.id ? (
                      <ActivityIndicator size="small" color={palette.accent} />
                    ) : (
                      <Text
                        style={[
                          styles.inspectedOfflineText,
                          { color: offlineMap[inspectedCopy.audio_url] ? palette.success : palette.textSecondary }
                        ]}
                      >
                        {offlineMap[inspectedCopy.audio_url]
                          ? '✓ GUARDADO EN MEMORIA (OFFLINE)'
                          : '⬇ DESCARGAR PARA ESCUCHAR SIN CONEXIÓN'}
                      </Text>
                    )}
                  </Pressable>

                  <View style={styles.inspectedSubActions}>
                    <Pressable
                      style={[styles.inspectedActionBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
                      onPress={() => openDubModal(inspectedCopy)}
                    >
                      <Text style={[styles.inspectedActionBtnText, { color: palette.textSecondary }]}>
                        📼 DUBBEAR
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.inspectedActionBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
                      onPress={() => openLineage(inspectedCopy)}
                    >
                      <Text style={[styles.inspectedActionBtnText, { color: palette.textSecondary }]}>
                        📜 LINAJE
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Dubbear Copia */}
      <Modal visible={dubModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalBadge, { color: palette.accent }]}>TAPE DUPLICATION PROTOCOL</Text>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Grabar Copia (Dubbeo)</Text>
            </View>

            <Text style={[styles.modalDesc, { color: palette.textSecondary }]}>
              Vas a transferir en cinta virgen la pista "{selectedCopyForDub?.track_title}" (Copia #{selectedCopyForDub?.copy_number}).
            </Text>

            <View style={[styles.warningNote, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
              <Text style={[styles.warningNoteTitle, { color: palette.muted }]}>REGLAS DEL SISTEMA ANALÓGICO:</Text>
              <Text style={[styles.warningNoteText, { color: palette.textSecondary }]}>
                • El destinatario recibirá la <Text style={{ color: palette.accent, fontWeight: '800' }}>Generación {(Number(selectedCopyForDub?.generation) || 0) + 1}</Text>.{'\n'}
                • La calidad acústica sufre degradación natural de cinta.{'\n'}
                • Se registrará una nueva firma en la cadena de linaje.
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: palette.muted }]}>ID NUMÉRICO DEL USUARIO DESTINATARIO</Text>
            <TextInput
              placeholder="Ej: 2 (el ID figura en su Perfil)"
              placeholderTextColor={palette.mutedDark}
              keyboardType="number-pad"
              style={[styles.modalInput, { backgroundColor: palette.surfaceDark, borderColor: palette.border, color: palette.text }]}
              value={recipientUserId}
              onChangeText={setRecipientUserId}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setDubModalVisible(false)}
                disabled={dubbing}
              >
                <Text style={[styles.modalCancelText, { color: palette.muted }]}>CANCELAR</Text>
              </Pressable>

              <Pressable
                style={[styles.modalConfirmBtn, { backgroundColor: palette.accent }, dubbing && { opacity: 0.6 }]}
                onPress={executeDub}
                disabled={dubbing}
              >
                {dubbing ? (
                  <ActivityIndicator color={palette.background} size="small" />
                ) : (
                  <Text style={[styles.modalConfirmText, { color: palette.background }]}>CONFIRMAR DUBBEO</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Linaje Histórico */}
      <Modal visible={lineageModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: palette.surface, borderColor: palette.border, maxHeight: '82%' }, shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalBadge, { color: palette.accent }]}>CADENA DE CUSTODIA HISTÓRICA</Text>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Linaje de la Cinta</Text>
              <Text style={[styles.modalTrackSub, { color: palette.textSecondary }]}>
                {selectedCopyForLineage?.track_title} · Copia #{selectedCopyForLineage?.copy_number}
              </Text>
            </View>

            {loadingLineage ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator color={palette.accent} size="large" />
                <Text style={{ color: palette.muted, marginTop: 10, fontSize: 13 }}>Consultando registros magnéticos...</Text>
              </View>
            ) : lineageData.length === 0 ? (
              <View style={[styles.lineageEmptyBox, { backgroundColor: palette.surfaceDark }]}>
                <Text style={[styles.lineageEmptyTitle, { color: palette.accent }]}>Copia Original Directa (Gen 0)</Text>
                <Text style={[styles.lineageEmptyText, { color: palette.muted }]}>
                  Esta cinta proviene directamente de la prensadora oficial del artista. Si la dubbeás hacia otro miembro, se inaugurará su árbol genealógico.
                </Text>
              </View>
            ) : (
              <FlatList
                data={lineageData}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingVertical: 8 }}
                renderItem={({ item, index }) => (
                  <View style={styles.lineageCard}>
                    <View style={styles.lineageLeftCol}>
                      <View style={[styles.lineageStepCircle, { backgroundColor: palette.accent }]}>
                        <Text style={[styles.lineageStepText, { color: palette.background }]}>{index + 1}</Text>
                      </View>
                      {index < lineageData.length - 1 && <View style={[styles.lineageLine, { backgroundColor: palette.border }]} />}
                    </View>

                    <View style={[styles.lineageBody, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                      <View style={styles.lineageTransferRow}>
                        <Text style={[styles.lineageFrom, { color: palette.text }]}>{item.from_user_name}</Text>
                        <Text style={[styles.lineageArrow, { color: palette.accent }]}>➔</Text>
                        <Text style={[styles.lineageTo, { color: palette.textSecondary }]}>{item.to_user_name}</Text>
                      </View>

                      <View style={styles.lineageMetaRow}>
                        <View style={[styles.genPill, { backgroundColor: palette.accentMuted, borderColor: palette.accentBorder }]}>
                          <Text style={[styles.genPillText, { color: palette.accent }]}>Gen {item.generation}</Text>
                        </View>
                        <Text style={[styles.lineageDate, { color: palette.mutedDark }]}>
                          {new Date(item.transferred_at).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              />
            )}

            <Pressable
              style={[styles.modalCloseBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
              onPress={() => setLineageModalVisible(false)}
            >
              <Text style={[styles.modalCloseText, { color: palette.text }]}>CERRAR FICHA DE LINAJE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal QR de Cinta Individual */}
      <QrCodeModal
        visible={Boolean(qrModalCopy)}
        copy={qrModalCopy}
        onClose={() => setQrModalCopy(null)}
      />

      {/* Modal Escáner QR de Cintas */}
      <QrScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onOpenTape={(tape) => {
          const found = copies.find((c) => c.id === tape.id);
          if (found) setInspectedCopy(found);
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
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
    gap: 6,
    marginBottom: 4
  },
  deckPulse: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  badgeRowText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
    maxWidth: 440
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  qrScanBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  qrScanBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  themeToggleBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8
  },
  themeToggleText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  viewModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    marginTop: 14,
    gap: 12
  },
  modeToggleWrap: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    gap: 2
  },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  modeBtnActive: {},
  modeBtnText: {
    fontSize: 11,
    fontWeight: '800'
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 10
  },
  formatChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20
  },
  formatChipActive: {},
  formatChipText: {
    fontSize: 10,
    fontWeight: '800'
  },
  shelfScroll: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center'
  },
  shelfContainer: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20
  },
  shelfHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  shelfLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  shelfCount: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  emptyShelfBox: {
    paddingVertical: 30,
    alignItems: 'center'
  },
  emptyShelfText: {
    fontSize: 12,
    fontStyle: 'italic'
  },
  shelfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'flex-start'
  },
  shelfItem: {
    width: 95,
    alignItems: 'center',
    marginBottom: 10
  },
  cassetteSpine: {
    width: 86,
    height: 125,
    borderRadius: 8,
    borderWidth: 1.5,
    padding: 8,
    justifyContent: 'space-between',
    position: 'relative'
  },
  specialRibbon: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3
  },
  specialRibbonText: {
    color: '#090a0f',
    fontSize: 7,
    fontWeight: '900'
  },
  spineWindow: {
    height: 28,
    backgroundColor: '#0a0d14',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6
  },
  miniSpool: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#f59e0b'
  },
  miniSpoolPlaying: {
    borderColor: '#10b981'
  },
  spineTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 6
  },
  spineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  spineCopyNum: {
    fontSize: 9,
    fontWeight: '800'
  },
  spineLed: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  spineCoverThumbBox: {
    height: 38,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#0a0d14',
    borderWidth: 1,
    borderColor: '#22293a'
  },
  spineCoverThumb: {
    width: '100%',
    height: '100%'
  },
  sleeveCoverContainer: {
    width: '100%',
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0a0d14'
  },
  sleeveCoverImage: {
    width: '100%',
    height: '100%'
  },
  sleeveGroovesOverlay: {
    position: 'absolute',
    right: -20,
    top: 5,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#38bdf8',
    opacity: 0.4
  },
  deckListCoverThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: '#0a0d14',
    borderWidth: 1,
    borderColor: '#242b3d'
  },
  inspectedArtworkWrapper: {
    width: 130,
    height: 130,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 10,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8
  },
  inspectedArtworkImage: {
    width: '100%',
    height: '100%'
  },
  inspectedVinylRim: {
    position: 'absolute',
    inset: 0,
    borderRadius: 14,
    borderWidth: 1.5,
    opacity: 0.8
  },
  vinylSleeveBox: {
    width: 86,
    height: 125,
    borderRadius: 8,
    borderWidth: 1.5,
    padding: 8,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden'
  },
  sleeveGroovesPreview: {
    position: 'absolute',
    right: -25,
    top: 15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0a0d14',
    borderWidth: 3,
    borderColor: '#1e2638',
    opacity: 0.6
  },
  vinylEdgeCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#334155'
  },
  sleeveTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: -0.2
  },
  sleeveArtist: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  sleeveFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sleeveGen: {
    fontSize: 8,
    fontWeight: '800'
  },
  sleeveCond: {
    fontSize: 8,
    fontWeight: '700'
  },
  itemSubText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
    width: '100%'
  },
  shelfBeam: {
    height: 12,
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 10,
    position: 'relative',
    overflow: 'hidden'
  },
  shelfBeamHighlight: {
    height: 2,
    width: '100%'
  },
  listContent: {
    padding: 16,
    paddingBottom: 36,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center'
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600'
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1
  },
  cassetteFrame: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1
  },
  cassetteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  qrPillBtn: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  qrPillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  cassetteBrandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1
  },
  cassetteBrandText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  tapeSideText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  tapeDeckWindow: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginBottom: 14
  },
  spoolWheel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2
  },
  spoolTeeth: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#ffffff',
    opacity: 0.4
  },
  spoolHub: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3
  },
  tapeRibbon: {
    flex: 1,
    height: 8,
    backgroundColor: '#11151f',
    marginHorizontal: 16,
    borderRadius: 4,
    overflow: 'hidden'
  },
  ribbonFill: {
    height: '100%',
    opacity: 0.4
  },
  tapeLabelArea: {
    marginBottom: 14,
    paddingHorizontal: 4
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  tapeBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6
  },
  copyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  copyBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  genBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  genBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  conditionSection: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  conditionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  conditionPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1
  },
  conditionValueText: {
    fontSize: 9,
    fontWeight: '800'
  },
  conditionMeterBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden'
  },
  conditionMeterFill: {
    height: '100%',
    borderRadius: 2
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    alignItems: 'center'
  },
  playBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  playBtnText: {
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8
  },
  actionBtn: {
    flex: 1.5,
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionBtnText: {
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5
  },
  deleteBtn: {
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteBtnText: {
    fontWeight: '900',
    fontSize: 12
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 10, 0.92)',
    justifyContent: 'center',
    padding: 20
  },
  inspectedModalBox: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center'
  },
  inspectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  badgePill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: '800'
  },
  bigCassettePreview: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center'
  },
  inspectedTrackTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center'
  },
  inspectedMeta: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4
  },
  inspectedReelWindow: {
    width: '100%',
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 16
  },
  inspectedReelStatus: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  inspectedTelemetryRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%'
  },
  telemetryCard: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center'
  },
  telemetryLab: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  telemetryVal: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2
  },
  inspectedActions: {
    marginTop: 18,
    gap: 8
  },
  inspectedPlayBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  inspectedPlayText: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.8
  },
  inspectedQrBtn: {
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  inspectedQrText: {
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8
  },
  inspectedOfflineBtn: {
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  inspectedOfflineText: {
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8
  },
  inspectedSubActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  inspectedActionBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  inspectedActionBtnText: {
    fontWeight: '800',
    fontSize: 11
  },
  modalBox: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center'
  },
  modalHeader: {
    marginBottom: 14
  },
  modalBadge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  modalTrackSub: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '700'
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14
  },
  warningNote: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1
  },
  warningNoteTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  warningNoteText: {
    fontSize: 12,
    lineHeight: 18
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 18
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  modalCancelBtn: {
    padding: 12
  },
  modalCancelText: {
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5
  },
  modalConfirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  modalConfirmText: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.8
  },
  modalCloseBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1
  },
  modalCloseText: {
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5
  },
  lineageEmptyBox: {
    padding: 18,
    borderRadius: 10,
    marginVertical: 14
  },
  lineageEmptyTitle: {
    fontSize: 14,
    fontWeight: '800'
  },
  lineageEmptyText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18
  },
  lineageCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  lineageLeftCol: {
    alignItems: 'center',
    width: 28
  },
  lineageStepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  lineageStepText: {
    fontSize: 11,
    fontWeight: '900'
  },
  lineageLine: {
    width: 2,
    flex: 1,
    marginTop: 4
  },
  lineageBody: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1
  },
  lineageTransferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  lineageFrom: {
    fontWeight: '800',
    fontSize: 13
  },
  lineageArrow: {
    fontSize: 12
  },
  lineageTo: {
    fontWeight: '700',
    fontSize: 13
  },
  lineageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6
  },
  genPill: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  genPillText: {
    fontSize: 10,
    fontWeight: '800'
  },
  lineageDate: {
    fontSize: 10
  },
  scrollTopBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8
  },
  scrollTopBtnText: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: -2
  }
});
