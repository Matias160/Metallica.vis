// Perfil del miembro, sincronización de permisos y selector de apariencia de estudio.
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useTheme } from '../../context/ThemeContext';
import { colors, shadows } from '../../theme/colors';

export default function ProfileScreen() {
  const { user, refreshUser, logout } = useAuth();
  const { notify } = useFeedback();
  const { isDark, palette, toggleTheme } = useTheme();

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
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.display_name || user?.username || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.avatarDot} />
            </View>

            <View style={styles.userMainInfo}>
              <Text style={[styles.name, { color: palette.text }]}>{user?.display_name}</Text>
              <Text style={styles.username}>@{user?.username}</Text>
              <Text style={[styles.email, { color: palette.muted }]}>{user?.email}</Text>
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
            onPress={logout}
          >
            <Text style={styles.logoutButtonText}>CERRAR SESIÓN</Text>
          </Pressable>
        </View>
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
  }
});
