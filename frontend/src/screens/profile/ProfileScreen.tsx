// Perfil del miembro: pasaporte analógico de lujo, credencial P2P y apariencia de estudio.
import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  Copy,
  Check,
  Edit3,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  Radio,
  Sparkles,
  Award,
  Layers,
  X,
  AlertTriangle
} from '../../components/ui/Icons';

import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useTheme } from '../../context/ThemeContext';
import { themeTokens } from '../../theme/theme';
import { GlowCard } from '../../components/ui/GlowCard';
import { PremiumButton } from '../../components/ui/PremiumButton';
import { Badge } from '../../components/ui/Badge';

export interface AvatarPreset {
  id: string;
  name: string;
  uri: string;
}

const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'cassette', name: 'Cassette Cromo', uri: 'https://images.unsplash.com/photo-1542208998-f6dbbb27a72f?w=180&auto=format&fit=crop&q=80' },
  { id: 'vinyl', name: 'Vinilo Master', uri: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=180&auto=format&fit=crop&q=80' },
  { id: 'amp', name: 'Amplificador', uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=180&auto=format&fit=crop&q=80' },
  { id: 'stage', name: 'Escenario Live', uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=180&auto=format&fit=crop&q=80' },
  { id: 'reel', name: 'Carrete Reel', uri: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?w=180&auto=format&fit=crop&q=80' }
];

export default function ProfileScreen(): React.JSX.Element {
  const { user, updateProfile, logout } = useAuth();
  const { notify } = useFeedback();
  const { isDark, palette, toggleTheme } = useTheme();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>(user?.displayName || (user as any)?.display_name || '');
  const [username, setUsername] = useState<string>(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || (user as any)?.avatar_url || '');
  const [saving, setSaving] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>('');
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Animación del punto online
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 900,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  function openEditModal() {
    setDisplayName((user as any)?.display_name || user?.displayName || '');
    setUsername(user?.username || '');
    setAvatarUrl((user as any)?.avatar_url || user?.avatarUrl || '');
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
      notify('Perfil actualizado', 'Tus datos se guardaron correctamente en la credencial.', 'success');
      setIsEditing(false);
    } catch (err: any) {
      setEditError(err.message || 'Error al actualizar perfil');
      notify('No se pudo guardar', err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleCopyP2P() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setCopied(true);
    notify('P2P ID Copiado', `Identificador #${user?.id} copiado para transferencias de cinta.`, 'info');
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
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
          <View style={styles.badgeRow}>
            <View style={[styles.badgeDot, { backgroundColor: palette.accent }]} />
            <Text style={[styles.badgeRowText, { color: palette.muted }]}>
              CREDENCIAL DE ESTUDIO · PASAPORTE DE COLECCIONISTA
            </Text>
          </View>
          <Text style={[styles.title, { color: palette.text }]}>Mi Pasaporte</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>
            Identificador único de intercambio, linaje y privilegios de acceso al archivo.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tarjeta Pasaporte Holográfica con Patrón Guilloche */}
        <LinearGradient
          colors={['#FBBF24', '#00E5FF', '#A855F7', '#FBBF24']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.holoPassportBorder}
        >
          <LinearGradient
            colors={[palette.cardElevated || '#172036', palette.card || '#111726']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.passportInner}
          >
            {/* Guilloche / Líneas finas analógicas de fondo */}
            <View style={styles.guillochePattern}>
              <View style={[styles.guillocheLine, { borderColor: 'rgba(255, 255, 255, 0.03)' }]} />
              <View style={[styles.guillocheLine, { borderColor: 'rgba(255, 255, 255, 0.04)' }]} />
              <View style={[styles.guillocheLine, { borderColor: 'rgba(255, 255, 255, 0.03)' }]} />
            </View>

            {/* Cabecera del Pasaporte */}
            <View style={styles.passportHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Radio size={14} color={palette.accent} />
                <Text style={[styles.passportHeaderTitle, { color: palette.accent }]}>
                  TAPE TRADING ARCHIVE · OFFICIAL PASSPORT
                </Text>
              </View>
              <Text style={[styles.passportHeaderSub, { color: palette.muted }]}>
                AUTH #{(user as any)?.id ? String((user as any).id).padStart(5, '0') : '00001'}
              </Text>
            </View>

            {/* Fila del Avatar con Anillo en Gradiente y Luz Online */}
            <View style={styles.avatarRow}>
              <View style={styles.avatarWrap}>
                <LinearGradient
                  colors={['#FBBF24', '#D97706', '#00E5FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarRing}
                >
                  {(user as any)?.avatar_url ? (
                    <Image
                      source={{ uri: (user as any).avatar_url }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: palette.surfaceDark || '#090C14' }]}>
                      <Text style={[styles.avatarText, { color: palette.accent }]}>
                        {((user as any)?.display_name || user?.username || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                </LinearGradient>

                {/* Punto Verde Online Pulsante */}
                <Animated.View
                  style={[
                    styles.onlineDot,
                    { transform: [{ scale: pulseAnim }], backgroundColor: '#10B981' }
                  ]}
                />
              </View>

              <View style={styles.userMainInfo}>
                <Text style={[styles.name, { color: palette.text }]}>
                  {(user as any)?.display_name || user?.username}
                </Text>
                <Text style={[styles.username, { color: palette.accent }]}>
                  @{user?.username}
                </Text>
                <Text style={[styles.email, { color: palette.muted }]}>
                  {user?.email}
                </Text>

                <View style={{ marginTop: 8 }}>
                  <PremiumButton
                    onPress={openEditModal}
                    variant="outline"
                    size="sm"
                    palette={palette}
                    icon={<Edit3 size={11} color={palette.amber} />}
                  >
                    EDITAR CREDENCIAL
                  </PremiumButton>
                </View>
              </View>
            </View>

            {/* Número P2P Grande Monoespaciado con Botón de Copiado */}
            <View
              style={[
                styles.p2pCard,
                { backgroundColor: palette.surfaceDark || '#090C14', borderColor: palette.borderSubtle }
              ]}
            >
              <View style={styles.p2pMetaRow}>
                <Text style={[styles.p2pLabel, { color: palette.muted }]}>
                  P2P DUBBING IDENTITY · IDENTIFICADOR DE RED
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.copyBtn,
                    { backgroundColor: palette.surfaceLight, borderColor: palette.border },
                    pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] }
                  ]}
                  onPress={handleCopyP2P}
                >
                  {copied ? (
                    <Check size={11} color={palette.emerald || '#10B981'} />
                  ) : (
                    <Copy size={11} color={palette.cyan} />
                  )}
                  <Text
                    style={[
                      styles.copyBtnText,
                      { color: copied ? palette.emerald || '#10B981' : palette.cyan }
                    ]}
                  >
                    {copied ? 'COPIADO' : 'COPIAR ID'}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.p2pValue, { color: palette.text }]}>
                {user?.id ? `ID #${String(user.id).padStart(6, '0')}` : 'ID #000000'}
              </Text>

              <Text style={[styles.p2pHint, { color: palette.muted }]}>
                Proporcioná este número a otros archivistas para recibir transferencias de cintas analógicas y registrar tu nombre en el linaje criptográfico.
              </Text>
            </View>

            {/* Roles y Privilegios */}
            <View style={[styles.rolesContainer, { borderTopColor: palette.borderSubtle }]}>
              <Text style={[styles.rolesLabel, { color: palette.muted }]}>
                PRIVILEGIOS Y NIVELES DE ACCESO HABILITADOS
              </Text>
              <View style={styles.rolesList}>
                {(user?.roles || []).map((r) => (
                  <Badge
                    key={r}
                    label={r}
                    variant={r === 'admin' ? 'admin' : r === 'artist' ? 'artist' : 'curator'}
                    palette={palette}
                  />
                ))}
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>

        {/* Acciones de Cuenta */}
        <View style={styles.actionGroup}>
          <PremiumButton
            onPress={toggleTheme}
            variant="secondary"
            size="lg"
            palette={palette}
            style={{ width: '100%' }}
            icon={
              isDark ? (
                <Sun size={15} color={palette.accent} />
              ) : (
                <Moon size={15} color={palette.text} />
              )
            }
          >
            {isDark ? 'CAMBIAR A MODO ESTUDIO CLARO' : 'CAMBIAR A MODO ESTUDIO OSCURO'}
          </PremiumButton>

          <PremiumButton
            onPress={() => setShowLogoutModal(true)}
            variant="danger"
            size="lg"
            palette={palette}
            style={{ width: '100%', marginTop: 8 }}
            icon={<LogOut size={15} color="#FFFFFF" />}
          >
            CERRAR SESIÓN
          </PremiumButton>
        </View>
      </ScrollView>

      {/* Modal de Cierre de Sesión con Blur */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <BlurView intensity={35} tint="dark" style={styles.modalOverlay}>
          <GlowCard
            variant="purpleGlow"
            palette={palette}
            style={[
              styles.modalCard,
              { backgroundColor: palette.surface, borderColor: palette.roseBorder || '#DC2626' }
            ]}
          >
            <View
              style={[
                styles.confirmIconCircle,
                { backgroundColor: palette.roseMuted || '#381313' }
              ]}
            >
              <LogOut size={26} color={palette.rose || '#EF4444'} />
            </View>
            <Text style={[styles.modalTitle, { color: palette.text }]}>¿Cerrar Sesión?</Text>
            <Text style={[styles.modalMessage, { color: palette.muted }]}>
              ¿Confirmás que deseás cerrar la sesión de @{user?.username} en este dispositivo?
            </Text>

            <View style={styles.modalBtnRow}>
              <PremiumButton
                onPress={() => setShowLogoutModal(false)}
                variant="secondary"
                size="md"
                palette={palette}
                style={{ flex: 1 }}
              >
                CANCELAR
              </PremiumButton>
              <PremiumButton
                onPress={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                variant="danger"
                size="md"
                palette={palette}
                style={{ flex: 1.2 }}
                icon={<LogOut size={13} color="#FFFFFF" />}
              >
                CERRAR SESIÓN
              </PremiumButton>
            </View>
          </GlowCard>
        </BlurView>
      </Modal>

      {/* Modal de Edición de Perfil */}
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
          <GlowCard
            variant="surface"
            palette={palette}
            style={[
              styles.modalCardLarge,
              { backgroundColor: palette.surface, borderColor: palette.border }
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: palette.border }]} />

            <View style={styles.editHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: palette.text }]}>Editar Pasaporte</Text>
                <Text style={[styles.modalSubtitle, { color: palette.muted }]}>
                  Personalizá tu credencial y avatar de estudio
                </Text>
              </View>
              <Pressable
                style={[
                  styles.closeModalBtn,
                  { backgroundColor: palette.surfaceDark || '#090C14', borderColor: palette.border }
                ]}
                onPress={() => !saving && setIsEditing(false)}
              >
                <X size={15} color={palette.muted} />
              </Pressable>
            </View>

            {editError ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: palette.roseMuted || '#381313',
                    borderColor: palette.roseBorder || '#DC2626'
                  }
                ]}
              >
                <Text style={[styles.errorText, { color: palette.rose || '#EF4444' }]}>
                  {editError}
                </Text>
              </View>
            ) : null}

            <Text style={[styles.inputLabel, { color: palette.muted }]}>NOMBRE COMPLETO</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: palette.surfaceDark || '#090C14',
                  borderColor: palette.border,
                  color: palette.text
                }
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nombre para mostrar"
              placeholderTextColor={palette.muted}
            />

            <Text style={[styles.inputLabel, { color: palette.muted }]}>USUARIO (@handle)</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: palette.surfaceDark || '#090C14',
                  borderColor: palette.border,
                  color: palette.text
                }
              ]}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="hetfield_riffs"
              placeholderTextColor={palette.muted}
            />

            <Text style={[styles.inputLabel, { color: palette.muted }]}>AVATAR ANALÓGICO</Text>
            <View style={styles.presetsGrid}>
              {AVATAR_PRESETS.map((p) => {
                const isSelected = avatarUrl === p.uri;
                return (
                  <Pressable
                    key={p.id}
                    style={[
                      styles.presetCircleBtn,
                      { borderColor: isSelected ? palette.accent : palette.borderSubtle },
                      isSelected && { borderColor: palette.accent, borderWidth: 2.5 }
                    ]}
                    onPress={() => setAvatarUrl(p.uri)}
                  >
                    <Image source={{ uri: p.uri }} style={styles.presetCircleImg} />
                  </Pressable>
                );
              })}
            </View>

            <View style={{ marginTop: 20 }}>
              <PremiumButton
                onPress={handleSaveProfile}
                disabled={saving}
                variant="primary"
                size="lg"
                palette={palette}
                style={{ width: '100%' }}
              >
                {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS EN CREDENCIAL'}
              </PremiumButton>
            </View>
          </GlowCard>
        </KeyboardAvoidingView>
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
    width: '100%'
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  badgeDot: {
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
    maxWidth: 500
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center'
  },
  holoPassportBorder: {
    padding: 1.5,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20
  },
  passportInner: {
    borderRadius: 18.5,
    padding: 22,
    position: 'relative',
    overflow: 'hidden'
  },
  guillochePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.8
  },
  guillocheLine: {
    height: 24,
    borderBottomWidth: 1
  },
  passportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 18
  },
  passportHeaderTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1
  },
  passportHeaderSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  avatarWrap: {
    position: 'relative'
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 34
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800'
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
    borderColor: '#06080D'
  },
  userMainInfo: {
    flex: 1
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4
  },
  username: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 2
  },
  email: {
    fontSize: 12,
    marginTop: 2
  },
  p2pCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginTop: 18
  },
  p2pMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  p2pLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  copyBtnText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  p2pValue: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Platform.select({ default: 'monospace' }),
    letterSpacing: 1.5
  },
  p2pHint: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 8
  },
  rolesContainer: {
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 18
  },
  rolesLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8
  },
  rolesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  actionGroup: {
    gap: 12
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    maxWidth: 420,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '800'
  },
  modalMessage: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%'
  },
  modalCardLarge: {
    maxWidth: 500,
    width: '100%',
    borderRadius: 20,
    padding: 22
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2
  },
  closeModalBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600'
  },
  inputLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 10
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5
  },
  presetsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  presetCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden'
  },
  presetCircleImg: {
    width: '100%',
    height: '100%'
  }
});
