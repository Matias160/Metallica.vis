// Panel de control archivista: telemetría analógica, moderación de sellos y administración de roles.
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useTheme } from '../../context/ThemeContext';
import { shadows } from '../../theme/colors';

export default function AdminScreen() {
  const { token } = useAuth();
  const { palette, isDark, toggleTheme } = useTheme();
  const { notify } = useFeedback();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [artists, setArtists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  async function loadAdminData() {
    try {
      const [statsData, usersData, artistsData, tracksData] = await Promise.all([
        apiRequest('/admin/stats', { token }),
        apiRequest('/admin/users', { token }),
        apiRequest('/artists', { token }),
        apiRequest('/tracks', { token })
      ]);
      setStats(statsData.stats || null);
      setUsers(usersData.users || []);
      setArtists(artistsData.artists || []);
      setTracks(tracksData.tracks || []);
    } catch (err) {
      console.warn('Error cargando panel archivista:', err);
    }
  }

  async function handleToggleFeaturedTrack(track) {
    try {
      const res = await apiRequest(`/admin/tracks/${track.id}/featured`, { method: 'PATCH', token });
      notify(res.isFeatured ? 'Pista destacada' : 'Pista desmarcada', res.message, 'success');
      await loadAdminData();
    } catch (err) {
      notify('Error al modificar pista', err.message, 'error');
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
      notify('Sello verificado', `“${artist.name}” fue habilitado oficialmente.`, 'success');
      await loadAdminData();
    } catch (err) {
      notify('No se pudo verificar el sello', err.message, 'error');
    }
  }

  function confirmToggleStatus(u) {
    const isBanning = u.is_active;
    const title = isBanning ? 'Banear / Suspender Usuario' : 'Reactivar Usuario';
    const message = isBanning
      ? `¿Confirmás que querés suspender a @${u.username}? Se revocarán todas sus sesiones de inmediato.`
      : `¿Deseás reactivar la cuenta de @${u.username}?`;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        handleToggleStatus(u);
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: isBanning ? 'Banear' : 'Activar',
          style: isBanning ? 'destructive' : 'default',
          onPress: () => handleToggleStatus(u)
        }
      ]);
    }
  }

  async function handleToggleStatus(u) {
    try {
      const res = await apiRequest(`/admin/users/${u.id}/status`, { method: 'PATCH', token });
      notify('Estado actualizado', res.message, 'success');
      await loadAdminData();
    } catch (err) {
      notify('No se pudo modificar el estado', err.message, 'error');
    }
  }

  async function handleAssignRole(u, newRole) {
    try {
      await apiRequest(`/admin/users/${u.id}/role`, {
        method: 'POST',
        token,
        body: { role: newRole }
      });
      notify('Rol asignado', `@${u.username} ahora posee el rol “${newRole}”.`, 'success');
      await loadAdminData();
    } catch (err) {
      notify('No se pudo asignar el rol', err.message, 'error');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View
        style={[
          styles.topBar,
          { backgroundColor: palette.backgroundElevated, borderBottomColor: palette.borderSubtle }
        ]}
      >
        <View style={styles.topBarInner}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={[styles.liveIndicator, { backgroundColor: palette.cyan }]} />
              <Text style={[styles.badgeRowText, { color: palette.muted }]}>
                CENTRO DE COMANDO Y AUDITORÍA · ARCHIVISTA
              </Text>
            </View>
            <Text style={[styles.title, { color: palette.text }]}>Panel Archivista</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>
              Telemetría global, moderación de sellos y gobierno de identidades.
            </Text>
          </View>

          <Pressable
            style={[styles.themeBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
            onPress={toggleTheme}
          >
            <Text style={[styles.themeBtnText, { color: palette.text }]}>
              {isDark ? '☀ DÍA' : '◐ NOCHE'}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accent} />
        }
      >
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={palette.accent} size="large" />
            <Text style={[styles.loadingText, { color: palette.muted }]}>
              Conectando a la base de datos de auditoría...
            </Text>
          </View>
        ) : (
          <>
            {/* Métricas Globales del Sistema */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeader, { color: palette.muted }]}>
                TELEMETRÍA ANALÓGICA EN TIEMPO REAL
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.sm]}>
                <Text style={[styles.statLabel, { color: palette.muted }]}>USUARIOS ACTIVOS</Text>
                <Text style={[styles.statNumber, { color: palette.text }]}>{stats?.totalUsers ?? '-'}</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.sm]}>
                <Text style={[styles.statLabel, { color: palette.muted }]}>SELLOS Y ARTISTAS</Text>
                <Text style={[styles.statNumber, { color: palette.text }]}>{stats?.totalArtists ?? '-'}</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.sm]}>
                <Text style={[styles.statLabel, { color: palette.muted }]}>PISTAS MÁSTER</Text>
                <Text style={[styles.statNumber, { color: palette.text }]}>{stats?.totalTracks ?? '-'}</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.sm]}>
                <Text style={[styles.statLabel, { color: palette.muted }]}>TIRADAS FÍSICAS</Text>
                <Text style={[styles.statNumber, { color: palette.text }]}>{stats?.totalPressings ?? '-'}</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.accentBorder }, shadows.sm]}>
                <Text style={[styles.statLabel, { color: palette.accent }]}>CINTAS EN CIRCULACIÓN</Text>
                <Text style={[styles.statNumber, { color: palette.accent }]}>
                  {stats?.totalCopiesCirculating ?? '-'}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.cyanBorder }, shadows.sm]}>
                <Text style={[styles.statLabel, { color: palette.cyan }]}>DUBBEOS REGISTRADOS</Text>
                <Text style={[styles.statNumber, { color: palette.cyan }]}>
                  {stats?.totalTransfers ?? '-'}
                </Text>
              </View>
            </View>

            {/* Moderación de Sellos Discográficos */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeader, { color: palette.muted }]}>
                SELLOS Y ARTISTAS REGISTRADOS ({artists.length})
              </Text>
            </View>

            {artists.map((a) => (
              <View key={a.id} style={[styles.rowCard, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.sm]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: palette.text }]}>{a.name}</Text>
                  <Text style={[styles.rowSub, { color: palette.muted }]}>ID #{a.id} · {a.biography || 'Sin biografía añadida'}</Text>
                </View>
                {a.verified ? (
                  <View style={[styles.badgeVerified, { backgroundColor: palette.successMuted, borderColor: palette.successBorder }]}>
                    <Text style={[styles.badgeText, { color: palette.success }]}>✓ Sello Verificado</Text>
                  </View>
                ) : (
                  <Pressable
                    style={[styles.verifyBtn, { backgroundColor: palette.accent }]}
                    onPress={() => handleVerifyArtist(a)}
                  >
                    <Text style={[styles.verifyBtnText, { color: palette.background }]}>VERIFICAR SELLO</Text>
                  </Pressable>
                )}
              </View>
            ))}

            {/* Curaduría de Pistas y Canciones Destacadas */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeader, { color: palette.muted }]}>
                CURADURÍA DE CATÁLOGO · CANCIONES DESTACADAS ({tracks.filter((t) => t.is_featured).length}/{tracks.length})
              </Text>
            </View>

            {tracks.length === 0 ? (
              <View style={[styles.rowCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Text style={[styles.rowSub, { color: palette.muted }]}>No hay pistas registradas en el máster todavía.</Text>
              </View>
            ) : (
              tracks.map((t) => (
                <View
                  key={t.id}
                  style={[
                    styles.rowCard,
                    { backgroundColor: palette.surface, borderColor: t.is_featured ? palette.accent : palette.border },
                    t.is_featured && shadows.glowAccent
                  ]}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {t.is_featured ? (
                        <Text style={{ fontSize: 13, color: palette.accent }}>★</Text>
                      ) : null}
                      <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={1}>
                        {t.title}
                      </Text>
                    </View>
                    <Text style={[styles.rowSub, { color: palette.muted }]} numberOfLines={1}>
                      Sello: {t.artist_name} · Licencia: {t.license_type}
                    </Text>
                  </View>

                  <Pressable
                    style={[
                      styles.featuredBtn,
                      t.is_featured
                        ? { backgroundColor: palette.accent }
                        : { backgroundColor: palette.surfaceLight, borderColor: palette.border, borderWidth: 1 }
                    ]}
                    onPress={() => handleToggleFeaturedTrack(t)}
                  >
                    <Text
                      style={[
                        styles.featuredBtnText,
                        { color: t.is_featured ? palette.background : palette.textSecondary }
                      ]}
                    >
                      {t.is_featured ? '★ DESTACADA' : '☆ DESTACAR'}
                    </Text>
                  </Pressable>
                </View>
              ))
            )}

            {/* Listado y Gestión de Usuarios */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeader, { color: palette.muted }]}>
                DIRECTORIO DE MIEMBROS ({users.length})
              </Text>
            </View>

            {/* Buscador de Usuarios */}
            <View style={[styles.searchBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={{ fontSize: 13, marginRight: 8, color: palette.muted }}>🔍</Text>
              <TextInput
                placeholder="Buscar por usuario, email o rol..."
                placeholderTextColor={palette.muted}
                style={[styles.searchInput, { color: palette.text }]}
                value={userSearch}
                onChangeText={setUserSearch}
              />
              {userSearch ? (
                <Pressable onPress={() => setUserSearch('')}>
                  <Text style={{ color: palette.muted, paddingHorizontal: 6 }}>✕</Text>
                </Pressable>
              ) : null}
            </View>

            {users
              .filter((u) => {
                if (!userSearch.trim()) return true;
                const q = userSearch.toLowerCase();
                return (
                  u.username?.toLowerCase().includes(q) ||
                  u.email?.toLowerCase().includes(q) ||
                  u.display_name?.toLowerCase().includes(q) ||
                  (u.roles || []).some((r) => r.toLowerCase().includes(q))
                );
              })
              .map((u) => (
              <View key={u.id} style={[styles.userCard, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.sm]}>
                <View style={styles.userTop}>
                  <View style={[styles.avatarMini, { backgroundColor: palette.surfaceDark, borderColor: palette.border }]}>
                    <Text style={[styles.avatarMiniText, { color: palette.accent }]}>
                      {(u.display_name || u.username || 'U')[0].toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userDisplayName, { color: palette.text }]}>{u.display_name}</Text>
                    <Text style={[styles.userHandle, { color: palette.muted }]}>@{u.username} · {u.email}</Text>
                    <Text style={[styles.userRoles, { color: palette.textSecondary }]}>
                      Roles: <Text style={{ color: palette.accent, fontWeight: '800' }}>{u.roles.join(', ') || 'sin rol'}</Text> · {u.owned_copies_count} cintas en su estantería
                    </Text>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.statusBadge,
                      u.is_active
                        ? { backgroundColor: palette.successMuted, borderColor: palette.successBorder }
                        : { backgroundColor: palette.dangerMuted, borderColor: palette.dangerBorder },
                      pressed && { opacity: 0.8 }
                    ]}
                    onPress={() => confirmToggleStatus(u)}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: u.is_active ? palette.success : palette.danger }
                      ]}
                    >
                      {u.is_active ? '● ACTIVO' : '✕ SUSPENDIDO'}
                    </Text>
                  </Pressable>
                </View>

                {/* Botones de Asignación de Rol */}
                <View style={[styles.roleAssignment, { borderTopColor: palette.borderSubtle }]}>
                  <Text style={[styles.roleAssignLabel, { color: palette.muted }]}>ASIGNAR PRIVILEGIOS:</Text>
                  <Pressable
                    style={[
                      styles.roleBtn,
                      { backgroundColor: palette.surfaceDark, borderColor: palette.border },
                      u.roles.includes('collector') && { borderColor: palette.accentBorder, backgroundColor: palette.accentMuted }
                    ]}
                    onPress={() => handleAssignRole(u, 'collector')}
                  >
                    <Text
                      style={[
                        styles.roleBtnText,
                        { color: u.roles.includes('collector') ? palette.accent : palette.muted }
                      ]}
                    >
                      Coleccionista
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.roleBtn,
                      { backgroundColor: palette.surfaceDark, borderColor: palette.border },
                      u.roles.includes('artist') && { borderColor: palette.accentBorder, backgroundColor: palette.accentMuted }
                    ]}
                    onPress={() => handleAssignRole(u, 'artist')}
                  >
                    <Text
                      style={[
                        styles.roleBtnText,
                        { color: u.roles.includes('artist') ? palette.accent : palette.muted }
                      ]}
                    >
                      Artista
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.roleBtn,
                      { backgroundColor: palette.surfaceDark, borderColor: palette.border },
                      u.roles.includes('admin') && { borderColor: palette.accentBorder, backgroundColor: palette.accentMuted }
                    ]}
                    onPress={() => handleAssignRole(u, 'admin')}
                  >
                    <Text
                      style={[
                        styles.roleBtnText,
                        { color: u.roles.includes('admin') ? palette.accent : palette.muted }
                      ]}
                    >
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
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%'
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
    lineHeight: 16
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
  scroll: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center'
  },
  centerLoading: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600'
  },
  sectionHeaderRow: {
    marginTop: 20,
    marginBottom: 10
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  statCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 6
  },
  rowCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 12
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '800'
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2
  },
  badgeVerified: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800'
  },
  verifyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6
  },
  verifyBtnText: {
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.5
  },
  userCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1
  },
  userTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarMiniText: {
    fontSize: 14,
    fontWeight: '900'
  },
  userDisplayName: {
    fontSize: 15,
    fontWeight: '800'
  },
  userHandle: {
    fontSize: 12,
    marginTop: 1
  },
  userRoles: {
    fontSize: 11,
    marginTop: 4
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  roleAssignment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    flexWrap: 'wrap'
  },
  roleAssignLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  roleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1
  },
  roleBtnText: {
    fontSize: 11,
    fontWeight: '700'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0
  },
  featuredBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  featuredBtnText: {
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.5
  }
});
