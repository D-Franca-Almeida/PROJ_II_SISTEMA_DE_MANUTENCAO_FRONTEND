import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { STATUS, mensagemDeErro, podeCancelar } from '../../../shared/src/index.js';
import { api } from '../api';
import { cores, medidas } from '../tema';
import { useRecurso } from '../useRecurso';
import { Carregando, ErroTela } from '../componentes/Estados';
import InfoSolicitacao from '../componentes/InfoSolicitacao';
import Botao from '../componentes/Botao';
import LinhaDoTempo from '../componentes/LinhaDoTempo';

/** CPTM-61 — detalhe da SSL do Usuário Comum, com as ações do solicitante. */
export default function DetalheSolicitacao({ route, navigation }) {
  const { id } = route.params;
  const carregar = useCallback(() => api.obterSolicitacao(id), [id]);
  const { dados: s, carregando, atualizando, erro, recarregar, puxarParaAtualizar } = useRecurso(carregar);
  const [cancelando, setCancelando] = useState(false);

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

  // CPTM-64
  function confirmarCancelamento() {
    Alert.alert(
      'Cancelar solicitação',
      `Tem certeza que deseja cancelar a ${s.numero}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Cancelar solicitação', style: 'destructive', onPress: cancelar },
      ],
    );
  }

  async function cancelar() {
    setCancelando(true);
    try {
      await api.cancelarSolicitacao(s.id);
      Alert.alert('Solicitação cancelada', `A ${s.numero} foi cancelada.`);
      await recarregar();
    } catch (e) {
      // 400: já foi recebida na oficina; 403: não é o dono
      Alert.alert('Não foi possível cancelar', mensagemDeErro(e));
      recarregar();
    } finally {
      setCancelando(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.conteudo}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={puxarParaAtualizar} colors={[cores.primaria]} />
      }
    >
      <InfoSolicitacao solicitacao={s} />
      <View style={styles.acoes}>
        {s.status === STATUS.DEVOLVIDA ? (
          <Botao
            texto="Corrigir e reenviar"
            onPress={() => navigation.navigate('CorrigirSolicitacao', { id: s.id })}
          />
        ) : null}
        {podeCancelar(s.status) ? (
          <Botao
            texto="Cancelar solicitação"
            variante="perigo"
            onPress={confirmarCancelamento}
            carregando={cancelando}
          />
        ) : null}
      </View>
      <LinhaDoTempo solicitacaoId={s.id} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: medidas.espaco, paddingBottom: 40 },
  acoes: { marginTop: medidas.espaco, gap: 12 },
});
