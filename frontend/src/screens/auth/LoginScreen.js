import { useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
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
import { colors, shadows } from '../../theme/colors';

export default function LoginScreen({ navigation }) {
  const { login, socialLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      Alert.alert('Error de autenticación', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(provider) {
    try {
      setLoading(true);
      setErrorMsg('');
      const mockAccounts = {
        google: {
          id: `goog_${Date.now()}`,
          email: 'usuario.google@gmail.com',
          name: 'Coleccionista Google'
        },
        facebook: {
          id: `fb_${Date.now()}`,
          email: 'usuario.fb@facebook.com',
          name: 'Coleccionista Facebook'
        },
        apple: {
          id: `apple_${Date.now()}`,
          email: 'usuario.apple@icloud.com',
          name: 'Coleccionista Apple'
        }
      };

      const account = mockAccounts[provider];
      await socialLogin(provider, account.id, account.email, account.name);
    } catch (error) {
      setErrorMsg(error.message || `Error con ${provider}`);
      Alert.alert(`Error con ${provider}`, error.message);
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
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header con identidad tape trading */}
          <View style={styles.brandBox}>
            <View style={styles.badgeLabel}>
              <Text style={styles.badgeLabelText}>ARCHIVOS MAGNÉTICOS · EDICIÓN LIMITADA</Text>
            </View>
            <Text style={styles.logo}>metallica<Text style={styles.logoDot}>.vis</Text></Text>
            <Text style={styles.subtitle}>Tape trading subterráneo, copias numeradas y degradación física analógica.</Text>
          </View>

          {/* Caja de error legible */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Formulario Principal */}
          <View style={[styles.card, shadows.md]}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
              <TextInput 
                placeholder="nombre@ejemplo.com" 
                placeholderTextColor={colors.mutedDark} 
                autoCapitalize="none" 
                keyboardType="email-address"
                style={styles.input} 
                value={email} 
                onChangeText={setEmail} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONTRASEÑA</Text>
              <TextInput 
                placeholder="••••••••" 
                placeholderTextColor={colors.mutedDark} 
                secureTextEntry 
                style={styles.input} 
                value={password} 
                onChangeText={setPassword} 
              />
            </View>

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

            {/* Accesos rápidos Demo */}
            <View style={styles.demoSection}>
              <Text style={styles.sectionHeader}>ACCESOS RÁPIDOS POR ROL (DEMO)</Text>
              <View style={styles.demoRow}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.demoChip,
                    email === 'collector@metallica.vis' && styles.demoChipActive,
                    pressed && styles.demoChipPressed
                  ]} 
                  onPress={() => setDemoUser('collector@metallica.vis')}
                >
                  <Text style={[styles.demoChipTitle, email === 'collector@metallica.vis' && styles.demoChipTitleActive]}>
                    Coleccionista
                  </Text>
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
                  <Text style={[styles.demoChipTitle, email === 'artist@metallica.vis' && styles.demoChipTitleActive]}>
                    Artista / Sello
                  </Text>
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
                  <Text style={[styles.demoChipTitle, email === 'admin@metallica.vis' && styles.demoChipTitleActive]}>
                    Admin
                  </Text>
                  <Text style={styles.demoChipSub}>Rol 3 · Auditoría</Text>
                </Pressable>
              </View>
            </View>

            {/* Separador */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O CONECTAR CON</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botones Redes Sociales */}
            <View style={styles.socialButtons}>
              <Pressable 
                style={({ pressed }) => [
                  styles.socialBtn,
                  { borderColor: colors.google },
                  pressed && { backgroundColor: '#2a1114' }
                ]}
                onPress={() => handleSocial('google')}
                disabled={loading}
              >
                <Text style={[styles.socialText, { color: colors.google }]}>Google</Text>
              </Pressable>

              <Pressable 
                style={({ pressed }) => [
                  styles.socialBtn,
                  { borderColor: colors.facebook },
                  pressed && { backgroundColor: '#101c33' }
                ]}
                onPress={() => handleSocial('facebook')}
                disabled={loading}
              >
                <Text style={[styles.socialText, { color: colors.facebook }]}>Facebook</Text>
              </Pressable>

              <Pressable 
                style={({ pressed }) => [
                  styles.socialBtn,
                  { borderColor: colors.border },
                  pressed && { backgroundColor: colors.surfaceHover }
                ]}
                onPress={() => handleSocial('apple')}
                disabled={loading}
              >
                <Text style={[styles.socialText, { color: colors.apple }]}>Apple</Text>
              </Pressable>
            </View>

            <Pressable 
              style={styles.registerLink} 
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerText}>
                ¿No tenés cuenta todavía?{' '}
                <Text style={styles.registerHighlight}>Crear cuenta de Coleccionista</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center'
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8
  },
  badgeLabel: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10
  },
  badgeLabelText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1
  },
  logo: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  logoDot: {
    color: colors.accent
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 16
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border
  },
  errorBox: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  errorIcon: { color: colors.danger, fontSize: 16, fontWeight: '900' },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600', flex: 1 },
  inputGroup: {
    marginBottom: 14
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  input: {
    backgroundColor: colors.surfaceDark,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6
  },
  buttonPressed: {
    backgroundColor: colors.accentHover,
    transform: [{ scale: 0.99 }]
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.background,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1
  },
  demoSection: {
    marginTop: 20
  },
  sectionHeader: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center'
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
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center'
  },
  demoChipPressed: {
    backgroundColor: colors.surfaceHover
  },
  demoChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted
  },
  demoChipTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  demoChipTitleActive: {
    color: colors.accent
  },
  demoChipSub: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 2,
    fontWeight: '600'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSubtle
  },
  dividerText: {
    color: colors.mutedDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 10
  },
  socialBtn: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center'
  },
  socialText: {
    fontWeight: '800',
    fontSize: 13
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
    fontWeight: '700'
  }
});
