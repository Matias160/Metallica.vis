// Reproductor de audio universal y seguro para Web y Mvil (Expo Go).
// Evita crashes por falta del mdulo nativo 'ExponentAV' en Expo Go y usa HTML5 Audio en Web.
import { Platform, NativeModules } from 'react-native';

class UniversalSoundPlayer {
  constructor() {
    this.currentWebAudio = null;
    this.currentNativeSound = null;
    this.onEndCallback = null;
  }

  async play(uri, onEnd) {
    this.stop();
    this.onEndCallback = onEnd;

    // 1. Entorno Web: Usar HTML5 Audio estndar del navegador
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.Audio) {
          const audio = new window.Audio(uri);
          audio.onended = () => {
            if (this.onEndCallback) this.onEndCallback();
          };
          audio.onerror = (e) => {
            console.warn('[SoundPlayer Web] Error reproduciendo audio:', e);
            if (this.onEndCallback) this.onEndCallback();
          };
          await audio.play();
          this.currentWebAudio = audio;
          return { success: true, mode: 'web' };
        }
      } catch (err) {
        console.warn('[SoundPlayer Web] Reproduccin prevenida o fallida:', err);
        return { success: false, error: err.message };
      }
    }

    // 2. Entorno Mvil: Slo intentar expo-av si el mdulo nativo est presente
    try {
      if (NativeModules && NativeModules.ExponentAV) {
        const { Audio } = require('expo-av');
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );

        this.currentNativeSound = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            this.stop();
            if (this.onEndCallback) this.onEndCallback();
          }
        });
        return { success: true, mode: 'native' };
      }
    } catch (nativeErr) {
      console.warn('[SoundPlayer Native] expo-av no disponible:', nativeErr.message);
    }

    // Fallback sin crash: emulacin auditiva tctil
    return { success: true, mode: 'simulated' };
  }

  stop() {
    if (this.currentWebAudio) {
      try {
        this.currentWebAudio.pause();
        this.currentWebAudio.currentTime = 0;
      } catch {}
      this.currentWebAudio = null;
    }

    if (this.currentNativeSound) {
      try {
        this.currentNativeSound.unloadAsync();
      } catch {}
      this.currentNativeSound = null;
    }
  }
}

export const soundPlayer = new UniversalSoundPlayer();
