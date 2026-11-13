import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { PERFIL } from '../../../shared/src/index.js';
import { useAuth } from '../auth/AuthContext';
import { cores } from '../tema';
import { Carregando, ErroTela } from '../componentes/Estados';
import AcoesCabecalho from './AcoesCabecalho';
import Login from '../telas/Login';
import NovaSolicitacao from '../telas/NovaSolicitacao';
import MinhasSolicitacoes from '../telas/MinhasSolicitacoes';
import DetalheSolicitacao from '../telas/DetalheSolicitacao';
import CorrigirSolicitacao from '../telas/CorrigirSolicitacao';
import HomeTecnico from '../telas/HomeTecnico';
import DetalheOsm from '../telas/DetalheOsm';
import EncerrarOsm from '../telas/EncerrarOsm';

const Stack = createNativeStackNavigator();
const Abas = createBottomTabNavigator();

const tema = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: cores.primaria, background: cores.fundo },
};

/** Cabeçalho vermelho CPTM com notificações/sair à direita. */
const opcoesCabecalho = {
  headerStyle: { backgroundColor: cores.primaria },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '800' },
  headerRight: () => <AcoesCabecalho />,
};

const iconeAba = (simbolo) => ({ color }) => (
  <Text style={{ fontSize: 22, color }} importantForAccessibility="no">{simbolo}</Text>
);

/** Abas do Usuário Comum. */
function AbasComum() {
  return (
    <Abas.Navigator
      screenOptions={{
        ...opcoesCabecalho,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
      }}
    >
      <Abas.Screen
        name="MinhasSolicitacoes"
        component={MinhasSolicitacoes}
        options={{ title: 'Minhas solicitações', tabBarIcon: iconeAba('☰') }}
      />
      <Abas.Screen
        name="NovaSolicitacao"
        component={NovaSolicitacao}
        options={{ title: 'Nova solicitação', tabBarIcon: iconeAba('＋') }}
      />
    </Abas.Navigator>
  );
}

/**
 * CPTM-57 — guarda de rotas: sem token só existe o Login; com token, cada
 * perfil só tem registradas as telas das próprias ações.
 */
export default function Rotas() {
  const { iniciando, sessao, sair } = useAuth();

  if (iniciando) return <Carregando texto="Abrindo…" />;

  return (
    <NavigationContainer theme={tema}>
      <StatusBar style="light" backgroundColor={cores.primaria} />
      <Stack.Navigator screenOptions={opcoesCabecalho}>
        {!sessao ? (
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        ) : sessao.perfil === PERFIL.COMUM ? (
          <Stack.Group>
            <Stack.Screen name="InicioComum" component={AbasComum} options={{ headerShown: false }} />
            <Stack.Screen
              name="DetalheSolicitacao"
              component={DetalheSolicitacao}
              options={{ title: 'Solicitação' }}
            />
            <Stack.Screen
              name="CorrigirSolicitacao"
              component={CorrigirSolicitacao}
              options={{ title: 'Corrigir e reenviar' }}
            />
          </Stack.Group>
        ) : sessao.perfil === PERFIL.TECNICO ? (
          <Stack.Group>
            <Stack.Screen name="HomeTecnico" component={HomeTecnico} options={{ title: 'Manutenções' }} />
            <Stack.Screen name="DetalheOsm" component={DetalheOsm} options={{ title: 'Manutenção' }} />
            <Stack.Screen name="EncerrarOsm" component={EncerrarOsm} options={{ title: 'Encerrar OSM' }} />
          </Stack.Group>
        ) : (
          <Stack.Screen name="SemAcesso" options={{ title: 'CPTM SSL' }}>
            {() => (
              <ErroTela
                titulo="Sem acesso ao app"
                mensagem="Seu perfil não usa o app mobile."
                aoTentarDeNovo={sair}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
