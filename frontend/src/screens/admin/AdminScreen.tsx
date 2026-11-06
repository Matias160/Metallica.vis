// Panel de control archivista: jerarquía de 4 niveles, telemetría analógica, moderación y sincronización en tiempo real.
import React, { useCallback, useEffect, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useSync } from '../../context/SyncContext';
import { useTheme } from '../../context/ThemeContext';
import { shadows } from '../../theme/colors';
import { SystemStats, User, Artist, Track } from '../../types';

export default function AdminScreen(): React.JSX.Element {
  const { token } = useAuth();
  const { palette, isDark, toggleTheme } = useTheme();
  const { notify } = useFeedback();
  const { syncVersion, triggerSync } = useSync();

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'artists' | 'tracks'>('all');

  const loadAdminData = useCallback(async () => {
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
    } catch (err: any) {
      console.warn('Error cargando panel archivista:', err);
    }
  }, [token]);

  // Actualización automática al recibir foco en la pestaña (sin reiniciar la app)
  useFocusEffect(
    useCallback(() => {
      loadAdminData().finally(() => setLoading(false));
    }, [loadAdminData, syncVersion])
  );

  useEffect(() => {
    loadAdminData().finally(() => setLoading(false));
  }, [loadAdminData, syncVersion]);

  async function onRefresh() {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  }

  async function handleToggleFeaturedTrack(track: Track) {
    try {
      const res = await apiRequest(`/admin/tracks/${track.id}/featured`, { method: 'PATCH', token });
      notify(res.isFeatured ? 'Pista destacada' : 'Pista desmarcada', res.message, 'success');
      await loadAdminData();
      triggerSync('track_featured_toggled');
    } catch (err: any) {
      notify('Error al modificar pista', err.message, 'error');
    }
  }

  async function handleVerifyArtist(artist: Artist) {
    try {
      await apiRequest(`/artists/${artist.id}/verify`, { method: 'POST', token });
      notify('Sello verificado', `"${artist.name}" habilitado con sello oficial.`, 'success');
      await loadAdminData();
      triggerSync('artist_verified');
    } catch (err: any) {
      notify('No se pudo verificar el sello', err.message, 'error');
    }
  }

  function confirmToggleStatus(u: User) {
    const isBanning = u.is_active;
    const title = isBanning ? 'Suspender Miembro' : 'Reactivar Miembro';
    const message = isBanning
      ? `¿Confirmás la suspensión de @${u.username}? Se revocarán todas sus sesiones activas.`
      : `¿Confirmás la reactivación de @${u.username}?`;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        handleToggleStatus(u);
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: isBanning ? 'Suspender' : 'Activar',
          style: isBanning ? 'destructive' : 'default',
          onPress: () => handleToggleStatus(u)
        }
      ]);
    }
  }

  async function handleToggleStatus(u: User) {
    try {
      const res = await apiRequest(`/admin/users/${u.id}/status`, { method: 'PATCH', token });
      notify('Estado actualizado', res.message, 'success');
      await loadAdminData();
      triggerSync('user_status_changed');
    } catch (err: any) {
      notify('No se pudo modificar el estado', err.message, 'error');
    }
  }

  async function handleAssignRole(u: User, newRole: string) {
    try {
      await apiRequest(`/admin/users/${u.id}/role`, {
        method: 'POST',
        token,
        body: { role: newRole }
      });
      notify('Rol asignado', `@${u.username} ahora posee el rol "${newRole.toUpperCase()}".`, 'success');
      await loadAdminData();
      triggerSync('user_role_assigned');
    } catch (err: any) {
      notify('No se pudo asignar el rol', err.message, 'error');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Barra Superior con Jerarquía Archivista */}
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
              <Text style={[styles.badgeRowText, { color: palette.cyan }]}>
                CONSOLA DE CONTROL GENERAL · NIVEL 4 SUPREMO
              </Text>
            </View>
            <Text style={[styles.title, { color: palette.text }]}>Panel de Control Archivista</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>
              Gobierno de identidades, moderación de sellos y auditoría de másters.
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable
              style={[styles.themeBtn, { backgroundColor: palette.surfaceLight, borderColor: palette.border }]}
              onPress={toggleTheme}
            >
              <Feather name={isDark ? 'sun' : 'moon'} size={14} color={palette.text} />
              <Text style={[styles.themeBtnText, { color: palette.text }]}>
                {isDark ? 'DÍA' : 'NOCHE'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Ficha de Jerarquía Administrativa */}
        <View style={[styles.hierarchyCard, { backgroundColor: palette.surfaceDark, borderColor: palette.border }]}>
          <View style={styles.hierarchyHeader}>
            <Feather name="shield" size={14} color={palette.accent} />
            <Text style={[styles.hierarchyTitle, { color: palette.accent }]}>
              JERARQUÍA DE PRIVILEGIOS ARCHIVISTA
            </Text>
          </View>
          <View style={styles.hierarchyGrid}>
            <View style={styles.hLevelItem}>
              <Text style={[styles.hLevelTag, { color: palette.cyan }]}>NIVEL 1</Text>
              <Text style={[styles.hLevelName, { color: palette.text }]}>Identidades & Roles</Text>
            </View>
            <View style={styles.hLevelItem}>
              <Text style={[styles.hLevelTag, { color: palette.accent }]}>NIVEL 2</Text>
              <Text style={[styles.hLevelName, { color: palette.text }]}>Sellos Oficiales</Text>
            </View>
            <View style={styles.hLevelItem}>
              <Text style={[styles.hLevelTag, { color: '#a78bfa' }]}>NIVEL 3</Text>
              <Text style={[styles.hLevelName, { color: palette.text }]}>Curaduría Máster</Text>
            </View>
            <View style={styles.hLevelItem}>
              <Text style={[styles.hLevelTag, { color: palette.success }]}>NIVEL 4</Text>
              <Text style={[styles.hLevelName, { color: palette.text }]}>Cripto Linajes</Text>
            </View>
          </View>
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
              Sincronizando consola con la base de datos...
            </Text>
          </View>
        ) : (
          <>
            {/* Módulo 4: Telemetría Global en Tiempo Real */}
            <View style={styles.sectionHeaderRow}>
              <Feather name="activity" size={13} color={palette.muted} />
              <Text style={[styles.sectionHeader, { color: palette.muted }]}>
                TELEMETRÍA GLOBAL DEL SISTEMA
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.sm]}>
                <Feather name="users" size={14} color={palette.muted} style={{ marginBottom: 4 }} />
                <Text style={[styles.statLabel, { color: palette.muted }]}>MIEMBROS REGISTRADOS</Text>
                <Text style={[styles.statNumber, { color: palette.text }]}>{stats?.totalUsers ?? '-'}</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.sm]}>
                <Feather name="disc" size={14} color={palette.muted} style={{ marginBottom: 4 }} />
                <Text style={[styles.statLabel, { color: palette.muted }]}>SELLOS & ARTISTAS</Text>
                <Text style={[styles.statNumber, { color: palette.text }]}>{stats?.totalArtists ?? '-'}</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.sm]}>
                <Feather name="music" size={14} color={palette.muted} style={{ marginBottom: 4 }} />
                <Text style={[styles.statLabel, { color: palette.muted }]}>PISTAS MÁSTER</Text>
                <Text style={[styles.statNumber, { color: palette.text }]}>{stats?.totalTracks ?? '-'}</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.sm]}>
                <Feather name="layers" size={14} color={palette.muted} style={{ marginBottom: 4 }} />
                <Text style={[styles.statLabel, { color: palette.muted }]}>TIRADAS FÍSICAS</Text>
                <Text style={[styles.statNumber, { color: palette.text }]}>{stats?.totalPressings ?? '-'}</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.accentBorder }, shadows.sm]}>
                <Feather name="archive" size={14} color={palette.accent} style={{ marginBottom: 4 }} />
                <Text style={[styles.statLabel, { color: palette.accent }]}>CINTAS EN CIRCULACIÓN</Text>
                <Text style={[styles.statNumber, { color: palette.accent }]}>
                  {stats?.totalCopiesCirculating ?? '-'}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.cyanBorder }, shadows.sm]}>
                <Feather name="share-2" size={14} color={palette.cyan} style={{ marginBottom: 4 }} />
                <Text style={[styles.statLabel, { color: palette.cyan }]}>DUBBEOS REGISTRADOS</Text>
                <Text style={[styles.statNumber, { color: palette.cyan }]}>
                  {stats?.totalTransfers ?? '-'}
                </Text>
              </View>
            </View>

            {/* Módulo 1: Gestión de Identidades, Permisos y Roles (Nivel 1) */}
            <View style={styles.sectionHeaderRow}>
              <Feather name="user-check" size={13} color={palette.cyan} />
              <Text style={[styles.sectionHeader, { color: palette.cyan }]}>
                NIVEL 1 · GESTIÓN DE IDENTIDADES Y PERMISOS ({users.length})
              </Text>
            </View>

            {/* Buscador de Usuarios */}
            <View style={[styles.searchBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Feather name="search" size={14} color={palette.muted} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Buscar por usuario, email o rol..."
                placeholderTextColor={palette.mutedDark}
                style={[styles.searchInput, { color: palette.text }]}
                value={userSearch}
                onChangeText={setUserSearch}
              />
              {userSearch ? (
                <Pressable onPress={() => setUserSearch('')} hitSlop={10}>
                  <Feather name="x" size={14} color={palette.muted} />
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
                <View
                  key={u.id}
                  style={[
                    styles.userCard,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                    shadows.sm
                  ]}
                >
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
                        Roles: <Text style={{ color: palette.accent, fontWeight: '800' }}>{u.roles.join(', ') || 'sin rol'}</Text> · {u.owned_copies_count ?? 0} cintas en su estantería
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
                      <Feather
                        name={u.is_active ? 'check-circle' : 'slash'}
                        size={11}
                        color={u.is_active ? palette.success : palette.danger}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: u.is_active ? palette.success : palette.danger }
                        ]}
                      >
                        {u.is_active ? 'ACTIVO' : 'SUSPENDIDO'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Botones de Asignación de Rol con Micro-Feedback */}
                  <View style={[styles.roleAssignment, { borderTopColor: palette.borderSubtle }]}>
                    <Text style={[styles.roleAssignLabel, { color: palette.muted }]}>ASIGNAR PRIVILEGIOS:</Text>
                    {[
                      { id: 'collector', label: 'Coleccionista' },
                      { id: 'artist', label: 'Artista' },
                      { id: 'admin', label: 'Admin' }
                    ].map((r) => {
                      const hasRole = (u.roles || []).includes(r.id as any);
                      return (
                        <Pressable
                          key={r.id}
                          style={({ pressed }) => [
                            styles.roleBtn,
                            { backgroundColor: palette.surfaceDark, borderColor: palette.border },
                            hasRole && { borderColor: palette.accentBorder, backgroundColor: palette.accentMuted },
                            pressed && { opacity: 0.75 }
                          ]}
                          onPress={() => handleAssignRole(u, r.id)}
                        >
                          <Text
                            style={[
                              styles.roleBtnText,
                              { color: hasRole ? palette.accent : palette.muted }
                            ]}
                          >
                            {r.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}

            {/* Módulo 2: Gobierno y Verificación de Sellos Discográficos (Nivel 2) */}
            <View style={styles.sectionHeaderRow}>
              <Feather name="award" size={13} color={palette.accent} />
              <Text style={[styles.sectionHeader, { color: palette.accent }]}>
                NIVEL 2 · GOBIERNO DE SELLOS Y ARTISTAS ({artists.length})
              </Text>
            </View>

            {artists.map((a) => (
              <View
                key={a.id}
                style={[styles.rowCard, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.sm]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: palette.text }]}>{a.name}</Text>
                  <Text style={[styles.rowSub, { color: palette.muted }]}>
                    ID #{a.id} · {a.biography || 'Sin biografía registrada'}
                  </Text>
                </View>

                {a.verified ? (
                  <View style={[styles.badgeVerified, { backgroundColor: palette.successMuted, borderColor: palette.successBorder }]}>
                    <Feather name="check" size={11} color={palette.success} />
                    <Text style={[styles.badgeText, { color: palette.success }]}>Sello Verificado</Text>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.verifyBtn,
                      { backgroundColor: palette.accent },
                      pressed && { opacity: 0.85 }
                    ]}
                    onPress={() => handleVerifyArtist(a)}
                  >
                    <Text style={[styles.verifyBtnText, { color: palette.background }]}>VERIFICAR SELLO</Text>
                  </Pressable>
                )}
              </View>
            ))}

            {/* Módulo 3: Curaduría de Catálogo y Másters Destacados (Nivel 3) */}
            <View style={styles.sectionHeaderRow}>
              <Feather name="star" size={13} color="#a78bfa" />
              <Text style={[styles.sectionHeader, { color: '#a78bfa' }]}>
                NIVEL 3 · CURADURÍA DE MÁSTERS Y DESTACADAS ({tracks.filter((t) => t.is_featured).length}/{tracks.length})
              </Text>
            </View>

            {tracks.length === 0 ? (
              <View style={[styles.rowCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Text style={[styles.rowSub, { color: palette.muted }]}>
                  No hay pistas registradas en el máster todavía.
                </Text>
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
                        <Feather name="star" size={12} color={palette.accent} />
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
                    style={({ pressed }) => [
                      styles.featuredBtn,
                      t.is_featured
                        ? { backgroundColor: palette.accent }
                        : { backgroundColor: palette.surfaceLight, borderColor: palette.border, borderWidth: 1 },
                      pressed && { opacity: 0.85 }
                    ]}
                    onPress={() => handleToggleFeaturedTrack(t)}
                  >
                    <Feather
                      name={t.is_featured ? 'star' : 'plus-circle'}
                      size={11}
                      color={t.is_featured ? palette.background : palette.textSecondary}
                    />
                    <Text
                      style={[
                        styles.featuredBtnText,
                        { color: t.is_featured ? palette.background : palette.textSecondary }
                      ]}
                    >
                      {t.is_featured ? 'DESTACADA' : 'DESTACAR'}
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    letterSpacing: 1.2
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1
  },
  themeBtnText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6
  },
  hierarchyCard: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12
  },
  hierarchyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  hierarchyTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  hierarchyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap'
  },
  hLevelItem: {
    flex: 1,
    minWidth: 70
  },
  hLevelTag: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  hLevelName: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2
  },
  scroll: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center'
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 12
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 2
  },
  userCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10
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
    fontSize: 16,
    fontWeight: '900'
  },
  userDisplayName: {
    fontSize: 13,
    fontWeight: '800'
  },
  userHandle: {
    fontSize: 11,
    marginTop: 1
  },
  userRoles: {
    fontSize: 11,
    marginTop: 3
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  roleAssignment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    flexWrap: 'wrap'
  },
  roleAssignLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginRight: 4
  },
  roleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1
  },
  roleBtnText: {
    fontSize: 10,
    fontWeight: '700'
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '800'
  },
  rowSub: {
    fontSize: 11,
    marginTop: 2
  },
  badgeVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  verifyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  verifyBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  featuredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  featuredBtnText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4
  }
});
