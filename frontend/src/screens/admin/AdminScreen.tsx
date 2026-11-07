// Panel de control archivista: jerarquía de 4 niveles, telemetría analógica, moderación y sincronización en tiempo real.
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  Shield,
  Sun,
  Moon,
  Users,
  Disc,
  Music,
  Layers,
  Archive,
  Share2,
  Search,
  X,
  Eye,
  CheckCircle2,
  Slash,
  Award,
  Star,
  Trash2,
  AlertTriangle,
  Sparkles,
  Headphones,
  Check,
  ShieldCheck,
  Activity,
  PlusCircle
} from 'lucide-react-native';

import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useSync } from '../../context/SyncContext';
import { useTheme } from '../../context/ThemeContext';
import { themeTokens } from '../../theme/theme';
import { GlowCard } from '../../components/ui/GlowCard';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { SystemStats, User, Artist, Track } from '../../types';
import PublicProfileModal from '../../components/PublicProfileModal';

// Contador Animado para Telemetría
function AnimatedCounter({ value, color }: { value: number | string; color: string }) {
  const num = typeof value === 'number' ? value : parseInt(String(value), 10) || 0;
  const [displayVal, setDisplayVal] = useState<number>(0);

  useEffect(() => {
    let start = 0;
    const end = num;
    if (end === 0) {
      setDisplayVal(0);
      return;
    }
    const duration = 600;
    const incrementTime = 30;
    const steps = Math.ceil(duration / incrementTime);
    const stepVal = Math.ceil(end / steps) || 1;

    const timer = setInterval(() => {
      start += stepVal;
      if (start >= end) {
        setDisplayVal(end);
        clearInterval(timer);
      } else {
        setDisplayVal(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [num]);

  return (
    <Text style={[styles.statNumber, { color }]}>
      {displayVal}
    </Text>
  );
}

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

  // Actualización automática al recibir foco en la pestaña
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await apiRequest(`/admin/tracks/${track.id}/featured`, { method: 'PATCH', token });
      notify(res.isFeatured ? 'Pista destacada' : 'Pista desmarcada', res.message, 'success');
      await loadAdminData();
      triggerSync('track_featured_toggled');
    } catch (err: any) {
      notify('Error al modificar pista', err.message, 'error');
    }
  }

  function confirmDeleteTrack(track: Track) {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await apiRequest(`/artists/${artist.id}/verify`, { method: 'POST', token });
      notify('Sello verificado', `"${artist.name}" habilitado con sello oficial.`, 'success');
      await loadAdminData();
      triggerSync('artist_verified');
    } catch (err: any) {
      notify('No se pudo verificar el sello', err.message, 'error');
    }
  }

  function confirmToggleStatus(u: User) {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          {
            backgroundColor: palette.backgroundElevated || palette.surface,
            borderBottomColor: palette.borderSubtle
          }
        ]}
      >
        <View style={styles.topBarInner}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={[styles.liveIndicator, { backgroundColor: palette.cyan }]} />
              <Text style={[styles.badgeRowText, { color: palette.cyan }]}>
                CONSOLA DE CONTROL GENERAL · SUPREMO
              </Text>
            </View>
            <Text style={[styles.title, { color: palette.text }]}>Panel de Control Archivista</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>
              Gobierno de identidades, moderación de sellos y auditoría de másters.
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable
              style={[
                styles.themeBtn,
                { backgroundColor: palette.surfaceLight, borderColor: palette.border }
              ]}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                toggleTheme();
              }}
            >
              {isDark ? (
                <Sun size={14} color={palette.accent} />
              ) : (
                <Moon size={14} color={palette.text} />
              )}
              <Text style={[styles.themeBtnText, { color: palette.text }]}>
                {isDark ? 'DÍA' : 'NOCHE'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Stepper / Timeline Visual de Jerarquía de Privilegios */}
        <View
          style={[
            styles.timelineWrapper,
            { backgroundColor: palette.surfaceDark || '#090C14', borderColor: palette.border }
          ]}
        >
          <View style={styles.timelineHeader}>
            <ShieldCheck size={14} color={palette.accent} />
            <Text style={[styles.timelineTitle, { color: palette.accent }]}>
              JERARQUÍA DE PRIVILEGIOS ARCHIVISTA
            </Text>
          </View>

          {/* Línea conectora en gradiente */}
          <View style={styles.stepperContainer}>
            <LinearGradient
              colors={['#00E5FF', '#F59E0B', '#A855F7', '#10B981']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.connectingLine}
            />

            {/* Nivel 1 */}
            <View style={styles.stepNode}>
              <View style={[styles.stepDot, { backgroundColor: '#062837', borderColor: '#00E5FF' }]}>
                <Users size={12} color="#00E5FF" />
              </View>
              <Text style={[styles.stepTag, { color: '#00E5FF' }]}>NIVEL 1</Text>
              <Text style={[styles.stepName, { color: palette.text }]}>Identidades</Text>
            </View>

            {/* Nivel 2 */}
            <View style={styles.stepNode}>
              <View style={[styles.stepDot, { backgroundColor: '#2D1F08', borderColor: '#F59E0B' }]}>
                <Award size={12} color="#F59E0B" />
              </View>
              <Text style={[styles.stepTag, { color: '#F59E0B' }]}>NIVEL 2</Text>
              <Text style={[styles.stepName, { color: palette.text }]}>Sellos</Text>
            </View>

            {/* Nivel 3 */}
            <View style={styles.stepNode}>
              <View style={[styles.stepDot, { backgroundColor: '#28133E', borderColor: '#A855F7' }]}>
                <Sparkles size={12} color="#A855F7" />
              </View>
              <Text style={[styles.stepTag, { color: '#A855F7' }]}>NIVEL 3</Text>
              <Text style={[styles.stepName, { color: palette.text }]}>Curaduría</Text>
            </View>

            {/* Nivel 4 */}
            <View style={styles.stepNode}>
              <View style={[styles.stepDot, { backgroundColor: '#062E20', borderColor: '#10B981' }]}>
                <Layers size={12} color="#10B981" />
              </View>
              <Text style={[styles.stepTag, { color: '#10B981' }]}>NIVEL 4</Text>
              <Text style={[styles.stepName, { color: palette.text }]}>Linajes</Text>
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
          <View style={{ gap: 16 }}>
            <Skeleton width="100%" height={100} borderRadius={14} palette={palette} />
            <Skeleton width="100%" height={140} borderRadius={14} palette={palette} />
            <Skeleton width="100%" height={140} borderRadius={14} palette={palette} />
          </View>
        ) : (
          <>
            {/* Módulo 4: Telemetría Global con Contadores Animados */}
            <View style={styles.sectionHeaderRow}>
              <Activity size={14} color={palette.muted} />
              <Text style={[styles.sectionHeader, { color: palette.muted }]}>
                TELEMETRÍA GLOBAL DEL SISTEMA
              </Text>
            </View>

            <View style={styles.statsGrid}>
              {/* Tarjeta 1 */}
              <GlowCard variant="surface" palette={palette} style={styles.statCard}>
                <LinearGradient
                  colors={['#00E5FF22', '#00E5FF05']}
                  style={styles.statIconBadge}
                >
                  <Users size={16} color="#00E5FF" />
                </LinearGradient>
                <Text style={[styles.statLabel, { color: palette.muted }]}>MIEMBROS</Text>
                <AnimatedCounter value={stats?.totalUsers ?? 0} color={palette.text} />
              </GlowCard>

              {/* Tarjeta 2 */}
              <GlowCard variant="surface" palette={palette} style={styles.statCard}>
                <LinearGradient
                  colors={['#F59E0B22', '#F59E0B05']}
                  style={styles.statIconBadge}
                >
                  <Disc size={16} color="#F59E0B" />
                </LinearGradient>
                <Text style={[styles.statLabel, { color: palette.muted }]}>SELLOS</Text>
                <AnimatedCounter value={stats?.totalArtists ?? 0} color={palette.text} />
              </GlowCard>

              {/* Tarjeta 3 */}
              <GlowCard variant="surface" palette={palette} style={styles.statCard}>
                <LinearGradient
                  colors={['#A855F722', '#A855F705']}
                  style={styles.statIconBadge}
                >
                  <Music size={16} color="#A855F7" />
                </LinearGradient>
                <Text style={[styles.statLabel, { color: palette.muted }]}>MÁSTERS</Text>
                <AnimatedCounter value={stats?.totalTracks ?? 0} color={palette.text} />
              </GlowCard>

              {/* Tarjeta 4 */}
              <GlowCard variant="surface" palette={palette} style={styles.statCard}>
                <LinearGradient
                  colors={['#10B98122', '#10B98105']}
                  style={styles.statIconBadge}
                >
                  <Layers size={16} color="#10B981" />
                </LinearGradient>
                <Text style={[styles.statLabel, { color: palette.muted }]}>TIRADAS</Text>
                <AnimatedCounter value={stats?.totalPressings ?? 0} color={palette.text} />
              </GlowCard>

              {/* Tarjeta 5 */}
              <GlowCard variant="amberGlow" palette={palette} style={styles.statCard}>
                <LinearGradient
                  colors={['#FBBF2433', '#D9770611']}
                  style={styles.statIconBadge}
                >
                  <Archive size={16} color="#F59E0B" />
                </LinearGradient>
                <Text style={[styles.statLabel, { color: palette.accent }]}>CIRCULACIÓN</Text>
                <AnimatedCounter value={stats?.totalCopiesCirculating ?? 0} color={palette.accent} />
              </GlowCard>

              {/* Tarjeta 6 */}
              <GlowCard variant="cyanGlow" palette={palette} style={styles.statCard}>
                <LinearGradient
                  colors={['#38BDF833', '#0284C711']}
                  style={styles.statIconBadge}
                >
                  <Share2 size={16} color="#00E5FF" />
                </LinearGradient>
                <Text style={[styles.statLabel, { color: palette.cyan }]}>DUBBEOS</Text>
                <AnimatedCounter value={stats?.totalTransfers ?? 0} color={palette.cyan} />
              </GlowCard>
            </View>

            {/* Módulo 1: Gestión de Identidades y Roles (Nivel 1) */}
            <View style={styles.sectionHeaderRow}>
              <Users size={14} color={palette.cyan} />
              <Text style={[styles.sectionHeader, { color: palette.cyan }]}>
                NIVEL 1 · GESTIÓN DE IDENTIDADES Y PERMISOS ({users.length})
              </Text>
            </View>

            {/* Buscador de Usuarios */}
            <View
              style={[
                styles.searchBox,
                { backgroundColor: palette.surfaceDark || '#090C14', borderColor: palette.border }
              ]}
            >
              <Search size={14} color={palette.muted} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Buscar por usuario, email o rol..."
                placeholderTextColor={palette.mutedDark}
                style={[styles.searchInput, { color: palette.text }]}
                value={userSearch}
                onChangeText={setUserSearch}
              />
              {userSearch ? (
                <Pressable onPress={() => setUserSearch('')} hitSlop={10}>
                  <X size={14} color={palette.muted} />
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
                  <GlowCard
                    key={u.id}
                    variant="surface"
                    palette={palette}
                    style={styles.userCard}
                  >
                    <View style={styles.userTop}>
                      {/* Avatar con Anillo en Gradiente */}
                      <LinearGradient
                        colors={
                          u.artist_verified
                            ? ['#34D399', '#059669']
                            : (u.roles || []).includes('admin')
                            ? ['#F87171', '#DC2626']
                            : ['#FBBF24', '#D97706']
                        }
                        style={styles.avatarRing}
                      >
                        <View style={[styles.avatarInner, { backgroundColor: palette.surfaceDark || '#090C14' }]}>
                          <Text style={[styles.avatarText, { color: palette.text }]}>
                            {(u.display_name || u.username || 'U')[0].toUpperCase()}
                          </Text>
                        </View>
                      </LinearGradient>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={[styles.userDisplayName, { color: palette.text }]}>
                            {u.display_name || u.username}
                          </Text>
                          {u.artist_verified ? (
                            <Badge label="SELLO" variant="verified" palette={palette} />
                          ) : null}
                        </View>
                        <Text style={[styles.userHandle, { color: palette.muted }]}>
                          @{u.username} · {u.email}
                        </Text>
                      </View>

                      {/* Botón Ver Perfil */}
                      <Pressable
                        style={({ pressed }) => [
                          styles.actionBtn,
                          { backgroundColor: palette.surfaceLight, borderColor: palette.border },
                          pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] }
                        ]}
                        onPress={() => {
                          try {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          } catch {}
                          setSelectedProfileUserId(u.id);
                        }}
                      >
                        <Eye size={12} color={palette.cyan} />
                        <Text style={[styles.actionBtnText, { color: palette.cyan }]}>PERFIL</Text>
                      </Pressable>

                      {/* Estado Activo / Suspendido */}
                      <Pressable
                        style={({ pressed }) => [
                          styles.statusBadge,
                          u.is_active
                            ? { backgroundColor: palette.emeraldMuted || '#062E20', borderColor: palette.emeraldBorder || '#059669' }
                            : { backgroundColor: palette.roseMuted || '#381313', borderColor: palette.roseBorder || '#DC2626' },
                          pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }
                        ]}
                        onPress={() => confirmToggleStatus(u)}
                      >
                        {u.is_active ? (
                          <CheckCircle2 size={11} color={palette.emerald || '#10B981'} />
                        ) : (
                          <Slash size={11} color={palette.rose || '#EF4444'} />
                        )}
                        <Text
                          style={[
                            styles.statusText,
                            { color: u.is_active ? palette.emerald || '#10B981' : palette.rose || '#EF4444' }
                          ]}
                        >
                          {u.is_active ? 'ACTIVO' : 'SUSP.'}
                        </Text>
                      </Pressable>
                    </View>

                    {/* Telemetría Individual del Usuario */}
                    <View
                      style={[
                        styles.userStatsRow,
                        { backgroundColor: palette.surfaceDark || '#090C14', borderColor: palette.borderSubtle }
                      ]}
                    >
                      <View style={styles.userStatItem}>
                        <Archive size={11} color={palette.accent} />
                        <Text style={[styles.userStatValue, { color: palette.text }]}>
                          {u.owned_copies_count ?? 0}
                        </Text>
                        <Text style={[styles.userStatLabel, { color: palette.muted }]}>Vitrina</Text>
                      </View>
                      <View style={styles.userStatItem}>
                        <Music size={11} color={palette.cyan} />
                        <Text style={[styles.userStatValue, { color: palette.text }]}>
                          {u.created_tracks_count ?? 0}
                        </Text>
                        <Text style={[styles.userStatLabel, { color: palette.muted }]}>Música</Text>
                      </View>
                      <View style={styles.userStatItem}>
                        <Share2 size={11} color="#A855F7" />
                        <Text style={[styles.userStatValue, { color: palette.text }]}>
                          {u.dubs_count ?? 0}
                        </Text>
                        <Text style={[styles.userStatLabel, { color: palette.muted }]}>Dubbeos</Text>
                      </View>
                      <View style={styles.userStatItem}>
                        <Headphones size={11} color={palette.emerald || '#10B981'} />
                        <Text style={[styles.userStatValue, { color: palette.text }]}>
                          {u.plays_count ?? 0}
                        </Text>
                        <Text style={[styles.userStatLabel, { color: palette.muted }]}>Plays</Text>
                      </View>
                    </View>

                    {/* Botones de Asignación de Rol */}
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
                                {
                                  backgroundColor: hasRole
                                    ? palette.amberMuted || '#2D1F08'
                                    : palette.surfaceDark || '#090C14',
                                  borderColor: hasRole ? palette.amber : palette.border
                                },
                                hasRole && themeTokens.shadows.amberGlow,
                                pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }
                              ]}
                              onPress={() => handleAssignRole(u, r.id)}
                            >
                              {hasRole ? (
                                <Check size={10} color={palette.amber} style={{ marginRight: 4 }} />
                              ) : null}
                              <Text
                                style={[
                                  styles.roleBtnText,
                                  {
                                    color: hasRole ? palette.amber : palette.muted,
                                    fontWeight: hasRole ? '800' : '600'
                                  }
                                ]}
                              >
                                {r.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Certificar Sello Verificado */}
                      {isArtistUser ? (
                        <Pressable
                          style={({ pressed }) => [
                            styles.certifyLabelBtn,
                            u.artist_verified
                              ? {
                                  backgroundColor: palette.emeraldMuted || '#062E20',
                                  borderColor: palette.emeraldBorder || '#059669'
                                }
                              : {
                                  backgroundColor: palette.surfaceLight,
                                  borderColor: palette.amberBorder || '#B45309'
                                },
                            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }
                          ]}
                          onPress={() => handleToggleUserLabelVerification(u)}
                        >
                          <Award
                            size={11}
                            color={u.artist_verified ? palette.emerald || '#10B981' : palette.amber}
                          />
                          <Text
                            style={[
                              styles.certifyLabelBtnText,
                              { color: u.artist_verified ? palette.emerald || '#10B981' : palette.amber }
                            ]}
                          >
                            {u.artist_verified ? 'SELLO OFICIAL' : 'CERTIFICAR'}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </GlowCard>
                );
              })}

            {/* Módulo 2: Gobierno de Sellos Discográficos (Nivel 2) */}
            <View style={styles.sectionHeaderRow}>
              <Award size={14} color={palette.amber} />
              <Text style={[styles.sectionHeader, { color: palette.amber }]}>
                NIVEL 2 · GOBIERNO DE SELLOS Y ARTISTAS ({artists.length})
              </Text>
            </View>

            {artists.map((a) => (
              <GlowCard key={a.id} variant="surface" palette={palette} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: palette.text }]}>{a.name}</Text>
                  <Text style={[styles.rowSub, { color: palette.muted }]}>
                    ID #{a.id} · {a.biography || 'Sin biografía registrada'}
                  </Text>
                </View>

                {a.verified ? (
                  <Badge label="SELLO VERIFICADO" variant="verified" palette={palette} animatedPulse />
                ) : (
                  <PremiumButton
                    onPress={() => handleVerifyArtist(a)}
                    variant="primary"
                    size="sm"
                    palette={palette}
                    icon={<Award size={12} color="#06080D" />}
                  >
                    VERIFICAR
                  </PremiumButton>
                )}
              </GlowCard>
            ))}

            {/* Módulo 3: Curaduría de Másters (Nivel 3) */}
            <View style={styles.sectionHeaderRow}>
              <Sparkles size={14} color="#A855F7" />
              <Text style={[styles.sectionHeader, { color: '#A855F7' }]}>
                NIVEL 3 · CURADURÍA DE MÁSTERS Y DESTACADAS ({tracks.filter((t) => t.is_featured).length}/{tracks.length})
              </Text>
            </View>

            {tracks.length === 0 ? (
              <GlowCard variant="surface" palette={palette} style={styles.rowCard}>
                <Text style={[styles.rowSub, { color: palette.muted }]}>
                  No hay pistas registradas en el archivo máster todavía.
                </Text>
              </GlowCard>
            ) : (
              tracks.map((t) => (
                <GlowCard
                  key={t.id}
                  variant={t.is_featured ? 'amberGlow' : 'surface'}
                  palette={palette}
                  style={styles.rowCard}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {t.is_featured ? (
                        <Star size={13} color={palette.amber} />
                      ) : null}
                      <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={1}>
                        {t.title}
                      </Text>
                      {t.is_featured ? (
                        <Badge label="DESTACADA" variant="curator" palette={palette} />
                      ) : null}
                    </View>
                    <Text style={[styles.rowSub, { color: palette.muted }]} numberOfLines={1}>
                      Sello: {t.artist_name} · Licencia: {t.license_type}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <PremiumButton
                      onPress={() => handleToggleFeaturedTrack(t)}
                      variant={t.is_featured ? 'primary' : 'secondary'}
                      size="sm"
                      palette={palette}
                      icon={
                        t.is_featured ? (
                          <Star size={11} color="#06080D" />
                        ) : (
                          <PlusCircle size={11} color={palette.textSecondary} />
                        )
                      }
                    >
                      {t.is_featured ? 'DESTACADA' : 'DESTACAR'}
                    </PremiumButton>

                    <PremiumButton
                      onPress={() => confirmDeleteTrack(t)}
                      variant="danger"
                      size="sm"
                      palette={palette}
                      icon={<Trash2 size={11} color="#FFFFFF" />}
                    >
                      ELIMINAR
                    </PremiumButton>
                  </View>
                </GlowCard>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Modal de Inspección de Perfil */}
      <PublicProfileModal
        visible={Boolean(selectedProfileUserId)}
        userId={selectedProfileUserId}
        onClose={() => setSelectedProfileUserId(null)}
      />

      {/* Modal de Confirmación con Desenfoque (BlurView) */}
      <Modal
        visible={Boolean(confirmDialog)}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDialog(null)}
      >
        <BlurView intensity={35} tint="dark" style={styles.confirmOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirmDialog(null)} />
          <GlowCard
            variant="purpleGlow"
            palette={palette}
            style={[
              styles.confirmCard,
              { backgroundColor: palette.surface, borderColor: palette.roseBorder || '#DC2626' }
            ]}
          >
            <View
              style={[
                styles.confirmIconCircle,
                { backgroundColor: palette.roseMuted || '#381313' }
              ]}
            >
              <AlertTriangle size={26} color={palette.rose || '#EF4444'} />
            </View>
            <Text style={[styles.confirmTitle, { color: palette.text }]}>
              {confirmDialog?.title}
            </Text>
            <Text style={[styles.confirmMessage, { color: palette.muted }]}>
              {confirmDialog?.message}
            </Text>

            <View style={styles.confirmActions}>
              <PremiumButton
                onPress={() => setConfirmDialog(null)}
                variant="secondary"
                size="md"
                palette={palette}
                style={{ flex: 1 }}
              >
                CANCELAR
              </PremiumButton>
              <PremiumButton
                onPress={executeConfirmedAction}
                variant="danger"
                size="md"
                palette={palette}
                style={{ flex: 1.2 }}
                icon={<Trash2 size={13} color="#FFFFFF" />}
              >
                {confirmDialog?.confirmLabel || 'CONFIRMAR'}
              </PremiumButton>
            </View>
          </GlowCard>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1
  },
  topBarInner: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  liveIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4
  },
  badgeRowText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 520
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8
  },
  themeBtnText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  timelineWrapper: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 12
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  timelineTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 4
  },
  connectingLine: {
    position: 'absolute',
    top: 18,
    left: 24,
    right: 24,
    height: 2,
    zIndex: 1,
    opacity: 0.7
  },
  stepNode: {
    alignItems: 'center',
    zIndex: 2
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  stepTag: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  stepName: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,
    marginBottom: 10
  },
  sectionHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10
  },
  statCard: {
    flexBasis: '31%',
    flexGrow: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start'
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  statLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
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
    fontSize: 13,
    padding: 0
  },
  userCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10
  },
  userTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  avatarRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    padding: 1.8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800'
  },
  userDisplayName: {
    fontSize: 14,
    fontWeight: '800'
  },
  userHandle: {
    fontSize: 11,
    marginTop: 1
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6
  },
  actionBtnText: {
    fontSize: 9.5,
    fontWeight: '800'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: '800'
  },
  userStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10
  },
  userStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  userStatValue: {
    fontSize: 12,
    fontWeight: '800'
  },
  userStatLabel: {
    fontSize: 10
  },
  roleAssignment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    gap: 8,
    flexWrap: 'wrap'
  },
  roleAssignLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6
  },
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1
  },
  roleBtnText: {
    fontSize: 10
  },
  certifyLabelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1
  },
  certifyLabelBtnText: {
    fontSize: 10,
    fontWeight: '800'
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800'
  },
  rowSub: {
    fontSize: 11,
    marginTop: 2
  },
  confirmOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  confirmCard: {
    maxWidth: 440,
    width: '100%',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center'
  },
  confirmIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center'
  },
  confirmMessage: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%'
  }
});
