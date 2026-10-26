import { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  Pressable, 
  RefreshControl, 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View 
} from 'react-native';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { colors, shadows } from '../../theme/colors';

export default function AdminScreen() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadAdminData() {
    try {
      const [statsData, usersData, artistsData] = await Promise.all([
        apiRequest('/admin/stats', { token }),
        apiRequest('/admin/users', { token }),
        apiRequest('/artists', { token })
      ]);
      setStats(statsData.stats || null);
      setUsers(usersData.users || []);
      setArtists(artistsData.artists || []);
    } catch (err) {
      console.warn('Error loading admin dashboard:', err);
    }
  }

  useEffect(() => {
    loadAdminData().finally(() => setLoading(false));
  }, [token]);

  async function onRefresh() {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  }

  async function handleVerifyArtist(artist) {
    try {
      await apiRequest(`/artists/${artist.id}/verify`, { method: 'POST', token });
      Alert.alert('Éxito', `El sello discográfico "${artist.name}" ha sido verificado.`);
      await loadAdminData();
    } catch (err) {
      Alert.alert('Error al verificar', err.message);
    }
  }

  async function handleToggleStatus(u) {
    try {
      const res = await apiRequest(`/admin/users/${u.id}/status`, { method: 'PATCH', token });
      Alert.alert('Estado de cuenta actualizado', res.message);
      await loadAdminData();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleAssignRole(u, newRole) {
    try {
      await apiRequest(`/admin/users/${u.id}/role`, {
        method: 'POST',
        token,
        body: { role: newRole }
      });
      Alert.alert('Rol asignado', `El usuario @${u.username} ahora posee el rol "${newRole}".`);
      await loadAdminData();
    } catch (err) {
      Alert.alert('Error al asignar rol', err.message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Panel de Control Admin</Text>
          <Text style={styles.subtitle}>
            Auditoría de linaje, moderación de sellos discográficos y gestión de usuarios.
          </Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.loadingText}>Recuperando telemetría del sistema...</Text>
          </View>
        ) : (
          <>
            {/* Métricas Globales del Sistema */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>MÉTRICAS DEL SISTEMA EN TIEMPO REAL</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, shadows.sm]}>
                <Text style={styles.statLabel}>USUARIOS REGISTRADOS</Text>
                <Text style={styles.statNumber}>{stats?.totalUsers ?? '-'}</Text>
              </View>

              <View style={[styles.statCard, shadows.sm]}>
                <Text style={styles.statLabel}>SELLOS Y ARTISTAS</Text>
                <Text style={styles.statNumber}>{stats?.totalArtists ?? '-'}</Text>
              </View>

              <View style={[styles.statCard, shadows.sm]}>
                <Text style={styles.statLabel}>PISTAS EN MÁSTER</Text>
                <Text style={styles.statNumber}>{stats?.totalTracks ?? '-'}</Text>
              </View>

              <View style={[styles.statCard, shadows.sm]}>
                <Text style={styles.statLabel}>TIRADAS FÍSICAS</Text>
                <Text style={styles.statNumber}>{stats?.totalPressings ?? '-'}</Text>
              </View>

              <View style={[styles.statCard, shadows.sm, { borderColor: colors.accentBorder }]}>
                <Text style={[styles.statLabel, { color: colors.accent }]}>CINTAS EN CIRCULACIÓN</Text>
                <Text style={[styles.statNumber, { color: colors.accent }]}>
                  {stats?.totalCopiesCirculating ?? '-'}
                </Text>
              </View>

              <View style={[styles.statCard, shadows.sm, { borderColor: colors.cyanBorder }]}>
                <Text style={[styles.statLabel, { color: colors.cyan }]}>TRAPASOS / DUBS</Text>
                <Text style={[styles.statNumber, { color: colors.cyan }]}>
                  {stats?.totalTransfers ?? '-'}
                </Text>
              </View>
            </View>

            {/* Moderación de Sellos Discográficos */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>SELLOS Y ARTISTAS INDEPENDIENTES ({artists.length})</Text>
            </View>

            {artists.map((a) => (
              <View key={a.id} style={[styles.rowCard, shadows.sm]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{a.name}</Text>
                  <Text style={styles.rowSub}>ID #{a.id} · {a.biography || 'Sin biografía añadida'}</Text>
                </View>
                {a.verified ? (
                  <View style={styles.badgeVerified}>
                    <Text style={styles.badgeText}>✓ Verificado</Text>
                  </View>
                ) : (
                  <Pressable 
                    style={({ pressed }) => [
                      styles.verifyBtn,
                      pressed && { backgroundColor: colors.accentHover }
                    ]} 
                    onPress={() => handleVerifyArtist(a)}
                  >
                    <Text style={styles.verifyBtnText}>VERIFICAR SELLO</Text>
                  </Pressable>
                )}
              </View>
            ))}

            {/* Listado y Gestión de Usuarios */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>GESTIÓN DE USUARIOS Y ROLES ({users.length})</Text>
            </View>

            {users.map((u) => (
              <View key={u.id} style={[styles.userCard, shadows.sm]}>
                <View style={styles.userTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userDisplayName}>{u.display_name}</Text>
                    <Text style={styles.userHandle}>@{u.username} · {u.email}</Text>
                    <Text style={styles.userRoles}>
                      Roles: <Text style={{ color: colors.accent }}>{u.roles.join(', ') || 'sin rol'}</Text> · {u.owned_copies_count} cintas en su poder
                    </Text>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.statusBadge, 
                      u.is_active ? styles.statusActive : styles.statusSuspended,
                      pressed && { opacity: 0.8 }
                    ]}
                    onPress={() => handleToggleStatus(u)}
                  >
                    <Text style={[styles.statusText, u.is_active ? { color: colors.success } : { color: colors.danger }]}>
                      {u.is_active ? '● ACTIVO' : '✕ SUSPENDIDO'}
                    </Text>
                  </Pressable>
                </View>

                {/* Botones de Asignación de Rol */}
                <View style={styles.roleAssignment}>
                  <Text style={styles.roleAssignLabel}>ASIGNAR ROL:</Text>
                  <Pressable 
                    style={[styles.roleBtn, u.roles.includes('collector') && styles.roleBtnSelected]} 
                    onPress={() => handleAssignRole(u, 'collector')}
                  >
                    <Text style={[styles.roleBtnText, u.roles.includes('collector') && styles.roleBtnTextSelected]}>
                      Coleccionista
                    </Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.roleBtn, u.roles.includes('artist') && styles.roleBtnSelected]} 
                    onPress={() => handleAssignRole(u, 'artist')}
                  >
                    <Text style={[styles.roleBtnText, u.roles.includes('artist') && styles.roleBtnTextSelected]}>
                      Artista
                    </Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.roleBtn, u.roles.includes('admin') && styles.roleBtnSelected]} 
                    onPress={() => handleAssignRole(u, 'admin')}
                  >
                    <Text style={[styles.roleBtnText, u.roles.includes('admin') && styles.roleBtnTextSelected]}>
                      Admin
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
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
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center'
  },
  centerLoading: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  sectionHeaderRow: {
    marginTop: 18,
    marginBottom: 10
  },
  sectionHeader: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14
  },
  statLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  statNumber: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 6
  },
  rowCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12
  },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badgeVerified: {
    backgroundColor: colors.successMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.successBorder
  },
  badgeText: { color: colors.success, fontSize: 11, fontWeight: '800' },
  verifyBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6
  },
  verifyBtnText: {
    color: colors.background,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.5
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  userTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  userDisplayName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  userHandle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  userRoles: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1
  },
  statusActive: {
    backgroundColor: colors.successMuted,
    borderColor: colors.successBorder
  },
  statusSuspended: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.dangerBorder
  },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  roleAssignment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    flexWrap: 'wrap'
  },
  roleAssignLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  roleBtn: {
    backgroundColor: colors.surfaceDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  roleBtnSelected: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentMuted
  },
  roleBtnText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  roleBtnTextSelected: { color: colors.accent, fontWeight: '800' }
});
