import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ehMinhaOsmAberta, mensagemDeErro, podeAssumir } from '../../../shared/src/index.js';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api';
import { cores, medidas } from '../tema';
import { useRecurso } from '../useRecurso';
import { Carregando, ErroTela } from '../componentes/Estados';
import InfoSolicitacao from '../componentes/InfoSolicitacao';
import Botao from '../componentes/Botao';

/** CPTM-37 — detalhe da SSL para o Técnico: assumir a máquina e (depois) operar a OSM. */
export default function DetalheOsm({ route, navigation }) {
  const { id } = route.params;
  const carregar = useCallback(() => api.obterSolicitacao(id), [id]);
  const { dados: s, carregando, atualizando, erro, recarregar, puxarParaAtualizar } = useRecurso(carregar);
  const [assumindo, setAssumindo] = useState(false);
  const { sessao } = useAuth();

  if (carregando) return <Carregando />;
  if (erro?.status === 403) {
    return <ErroTela titulo="Acesso negado" mensagem="Esta manutenção está com outro técnico." />;
  }
  if (erro && !s) return <ErroTela mensagem={erro.mensagem} aoTentarDeNovo={recarregar} />;

  function confirmarAssumir() {
    Alert.alert('Assumir máquina', `Iniciar a manutenção da ${s.numero}? Uma OSM será aberta no seu nome.`, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Assumir', onPress: assumir },
    ]);
  }

  async function assumir() {
    setAssumindo(true);
    try {
      await api.iniciarManutencao(s.id);
      Alert.alert('Manutenção iniciada!', `A ${s.numero} agora está em "Minhas manutenções".`);
      navigation.popTo('HomeTecnico', { aba: 'minhas' });
    } catch (e) {
      Alert.alert('Não foi possível assumir', mensagemDeErro(e));
      setAssumindo(false);
      recarregar();
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
        {podeAssumir(s) ? (
          <Botao texto="Assumir máquina" onPress={confirmarAssumir} carregando={assumindo} />
        ) : null}
        {ehMinhaOsmAberta(s, sessao.matricula) ? (
          <>
            <Botao
              texto="Pedir peça"
              variante="secundario"
              onPress={() =>
                navigation.navigate('PedirPeca', { osmId: s.ordemServico.id, numero: s.numero })
              }
            />
            <Botao
              texto="Concluir manutenção"
              onPress={() => navigation.navigate('EncerrarOsm', { id: s.id, numero: s.numero, tipo: 'concluir' })}
            />
            <Botao
              texto="Não executada"
              variante="perigo"
              onPress={() => navigation.navigate('EncerrarOsm', { id: s.id, numero: s.numero, tipo: 'nao-executar' })}
            />
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: medidas.espaco, paddingBottom: 40 },
  acoes: { marginTop: medidas.espaco, gap: 12 },
});
