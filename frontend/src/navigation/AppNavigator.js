import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import CollectionScreen from '../screens/collection/CollectionScreen';
import ArtistScreen from '../screens/artist/ArtistScreen';
import AdminScreen from '../screens/admin/AdminScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export function MainStack() {
  const { user } = useAuth();
  const roles = user?.roles || [];
  const isArtist = roles.includes('artist') || roles.includes('admin');
  const isAdmin = roles.includes('admin');

  return (
    <Tabs.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#111113' },
        headerTintColor: '#fff',
        tabBarStyle: { 
          backgroundColor: '#111113', 
          borderTopColor: '#222228',
          paddingBottom: 4,
          paddingTop: 4
        },
        tabBarActiveTintColor: '#d8ff3e',
        tabBarInactiveTintColor: '#888894'
      }}
    >
      <Tabs.Screen 
        name="Inicio" 
        component={HomeScreen} 
        options={{ title: 'Catálogo' }} 
      />
      <Tabs.Screen 
        name="Colección" 
        component={CollectionScreen} 
        options={{ title: 'Mi Colección' }} 
      />

      {/* Tab exclusivo para Artistas y Admin: ABML de Pistas y Tiradas */}
      {isArtist && (
        <Tabs.Screen 
          name="Estudio" 
          component={ArtistScreen} 
          options={{ title: 'Estudio Artista' }} 
        />
      )}

      {/* Tab exclusivo para Administradores: Auditoría y Verificación */}
      {isAdmin && (
        <Tabs.Screen 
          name="Admin" 
          component={AdminScreen} 
          options={{ title: 'Panel Admin' }} 
        />
      )}

      <Tabs.Screen 
        name="Perfil" 
        component={ProfileScreen} 
        options={{ title: 'Mi Perfil' }} 
      />
    </Tabs.Navigator>
  );
}
