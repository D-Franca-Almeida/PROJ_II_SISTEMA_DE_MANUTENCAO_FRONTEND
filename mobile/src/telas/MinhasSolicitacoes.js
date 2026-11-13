import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { cores, medidas } from '../tema';
import { useRecurso } from '../useRecurso';
import { Carregando, ErroTela } from '../componentes/Estados';
import CartaoSolicitacao from '../componentes/CartaoSolicitacao';
import IndicadorPrazo from '../componentes/IndicadorPrazo';
import Botao from '../componentes/Botao';

/** CPTM-61 — lista das SSLs do Usuário Comum (mais recente primeiro, vem ordenada da API). */
export default function MinhasSolicitacoes({ navigation }) {
  const carregar = useCallback(() => api.listarMinhasSolicitacoes(), []);
  const { dados, carregando, atualizando, erro, recarregar, puxarParaAtualizar } = useRecurso(carregar);

  if (carregando) return <Carregando texto="Carregando suas solicitações…" />;
  if (erro && !dados) return <ErroTela mensagem={erro.mensagem} aoTentarDeNovo={recarregar} />;

  return (
    <FlatList
      data={dados ?? []}
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
          onPress={() => navigation.navigate('DetalheSolicitacao', { id: item.id })}
          rodape={<IndicadorPrazo solicitacao={item} />}
        />
      )}
      ListEmptyComponent={
        <View style={styles.vazio}>
          <Text style={styles.textoVazio}>Você ainda não abriu nenhuma solicitação.</Text>
          <Botao texto="Abrir solicitação" onPress={() => navigation.navigate('NovaSolicitacao')} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: medidas.espaco, flexGrow: 1 },
  vazio: { flex: 1, justifyContent: 'center', gap: 16, padding: 24 },
  textoVazio: { fontSize: 16, color: cores.textoSecundario, textAlign: 'center' },
  avisoErro: { color: cores.erro, fontSize: 14, marginBottom: 10 },
});
