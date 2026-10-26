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

const ROLES = [
  { id: 'collector', label: 'Coleccionista', desc: 'Escucha, degrada cintas y las dubbea hacia otros contactos' },
  { id: 'artist', label: 'Artista / Sello', desc: 'Sube música al máster y acuña tiradas físicas limitadas' },
  { id: 'admin', label: 'Admin / Archivista', desc: 'Audita el sistema, modera sellos y administra permisos' },
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
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.brandBox}>
            <Text style={styles.logo}>metallica<Text style={styles.logoDot}>.vis</Text></Text>
            <Text style={styles.title}>ALTA DE MIEMBRO</Text>
            <Text style={styles.subtitle}>Unite a la red clandestina de coleccionismo y preservación musical analógica.</Text>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={[styles.card, shadows.md]}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOMBRE COMPLETO O ARTÍSTICO</Text>
              <TextInput 
                placeholder="Ej: James Hetfield"
                placeholderTextColor={colors.mutedDark}
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOMBRE DE USUARIO (HANDLE)</Text>
              <TextInput 
                placeholder="Ej: hetfield_riffs"
                placeholderTextColor={colors.mutedDark}
                autoCapitalize="none"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
              <TextInput 
                placeholder="james@metallica.vis"
                placeholderTextColor={colors.mutedDark}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONTRASEÑA (MÍNIMO 8 CARACTERES)</Text>
              <TextInput 
                placeholder="••••••••"
                placeholderTextColor={colors.mutedDark}
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
            </View>

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
                ¿Ya tenés credenciales? <Text style={styles.linkHighlight}>Iniciá sesión aquí</Text>
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
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center'
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 16
  },
  logo: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  logoDot: { color: colors.accent },
  title: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 8
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 20
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
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  errorIcon: { color: colors.danger, fontSize: 16, fontWeight: '900' },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600', flex: 1 },
  inputGroup: { marginBottom: 14 },
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
  roleSection: { marginTop: 6, marginBottom: 8 },
  roleContainer: { gap: 8 },
  roleCard: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12
  },
  roleCardPressed: { backgroundColor: colors.surfaceHover },
  roleCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center'
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
    fontSize: 14,
    fontWeight: '800'
  },
  roleLabelActive: {
    color: colors.accent
  },
  roleDesc: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 28,
    lineHeight: 16
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14
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
  linkButton: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 4
  },
  linkText: { color: colors.muted, fontSize: 13 },
  linkHighlight: { color: colors.accent, fontWeight: '700' }
});
