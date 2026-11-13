import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import { NotificacoesProvider } from './src/notificacoes/NotificacoesContext';
import Rotas from './src/navegacao/Rotas';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificacoesProvider>
          <Rotas />
        </NotificacoesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
