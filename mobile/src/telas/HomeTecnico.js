import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { mensagemDeErro } from '../../../shared/src/index.js';
import { api } from '../api';
import { cores, medidas } from '../tema';
import { formatarData } from '../formato';
import { useRecurso } from '../useRecurso';
import { Carregando, ErroTela } from '../componentes/Estados';
import Botao from '../componentes/Botao';
import CartaoSolicitacao from '../componentes/CartaoSolicitacao';

const ABAS = [
  { chave: 'fila', titulo: 'Fila para assumir' },
  { chave: 'minhas', titulo: 'Minhas manutenções' },
];

/**
 * Converte o resultado de um Promise.allSettled no estado de uma aba.
 * @param {PromiseSettledResult<any[]>} r
 * @returns {{ itens: any[], erro: string | null }}
 */
function estadoDaAba(r) {
  return r.status === 'fulfilled'
    ? { itens: r.value ?? [], erro: null }
    : { itens: [], erro: mensagemDeErro(r.reason) };
}

/** CPTM-37 — Home do Técnico: fila (RECEBIDAS) e "Minhas manutenções". */
export default function HomeTecnico({ navigation, route }) {
  const [aba, setAba] = useState('fila');

  // depois de assumir, o detalhe volta pedindo a aba "minhas"
  const abaPedida = route.params?.aba;
  useEffect(() => {
    if (!abaPedida) return;
    setAba(abaPedida);
    navigation.setParams({ aba: undefined }); // permite pedir de novo depois
  }, [abaPedida, navigation]);

  // cada aba carrega de forma independente: se uma lista falhar, a outra continua funcionando.
  // Só quando as duas falham o erro sobe e vira a ErroTela da tela inteira.
  const carregar = useCallback(async () => {
    const [fila, minhas] = await Promise.allSettled([api.listarFilaTecnico(), api.listarMinhasManutencoes()]);
    if (fila.status === 'rejected' && minhas.status === 'rejected') throw fila.reason;
    return { fila: estadoDaAba(fila), minhas: estadoDaAba(minhas) };
  }, []);
  const { dados, carregando, atualizando, erro, recarregar, puxarParaAtualizar } = useRecurso(carregar);

  if (carregando) return <Carregando texto="Carregando manutenções…" />;
  if (erro && !dados) return <ErroTela mensagem={erro.mensagem} aoTentarDeNovo={recarregar} />;

  const erroAba = dados?.[aba]?.erro ?? null;
  const lista = dados?.[aba]?.itens ?? [];

  return (
    <View style={styles.flex}>
      <View style={styles.abas} accessibilityRole="tablist">
        {ABAS.map((a) => {
          const ativa = a.chave === aba;
          const comErro = Boolean(dados?.[a.chave]?.erro);
          const total = dados?.[a.chave]?.itens.length ?? 0;
          return (
            <Pressable
              key={a.chave}
              onPress={() => setAba(a.chave)}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativa }}
              accessibilityLabel={
                comErro ? `${a.titulo}, erro ao carregar` : `${a.titulo}, ${total} ${total === 1 ? 'item' : 'itens'}`
              }
              style={[styles.aba, ativa && styles.abaAtiva]}
            >
              <Text style={[styles.textoAba, ativa && styles.textoAbaAtiva]}>
                {a.titulo} ({comErro ? '!' : total})
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={lista}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={styles.conteudo}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={puxarParaAtualizar} colors={[cores.primaria]} />
        }
        ListHeaderComponent={
          erro ? <Text style={styles.avisoErro}>Não foi possível atualizar: {erro.mensagem}</Text> : null
        }
        renderItem={({ item }) => (
          <CartaoSolicitacao
            solicitacao={item}
            onPress={() => navigation.navigate('DetalheOsm', { id: item.id })}
            rodape={
              item.ordemServico ? (
                <Text style={styles.rodape}>
                  OSM {item.ordemServico.id ?? '—'} · iniciada em {formatarData(item.ordemServico.dataInicio)}
                </Text>
              ) : null
            }
          />
        )}
        ListEmptyComponent={
          erroAba ? (
            <View style={styles.erroAba} accessibilityLiveRegion="assertive">
              <Text style={styles.textoErroAba}>Não foi possível carregar esta lista: {erroAba}</Text>
              <Botao texto="Tentar novamente" onPress={puxarParaAtualizar} carregando={atualizando} />
            </View>
          ) : (
            <Text style={styles.vazio}>
              {aba === 'fila'
                ? 'Nenhuma máquina recebida aguardando técnico.'
                : 'Você ainda não assumiu nenhuma manutenção.'}
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  abas: {
    flexDirection: 'row',
    backgroundColor: cores.superficie,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
  },
  aba: {
    flex: 1,
    minHeight: medidas.alvoToque,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    paddingHorizontal: 6,
  },
  abaAtiva: { borderBottomColor: cores.primaria },
  textoAba: { fontSize: 15, fontWeight: '600', color: cores.textoSecundario, textAlign: 'center' },
  textoAbaAtiva: { color: cores.primaria, fontWeight: '800' },
  conteudo: { padding: medidas.espaco, flexGrow: 1 },
  rodape: { fontSize: 14, color: cores.textoSecundario, marginTop: 4 },
  vazio: { fontSize: 16, color: cores.textoSecundario, textAlign: 'center', marginTop: 40 },
  avisoErro: { color: cores.erro, fontSize: 14, marginBottom: 10 },
  erroAba: { marginTop: 40, gap: 14 },
  textoErroAba: { fontSize: 16, color: cores.texto, textAlign: 'center' },
});
