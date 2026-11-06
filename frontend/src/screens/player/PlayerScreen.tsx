// Reproductor visual analógico: deck de cintas y tocadiscos con estética de estudio en TypeScript.
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shadows } from '../../theme/colors';
import { soundPlayer } from '../../utils/soundPlayer';

export default function PlayerScreen(): React.JSX.Element {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const vuAnim1 = useRef(new Animated.Value(0.4)).current;
  const vuAnim2 = useRef(new Animated.Value(0.6)).current;

  // Animación continua de rotación de vinilo a 33 RPM
  useEffect(() => {
    let loopAnim: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      loopAnim = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3200,
          easing: Easing.linear,
          useNativeDriver: true
        })
      );
      loopAnim.start();

      // Animación pulsante de los vúmetros
      Animated.loop(
        Animated.sequence([
          Animated.timing(vuAnim1, { toValue: 0.9, duration: 180, useNativeDriver: false }),
          Animated.timing(vuAnim1, { toValue: 0.3, duration: 220, useNativeDriver: false }),
          Animated.timing(vuAnim1, { toValue: 0.75, duration: 160, useNativeDriver: false })
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(vuAnim2, { toValue: 0.85, duration: 200, useNativeDriver: false }),
          Animated.timing(vuAnim2, { toValue: 0.25, duration: 190, useNativeDriver: false }),
          Animated.timing(vuAnim2, { toValue: 0.95, duration: 170, useNativeDriver: false })
        ])
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
    return () => {
      if (loopAnim) loopAnim.stop();
    };
  }, [isPlaying]);

  async function togglePlay() {
    if (isPlaying) {
      soundPlayer.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      await soundPlayer.play(
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        () => setIsPlaying(false)
      );
    }
  }

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.badgeRow}>
          <View style={[styles.liveIndicator, isPlaying && styles.liveActive]} />
          <Text style={styles.badgeRowText}>
            STUDIO MONITOR · {isPlaying ? 'REPRODUCIENDO MASTER TAPE' : 'STANDBY'}
          </Text>
        </View>
        <Text style={styles.title}>Tocadiscos & Deck</Text>
        <Text style={styles.subtitle}>
          Monitoreo analógico de audio con cabezal magnético de alta fidelidad.
        </Text>
      </View>

      <View style={styles.content}>
        {/* Tornamesa / Deck Box con Iluminación de Estudio */}
        <View style={[styles.turntable, shadows.lg]}>
          {/* Luz estroboscópica de velocidad */}
          <View style={styles.strobeLight}>
            <View style={[styles.strobeDot, isPlaying && styles.strobeDotActive]} />
            <Text style={styles.strobeText}>33⅓ RPM QUARTZ</Text>
          </View>

          <View style={styles.turntableRim}>
            <Animated.View style={[styles.vinyl, { transform: [{ rotate: spin }] }]}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.groove,
                    { width: `${90 - i * 15}%`, height: `${90 - i * 15}%` }
                  ]}
                />
              ))}

              {/* Etiqueta Central con Arte de Master of Puppets */}
              <View style={styles.label}>
                <Image
                  source={{
                    uri: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/b8/5a/82/b85a8259-60d9-bfaa-770a-2baac8380e87/858978005196.png/600x600bb.jpg'
                  }}
                  style={styles.labelCoverImage}
                  resizeMode="cover"
                />
                <View style={styles.centerSpindleRing}>
                  <View style={styles.centerSpindle} />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Brazo fonocaptor / Aguja */}
          <View style={[styles.tonearmBase, isPlaying && styles.tonearmEngaged]}>
            <View style={styles.tonearmPivot} />
            <View style={styles.tonearmArm} />
            <View style={styles.cartridge} />
          </View>
        </View>

        {/* Ficha de la Pista Cargada en Cabezal */}
        <View style={[styles.nowPlayingCard, shadows.md]}>
          <View style={styles.trackMetaRow}>
            <View style={styles.trackInfo}>
              <Text style={styles.trackKicker}>EN CABEZAL DE ESTUDIO</Text>
              <Text style={styles.trackTitle}>Master of Puppets</Text>
              <Text style={styles.trackArtist}>Metallica · Soundboard Master Reel 1986</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.playBtn,
                isPlaying ? styles.playBtnActive : styles.playBtnIdle,
                pressed && { opacity: 0.8 }
              ]}
              onPress={togglePlay}
            >
              <Text style={styles.playBtnText}>{isPlaying ? '❚❚ PAUSA' : '▶ PLAY'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Vúmetros de Estudio con Luces Dinámicas */}
        <View style={[styles.vuMeterCard, shadows.sm]}>
          <View style={styles.vuChannel}>
            <Text style={styles.channelLabel}>CH L</Text>
            <View style={styles.meterTrack}>
              <View style={[styles.seg, styles.segGreen, isPlaying && styles.segLit]} />
              <View style={[styles.seg, styles.segGreen, isPlaying && styles.segLit]} />
              <View style={[styles.seg, styles.segGreen, isPlaying && styles.segLit]} />
              <View style={[styles.seg, styles.segYellow, isPlaying && styles.segLit]} />
              <View style={[styles.seg, styles.segRed, isPlaying && styles.segPeak]} />
            </View>
            <Text style={styles.vuDbText}>+2 dB</Text>
          </View>
          <View style={styles.vuChannel}>
            <Text style={styles.channelLabel}>CH R</Text>
            <View style={styles.meterTrack}>
              <View style={[styles.seg, styles.segGreen, isPlaying && styles.segLit]} />
              <View style={[styles.seg, styles.segGreen, isPlaying && styles.segLit]} />
              <View style={[styles.seg, styles.segGreen, isPlaying && styles.segLit]} />
              <View style={[styles.seg, styles.segYellow, isPlaying && styles.segLit]} />
              <View style={[styles.seg, styles.segRed, isPlaying && styles.segPeak]} />
            </View>
            <Text style={styles.vuDbText}>+1 dB</Text>
          </View>
        </View>

        <Text style={styles.caption}>
          Presioná <Text style={{ color: colors.accent, fontWeight: '800' }}>PLAY</Text> para rotar el vinilo a 33 RPM o seleccioná cualquier cinta de tu <Text style={{ color: colors.cyan, fontWeight: '800' }}>Colección</Text> para auditar copias físicas.
        </Text>
      </View>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.backgroundElevated
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mutedDark
  },
  liveActive: {
    backgroundColor: colors.accent
  },
  badgeRowText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center'
  },
  turntable: {
    backgroundColor: '#0f131c',
    width: '100%',
    aspectRatio: 1.15,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 8
  },
  strobeLight: {
    position: 'absolute',
    top: 14,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  strobeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#374151'
  },
  strobeDotActive: {
    backgroundColor: '#ef4444'
  },
  strobeText: {
    color: colors.mutedDark,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  turntableRim: {
    width: '78%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#080a10',
    borderWidth: 6,
    borderColor: '#1e2638',
    alignItems: 'center',
    justifyContent: 'center'
  },
  vinyl: {
    width: '94%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#05060a',
    borderWidth: 2,
    borderColor: '#171f2e',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  groove: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#141b26'
  },
  label: {
    width: '42%',
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
    position: 'relative'
  },
  labelCoverImage: {
    width: '100%',
    height: '100%'
  },
  centerSpindleRing: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  centerSpindle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b'
  },
  tonearmBase: {
    position: 'absolute',
    right: '10%',
    top: '10%',
    width: 44,
    height: 130,
    alignItems: 'center',
    transform: [{ rotate: '-6deg' }]
  },
  tonearmEngaged: {
    transform: [{ rotate: '12deg' }]
  },
  tonearmPivot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#273248',
    borderWidth: 2,
    borderColor: '#4d5b78'
  },
  tonearmArm: {
    width: 3.5,
    height: 96,
    backgroundColor: '#cbd5e1',
    marginTop: -4
  },
  cartridge: {
    width: 12,
    height: 18,
    backgroundColor: colors.accent,
    borderRadius: 2,
    marginTop: -2
  },
  nowPlayingCard: {
    backgroundColor: colors.surface,
    width: '100%',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 14
  },
  trackMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  trackInfo: {
    flex: 1,
    marginRight: 12
  },
  trackKicker: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2
  },
  trackTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900'
  },
  trackArtist: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  playBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  playBtnIdle: {
    backgroundColor: colors.accent
  },
  playBtnActive: {
    backgroundColor: colors.success
  },
  playBtnText: {
    color: '#090a0f',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  vuMeterCard: {
    backgroundColor: colors.surface,
    width: '100%',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
    gap: 8
  },
  vuChannel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  channelLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    width: 32
  },
  meterTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 4
  },
  seg: {
    flex: 1,
    height: 6,
    borderRadius: 2,
    opacity: 0.3
  },
  segLit: {
    opacity: 1
  },
  segPeak: {
    opacity: 0.8
  },
  segGreen: { backgroundColor: colors.success },
  segYellow: { backgroundColor: colors.warning },
  segRed: { backgroundColor: colors.danger },
  vuDbText: {
    color: colors.mutedDark,
    fontSize: 9,
    fontWeight: '800',
    width: 32,
    textAlign: 'right'
  },
  caption: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18
  }
});
