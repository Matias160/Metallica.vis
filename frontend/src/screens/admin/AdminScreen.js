import { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  FlatList, 
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
import { colors } from '../../theme/colors';

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
      Alert.alert('Éxito', `El artista "${artist.name}" ha sido verificado.`);
      await loadAdminData();
    } catch (err) {
      Alert.alert('Error al verificar', err.message);
    }
  }

  async function handleToggleStatus(u) {
    try {
      const res = await apiRequest(`/admin/users/${u.id}/status`, { method: 'PATCH', token });
      Alert.alert('Estado actualizado', res.message);
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
      Alert.alert('Rol asignado', `El usuario ${u.username} ahora posee el rol "${newRole}".`);
      await loadAdminData();
    } catch (err) {
      Alert.alert('Error al asignar rol', err.message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <Text style={styles.title}>Panel de Control Admin</Text>
        <Text style={styles.caption}>Auditoría global, moderación de sellos y usuarios</Text>

        {loading ? (
          <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Métricas Globales */}
            <Text style={styles.sectionHeader}>Métricas del Sistema</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats?.totalUsers ?? '-'}</Text>
                <Text style={styles.statTitle}>Usuarios</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats?.totalTracks ?? '-'}</Text>
                <Text style={styles.statTitle}>Pistas</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats?.totalPressings ?? '-'}</Text>
                <Text style={styles.statTitle}>Tiradas</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: colors.accent }]}>
                  {stats?.totalCopiesCirculating ?? '-'}
                </Text>
                <Text style={styles.statTitle}>En Colección</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats?.totalPlays ?? '-'}</Text>
                <Text style={styles.statTitle}>Reproducciones</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#38bdf8' }]}>
                  {stats?.totalTransfers ?? '-'}
                </Text>
                <Text style={styles.statTitle}>Traspasos Dub</Text>
              </View>
            </View>

            {/* Verificación de Artistas */}
            <Text style={styles.sectionHeader}>Sellos y Artistas</Text>
            {artists.map((a) => (
              <View key={a.id} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{a.name}</Text>
                  <Text style={styles.rowSub}>ID #{a.id} · {a.biography || 'Sin biografía'}</Text>
                </View>
                {a.verified ? (
                  <View style={styles.badgeVerified}>
                    <Text style={styles.badgeText}>✓ Verificado</Text>
                  </View>
                ) : (
                  <Pressable style={styles.verifyBtn} onPress={() => handleVerifyArtist(a)}>
                    <Text style={styles.verifyBtnText}>Verificar</Text>
                  </Pressable>
                )}
              </View>
            ))}

            {/* Listado y Gestión de Usuarios */}
            <Text style={styles.sectionHeader}>Gestión de Usuarios ({users.length})</Text>
            {users.map((u) => (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.userTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userDisplayName}>{u.display_name} (@{u.username})</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                    <Text style={styles.userRoles}>
                      Roles: {u.roles.join(', ') || 'sin rol'} · Copias activas: {u.owned_copies_count}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.statusBadge, u.is_active ? styles.statusActive : styles.statusSuspended]}
                    onPress={() => handleToggleStatus(u)}
                  >
                    <Text style={styles.statusText}>{u.is_active ? 'Activo' : 'Suspendido'}</Text>
                  </Pressable>
                </View>

                {/* Asignación de Roles */}
                <View style={styles.roleAssignment}>
                  <Text style={styles.roleAssignLabel}>Asignar Rol:</Text>
                  <Pressable 
                    style={[styles.roleBtn, u.roles.includes('collector') && styles.roleBtnSelected]} 
                    onPress={() => handleAssignRole(u, 'collector')}
                  >
                    <Text style={styles.roleBtnText}>Coleccionista</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.roleBtn, u.roles.includes('artist') && styles.roleBtnSelected]} 
                    onPress={() => handleAssignRole(u, 'artist')}
                  >
                    <Text style={styles.roleBtnText}>Artista</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.roleBtn, u.roles.includes('admin') && styles.roleBtnSelected]} 
                    onPress={() => handleAssignRole(u, 'admin')}
                  >
                    <Text style={styles.roleBtnText}>Admin</Text>
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
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 18, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900' },
  caption: { color: colors.muted, fontSize: 13, marginTop: 4, marginBottom: 16 },
  sectionHeader: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 10
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  statCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center'
  },
  statNumber: { color: colors.text, fontSize: 20, fontWeight: '900' },
  statTitle: { color: colors.muted, fontSize: 10, textTransform: 'uppercase', marginTop: 4, textAlign: 'center' },
  rowCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badgeVerified: {
    backgroundColor: '#1b2a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.success
  },
  badgeText: { color: colors.success, fontSize: 11, fontWeight: '800' },
  verifyBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  verifyBtnText: { color: colors.background, fontWeight: '800', fontSize: 12 },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  userTop: { flexDirection: 'row', alignItems: 'flex-start' },
  userDisplayName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  userEmail: { color: colors.muted, fontSize: 12, marginTop: 2 },
  userRoles: { color: colors.accent, fontSize: 11, marginTop: 4, fontWeight: '600' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1
  },
  statusActive: { backgroundColor: '#132817', borderColor: colors.success },
  statusSuspended: { backgroundColor: '#38161c', borderColor: colors.danger },
  statusText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  roleAssignment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  roleAssignLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  roleBtn: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  roleBtnSelected: {
    borderColor: colors.accent,
    backgroundColor: '#1d2212'
  },
  roleBtnText: { color: colors.text, fontSize: 11, fontWeight: '700' }
});
