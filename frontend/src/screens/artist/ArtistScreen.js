import { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  FlatList, 
  Modal, 
  Pressable, 
  RefreshControl, 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  View 
} from 'react-native';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { colors, shadows } from '../../theme/colors';

export default function ArtistScreen() {
  const { token, user } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [myArtist, setMyArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal para Crear / Editar Pista
  const [trackModalVisible, setTrackModalVisible] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [licenseType, setLicenseType] = useState('original');
  const [savingTrack, setSavingTrack] = useState(false);

  // Modal para Crear Tirada (Pressing)
  const [pressingModalVisible, setPressingModalVisible] = useState(false);
  const [selectedTrackForPressing, setSelectedTrackForPressing] = useState(null);
  const [totalCopies, setTotalCopies] = useState('10');
  const [generationLimit, setGenerationLimit] = useState('5');
  const [savingPressing, setSavingPressing] = useState(false);

  async function loadData() {
    try {
      const [artistData, trackData] = await Promise.all([
        apiRequest('/artists', { token }),
        apiRequest('/tracks', { token })
      ]);
      setArtists(artistData.artists || []);
      setTracks(trackData.tracks || []);
      
      const found = (artistData.artists || []).find(a => a.owner_user_id === user?.id) || artistData.artists?.[0];
      setMyArtist(found || null);
    } catch (err) {
      console.warn('Error cargando estudio:', err);
    }
  }

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [token]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function openCreateTrack() {
    setEditingTrack(null);
    setTitle('');
    setDescription('');
    setAudioUrl('https://example.com/audio/master-tape.mp3');
    setLicenseType('original');
    setTrackModalVisible(true);
  }

  function openEditTrack(track) {
    setEditingTrack(track);
    setTitle(track.title);
    setDescription(track.description || '');
    setAudioUrl(track.audio_url || '');
    setLicenseType(track.license_type || 'original');
    setTrackModalVisible(true);
  }

  async function saveTrack() {
    if (!title.trim() || !audioUrl.trim()) {
      Alert.alert('Datos requeridos', 'Título y URL de audio son obligatorios.');
      return;
    }
    if (!myArtist) {
      Alert.alert('Atención', 'Necesitás tener un perfil de artista activo y verificado.');
      return;
    }

    try {
      setSavingTrack(true);
      if (editingTrack) {
        await apiRequest(`/tracks/${editingTrack.id}`, {
          method: 'PUT',
          token,
          body: { title, description, audioUrl, licenseType }
        });
        Alert.alert('Pista Actualizada', `"${title}" se modificó correctamente.`);
      } else {
        await apiRequest('/tracks', {
          method: 'POST',
          token,
          body: { artistId: myArtist.id, title, description, audioUrl, licenseType }
        });
        Alert.alert('Pista Creada', `"${title}" fue registrada en el máster.`);
      }
      setTrackModalVisible(false);
      await loadData();
    } catch (err) {
      Alert.alert('Error al guardar pista', err.message);
    } finally {
      setSavingTrack(false);
    }
  }

  async function handleDeleteTrack(track) {
    Alert.alert(
      'Eliminar Pista (Baja)',
      `¿Confirmás eliminar "${track.title}" del catálogo? Solo es posible si no posee copias en circulación.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(`/tracks/${track.id}`, { method: 'DELETE', token });
              Alert.alert('Pista eliminada', 'La pista fue removida del catálogo.');
              await loadData();
            } catch (err) {
              Alert.alert('No se pudo eliminar', err.message);
            }
          }
        }
      ]
    );
  }

  function openCreatePressing(track) {
    setSelectedTrackForPressing(track);
    setTotalCopies('10');
    setGenerationLimit('5');
    setPressingModalVisible(true);
  }

  async function savePressing() {
    const copiesNum = parseInt(totalCopies, 10);
    const genNum = parseInt(generationLimit, 10);
    if (isNaN(copiesNum) || copiesNum < 1) {
      Alert.alert('Atención', 'Ingresá una cantidad válida de copias.');
      return;
    }

    try {
      setSavingPressing(true);
      const res = await apiRequest('/pressings', {
        method: 'POST',
        token,
        body: {
          trackId: selectedTrackForPressing.id,
          totalCopies: copiesNum,
          generationLimit: genNum || 5
        }
      });
      setPressingModalVisible(false);
      Alert.alert(
        '¡Tirada Creada!',
        `Se acuñaron ${res.copiesCreated} copias físicas para "${selectedTrackForPressing.title}". Ahora están disponibles en el Catálogo.`
      );
      await loadData();
    } catch (err) {
      Alert.alert('Error creando tirada', err.message);
    } finally {
      setSavingPressing(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Superior */}
      <View style={styles.topBar}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Estudio Artista</Text>
          <View style={styles.labelBadgeRow}>
            <Text style={styles.selloLabel}>SELLO ACTIVO:</Text>
            <Text style={styles.selloName}>{myArtist?.name || 'Sello de Producción'}</Text>
            {myArtist?.verified ? (
              <View style={styles.verifiedTag}>
                <Text style={styles.verifiedText}>✓ Verificado</Text>
              </View>
            ) : (
              <View style={styles.pendingTag}>
                <Text style={styles.pendingText}>Pendiente</Text>
              </View>
            )}
          </View>
        </View>

        <Pressable 
          style={({ pressed }) => [
            styles.createBtn,
            shadows.glowAccent,
            pressed && { backgroundColor: colors.accentHover }
          ]} 
          onPress={openCreateTrack}
        >
          <Text style={styles.createBtnText}>+ NUEVA PISTA</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>Cargando catálogo del artista...</Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderItem={({ item }) => (
            <View style={[styles.card, shadows.sm]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trackTitle}>{item.title}</Text>
                  <Text style={styles.artistName}>
                    {item.artist_name} · <Text style={{ color: colors.textSecondary }}>{item.license_type}</Text>
                  </Text>
                  {item.description ? (
                    <Text style={styles.desc}>{item.description}</Text>
                  ) : null}
                </View>
              </View>

              {/* Botones ABML */}
              <View style={styles.actions}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.pressingBtn,
                    pressed && { backgroundColor: colors.accentHover }
                  ]} 
                  onPress={() => openCreatePressing(item)}
                >
                  <Text style={styles.pressingBtnText}>💿 CREAR TIRADA</Text>
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [
                    styles.editBtn,
                    pressed && { backgroundColor: colors.surfaceHover }
                  ]} 
                  onPress={() => openEditTrack(item)}
                >
                  <Text style={styles.editBtnText}>✎ EDITAR</Text>
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    pressed && { backgroundColor: '#4a1921' }
                  ]} 
                  onPress={() => handleDeleteTrack(item)}
                >
                  <Text style={styles.deleteBtnText}>🗑</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎙</Text>
              <Text style={styles.emptyTitle}>Sin grabaciones en tu sello</Text>
              <Text style={styles.emptySub}>
                Tocá "+ Nueva Pista" para registrar tu primera canción y luego acuñar tiradas de casetes para los coleccionistas.
              </Text>
            </View>
          }
        />
      )}

      {/* Modal Alta / Edición de Pista */}
      <Modal visible={trackModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.modalBox, shadows.md]}>
              <Text style={styles.modalBadge}>GESTIÓN DE CATÁLOGO (ABML)</Text>
              <Text style={styles.modalTitle}>
                {editingTrack ? 'Modificar Canción' : 'Alta de Nueva Canción'}
              </Text>

              <Text style={styles.inputLabel}>TÍTULO DE LA PISTA</Text>
              <TextInput
                placeholder="Ej: Master of Magnetic Tapes"
                placeholderTextColor={colors.mutedDark}
                style={styles.input}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>DESCRIPCIÓN O CONTEXTO HISTÓRICO</Text>
              <TextInput
                placeholder="Detalles de la grabación en vivo, consola analógica..."
                placeholderTextColor={colors.mutedDark}
                multiline
                style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.inputLabel}>URL DEL AUDIO MÁSTER (MP3)</Text>
              <TextInput
                placeholder="https://ejemplo.com/audio/master.mp3"
                placeholderTextColor={colors.mutedDark}
                style={styles.input}
                value={audioUrl}
                onChangeText={setAudioUrl}
              />

              <Text style={styles.inputLabel}>TIPO DE LICENCIA (ORIGINAL / DEMO / TAPE-TRADE)</Text>
              <TextInput
                placeholder="original, demo, tape-trade"
                placeholderTextColor={colors.mutedDark}
                style={styles.input}
                value={licenseType}
                onChangeText={setLicenseType}
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setTrackModalVisible(false)}
                  disabled={savingTrack}
                >
                  <Text style={styles.cancelBtnText}>CANCELAR</Text>
                </Pressable>

                <Pressable
                  style={[styles.saveBtn, savingTrack && { opacity: 0.6 }]}
                  onPress={saveTrack}
                  disabled={savingTrack}
                >
                  {savingTrack ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingTrack ? 'GUARDAR CAMBIOS' : 'PUBLICAR EN MÁSTER'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Crear Tirada */}
      <Modal visible={pressingModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, shadows.md]}>
            <Text style={styles.modalBadge}>ACUÑACIÓN FÍSICA</Text>
            <Text style={styles.modalTitle}>Crear Tirada Limitada</Text>
            <Text style={styles.modalTrackSub}>
              Pista seleccionada: "{selectedTrackForPressing?.title}"
            </Text>

            <Text style={styles.inputLabel}>CANTIDAD TOTAL DE COPIAS FÍSICAS</Text>
            <TextInput
              placeholder="10"
              placeholderTextColor={colors.mutedDark}
              keyboardType="number-pad"
              style={styles.input}
              value={totalCopies}
              onChangeText={setTotalCopies}
            />

            <Text style={styles.inputLabel}>LÍMITE MÁXIMO DE GENERACIONES DUBBEO</Text>
            <TextInput
              placeholder="5"
              placeholderTextColor={colors.mutedDark}
              keyboardType="number-pad"
              style={styles.input}
              value={generationLimit}
              onChangeText={setGenerationLimit}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setPressingModalVisible(false)}
                disabled={savingPressing}
              >
                <Text style={styles.cancelBtnText}>CANCELAR</Text>
              </Pressable>

              <Pressable
                style={[styles.saveBtn, savingPressing && { opacity: 0.6 }]}
                onPress={savePressing}
                disabled={savingPressing}
              >
                {savingPressing ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>ACUÑAR TIRADA</Text>
                )}
              </Pressable>
            </View>
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
    backgroundColor: colors.backgroundElevated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  headerInfo: { flex: 1 },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  labelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap'
  },
  selloLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  selloName: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700'
  },
  verifiedTag: {
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: colors.successBorder,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  verifiedText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: '800'
  },
  pendingTag: {
    backgroundColor: colors.warningMuted,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  pendingText: {
    color: colors.warning,
    fontSize: 9,
    fontWeight: '800'
  },
  createBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8
  },
  createBtnText: {
    color: colors.background,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8
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
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  trackTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  artistName: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600'
  },
  desc: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle
  },
  pressingBtn: {
    flex: 2,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressingBtnText: {
    color: colors.background,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5
  },
  editBtn: {
    flex: 1.5,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  editBtnText: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5
  },
  deleteBtn: {
    backgroundColor: colors.dangerMuted,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteBtnText: {
    color: colors.danger,
    fontWeight: '900',
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20
  },
  modalScroll: { flexGrow: 1, justifyContent: 'center' },
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
  modalBadge: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  modalTrackSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    fontWeight: '600'
  },
  inputLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 6
  },
  input: {
    backgroundColor: colors.surfaceDark,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20
  },
  cancelBtn: { padding: 12 },
  cancelBtnText: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5
  },
  saveBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  saveBtnText: {
    color: colors.background,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5
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
  }
});
