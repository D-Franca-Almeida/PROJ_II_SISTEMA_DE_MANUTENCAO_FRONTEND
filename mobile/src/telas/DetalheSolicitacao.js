import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { api } from '../api';
import { cores, medidas } from '../tema';
import { useRecurso } from '../useRecurso';
import { Carregando, ErroTela } from '../componentes/Estados';
import InfoSolicitacao from '../componentes/InfoSolicitacao';

/** CPTM-61 — detalhe da SSL do Usuário Comum. */
export default function DetalheSolicitacao({ route }) {
  const { id } = route.params;
  const carregar = useCallback(() => api.obterSolicitacao(id), [id]);
  const { dados: s, carregando, atualizando, erro, recarregar, puxarParaAtualizar } = useRecurso(carregar);

  if (carregando) return <Carregando />;
  if (erro?.status === 403) {
    return (
      <ErroTela
        titulo="Acesso negado"
        mensagem="Esta solicitação pertence a outro usuário e você não tem permissão para vê-la."
      />
    );
  }
  if (erro?.status === 404) return <ErroTela titulo="Não encontrada" mensagem={erro.mensagem} />;
  if (erro && !s) return <ErroTela mensagem={erro.mensagem} aoTentarDeNovo={recarregar} />;

  return (
    <ScrollView
      contentContainerStyle={styles.conteudo}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={puxarParaAtualizar} colors={[cores.primaria]} />
      }
    >
      <InfoSolicitacao solicitacao={s} />
      <View style={styles.acoes} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: medidas.espaco, paddingBottom: 40 },
  acoes: { marginTop: medidas.espaco, gap: 12 },
});
