import { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  FlatList, 
  Pressable, 
  RefreshControl, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  View 
} from 'react-native';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { colors, shadows } from '../../theme/colors';

export default function HomeScreen({ navigation }) {
  const { token, user } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [pressings, setPressings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState(null);

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
      Alert.alert(
        '¡Copia física adquirida!',
        `Se agregó la Copia #${res.copyNumber} de "${trackTitle}" a tu colección personal.\nCondición inicial: 100% (Gen 0).`,
        [
          { text: 'Ir a Mi Colección', onPress: () => navigation.navigate('Colección') },
          { text: 'Seguir explorando', style: 'cancel' }
        ]
      );
      await loadData();
    } catch (error) {
      Alert.alert('No se pudo adquirir la copia', error.message);
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Banner / Título */}
      <View style={styles.topBar}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Catálogo Oficial</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{tracks.length} PISTAS</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Cintas analógicas originales masterizadas en tiradas físicas limitadas.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>Cargando tiradas disponibles...</Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderItem={({ item }) => {
            const trackPressing = pressings.find((p) => p.track_id === item.id);
            const isClaiming = trackPressing && claimingId === trackPressing.id;
            const available = trackPressing ? trackPressing.available_copies : 0;
            const total = trackPressing ? trackPressing.total_copies : 0;
            const isSoldOut = trackPressing && available === 0;

            return (
              <View style={[styles.card, shadows.sm]}>
                {/* Header de la Pista */}
                <View style={styles.cardHeader}>
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle}>{item.title}</Text>
                    <View style={styles.artistRow}>
                      <Text style={styles.artistName}>{item.artist_name}</Text>
                      {item.verified ? (
                        <View style={styles.verifiedTag}>
                          <Text style={styles.verifiedText}>✓ Sello Verificado</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.licenseTag}>
                    <Text style={styles.licenseText}>{item.license_type}</Text>
                  </View>
                </View>

                {/* Descripción contextual */}
                {item.description ? (
                  <Text style={styles.description}>{item.description}</Text>
                ) : null}

                {/* Caja de Tirada Física (Pressing Bar) */}
                {trackPressing ? (
                  <View style={styles.pressingBox}>
                    <View style={styles.pressingStats}>
                      <View style={styles.statCol}>
                        <Text style={styles.statLabel}>COPIAS DISPONIBLES</Text>
                        <Text style={[styles.statValue, isSoldOut ? styles.statSoldOut : styles.statInStock]}>
                          {available} <Text style={styles.statTotal}>/ {total}</Text>
                        </Text>
                      </View>

                      <View style={styles.statCol}>
                        <Text style={styles.statLabel}>LÍMITE DUBBEO</Text>
                        <Text style={styles.statGenValue}>Hasta Gen {trackPressing.generation_limit}</Text>
                      </View>
                    </View>

                    {/* Botón de Adquisición */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.claimBtn,
                        isSoldOut && styles.claimBtnSoldOut,
                        pressed && !isSoldOut && styles.claimBtnPressed,
                        isClaiming && styles.claimBtnDisabled
                      ]}
                      disabled={isSoldOut || isClaiming}
                      onPress={() => handleClaim(trackPressing, item.title)}
                    >
                      {isClaiming ? (
                        <ActivityIndicator color={colors.background} size="small" />
                      ) : (
                        <Text style={[styles.claimBtnText, isSoldOut && styles.claimBtnTextSoldOut]}>
                          {isSoldOut ? 'TIRADA AGOTADA' : 'ADQUIRIR CINTA FÍSICA'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.noPressingBox}>
                    <Text style={styles.noPressingText}>Sin tirada física activa actualmente.</Text>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📼</Text>
              <Text style={styles.emptyTitle}>Catálogo Vacío</Text>
              <Text style={styles.emptySub}>
                Todavía no hay pistas ni tiradas registradas. Si tenés rol de Artista o Admin podés acuñar la primera desde "Estudio Artista".
              </Text>
            </View>
          }
        />
      )}
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.backgroundElevated
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  badgeCount: {
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgeCountText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    maxWidth: 680,
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
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  trackInfo: {
    flex: 1
  },
  trackTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap'
  },
  artistName: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13
  },
  verifiedTag: {
    backgroundColor: colors.successMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.successBorder
  },
  verifiedText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '800'
  },
  licenseTag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  licenseText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18
  },
  pressingBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  pressingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  statCol: {},
  statLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2
  },
  statInStock: {
    color: colors.accent
  },
  statSoldOut: {
    color: colors.danger
  },
  statTotal: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  statGenValue: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2
  },
  claimBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  claimBtnPressed: {
    backgroundColor: colors.accentHover
  },
  claimBtnSoldOut: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border
  },
  claimBtnDisabled: {
    opacity: 0.7
  },
  claimBtnText: {
    color: colors.background,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.8
  },
  claimBtnTextSoldOut: {
    color: colors.mutedDark,
    fontWeight: '800'
  },
  noPressingBox: {
    backgroundColor: colors.surfaceDark,
    padding: 12,
    borderRadius: 8,
    marginTop: 12
  },
  noPressingText: {
    color: colors.mutedDark,
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
    color: colors.text,
    fontSize: 18,
    fontWeight: '800'
  },
  emptySub: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18
  }
});
