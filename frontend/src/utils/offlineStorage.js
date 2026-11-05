// Gestor de almacenamiento y reproducción offline para cintas físicas de colección.
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_INDEX_KEY = '@metallica_vis_offline_tracks';

function getLocalDirectory() {
  if (Platform.OS === 'web') return null;
  return `${FileSystem.documentDirectory || ''}offline_audio/`;
}

// Obtener mapa de pistas guardadas offline
export async function getOfflineTracksMap() {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_INDEX_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Error leyendo índice offline:', err);
    return {};
  }
}

// Verificar si una copia o pista está descargada
export async function isTrackDownloaded(audioUrl) {
  if (!audioUrl || Platform.OS === 'web') return false;
  try {
    const map = await getOfflineTracksMap();
    const item = map[audioUrl];
    if (!item || !item.localUri) return false;

    const info = await FileSystem.getInfoAsync(item.localUri);
    return info.exists;
  } catch {
    return false;
  }
}

// Obtener la URI local de una pista si existe, o la remota si no
export async function resolvePlayableAudioUri(audioUrl) {
  if (!audioUrl || Platform.OS === 'web') return audioUrl;
  try {
    const map = await getOfflineTracksMap();
    const item = map[audioUrl];
    if (item && item.localUri) {
      const info = await FileSystem.getInfoAsync(item.localUri);
      if (info.exists) {
        return item.localUri;
      }
    }
  } catch (err) {
    console.warn('Error resolviendo audio offline:', err);
  }
  return audioUrl;
}

// Descargar archivo de audio localmente para escuchar sin internet
export async function downloadTrackOffline(copy, onProgress) {
  if (Platform.OS === 'web') {
    throw new Error('La descarga offline en memoria persistente solo está disponible en la app móvil (Android/iOS).');
  }

  const audioUrl = copy?.audio_url;
  if (!audioUrl) {
    throw new Error('La copia no tiene una URL de audio válida para descargar.');
  }

  const dir = getLocalDirectory();
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const ext = audioUrl.split('.').pop()?.split('?')[0] || 'mp3';
  const cleanExt = ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext.toLowerCase()) ? ext.toLowerCase() : 'mp3';
  const localFileName = `track_${copy.track_id || copy.id}_${Date.now()}.${cleanExt}`;
  const localTargetUri = `${dir}${localFileName}`;

  const downloadResumable = FileSystem.createDownloadResumable(
    audioUrl,
    localTargetUri,
    {},
    (downloadProgress) => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      if (typeof onProgress === 'function') onProgress(progress);
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result || !result.uri) {
    throw new Error('No se pudo completar la descarga del archivo de audio.');
  }

  // Guardar en el índice de AsyncStorage
  const map = await getOfflineTracksMap();
  map[audioUrl] = {
    copyId: copy.id,
    trackId: copy.track_id,
    title: copy.track_title || copy.title || 'Cinta Oficial',
    localUri: result.uri,
    downloadedAt: new Date().toISOString()
  };
  await AsyncStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(map));

  return result.uri;
}

// Eliminar descarga local para liberar espacio
export async function removeTrackOffline(audioUrl) {
  if (!audioUrl || Platform.OS === 'web') return;
  try {
    const map = await getOfflineTracksMap();
    const item = map[audioUrl];
    if (item && item.localUri) {
      await FileSystem.deleteAsync(item.localUri, { idempotent: true });
    }
    delete map[audioUrl];
    await AsyncStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Error eliminando pista offline:', err);
  }
}
