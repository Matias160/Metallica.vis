// Formulario para crear una cuenta con selector interactivo de rol inicial.
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { colors, shadows } from '../../theme/colors';

const ROLES = [
  {
    id: 'collector',
    label: 'Coleccionista',
    desc: 'Escucha, degrada cintas físicas y las dubbea hacia otros contactos de la red.'
  },
  {
    id: 'artist',
    label: 'Artista / Sello',
    desc: 'Sube música al máster y acuña tiradas físicas limitadas con cuota estricta.'
  },
  {
    id: 'admin',
    label: 'Archivista / Admin',
    desc: 'Audita el sistema, modera sellos discográficos y administra permisos.'
  }
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { notify } = useFeedback();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('collector');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);

  async function handleRegister() {
    setErrorMsg('');
    if (!displayName.trim() || !username.trim() || !email.trim() || !password) {
      setErrorMsg('Por favor completá todos los campos requeridos.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    try {
      setLoading(true);
      await register(username.trim(), email.trim(), password, displayName.trim(), selectedRole);
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar la cuenta');
      notify('No se pudo crear la cuenta', err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.brandBox}>
            <View style={styles.badgeLabel}>
              <View style={styles.liveDot} />
              <Text style={styles.badgeLabelText}>CREDENCIAL ANALÓGICA</Text>
            </View>
            <Text style={styles.logo}>
              metallica<Text style={styles.logoDot}>.vis</Text>
            </Text>
            <Text style={styles.title}>Alta de Miembro</Text>
            <Text style={styles.subtitle}>
              Unite a la red clandestina de coleccionismo, intercambio y preservación de másters musicales.
            </Text>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={[styles.card, shadows.lg]}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOMBRE COMPLETO O ARTÍSTICO</Text>
              <TextInput
                placeholder="Ej: James Hetfield"
                placeholderTextColor={colors.mutedDark}
                style={[styles.input, focusedInput === 'displayName' && styles.inputFocused]}
                value={displayName}
                onChangeText={setDisplayName}
                onFocus={() => setFocusedInput('displayName')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOMBRE DE USUARIO (HANDLE)</Text>
              <TextInput
                placeholder="Ej: hetfield_riffs"
                placeholderTextColor={colors.mutedDark}
                autoCapitalize="none"
                style={[styles.input, focusedInput === 'username' && styles.inputFocused]}
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
              <TextInput
                placeholder="james@metallica.vis"
                placeholderTextColor={colors.mutedDark}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONTRASEÑA (MÍNIMO 8 CARACTERES)</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={colors.mutedDark}
                secureTextEntry
                style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            {/* Selector de Rol Inicial */}
            <View style={styles.roleSection}>
              <Text style={styles.label}>SELECCIONÁ TU ROL INICIAL:</Text>
              <View style={styles.roleContainer}>
                {ROLES.map((r) => {
                  const isSelected = selectedRole === r.id;
                  return (
                    <Pressable
                      key={r.id}
                      style={({ pressed }) => [
                        styles.roleCard,
                        isSelected && styles.roleCardActive,
                        pressed && styles.roleCardPressed
                      ]}
                      onPress={() => setSelectedRole(r.id)}
                    >
                      <View style={styles.roleHeader}>
                        <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <Text style={[styles.roleLabel, isSelected && styles.roleLabelActive]}>
                          {r.label}
                        </Text>
                      </View>
                      <Text style={styles.roleDesc}>{r.desc}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Botón de Enviar */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                shadows.glowAccent,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.buttonText}>CREAR CUENTA Y COMENZAR</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>
                ¿Ya tenés credenciales?{' '}
                <Text style={styles.linkHighlight}>Iniciá sesión aquí</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 32,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center'
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 24
  },
  badgeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent
  },
  badgeLabelText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1
  },
  logo: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1
  },
  logoDot: {
    color: colors.accent
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 6
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    maxWidth: 380
  },
  errorBox: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  errorIcon: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '900'
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
    flex: 1
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border
  },
  inputGroup: {
    marginBottom: 14
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  input: {
    backgroundColor: colors.surfaceDark,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  inputFocused: {
    borderColor: colors.accent,
    backgroundColor: '#0c0f17'
  },
  roleSection: {
    marginTop: 6,
    marginBottom: 18
  },
  roleContainer: {
    gap: 8,
    marginTop: 6
  },
  roleCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  roleCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted
  },
  roleCardPressed: {
    backgroundColor: colors.surfaceHover
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.mutedDark,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioOuterActive: {
    borderColor: colors.accent
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent
  },
  roleLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800'
  },
  roleLabelActive: {
    color: colors.accent
  },
  roleDesc: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
    paddingLeft: 26
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
  linkButton: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 4
  },
  linkText: {
    color: colors.muted,
    fontSize: 12
  },
  linkHighlight: {
    color: colors.accent,
    fontWeight: '800'
  }
});
