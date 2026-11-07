// Define la navegación pública y privada con soporte para Modo Museo, Estudio y Admin en TypeScript.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Platform, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Disc3,
  Archive,
  Award,
  Sliders,
  Shield,
  User
} from '../components/ui/Icons';

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
  name: 'disc' | 'archive' | 'award' | 'sliders' | 'shield' | 'user';
  focused: boolean;
  color: string;
}

function TabIcon({ name, focused, color }: TabIconProps): React.JSX.Element {
  const iconSize = 20;
  const renderIcon = () => {
    switch (name) {
      case 'disc':
        return <Disc3 size={iconSize} color={color} />;
      case 'archive':
        return <Archive size={iconSize} color={color} />;
      case 'award':
        return <Award size={iconSize} color={color} />;
      case 'sliders':
        return <Sliders size={iconSize} color={color} />;
      case 'shield':
        return <Shield size={iconSize} color={color} />;
      case 'user':
        return <User size={iconSize} color={color} />;
    }
  };

  return (
    <View style={navStyles.iconWrap}>
      {renderIcon()}
      {focused && <View style={[navStyles.activeDot, { backgroundColor: color }]} />}
    </View>
  );
}

export function MainStack(): React.JSX.Element {
  const { user } = useAuth();
  const { palette, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const roles = user?.roles || [];
  const isArtist = roles.includes('artist') || roles.includes('admin');
  const isAdmin = roles.includes('admin');

  return (
    <Tabs.Navigator
      id="main-tabs"
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginBottom: 4
        },
        tabBarItemStyle: {
          paddingVertical: 4
        },
        tabBarStyle: [
          styles.tabBarBase,
          {
            backgroundColor: palette.surface,
            borderTopColor: palette.borderSubtle
          },
          isDesktop && {
            width: Math.min(width - 40, 720),
            left: (width - Math.min(width - 40, 720)) / 2,
            bottom: 16,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.5,
            shadowRadius: 16,
            elevation: 16
          }
        ],
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.muted
      }}
    >
      <Tabs.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Catálogo',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="disc" focused={focused} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="Colección"
        component={CollectionScreen}
        options={{
          tabBarLabel: 'Cintas',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="archive" focused={focused} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="Museo"
        component={MuseumScreen}
        options={{
          tabBarLabel: 'Museo',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="award" focused={focused} color={color} />
          )
        }}
      />

      {isArtist && (
        <Tabs.Screen
          name="Estudio"
          component={ArtistScreen}
          options={{
            tabBarLabel: 'Estudio',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="sliders" focused={focused} color={color} />
            )
          }}
        />
      )}

      {isAdmin && (
        <Tabs.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            tabBarLabel: 'Admin',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="shield" focused={focused} color={color} />
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
            <TabIcon name="user" focused={focused} color={color} />
          )
        }}
      />
    </Tabs.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarBase: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopWidth: 1
  }
});

const navStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    position: 'relative'
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2
  }
});
