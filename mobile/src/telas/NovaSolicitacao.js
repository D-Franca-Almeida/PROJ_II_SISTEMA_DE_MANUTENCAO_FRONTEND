import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LIMITES, validarNovaSolicitacao, mensagemDeErro } from '../../../shared/src/index.js';
import { api } from '../api';
import { USAR_MOCK } from '../config';
import { cores, medidas } from '../tema';
import CampoSelecao from '../componentes/CampoSelecao';
import CampoFoto from '../componentes/CampoFoto';

/** @type {import('../../../shared/src/tipos.js').NovaSolicitacao} */
const FORM_VAZIO = {
  equipamentoId: null,
  avariaId: null,
  localidadeId: null,
  descricao: '',
  foto: null,
};

/** CPTM-30 — Usuário Comum abre uma SSL com foto pelo celular. */
export default function NovaSolicitacao() {
  const [catalogos, setCatalogos] = useState({ equipamentos: [], avarias: [], localidades: [] });
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState(null);

  const [form, setForm] = useState(FORM_VAZIO);
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);

  const carregarCatalogos = useCallback(async () => {
    setCarregando(true);
    setErroCarga(null);
    try {
      const [equipamentos, avarias, localidades] = await Promise.all([
        api.listarEquipamentos(),
        api.listarAvarias(),
        api.listarLocalidades(),
      ]);
      setCatalogos({ equipamentos, avarias, localidades });
    } catch (e) {
      setErroCarga(mensagemDeErro(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarCatalogos();
  }, [carregarCatalogos]);

  const erros = tentouEnviar ? validarNovaSolicitacao(form) : {};
  const atualizar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  async function enviar() {
    setTentouEnviar(true);
    setErroEnvio(null);
    if (Object.keys(validarNovaSolicitacao(form)).length) return;

    setEnviando(true);
    try {
      const criada = await api.criarSolicitacao(form);
      setForm(FORM_VAZIO);
      setTentouEnviar(false);
      Alert.alert(
        'Solicitação enviada',
        `A ${criada.numero ?? 'solicitação'} foi aberta e está aguardando a triagem.`,
      );
    } catch (e) {
      setErroEnvio(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={cores.primaria} />
        <Text style={styles.textoCentro}>Carregando equipamentos…</Text>
      </View>
    );
  }

  if (erroCarga) {
    return (
      <View style={styles.centro}>
        <Text style={styles.textoCentro}>{erroCarga}</Text>
        <Pressable onPress={carregarCatalogos} accessibilityRole="button" style={styles.botaoPrimario}>
          <Text style={styles.textoBotaoPrimario}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  const tamanhoDescricao = form.descricao.trim().length;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo} accessibilityRole="header">Nova Solicitação</Text>
        <Text style={styles.subtitulo}>Preencha os dados e fotografe o equipamento com avaria.</Text>
        {USAR_MOCK ? (
          <Text style={styles.selo} accessibilityLabel="Modo de teste, dados fictícios">
            MODO MOCK — dados fictícios
          </Text>
        ) : null}

        <CampoSelecao
          rotulo="Equipamento"
          opcoes={catalogos.equipamentos}
          textoOpcao={(e) => `${e.codigo} - ${e.descricao}`}
          valor={form.equipamentoId}
          aoSelecionar={atualizar('equipamentoId')}
          erro={erros.equipamentoId}
          desabilitado={enviando}
        />
        <CampoSelecao
          rotulo="Avaria"
          opcoes={catalogos.avarias}
          textoOpcao={(a) => a.descricao}
          valor={form.avariaId}
          aoSelecionar={atualizar('avariaId')}
          erro={erros.avariaId}
          desabilitado={enviando}
        />
        <CampoSelecao
          rotulo="Localidade"
          opcoes={catalogos.localidades}
          textoOpcao={(l) => `${l.sigla} - ${l.nome}`}
          valor={form.localidadeId}
          aoSelecionar={atualizar('localidadeId')}
          erro={erros.localidadeId}
          desabilitado={enviando}
        />

        <View style={styles.campo}>
          <Text style={styles.rotulo} nativeID="rotuloDescricao">Descrição do problema</Text>
          <TextInput
            value={form.descricao}
            onChangeText={atualizar('descricao')}
            editable={!enviando}
            multiline
            maxLength={LIMITES.DESCRICAO_MAX}
            placeholder="Ex.: motor esquenta após 20 minutos de uso"
            placeholderTextColor={cores.textoSecundario}
            accessibilityLabelledBy="rotuloDescricao"
            accessibilityLabel="Descrição do problema"
            style={[styles.textarea, erros.descricao && styles.inputErro]}
            textAlignVertical="top"
          />
          <View style={styles.linhaAjuda}>
            <Text style={styles.erro}>{erros.descricao ?? ''}</Text>
            <Text style={styles.contador}>
              {tamanhoDescricao}/{LIMITES.DESCRICAO_MAX}
            </Text>
          </View>
        </View>

        <CampoFoto
          foto={form.foto}
          aoMudar={atualizar('foto')}
          erro={erros.foto}
          desabilitado={enviando}
        />

        {erroEnvio ? (
          <View style={styles.alerta} accessibilityLiveRegion="assertive">
            <Text style={styles.textoAlerta}>{erroEnvio}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={enviar}
          disabled={enviando}
          accessibilityRole="button"
          accessibilityState={{ busy: enviando, disabled: enviando }}
          style={({ pressed }) => [
            styles.botaoPrimario,
            pressed && styles.pressionado,
            enviando && styles.botaoOcupado,
          ]}
        >
          {enviando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.textoBotaoPrimario}>Enviar solicitação</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { padding: medidas.espaco, paddingBottom: 40 },
  titulo: { fontSize: 26, fontWeight: '800', color: cores.texto },
  subtitulo: { fontSize: 16, color: cores.textoSecundario, marginTop: 4, marginBottom: medidas.espaco },
  selo: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: cores.primariaEscura,
    backgroundColor: '#FDECEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: medidas.espaco,
    overflow: 'hidden',
  },
  campo: { marginBottom: medidas.espaco },
  rotulo: { fontSize: 16, fontWeight: '600', color: cores.texto, marginBottom: 6 },
  textarea: {
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: cores.borda,
    borderRadius: medidas.raio,
    backgroundColor: cores.superficie,
    padding: 12,
    fontSize: 16,
    color: cores.texto,
  },
  inputErro: { borderColor: cores.erro, borderWidth: 2 },
  linhaAjuda: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, gap: 8 },
  erro: { flex: 1, color: cores.erro, fontSize: 14 },
  contador: { fontSize: 13, color: cores.textoSecundario },
  alerta: {
    backgroundColor: cores.erroFundo,
    borderLeftWidth: 4,
    borderLeftColor: cores.erro,
    padding: 12,
    borderRadius: 6,
    marginBottom: medidas.espaco,
  },
  textoAlerta: { color: cores.erro, fontSize: 15 },
  botaoPrimario: {
    minHeight: medidas.alvoToque + 4,
    backgroundColor: cores.primaria,
    borderRadius: medidas.raio,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  botaoOcupado: { backgroundColor: cores.primariaEscura },
  pressionado: { opacity: 0.8 },
  textoBotaoPrimario: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  textoCentro: { fontSize: 16, color: cores.texto, textAlign: 'center' },
});
