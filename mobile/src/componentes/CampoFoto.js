import { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { cores, medidas } from '../tema';

/**
 * Foto do equipamento pela câmera, com prévia e tratamento de permissão negada.
 * @param {{
 *   foto: { uri: string, name: string, type: string } | null,
 *   aoMudar: (foto: { uri: string, name: string, type: string } | null) => void,
 *   erro?: string,
 *   desabilitado?: boolean,
 * }} props
 */
export default function CampoFoto({ foto, aoMudar, erro, desabilitado = false }) {
  const [permissaoNegada, setPermissaoNegada] = useState(false);
  const [podePedirDeNovo, setPodePedirDeNovo] = useState(true);
  const [falha, setFalha] = useState(null);

  async function tirarFoto() {
    setFalha(null);
    try {
      const permissao = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissao.granted) {
        setPermissaoNegada(true);
        setPodePedirDeNovo(permissao.canAskAgain);
        return;
      }
      setPermissaoNegada(false);

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.6, // reduz o tamanho do upload
        exif: false,
      });
      if (resultado.canceled) return;

      const asset = resultado.assets[0];
      const tipo = asset.mimeType ?? 'image/jpeg';
      const extensao = tipo.split('/')[1] ?? 'jpg';
      aoMudar({
        uri: asset.uri,
        name: asset.fileName ?? `ssl-${Date.now()}.${extensao}`,
        type: tipo,
      });
    } catch (e) {
      setFalha('Não foi possível abrir a câmera neste aparelho.');
    }
  }

  return (
    <View style={styles.campo}>
      <Text style={styles.rotulo}>Foto do equipamento</Text>

      {foto ? (
        <View>
          <Image
            source={{ uri: foto.uri }}
            style={styles.previa}
            resizeMode="cover"
            accessible
            accessibilityLabel="Prévia da foto do equipamento"
          />
          <View style={styles.linha}>
            <BotaoSecundario texto="Tirar outra" onPress={tirarFoto} desabilitado={desabilitado} />
            <BotaoSecundario texto="Remover" onPress={() => aoMudar(null)} desabilitado={desabilitado} />
          </View>
        </View>
      ) : (
        <Pressable
          onPress={tirarFoto}
          disabled={desabilitado}
          accessibilityRole="button"
          accessibilityLabel="Abrir câmera para fotografar o equipamento"
          style={({ pressed }) => [
            styles.areaVazia,
            erro && styles.areaErro,
            pressed && styles.pressionado,
          ]}
        >
          <Text style={styles.icone} importantForAccessibility="no">📷</Text>
          <Text style={styles.textoArea}>Tirar foto</Text>
          <Text style={styles.dica}>Mostre a avaria e a etiqueta do equipamento</Text>
        </Pressable>
      )}

      {permissaoNegada ? (
        <View style={styles.aviso} accessibilityLiveRegion="polite">
          <Text style={styles.textoAviso}>
            Sem permissão para usar a câmera. A foto é obrigatória para abrir a solicitação.
          </Text>
          <BotaoSecundario
            texto={podePedirDeNovo ? 'Permitir câmera' : 'Abrir configurações'}
            onPress={podePedirDeNovo ? tirarFoto : () => Linking.openSettings()}
          />
        </View>
      ) : null}

      {falha ? <Text style={styles.erro}>{falha}</Text> : null}
      {erro && !foto ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

function BotaoSecundario({ texto, onPress, desabilitado }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      accessibilityRole="button"
      style={({ pressed }) => [styles.botao, pressed && styles.pressionado, desabilitado && styles.desabilitado]}
    >
      <Text style={styles.textoBotao}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  campo: { marginBottom: medidas.espaco },
  rotulo: { fontSize: 16, fontWeight: '600', color: cores.texto, marginBottom: 6 },
  areaVazia: {
    minHeight: 150,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: cores.borda,
    borderRadius: medidas.raio,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    padding: medidas.espaco,
  },
  areaErro: { borderColor: cores.erro },
  icone: { fontSize: 36 },
  textoArea: { fontSize: 18, fontWeight: '700', color: cores.primaria, marginTop: 6 },
  dica: { fontSize: 14, color: cores.textoSecundario, marginTop: 4, textAlign: 'center' },
  previa: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: medidas.raio,
    backgroundColor: cores.desabilitado,
  },
  linha: { flexDirection: 'row', gap: 12, marginTop: 10 },
  botao: {
    flex: 1,
    minHeight: medidas.alvoToque,
    borderWidth: 1.5,
    borderColor: cores.primaria,
    borderRadius: medidas.raio,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
    paddingHorizontal: 12,
  },
  textoBotao: { fontSize: 16, fontWeight: '600', color: cores.primaria },
  pressionado: { opacity: 0.7 },
  desabilitado: { opacity: 0.5 },
  aviso: {
    marginTop: 10,
    padding: 12,
    borderRadius: medidas.raio,
    backgroundColor: cores.erroFundo,
    gap: 10,
  },
  textoAviso: { fontSize: 15, color: cores.erro },
  erro: { color: cores.erro, fontSize: 14, marginTop: 4 },
});
