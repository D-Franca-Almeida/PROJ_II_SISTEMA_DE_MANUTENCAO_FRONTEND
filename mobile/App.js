import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import Rotas from './src/navegacao/Rotas';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Rotas />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
