// Modo Museo: vista pública y cuidada para exhibir colecciones destacadas, artistas y piezas históricas.
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useFeedback } from '../../context/FeedbackContext';
import { useTheme } from '../../context/ThemeContext';
import QrScannerModal from '../../components/QrScannerModal';
import { shadows } from '../../theme/colors';

// Piezas históricas preservadas en el museo
const MUSEUM_PIECES = [
  {
    id: 'm1',
    title: "No Life 'Til Leather (Original 1982 Demo)",
    year: '1982',
    category: 'MÁSTER FUNDACIONAL',
    type: 'Cassette Type I · Ferro',
    curatorialNotes:
      'La cinta que originó el fenómeno del tape trading internacional. Grabada en vivo en Chateau Liberté en julio de 1982 y duplicada de mano en mano entre San Francisco y Europa.',
    soundSpec: 'Mono Soundboard Mix · Calidad Histórica',
    curatorBadge: 'PIEZA PATRIMONIAL #001',
    authenticityHash: 'SHA-HISTORIC-1982-NLTL-001-ALPHA',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'm2',
    title: 'Ride The Lightning (Sweet Silence Studio Rough)',
    year: '1984',
    category: 'MEZCLA DE CONSOLA',
    type: 'Chrome Type II · High Bias',
    curatorialNotes:
      'Copia de referencia enviada por Flemming Rasmussen a la discográfica antes de la masterización definitiva. Conserva las pistas de guitarra guía y ecos de sala.',
    soundSpec: 'Stereo 24-Track Rehearsal · Sin compresión digital',
    curatorBadge: 'PIEZA PATRIMONIAL #002',
    authenticityHash: 'SHA-HISTORIC-1984-RTL-002-BETA',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'm3',
    title: 'Master of Puppets (Soundboard Tape Roskilde 1986)',
    year: '1986',
    category: 'VIVO SOUNDBOARD',
    type: 'Metal Type IV · Pure Pigment',
    curatorialNotes:
      'Captura directa desde la consola del festival Roskilde. La última gira europea de Cliff Burton. Considerada la cúspide de fidelidad sonora en cinta analógica.',
    soundSpec: 'Soundboard Master Direct · Espectro 20Hz-20kHz',
    curatorBadge: 'PIEZA PATRIMONIAL #003',
    authenticityHash: 'SHA-HISTORIC-1986-MOP-003-GAMMA',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 'm4',
    title: 'The $5.98 E.P. - Garage Days Re-Revisited',
    year: '1987',
    category: 'EDICIÓN ESPECIAL',
    type: 'Cassette Cromo · Edición Limitada',
    curatorialNotes:
      'EP grabado en el garage de Lars Ulrich con el lema de no pagar más de $5.98 dólares. Representa el espíritu autogestivo y rebelde del archivo.',
    soundSpec: 'Garage Sound Direct · Raw Energy',
    curatorBadge: 'PIEZA PATRIMONIAL #004',
    authenticityHash: 'SHA-HISTORIC-1987-GD-004-DELTA',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  }
];

const NOTABLE_COLLECTIONS = [
  {
    id: 'col-1',
    trader: 'Lars_Vault_Archivist',
    title: 'Colección Máster Primera Generación (Gen 0)',
    tapesCount: 48,
    reputation: 'Preservador Diamante',
    badge: '100% Sin Pérdida'
  },
  {
    id: 'col-2',
    trader: 'BayArea_Soundboard',
    title: 'Archivos En Vivo San Francisco 1983-1989',
    tapesCount: 32,
    reputation: 'Tape Trader Pionero',
    badge: 'Frecuencia Verificada'
  },
  {
    id: 'col-3',
    trader: 'Cliff_Basslines_Archive',
    title: 'Aislados de Bajo y Líneas de Estudio',
    tapesCount: 19,
    reputation: 'Curador Certificado',
    badge: 'Acústica Análoga'
  }
];

