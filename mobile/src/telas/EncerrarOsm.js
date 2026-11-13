import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  LIMITES,
  ROTULO_STATUS_PEDIDO,
  mensagemDeErro,
  pecasPendentesDoErro,
  validarLaudo,
  validarMotivo,
} from '../../../shared/src/index.js';
import { api } from '../api';
import { cores, medidas } from '../tema';
import Botao from '../componentes/Botao';
import CampoTexto from '../componentes/CampoTexto';
import { AlertaErro } from '../componentes/Estados';

const CONFIG = {
  concluir: {
    titulo: 'Concluir manutenção',
    explicacao: 'Descreva o serviço realizado. A SSL passará para CONCLUIDA.',
    rotulo: 'Laudo técnico',
    exemplo: 'Ex.: substituído o rolamento 6204 e testado por 30 min sem ruído',
    validar: validarLaudo,
    enviar: (id, texto) => api.concluirManutencao(id, texto),
    botao: 'Concluir manutenção',
    variante: 'primario',
    sucesso: 'Manutenção concluída',
  },
  'nao-executar': {
    titulo: 'Manutenção não executada',
    explicacao:
      'Informe por que o serviço não pôde ser feito. A SSL passará para NAO EXECUTADA e os pedidos de peça pendentes serão cancelados.',
    rotulo: 'Motivo',
    exemplo: 'Ex.: peça descontinuada pelo fabricante',
    validar: validarMotivo,
    enviar: (id, texto) => api.naoExecutarManutencao(id, texto),
    botao: 'Registrar como não executada',
    variante: 'perigo',
    sucesso: 'Registrada como não executada',
  },
};

/** CPTM-72 — encerramento da OSM: "Concluir" (laudo) ou "Não executada" (motivo). */
export default function EncerrarOsm({ route, navigation }) {
  const { id, numero, tipo } = route.params;
  const cfg = CONFIG[tipo];

  const [texto, setTexto] = useState('');
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const [pendentes, setPendentes] = useState([]);

  const erroCampo = tentou ? cfg.validar(texto) : null;

  function confirmar() {
    setTentou(true);
    setErroEnvio(null);
    setPendentes([]);
    if (cfg.validar(texto)) return;
    Alert.alert(cfg.titulo, `Confirmar para a ${numero}?`, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Confirmar', style: cfg.variante === 'perigo' ? 'destructive' : 'default', onPress: enviar },
    ]);
  }

  async function enviar() {
    setEnviando(true);
    try {
      await cfg.enviar(id, texto);
      Alert.alert(cfg.sucesso, `A ${numero} foi atualizada.`);
      navigation.goBack();
    } catch (e) {
      // 400 com a lista de peças pendentes, 400 de status e 403 (outro técnico)
      setErroEnvio(mensagemDeErro(e));
      setPendentes(pecasPendentesDoErro(e));
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo} accessibilityRole="header">{cfg.titulo}</Text>
        <Text style={styles.numero}>{numero}</Text>
        <Text style={styles.explicacao}>{cfg.explicacao}</Text>

        <CampoTexto
          rotulo={cfg.rotulo}
          value={texto}
          onChangeText={setTexto}
          erro={erroCampo}
          editable={!enviando}
          multiline
          maxLength={LIMITES.DESCRICAO_MAX}
          contador
          placeholder={cfg.exemplo}
        />

        <AlertaErro mensagem={erroEnvio} />
        {pendentes.length ? (
          <View style={styles.pendentes} accessibilityLabel="Peças pendentes">
            <Text style={styles.tituloPendentes}>Peças pendentes</Text>
            {pendentes.map((p) => (
              <Text key={p.id} style={styles.itemPendente}>
                • {p.quantidade}× {p.item} — {ROTULO_STATUS_PEDIDO[p.status] ?? p.status}
              </Text>
            ))}
          </View>
        ) : null}

        <Botao texto={cfg.botao} variante={cfg.variante} onPress={confirmar} carregando={enviando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { padding: medidas.espaco, paddingBottom: 40 },
  titulo: { fontSize: 22, fontWeight: '800', color: cores.texto },
  numero: { fontSize: 16, fontWeight: '700', color: cores.textoSecundario, marginBottom: 6 },
  explicacao: { fontSize: 15, color: cores.textoSecundario, marginBottom: medidas.espaco },
  pendentes: {
    backgroundColor: cores.superficie,
    borderRadius: medidas.raio,
    borderWidth: 1,
    borderColor: cores.erro,
    padding: 12,
    marginBottom: medidas.espaco,
    gap: 4,
  },
  tituloPendentes: { fontSize: 15, fontWeight: '800', color: cores.erro },
  itemPendente: { fontSize: 15, color: cores.texto },
});
