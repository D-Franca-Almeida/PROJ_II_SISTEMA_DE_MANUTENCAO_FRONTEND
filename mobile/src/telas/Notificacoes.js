import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PERFIL } from '../../../shared/src/index.js';
import { useAuth } from '../auth/AuthContext';
import { useNotificacoes } from '../notificacoes/NotificacoesContext';
import { cores, medidas } from '../tema';
import { formatarDataHora } from '../formato';

/** CPTM-86 — lista de notificações; tocar marca como lida e abre a SSL. */
export default function Notificacoes({ navigation }) {
  const { sessao } = useAuth();
  const { lista, carregando, atualizando, erro, atualizar, marcarLida } = useNotificacoes();

  useFocusEffect(
    useCallback(() => {
      atualizar(); // em segundo plano: sem spinner
    }, [atualizar]),
  );

  function abrir(n) {
    if (!n.lida) marcarLida(n.id);
    if (!n.solicitacaoId) return;
    const destino = sessao.perfil === PERFIL.TECNICO ? 'DetalheOsm' : 'DetalheSolicitacao';
    navigation.navigate(destino, { id: n.solicitacaoId });
  }

  return (
    <FlatList
      data={lista}
      keyExtractor={(n) => String(n.id)}
      contentContainerStyle={styles.conteudo}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={() => atualizar({ puxou: true })}
          colors={[cores.primaria]}
        />
      }
      ListHeaderComponent={erro ? <Text style={styles.erro}>Não foi possível atualizar: {erro}</Text> : null}
      ListEmptyComponent={
        !carregando ? <Text style={styles.vazio}>Você não tem notificações.</Text> : null
      }
      renderItem={({ item: n }) => (
        <Pressable
          onPress={() => abrir(n)}
          accessibilityRole="button"
          accessibilityLabel={`${n.lida ? '' : 'Não lida. '}${n.mensagem}. ${formatarDataHora(n.data)}`}
          accessibilityHint={n.solicitacaoId ? 'Abre a solicitação' : undefined}
          style={({ pressed }) => [styles.item, !n.lida && styles.naoLida, pressed && styles.pressionado]}
        >
          <View style={[styles.marcador, !n.lida && styles.marcadorAtivo]} />
          <View style={styles.corpo}>
            <Text style={[styles.mensagem, !n.lida && styles.mensagemNaoLida]}>{n.mensagem}</Text>
            <Text style={styles.data}>{formatarDataHora(n.data)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: medidas.espaco, flexGrow: 1 },
  item: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: cores.superficie,
    borderRadius: medidas.raio,
    padding: 14,
    marginBottom: 10,
    minHeight: medidas.alvoToque,
  },
  naoLida: { borderLeftWidth: 4, borderLeftColor: cores.primaria },
  pressionado: { opacity: 0.8 },
  marcador: { width: 10, height: 10, borderRadius: 5, marginTop: 6, backgroundColor: 'transparent' },
  marcadorAtivo: { backgroundColor: cores.primaria },
  corpo: { flex: 1, gap: 4 },
  mensagem: { fontSize: 16, color: cores.textoSecundario },
  mensagemNaoLida: { color: cores.texto, fontWeight: '700' },
  data: { fontSize: 13, color: cores.textoSecundario },
  vazio: { fontSize: 16, color: cores.textoSecundario, textAlign: 'center', marginTop: 40 },
  erro: { color: cores.erro, fontSize: 14, marginBottom: 10 },
});
