import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AuthStack, MainStack } from './src/navigation/AppNavigator';

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <MainStack /> : <AuthStack />;
}

export default function App() {
  return <AuthProvider><NavigationContainer><RootNavigator /></NavigationContainer></AuthProvider>;
}
