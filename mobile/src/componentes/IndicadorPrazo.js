import { StyleSheet, Text } from 'react-native';
import { indicadorPrazo } from '../../../shared/src/index.js';
import { cores } from '../tema';

/** CPTM-67 — "Expira em N dias" (vermelho com N ≤ 2). */
export default function IndicadorPrazo({ solicitacao }) {
  const prazo = indicadorPrazo(solicitacao);
  if (!prazo) return null;
  return (
    <Text
      style={[styles.prazo, prazo.critico ? styles.critico : styles.normal]}
      accessibilityLabel={prazo.critico ? `Atenção: ${prazo.texto}` : prazo.texto}
    >
      {prazo.critico ? '⚠ ' : '⏱ '}
      {prazo.texto}
    </Text>
  );
}

const styles = StyleSheet.create({
  prazo: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 6,
  },
  normal: { color: cores.textoSecundario, backgroundColor: cores.neutroFundo },
  critico: { color: '#FFFFFF', backgroundColor: cores.erro },
});
