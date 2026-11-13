import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  TIPO_DOCUMENTO,
  mascararCpf,
  mensagemDeErro,
  validarAutorizacaoRetirada,
} from '../../../shared/src/index.js';
import { api } from '../api';
import { cores, medidas } from '../tema';
import Botao from '../componentes/Botao';
import CampoTexto from '../componentes/CampoTexto';
import { AlertaErro } from '../componentes/Estados';

const OPCOES = [
  { valor: TIPO_DOCUMENTO.CPF, rotulo: 'CPF' },
  { valor: TIPO_DOCUMENTO.MATRICULA, rotulo: 'Matrícula CPTM' },
];

/** CPTM-80 — autorizar um terceiro a retirar o equipamento (SSL AGUARDANDO RETIRADA). */
export default function AutorizarRetirada({ route, navigation }) {
  const { id, numero } = route.params;
  const [form, setForm] = useState({ nome: '', tipoDocumento: TIPO_DOCUMENTO.CPF, documento: '' });
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);

  const erros = tentou ? validarAutorizacaoRetirada(form) : {};
  const ehCpf = form.tipoDocumento === TIPO_DOCUMENTO.CPF;

  function trocarTipo(tipo) {
    setForm((f) => ({ ...f, tipoDocumento: tipo, documento: '' }));
  }

  function confirmar() {
    setTentou(true);
    setErroEnvio(null);
    if (Object.keys(validarAutorizacaoRetirada(form)).length) return;
    Alert.alert(
      'Autorizar retirada',
      `${form.nome.trim()} (${ehCpf ? 'CPF' : 'matrícula'} ${form.documento}) poderá retirar o equipamento da ${numero}. Confirmar?`,
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Autorizar', onPress: enviar },
      ],
    );
  }

  async function enviar() {
    setEnviando(true);
    try {
      await api.autorizarRetirada(id, form);
      Alert.alert('Retirada autorizada', `A ${numero} agora está como RETIRADA AUTORIZADA.`);
      navigation.goBack();
    } catch (e) {
      setErroEnvio(mensagemDeErro(e));
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo} accessibilityRole="header">Autorizar retirada</Text>
        <Text style={styles.subtitulo}>
          {numero} · informe quem vai retirar o equipamento no seu lugar.
        </Text>

        <CampoTexto
          rotulo="Nome completo do autorizado"
          value={form.nome}
          onChangeText={(nome) => setForm((f) => ({ ...f, nome }))}
          erro={erros.nome}
          editable={!enviando}
          maxLength={120}
          autoCapitalize="words"
          autoComplete="name"
        />

        <Text style={styles.rotulo} nativeID="rotuloTipoDoc">Documento</Text>
        <View style={styles.seletor} accessibilityRole="radiogroup" accessibilityLabelledBy="rotuloTipoDoc">
          {OPCOES.map((o) => {
            const ativo = form.tipoDocumento === o.valor;
            return (
              <Pressable
                key={o.valor}
                onPress={() => trocarTipo(o.valor)}
                disabled={enviando}
                accessibilityRole="radio"
                accessibilityState={{ checked: ativo, disabled: enviando }}
                style={[styles.opcao, ativo && styles.opcaoAtiva]}
              >
                <Text style={[styles.textoOpcao, ativo && styles.textoOpcaoAtiva]}>{o.rotulo}</Text>
              </Pressable>
            );
          })}
        </View>

        <CampoTexto
          rotulo={ehCpf ? 'CPF do autorizado' : 'Matrícula do autorizado'}
          value={form.documento}
          onChangeText={(v) => setForm((f) => ({ ...f, documento: ehCpf ? mascararCpf(v) : v }))}
          erro={erros.documento}
          editable={!enviando}
          keyboardType={ehCpf ? 'number-pad' : 'default'}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={ehCpf ? 14 : 20}
          placeholder={ehCpf ? '000.000.000-00' : 'Ex.: 123456'}
        />

        <AlertaErro mensagem={erroEnvio} />
        <Botao texto="Autorizar retirada" onPress={confirmar} carregando={enviando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { padding: medidas.espaco, paddingBottom: 40 },
  titulo: { fontSize: 22, fontWeight: '800', color: cores.texto },
  subtitulo: { fontSize: 15, color: cores.textoSecundario, marginBottom: medidas.espaco },
  rotulo: { fontSize: 16, fontWeight: '600', color: cores.texto, marginBottom: 6 },
  seletor: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  opcao: {
    flex: 1,
    minHeight: medidas.alvoToque,
    borderWidth: 1.5,
    borderColor: cores.borda,
    borderRadius: medidas.raio,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
  },
  opcaoAtiva: { borderColor: cores.primaria, borderWidth: 2.5, backgroundColor: '#FDECEE' },
  textoOpcao: { fontSize: 16, color: cores.texto },
  textoOpcaoAtiva: { fontWeight: '800', color: cores.primariaEscura },
});
