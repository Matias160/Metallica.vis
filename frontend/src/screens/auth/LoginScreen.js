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
import { colors } from '../../theme/colors';

export default function LoginScreen({ navigation }) {
  const { login, socialLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function submit() {
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Ingresá tu correo y contraseña');
      return;
    }
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (error) {
      setErrorMsg(error.message || 'Credenciales incorrectas');
      Alert.alert('No se pudo iniciar sesión', error.message);
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
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.logo}>metallica.vis</Text>
          <Text style={styles.subtitle}>Coleccioná sonidos. Heredá historias.</Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput 
              placeholder="tu@correo.com" 
              placeholderTextColor={colors.muted} 
              autoCapitalize="none" 
              keyboardType="email-address"
              style={styles.input} 
              value={email} 
              onChangeText={setEmail} 
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput 
              placeholder="••••••••" 
              placeholderTextColor={colors.muted} 
              secureTextEntry 
              style={styles.input} 
              value={password} 
              onChangeText={setPassword} 
            />

            <Pressable 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
              )}
            </Pressable>

            {/* Accesos rápidos de prueba por rol */}
            <Text style={styles.sectionHeader}>Usuarios Demo por Rol</Text>
            <View style={styles.demoRow}>
              <Pressable 
                style={[styles.demoChip, email === 'collector@metallica.vis' && styles.demoChipActive]} 
                onPress={() => setDemoUser('collector@metallica.vis')}
              >
                <Text style={styles.demoChipTitle}>Coleccionista</Text>
                <Text style={styles.demoChipSub}>Rol 1</Text>
              </Pressable>
              <Pressable 
                style={[styles.demoChip, email === 'artist@metallica.vis' && styles.demoChipActive]} 
                onPress={() => setDemoUser('artist@metallica.vis')}
              >
                <Text style={styles.demoChipTitle}>Artista</Text>
                <Text style={styles.demoChipSub}>Rol 2</Text>
              </Pressable>
              <Pressable 
                style={[styles.demoChip, email === 'admin@metallica.vis' && styles.demoChipActive]} 
                onPress={() => setDemoUser('admin@metallica.vis')}
              >
                <Text style={styles.demoChipTitle}>Admin</Text>
                <Text style={styles.demoChipSub}>Rol 3</Text>
              </Pressable>
            </View>

            {/* Separador */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o ingresá con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Redes Sociales (3 Redes) */}
            <View style={styles.socialButtons}>
              <Pressable 
                style={[styles.socialBtn, { borderColor: colors.google }]}
                onPress={() => handleSocial('google')}
                disabled={loading}
              >
                <Text style={[styles.socialText, { color: colors.google }]}>G Google</Text>
              </Pressable>

              <Pressable 
                style={[styles.socialBtn, { borderColor: colors.facebook }]}
                onPress={() => handleSocial('facebook')}
                disabled={loading}
              >
                <Text style={[styles.socialText, { color: colors.facebook }]}>f Facebook</Text>
              </Pressable>

              <Pressable 
                style={[styles.socialBtn, { borderColor: colors.border }]}
                onPress={() => handleSocial('apple')}
                disabled={loading}
              >
                <Text style={[styles.socialText, { color: colors.text }]}> Apple</Text>
              </Pressable>
            </View>

            <Pressable 
              style={styles.registerLink} 
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerText}>
                ¿No tenés cuenta todavía? <Text style={styles.registerHighlight}>Crear cuenta</Text>
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
  scroll: { padding: 24, justifyContent: 'center' },
  logo: { color: colors.accent, fontSize: 38, fontWeight: '900', letterSpacing: 0.5 },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: 6, marginBottom: 20 },
  errorBox: {
    backgroundColor: '#3f151e',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  form: { gap: 12 },
  label: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 4 },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.background, fontWeight: '900', fontSize: 16 },
  sectionHeader: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 10,
    textAlign: 'center'
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between'
  },
  demoChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  demoChipActive: {
    borderColor: colors.accent,
    backgroundColor: '#1b2010'
  },
  demoChipTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  demoChipSub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.muted, fontSize: 12 },
  socialButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between'
  },
  socialBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  socialText: { fontWeight: '800', fontSize: 13 },
  registerLink: { alignItems: 'center', marginTop: 18, padding: 8 },
  registerText: { color: colors.muted, fontSize: 14 },
  registerHighlight: { color: colors.accent, fontWeight: '800' }
});
