import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { cores, medidas } from '../tema';

const VARIANTES = {
  primario: { fundo: cores.primaria, texto: '#FFFFFF', borda: cores.primaria },
  secundario: { fundo: cores.superficie, texto: cores.primaria, borda: cores.primaria },
  neutro: { fundo: cores.superficie, texto: cores.texto, borda: cores.borda },
  perigo: { fundo: cores.superficie, texto: cores.erro, borda: cores.erro },
};

/**
 * Botão padrão do app (alvo de toque ≥ 52px).
 * @param {{
 *   texto: string,
 *   onPress: () => void,
 *   variante?: keyof typeof VARIANTES,
 *   carregando?: boolean,
 *   desabilitado?: boolean,
 *   acessibilidade?: string,
 *   estilo?: any,
 * }} props
 */
export default function Botao({
  texto,
  onPress,
  variante = 'primario',
  carregando = false,
  desabilitado = false,
  acessibilidade,
  estilo,
}) {
  const v = VARIANTES[variante];
  const inativo = desabilitado || carregando;
  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={acessibilidade ?? texto}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      style={({ pressed }) => [
        styles.botao,
        { backgroundColor: v.fundo, borderColor: v.borda },
        pressed && styles.pressionado,
        desabilitado && styles.desabilitado,
        estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={v.texto} />
      ) : (
        <Text style={[styles.texto, { color: v.texto }]}>{texto}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    minHeight: medidas.alvoToque,
    borderRadius: medidas.raio,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  texto: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  pressionado: { opacity: 0.75 },
  desabilitado: { opacity: 0.45 },
});
