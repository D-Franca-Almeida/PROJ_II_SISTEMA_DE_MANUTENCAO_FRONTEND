import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { INFO_STATUS, STATUS, TOM, rotuloStatus } from '../../../shared/src/index.js';
import { api } from '../api';
import { cores, medidas } from '../tema';
import { formatarDataHora } from '../formato';
import { useRecurso } from '../useRecurso';

function corDoPonto(status) {
  if (status === STATUS.DEVOLVIDA) return cores.aviso;
  const tom = INFO_STATUS[status]?.tom;
  if (tom === TOM.FIM_NEGATIVO) return cores.erro;
  if (tom === TOM.FIM_POSITIVO) return cores.sucesso;
  if (tom === TOM.DECISAO) return cores.info;
  return cores.textoSecundario;
}

/** CPTM-89 — linha do tempo da SSL (status, data, quem, observação), em ordem cronológica. */
export default function LinhaDoTempo({ solicitacaoId }) {
  const carregar = useCallback(() => api.listarHistorico(solicitacaoId), [solicitacaoId]);
  const { dados: eventos, carregando, erro } = useRecurso(carregar);

  // 403: técnico olhando uma SSL da fila (ainda não é o técnico da OSM) — só não mostra
  if (erro?.status === 403) return null;

  return (
    <View style={styles.secao}>
      <Text style={styles.titulo} accessibilityRole="header">Linha do tempo</Text>
      {carregando ? <ActivityIndicator color={cores.primaria} /> : null}
      {erro && !eventos ? <Text style={styles.erro}>Não foi possível carregar o histórico: {erro.mensagem}</Text> : null}
      {eventos && !eventos.length ? <Text style={styles.vazio}>Sem registros.</Text> : null}

      <View style={styles.lista}>
        {(eventos ?? []).map((ev, i) => {
          const ultimo = i === eventos.length - 1;
          return (
            <View
              key={`${ev.status}-${ev.data}-${i}`}
              style={styles.evento}
              accessible
              accessibilityLabel={[
                rotuloStatus(ev.status),
                formatarDataHora(ev.data),
                ev.usuario ? `por ${ev.usuario}` : null,
                ev.observacao,
              ]
                .filter(Boolean)
                .join(', ')}
            >
              <View style={styles.trilho}>
                <View style={[styles.ponto, { backgroundColor: corDoPonto(ev.status) }, ultimo && styles.pontoAtual]} />
                {!ultimo ? <View style={styles.linha} /> : null}
              </View>
              <View style={styles.corpo}>
                <Text style={[styles.status, ultimo && styles.statusAtual]}>{rotuloStatus(ev.status)}</Text>
                <Text style={styles.meta}>
                  {formatarDataHora(ev.data)}
                  {ev.usuario ? ` · ${ev.usuario}` : ''}
                </Text>
                {ev.observacao ? <Text style={styles.observacao}>{ev.observacao}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { marginTop: medidas.espaco + 4, gap: 10 },
  titulo: { fontSize: 18, fontWeight: '800', color: cores.texto },
  lista: { backgroundColor: cores.superficie, borderRadius: medidas.raio, paddingHorizontal: 14, paddingTop: 14 },
  evento: { flexDirection: 'row', gap: 12 },
  trilho: { alignItems: 'center', width: 16 },
  ponto: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  pontoAtual: { width: 16, height: 16, borderRadius: 8, marginTop: 2 },
  linha: { flex: 1, width: 2, backgroundColor: '#D4D4D8', marginVertical: 2 },
  corpo: { flex: 1, paddingBottom: 14 },
  status: { fontSize: 16, fontWeight: '700', color: cores.texto },
  statusAtual: { fontWeight: '900' },
  meta: { fontSize: 14, color: cores.textoSecundario },
  observacao: { fontSize: 15, color: cores.texto, marginTop: 2 },
  vazio: { fontSize: 15, color: cores.textoSecundario },
  erro: { fontSize: 14, color: cores.erro },
});
