// Visualizador y Ficha de Código QR Oficial para Casetes y Vinilos.
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFeedback } from '../context/FeedbackContext';
import { useTheme } from '../context/ThemeContext';
import { shadows } from '../theme/colors';

export default function QrCodeModal({ visible, copy, onClose }) {
  const { palette } = useTheme();
  const { notify } = useFeedback();

  if (!copy) return null;

  const rawHash = `MV-${copy.id}-${copy.copy_number || '01'}-GEN${copy.generation || 0}`;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.box, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.lg]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.badgeText, { color: palette.accent }]}>
                METALLICA.VIS CERTIFIED QR
              </Text>
              <Text style={[styles.title, { color: palette.text }]}>Sticker Holográfico</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: palette.muted }]}>✕</Text>
            </Pressable>
          </View>

          {/* Gráfico de QR Criptográfico de Cinta */}
          <View style={[styles.qrContainer, { backgroundColor: '#ffffff', borderColor: palette.border }]}>
            <View style={styles.qrMatrixMock}>
              {/* Esquinas QR universales */}
              <View style={[styles.qrSquare, styles.qrTL]} />
              <View style={[styles.qrSquare, styles.qrTR]} />
              <View style={[styles.qrSquare, styles.qrBL]} />

              {/* Patrón de micro-bits */}
              <View style={styles.qrBitCluster}>
                <View style={styles.qrBit} />
                <View style={styles.qrBit} />
                <View style={styles.qrBit} />
                <View style={[styles.qrBit, { backgroundColor: '#f59e0b' }]} />
                <View style={styles.qrBit} />
                <View style={styles.qrBit} />
                <View style={styles.qrBit} />
                <View style={styles.qrBit} />
                <View style={styles.qrBit} />
              </View>

              <View style={styles.qrCenterBadge}>
                <Text style={styles.qrCenterText}>MV</Text>
              </View>
            </View>

            <Text style={styles.qrHash}>{rawHash}</Text>
          </View>

          {/* Información del Ejemplar */}
          <View style={[styles.tapeInfoCard, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
            <Text style={[styles.tapeTitle, { color: palette.text }]}>{copy.track_title}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.pill, { backgroundColor: palette.surfaceLight }]}>
                <Text style={[styles.pillText, { color: palette.textSecondary }]}>
                  COPIA #{copy.copy_number}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: palette.cyanMuted, borderColor: palette.cyanBorder, borderWidth: 1 }]}>
                <Text style={[styles.pillText, { color: palette.cyan }]}>
                  GEN {copy.generation}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: palette.accentMuted, borderColor: palette.accentBorder, borderWidth: 1 }]}>
                <Text style={[styles.pillText, { color: palette.accent }]}>
                  CONDICIÓN {copy.condition_value}%
                </Text>
              </View>
            </View>

            <Text style={[styles.instruction, { color: palette.muted }]}>
              Cada cinta física posee este código único impreso en su sticker. Al escanearlo desde el Modo Museo o la App, se valida la titularidad y estado físico en el máster.
            </Text>
          </View>

          <Pressable
            style={[styles.closeActionBtn, { backgroundColor: palette.accent }]}
            onPress={() => {
              notify('QR Copiado', `Identificador ${rawHash} listo para verificar.`, 'info');
              onClose();
            }}
          >
            <Text style={[styles.closeActionText, { color: palette.background }]}>
              ENTENDIDO · CERRAR STICKER
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 10, 0.92)',
    justifyContent: 'center',
    padding: 20
  },
  box: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  closeBtn: {
    padding: 6
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '800'
  },
  qrContainer: {
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginVertical: 6
  },
  qrMatrixMock: {
    width: 140,
    height: 140,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#0f172a',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qrSquare: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderWidth: 6,
    borderColor: '#0f172a',
    backgroundColor: '#ffffff'
  },
  qrTL: { top: 6, left: 6 },
  qrTR: { top: 6, right: 6 },
  qrBL: { bottom: 6, left: 6 },
  qrBitCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 50,
    gap: 4,
    justifyContent: 'center'
  },
  qrBit: {
    width: 8,
    height: 8,
    backgroundColor: '#0f172a'
  },
  qrCenterBadge: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qrCenterText: {
    color: '#090a0f',
    fontSize: 10,
    fontWeight: '900'
  },
  qrHash: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginTop: 10
  },
  tapeInfoCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginTop: 14
  },
  tapeTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap'
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800'
  },
  instruction: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10
  },
  closeActionBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16
  },
  closeActionText: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.8
  }
});
