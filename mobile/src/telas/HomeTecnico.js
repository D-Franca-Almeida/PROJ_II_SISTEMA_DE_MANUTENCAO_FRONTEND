import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { cores } from '../tema';

/** Placeholder — a fila e "Minhas manutenções" entram na CPTM-37. */
export default function HomeTecnico() {
  const { sessao } = useAuth();
  return (
    <View style={styles.centro}>
      <Text style={styles.titulo}>Olá, {sessao?.matricula}</Text>
      <Text style={styles.texto}>A fila de manutenções aparecerá aqui.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  titulo: { fontSize: 22, fontWeight: '800', color: cores.texto },
  texto: { fontSize: 16, color: cores.textoSecundario, textAlign: 'center' },
});
