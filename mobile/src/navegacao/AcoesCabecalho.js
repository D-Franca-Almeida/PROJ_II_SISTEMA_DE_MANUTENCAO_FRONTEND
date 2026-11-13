import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';

/** Ações à direita do cabeçalho: matrícula logada e "Sair". */
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
  botao: { minHeight: 44, minWidth: 44, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
  texto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  pressionado: { opacity: 0.6 },
});
