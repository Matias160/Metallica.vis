// Panel de control archivista: jerarquía de 4 niveles, telemetría analógica, moderación y sincronización en tiempo real.
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import PublicProfileModal from '../../components/PublicProfileModal';

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
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<
    | { kind: 'delete-track'; track: Track; title: string; message: string; confirmLabel: string }
    | { kind: 'toggle-user'; user: User; title: string; message: string; confirmLabel: string }
    | null
  >(null);

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

  function confirmDeleteTrack(track: Track) {
    setConfirmDialog({
      kind: 'delete-track',
      track,
      title: 'Eliminar pista definitivamente',
      message: `¿Estás seguro de eliminar "${track.title}"? Esta acción borrará la pista máster, sus tiradas y sus copias físicas asociadas.`,
      confirmLabel: 'ELIMINAR PISTA'
    });
  }

  async function handleDeleteTrack(track: Track) {
    try {
      const res = await apiRequest(`/admin/tracks/${track.id}`, { method: 'DELETE', token });
      notify('Pista eliminada', res.message || `"${track.title}" ha sido purgada del catálogo máster.`, 'success');
      await loadAdminData();
      triggerSync('track_deleted');
    } catch (err: any) {
      notify('No se pudo eliminar la pista', err.message, 'error');
    }
  }

  async function handleToggleUserLabelVerification(u: User) {
    try {
      const res = await apiRequest(`/admin/users/${u.id}/verify-label`, { method: 'POST', token });
      notify(
        res.verified ? 'Sello Verificado' : 'Sello Revocado',
        res.message || `@${u.username} ahora cuenta con distinción de Sello Verificado.`,
        'success'
      );
      await loadAdminData();
      triggerSync('artist_verified');
    } catch (err: any) {
      notify('No se pudo modificar verificación', err.message, 'error');
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
    setConfirmDialog({
      kind: 'toggle-user',
      user: u,
      title: isBanning ? 'Suspender usuario' : 'Reactivar usuario',
      message: isBanning
        ? `¿Confirmás la suspensión de @${u.username}? Se revocarán todas sus sesiones activas.`
        : `¿Confirmás la reactivación de @${u.username}?`,
      confirmLabel: isBanning ? 'SUSPENDER USUARIO' : 'REACTIVAR USUARIO'
    });
  }

  async function executeConfirmedAction() {
    const dialog = confirmDialog;
    setConfirmDialog(null);
    if (!dialog) return;
    if (dialog.kind === 'delete-track') await handleDeleteTrack(dialog.track);
    if (dialog.kind === 'toggle-user') await handleToggleStatus(dialog.user);
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
      const res = await apiRequest(`/admin/users/${u.id}/role`, {
        method: 'POST',
        token,
        body: { role: newRole, action: 'toggle' }
      });
      notify('Rol actualizado', res.message || `@${u.username} actualizó su rol "${newRole.toUpperCase()}".`, 'success');
      await loadAdminData();
      triggerSync('user_role_assigned');
    } catch (err: any) {
      notify('No se pudo modificar el rol', err.message, 'error');
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
              .map((u) => {
                const isArtistUser = (u.roles || []).includes('artist') || Boolean(u.artist_id);
                return (
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={[styles.userDisplayName, { color: palette.text }]}>{u.display_name || u.username}</Text>
                          {u.artist_verified ? (
                            <View style={[styles.badgeVerifiedMini, { backgroundColor: palette.successMuted, borderColor: palette.successBorder }]}>
                              <Feather name="check" size={10} color={palette.success} />
                              <Text style={[styles.badgeVerifiedMiniText, { color: palette.success }]}>SELLO</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={[styles.userHandle, { color: palette.muted }]}>@{u.username} · {u.email}</Text>
                      </View>

                      {/* Botón Ver Perfil Ajeno */}
                      <Pressable
                        style={({ pressed }) => [
                          styles.viewProfileBtn,
                          { backgroundColor: palette.surfaceLight, borderColor: palette.border },
                          pressed && { opacity: 0.75 }
                        ]}
                        onPress={() => setSelectedProfileUserId(u.id)}
                      >
                        <Feather name="eye" size={12} color={palette.cyan} />
                        <Text style={[styles.viewProfileBtnText, { color: palette.cyan }]}>PERFIL</Text>
                      </Pressable>

                      {/* Estado Activo / Suspendido */}
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
                          {u.is_active ? 'ACTIVO' : 'SUSP.'}
                        </Text>
                      </Pressable>
                    </View>

                    {/* Fila de Estadísticas Detalladas del Usuario */}
                    <View style={[styles.userStatsRow, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                      <View style={styles.userStatItem}>
                        <Feather name="archive" size={11} color={palette.accent} />
                        <Text style={[styles.userStatValue, { color: palette.text }]}>{u.owned_copies_count ?? 0}</Text>
                        <Text style={[styles.userStatLabel, { color: palette.muted }]}>Vitrina</Text>
                      </View>
                      <View style={styles.userStatItem}>
                        <Feather name="music" size={11} color={palette.cyan} />
                        <Text style={[styles.userStatValue, { color: palette.text }]}>{u.created_tracks_count ?? 0}</Text>
                        <Text style={[styles.userStatLabel, { color: palette.muted }]}>Música</Text>
                      </View>
                      <View style={styles.userStatItem}>
                        <Feather name="share-2" size={11} color="#a78bfa" />
                        <Text style={[styles.userStatValue, { color: palette.text }]}>{u.dubs_count ?? 0}</Text>
                        <Text style={[styles.userStatLabel, { color: palette.muted }]}>Dubbeos</Text>
                      </View>
                      <View style={styles.userStatItem}>
                        <Feather name="headphones" size={11} color={palette.success} />
                        <Text style={[styles.userStatValue, { color: palette.text }]}>{u.plays_count ?? 0}</Text>
                        <Text style={[styles.userStatLabel, { color: palette.muted }]}>Plays</Text>
                      </View>
                    </View>

                    {/* Botones de Asignación Intuitiva de Rol y Verificación de Creador */}
                    <View style={[styles.roleAssignment, { borderTopColor: palette.borderSubtle }]}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.roleAssignLabel, { color: palette.muted }]}>ROLES:</Text>
                        {[
                          { id: 'collector', label: 'Coleccionista' },
                          { id: 'artist', label: 'Artista / Sello' },
                          { id: 'admin', label: 'Admin' }
                        ].map((r) => {
                          const hasRole = (u.roles || []).includes(r.id as any);
                          return (
                            <Pressable
                              key={r.id}
                              style={({ pressed }) => [
                                styles.roleBtn,
                                { backgroundColor: palette.surfaceDark, borderColor: palette.border },
                                hasRole && { borderColor: palette.accent, backgroundColor: palette.accentMuted },
                                pressed && { opacity: 0.75 }
                              ]}
                              onPress={() => handleAssignRole(u, r.id)}
                            >
                              <Feather
                                name={hasRole ? 'check-circle' : 'circle'}
                                size={10}
                                color={hasRole ? palette.accent : palette.muted}
                                style={{ marginRight: 4 }}
                              />
                              <Text
                                style={[
                                  styles.roleBtnText,
                                  { color: hasRole ? palette.accent : palette.muted, fontWeight: hasRole ? '800' : '600' }
                                ]}
                              >
                                {r.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Botón Certificar Sello Verificado para Creadores */}
                      {isArtistUser ? (
                        <Pressable
                          style={({ pressed }) => [
                            styles.certifyLabelBtn,
                            u.artist_verified
                              ? { backgroundColor: palette.successMuted, borderColor: palette.successBorder }
                              : { backgroundColor: palette.surfaceLight, borderColor: palette.accentBorder },
                            pressed && { opacity: 0.8 }
                          ]}
                          onPress={() => handleToggleUserLabelVerification(u)}
                        >
                          <Feather
                            name={u.artist_verified ? 'award' : 'check'}
                            size={11}
                            color={u.artist_verified ? palette.success : palette.accent}
                          />
                          <Text
                            style={[
                              styles.certifyLabelBtnText,
                              { color: u.artist_verified ? palette.success : palette.accent }
                            ]}
                          >
                            {u.artist_verified ? 'SELLO VERIFICADO' : 'CERTIFICAR SELLO'}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}

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

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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

                    <Pressable
                      style={({ pressed }) => [
                        styles.deleteBtn,
                        { backgroundColor: palette.dangerMuted, borderColor: palette.dangerBorder },
                        pressed && { opacity: 0.8 }
                      ]}
                      onPress={() => confirmDeleteTrack(t)}
                    >
                      <Feather name="trash-2" size={11} color={palette.danger} />
                      <Text style={[styles.deleteBtnText, { color: palette.danger }]}>ELIMINAR</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Modal de Inspección de Perfil Público de Usuario */}
      <PublicProfileModal
        visible={Boolean(selectedProfileUserId)}
        userId={selectedProfileUserId}
        onClose={() => setSelectedProfileUserId(null)}
      />

      {/* Confirmación integrada para acciones administrativas sensibles. */}
      <Modal
        visible={Boolean(confirmDialog)}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDialog(null)}
      >
        <View style={styles.confirmOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirmDialog(null)} />
          <View
            style={[
              styles.confirmCard,
              { backgroundColor: palette.surface, borderColor: palette.dangerBorder },
              shadows.md
            ]}
          >
            <View style={[styles.confirmIcon, { backgroundColor: palette.dangerMuted }]}>
              <Feather name="alert-triangle" size={24} color={palette.danger} />
            </View>
            <Text style={[styles.confirmTitle, { color: palette.text }]}>{confirmDialog?.title}</Text>
            <Text style={[styles.confirmMessage, { color: palette.muted }]}>{confirmDialog?.message}</Text>

            <View style={styles.confirmActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmCancel,
                  { backgroundColor: palette.surfaceLight, borderColor: palette.border },
                  pressed && { opacity: 0.75 }
                ]}
                onPress={() => setConfirmDialog(null)}
              >
                <Text style={[styles.confirmCancelText, { color: palette.textSecondary }]}>CANCELAR</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmDanger,
                  { backgroundColor: palette.danger },
                  pressed && { opacity: 0.8 }
                ]}
                onPress={executeConfirmedAction}
              >
                <Feather name="trash-2" size={14} color="#ffffff" />
                <Text style={styles.confirmDangerText}>{confirmDialog?.confirmLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  confirmCard: {
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center'
  },
  confirmIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center'
  },
  confirmMessage: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10
  },
  confirmActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 22
  },
  confirmCancel: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmCancelText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7
  },
  confirmDanger: {
    flex: 1.35,
    minHeight: 46,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7
  },
  confirmDangerText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5
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
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1
  },
  deleteBtnText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  badgeVerifiedMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1
  },
  badgeVerifiedMiniText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1
  },
  viewProfileBtnText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  userStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1
  },
  userStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  userStatValue: {
    fontSize: 11,
    fontWeight: '800'
  },
  userStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  certifyLabelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 'auto'
  },
  certifyLabelBtnText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  }
});
