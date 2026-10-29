// Catálogo oficial: exploración de pistas masterizadas, tiradas físicas, escáner QR y modo día/noche.
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useTheme } from '../../context/ThemeContext';
import QrScannerModal from '../../components/QrScannerModal';
import { shadows } from '../../theme/colors';

export default function HomeScreen({ navigation }) {
  const { token, user } = useAuth();
  const { palette, isDark, toggleTheme } = useTheme();
  const { notify } = useFeedback();

  const [tracks, setTracks] = useState([]);
  const [pressings, setPressings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [scannerVisible, setScannerVisible] = useState(false);

  async function loadData() {
    try {
      const [tracksData, pressingsData] = await Promise.all([
        apiRequest('/tracks', { token }),
        apiRequest('/pressings', { token })
      ]);
      setTracks(tracksData.tracks || []);
      setPressings(pressingsData.pressings || []);
    } catch (err) {
      console.warn('Error cargando catálogo:', err);
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

  async function handleClaim(pressing, trackTitle) {
    try {
      setClaimingId(pressing.id);
      const res = await apiRequest('/copies/claim', {
        method: 'POST',
        token,
        body: { pressingId: pressing.id }
      });
      notify(
        'Cinta física adquirida',
        `La copia #${res.copyNumber} de “${trackTitle}” se guardó en tu vitrina con condición 100% (Mint).`,
        'success'
      );
      await loadData();
    } catch (error) {
      notify('No se pudo adquirir la copia', error.message, 'error');
    } finally {
      setClaimingId(null);
    }
  }

  const filteredTracks = useMemo(() => {
    return tracks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      const trackPressing = pressings.find((p) => p.track_id === t.id);
      if (filterType === 'available') {
        return trackPressing && trackPressing.available_copies > 0;
      }
      if (filterType === 'verified') {
        return Boolean(t.verified);
      }
      return true;
    });
  }, [tracks, pressings, searchQuery, filterType]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Top Banner de Consola de Estudio */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: palette.backgroundElevated, borderBottomColor: palette.borderSubtle }
        ]}
      >
        <View style={styles.topBarInner}>
          <View style={styles.titleCol}>
            <View style={styles.badgeRow}>
              <View style={[styles.liveIndicator, { backgroundColor: palette.accent }]} />
              <Text style={[styles.badgeRowText, { color: palette.muted }]}>
                TAPE TRADING ARCHIVE · CATÁLOGO ANALÓGICO
              </Text>
            </View>
            <Text style={[styles.title, { color: palette.text }]}>Catálogo de Tiradas</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>
              Cintas máster físicas en tiradas estrictamente limitadas y numeradas.
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable
              style={[styles.qrScanBtn, { backgroundColor: palette.cyanMuted, borderColor: palette.cyanBorder }]}
              onPress={() => setScannerVisible(true)}
            >
              <Text style={[styles.qrScanBtnText, { color: palette.cyan }]}>⛶ ESCANEAR QR</Text>
            </Pressable>

            <Pressable
              style={[styles.themeBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
              onPress={toggleTheme}
            >
              <Text style={[styles.themeBtnText, { color: palette.text }]}>
                {isDark ? '☀ DÍA' : '◐ NOCHE'}
              </Text>
            </Pressable>

            <View style={[styles.badgeCount, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}>
              <Text style={[styles.badgeCountNumber, { color: palette.accent }]}>{tracks.length}</Text>
              <Text style={[styles.badgeCountLabel, { color: palette.muted }]}>MÁSTERS</Text>
            </View>
          </View>
        </View>

        {/* Buscador & Filtros */}
        <View style={styles.searchFilterRow}>
          <View style={[styles.searchBox, { backgroundColor: palette.surfaceDark, borderColor: palette.border }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              placeholder="Buscar por pista, artista o género..."
              placeholderTextColor={palette.mutedDark}
              style={[styles.searchInput, { color: palette.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <Text style={[styles.clearSearch, { color: palette.muted }]}>×</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.filtersScroll}>
            {[
              { id: 'all', label: `Todas (${tracks.length})` },
              { id: 'available', label: 'En Stock' },
              { id: 'verified', label: '✓ Sellos' }
            ].map((f) => (
              <Pressable
                key={f.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle },
                  filterType === f.id && [styles.filterChipActive, { backgroundColor: palette.accentMuted, borderColor: palette.accent }]
                ]}
                onPress={() => setFilterType(f.id)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: filterType === f.id ? palette.accent : palette.muted }
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={palette.accent} size="large" />
          <Text style={[styles.loadingText, { color: palette.muted }]}>
            Cargando tiradas maestras...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTracks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accent} />
          }
          renderItem={({ item }) => {
            const trackPressing = pressings.find((p) => p.track_id === item.id);
            const isClaiming = trackPressing && claimingId === trackPressing.id;
            const available = trackPressing ? trackPressing.available_copies : 0;
            const total = trackPressing ? trackPressing.total_copies : 0;
            const isSoldOut = trackPressing && available === 0;
            const percentageLeft = total > 0 ? (available / total) * 100 : 0;

            return (
              <View
                className="card-studio"
                style={[
                  styles.card,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                  shadows.md
                ]}
              >
                {/* Tornillos de esquina analógicos */}
                <View style={[styles.screw, styles.screwTL]} />
                <View style={[styles.screw, styles.screwTR]} />
                <View style={[styles.screw, styles.screwBL]} />
                <View style={[styles.screw, styles.screwBR]} />

                {/* Cabecera de la Pista */}
                <View style={styles.cardHeader}>
                  {/* Cassette Sleeve Graphic con Carretes */}
                  <View style={[styles.cassetteThumb, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                    <View style={styles.tapeSpools}>
                      <View style={[styles.tapeSpool, { borderColor: palette.accent }]} />
                      <View style={[styles.tapeWindow, { backgroundColor: palette.surfaceLight }]} />
                      <View style={[styles.tapeSpool, { borderColor: palette.accent }]} />
                    </View>
                    <Text style={[styles.tapeThumbText, { color: palette.muted }]}>REEL</Text>
                  </View>

                  <View style={styles.trackInfo}>
                    <Text style={[styles.trackTitle, { color: palette.text }]}>{item.title}</Text>
                    <View style={styles.artistRow}>
                      <Text style={[styles.artistName, { color: palette.accent }]}>{item.artist_name}</Text>
                      {item.verified ? (
                        <View style={[styles.verifiedTag, { backgroundColor: palette.successMuted, borderColor: palette.successBorder }]}>
                          <Text style={[styles.verifiedText, { color: palette.success }]}>✓ Sello Verificado</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View style={[styles.licenseTag, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}>
                    <Text style={[styles.licenseText, { color: palette.muted }]}>{item.license_type}</Text>
                  </View>
                </View>

                {item.description ? (
                  <Text style={[styles.description, { color: palette.textSecondary }]}>{item.description}</Text>
                ) : null}

                {/* Caja de Tirada Física */}
                {trackPressing ? (
                  <View style={[styles.pressingBox, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                    <View style={styles.pressingStats}>
                      <View style={styles.statCol}>
                        <Text style={[styles.statLabel, { color: palette.muted }]}>DISPONIBILIDAD EN BODEGA</Text>
                        <Text
                          style={[
                            styles.statValue,
                            { color: isSoldOut ? palette.danger : palette.accent }
                          ]}
                        >
                          {available} <Text style={[styles.statTotal, { color: palette.muted }]}>/ {total} COPIAS FÍSICAS</Text>
                        </Text>
                      </View>

                      <View style={styles.statRightCol}>
                        <Text style={[styles.statLabel, { color: palette.muted }]}>LINAJE PERMITIDO</Text>
                        <View style={[styles.genLimitBadge, { backgroundColor: palette.cyanMuted, borderColor: palette.cyanBorder }]}>
                          <Text style={[styles.genLimitText, { color: palette.cyan }]}>
                            Hasta Gen {trackPressing.generation_limit}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Barra de Progreso de Stock */}
                    <View style={[styles.stockBarBg, { backgroundColor: palette.surfaceLight }]}>
                      <View
                        style={[
                          styles.stockBarFill,
                          {
                            width: `${percentageLeft}%`,
                            backgroundColor:
                              percentageLeft > 40
                                ? palette.accent
                                : percentageLeft > 0
                                ? palette.warning
                                : palette.mutedDark
                          }
                        ]}
                      />
                    </View>

                    {/* Tecla de Platina / Botón con Relieve Táctil */}
                    <Pressable
                      className="btn-primary"
                      style={({ pressed }) => [
                        styles.claimBtn,
                        !isSoldOut && [styles.claimBtnTactile, { backgroundColor: palette.accent }],
                        isSoldOut && [styles.claimBtnSoldOut, { backgroundColor: palette.surfaceLight, borderColor: palette.border }],
                        pressed && !isSoldOut && styles.claimBtnPressed,
                        isClaiming && { opacity: 0.7 }
                      ]}
                      disabled={isSoldOut || isClaiming}
                      onPress={() => handleClaim(trackPressing, item.title)}
                    >
                      {isClaiming ? (
                        <ActivityIndicator color={palette.background} size="small" />
                      ) : (
                        <Text
                          style={[
                            styles.claimBtnText,
                            { color: isSoldOut ? palette.mutedDark : '#090a0f' }
                          ]}
                        >
                          {isSoldOut ? 'TIRADA AGOTADA' : 'ADQUIRIR CINTA FÍSICA · NUMERADA'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  <View style={[styles.noPressingBox, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                    <Text style={[styles.noPressingText, { color: palette.mutedDark }]}>
                      Sin tirada física activa en este momento.
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📼</Text>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>Sin pistas encontradas</Text>
              <Text style={[styles.emptySub, { color: palette.muted }]}>
                {searchQuery
                  ? 'No hay resultados para tu búsqueda. Probá con otro término.'
                  : 'Todavía no hay pistas ni tiradas registradas. Si sos Artista o Admin podés subir la primera desde "Estudio Artista".'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal del Escáner QR */}
      <QrScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onOpenTape={(tape) => {
          notify('Cinta Validada', `Copia #${tape.copyNumber} lista en colección.`, 'success');
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
    paddingBottom: 16,
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  liveIndicator: {
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
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
    maxWidth: 440
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  qrScanBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8
  },
  qrScanBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  themeBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8
  },
  themeBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  badgeCount: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeCountNumber: {
    fontSize: 16,
    fontWeight: '900'
  },
  badgeCountLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 1
  },
  searchFilterRow: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    marginTop: 14,
    gap: 10
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8
  },
  searchIcon: {
    fontSize: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0
  },
  clearSearch: {
    fontSize: 18,
    paddingHorizontal: 4
  },
  filtersScroll: {
    flexDirection: 'row',
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1
  },
  filterChipActive: {},
  filterText: {
    fontSize: 11,
    fontWeight: '700'
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
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    position: 'relative'
  },
  screw: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#323c52',
    borderWidth: 1,
    borderColor: '#151924'
  },
  screwTL: { top: 8, left: 8 },
  screwTR: { top: 8, right: 8 },
  screwBL: { bottom: 8, left: 8 },
  screwBR: { bottom: 8, right: 8 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  cassetteThumb: {
    width: 56,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4
  },
  tapeSpools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  tapeSpool: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2
  },
  tapeWindow: {
    width: 14,
    height: 6,
    borderRadius: 2
  },
  tapeThumbText: {
    fontSize: 8,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 0.8
  },
  trackInfo: {
    flex: 1
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap'
  },
  artistName: {
    fontWeight: '800',
    fontSize: 13
  },
  verifiedTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800'
  },
  licenseTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  licenseText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  description: {
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18
  },
  pressingBox: {
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1
  },
  pressingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  statCol: {},
  statRightCol: {
    alignItems: 'flex-end'
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2
  },
  statTotal: {
    fontSize: 11,
    fontWeight: '700'
  },
  genLimitBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3
  },
  genLimitText: {
    fontSize: 10,
    fontWeight: '800'
  },
  stockBarBg: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 3
  },
  claimBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  claimBtnTactile: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 3,
    borderBottomColor: '#b45309'
  },
  claimBtnPressed: {
    transform: [{ translateY: 2 }],
    borderBottomWidth: 1
  },
  claimBtnSoldOut: {
    borderWidth: 1
  },
  claimBtnText: {
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1.2
  },
  noPressingBox: {
    padding: 14,
    borderRadius: 10,
    marginTop: 14,
    borderWidth: 1
  },
  noPressingText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center'
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
    lineHeight: 19
  }
});
