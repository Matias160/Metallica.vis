// Reproductor visual analógico: deck de cintas y tocadiscos con estética de estudio.
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors, shadows } from '../../theme/colors';

export default function PlayerScreen() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.badgeRow}>
          <View style={styles.liveIndicator} />
          <Text style={styles.badgeRowText}>STUDIO MONITOR · TAPE DECK MASTER</Text>
        </View>
        <Text style={styles.title}>Tocadiscos & Deck</Text>
        <Text style={styles.subtitle}>
          Monitoreo analógico de audio con cabezal magnético de alta fidelidad.
        </Text>
      </View>

      <View style={styles.content}>
        {/* Tornamesa / Deck Box */}
        <View style={[styles.turntable, shadows.lg]}>
          <View style={styles.turntableRim}>
            <View style={styles.vinyl}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.groove,
                    { width: `${88 - i * 16}%`, height: `${88 - i * 16}%` }
                  ]}
                />
              ))}
              <View style={styles.label}>
                <Text style={styles.labelText}>M.VIS</Text>
                <Text style={styles.labelSub}>33 RPM</Text>
                <View style={styles.centerSpindle} />
              </View>
            </View>
          </View>

          {/* Brazo fonocaptor / Aguja */}
          <View style={styles.tonearmBase}>
            <View style={styles.tonearmPivot} />
            <View style={styles.tonearmArm} />
            <View style={styles.cartridge} />
          </View>
        </View>

        {/* Vúmetros de Estudio */}
        <View style={[styles.vuMeterCard, shadows.sm]}>
          <View style={styles.vuChannel}>
            <Text style={styles.channelLabel}>CH L</Text>
            <View style={styles.meterTrack}>
              <View style={[styles.seg, styles.segGreen]} />
              <View style={[styles.seg, styles.segGreen]} />
              <View style={[styles.seg, styles.segGreen]} />
              <View style={[styles.seg, styles.segYellow]} />
              <View style={[styles.seg, styles.segRed]} />
            </View>
          </View>
          <View style={styles.vuChannel}>
            <Text style={styles.channelLabel}>CH R</Text>
            <View style={styles.meterTrack}>
              <View style={[styles.seg, styles.segGreen]} />
              <View style={[styles.seg, styles.segGreen]} />
              <View style={[styles.seg, styles.segGreen]} />
              <View style={[styles.seg, styles.segYellow]} />
              <View style={[styles.seg, styles.segRed]} />
            </View>
          </View>
        </View>

        <Text style={styles.caption}>
          Seleccioná cualquier cinta de tu <Text style={{ color: colors.accent, fontWeight: '800' }}>Colección</Text> para cargar el máster en el cabezal y escuchar el prensaje.
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
    backgroundColor: colors.surface,
    width: '100%',
    aspectRatio: 1.15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 10
  },
  turntableRim: {
    width: '75%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#0c0f17',
    borderWidth: 6,
    borderColor: '#181e2b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  vinyl: {
    width: '92%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#07090e',
    borderWidth: 2,
    borderColor: '#1e2638',
    alignItems: 'center',
    justifyContent: 'center'
  },
  groove: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1a2233'
  },
  label: {
    width: '38%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  labelText: {
    color: '#090a0f',
    fontSize: 14,
    fontWeight: '900'
  },
  labelSub: {
    color: '#3d2503',
    fontSize: 7,
    fontWeight: '800',
    marginTop: 1
  },
  centerSpindle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#090a0f',
    marginTop: 3
  },
  tonearmBase: {
    position: 'absolute',
    right: '12%',
    top: '12%',
    width: 40,
    height: 120,
    alignItems: 'center'
  },
  tonearmPivot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#323c52',
    borderWidth: 2,
    borderColor: '#4d5b78'
  },
  tonearmArm: {
    width: 3,
    height: 90,
    backgroundColor: '#94a3b8',
    marginTop: -4,
    transform: [{ rotate: '-18deg' }]
  },
  cartridge: {
    width: 10,
    height: 16,
    backgroundColor: colors.accent,
    borderRadius: 2,
    marginTop: -2,
    transform: [{ rotate: '-18deg' }]
  },
  vuMeterCard: {
    backgroundColor: colors.surface,
    width: '100%',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
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
    borderRadius: 2
  },
  segGreen: { backgroundColor: colors.success },
  segYellow: { backgroundColor: colors.warning },
  segRed: { backgroundColor: colors.danger },
  caption: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 13,
    lineHeight: 18
  }
});
