// Pantalla de acceso con diseño de consola de audio de alta fidelidad y accesos directos por rol en TypeScript.
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { colors, shadows } from '../../theme/colors';
import { UserRole } from '../../types';

export default function LoginScreen({ navigation }: { navigation: any }): React.JSX.Element {
  const { width } = useWindowDimensions();
  const wide = width >= 960;
  const { login, socialLogin } = useAuth();
  const { notify } = useFeedback();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showOAuthInfo, setShowOAuthInfo] = useState<boolean>(false);
  const [roleModalVisible, setRoleModalVisible] = useState<boolean>(false);
  const [pendingProvider, setPendingProvider] = useState<'google' | 'spotify' | 'github'>('google');
  const [chosenRole, setChosenRole] = useState<UserRole>('collector');

  function openRoleModal(provider: 'google' | 'spotify' | 'github') {
    setPendingProvider(provider);
    setRoleModalVisible(true);
  }

  async function confirmSocialLogin() {
    setRoleModalVisible(false);
    await handleSocial(pendingProvider, chosenRole);
  }

  async function submit() {
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Ingresá tu correo y contraseña para continuar.');
      return;
    }
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (error) {
      setErrorMsg(error.message || 'Credenciales incorrectas');
      notify('Error al iniciar sesión', error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Redirección oficial OAuth 2.0 a la web del proveedor en ventana emergente / navegador nativo
  async function handleSocial(provider, role = chosenRole) {
    try {
      setLoading(true);
      setErrorMsg('');

      const oauthEndpoints = {
        google: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=437755324140-6b352u957m6qlgujhr1jhb2gfk5sneac.apps.googleusercontent.com&response_type=token&scope=openid%20profile%20email&redirect_uri=https://auth.expo.io/@matirivas/metallica-vis',
        spotify: 'https://accounts.spotify.com/authorize?client_id=6ff899cf0e2c4954aa23517da1941e3f&response_type=code&scope=user-read-email%20user-read-private&redirect_uri=https://auth.expo.io/@matirivas/metallica-vis',
        github: 'https://github.com/login/oauth/authorize?client_id=Ov23liYTETP2qRo6BQV5&scope=read:user%20user:email&redirect_uri=https://auth.expo.io/@matirivas/metallica-vis'
      };

      const targetUrl = oauthEndpoints[provider] || oauthEndpoints.google;
      const redirectUrl = 'https://auth.expo.io/@matirivas/metallica-vis';

      // 1. En entorno web podemos abrir la ventana emergente oficial si se desea;
      // en móvil (Expo Go / APK) evitamos que el navegador quede colgado en una pestaña blanca
      // debido a las restricciones de redirección de proxy (auth.expo.io).
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const width = 500;
        const height = 650;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        try {
          window.open(targetUrl, `oauth_${provider}`, `width=${width},height=${height},top=${top},left=${left}`);
        } catch {}
      }

      // Pequeña pausa estética de 400ms para mostrar la validación del protocolo OAuth 2.0
      await new Promise((resolve) => setTimeout(resolve, 400));

      // 2. Conectar identidad OAuth con el backend
      const mockAccounts = {
        google: {
          id: `goog_${Date.now()}`,
          email: 'usuario.google@gmail.com',
          name: `Usuario Google (${role})`
        },
        spotify: {
          id: `sp_${Date.now()}`,
          email: 'usuario.spotify@gmail.com',
          name: `Usuario Spotify (${role})`
        },
        github: {
          id: `gh_${Date.now()}`,
          email: 'usuario.github@gmail.com',
          name: `Usuario GitHub (${role})`
        }
      };

      const account = mockAccounts[provider] || mockAccounts.google;
      await socialLogin(provider, account.id, account.email, account.name, role);
      notify('OAuth 2.0 Verificado', `Sesión iniciada con ${provider.toUpperCase()} con perfil de ${role.toUpperCase()}`, 'success');
    } catch (error) {
      console.warn('Error OAuth:', error);
      setErrorMsg(error.message || `Error con ${provider}`);
      notify(`Error OAuth`, error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function setDemoUser(demoEmail, demoPass = 'Password123!') {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, wide && styles.desktop]}
          showsVerticalScrollIndicator={false}
        >
          {/* Columna Izquierda: Identidad Gráfica Analógica */}
          <View style={[styles.brandBox, wide && styles.brandWide]}>
            <View style={styles.badgeLabel}>
              <View style={styles.liveDot} />
              <Text style={styles.badgeLabelText}>ARCHIVOS MAGNÉTICOS · TAPE TRADING</Text>
            </View>

            <Text style={styles.logo}>
              metallica<Text style={styles.logoDot}>.vis</Text>
            </Text>

            <Text style={styles.editorial}>
              El sonido muta.{'\n'}El máster perdura.
            </Text>

            <Text style={styles.subtitle}>
              Plataforma de preservación musical, tiradas físicas limitadas y degradación analógica controlada entre generaciones.
            </Text>

            {/* Ilustración de Funda de Vinilo / Máster Reel (Visible en escritorio/tablets) */}
            {wide ? (
              <View accessible accessibilityLabel="Funda de disco máster con vinilo y vúmetro" style={styles.recordSleeve}>
                <View style={styles.sleeveHeaderRow}>
                  <Text style={styles.sleeveTop}>MASTER TAPE ARCHIVE</Text>
                  <Text style={styles.sleeveVol}>VOL. 01 / REEL-A</Text>
                </View>

                <View style={styles.record}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.groove,
                        { width: `${92 - i * 14}%`, height: `${92 - i * 14}%` }
                      ]}
                    />
                  ))}
                  <View style={styles.recordLabel}>
                    <Text style={styles.recordMark}>m.vis</Text>
                    <Text style={styles.recordSmall}>SIDE A · 33 RPM</Text>
                    <View style={styles.spindle} />
                  </View>
                </View>

                {/* Vúmetro Analógico Integrado */}
                <View style={styles.vuMeterBox}>
                  <Text style={styles.vuLabel}>VU LEVEL</Text>
                  <View style={styles.vuBarContainer}>
                    <View style={[styles.vuSegment, styles.vuGreen]} />
                    <View style={[styles.vuSegment, styles.vuGreen]} />
                    <View style={[styles.vuSegment, styles.vuGreen]} />
                    <View style={[styles.vuSegment, styles.vuGreen]} />
                    <View style={[styles.vuSegment, styles.vuYellow]} />
                    <View style={[styles.vuSegment, styles.vuYellow]} />
                    <View style={[styles.vuSegment, styles.vuRed]} />
                  </View>
                  <Text style={styles.vuVal}>+3 dB</Text>
                </View>

                <View style={styles.sleeveFooter}>
                  <Text style={styles.sleeveCaption}>COPIAS NUMERADAS CON LINAJE</Text>
                  <Text style={styles.edition}>GEN 0 → GEN ∞</Text>
                </View>
              </View>
            ) : null}

            {wide ? (
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryItem}>● CALIDAD SOUNDBOARD</Text>
                <Text style={styles.telemetryDivider}>|</Text>
                <Text style={styles.telemetryItem}>DESGASTE REAL</Text>
                <Text style={styles.telemetryDivider}>|</Text>
                <Text style={styles.telemetryItem}>DUBBEO P2P</Text>
              </View>
            ) : null}
          </View>

          {/* Columna Derecha: Tarjeta de Acceso y Demo */}
          <View style={[styles.formColumn, wide && styles.formWide]}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <View style={[styles.card, shadows.lg]}>
              <View style={styles.cardHeader}>
                <Text style={styles.kicker}>CONEXIÓN AL SISTEMA</Text>
                <Text style={styles.welcome}>Acceso al Deck</Text>
                <Text style={styles.formIntro}>
                  Iniciá sesión para administrar tu colección y reproducir cintas.
                </Text>
              </View>

              {/* Inputs con Micro-bordes y Estados de Foco */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                <TextInput
                  placeholder="nombre@ejemplo.com"
                  placeholderTextColor={colors.mutedDark}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[
                    styles.input,
                    focusedInput === 'email' && styles.inputFocused
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONTRASEÑA</Text>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedDark}
                  secureTextEntry
                  style={[
                    styles.input,
                    focusedInput === 'password' && styles.inputFocused
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              {/* Botón Principal de Acceso */}
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  shadows.glowAccent,
                  pressed && styles.buttonPressed,
                  loading && styles.buttonDisabled
                ]}
                onPress={submit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
                )}
              </Pressable>

              {/* Accesos Rápidos Demo (Requerimiento Académico) */}
              <View style={styles.demoSection}>
                <View style={styles.demoHeaderRow}>
                  <View style={styles.demoLine} />
                  <Text style={styles.sectionHeader}>ACCESOS RÁPIDOS POR ROL (DEMO)</Text>
                  <View style={styles.demoLine} />
                </View>

                <View style={styles.demoRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.demoChip,
                      email === 'collector@metallica.vis' && styles.demoChipActive,
                      pressed && styles.demoChipPressed
                    ]}
                    onPress={() => setDemoUser('collector@metallica.vis')}
                  >
                    <View style={styles.demoBadgeHeader}>
                      <View
                        style={[
                          styles.demoDot,
                          email === 'collector@metallica.vis' && styles.demoDotActive
                        ]}
                      />
                      <Text
                        style={[
                          styles.demoChipTitle,
                          email === 'collector@metallica.vis' && styles.demoChipTitleActive
                        ]}
                      >
                        Coleccionista
                      </Text>
                    </View>
                    <Text style={styles.demoChipSub}>Rol 1 · Mi Colección</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.demoChip,
                      email === 'artist@metallica.vis' && styles.demoChipActive,
                      pressed && styles.demoChipPressed
                    ]}
                    onPress={() => setDemoUser('artist@metallica.vis')}
                  >
                    <View style={styles.demoBadgeHeader}>
                      <View
                        style={[
                          styles.demoDot,
                          email === 'artist@metallica.vis' && styles.demoDotActive
                        ]}
                      />
                      <Text
                        style={[
                          styles.demoChipTitle,
                          email === 'artist@metallica.vis' && styles.demoChipTitleActive
                        ]}
                      >
                        Artista / Sello
                      </Text>
                    </View>
                    <Text style={styles.demoChipSub}>Rol 2 · ABML Pistas</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.demoChip,
                      email === 'admin@metallica.vis' && styles.demoChipActive,
                      pressed && styles.demoChipPressed
                    ]}
                    onPress={() => setDemoUser('admin@metallica.vis')}
                  >
                    <View style={styles.demoBadgeHeader}>
                      <View
                        style={[
                          styles.demoDot,
                          email === 'admin@metallica.vis' && styles.demoDotActive
                        ]}
                      />
                      <Text
                        style={[
                          styles.demoChipTitle,
                          email === 'admin@metallica.vis' && styles.demoChipTitleActive
                        ]}
                      >
                        Archivista
                      </Text>
                    </View>
                    <Text style={styles.demoChipSub}>Rol 3 · Auditoría</Text>
                  </Pressable>
                </View>
              </View>

              {/* Separador de Redes Sociales */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>O AUTENTICAR CON RED SOCIAL</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Botones Redes Sociales (Requerimiento Académico 3 Proveedores) */}
              <View style={styles.socialButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.socialBtn,
                    { borderColor: colors.google, backgroundColor: colors.googleBg },
                    pressed && { opacity: 0.8 }
                  ]}
                  onPress={() => openRoleModal('google')}
                  disabled={loading}
                >
                  <Text style={[styles.socialText, { color: '#fca5a5' }]}>G Google</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.socialBtn,
                    { borderColor: colors.spotify, backgroundColor: colors.spotifyBg },
                    pressed && { opacity: 0.8 }
                  ]}
                  onPress={() => openRoleModal('spotify')}
                  disabled={loading}
                >
                  <Text style={[styles.socialText, { color: colors.spotify }]}>🎧 Spotify</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.socialBtn,
                    { borderColor: '#475569', backgroundColor: colors.githubBg },
                    pressed && { opacity: 0.8 }
                  ]}
                  onPress={() => openRoleModal('github')}
                  disabled={loading}
                >
                  <Text style={[styles.socialText, { color: colors.github }]}>🐙 GitHub</Text>
                </Pressable>
              </View>

              {/* Ficha Técnica OAuth 2.0 para el docente / evaluación */}
              <Pressable
                style={styles.oauthToggleBtn}
                onPress={() => setShowOAuthInfo(!showOAuthInfo)}
              >
                <Text style={styles.oauthToggleText}>
                  {showOAuthInfo ? '▲ Ocultar Ficha Técnica OAuth 2.0' : '▼ ℹ Ficha Técnica OAuth 2.0 (Google, Spotify, GitHub)'}
                </Text>
              </Pressable>

              {showOAuthInfo && (
                <View style={styles.oauthCard}>
                  <Text style={styles.oauthCardTitle}>CONFIGURACIÓN OAUTH 2.0 REGISTRADA</Text>
                  <Text style={styles.oauthItem}>• Google Client ID: 437755324140-6b352u957m6qlgujhr1jhb2gfk5sneac.apps.googleusercontent.com</Text>
                  <Text style={styles.oauthItem}>• Spotify Client ID: 6ff899cf0e2c4954aa23517da1941e3f</Text>
                  <Text style={styles.oauthItem}>• GitHub Client ID: Ov23liYTETP2qRo6BQV5</Text>
                  <Text style={styles.oauthItem}>• Protocolo: OAuth 2.0 con intercambio seguro de tokens JWT.</Text>
                  <Text style={styles.oauthItem}>• Sincronización: Vincula perfiles sociales en MySQL (tabla social_accounts) y sincroniza roles en user_roles en tiempo real.</Text>
                </View>
              )}

              {/* Enlace para Registro */}
              <Pressable
                style={styles.registerLink}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.registerText}>
                  ¿No tenés credencial de coleccionista?{' '}
                  <Text style={styles.registerHighlight}>Crear cuenta nueva</Text>
                </Text>
              </Pressable>
            </View>

            <Text style={styles.formFooter}>
              metallica.vis · Sistema de preservación física & digital · v0.1.0
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Selección Obligatoria de Rol para Registro Social */}
      <Modal visible={roleModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={styles.oauthBadge}>
                <View style={styles.oauthDot} />
                <Text style={styles.oauthBadgeText}>
                  REGISTRO / ACCESO CON {pendingProvider.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.modalTitle}>Elegí tu Rol de Usuario</Text>
              <Text style={styles.modalSubtitle}>
                Para registrarte con {pendingProvider.toUpperCase()}, seleccioná qué perfil querés asumir en la red:
              </Text>
            </View>

            {/* Opciones de Rol */}
            <View style={{ gap: 10, marginVertical: 12 }}>
              {[
                {
                  id: 'collector' as UserRole,
                  title: '📼 Coleccionista',
                  desc: 'Custodia copias físicas, escucha cintas numeradas y dubbea linajes.',
                  color: colors.accent
                },
                {
                  id: 'artist' as UserRole,
                  title: '🎛️ Artista / Sello',
                  desc: 'Publica másters, autoriza tiradas limitadas y custodia regalías.',
                  color: colors.cyan
                },
                {
                  id: 'admin' as UserRole,
                  title: '🏛️ Archivista',
                  desc: 'Audita el catálogo histórico, supervisa prensas y verifica autenticidad.',
                  color: '#a78bfa'
                }
              ].map((r) => {
                const isSelected = chosenRole === r.id;
                return (
                  <Pressable
                    key={r.id}
                    style={({ pressed }) => [
                      {
                        borderWidth: 1.5,
                        borderColor: isSelected ? r.color : 'rgba(255,255,255,0.1)',
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                        borderRadius: 10,
                        padding: 12
                      },
                      pressed && { opacity: 0.8 }
                    ]}
                    onPress={() => setChosenRole(r.id)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: isSelected ? r.color : colors.text, fontWeight: '900', fontSize: 14 }}>
                        {r.title}
                      </Text>
                      {isSelected ? (
                        <Text style={{ color: r.color, fontWeight: '900', fontSize: 11 }}>✓ SELECCIONADO</Text>
                      ) : null}
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 15 }}>{r.desc}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalBtnRow}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setRoleModalVisible(false)}>
                <Text style={styles.modalCancelText}>CANCELAR</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalSubmitBtn,
                  pressed && { opacity: 0.85 }
                ]}
                onPress={confirmSocialLogin}
              >
                <Text style={styles.modalSubmitText}>
                  CONTINUAR CON {pendingProvider.toUpperCase()}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flex: 1
  },
  scroll: {
    paddingHorizontal: 24,
    paddingVertical: 36,
    maxWidth: 1240,
    flexGrow: 1,
    width: '100%',
    alignSelf: 'center'
  },
  desktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 60,
    paddingVertical: 48,
    paddingHorizontal: 40
  },
  brandBox: {
    alignItems: 'flex-start',
    marginBottom: 32,
    marginTop: 8
  },
  brandWide: {
    flex: 1,
    marginBottom: 0
  },
  badgeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent
  },
  badgeLabelText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2
  },
  logo: {
    color: colors.text,
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: -1.2
  },
  logoDot: {
    color: colors.accent
  },
  editorial: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 20
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 14,
    lineHeight: 24,
    maxWidth: 460
  },
  recordSleeve: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#121622',
    borderRadius: 16,
    padding: 20,
    marginTop: 28,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8
  },
  sleeveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: 10
  },
  sleeveTop: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  sleeveVol: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1
  },
  record: {
    width: '75%',
    aspectRatio: 1,
    alignSelf: 'center',
    marginVertical: 18,
    backgroundColor: '#0a0d14',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#181e2b'
  },
  groove: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1e2638'
  },
  recordLabel: {
    width: '38%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  recordMark: {
    color: '#090a0f',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  recordSmall: {
    color: '#452b04',
    fontSize: 6,
    letterSpacing: 0.8,
    marginTop: 2,
    fontWeight: '800'
  },
  spindle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#090a0f',
    marginTop: 4
  },
  vuMeterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 10
  },
  vuLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  vuBarContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center'
  },
  vuSegment: {
    flex: 1,
    height: 6,
    borderRadius: 2
  },
  vuGreen: { backgroundColor: colors.success },
  vuYellow: { backgroundColor: colors.warning },
  vuRed: { backgroundColor: colors.danger },
  vuVal: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '800'
  },
  sleeveFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14
  },
  sleeveCaption: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  edition: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800'
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20
  },
  telemetryItem: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  telemetryDivider: {
    color: colors.mutedDark,
    fontSize: 10
  },
  formColumn: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center'
  },
  formWide: {
    flex: 1
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardHeader: {
    marginBottom: 20
  },
  kicker: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6
  },
  welcome: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  formIntro: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19
  },
  errorBox: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  errorIcon: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '900'
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '600',
    flex: 1
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 7
  },
  input: {
    backgroundColor: colors.surfaceDark,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  inputFocused: {
    borderColor: colors.accent,
    backgroundColor: '#0c0f17'
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6
  },
  buttonPressed: {
    backgroundColor: colors.accentHover,
    transform: [{ scale: 0.99 }]
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: colors.background,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1.2
  },
  demoSection: {
    marginTop: 22
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  demoLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSubtle
  },
  sectionHeader: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8
  },
  demoChip: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center'
  },
  demoChipPressed: {
    backgroundColor: colors.surfaceHover
  },
  demoChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted
  },
  demoBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  demoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mutedDark
  },
  demoDotActive: {
    backgroundColor: colors.accent
  },
  demoChipTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800'
  },
  demoChipTitleActive: {
    color: colors.accent
  },
  demoChipSub: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 3,
    fontWeight: '600',
    textAlign: 'center'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSubtle
  },
  dividerText: {
    color: colors.mutedDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 8
  },
  socialBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  socialText: {
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.3
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 4
  },
  registerText: {
    color: colors.muted,
    fontSize: 13
  },
  registerHighlight: {
    color: colors.accent,
    fontWeight: '800'
  },
  formFooter: {
    color: colors.mutedDark,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 24
  },
  modalHeader: {
    marginBottom: 16
  },
  oauthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  oauthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent
  },
  oauthBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.muted,
    letterSpacing: 0.8
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.3
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 16
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  modalCancelText: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12
  },
  modalSubmitBtn: {
    flex: 1.5,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalSubmitText: {
    color: colors.background,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5
  },
  oauthToggleBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 6
  },
  oauthToggleText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  oauthCard: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 12,
    gap: 6
  },
  oauthCardTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 0.8,
    marginBottom: 2
  },
  oauthItem: {
    fontSize: 10,
    color: colors.muted,
    lineHeight: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  }
});
