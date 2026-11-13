import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  LIMITES,
  MSG_SEM_CORRECAO,
  STATUS,
  mensagemDeErro,
  validarReenvio,
} from '../../../shared/src/index.js';
import { api } from '../api';
import { cores, medidas } from '../tema';
import { formatarDataHora, textoEquipamento, textoLocalidade } from '../formato';
import { useRecurso } from '../useRecurso';
import Botao from '../componentes/Botao';
import CampoFoto from '../componentes/CampoFoto';
import CampoTexto from '../componentes/CampoTexto';
import { AlertaErro, Carregando, ErroTela } from '../componentes/Estados';
import { MotivoDevolucao, resolverFoto } from '../componentes/InfoSolicitacao';

function CampoBloqueado({ rotulo, valor }) {
  return (
    <View style={styles.bloqueado} accessible accessibilityLabel={`${rotulo}: ${valor}. Não editável.`}>
      <Text style={styles.rotuloBloqueado}>{rotulo} · não editável</Text>
      <Text style={styles.valorBloqueado}>{valor}</Text>
    </View>
  );
}

/** CPTM-35 — corrigir (descrição e/ou foto) e reenviar uma SSL DEVOLVIDA. */
export default function CorrigirSolicitacao({ route, navigation }) {
  const { id } = route.params;
  const carregar = useCallback(() => api.obterSolicitacao(id), [id]);
  const { dados: s, carregando, erro } = useRecurso(carregar);

  const [descricao, setDescricao] = useState('');
  const [foto, setFoto] = useState(null);
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);

  // preenche uma vez com a descrição atual
  useEffect(() => {
    if (s) setDescricao((atual) => atual || s.descricao);
  }, [s]);

  if (carregando) return <Carregando />;
  if (erro) {
    return <ErroTela titulo={erro.status === 403 ? 'Acesso negado' : undefined} mensagem={erro.mensagem} />;
  }
  if (s.status !== STATUS.DEVOLVIDA) {
    return <ErroTela titulo="Nada a corrigir" mensagem="Só solicitações DEVOLVIDAS podem ser corrigidas." />;
  }

  const { erros, semAlteracao } = validarReenvio(s, { descricao, foto });
  const errosVisiveis = tentou ? erros : {};

  async function reenviar() {
    setTentou(true);
    setErroEnvio(null);
    if (semAlteracao) {
      Alert.alert('Nada foi corrigido', MSG_SEM_CORRECAO);
      return;
    }
    if (Object.keys(erros).length) return;

    setEnviando(true);
    try {
      const mudouDescricao = descricao.trim() !== s.descricao.trim();
      await api.reenviarSolicitacao(id, {
        descricao: mudouDescricao ? descricao : null,
        foto,
      });
      Alert.alert('Solicitação reenviada', `A ${s.numero} voltou para a triagem com status REENVIADA.`);
      navigation.goBack();
    } catch (e) {
      // 400 (ex.: "Faça a correção antes de reenviar") e 403 vêm com mensagem da API
      setErroEnvio(mensagemDeErro(e));
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <MotivoDevolucao motivo={s.motivoDevolucao ?? 'Motivo não informado.'} />

        <Text style={styles.titulo} accessibilityRole="header">Corrigir {s.numero}</Text>
        <Text style={styles.subtitulo}>Você pode alterar a descrição e/ou a foto.</Text>

        <CampoBloqueado rotulo="Equipamento" valor={textoEquipamento(s.equipamento)} />
        <CampoBloqueado rotulo="Estação / local" valor={textoLocalidade(s.localidade)} />
        <CampoBloqueado rotulo="Data de abertura" valor={formatarDataHora(s.dataAbertura)} />

        <CampoTexto
          rotulo="Descrição do problema"
          value={descricao}
          onChangeText={setDescricao}
          erro={errosVisiveis.descricao}
          editable={!enviando}
          multiline
          maxLength={LIMITES.DESCRICAO_MAX}
          contador
        />

        {s.fotoUrl && !foto ? (
          <View style={styles.fotoAtual}>
            <Text style={styles.rotuloBloqueado}>Foto atual</Text>
            <Image source={{ uri: resolverFoto(s.fotoUrl) }} style={styles.imagem} accessibilityLabel="Foto atual do equipamento" />
          </View>
        ) : null}
        <CampoFoto
          foto={foto}
          aoMudar={setFoto}
          desabilitado={enviando}
          rotulo={s.fotoUrl ? 'Nova foto (opcional)' : 'Foto do equipamento'}
          textoBotao={s.fotoUrl ? 'Tirar nova foto' : 'Tirar foto'}
        />

        <AlertaErro mensagem={erroEnvio} />

        <Botao texto="Reenviar para triagem" onPress={reenviar} carregando={enviando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { padding: medidas.espaco, paddingBottom: 40 },
  titulo: { fontSize: 22, fontWeight: '800', color: cores.texto },
  subtitulo: { fontSize: 15, color: cores.textoSecundario, marginBottom: medidas.espaco },
  bloqueado: {
    backgroundColor: cores.neutroFundo,
    borderRadius: medidas.raio,
    padding: 12,
    marginBottom: 10,
  },
  rotuloBloqueado: { fontSize: 13, fontWeight: '700', color: cores.textoSecundario, marginBottom: 2 },
  valorBloqueado: { fontSize: 16, color: cores.textoSecundario },
  fotoAtual: { marginBottom: 10 },
  imagem: { width: '100%', aspectRatio: 4 / 3, borderRadius: medidas.raio, backgroundColor: cores.desabilitado },
});