export default function MuseumScreen({ navigation }) {
  const { palette, isDark, toggleTheme } = useTheme();
  const { notify } = useFeedback();

  const [selectedPiece, setSelectedPiece] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('pieces'); // 'pieces', 'collections', 'curatorship'

  async function playMuseumSample(piece) {
    if (playingId === piece.id) {
      setPlayingId(null);
      return;
    }
    setPlayingId(piece.id);
    notify('Reproducción en Cabezal de Museo', `Sonando muestra histórica de “${piece.title}”.`, 'info');
    setTimeout(() => {
      setPlayingId((curr) => (curr === piece.id ? null : curr));
    }, 8000);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Top Bar de Museo con Escáner y Conmutador Día/Noche */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: palette.backgroundElevated, borderBottomColor: palette.borderSubtle }
        ]}
      >
        <View style={styles.topBarInner}>
          <View style={styles.titleCol}>
            <View style={styles.museumBadgeRow}>
              <View style={[styles.goldPill, { backgroundColor: palette.accentMuted, borderColor: palette.accentBorder }]}>
                <Text style={[styles.goldPillText, { color: palette.accent }]}>🏛️ MODO MUSEO PÚBLICO</Text>
              </View>
              <Text style={[styles.hallStatus, { color: palette.muted }]}>EXHIBICIÓN ACTIVA</Text>
            </View>
            <Text style={[styles.title, { color: palette.text }]}>Museo Analógico</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>
              Preservación histórica, vitrinas comunitarias destacadas y certificados de autenticidad.
            </Text>
          </View>

          {/* Botones de Cabecera: Escáner QR y Tema */}
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.qrScannerBtn, { backgroundColor: palette.cyanMuted, borderColor: palette.cyanBorder }]}
              onPress={() => setScannerVisible(true)}
            >
              <Text style={[styles.qrScannerBtnText, { color: palette.cyan }]}>⛶ ESCANEAR QR</Text>
            </Pressable>

            <Pressable
              style={[styles.themePillBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
              onPress={toggleTheme}
            >
              <Text style={[styles.themePillText, { color: palette.text }]}>
                {isDark ? '☀ DÍA' : '◐ NOCHE'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Selector de Salas del Museo */}
        <View style={styles.tabsRow}>
          <Pressable
            style={[
              styles.tabBtn,
              activeTab === 'pieces' && [styles.tabBtnActive, { borderColor: palette.accent, backgroundColor: palette.accentMuted }]
            ]}
            onPress={() => setActiveTab('pieces')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'pieces' ? palette.accent : palette.muted }
              ]}
            >
              Másters Históricos (4)
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabBtn,
              activeTab === 'collections' && [styles.tabBtnActive, { borderColor: palette.accent, backgroundColor: palette.accentMuted }]
            ]}
            onPress={() => setActiveTab('collections')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'collections' ? palette.accent : palette.muted }
              ]}
            >
              Vitrinas Notables (3)
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabBtn,
              activeTab === 'curatorship' && [styles.tabBtnActive, { borderColor: palette.accent, backgroundColor: palette.accentMuted }]
            ]}
            onPress={() => setActiveTab('curatorship')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'curatorship' ? palette.accent : palette.muted }
              ]}
            >
              Firma Curatorial
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'pieces' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                SALA 1: CINTAS MÁSTER FUNDACIONALES
              </Text>
              <Text style={[styles.sectionSubtitle, { color: palette.muted }]}>
                Grabaciones originales preservadas en temperatura y humedad controladas.
              </Text>
            </View>

            {MUSEUM_PIECES.map((piece) => {
              const isPlaying = playingId === piece.id;
              return (
                <View
                  key={piece.id}
                  style={[
                    styles.pieceCard,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                    shadows.sm
                  ]}
                >
                  <View style={styles.pieceHeader}>
                    <View style={[styles.curatorBadge, { backgroundColor: palette.accentMuted, borderColor: palette.accentBorder }]}>
                      <Text style={[styles.curatorBadgeText, { color: palette.accent }]}>
                        {piece.curatorBadge}
                      </Text>
                    </View>
                    <Text style={[styles.pieceYear, { color: palette.muted }]}>{piece.year}</Text>
                  </View>

                  <Text style={[styles.pieceTitle, { color: palette.text }]}>{piece.title}</Text>
                  <Text style={[styles.pieceCategory, { color: palette.cyan }]}>
                    {piece.category} · <Text style={{ color: palette.muted }}>{piece.type}</Text>
                  </Text>

                  <Text style={[styles.pieceNotes, { color: palette.textSecondary }]}>
                    {piece.curatorialNotes}
                  </Text>

                  {/* Especificación de Fidelidad Sonora */}
                  <View style={[styles.soundSpecBox, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                    <Text style={[styles.soundSpecLabel, { color: palette.muted }]}>ESPECIFICACIÓN ACÚSTICA:</Text>
                    <Text style={[styles.soundSpecVal, { color: palette.accent }]}>{piece.soundSpec}</Text>
                  </View>

                  {/* Acciones de Museo */}
                  <View style={styles.pieceActions}>
                    <Pressable
                      style={[
                        styles.playSampleBtn,
                        { backgroundColor: isPlaying ? palette.success : palette.accent }
                      ]}
                      onPress={() => playMuseumSample(piece)}
                    >
                      <Text style={[styles.playSampleText, { color: palette.background }]}>
                        {isPlaying ? '❚❚ DETENER MUESTRA' : '▶ ESCUCHAR MUESTRA MÁSTER'}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.inspectPieceBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
                      onPress={() => setSelectedPiece(piece)}
                    >
                      <Text style={[styles.inspectPieceText, { color: palette.textSecondary }]}>
                        🔍 FICHA CURATORIAL
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'collections' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                SALA 2: VITRINAS DESTACADAS DE LA COMUNIDAD
              </Text>
              <Text style={[styles.sectionSubtitle, { color: palette.muted }]}>
                Colecciones privadas seleccionadas por el comité curatorial de tape trading.
              </Text>
            </View>

            {NOTABLE_COLLECTIONS.map((c) => (
              <View
                key={c.id}
                style={[
                  styles.collectionCard,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                  shadows.sm
                ]}
              >
                <View style={styles.collectionTop}>
                  <View style={styles.collectionAvatar}>
                    <Text style={styles.collectionAvatarText}>📼</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.collectionTrader, { color: palette.accent }]}>
                      @{c.trader}
                    </Text>
                    <Text style={[styles.collectionTitle, { color: palette.text }]}>
                      {c.title}
                    </Text>
                    <Text style={[styles.collectionRep, { color: palette.muted }]}>
                      {c.reputation} · {c.tapesCount} cintas activas en vitrina
                    </Text>
                  </View>
                  <View style={[styles.collectionBadge, { backgroundColor: palette.cyanMuted, borderColor: palette.cyanBorder }]}>
                    <Text style={[styles.collectionBadgeText, { color: palette.cyan }]}>
                      {c.badge}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={[styles.viewShowcaseBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
                  onPress={() =>
                    notify('Vitrina Abierta', `Visualizando colección pública de @${c.trader}.`, 'info')
                  }
                >
                  <Text style={[styles.viewShowcaseText, { color: palette.textSecondary }]}>
                    VISITAR VITRINA PÚBLICA ➔
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'curatorship' && (
          <View
            style={[
              styles.curatorshipCard,
              { backgroundColor: palette.surface, borderColor: palette.border },
              shadows.md
            ]}
          >
            <View style={[styles.sealBadge, { backgroundColor: palette.accentMuted, borderColor: palette.accentBorder }]}>
              <Text style={[styles.sealBadgeText, { color: palette.accent }]}>
                CERTIFICADO DE PRESERVACIÓN HISTÓRICA
              </Text>
            </View>
            <Text style={[styles.manifestoTitle, { color: palette.text }]}>
              Manifiesto del Tape Trading y Preservación Analógica
            </Text>
            <Text style={[styles.manifestoBody, { color: palette.textSecondary }]}>
              El tape trading no es simplemente un intercambio de soportes físicos; es la red descentralizada que permitió que el heavy metal, el punk y la música independiente crecieran antes de Internet.{'\n\n'}
              En metallica.vis, cada reproducción desgasta de manera tangible la señal de audio, honrando el paso del tiempo y otorgando a cada copia un sonido único e irrepetible.
            </Text>

            <View style={[styles.curatorSignBox, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
              <Text style={[styles.curatorSignLabel, { color: palette.muted }]}>
                CURADURÍA CENTRAL · REGISTRO PÚBLICO
              </Text>
              <Text style={[styles.curatorSignName, { color: palette.text }]}>
                Archivo de Preservación Sonora Metallica.vis
              </Text>
              <Text style={[styles.curatorHash, { color: palette.cyan }]}>
                HASH DE ARCHIVO: SHA-256-CURATORSHIP-GENESIS-2026
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal Ficha Curatorial de Pieza */}
      <Modal visible={Boolean(selectedPiece)} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: palette.surface, borderColor: palette.border },
              shadows.lg
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalBadge, { color: palette.accent }]}>
                FICHA TÉCNICA Y CURATORIAL
              </Text>
              <Text style={[styles.modalTitle, { color: palette.text }]}>
                {selectedPiece?.title}
              </Text>
              <Text style={[styles.modalSub, { color: palette.cyan }]}>
                Año {selectedPiece?.year} · {selectedPiece?.category}
              </Text>
            </View>

            <Text style={[styles.modalDesc, { color: palette.textSecondary }]}>
              {selectedPiece?.curatorialNotes}
            </Text>

            <View style={[styles.hashCard, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
              <Text style={[styles.hashCardLabel, { color: palette.muted }]}>
                HUELLA CRIPTOGRÁFICA DE MATRIZ:
              </Text>
              <Text style={[styles.hashCardVal, { color: palette.cyan }]}>
                {selectedPiece?.authenticityHash}
              </Text>
            </View>

            <Pressable
              style={[styles.modalCloseBtn, { backgroundColor: palette.accent }]}
              onPress={() => setSelectedPiece(null)}
            >
              <Text style={[styles.modalCloseBtnText, { color: palette.background }]}>
                CERRAR FICHA DE EXHIBICIÓN
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal del Escáner QR */}
      <QrScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onOpenTape={(tape) => {
          notify('Cinta Encontrada', `Accediendo a “${tape.trackTitle}” en colección.`, 'success');
        }}
      />
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
    paddingBottom: 14,
    borderBottomWidth: 1
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%'
  },
  titleCol: {
    flex: 1
  },
  museumBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  goldPill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  goldPillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  hallStatus: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
    maxWidth: 440
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  qrScannerBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  qrScannerBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  themePillBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8
  },
  themePillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    marginTop: 14
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  tabBtnActive: {
    borderRadius: 20
  },
  tabText: {
    fontSize: 11,
    fontWeight: '800'
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center'
  },
  sectionHeaderRow: {
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2
  },
  pieceCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1
  },
  pieceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  curatorBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  curatorBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  pieceYear: {
    fontSize: 11,
    fontWeight: '800'
  },
  pieceTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  pieceCategory: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3
  },
  pieceNotes: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8
  },
  soundSpecBox: {
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderWidth: 1
  },
  soundSpecLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  soundSpecVal: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2
  },
  pieceActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14
  },
  playSampleBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  playSampleText: {
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5
  },
  inspectPieceBtn: {
    flex: 1.5,
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  inspectPieceText: {
    fontWeight: '800',
    fontSize: 11
  },
  collectionCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1
  },
  collectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  collectionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0a0d14',
    alignItems: 'center',
    justifyContent: 'center'
  },
  collectionAvatarText: {
    fontSize: 22
  },
  collectionTrader: {
    fontSize: 12,
    fontWeight: '800'
  },
  collectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1
  },
  collectionRep: {
    fontSize: 11,
    marginTop: 2
  },
  collectionBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  collectionBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  viewShowcaseBtn: {
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12
  },
  viewShowcaseText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  curatorshipCard: {
    borderRadius: 16,
    padding: 22,
    borderWidth: 1
  },
  sealBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12
  },
  sealBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  manifestoTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 10
  },
  manifestoBody: {
    fontSize: 13,
    lineHeight: 20
  },
  curatorSignBox: {
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    borderWidth: 1
  },
  curatorSignLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  curatorSignName: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2
  },
  curatorHash: {
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 4,
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 10, 0.92)',
    justifyContent: 'center',
    padding: 20
  },
  modalBox: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center'
  },
  modalHeader: {
    marginBottom: 14
  },
  modalBadge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  modalSub: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14
  },
  hashCard: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    marginBottom: 16
  },
  hashCardLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  hashCardVal: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginTop: 2
  },
  modalCloseBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  modalCloseBtnText: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.8
  }
});
