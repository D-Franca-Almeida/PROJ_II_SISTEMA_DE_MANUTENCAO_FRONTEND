import { useId } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { cores, medidas } from '../tema';

/**
 * Campo de texto com rótulo, erro e contador opcional.
 * Demais props vão direto para o TextInput.
 */
export default function CampoTexto({ rotulo, erro, maxLength, contador = false, multiline, value, style, ...resto }) {
  const id = useId();
  return (
    <View style={[styles.campo, style]}>
      <Text style={styles.rotulo} nativeID={id}>{rotulo}</Text>
      <TextInput
        value={value}
        multiline={multiline}
        maxLength={maxLength}
        accessibilityLabel={rotulo}
        accessibilityLabelledBy={id}
        placeholderTextColor={cores.textoSecundario}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.multilinha, erro && styles.inputErro]}
        {...resto}
      />
      {erro || contador ? (
        <View style={styles.linhaAjuda}>
          <Text style={styles.erro}>{erro ?? ''}</Text>
          {contador && maxLength ? (
            <Text style={styles.contador}>{(value ?? '').length}/{maxLength}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  campo: { marginBottom: medidas.espaco },
  rotulo: { fontSize: 16, fontWeight: '600', color: cores.texto, marginBottom: 6 },
  input: {
    minHeight: medidas.alvoToque,
    borderWidth: 1.5,
    borderColor: cores.borda,
    borderRadius: medidas.raio,
    backgroundColor: cores.superficie,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
    color: cores.texto,
  },
  multilinha: { minHeight: 110 },
  inputErro: { borderColor: cores.erro, borderWidth: 2 },
  linhaAjuda: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, gap: 8 },
  erro: { flex: 1, color: cores.erro, fontSize: 14 },
  contador: { fontSize: 13, color: cores.textoSecundario },
});
