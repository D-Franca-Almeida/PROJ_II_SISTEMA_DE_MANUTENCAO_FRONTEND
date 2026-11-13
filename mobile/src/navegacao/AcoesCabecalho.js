import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { useNotificacoes } from '../notificacoes/NotificacoesContext';
import { cores } from '../tema';

/** CPTM-86 — sino com contador de não lidas. */
function Sino() {
  const navigation = useNavigation();
  const { naoLidas } = useNotificacoes();
  const texto = naoLidas > 99 ? '99+' : String(naoLidas);
  return (
    <Pressable
      onPress={() => navigation.navigate('Notificacoes')}
      accessibilityRole="button"
      accessibilityLabel={
        naoLidas ? `Notificações, ${naoLidas} não ${naoLidas === 1 ? 'lida' : 'lidas'}` : 'Notificações'
      }
      hitSlop={8}
      style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
    >
      <Text style={styles.icone} importantForAccessibility="no">🔔</Text>
      {naoLidas ? (
        <View style={styles.contador} importantForAccessibility="no-hide-descendants">
          <Text style={styles.textoContador}>{texto}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Ações à direita do cabeçalho: sino de notificações e "Sair". */
export default function AcoesCabecalho() {
  const { sessao, sair } = useAuth();

  function confirmarSaida() {
    Alert.alert('Sair', 'Deseja sair do app?', [
      { text: 'Ficar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: sair },
    ]);
  }

  return (
    <View style={styles.linha}>
      <Sino />
      <Pressable
        onPress={confirmarSaida}
        accessibilityRole="button"
        accessibilityLabel={`Sair da conta ${sessao?.matricula ?? ''}`}
        hitSlop={8}
        style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
      >
        <Text style={styles.texto}>Sair</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  botao: { minHeight: 44, minWidth: 44, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
  texto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  icone: { fontSize: 22 },
  contador: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoContador: { color: cores.primariaEscura, fontSize: 12, fontWeight: '900' },
  pressionado: { opacity: 0.6 },
});
