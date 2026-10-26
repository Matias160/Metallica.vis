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

const ROLES = [
  { id: 'collector', label: 'Coleccionista', desc: 'Escucha, colecciona y dubbea cintas' },
  { id: 'artist', label: 'Artista / Sello', desc: 'Publica música y crea tiradas' },
  { id: 'admin', label: 'Admin / Archivista', desc: 'Audita y verifica el catálogo' },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('collector');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      Alert.alert('Registro fallido', err.message);
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
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.logo}>metallica.vis</Text>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Elegí tu rol en la comunidad de tape trading</Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>Nombre completo / Nombre artístico</Text>
            <TextInput 
              placeholder="Ej: Cliff Burton"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
            />

            <Text style={styles.label}>Nombre de usuario</Text>
            <TextInput 
              placeholder="Ej: cliff_bass"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              style={styles.input}
              value={username}
              onChangeText={setUsername}
            />

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput 
              placeholder="cliff@metallica.vis"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Contraseña (mínimo 8 caracteres)</Text>
            <TextInput 
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />

            <Text style={styles.label}>Seleccioná tu rol principal:</Text>
            <View style={styles.roleContainer}>
              {ROLES.map((r) => {
                const isSelected = selectedRole === r.id;
                return (
                  <Pressable
                    key={r.id}
                    style={[styles.roleCard, isSelected && styles.roleCardActive]}
                    onPress={() => setSelectedRole(r.id)}
                  >
                    <Text style={[styles.roleLabel, isSelected && styles.roleLabelActive]}>
                      {r.label}
                    </Text>
                    <Text style={styles.roleDesc}>{r.desc}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.buttonText}>Registrarse y Comenzar</Text>
              )}
            </Pressable>

            <Pressable 
              style={styles.linkButton} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>
                ¿Ya tenés una cuenta? <Text style={styles.linkHighlight}>Iniciá sesión</Text>
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
  scroll: { padding: 24, paddingBottom: 40 },
  logo: { color: colors.accent, fontSize: 32, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 16 },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4, marginBottom: 20 },
  errorBox: {
    backgroundColor: '#3f151e',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  form: { gap: 10 },
  label: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 6 },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  roleContainer: { gap: 10, marginVertical: 6 },
  roleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12
  },
  roleCardActive: {
    borderColor: colors.accent,
    backgroundColor: '#1d2212'
  },
  roleLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
  roleLabelActive: { color: colors.accent },
  roleDesc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.background, fontWeight: '900', fontSize: 16 },
  linkButton: { alignItems: 'center', marginTop: 14, padding: 8 },
  linkText: { color: colors.muted, fontSize: 14 },
  linkHighlight: { color: colors.accent, fontWeight: '700' }
});
