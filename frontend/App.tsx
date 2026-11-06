// Punto de entrada: combina navegación, sesión, tema, capas 3D y mensajes no intrusivos en TypeScript.
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { FeedbackProvider } from './src/context/FeedbackContext';
import { SyncProvider } from './src/context/SyncContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthStack, MainStack } from './src/navigation/AppNavigator';

// Inyección de estilos 3D y texturas analógicas en Web
if (Platform.OS === 'web') {
  try {
    require('./src/theme/metallica-vis.css');
    require('./src/theme/metallica-vis-3d.css');
  } catch (e) {
    // Fallback silencioso si el entorno es nativo
  }
}

function ThemedApp(): React.JSX.Element {
  const { isDark, palette } = useTheme();
  return (
    <View style={[styles.outerContainer, { backgroundColor: palette.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.innerContainer, { backgroundColor: palette.background }]}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </View>
    </View>
  );
}

function RootNavigator(): React.JSX.Element | null {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <MainStack /> : <AuthStack />;
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SyncProvider>
          <FeedbackProvider>
            <AuthProvider>
              <ThemedApp />
            </AuthProvider>
          </FeedbackProvider>
        </SyncProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%'
  },
  innerContainer: {
    flex: 1,
    width: '100%'
  }
});
