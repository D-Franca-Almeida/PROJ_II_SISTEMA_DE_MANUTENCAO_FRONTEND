import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STATUS, rotuloStatus } from '../../../shared/src/index.js';
import { cores, medidas } from '../tema';
import { formatarData, textoEquipamento, textoLocalidade } from '../formato';
import SeloStatus from './SeloStatus';

/**
 * Item de lista de SSL. `rodape` permite cada tela acrescentar informação
 * (ex.: prazo de expiração, técnico).
 */
export default function CartaoSolicitacao({ solicitacao: s, onPress, rodape }) {
  const devolvida = s.status === STATUS.DEVOLVIDA;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${s.numero}, ${rotuloStatus(s.status)}, ${textoEquipamento(s.equipamento)}`}
      accessibilityHint="Abre o detalhe da solicitação"
      style={({ pressed }) => [styles.cartao, devolvida && styles.devolvida, pressed && styles.pressionado]}
    >
      <View style={styles.topo}>
        <Text style={styles.numero}>{s.numero}</Text>
        <SeloStatus status={s.status} />
      </View>
      <Text style={styles.equipamento} numberOfLines={1}>{textoEquipamento(s.equipamento)}</Text>
      <Text style={styles.detalhe} numberOfLines={1}>{textoLocalidade(s.localidade)}</Text>
      <Text style={styles.detalhe}>Aberta em {formatarData(s.dataAbertura)}</Text>
      {devolvida ? (
        <Text style={styles.chamada}>Devolvida para correção — toque para ver o motivo</Text>
      ) : null}
      {rodape}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: medidas.raio,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    gap: 3,
  },
  devolvida: { borderColor: cores.aviso, borderWidth: 2, borderLeftWidth: 8 },
  pressionado: { opacity: 0.8 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 },
  numero: { fontSize: 16, fontWeight: '800', color: cores.texto, flexShrink: 1 },
  equipamento: { fontSize: 16, fontWeight: '600', color: cores.texto },
  detalhe: { fontSize: 14, color: cores.textoSecundario },
  chamada: { fontSize: 14, fontWeight: '700', color: cores.aviso, marginTop: 4 },
});
