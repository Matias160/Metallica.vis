// Perfil del miembro, sincronización de permisos y selector de apariencia de estudio.
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useTheme } from '../../context/ThemeContext';
import { colors, shadows } from '../../theme/colors';

const AVATAR_PRESETS = [
  { id: 'cassette', name: 'Cassette Cromo', uri: 'https://images.unsplash.com/photo-1542208998-f6dbbb27a72f?w=180&auto=format&fit=crop&q=80' },
  { id: 'vinyl', name: 'Vinilo Master', uri: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=180&auto=format&fit=crop&q=80' },
  { id: 'amp', name: 'Amplificador', uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=180&auto=format&fit=crop&q=80' },
  { id: 'stage', name: 'Escenario Live', uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=180&auto=format&fit=crop&q=80' },
  { id: 'reel', name: 'Carrete Reel', uri: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?w=180&auto=format&fit=crop&q=80' }
];

export default function ProfileScreen() {
  const { user, refreshUser, updateProfile, logout } = useAuth();
  const { notify } = useFeedback();
  const { isDark, palette, toggleTheme } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  function openEditModal() {
    setDisplayName(user?.display_name || '');
    setUsername(user?.username || '');
    setAvatarUrl(user?.avatar_url || '');
    setEditError('');
    setIsEditing(true);
  }

  async function handleSaveProfile() {
    setEditError('');
    if (!displayName.trim()) {
      setEditError('El nombre no puede estar vacío.');
      return;
    }
    const cleanUser = username.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
    if (cleanUser.length < 3) {
      setEditError('El usuario debe tener al menos 3 caracteres alfanuméricos.');
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        displayName: displayName.trim(),
        username: cleanUser,
        avatarUrl: avatarUrl.trim() || null
      });
      notify('Perfil actualizado', 'Tus datos se guardaron correctamente.', 'success');
      setIsEditing(false);
    } catch (err) {
      setEditError(err.message || 'Error al actualizar perfil');
      notify('No se pudo guardar', err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleLogoutPrompt() {
    if (Platform.OS === 'web') {
      setShowLogoutModal(true);
    } else {
      Alert.alert(
        '¿Cerrar Sesión?',
        '¿Estás seguro de que deseás cerrar sesión en este dispositivo? Deberás volver a ingresar para acceder a tus cintas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cerrar Sesión',
            style: 'destructive',
            onPress: () => logout()
          }
        ]
      );
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
          <View style={styles.badgeRow}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeRowText}>CREDENCIAL ANALÓGICA · PASAPORTE DE MIEMBRO</Text>
          </View>
          <Text style={[styles.title, { color: palette.text }]}>Mi Pasaporte</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>
            Identificador único de intercambio, linaje y privilegios de acceso.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de Identidad de Coleccionista */}
        <View
          style={[
            styles.card,
            shadows.md,
            { backgroundColor: palette.surface, borderColor: palette.border }
          ]}
        >
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={[styles.avatarImage, { borderColor: palette.accent }]}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: palette.accent }]}>
                  <Text style={styles.avatarText}>
                    {(user?.display_name || user?.username || 'U')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.avatarDot} />
            </View>

            <View style={styles.userMainInfo}>
              <Text style={[styles.name, { color: palette.text }]}>{user?.display_name}</Text>
              <Text style={styles.username}>@{user?.username}</Text>
              <Text style={[styles.email, { color: palette.muted }]}>{user?.email}</Text>
              
              <Pressable
                style={[styles.editProfileBtn, { backgroundColor: palette.accentMuted, borderColor: palette.accentBorder }]}
                onPress={openEditModal}
              >
                <Text style={[styles.editProfileBtnText, { color: palette.accent }]}>✎ EDITAR PERFIL Y FOTO</Text>
              </Pressable>
            </View>
          </View>

          {/* Caja de ID para Dubbeo P2P */}
          <View
            style={[
              styles.idBox,
              { backgroundColor: palette.surfaceDark, borderColor: palette.borderSubtle }
            ]}
          >
            <Text style={[styles.idLabel, { color: palette.muted }]}>
              TU IDENTIFICADOR ÚNICO DE DUBBEO (P2P ID)
            </Text>
            <Text style={styles.idValue}>#{user?.id}</Text>
            <Text style={[styles.idHint, { color: palette.muted }]}>
              Compartí este número con otros coleccionistas para que te transfieran copias físicas y figuren en tu linaje.
            </Text>
          </View>

          {/* Roles Activos */}
          <View style={[styles.rolesContainer, { borderTopColor: palette.borderSubtle }]}>
            <Text style={[styles.rolesLabel, { color: palette.muted }]}>
              PERMISOS Y NIVELES DE ACCESO ACTIVOS
            </Text>
            <View style={styles.rolesList}>
              {(user?.roles || []).map((r) => (
                <View
                  key={r}
                  style={[
                    styles.roleBadge,
                    { backgroundColor: palette.accentMuted, borderColor: palette.accentBorder }
                  ]}
                >
                  <View style={styles.roleDot} />
                  <Text style={styles.roleText}>{r.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Acciones de Cuenta */}
        <View style={styles.actionGroup}>
          <Pressable
            style={({ pressed }) => [
              styles.refreshBtn,
              { backgroundColor: palette.surface, borderColor: palette.border },
              pressed && { backgroundColor: palette.surfaceHover }
            ]}
            onPress={async () => {
              await refreshUser();
              notify('Sesión sincronizada', 'Permisos y datos actualizados desde el servidor.', 'success');
            }}
          >
            <Text style={[styles.refreshBtnText, { color: palette.textSecondary }]}>
              ↻ SINCRONIZAR PERMISOS CON EL SERVIDOR
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.themeButton,
              { backgroundColor: palette.accentMuted, borderColor: palette.accentBorder }
            ]}
            onPress={toggleTheme}
          >
            <Text style={styles.themeButtonText}>
              {isDark ? '☀ CAMBIAR A MODO ESTUDIO CLARO' : '◐ CAMBIAR A MODO ESTUDIO OSCURO'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && { backgroundColor: '#45121b' }
            ]}
            onPress={handleLogoutPrompt}
          >
            <Text style={styles.logoutButtonText}>CERRAR SESIÓN</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal / Popup de Confirmación de Cierre de Sesión */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>¿Cerrar Sesión?</Text>
            <Text style={[styles.modalMessage, { color: palette.muted }]}>
              ¿Confirmás que deseás cerrar la sesión de @{user?.username} en este dispositivo? Deberás volver a ingresar para acceder a tu estantería y reproducir cintas.
            </Text>

            <View style={styles.modalBtnRow}>
              <Pressable
                style={[styles.modalCancelBtn, { borderColor: palette.border }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: palette.textSecondary }]}>CANCELAR</Text>
              </Pressable>

              <Pressable
                style={[styles.modalConfirmBtn, { backgroundColor: colors.danger }]}
                onPress={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
              >
                <Text style={styles.modalConfirmText}>CERRAR SESIÓN</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal / Bottom Sheet de Edición de Perfil y Foto */}
      <Modal
        visible={isEditing}
        transparent
        animationType="slide"
        onRequestClose={() => !saving && setIsEditing(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCardLarge, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            {/* Tirador visual analógico */}
            <View style={[styles.sheetHandle, { backgroundColor: palette.border }]} />

            <View style={styles.editHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: palette.text }]}>Editar Pasaporte</Text>
                <Text style={[styles.modalSubtitle, { color: palette.muted }]}>
                  Personalizá tu credencial y avatar de estudio
                </Text>
              </View>
              <Pressable
                style={[styles.closeModalBtn, { backgroundColor: palette.surfaceDark, borderColor: palette.border }]}
                onPress={() => !saving && setIsEditing(false)}
              >
                <Text style={{ color: palette.muted, fontSize: 16, fontWeight: '700' }}>✕</Text>
              </Pressable>
            </View>

            {editError ? (
              <View style={[styles.errorBox, { backgroundColor: palette.dangerMuted, borderColor: palette.dangerBorder }]}>
                <Text style={[styles.errorText, { color: palette.danger }]}>⚠ {editError}</Text>
              </View>
            ) : null}

            <Text style={[styles.inputLabel, { color: palette.muted }]}>NOMBRE COMPLETO / VISIBLE</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: palette.surfaceDark, borderColor: palette.border, color: palette.text }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nombre para mostrar"
              placeholderTextColor={palette.muted}
            />

            <Text style={[styles.inputLabel, { color: palette.muted }]}>NOMBRE DE USUARIO (@handle)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: palette.surfaceDark, borderColor: palette.border, color: palette.text }]}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="hetfield_riffs"
              placeholderTextColor={palette.muted}
            />

            <Text style={[styles.inputLabel, { color: palette.muted }]}>ELEGÍ TU AVATAR ANALÓGICO</Text>
            <View style={styles.presetsGrid}>
              {AVATAR_PRESETS.map((p) => {
                const isSelected = avatarUrl === p.uri;
                return (
                  <Pressable
                    key={p.id}
                    style={[
                      styles.presetCircleBtn,
                      { borderColor: isSelected ? palette.accent : palette.borderSubtle },
                      isSelected && { borderColor: palette.accent, borderWidth: 3 }
                    ]}
                    onPress={() => setAvatarUrl(p.uri)}
                  >
                    <Image source={{ uri: p.uri }} style={styles.presetCircleImg} />
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { color: palette.muted }]}>O PEGÁ TU URL DE IMAGEN DIRECTA</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: palette.surfaceDark, borderColor: palette.border, color: palette.text }]}
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              placeholder="https://ejemplo.com/mi-avatar.jpg"
              placeholderTextColor={palette.muted}
              autoCapitalize="none"
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={[styles.modalConfirmBtn, { backgroundColor: palette.accent }, saving && { opacity: 0.6 }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={palette.background} />
                ) : (
                  <Text style={[styles.modalConfirmText, { color: palette.background }]}>GUARDAR CAMBIOS</Text>
                )}
              </Pressable>

              <Pressable
                style={[styles.modalCancelBtn, { borderColor: palette.border }]}
                onPress={() => setIsEditing(false)}
                disabled={saving}
              >
                <Text style={[styles.modalCancelText, { color: palette.textSecondary }]}>CANCELAR</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.backgroundElevated
  },
  topBarInner: {
    maxWidth: 580,
    alignSelf: 'center',
    width: '100%'
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent
  },
  badgeRowText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5
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
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center'
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  avatarWrap: {
    position: 'relative'
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#382205'
  },
  avatarDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface
  },
  avatarText: {
    color: '#090a0f',
    fontSize: 28,
    fontWeight: '900'
  },
  userMainInfo: {
    flex: 1
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  username: {
    color: colors.accent,
    fontSize: 14,
    marginTop: 2,
    fontWeight: '800'
  },
  email: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  idBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 12,
    padding: 18,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  idLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
  },
  idValue: {
    color: colors.accent,
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 4,
    letterSpacing: -0.5
  },
  idHint: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
    maxWidth: 380
  },
  rolesContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle
  },
  rolesLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 10
  },
  rolesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent
  },
  roleText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  actionGroup: {
    marginTop: 16,
    gap: 10
  },
  refreshBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  refreshBtnText: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.8
  },
  themeButton: {
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentMuted,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center'
  },
  themeButtonText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  logoutButton: {
    backgroundColor: colors.dangerMuted,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  logoutButtonText: {
    color: colors.danger,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2
  },
  editProfileBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1
  },
  editProfileBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1
  },
  modalCardLarge: {
    width: '100%',
    maxWidth: 500,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderWidth: 1,
    borderBottomWidth: 0
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900'
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20
  },
  modalBtnRow: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 18
  },
  modalCancelBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center'
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '800'
  },
  modalConfirmBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900'
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13
  },
  presetsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8
  },
  presetCircleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  presetCircleImg: {
    width: '100%',
    height: '100%'
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700'
  }
});
