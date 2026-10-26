import { useEffect, useRef, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  Animated, 
  FlatList, 
  Modal, 
  Pressable, 
  RefreshControl, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TextInput, 
  View 
} from 'react-native';
import { Audio } from 'expo-av';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { colors, shadows } from '../../theme/colors';

export default function CollectionScreen() {
  const { token, user } = useAuth();
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playingId, setPlayingId] = useState(null);

  // Dubbing state
  const [dubModalVisible, setDubModalVisible] = useState(false);
  const [selectedCopyForDub, setSelectedCopyForDub] = useState(null);
  const [recipientUserId, setRecipientUserId] = useState('');
  const [dubbing, setDubbing] = useState(false);

  // Lineage state
  const [lineageModalVisible, setLineageModalVisible] = useState(false);
  const [lineageData, setLineageData] = useState([]);
  const [loadingLineage, setLoadingLineage] = useState(false);
  const [selectedCopyForLineage, setSelectedCopyForLineage] = useState(null);

  const soundRef = useRef(null);
  const spin = useRef(new Animated.Value(0)).current;

  async function reload() {
    try {
      const data = await apiRequest('/collection', { token });
      setCopies(data.copies || []);
    } catch (e) {
      console.warn('Error loading collection:', e);
    }
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  async function play(copy) {
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const data = await apiRequest(`/copies/${copy.id}/play`, { method: 'POST', token });
      
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: copy.audio_url });
        soundRef.current = sound;
        setPlayingId(copy.id);
        Animated.loop(
          Animated.timing(spin, { toValue: 1, duration: 1800, useNativeDriver: true })
        ).start();
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setPlayingId(null);
            soundRef.current = null;
          }
        });
      } catch (audioErr) {
        console.warn('Reproducción simulada (sin audio remoto disponible):', audioErr.message);
      }

      Alert.alert(
        'Reproducción Registrada',
        `Pista: ${copy.track_title}\nDegradación física y sonora: -${data.degradationApplied}%\nCondición actual de la cinta: ${data.conditionValue}%`
      );
      await reload();
    } catch (error) {
      Alert.alert('No se pudo reproducir', error.message);
    }
  }

  function openDubModal(copy) {
    setSelectedCopyForDub(copy);
    setRecipientUserId('');
    setDubModalVisible(true);
  }

  async function executeDub() {
    if (!recipientUserId.trim()) {
      Alert.alert('Atención', 'Ingresá el ID numérico del usuario destinatario.');
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
      Alert.alert(
        '¡Cinta Dubbeada!',
        `Tu copia original #${selectedCopyForDub.copy_number} quedó archivada como transferida.\nLa nueva copia hija (Generación ${res.generation}) ya pertenece al usuario #${recipientUserId}.`
      );
      await reload();
    } catch (error) {
      Alert.alert('Error al dubbear', error.message);
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
      Alert.alert('Error de linaje', error.message);
    } finally {
      setLoadingLineage(false);
    }
  }

  async function handleDelete(copy) {
    Alert.alert(
      'Archivar Cinta',
      `¿Deseás archivar y quitar la copia #${copy.copy_number} de "${copy.track_title}" de tu colección activa?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(`/copies/${copy.id}`, { method: 'DELETE', token });
              Alert.alert('Copia archivada', 'La cinta fue retirada de tu colección activa.');
              await reload();
            } catch (err) {
              Alert.alert('Error al remover', err.message);
            }
          }
        }
      ]
    );
  }

  const rotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Mi Colección</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{copies.length} CINTAS ACTIVAS</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Copias en tu poder físico. Cada reproducción aplica desgaste; cada dubbeo crea linaje.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>Accediendo a tu estantería magnética...</Text>
        </View>
      ) : (
        <FlatList
          data={copies}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderItem={({ item }) => {
            const isPlaying = playingId === item.id;
            const cond = item.condition_value;
            const condColor = cond > 75 ? colors.success : cond > 40 ? colors.warning : colors.danger;
            const condBg = cond > 75 ? colors.successMuted : cond > 40 ? colors.warningMuted : colors.dangerMuted;
            const condBorder = cond > 75 ? colors.successBorder : cond > 40 ? colors.warningBorder : colors.dangerBorder;

            return (
              <View style={[styles.card, shadows.sm]}>
                <View style={styles.cardMain}>
                  {/* Artefacto Mini-Vinilo / Casete animado */}
                  <View style={styles.cassetteSlot}>
                    <Animated.View style={[styles.miniVinyl, isPlaying && { transform: [{ rotate: rotation }] }]}>
                      <View style={styles.vinylGroove} />
                      <View style={styles.miniLabel}>
                        <Text style={styles.miniLabelText}>MV</Text>
                      </View>
                    </Animated.View>
                  </View>

                  {/* Metadatos y Barra de Condición */}
                  <View style={styles.copyDetails}>
                    <Text style={styles.trackTitle}>{item.track_title}</Text>
                    
                    <View style={styles.metaBadgeRow}>
                      <View style={styles.copyNumberBadge}>
                        <Text style={styles.copyNumberText}>COPIA #{item.copy_number}</Text>
                      </View>
                      <View style={styles.genBadge}>
                        <Text style={styles.genText}>GEN {item.generation}</Text>
                      </View>
                    </View>

                    {/* Barra de progreso de condición física */}
                    <View style={styles.conditionContainer}>
                      <View style={styles.conditionLabels}>
                        <Text style={styles.conditionTitle}>CONDICIÓN FÍSICA</Text>
                        <View style={[styles.conditionPill, { backgroundColor: condBg, borderColor: condBorder }]}>
                          <Text style={[styles.conditionPercent, { color: condColor }]}>
                            {cond}% {cond <= 40 ? '· CRÍTICA' : cond <= 75 ? '· DESGASTADA' : '· ÓPTIMA'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.progressBarBackground}>
                        <View 
                          style={[
                            styles.progressBarFill, 
                            { width: `${Math.max(4, Math.min(100, cond))}%`, backgroundColor: condColor }
                          ]} 
                        />
                      </View>

                      <Text style={styles.playCountText}>
                        {item.playback_count} reproducciones en cabezal
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Botones de acción operativa */}
                <View style={styles.actionRow}>
                  <Pressable 
                    style={({ pressed }) => [
                      styles.playBtn, 
                      isPlaying && styles.playBtnActive,
                      pressed && { opacity: 0.85 }
                    ]} 
                    onPress={() => play(item)}
                  >
                    <Text style={styles.playBtnText}>{isPlaying ? '❚❚ REPRODUCIENDO' : '▶ REPRODUCIR'}</Text>
                  </Pressable>

                  <Pressable 
                    style={({ pressed }) => [
                      styles.actionSecondaryBtn,
                      pressed && { backgroundColor: colors.surfaceHover }
                    ]} 
                    onPress={() => openDubModal(item)}
                  >
                    <Text style={styles.actionSecondaryText}>📼 DUBBEAR</Text>
                  </Pressable>

                  <Pressable 
                    style={({ pressed }) => [
                      styles.actionSecondaryBtn,
                      pressed && { backgroundColor: colors.surfaceHover }
                    ]} 
                    onPress={() => openLineage(item)}
                  >
                    <Text style={styles.actionSecondaryText}>📜 LINAJE</Text>
                  </Pressable>

                  <Pressable 
                    style={({ pressed }) => [
                      styles.deleteBtn,
                      pressed && { backgroundColor: '#4a1921' }
                    ]} 
                    onPress={() => handleDelete(item)}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>Tu colección está vacía</Text>
              <Text style={styles.emptySub}>
                Ingresá a la pestaña "Catálogo" para adquirir tu primera cinta física limitada y comenzar a escucharla o dubbearla.
              </Text>
            </View>
          }
        />
      )}

      {/* Modal Dubbear */}
      <Modal visible={dubModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, shadows.md]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalBadge}>TAPE TRADING</Text>
              <Text style={styles.modalTitle}>Grabar Copia (Dubbeo)</Text>
            </View>

            <Text style={styles.modalDesc}>
              Vas a grabar en una cinta virgen la pista "{selectedCopyForDub?.track_title}" (Copia #{selectedCopyForDub?.copy_number}).
            </Text>

            <View style={styles.warningNote}>
              <Text style={styles.warningNoteTitle}>REGLAS DEL SISTEMA ANALÓGICO:</Text>
              <Text style={styles.warningNoteText}>
                • Tu copia original quedará marcada como <Text style={{ color: colors.warning }}>Transferida</Text>.{'\n'}
                • El destinatario recibirá la <Text style={{ color: colors.accent }}>Generación {(selectedCopyForDub?.generation || 0) + 1}</Text>.{'\n'}
                • Se registrará una nueva entrada histórica en la cadena de linaje.
              </Text>
            </View>

            <Text style={styles.inputLabel}>ID NUMÉRICO DEL USUARIO DESTINATARIO</Text>
            <TextInput
              placeholder="Ej: 2 (el ID figura en su Perfil)"
              placeholderTextColor={colors.mutedDark}
              keyboardType="number-pad"
              style={styles.modalInput}
              value={recipientUserId}
              onChangeText={setRecipientUserId}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setDubModalVisible(false)}
                disabled={dubbing}
              >
                <Text style={styles.modalCancelText}>CANCELAR</Text>
              </Pressable>

              <Pressable
                style={[styles.modalConfirmBtn, dubbing && { opacity: 0.6 }]}
                onPress={executeDub}
                disabled={dubbing}
              >
                {dubbing ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>CONFIRMAR DUBBEO</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Linaje */}
      <Modal visible={lineageModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '80%' }, shadows.md]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalBadge}>CADENA DE CUSTODIA</Text>
              <Text style={styles.modalTitle}>Linaje Histórico</Text>
              <Text style={styles.modalTrackSub}>
                {selectedCopyForLineage?.track_title} · Copia #{selectedCopyForLineage?.copy_number}
              </Text>
            </View>

            {loadingLineage ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator color={colors.accent} size="large" />
                <Text style={{ color: colors.muted, marginTop: 10, fontSize: 13 }}>Recuperando registros...</Text>
              </View>
            ) : lineageData.length === 0 ? (
              <View style={styles.lineageEmptyBox}>
                <Text style={styles.lineageEmptyTitle}>Copia Original Directa (Gen 0)</Text>
                <Text style={styles.lineageEmptyText}>
                  Esta cinta fue prensada en fábrica y no posee traspasos previos. Si la dubbeás a otro usuario, se inaugurará su árbol genealógico.
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
                      <View style={styles.lineageStepCircle}>
                        <Text style={styles.lineageStepText}>{index + 1}</Text>
                      </View>
                      {index < lineageData.length - 1 && <View style={styles.lineageLine} />}
                    </View>

                    <View style={styles.lineageBody}>
                      <View style={styles.lineageTransferRow}>
                        <Text style={styles.lineageFrom}>{item.from_user_name}</Text>
                        <Text style={styles.lineageArrow}>➔</Text>
                        <Text style={styles.lineageTo}>{item.to_user_name}</Text>
                      </View>

                      <View style={styles.lineageMetaRow}>
                        <View style={styles.genPill}>
                          <Text style={styles.genPillText}>Gen {item.generation}</Text>
                        </View>
                        <Text style={styles.lineageDate}>
                          {new Date(item.transferred_at).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              />
            )}

            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setLineageModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>VOLVER A COLECCIÓN</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.backgroundElevated
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  badgeCount: {
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgeCountText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    maxWidth: 680,
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
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  cassetteSlot: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center'
  },
  miniVinyl: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1b1b20',
    borderWidth: 4,
    borderColor: '#0a0a0c',
    justifyContent: 'center',
    alignItems: 'center'
  },
  vinylGroove: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2d2d35',
    opacity: 0.5
  },
  miniLabel: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center'
  },
  miniLabelText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.background
  },
  copyDetails: {
    flex: 1
  },
  trackTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  metaBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    marginBottom: 8
  },
  copyNumberBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  copyNumberText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800'
  },
  genBadge: {
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  genText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800'
  },
  conditionContainer: {
    marginTop: 2
  },
  conditionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  conditionTitle: {
    color: colors.muted,
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
  conditionPercent: {
    fontSize: 10,
    fontWeight: '800'
  },
  progressBarBackground: {
    height: 5,
    backgroundColor: colors.surfaceDark,
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3
  },
  playCountText: {
    color: colors.mutedDark,
    fontSize: 10,
    marginTop: 4
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    alignItems: 'center'
  },
  playBtn: {
    flex: 2,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  playBtnActive: {
    backgroundColor: '#86efac'
  },
  playBtnText: {
    color: colors.background,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5
  },
  actionSecondaryBtn: {
    flex: 1.6,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionSecondaryText: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5
  },
  deleteBtn: {
    backgroundColor: colors.dangerMuted,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteBtnText: {
    color: colors.danger,
    fontWeight: '900',
    fontSize: 13
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  emptySub: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center'
  },
  modalHeader: { marginBottom: 12 },
  modalBadge: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  modalTrackSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2, fontWeight: '600' },
  modalDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  warningNote: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  warningNoteTitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4
  },
  warningNoteText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18
  },
  inputLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  modalInput: {
    backgroundColor: colors.surfaceDark,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  modalCancelBtn: { padding: 12 },
  modalCancelText: { color: colors.muted, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  modalConfirmBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  modalConfirmText: { color: colors.background, fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  modalCloseBtn: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  modalCloseText: { color: colors.text, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  lineageEmptyBox: {
    backgroundColor: colors.surfaceDark,
    padding: 18,
    borderRadius: 10,
    marginVertical: 14
  },
  lineageEmptyTitle: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  lineageEmptyText: { color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
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
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center'
  },
  lineageStepText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '900'
  },
  lineageLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 4
  },
  lineageBody: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  lineageTransferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  lineageFrom: { color: colors.text, fontWeight: '800', fontSize: 13 },
  lineageArrow: { color: colors.accent, fontSize: 12 },
  lineageTo: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  lineageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6
  },
  genPill: {
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  genPillText: { color: colors.accent, fontSize: 10, fontWeight: '800' },
  lineageDate: { color: colors.mutedDark, fontSize: 10 }
});
