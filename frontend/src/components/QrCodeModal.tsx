// Visualizador y Ficha de Código QR Oficial para Casetes y Vinilos en TypeScript.
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFeedback } from '../context/FeedbackContext';
import { useTheme } from '../context/ThemeContext';
import { shadows } from '../theme/colors';
import { Copy } from '../types';

export interface QrCodeModalProps {
  visible: boolean;
  copy: (Partial<Copy> & { copy_number?: number; track_title?: string; condition_value?: number }) | null;
  onClose: () => void;
}

export default function QrCodeModal({ visible, copy, onClose }: QrCodeModalProps): React.JSX.Element | null {
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
            <Text style={[styles.tapeTitle, { color: palette.text }]}>{copy.track_title || copy.trackTitle || 'Cinta Oficial'}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.pill, { backgroundColor: palette.surfaceLight }]}>
                <Text style={[styles.pillText, { color: palette.textSecondary }]}>
                  COPIA #{copy.copy_number || copy.copyNumber}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: palette.cyanMuted, borderColor: palette.cyanBorder, borderWidth: 1 }]}>
                <Text style={[styles.pillText, { color: palette.cyan }]}>
                  GEN {copy.generation}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: palette.accentMuted, borderColor: palette.accentBorder, borderWidth: 1 }]}>
                <Text style={[styles.pillText, { color: palette.accent }]}>
                  CONDICIÓN {copy.condition_value || copy.conditionValue}%
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  box: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 2
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700'
  },
  qrContainer: {
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  qrMatrixMock: {
    width: 160,
    height: 160,
    backgroundColor: '#ffffff',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000'
  },
  qrSquare: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderWidth: 6,
    borderColor: '#000000',
    backgroundColor: '#ffffff'
  },
  qrTL: { top: 6, left: 6 },
  qrTR: { top: 6, right: 6 },
  qrBL: { bottom: 6, left: 6 },
  qrBitCluster: {
    width: 70,
    height: 70,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  qrBit: {
    width: 14,
    height: 14,
    backgroundColor: '#000000',
    borderRadius: 2
  },
  qrCenterBadge: {
    position: 'absolute',
    width: 28,
    height: 28,
    backgroundColor: '#000000',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  qrCenterText: {
    color: '#f59e0b',
    fontWeight: '900',
    fontSize: 11
  },
  qrHash: {
    marginTop: 12,
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#334155',
    fontWeight: '800',
    letterSpacing: 1
  },
  tapeInfoCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 8
  },
  tapeTitle: {
    fontSize: 14,
    fontWeight: '800'
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  pillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  instruction: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4
  },
  closeActionBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeActionText: {
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8
  }
});
