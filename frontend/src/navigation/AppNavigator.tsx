// Define la navegación pública y privada con soporte para Modo Museo, Estudio y Admin en TypeScript.
import React, { useRef, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Animated, Platform } from 'react-native';
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
import { themeTokens } from '../theme/theme';
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
  palette: any;
}

function TabIcon({ name, focused, color, palette }: TabIconProps): React.JSX.Element {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.05 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.08 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 200
    }).start();
  }, [focused]);

  const renderIcon = () => {
    const iconSize = 19;
    const iconColor = focused ? palette.accent : palette.muted;
    switch (name) {
      case 'disc':
        return <Disc3 size={iconSize} color={iconColor} />;
      case 'archive':
        return <Archive size={iconSize} color={iconColor} />;
      case 'award':
        return <Award size={iconSize} color={iconColor} />;
      case 'sliders':
        return <Sliders size={iconSize} color={iconColor} />;
      case 'shield':
        return <Shield size={iconSize} color={iconColor} />;
      case 'user':
        return <User size={iconSize} color={iconColor} />;
    }
  };

  return (
    <Animated.View style={[navStyles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
      <View
        style={[
          navStyles.pillContainer,
          focused && {
            backgroundColor: palette.amberMuted || 'rgba(245, 158, 11, 0.16)',
            borderColor: palette.amberBorder || 'rgba(245, 158, 11, 0.45)',
            borderWidth: 1
          },
          focused && themeTokens.shadows.amberGlow
        ]}
      >
        {renderIcon()}
      </View>
    </Animated.View>
  );
}

export function MainStack(): React.JSX.Element {
  const { user } = useAuth();
  const { palette, isDark } = useTheme();
  const roles = user?.roles || [];
  const isArtist = roles.includes('artist') || roles.includes('admin');
  const isAdmin = roles.includes('admin');

  return (
    <Tabs.Navigator
      id="main-tabs"
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 9.5,
          fontWeight: '800',
          letterSpacing: 0.3,
          marginTop: 2
        },
        tabBarItemStyle: {
          paddingHorizontal: 2
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: Platform.select({
            ios: 'transparent',
            android: palette.surface,
            default: palette.surface
          }),
          borderTopWidth: 1,
          borderTopColor: palette.borderSubtle,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.4,
          shadowRadius: 12
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={45}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: isDark ? 'rgba(17, 23, 38, 0.95)' : 'rgba(255, 255, 255, 0.96)' }
              ]}
            />
          ),
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
            <TabIcon name="disc" focused={focused} color={color} palette={palette} />
          )
        }}
      />
      <Tabs.Screen
        name="Colección"
        component={CollectionScreen}
        options={{
          tabBarLabel: 'Cintas',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="archive" focused={focused} color={color} palette={palette} />
          )
        }}
      />
      <Tabs.Screen
        name="Museo"
        component={MuseumScreen}
        options={{
          tabBarLabel: 'Museo',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="award" focused={focused} color={color} palette={palette} />
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
              <TabIcon name="sliders" focused={focused} color={color} palette={palette} />
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
              <TabIcon name="shield" focused={focused} color={color} palette={palette} />
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
            <TabIcon name="user" focused={focused} color={color} palette={palette} />
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
    width: 44,
    height: 32
  },
  pillContainer: {
    paddingHorizontal: 12,
    paddingVertical: 3.5,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
