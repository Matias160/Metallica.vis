// Define la navegación pública y privada con soporte para Modo Museo, Estudio y Admin en TypeScript.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import CollectionScreen from '../screens/collection/CollectionScreen';
import MuseumScreen from '../screens/museum/MuseumScreen';
import ArtistScreen from '../screens/artist/ArtistScreen';
import AdminScreen from '../screens/admin/AdminScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

export function AuthStack(): React.JSX.Element {
  return (
    <Stack.Navigator id="auth-stack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

interface TabIconProps {
  symbol: string;
  focused: boolean;
  color: string;
}

function TabIcon({ symbol, focused, color }: TabIconProps): React.JSX.Element {
  return (
    <View style={navStyles.iconWrap}>
      <Text style={[navStyles.iconSymbol, { color: focused ? color : '#64748b' }]}>
        {symbol}
      </Text>
      {focused && <View style={[navStyles.activeDot, { backgroundColor: color }]} />}
    </View>
  );
}

export function MainStack(): React.JSX.Element {
  const { user } = useAuth();
  const { palette } = useTheme();
  const roles = user?.roles || [];
  const isArtist = roles.includes('artist') || roles.includes('admin');
  const isAdmin = roles.includes('admin');

  return (
    <Tabs.Navigator
      id="main-tabs"
      screenOptions={{
        headerShown: false, // Desactivar header nativo redundante: cada pantalla tiene su top bar de estudio
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '800',
          letterSpacing: 0.2,
          marginTop: -2
        },
        tabBarItemStyle: {
          paddingHorizontal: 1
        },
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopWidth: 1,
          borderTopColor: palette.border,
          minHeight: 58,
          paddingBottom: 6,
          paddingTop: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 12
        },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.mutedDark
      }}
    >
      <Tabs.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Catálogo',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon symbol="✦" focused={focused} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="Colección"
        component={CollectionScreen}
        options={{
          tabBarLabel: 'Cintas',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon symbol="📼" focused={focused} color={color} />
          )
        }}
      />
      {/* Tab Modo Museo: exhibición pública, másters históricos y certificados */}
      <Tabs.Screen
        name="Museo"
        component={MuseumScreen}
        options={{
          tabBarLabel: 'Museo',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon symbol="🏛️" focused={focused} color={color} />
          )
        }}
      />

      {/* Tab exclusivo para Artistas y Admin: ABML de Pistas, Subida y Tiradas */}
      {isArtist && (
        <Tabs.Screen
          name="Estudio"
          component={ArtistScreen}
          options={{
            tabBarLabel: 'Estudio',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon symbol="🎚" focused={focused} color={color} />
            )
          }}
        />
      )}

      {/* Tab exclusivo para Administradores: Auditoría y Verificación */}
      {isAdmin && (
        <Tabs.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            tabBarLabel: 'Admin',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon symbol="⚙" focused={focused} color={color} />
            )
          }}
        />
      )}

      <Tabs.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon symbol="●" focused={focused} color={color} />
          )
        }}
      />
    </Tabs.Navigator>
  );
}

const navStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 24
  },
  iconSymbol: {
    fontSize: 16,
    fontWeight: '900'
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2
  }
});
