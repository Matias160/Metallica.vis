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
import { colors } from '../../theme/colors';

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
      
      // Find artist belonging to current user or first artist if admin
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
        // UPDATE (Modificación)
        await apiRequest(`/tracks/${editingTrack.id}`, {
          method: 'PUT',
          token,
          body: { title, description, audioUrl, licenseType }
        });
        Alert.alert('Pista Actualizada', `"${title}" se modificó correctamente.`);
      } else {
        // CREATE (Alta)
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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Estudio de Artista</Text>
          <Text style={styles.caption}>
            {myArtist ? `Sello: ${myArtist.name} (${myArtist.verified ? '✓ Verificado' : 'Pendiente'})` : 'Panel de Gestión Musical'}
          </Text>
        </View>
        <Pressable style={styles.createBtn} onPress={openCreateTrack}>
          <Text style={styles.createBtnText}>+ Nueva Pista</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trackTitle}>{item.title}</Text>
                  <Text style={styles.artistName}>{item.artist_name} · {item.license_type}</Text>
                  {item.description ? (
                    <Text style={styles.desc}>{item.description}</Text>
                  ) : null}
                </View>
              </View>

              {/* Botones ABML */}
              <View style={styles.actions}>
                <Pressable style={styles.pressingBtn} onPress={() => openCreatePressing(item)}>
                  <Text style={styles.pressingBtnText}>💿 Crear Tirada</Text>
                </Pressable>

                <Pressable style={styles.editBtn} onPress={() => openEditTrack(item)}>
                  <Text style={styles.editBtnText}>✎ Editar</Text>
                </Pressable>

                <Pressable style={styles.deleteBtn} onPress={() => handleDeleteTrack(item)}>
                  <Text style={styles.deleteBtnText}>🗑</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Todavía no cargaste ninguna pista en tu catálogo.</Text>
          }
        />
      )}

      {/* Modal Alta / Edición de Pista */}
      <Modal visible={trackModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                {editingTrack ? 'Modificar Pista' : 'Registrar Nueva Pista'}
              </Text>

              <Text style={styles.label}>Título de la Pista</Text>
              <TextInput
                placeholder="Ej: Master of Magnetic Tapes"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                placeholder="Detalles de la grabación, contexto histórico..."
                placeholderTextColor={colors.muted}
                multiline
                style={[styles.input, { height: 70 }]}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.label}>URL del Audio Máster (MP3)</Text>
              <TextInput
                placeholder="https://ejemplo.com/audio/master.mp3"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={audioUrl}
                onChangeText={setAudioUrl}
              />

              <Text style={styles.label}>Tipo de Licencia</Text>
              <TextInput
                placeholder="original, demo, tape-trade"
                placeholderTextColor={colors.muted}
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
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  style={styles.saveBtn}
                  onPress={saveTrack}
                  disabled={savingTrack}
                >
                  {savingTrack ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingTrack ? 'Guardar Cambios' : 'Publicar Pista'}
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
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Crear Tirada Limitada</Text>
            <Text style={styles.modalDesc}>
              Acuñar copias físicas de "{selectedTrackForPressing?.title}"
            </Text>

            <Text style={styles.label}>Cantidad Total de Copias Físicas</Text>
            <TextInput
              placeholder="10"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              style={styles.input}
              value={totalCopies}
              onChangeText={setTotalCopies}
            />

            <Text style={styles.label}>Límite de Generaciones Permitidas</Text>
            <TextInput
              placeholder="5"
              placeholderTextColor={colors.muted}
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
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={styles.saveBtn}
                onPress={savePressing}
                disabled={savingPressing}
              >
                {savingPressing ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Acuñar Tirada</Text>
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
  container: { flex: 1, backgroundColor: colors.background, padding: 18 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: { color: colors.text, fontSize: 26, fontWeight: '900' },
  caption: { color: colors.accent, fontSize: 13, marginTop: 2, fontWeight: '600' },
  createBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8
  },
  createBtnText: { color: colors.background, fontWeight: '900', fontSize: 13 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  trackTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  artistName: { color: colors.muted, fontSize: 13, marginTop: 2 },
  desc: { color: colors.text, fontSize: 12, marginTop: 8, opacity: 0.8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  pressingBtn: {
    flex: 2,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  pressingBtnText: { color: colors.background, fontWeight: '800', fontSize: 13 },
  editBtn: {
    flex: 1.5,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  editBtnText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  deleteBtn: {
    backgroundColor: '#3f151e',
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteBtnText: { color: colors.danger, fontWeight: '900', fontSize: 14 },
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
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 12 },
  modalDesc: { color: colors.accent, fontSize: 13, marginBottom: 16, fontWeight: '600' },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: '#111115',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  cancelBtn: { padding: 12 },
  cancelBtnText: { color: colors.muted, fontWeight: '700' },
  saveBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8
  },
  saveBtnText: { color: colors.background, fontWeight: '900' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 }
});
