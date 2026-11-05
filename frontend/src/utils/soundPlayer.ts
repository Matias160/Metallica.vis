// Reproductor de audio universal para Web y Móvil (Expo) en TypeScript.
// Utiliza HTML5 Audio en Web y expo-audio en entornos nativos (Android/iOS).
import { Platform } from 'react-native';
import { resolvePlayableAudioUri } from './offlineStorage';

export interface SoundPlayResult {
  success: boolean;
  mode?: 'web' | 'expo-audio' | 'simulated';
  error?: string;
}

let createAudioPlayer: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const expoAudio = require('expo-audio');
  createAudioPlayer = expoAudio.createAudioPlayer;
} catch (e) {
  // Fallback si no está disponible
}

class UniversalSoundPlayer {
  private currentWebAudio: HTMLAudioElement | null = null;
  private currentNativeSound: any = null;
  private onEndCallback: (() => void) | null = null;

  async play(uri?: string | null, onEnd?: () => void): Promise<SoundPlayResult> {
    this.stop();
    this.onEndCallback = onEnd || null;

    let audioSource = uri || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    try {
      audioSource = await resolvePlayableAudioUri(audioSource);
    } catch {}

    // 1. Entorno Web: Usar HTML5 Audio estándar del navegador
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && (window as any).Audio) {
          const audio = new (window as any).Audio(audioSource) as HTMLAudioElement;
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
      } catch (err: any) {
        console.warn('[SoundPlayer Web] Reproducción prevenida o fallida:', err);
        return { success: false, error: err?.message };
      }
    }

    // 2. Entorno Móvil Nativo con expo-audio
    if (createAudioPlayer) {
      try {
        const player = createAudioPlayer(audioSource);
        this.currentNativeSound = player;

        if (typeof player.addListener === 'function') {
          player.addListener('playbackStatusUpdate', (status: any) => {
            if (status && status.didJustFinish) {
              if (this.onEndCallback) this.onEndCallback();
            }
          });
        }

        if (typeof player.play === 'function') {
          player.play();
        }

        return { success: true, mode: 'expo-audio' };
      } catch (nativeErr: any) {
        console.warn('[SoundPlayer Native] Error con expo-audio:', nativeErr?.message);
      }
    }

    // 3. Fallback de simulación en caso de que el driver de sonido nativo esté bloqueado
    const timer = setTimeout(() => {
      if (this.onEndCallback) this.onEndCallback();
    }, 15000);
    this.currentNativeSound = {
      unloadAsync: () => clearTimeout(timer)
    };
    return { success: true, mode: 'simulated' };
  }

  stop(): void {
    if (this.currentWebAudio) {
      try {
        this.currentWebAudio.pause();
        this.currentWebAudio.currentTime = 0;
      } catch {}
      this.currentWebAudio = null;
    }

    if (this.currentNativeSound) {
      try {
        if (typeof this.currentNativeSound.pause === 'function') {
          this.currentNativeSound.pause();
        }
        if (typeof this.currentNativeSound.remove === 'function') {
          this.currentNativeSound.remove();
        }
        if (typeof this.currentNativeSound.unloadAsync === 'function') {
          this.currentNativeSound.unloadAsync();
        }
      } catch {}
      this.currentNativeSound = null;
    }
  }
}

export const soundPlayer = new UniversalSoundPlayer();
