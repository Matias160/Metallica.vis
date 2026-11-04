// Punto de entrada: combina navegación, sesión, tema, capas 3D y mensajes no intrusivos.
import { Platform, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { FeedbackProvider } from './src/context/FeedbackContext';
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

function ThemedApp() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <MainStack /> : <AuthStack />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FeedbackProvider>
          <AuthProvider>
            <ThemedApp />
          </AuthProvider>
        </FeedbackProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
