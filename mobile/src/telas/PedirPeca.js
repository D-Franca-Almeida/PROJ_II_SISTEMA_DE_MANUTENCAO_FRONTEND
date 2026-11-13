import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { LIMITES_PEDIDO, mensagemDeErro, validarPedidoPeca } from '../../../shared/src/index.js';
import { api } from '../api';
import { cores, medidas } from '../tema';
import Botao from '../componentes/Botao';
import CampoTexto from '../componentes/CampoTexto';
import { AlertaErro } from '../componentes/Estados';

const VAZIO = { item: '', quantidade: '1', justificativa: '' };

/** CPTM-73 — pedido de peça na OSM (item, quantidade, justificativa). */
export default function PedirPeca({ route, navigation }) {
  const { osmId, numero } = route.params;
  const [form, setForm] = useState(VAZIO);
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const campoQtd = useRef(null);
  const campoJust = useRef(null);

  const erros = tentou ? validarPedidoPeca(form) : {};
  const atualizar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  async function enviar() {
    setTentou(true);
    setErroEnvio(null);
    if (Object.keys(validarPedidoPeca(form)).length) return;
    setEnviando(true);
    try {
      await api.pedirPeca(osmId, form);
      Alert.alert('Pedido enviado', `${form.quantidade}× ${form.item.trim()} — status SOLICITADO.`);
      navigation.goBack();
    } catch (e) {
      setErroEnvio(mensagemDeErro(e));
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo} accessibilityRole="header">Pedir peça</Text>
        <Text style={styles.subtitulo}>OSM {osmId} · {numero}</Text>

        <CampoTexto
          rotulo="Peça / item"
          value={form.item}
          onChangeText={atualizar('item')}
          erro={erros.item}
          editable={!enviando}
          maxLength={LIMITES_PEDIDO.ITEM_MAX}
          placeholder="Ex.: Rolamento 6204-2RS"
          returnKeyType="next"
          onSubmitEditing={() => campoQtd.current?.focus()}
          submitBehavior="submit"
        />
        <CampoTexto
          ref={campoQtd}
          rotulo="Quantidade"
          value={form.quantidade}
          onChangeText={(v) => atualizar('quantidade')(v.replace(/[^0-9]/g, ''))}
          erro={erros.quantidade}
          editable={!enviando}
          keyboardType="number-pad"
          maxLength={3}
          returnKeyType="next"
          onSubmitEditing={() => campoJust.current?.focus()}
          submitBehavior="submit"
        />
        <CampoTexto
          ref={campoJust}
          rotulo="Justificativa"
          value={form.justificativa}
          onChangeText={atualizar('justificativa')}
          erro={erros.justificativa}
          editable={!enviando}
          multiline
          maxLength={LIMITES_PEDIDO.JUSTIFICATIVA_MAX}
          contador
          placeholder="Ex.: rolamento com folga e ruído"
        />

        <AlertaErro mensagem={erroEnvio} />
        <Botao texto="Enviar pedido" onPress={enviar} carregando={enviando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { padding: medidas.espaco, paddingBottom: 40 },
  titulo: { fontSize: 22, fontWeight: '800', color: cores.texto },
  subtitulo: { fontSize: 15, color: cores.textoSecundario, marginBottom: medidas.espaco },
});
