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
import { colors } from '../../theme/colors';

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
        console.warn('Reproducción simulada (sin audio remoto):', audioErr.message);
      }

      Alert.alert(
        'Reproducción Registrada',
        `Pista: ${copy.track_title}\nDegradación sonora y física aplicada: -${data.degradationApplied}%\nCondición actual de la cinta: ${data.conditionValue}%`
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
        `La copia original quedó registrada como transferida. La nueva copia hija (Generación ${res.generation}) ya pertenece al usuario destinatario.`
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
      'Remover de Colección',
      `¿Deseás archivar y quitar la copia #${copy.copy_number} de "${copy.track_title}" de tu colección activa?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(`/copies/${copy.id}`, { method: 'DELETE', token });
              Alert.alert('Copia removida', 'La copia fue retirada de tu colección.');
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
      <View style={styles.header}>
        <Text style={styles.title}>Mi Colección</Text>
        <Text style={styles.caption}>Cintas en tu poder, listas para tocar o intercambiar</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={copies}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderItem={({ item }) => {
            const isPlaying = playingId === item.id;
            const condColor = item.condition_value > 70 ? colors.accent : item.condition_value > 40 ? '#facc15' : colors.danger;

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Animated.View style={[styles.miniVinyl, isPlaying && { transform: [{ rotate: rotation }] }]}>
                    <Text style={styles.miniLabel}>MV</Text>
                  </Animated.View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.trackTitle}>{item.track_title}</Text>
                    <Text style={styles.copyMeta}>
                      Copia #{item.copy_number} · Generación {item.generation}
                    </Text>
                    <View style={styles.conditionRow}>
                      <Text style={styles.conditionLabel}>Condición:</Text>
                      <Text style={[styles.conditionValue, { color: condColor }]}>
                        {item.condition_value}%
                      </Text>
                      <Text style={styles.playCount}>({item.playback_count} reproducciones)</Text>
                    </View>
                  </View>
                </View>

                {/* Botones de acción (CRUD & Operaciones) */}
                <View style={styles.actions}>
                  <Pressable style={styles.playBtn} onPress={() => play(item)}>
                    <Text style={styles.playBtnText}>{isPlaying ? 'Sonando...' : '▶ Tocar'}</Text>
                  </Pressable>

                  <Pressable style={styles.dubBtn} onPress={() => openDubModal(item)}>
                    <Text style={styles.dubBtnText}>📼 Dubbear</Text>
                  </Pressable>

                  <Pressable style={styles.lineageBtn} onPress={() => openLineage(item)}>
                    <Text style={styles.lineageBtnText}>📜 Linaje</Text>
                  </Pressable>

                  <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tu colección todavía está vacía.</Text>
              <Text style={styles.emptySubText}>
                Explorá el catálogo en la pestaña "Inicio" y adquirí tu primera cinta física.
              </Text>
            </View>
          }
        />
      )}

      {/* Modal para Dubbear */}
      <Modal visible={dubModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Dubbear Cinta</Text>
            <Text style={styles.modalDesc}>
              Vas a grabar y enviar una nueva generación de "{selectedCopyForDub?.track_title}" (Copia #{selectedCopyForDub?.copy_number}).
            </Text>
            <Text style={styles.modalHint}>
              Tu copia quedará como transferida y el destinatario recibirá la siguiente generación con desgaste sonoro natural.
            </Text>

            <TextInput
              placeholder="ID del usuario destinatario (ej: 2)"
              placeholderTextColor={colors.muted}
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
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmBtn}
                onPress={executeDub}
                disabled={dubbing}
              >
                {dubbing ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirmar Dubbeo</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Linaje */}
      <Modal visible={lineageModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '75%' }]}>
            <Text style={styles.modalTitle}>Cadena de Linaje</Text>
            <Text style={styles.modalDesc}>
              Pista: {selectedCopyForLineage?.track_title} · Copia #{selectedCopyForLineage?.copy_number}
            </Text>

            {loadingLineage ? (
              <ActivityIndicator color={colors.accent} style={{ marginVertical: 30 }} />
            ) : lineageData.length === 0 ? (
              <Text style={styles.lineageEmpty}>
                Esta es la copia original (Gen 0) de la tirada. Todavía no ha sido transferida.
              </Text>
            ) : (
              <FlatList
                data={lineageData}
                keyExtractor={(item) => String(item.id)}
                style={{ marginVertical: 12 }}
                renderItem={({ item, index }) => (
                  <View style={styles.lineageItem}>
                    <View style={styles.lineageNode}>
                      <Text style={styles.lineageNodeText}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lineageUsers}>
                        {item.from_user_name} ➔ {item.to_user_name}
                      </Text>
                      <Text style={styles.lineageMeta}>
                        Generación {item.generation} · {new Date(item.transferred_at).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}

            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setLineageModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cerrar Linaje</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 18 },
  header: { marginBottom: 16 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  caption: { color: colors.muted, fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  miniVinyl: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#202024',
    borderWidth: 6,
    borderColor: '#0d0d10',
    justifyContent: 'center',
    alignItems: 'center'
  },
  miniLabel: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    textAlign: 'center',
    paddingTop: 4,
    fontSize: 9,
    fontWeight: '900'
  },
  trackTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  copyMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  conditionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  conditionLabel: { color: colors.muted, fontSize: 12 },
  conditionValue: { fontWeight: '800', fontSize: 13 },
  playCount: { color: colors.muted, fontSize: 11 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center' },
  playBtn: {
    flex: 2,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  playBtnText: { color: colors.background, fontWeight: '800', fontSize: 13 },
  dubBtn: {
    flex: 2,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  dubBtnText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  lineageBtn: {
    flex: 1.5,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  lineageBtnText: { color: colors.muted, fontWeight: '600', fontSize: 12 },
  deleteBtn: {
    backgroundColor: '#38161c',
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  deleteBtnText: { color: colors.danger, fontWeight: '900', fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
  emptyText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  emptySubText: { color: colors.muted, textAlign: 'center', marginTop: 8, fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  modalDesc: { color: colors.accent, fontSize: 14, marginTop: 4, fontWeight: '600' },
  modalHint: { color: colors.muted, fontSize: 12, marginTop: 8, lineHeight: 16 },
  modalInput: {
    backgroundColor: '#111115',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 16
  },
  modalButtons: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  modalCancelBtn: { padding: 12 },
  modalCancelText: { color: colors.muted, fontWeight: '700' },
  modalConfirmBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8
  },
  modalConfirmText: { color: colors.background, fontWeight: '800' },
  modalCloseBtn: {
    backgroundColor: colors.surfaceLight,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12
  },
  modalCloseText: { color: colors.text, fontWeight: '700' },
  lineageEmpty: { color: colors.muted, marginVertical: 20, textAlign: 'center', fontStyle: 'italic' },
  lineageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111115',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10
  },
  lineageNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center'
  },
  lineageNodeText: { color: colors.background, fontWeight: '900', fontSize: 11 },
  lineageUsers: { color: colors.text, fontWeight: '700', fontSize: 13 },
  lineageMeta: { color: colors.muted, fontSize: 11, marginTop: 2 }
});
