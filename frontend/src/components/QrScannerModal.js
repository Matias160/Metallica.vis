// Modal de Escaneo y Validación Criptográfica de Códigos QR para Casetes y Vinilos.
import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { apiRequest } from '../api/client';
import { useFeedback } from '../context/FeedbackContext';
import { useTheme } from '../context/ThemeContext';
import { shadows } from '../theme/colors';

export default function QrScannerModal({ visible, onClose, onOpenTape }) {
  const { palette } = useTheme();
  const { notify } = useFeedback();

  const [inputCode, setInputCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [scanLaser] = useState(new Animated.Value(0));

  // Animación continua del láser de escaneo
  const startLaserAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLaser, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(scanLaser, { toValue: 0, duration: 1500, useNativeDriver: true })
      ])
    ).start();
  };

  const laserTranslate = scanLaser.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 140]
  });

  async function verifyTapeCode(codeOrId) {
    if (!codeOrId || !String(codeOrId).trim()) {
      notify('Código requerido', 'Ingresá el número de copia o hash QR.', 'warning');
      return;
    }

    try {
      setVerifying(true);
      // El código puede ser "TAPE-1" o simplemente el ID "1"
      const cleanId = String(codeOrId).replace(/[^0-9]/g, '') || '1';
      const data = await apiRequest(`/verify-tape/${cleanId}`);

      if (data.valid) {
        setCertificateData(data);
        notify('Copia Auténtica', `Copia #${data.tape.copyNumber} validada criptográficamente.`, 'success');
      } else {
        notify('Código Inválido', 'La cinta no figura en el máster oficial.', 'error');
      }
    } catch (err) {
      notify('Fallo de Verificación', err.message || 'Código QR no reconocido', 'error');
    } finally {
      setVerifying(false);
    }
  }

  function handleClose() {
    setCertificateData(null);
    setInputCode('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onShow={startLaserAnimation}>
      <View style={styles.overlay}>
        <View style={[styles.box, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.lg]}>
          {/* Header del Escáner */}
          <View style={styles.headerRow}>
            <View>
              <View style={styles.badgeRow}>
                <View style={[styles.laserDot, { backgroundColor: palette.cyan }]} />
                <Text style={[styles.badgeText, { color: palette.cyan }]}>
                  PROTOCOLO DE AUTENTICIDAD CRIPTOGRÁFICA
                </Text>
              </View>
              <Text style={[styles.title, { color: palette.text }]}>Escáner QR de Cintas</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: palette.muted }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {certificateData ? (
              /* Ficha de Certificado de Autenticidad Validada */
              <View style={[styles.certCard, { backgroundColor: palette.surfaceDark, borderColor: palette.success }]}>
                <View style={styles.certHeader}>
                  <View style={[styles.certStatusPill, { backgroundColor: palette.successMuted, borderColor: palette.successBorder }]}>
                    <Text style={[styles.certStatusText, { color: palette.success }]}>
                      ✓ CERTIFICADO OFICIAL VÁLIDO
                    </Text>
                  </View>
                  <Text style={[styles.certDate, { color: palette.muted }]}>
                    REGISTRO INMUTABLE
                  </Text>
                </View>

                <Text style={[styles.certTrackTitle, { color: palette.text }]}>
                  {certificateData.tape.trackTitle}
                </Text>

                <Text style={[styles.certArtist, { color: palette.accent }]}>
                  Sello / Artista: {certificateData.tape.artistName}{' '}
                  {certificateData.tape.artistVerified ? '✓ Verificado' : ''}
                </Text>

                {/* Sello SHA-256 de Autenticidad */}
                <View style={[styles.hashBox, { backgroundColor: palette.surface, borderColor: palette.borderSubtle }]}>
                  <Text style={[styles.hashLabel, { color: palette.muted }]}>
                    SELLO DE SEGURIDAD SHA-256:
                  </Text>
                  <Text style={[styles.hashValue, { color: palette.cyan }]}>
                    {certificateData.authenticityStamp}
                  </Text>
                </View>

                {/* Grilla de Telemetría de la Cinta */}
                <View style={styles.certGrid}>
                  <View style={[styles.certGridItem, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                    <Text style={[styles.gridLabel, { color: palette.muted }]}>COPIA NUMERADA</Text>
                    <Text style={[styles.gridVal, { color: palette.text }]}>
                      #{certificateData.tape.copyNumber} / {certificateData.tape.totalCopies}
                    </Text>
                  </View>

                  <View style={[styles.certGridItem, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                    <Text style={[styles.gridLabel, { color: palette.muted }]}>GENERACIÓN</Text>
                    <Text style={[styles.gridVal, { color: palette.cyan }]}>
                      Gen {certificateData.tape.generation}
                    </Text>
                  </View>

                  <View style={[styles.certGridItem, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                    <Text style={[styles.gridLabel, { color: palette.muted }]}>CONDICIÓN FÍSICA</Text>
                    <Text
                      style={[
                        styles.gridVal,
                        {
                          color:
                            certificateData.tape.conditionValue > 75
                              ? palette.success
                              : certificateData.tape.conditionValue > 40
                              ? palette.warning
                              : palette.danger
                        }
                      ]}
                    >
                      {certificateData.tape.conditionValue}%
                    </Text>
                  </View>

                  <View style={[styles.certGridItem, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                    <Text style={[styles.gridLabel, { color: palette.muted }]}>TITULAR ACTUAL</Text>
                    <Text style={[styles.gridVal, { color: palette.text }]}>
                      {certificateData.tape.ownerName}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={[styles.certActionBtn, { backgroundColor: palette.accent }]}
                  onPress={() => {
                    handleClose();
                    if (onOpenTape) onOpenTape(certificateData.tape);
                  }}
                >
                  <Text style={[styles.certActionText, { color: palette.background }]}>
                    ABRIR FICHA COMPLETA EN COLECCIÓN
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.scanAgainBtn, { borderColor: palette.border }]}
                  onPress={() => setCertificateData(null)}
                >
                  <Text style={[styles.scanAgainText, { color: palette.muted }]}>
                    ESCANEAR OTRA PIEZA
                  </Text>
                </Pressable>
              </View>
            ) : (
              /* Visor de Escaneo con Láser Activo */
              <View>
                <View style={[styles.viewFinder, { borderColor: palette.cyan, backgroundColor: palette.surfaceDark }]}>
                  <View style={[styles.corner, styles.cTL, { borderColor: palette.cyan }]} />
                  <View style={[styles.corner, styles.cTR, { borderColor: palette.cyan }]} />
                  <View style={[styles.corner, styles.cBL, { borderColor: palette.cyan }]} />
                  <View style={[styles.corner, styles.cBR, { borderColor: palette.cyan }]} />

                  {/* Línea Láser Animada */}
                  <Animated.View
                    style={[
                      styles.laserLine,
                      {
                        backgroundColor: palette.cyan,
                        shadowColor: palette.cyan,
                        transform: [{ translateY: laserTranslate }]
                      }
                    ]}
                  />

                  {/* QR Holográfico de Referencia */}
                  <View style={styles.qrIconWrap}>
                    <Text style={styles.qrIconText}>⛶</Text>
                    <Text style={[styles.qrCaption, { color: palette.muted }]}>
                      Apuntá la cámara al código QR de la cinta
                    </Text>
                  </View>
                </View>

                {/* Acceso Rápido para Simulación o Ingreso Manual */}
                <View style={styles.quickAccessSection}>
                  <Text style={[styles.sectionSubtitle, { color: palette.muted }]}>
                    O INGRESÁ EL IDENTIFICADOR DEL CASSETTE
                  </Text>

                  <View style={styles.inputRow}>
                    <TextInput
                      placeholder="Ej: TAPE-1 o 1"
                      placeholderTextColor={palette.mutedDark}
                      style={[
                        styles.input,
                        {
                          backgroundColor: palette.surfaceDark,
                          borderColor: palette.border,
                          color: palette.text
                        }
                      ]}
                      value={inputCode}
                      onChangeText={setInputCode}
                    />

                    <Pressable
                      style={[
                        styles.verifyBtn,
                        { backgroundColor: palette.accent },
                        verifying && { opacity: 0.6 }
                      ]}
                      onPress={() => verifyTapeCode(inputCode)}
                      disabled={verifying}
                    >
                      {verifying ? (
                        <ActivityIndicator color={palette.background} size="small" />
                      ) : (
                        <Text style={[styles.verifyBtnText, { color: palette.background }]}>
                          VALIDAR
                        </Text>
                      )}
                    </Pressable>
                  </View>

                  {/* Acceso de Demostración 1-Tap */}
                  <Text style={[styles.demoHint, { color: palette.mutedDark }]}>
                    ACCESOS RÁPIDOS DE PRUEBA:
                  </Text>
                  <View style={styles.demoChipsRow}>
                    {[1, 2, 3].map((id) => (
                      <Pressable
                        key={id}
                        style={[
                          styles.demoChip,
                          { backgroundColor: palette.surfaceLight, borderColor: palette.border }
                        ]}
                        onPress={() => verifyTapeCode(String(id))}
                      >
                        <Text style={[styles.demoChipText, { color: palette.accent }]}>
                          ⚡ Validar Cinta #{id}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
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
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    maxHeight: '90%'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  laserDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
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
  scroll: {
    paddingVertical: 4
  },
  viewFinder: {
    height: 180,
    borderRadius: 14,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18
  },
  cTL: { top: 8, left: 8, borderTopWidth: 3, borderLeftWidth: 3 },
  cTR: { top: 8, right: 8, borderTopWidth: 3, borderRightWidth: 3 },
  cBL: { bottom: 8, left: 8, borderBottomWidth: 3, borderLeftWidth: 3 },
  cBR: { bottom: 8, right: 8, borderBottomWidth: 3, borderRightWidth: 3 },
  laserLine: {
    position: 'absolute',
    top: 14,
    left: '10%',
    width: '80%',
    height: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4
  },
  qrIconWrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  qrIconText: {
    fontSize: 48,
    color: '#64748b'
  },
  qrCaption: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '700'
  },
  quickAccessSection: {
    marginTop: 18
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14
  },
  verifyBtn: {
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  verifyBtnText: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.8
  },
  demoHint: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 6
  },
  demoChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  demoChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  demoChipText: {
    fontSize: 11,
    fontWeight: '800'
  },
  certCard: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1
  },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  certStatusPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  certStatusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  certDate: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  certTrackTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  certArtist: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2
  },
  hashBox: {
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderWidth: 1
  },
  hashLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  hashValue: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginTop: 2
  },
  certGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14
  },
  certGridItem: {
    width: '48%',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1
  },
  gridLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  gridVal: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2
  },
  certActionBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18
  },
  certActionText: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.8
  },
  scanAgainBtn: {
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  scanAgainText: {
    fontWeight: '800',
    fontSize: 11
  }
});
