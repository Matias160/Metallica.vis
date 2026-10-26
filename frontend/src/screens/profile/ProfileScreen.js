import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, shadows } from '../../theme/colors';

export default function ProfileScreen() {
  const { user, refreshUser, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Mi Perfil</Text>
        <Text style={styles.subtitle}>Credencial de miembro y ficha técnica de colección.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de Identidad Tape Trading */}
        <View style={[styles.card, shadows.sm]}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.display_name || user?.username || 'U')[0].toUpperCase()}
              </Text>
            </View>

            <View style={styles.userMainInfo}>
              <Text style={styles.name}>{user?.display_name}</Text>
              <Text style={styles.username}>@{user?.username}</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
          </View>

          {/* Caja con ID para Dubbeo */}
          <View style={styles.idBox}>
            <Text style={styles.idLabel}>TU IDENTIFICADOR ÚNICO DE DUBBEO</Text>
            <Text style={styles.idValue}>#{user?.id}</Text>
            <Text style={styles.idHint}>
              Compartí este número con otros coleccionistas para que puedan grabarte y transferirte copias de sus cintas.
            </Text>
          </View>

          {/* Roles Activos */}
          <View style={styles.rolesContainer}>
            <Text style={styles.rolesLabel}>PERMISOS Y ROLES ACTIVOS</Text>
            <View style={styles.rolesList}>
              {(user?.roles || []).map((r) => (
                <View key={r} style={styles.roleBadge}>
                  <Text style={styles.roleText}>{r.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Acciones */}
        <Pressable
          style={({ pressed }) => [
            styles.refreshBtn,
            pressed && { backgroundColor: colors.surfaceHover }
          ]}
          onPress={async () => {
            await refreshUser();
            Alert.alert('Sesión sincronizada', 'Datos del perfil y roles actualizados desde la base de datos.');
          }}
        >
          <Text style={styles.refreshBtnText}>↻ SINCRONIZAR PERMISOS CON EL SERVIDOR</Text>
        </Pressable>

        <Pressable 
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && { backgroundColor: '#4a1921' }
          ]} 
          onPress={logout}
        >
          <Text style={styles.logoutButtonText}>CERRAR SESIÓN</Text>
        </Pressable>
      </ScrollView>
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.backgroundElevated
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3
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
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: colors.background,
    fontSize: 28,
    fontWeight: '900'
  },
  userMainInfo: {
    flex: 1
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800'
  },
  username: {
    color: colors.accent,
    fontSize: 13,
    marginTop: 2,
    fontWeight: '700'
  },
  email: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  idBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 10,
    padding: 16,
    marginTop: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle
  },
  idLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  idValue: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 4
  },
  idHint: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4
  },
  rolesContainer: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle
  },
  rolesLabel: {
    color: colors.muted,
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
  roleBadge: {
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  roleText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  refreshBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14
  },
  refreshBtnText: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.8
  },
  logoutButton: {
    marginTop: 10,
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
  }
});
