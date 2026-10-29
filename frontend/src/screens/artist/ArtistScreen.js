// Estudio de artista: ABML de catálogo, subida de archivos de audio locales, presets y acuñación de tiradas.
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
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
import { useFeedback } from '../../context/FeedbackContext';
import { useTheme } from '../../context/ThemeContext';
import { shadows } from '../../theme/colors';

// Presets de demostración de audio máster analógico
const AUDIO_PRESETS = [
  {
    id: 'p1',
    name: 'Soundboard Master Reel (1983 Demo Tape)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    desc: 'Cinta directa de consola de mezclas, sin compresión digital.'
  },
  {
    id: 'p2',
    name: 'Studio 24-Track Multitrack (1984 Raw Mix)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    desc: 'Toma cruda de ensayo en cinta Chrome Type II.'
  },
  {
    id: 'p3',
    name: 'Live Roskilde Festival Soundboard (1986 Master)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    desc: 'Grabación de audio en vivo con acústica de escenario analógica.'
  }
];

export default function ArtistScreen() {
  const { token, user } = useAuth();
  const { palette, isDark, toggleTheme } = useTheme();
  const { notify } = useFeedback();

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
  const [coverUrl, setCoverUrl] = useState('');
  const [licenseType, setLicenseType] = useState('original');
  const [savingTrack, setSavingTrack] = useState(false);

  // Métodos de subida de música: 'upload', 'url', 'presets'
  const [uploadSourceMode, setUploadSourceMode] = useState('upload');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState('');

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

      const found =
        (artistData.artists || []).find((a) => a.owner_user_id === user?.id) ||
        artistData.artists?.[0];
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
    setAudioUrl('');
    setCoverUrl('');
    setLicenseType('original');
    setUploadedFileName('');
    setUploadedFileSize('');
    setUploadSourceMode('upload');
    setTrackModalVisible(true);
  }

  function openEditTrack(track) {
    setEditingTrack(track);
    setTitle(track.title);
    setDescription(track.description || '');
    setAudioUrl(track.audio_url || '');
    setCoverUrl(track.cover_url || '');
    setLicenseType(track.license_type || 'original');
    setUploadedFileName('');
    setUploadedFileSize('');
    setUploadSourceMode('url');
    setTrackModalVisible(true);
  }

  // Manejador para subir archivos de audio locales directamente desde la máquina o dispositivo
  function handleSelectLocalAudioFile() {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          setUploadingAudio(true);
          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
          setUploadedFileName(file.name);
          setUploadedFileSize(`${sizeMB} MB`);

          // Leer archivo como Base64
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
            try {
              const base64Data = reader.result;
              const res = await apiRequest('/upload', {
                method: 'POST',
                body: {
                  filename: file.name,
                  base64: base64Data,
                  mimeType: file.type || 'audio/mpeg'
                }
              });

              setAudioUrl(res.url);
              if (!title) {
                // Auto-rellenar título con nombre de archivo limpio
                const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
                setTitle(cleanName);
              }

              notify('Audio subido exitosamente', `Archivo listo: ${file.name} (${sizeMB} MB).`, 'success');
            } catch (uploadErr) {
              notify('Error al subir audio', uploadErr.message, 'error');
            } finally {
              setUploadingAudio(false);
            }
          };
        } catch (err) {
          setUploadingAudio(false);
          notify('Error de lectura', err.message, 'error');
        }
      };

      input.click();
    } else {
      // En entorno móvil nativo se ofrece el selector o preset
      notify('Selector Móvil', 'Seleccionando preset o enlace remoto de audio.', 'info');
      setUploadSourceMode('presets');
    }
  }

  // Manejador para subir imagen de portada / carátula
  function handleSelectCoverImage() {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
            const res = await apiRequest('/upload', {
              method: 'POST',
              body: {
                filename: file.name,
                base64: reader.result,
                mimeType: file.type || 'image/jpeg'
              }
            });
            setCoverUrl(res.url);
            notify('Arte de tapa subido', `Carátula guardada: ${file.name}.`, 'success');
          };
        } catch (err) {
          notify('Error al subir carátula', err.message, 'error');
        }
      };

      input.click();
    }
  }

  async function saveTrack() {
    if (!title.trim() || !audioUrl.trim()) {
      notify('Datos requeridos', 'Título y Audio (archivo subido o URL) son obligatorios.', 'warning');
      return;
    }
    if (!myArtist) {
      notify('Perfil pendiente', 'Necesitás un perfil de artista activo.', 'warning');
      return;
    }

    try {
      setSavingTrack(true);
      if (editingTrack) {
        await apiRequest(`/tracks/${editingTrack.id}`, {
          method: 'PUT',
          token,
          body: { title, description, audioUrl, coverUrl, licenseType }
        });
        notify('Pista actualizada', `“${title}” se modificó correctamente.`, 'success');
      } else {
        await apiRequest('/tracks', {
          method: 'POST',
          token,
          body: {
            artistId: myArtist.id,
            title,
            description,
            audioUrl,
            coverUrl,
            licenseType
          }
        });
        notify('Pista creada', `“${title}” fue registrada en el máster oficial.`, 'success');
      }
      setTrackModalVisible(false);
      await loadData();
    } catch (err) {
      notify('No se pudo guardar la pista', err.message, 'error');
    } finally {
      setSavingTrack(false);
    }
  }

  async function handleDeleteTrack(track) {
    try {
      await apiRequest(`/tracks/${track.id}`, { method: 'DELETE', token });
      notify('Pista eliminada', `“${track.title}” fue removida del catálogo.`, 'info');
      await loadData();
    } catch (err) {
      notify('No se pudo eliminar la pista', err.message, 'error');
    }
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
      notify('Cantidad inválida', 'Ingresá una cantidad válida de copias.', 'warning');
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
      notify(
        'Tirada acuñada',
        `Se crearon ${res.copiesCreated} copias físicas para “${selectedTrackForPressing.title}”.`,
        'success'
      );
      await loadData();
    } catch (err) {
      notify('No se pudo acuñar la tirada', err.message, 'error');
    } finally {
      setSavingPressing(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Consola de Grabación Superior con Conmutador Día/Noche */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: palette.backgroundElevated, borderBottomColor: palette.borderSubtle }
        ]}
      >
        <View style={styles.topBarInner}>
          <View style={styles.headerInfo}>
            <View style={styles.badgeRow}>
              <View style={[styles.recIndicator, { backgroundColor: palette.danger }]} />
              <Text style={[styles.badgeRowText, { color: palette.muted }]}>
                CONSOLA DE GRABACIÓN & MASTERING
              </Text>
            </View>
            <Text style={[styles.title, { color: palette.text }]}>Estudio Artista</Text>

            <View style={styles.labelBadgeRow}>
              <Text style={[styles.selloLabel, { color: palette.muted }]}>SELLO:</Text>
              <Text style={[styles.selloName, { color: palette.accent }]}>
                {myArtist?.name || 'Sello Independiente'}
              </Text>
              {myArtist?.verified ? (
                <View style={[styles.verifiedTag, { backgroundColor: palette.successMuted, borderColor: palette.successBorder }]}>
                  <Text style={[styles.verifiedText, { color: palette.success }]}>✓ Verificado</Text>
                </View>
              ) : (
                <View style={[styles.pendingTag, { backgroundColor: palette.warningMuted, borderColor: palette.warningBorder }]}>
                  <Text style={[styles.pendingText, { color: palette.warning }]}>Pendiente</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable
              style={[styles.themeBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
              onPress={toggleTheme}
            >
              <Text style={[styles.themeBtnText, { color: palette.text }]}>
                {isDark ? '☀ DÍA' : '◐ NOCHE'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.createBtn, { backgroundColor: palette.accent }, shadows.glowAccent]}
              onPress={openCreateTrack}
            >
              <Text style={[styles.createBtnText, { color: palette.background }]}>
                + SUBIR MÚSICA
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={palette.accent} size="large" />
          <Text style={[styles.loadingText, { color: palette.muted }]}>
            Conectando a la mesa de audio...
          </Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accent} />
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.sm]}>
              <View style={styles.cardTop}>
                <View style={styles.trackMetaHeader}>
                  <Text style={[styles.trackTitle, { color: palette.text }]}>{item.title}</Text>
                  <View style={[styles.licensePill, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}>
                    <Text style={[styles.licenseText, { color: palette.muted }]}>
                      {item.license_type || 'ORIGINAL'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.artistName, { color: palette.muted }]}>
                  Por <Text style={{ color: palette.accent, fontWeight: '800' }}>{item.artist_name}</Text>
                </Text>

                {item.description ? (
                  <Text style={[styles.desc, { color: palette.textSecondary }]}>{item.description}</Text>
                ) : null}

                <View style={[styles.audioUrlBox, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                  <Text style={[styles.audioUrlLabel, { color: palette.muted }]}>MÁSTER:</Text>
                  <Text style={[styles.audioUrlText, { color: palette.cyan }]} numberOfLines={1}>
                    {item.audio_url}
                  </Text>
                </View>
              </View>

              {/* Botones de Operación ABML */}
              <View style={[styles.actions, { borderTopColor: palette.borderSubtle }]}>
                <Pressable
                  style={[styles.pressingBtn, { backgroundColor: palette.accent }]}
                  onPress={() => openCreatePressing(item)}
                >
                  <Text style={[styles.pressingBtnText, { color: palette.background }]}>
                    💿 ACUÑAR TIRADA FÍSICA
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.editBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
                  onPress={() => openEditTrack(item)}
                >
                  <Text style={[styles.editBtnText, { color: palette.textSecondary }]}>✎ EDITAR</Text>
                </Pressable>

                <Pressable
                  style={[styles.deleteBtn, { backgroundColor: palette.dangerMuted, borderColor: palette.dangerBorder }]}
                  onPress={() => handleDeleteTrack(item)}
                >
                  <Text style={[styles.deleteBtnText, { color: palette.danger }]}>🗑</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎙</Text>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>Sin grabaciones en tu máster</Text>
              <Text style={[styles.emptySub, { color: palette.muted }]}>
                Tocá "+ Subir Música" para cargar archivos de audio locales (MP3/WAV/FLAC), o seleccionar presets de cinta analógica.
              </Text>
            </View>
          }
        />
      )}

      {/* ================= MODAL DE SUBIDA MULTI-FORMATO DE AUDIO ================= */}
      <Modal visible={trackModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.modalBox, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.lg]}>
              <Text style={[styles.modalBadge, { color: palette.accent }]}>ESTUDIO DE MASTERIZACIÓN</Text>
              <Text style={[styles.modalTitle, { color: palette.text }]}>
                {editingTrack ? 'Modificar Canción' : 'Subir Nueva Grabación Máster'}
              </Text>

              {/* Selector de Método de Subida */}
              <View style={styles.sourceSelectorRow}>
                {[
                  { id: 'upload', label: '📁 Subir Archivo' },
                  { id: 'url', label: '🌐 Enlace Web' },
                  { id: 'presets', label: '🎙 Presets Máster' }
                ].map((m) => (
                  <Pressable
                    key={m.id}
                    style={[
                      styles.sourceTab,
                      { backgroundColor: palette.surfaceDark, borderColor: palette.border },
                      uploadSourceMode === m.id && [styles.sourceTabActive, { backgroundColor: palette.accentMuted, borderColor: palette.accent }]
                    ]}
                    onPress={() => setUploadSourceMode(m.id)}
                  >
                    <Text
                      style={[
                        styles.sourceTabText,
                        { color: uploadSourceMode === m.id ? palette.accent : palette.muted }
                      ]}
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Zona de Subida según Método Seleccionado */}
              {uploadSourceMode === 'upload' && (
                <View style={[styles.dropZone, { backgroundColor: palette.surfaceDark, borderColor: palette.accent }]}>
                  <Text style={styles.dropZoneIcon}>🎵</Text>
                  <Text style={[styles.dropZoneTitle, { color: palette.text }]}>
                    {uploadedFileName ? 'Archivo Seleccionado:' : 'Seleccionar Archivo de Audio'}
                  </Text>

                  {uploadedFileName ? (
                    <View style={styles.fileSelectedBox}>
                      <Text style={[styles.fileNameText, { color: palette.accent }]}>
                        {uploadedFileName}
                      </Text>
                      <Text style={[styles.fileSizeText, { color: palette.muted }]}>
                        {uploadedFileSize} · Subido y Enlazado al Máster
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.dropZoneSub, { color: palette.muted }]}>
                      Soporta MP3, WAV, FLAC, OGG y M4A hasta 50MB.
                    </Text>
                  )}

                  <Pressable
                    style={[styles.uploadPickBtn, { backgroundColor: palette.accent }]}
                    onPress={handleSelectLocalAudioFile}
                    disabled={uploadingAudio}
                  >
                    {uploadingAudio ? (
                      <ActivityIndicator color={palette.background} size="small" />
                    ) : (
                      <Text style={[styles.uploadPickBtnText, { color: palette.background }]}>
                        {uploadedFileName ? 'CAMBIAR ARCHIVO LOCAL' : 'EXPLORAR MI DISPOSITIVO'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}

              {uploadSourceMode === 'url' && (
                <View style={styles.urlInputBox}>
                  <Text style={[styles.inputLabel, { color: palette.muted }]}>URL DEL STREAMING DIRECTO (MP3 / WAV)</Text>
                  <TextInput
                    placeholder="https://ejemplo.com/audio/master-soundboard.mp3"
                    placeholderTextColor={palette.mutedDark}
                    style={[styles.input, { backgroundColor: palette.surfaceDark, borderColor: palette.border, color: palette.text }]}
                    value={audioUrl}
                    onChangeText={setAudioUrl}
                  />
                </View>
              )}

              {uploadSourceMode === 'presets' && (
                <View style={styles.presetsList}>
                  <Text style={[styles.inputLabel, { color: palette.muted }]}>
                    PRESETS DE CINTA DE PRUEBA RÁPIDA:
                  </Text>
                  {AUDIO_PRESETS.map((p) => (
                    <Pressable
                      key={p.id}
                      style={[
                        styles.presetCard,
                        { backgroundColor: palette.surfaceDark, borderColor: palette.border },
                        audioUrl === p.url && { borderColor: palette.accent, backgroundColor: palette.accentMuted }
                      ]}
                      onPress={() => {
                        setAudioUrl(p.url);
                        if (!title) setTitle(p.name);
                        notify('Preset Cargado', `Seleccionado: ${p.name}.`, 'info');
                      }}
                    >
                      <Text style={[styles.presetName, { color: audioUrl === p.url ? palette.accent : palette.text }]}>
                        {p.name}
                      </Text>
                      <Text style={[styles.presetDesc, { color: palette.muted }]}>{p.desc}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Metadatos Generales */}
              <Text style={[styles.inputLabel, { color: palette.muted, marginTop: 14 }]}>TÍTULO DE LA PISTA</Text>
              <TextInput
                placeholder="Ej: Master of Magnetic Tapes"
                placeholderTextColor={palette.mutedDark}
                style={[styles.input, { backgroundColor: palette.surfaceDark, borderColor: palette.border, color: palette.text }]}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={[styles.inputLabel, { color: palette.muted }]}>DESCRIPCIÓN HISTÓRICA O DE CONSOLA</Text>
              <TextInput
                placeholder="Detalles de la grabación analógica, mesa, cinta..."
                placeholderTextColor={palette.mutedDark}
                multiline
                style={[styles.input, { backgroundColor: palette.surfaceDark, borderColor: palette.border, color: palette.text, height: 60, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
              />

              {/* Botón Opcional para Subir Arte de Portada */}
              <View style={styles.coverUploadRow}>
                <Pressable
                  style={[styles.coverPickBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
                  onPress={handleSelectCoverImage}
                >
                  <Text style={[styles.coverPickText, { color: palette.textSecondary }]}>
                    📷 {coverUrl ? 'CAMBIAR ARTE DE CARÁTULA' : '+ SUBIR CARÁTULA (OPCIONAL)'}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.inputLabel, { color: palette.muted }]}>TIPO DE LICENCIA (ORIGINAL / SOUNDBOARD / TAPE-TRADE)</Text>
              <TextInput
                placeholder="original, soundboard, tape-trade"
                placeholderTextColor={palette.mutedDark}
                style={[styles.input, { backgroundColor: palette.surfaceDark, borderColor: palette.border, color: palette.text }]}
                value={licenseType}
                onChangeText={setLicenseType}
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setTrackModalVisible(false)}
                  disabled={savingTrack}
                >
                  <Text style={[styles.cancelBtnText, { color: palette.muted }]}>CANCELAR</Text>
                </Pressable>

                <Pressable
                  style={[styles.saveBtn, { backgroundColor: palette.accent }, savingTrack && { opacity: 0.6 }]}
                  onPress={saveTrack}
                  disabled={savingTrack}
                >
                  {savingTrack ? (
                    <ActivityIndicator color={palette.background} size="small" />
                  ) : (
                    <Text style={[styles.saveBtnText, { color: palette.background }]}>
                      {editingTrack ? 'GUARDAR CAMBIOS' : 'PUBLICAR EN MÁSTER'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Acuñar Tirada Física */}
      <Modal visible={pressingModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.lg]}>
            <Text style={[styles.modalBadge, { color: palette.accent }]}>PRENSAJE FÍSICO LIMITADO</Text>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Acuñar Tirada Oficial</Text>
            <Text style={[styles.modalSubDesc, { color: palette.textSecondary }]}>
              Vas a emitir una tirada numerada de casetes y vinilos para “{selectedTrackForPressing?.title}”.
            </Text>

            <Text style={[styles.inputLabel, { color: palette.muted }]}>CANTIDAD TOTAL DE COPIAS A PRENSAR</Text>
            <TextInput
              placeholder="Ej: 15"
              placeholderTextColor={palette.mutedDark}
              keyboardType="number-pad"
              style={[styles.input, { backgroundColor: palette.surfaceDark, borderColor: palette.border, color: palette.text }]}
              value={totalCopies}
              onChangeText={setTotalCopies}
            />

            <Text style={[styles.inputLabel, { color: palette.muted }]}>LÍMITE DE GENERACIÓN DE DUBBEO</Text>
            <TextInput
              placeholder="Ej: 5 (máximo salto de copia permitida)"
              placeholderTextColor={palette.mutedDark}
              keyboardType="number-pad"
              style={[styles.input, { backgroundColor: palette.surfaceDark, borderColor: palette.border, color: palette.text }]}
              value={generationLimit}
              onChangeText={setGenerationLimit}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setPressingModalVisible(false)}
                disabled={savingPressing}
              >
                <Text style={[styles.cancelBtnText, { color: palette.muted }]}>CANCELAR</Text>
              </Pressable>

              <Pressable
                style={[styles.saveBtn, { backgroundColor: palette.accent }, savingPressing && { opacity: 0.6 }]}
                onPress={savePressing}
                disabled={savingPressing}
              >
                {savingPressing ? (
                  <ActivityIndicator color={palette.background} size="small" />
                ) : (
                  <Text style={[styles.saveBtnText, { color: palette.background }]}>ACUÑAR EN CATÁLOGO</Text>
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
    flex: 1
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%'
  },
  headerInfo: {
    flex: 1
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  recIndicator: {
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
  labelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap'
  },
  selloLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  selloName: {
    fontSize: 12,
    fontWeight: '800'
  },
  verifiedTag: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800'
  },
  pendingTag: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  pendingText: {
    fontSize: 9,
    fontWeight: '800'
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  themeBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8
  },
  themeBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  createBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8
  },
  createBtnText: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.8
  },
  listContent: {
    padding: 16,
    paddingBottom: 36,
    maxWidth: 720,
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
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1
  },
  cardTop: {
    marginBottom: 14
  },
  trackMetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1
  },
  licensePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  licenseText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  artistName: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600'
  },
  desc: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18
  },
  audioUrlBox: {
    borderRadius: 6,
    padding: 8,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1
  },
  audioUrlLabel: {
    fontSize: 9,
    fontWeight: '800'
  },
  audioUrlText: {
    fontSize: 11,
    flex: 1
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 12,
    alignItems: 'center'
  },
  pressingBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pressingBtnText: {
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5
  },
  editBtn: {
    flex: 1.5,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  editBtnText: {
    fontWeight: '800',
    fontSize: 11
  },
  deleteBtn: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '900'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800'
  },
  emptySub: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 10, 0.92)',
    justifyContent: 'center',
    padding: 20
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  modalBox: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center'
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
    letterSpacing: -0.5,
    marginBottom: 14
  },
  modalSubDesc: {
    fontSize: 13,
    marginBottom: 16
  },
  sourceSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  sourceTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center'
  },
  sourceTabActive: {},
  sourceTabText: {
    fontSize: 11,
    fontWeight: '800'
  },
  dropZone: {
    borderRadius: 12,
    padding: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  dropZoneIcon: {
    fontSize: 32,
    marginBottom: 6
  },
  dropZoneTitle: {
    fontSize: 14,
    fontWeight: '800'
  },
  dropZoneSub: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center'
  },
  fileSelectedBox: {
    alignItems: 'center',
    marginVertical: 6
  },
  fileNameText: {
    fontSize: 13,
    fontWeight: '900'
  },
  fileSizeText: {
    fontSize: 11,
    marginTop: 2
  },
  uploadPickBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10
  },
  uploadPickBtnText: {
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8
  },
  urlInputBox: {
    marginBottom: 10
  },
  presetsList: {
    gap: 6,
    marginBottom: 10
  },
  presetCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1
  },
  presetName: {
    fontSize: 12,
    fontWeight: '800'
  },
  presetDesc: {
    fontSize: 10,
    marginTop: 2
  },
  coverUploadRow: {
    marginVertical: 10
  },
  coverPickBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  coverPickText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 14
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8
  },
  cancelBtn: {
    padding: 12
  },
  cancelBtnText: {
    fontWeight: '800',
    fontSize: 12
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  saveBtnText: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.8
  }
});
