import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { cores } from '../tema';

/** Placeholder — a lista entra na CPTM-61. */
export default function MinhasSolicitacoes() {
  const { sessao } = useAuth();
  return (
    <View style={styles.centro}>
      <Text style={styles.titulo}>Olá, {sessao?.matricula}</Text>
      <Text style={styles.texto}>Suas solicitações aparecerão aqui.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  titulo: { fontSize: 22, fontWeight: '800', color: cores.texto },
  texto: { fontSize: 16, color: cores.textoSecundario, textAlign: 'center' },
});
