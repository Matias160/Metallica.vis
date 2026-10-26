import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

export default function ProfileScreen() {
  const { user, refreshUser, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.display_name || user?.username || 'U')[0].toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{user?.display_name}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.idBox}>
          <Text style={styles.idLabel}>Tu ID de Usuario para Dubbeo:</Text>
          <Text style={styles.idValue}>#{user?.id}</Text>
          <Text style={styles.idHint}>
            Compartí este número con otros coleccionistas para recibir cintas dubbeadas.
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          <Text style={styles.rolesLabel}>Roles activos:</Text>
          <View style={styles.rolesList}>
            {(user?.roles || []).map((r) => (
              <View key={r} style={styles.roleBadge}>
                <Text style={styles.roleText}>{r.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Pressable
        style={styles.refreshBtn}
        onPress={async () => {
          await refreshUser();
          Alert.alert('Sesión sincronizada', 'Datos del perfil actualizados desde el servidor.');
        }}
      >
        <Text style={styles.refreshBtnText}>↻ Sincronizar Permisos / Datos</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginBottom: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  avatarText: { color: colors.background, fontSize: 32, fontWeight: '900' },
  name: { color: colors.text, fontSize: 20, fontWeight: '800' },
  username: { color: colors.accent, fontSize: 13, marginTop: 2, fontWeight: '600' },
  email: { color: colors.muted, marginTop: 4, fontSize: 13 },
  idBox: {
    backgroundColor: '#111115',
    width: '100%',
    padding: 14,
    borderRadius: 10,
    marginTop: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  idLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  idValue: { color: colors.accent, fontSize: 22, fontWeight: '900', marginVertical: 4 },
  idHint: { color: colors.muted, fontSize: 11, textAlign: 'center', lineHeight: 15 },
  rolesContainer: { width: '100%', marginTop: 16 },
  rolesLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  rolesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  roleBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.accent
  },
  roleText: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  refreshBtn: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18
  },
  refreshBtnText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  logoutButton: {
    marginTop: 14,
    backgroundColor: '#38161c',
    borderWidth: 1,
    borderColor: colors.danger,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  logoutButtonText: { color: colors.danger, fontWeight: '800', fontSize: 14 }
});
