import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, medidas } from '../tema';

/**
 * Seleção em lista (modal de tela cheia), com alvos de toque grandes.
 * @param {{
 *   rotulo: string,
 *   placeholder?: string,
 *   opcoes: Array<{ id: number }>,
 *   textoOpcao: (opcao: any) => string,
 *   valor: number | null,
 *   aoSelecionar: (id: number) => void,
 *   erro?: string,
 *   desabilitado?: boolean,
 * }} props
 */
export default function CampoSelecao({
  rotulo,
  placeholder = 'Toque para selecionar',
  opcoes,
  textoOpcao,
  valor,
  aoSelecionar,
  erro,
  desabilitado = false,
}) {
  const [aberto, setAberto] = useState(false);
  const insets = useSafeAreaInsets();
  const selecionada = opcoes.find((o) => o.id === valor);

  return (
    <View style={styles.campo}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <Pressable
        onPress={() => setAberto(true)}
        disabled={desabilitado}
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${selecionada ? textoOpcao(selecionada) : 'não selecionado'}`}
        accessibilityHint="Abre a lista de opções"
        style={({ pressed }) => [
          styles.gatilho,
          erro && styles.gatilhoErro,
          pressed && styles.pressionado,
          desabilitado && styles.desabilitado,
        ]}
      >
        <Text style={[styles.valor, !selecionada && styles.placeholder]} numberOfLines={2}>
          {selecionada ? textoOpcao(selecionada) : placeholder}
        </Text>
        <Text style={styles.seta} importantForAccessibility="no">▾</Text>
      </Pressable>
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Modal visible={aberto} animationType="slide" onRequestClose={() => setAberto(false)}>
        <View style={[styles.modal, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.cabecalho}>
            <Text style={styles.tituloModal} accessibilityRole="header">{rotulo}</Text>
            <Pressable
              onPress={() => setAberto(false)}
              accessibilityRole="button"
              style={styles.botaoFechar}
            >
              <Text style={styles.textoFechar}>Fechar</Text>
            </Pressable>
          </View>
          <FlatList
            data={opcoes}
            keyExtractor={(item) => String(item.id)}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
            renderItem={({ item }) => {
              const ativo = item.id === valor;
              return (
                <Pressable
                  onPress={() => {
                    aoSelecionar(item.id);
                    setAberto(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativo }}
                  style={({ pressed }) => [styles.opcao, ativo && styles.opcaoAtiva, pressed && styles.pressionado]}
                >
                  <Text style={[styles.textoOpcao, ativo && styles.textoOpcaoAtiva]}>{textoOpcao(item)}</Text>
                  {ativo ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  campo: { marginBottom: medidas.espaco },
  rotulo: { fontSize: 16, fontWeight: '600', color: cores.texto, marginBottom: 6 },
  gatilho: {
    minHeight: medidas.alvoToque,
    borderWidth: 1.5,
    borderColor: cores.borda,
    borderRadius: medidas.raio,
    backgroundColor: cores.superficie,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gatilhoErro: { borderColor: cores.erro, borderWidth: 2 },
  pressionado: { opacity: 0.7 },
  desabilitado: { backgroundColor: cores.desabilitado },
  valor: { flex: 1, fontSize: 16, color: cores.texto },
  placeholder: { color: cores.textoSecundario },
  seta: { fontSize: 18, color: cores.textoSecundario, marginLeft: 8 },
  erro: { color: cores.erro, fontSize: 14, marginTop: 4 },
  modal: { flex: 1, backgroundColor: cores.superficie },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: medidas.espaco,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: cores.desabilitado,
  },
  tituloModal: { fontSize: 20, fontWeight: '700', color: cores.texto },
  botaoFechar: { minHeight: medidas.alvoToque, justifyContent: 'center', paddingHorizontal: 8 },
  textoFechar: { fontSize: 16, fontWeight: '600', color: cores.primaria },
  separador: { height: 1, backgroundColor: cores.desabilitado },
  opcao: {
    minHeight: medidas.alvoToque + 4,
    paddingHorizontal: medidas.espaco,
    flexDirection: 'row',
    alignItems: 'center',
  },
  opcaoAtiva: { backgroundColor: '#FDECEE' },
  textoOpcao: { flex: 1, fontSize: 17, color: cores.texto },
  textoOpcaoAtiva: { fontWeight: '700', color: cores.primariaEscura },
  check: { fontSize: 18, color: cores.primaria, fontWeight: '700' },
});
