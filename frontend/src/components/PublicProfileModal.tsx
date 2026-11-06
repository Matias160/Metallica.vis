// Modal para inspeccionar perfiles públicos ajenos, su música creada, estadísticas y colección.
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import { useTheme } from '../context/ThemeContext';
import { soundPlayer } from '../utils/soundPlayer';
import { shadows } from '../theme/colors';

export interface PublicProfileModalProps {
  visible: boolean;
  userId: number | null;
  onClose: () => void;
}

export default function PublicProfileModal({
  visible,
  userId,
  onClose
}: PublicProfileModalProps): React.JSX.Element | null {
  const { token } = useAuth();
  const { palette } = useTheme();
  const { notify } = useFeedback();

  const [loading, setLoading] = useState<boolean>(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'tracks' | 'collection'>('tracks');
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);

  useEffect(() => {
    if (!visible || !userId) {
      setProfileData(null);
      setPlayingTrackId(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    apiRequest(`/users/${userId}/profile`, { token })
      .then((res) => {
        if (isMounted) {
          setProfileData(res.profile || null);
          if (res.profile?.createdTracks?.length > 0) {
            setActiveTab('tracks');
          } else {
            setActiveTab('collection');
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          notify('Error al cargar perfil', err.message, 'error');
          onClose();
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      soundPlayer.stop();
    };
  }, [visible, userId, token]);

  if (!visible) return null;

  const user = profileData?.user;
  const artist = profileData?.artist;
  const stats = profileData?.stats || {
    ownedCopiesCount: 0,
    createdTracksCount: 0,
    dubsCount: 0,
    playsCount: 0
  };
  const createdTracks = profileData?.createdTracks || [];
  const copies = profileData?.copies || [];

  const handlePlay = async (track: any) => {
    try {
      if (playingTrackId === track.id) {
        await soundPlayer.stop();
        setPlayingTrackId(null);
      } else {
        await soundPlayer.play(track.audio_url);
        setPlayingTrackId(track.id);
        notify('Reproduciendo', `"${track.title}"`, 'info');
      }
    } catch (e: any) {
      notify('Audio', e.message || 'No se pudo reproducir el audio', 'warning');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }, shadows.lg]}>
          {/* Header con botón de cierre */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={[styles.badgeLive, { backgroundColor: palette.accent }]} />
              <Text style={[styles.kicker, { color: palette.accent }]}>EXPEDIENTE DE MIEMBRO</Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
              <Feather name="x" size={16} color={palette.muted} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={palette.accent} size="large" />
              <Text style={[styles.loadingText, { color: palette.muted }]}>Cargando perfil público...</Text>
            </View>
          ) : user ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              {/* Tarjeta de Identidad */}
              <View style={[styles.idCard, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                <View style={styles.avatarRow}>
                  <View style={[styles.avatarBox, { backgroundColor: palette.accentMuted, borderColor: palette.accentBorder }]}>
                    <Text style={[styles.avatarText, { color: palette.accent }]}>
                      {(user.display_name || user.username || 'U')[0].toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.displayName, { color: palette.text }]}>{user.display_name}</Text>
                      {artist?.verified ? (
                        <View style={[styles.verifiedPill, { backgroundColor: palette.accentMuted, borderColor: palette.accentBorder }]}>
                          <Feather name="check-circle" size={12} color={palette.accent} />
                          <Text style={[styles.verifiedText, { color: palette.accent }]}>Sello Verificado</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.usernameText, { color: palette.muted }]}>@{user.username}</Text>
                    <Text style={[styles.joinedText, { color: palette.mutedDark }]}>
                      Miembro desde {new Date(user.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Roles del usuario */}
                <View style={styles.rolesRow}>
                  {(user.roles || []).map((r: string) => (
                    <View
                      key={r}
                      style={[
                        styles.roleChip,
                        {
                          backgroundColor: r === 'admin' ? '#7f1d1d' : r === 'artist' ? palette.accentMuted : palette.surfaceLight,
                          borderColor: r === 'admin' ? '#dc2626' : r === 'artist' ? palette.accentBorder : palette.border
                        }
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleChipText,
                          {
                            color: r === 'admin' ? '#fecaca' : r === 'artist' ? palette.accent : palette.textSecondary
                          }
                        ]}
                      >
                        {r.toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>

                {artist?.biography ? (
                  <Text style={[styles.biographyText, { color: palette.textSecondary }]}>{artist.biography}</Text>
                ) : null}
              </View>

              {/* Grid de Estadísticas */}
              <View style={styles.statsGrid}>
                <View style={[styles.statBox, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                  <Text style={[styles.statVal, { color: palette.accent }]}>{stats.ownedCopiesCount}</Text>
                  <Text style={[styles.statLabel, { color: palette.muted }]}>CINTAS EN VITRINA</Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                  <Text style={[styles.statVal, { color: palette.cyan }]}>{stats.createdTracksCount}</Text>
                  <Text style={[styles.statLabel, { color: palette.muted }]}>PISTAS CREADAS</Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                  <Text style={[styles.statVal, { color: '#a78bfa' }]}>{stats.dubsCount}</Text>
                  <Text style={[styles.statLabel, { color: palette.muted }]}>DUBBEOS P2P</Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                  <Text style={[styles.statVal, { color: palette.text }]}>{stats.playsCount}</Text>
                  <Text style={[styles.statLabel, { color: palette.muted }]}>REPRODUCCIONES</Text>
                </View>
              </View>

              {/* Pestañas de Contenido */}
              <View style={styles.tabsRow}>
                <Pressable
                  style={[
                    styles.tabBtn,
                    activeTab === 'tracks' && [styles.tabBtnActive, { borderColor: palette.accent, backgroundColor: palette.accentMuted }]
                  ]}
                  onPress={() => setActiveTab('tracks')}
                >
                  <Text style={[styles.tabBtnText, { color: activeTab === 'tracks' ? palette.accent : palette.muted }]}>
                    Música Creada ({createdTracks.length})
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.tabBtn,
                    activeTab === 'collection' && [styles.tabBtnActive, { borderColor: palette.accent, backgroundColor: palette.accentMuted }]
                  ]}
                  onPress={() => setActiveTab('collection')}
                >
                  <Text style={[styles.tabBtnText, { color: activeTab === 'collection' ? palette.accent : palette.muted }]}>
                    Vitrina / Copias ({copies.length})
                  </Text>
                </Pressable>
              </View>

              {/* Lista de Pistas Creadas */}
              {activeTab === 'tracks' ? (
                createdTracks.length === 0 ? (
                  <View style={styles.emptyContent}>
                    <Text style={styles.emptyIcon}>🎵</Text>
                    <Text style={[styles.emptyText, { color: palette.muted }]}>Este miembro aún no ha subido música máster.</Text>
                  </View>
                ) : (
                  createdTracks.map((t: any) => (
                    <View key={t.id} style={[styles.itemCard, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                      <Image source={{ uri: t.cover_url }} style={styles.itemCover} />
                      <View style={{ flex: 1, paddingHorizontal: 10 }}>
                        <Text style={[styles.itemTitle, { color: palette.text }]} numberOfLines={1}>
                          {t.title}
                        </Text>
                        <Text style={[styles.itemSub, { color: palette.muted }]} numberOfLines={1}>
                          {t.total_copies ? `Tirada de ${t.total_copies} copias físicas` : 'Pista máster oficial'}
                        </Text>
                      </View>
                      <Pressable
                        style={[styles.playBtn, { backgroundColor: playingTrackId === t.id ? palette.accent : palette.surfaceLight, borderColor: palette.border }]}
                        onPress={() => handlePlay(t)}
                      >
                        <Feather name={playingTrackId === t.id ? 'pause' : 'play'} size={14} color={playingTrackId === t.id ? '#090a0f' : palette.text} />
                      </Pressable>
                    </View>
                  ))
                )
              ) : null}

              {/* Lista de Copias Físicas */}
              {activeTab === 'collection' ? (
                copies.length === 0 ? (
                  <View style={styles.emptyContent}>
                    <Text style={styles.emptyIcon}>📼</Text>
                    <Text style={[styles.emptyText, { color: palette.muted }]}>No posee copias físicas en su vitrina activa.</Text>
                  </View>
                ) : (
                  copies.map((c: any) => (
                    <View key={c.id} style={[styles.itemCard, { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }]}>
                      <Image source={{ uri: c.cover_url }} style={styles.itemCover} />
                      <View style={{ flex: 1, paddingHorizontal: 10 }}>
                        <Text style={[styles.itemTitle, { color: palette.text }]} numberOfLines={1}>
                          {c.track_title}
                        </Text>
                        <Text style={[styles.itemSub, { color: palette.muted }]}>
                          Copia #{c.copy_number} · Gen {c.generation} · Condición {c.condition_value}%
                        </Text>
                      </View>
                      <View style={[styles.genBadge, { borderColor: palette.cyanBorder, backgroundColor: palette.cyanMuted }]}>
                        <Text style={[styles.genBadgeText, { color: palette.cyan }]}>GEN {c.generation}</Text>
                      </View>
                    </View>
                  ))
                )
              ) : null}
            </ScrollView>
          ) : (
            <View style={styles.emptyContent}>
              <Text style={[styles.emptyText, { color: palette.muted }]}>No se encontró el perfil de usuario.</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: 20
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  badgeLive: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  kicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600'
  },
  scroll: {
    paddingTop: 16,
    paddingBottom: 20
  },
  idCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900'
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  displayName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  usernameText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  joinedText: {
    fontSize: 10,
    marginTop: 2
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12
  },
  roleChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  roleChipText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6
  },
  biographyText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    fontStyle: 'italic'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  statBox: {
    flex: 1,
    minWidth: 120,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center'
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900'
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center'
  },
  tabBtnActive: {
    borderRadius: 8
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '800'
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8
  },
  itemCover: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#181e2b'
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '800'
  },
  itemSub: {
    fontSize: 11,
    marginTop: 2
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  genBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1
  },
  genBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  emptyContent: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 6
  },
  emptyIcon: {
    fontSize: 28
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center'
  }
});
