import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { cores, medidas } from '../tema';
import Botao from './Botao';

/** Tela inteira carregando. */
export function Carregando({ texto = 'Carregando…' }) {
  return (
    <View style={styles.centro} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={cores.primaria} />
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

/** Tela inteira com erro e "Tentar novamente". */
export function ErroTela({ mensagem, aoTentarDeNovo, titulo }) {
  return (
    <View style={styles.centro} accessibilityLiveRegion="assertive">
      {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}
      <Text style={styles.texto}>{mensagem}</Text>
      {aoTentarDeNovo ? <Botao texto="Tentar novamente" onPress={aoTentarDeNovo} estilo={styles.botao} /> : null}
    </View>
  );
}

/** Caixa de erro dentro de formulários (400/403 da API). */
export function AlertaErro({ mensagem }) {
  if (!mensagem) return null;
  return (
    <View style={styles.alerta} accessibilityLiveRegion="assertive" accessibilityRole="alert">
      <Text style={styles.textoAlerta}>{mensagem}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  titulo: { fontSize: 20, fontWeight: '800', color: cores.texto, textAlign: 'center' },
  texto: { fontSize: 16, color: cores.texto, textAlign: 'center' },
  botao: { alignSelf: 'stretch' },
  alerta: {
    backgroundColor: cores.erroFundo,
    borderLeftWidth: 4,
    borderLeftColor: cores.erro,
    padding: 12,
    borderRadius: 6,
    marginBottom: medidas.espaco,
  },
  textoAlerta: { color: cores.erro, fontSize: 15 },
});
