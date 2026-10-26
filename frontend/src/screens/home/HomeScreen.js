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
import { colors } from '../../theme/colors';

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

  async function handleClaim(pressing) {
    try {
      setClaimingId(pressing.id);
      const res = await apiRequest('/copies/claim', {
        method: 'POST',
        token,
        body: { pressingId: pressing.id }
      });
      Alert.alert(
        '¡Copia adquirida!',
        `Copia #${res.copyNumber} agregada con éxito a tu colección. Podés escucharla en la pestaña "Colección".`,
        [
          { text: 'Ir a Colección', onPress: () => navigation.navigate('Colección') },
          { text: 'Seguir explorando', style: 'cancel' }
        ]
      );
      await loadData();
    } catch (error) {
      Alert.alert('No se pudo adquirir', error.message);
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Catálogo Oficial</Text>
        <Text style={styles.caption}>Cintas magnéticas originales y tiradas limitadas</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderItem={({ item }) => {
            const trackPressing = pressings.find((p) => p.track_id === item.id);
            const isClaiming = trackPressing && claimingId === trackPressing.id;
            const available = trackPressing ? trackPressing.available_copies : 0;

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackTitle}>{item.title}</Text>
                    <View style={styles.artistRow}>
                      <Text style={styles.artistName}>{item.artist_name}</Text>
                      {item.verified ? (
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedText}>✓ Verificado</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.licenseBadge}>
                    <Text style={styles.licenseText}>{item.license_type}</Text>
                  </View>
                </View>

                {item.description ? (
                  <Text style={styles.description}>{item.description}</Text>
                ) : null}

                {trackPressing ? (
                  <View style={styles.pressingInfo}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Disponibles</Text>
                      <Text style={[styles.statValue, available > 0 ? styles.statAvailable : styles.statSoldOut]}>
                        {available} / {trackPressing.total_copies}
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Límite Gen</Text>
                      <Text style={styles.statValue}>G{trackPressing.generation_limit}</Text>
                    </View>

                    <Pressable
                      style={[
                        styles.claimBtn,
                        (available === 0 || isClaiming) && styles.claimBtnDisabled
                      ]}
                      disabled={available === 0 || isClaiming}
                      onPress={() => handleClaim(trackPressing)}
                    >
                      {isClaiming ? (
                        <ActivityIndicator color={colors.background} size="small" />
                      ) : (
                        <Text style={styles.claimBtnText}>
                          {available > 0 ? 'Adquirir Cinta' : 'Agotada'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.noPressingText}>Sin tirada física activa actualmente.</Text>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>Todavía no hay pistas publicadas en el catálogo.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 18 },
  header: { marginBottom: 16 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: 0.5 },
  caption: { color: colors.muted, fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  trackTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  artistRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  artistName: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  verifiedBadge: {
    backgroundColor: '#1b2a1a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.success
  },
  verifiedText: { color: colors.success, fontSize: 10, fontWeight: '800' },
  licenseBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  licenseText: { color: colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  description: { color: colors.muted, fontSize: 13, marginTop: 10, lineHeight: 18 },
  pressingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111115',
    padding: 12,
    borderRadius: 10,
    marginTop: 14
  },
  statBox: { alignItems: 'center' },
  statLabel: { color: colors.muted, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' },
  statValue: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 2 },
  statAvailable: { color: colors.accent },
  statSoldOut: { color: colors.danger },
  claimBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8
  },
  claimBtnDisabled: { opacity: 0.4 },
  claimBtnText: { color: colors.background, fontWeight: '900', fontSize: 13 },
  noPressingText: { color: colors.muted, fontSize: 12, fontStyle: 'italic', marginTop: 10 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40, fontSize: 14 }
});
