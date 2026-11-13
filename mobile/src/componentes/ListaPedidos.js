import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import {
  ROTULO_STATUS_PEDIDO,
  STATUS_PEDIDO,
  mensagemDeErro,
  podeCancelarPedido,
} from '../../../shared/src/index.js';
import { api } from '../api';
import { cores, medidas } from '../tema';
import { formatarData } from '../formato';
import { useRecurso } from '../useRecurso';
import Botao from './Botao';

const COR_PEDIDO = {
  [STATUS_PEDIDO.SOLICITADO]: { fundo: cores.neutroFundo, texto: cores.texto },
  [STATUS_PEDIDO.ENCAMINHADO]: { fundo: cores.infoFundo, texto: cores.info },
  [STATUS_PEDIDO.RECEBIDO]: { fundo: cores.sucessoFundo, texto: cores.sucesso },
  [STATUS_PEDIDO.CANCELADO]: { fundo: cores.erroFundo, texto: cores.erro },
};

/** Etapas do ciclo para mostrar o progresso do pedido. */
const CICLO = [STATUS_PEDIDO.SOLICITADO, STATUS_PEDIDO.ENCAMINHADO, STATUS_PEDIDO.RECEBIDO];

function Ciclo({ status }) {
  if (status === STATUS_PEDIDO.CANCELADO) return null;
  const atual = CICLO.indexOf(status);
  return (
    <Text style={styles.ciclo} accessibilityLabel={`Etapa ${atual + 1} de ${CICLO.length}`}>
      {CICLO.map((etapa, i) => `${i <= atual ? '●' : '○'} ${ROTULO_STATUS_PEDIDO[etapa]}`).join('  →  ')}
    </Text>
  );
}

/**
 * CPTM-76 — pedidos de peça da OSM com status e "Cancelar pedido".
 * @param {{ osmId: number, podeAlterar: boolean }} props  podeAlterar = técnico dono com OSM aberta
 */
export default function ListaPedidos({ osmId, podeAlterar }) {
  const carregar = useCallback(() => api.listarPedidosPeca(osmId), [osmId]);
  const { dados: pedidos, setDados, carregando, erro, recarregar } = useRecurso(carregar);
  const [cancelando, setCancelando] = useState(null);

  function confirmarCancelamento(p) {
    Alert.alert('Cancelar pedido', `Cancelar o pedido de ${p.quantidade}× ${p.item}?`, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar pedido', style: 'destructive', onPress: () => cancelar(p) },
    ]);
  }

  async function cancelar(p) {
    setCancelando(p.id);
    try {
      await api.cancelarPedidoPeca(osmId, p.id);
      setDados((lista) => lista.map((x) => (x.id === p.id ? { ...x, status: STATUS_PEDIDO.CANCELADO } : x)));
    } catch (e) {
      Alert.alert('Não foi possível cancelar', mensagemDeErro(e));
      recarregar();
    } finally {
      setCancelando(null);
    }
  }

  return (
    <View style={styles.secao}>
      <Text style={styles.titulo} accessibilityRole="header">Pedidos de peça</Text>
      {carregando ? <ActivityIndicator color={cores.primaria} /> : null}
      {erro && !pedidos ? (
        <Text style={styles.erro}>Não foi possível carregar os pedidos: {erro.mensagem}</Text>
      ) : null}
      {pedidos && !pedidos.length ? <Text style={styles.vazio}>Nenhuma peça pedida nesta OSM.</Text> : null}

      {(pedidos ?? []).map((p) => {
        const cor = COR_PEDIDO[p.status] ?? COR_PEDIDO[STATUS_PEDIDO.SOLICITADO];
        return (
          <View key={p.id} style={styles.pedido}>
            <View style={styles.topo}>
              <Text style={styles.item}>
                {p.quantidade}× {p.item}
              </Text>
              <Text style={[styles.selo, { backgroundColor: cor.fundo, color: cor.texto }]}>
                {(ROTULO_STATUS_PEDIDO[p.status] ?? p.status).toUpperCase()}
              </Text>
            </View>
            <Ciclo status={p.status} />
            {p.justificativa ? <Text style={styles.detalhe}>{p.justificativa}</Text> : null}
            <Text style={styles.detalhe}>Pedido em {formatarData(p.dataPedido)}</Text>
            {podeAlterar && podeCancelarPedido(p.status) ? (
              <Botao
                texto="Cancelar pedido"
                variante="perigo"
                onPress={() => confirmarCancelamento(p)}
                carregando={cancelando === p.id}
                estilo={styles.botao}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { marginTop: medidas.espaco, gap: 10 },
  titulo: { fontSize: 18, fontWeight: '800', color: cores.texto },
  pedido: { backgroundColor: cores.superficie, borderRadius: medidas.raio, padding: 12, gap: 4 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  item: { fontSize: 16, fontWeight: '700', color: cores.texto, flexShrink: 1 },
  selo: {
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  ciclo: { fontSize: 13, color: cores.textoSecundario },
  detalhe: { fontSize: 14, color: cores.textoSecundario },
  botao: { marginTop: 6 },
  vazio: { fontSize: 15, color: cores.textoSecundario },
  erro: { fontSize: 14, color: cores.erro },
});
