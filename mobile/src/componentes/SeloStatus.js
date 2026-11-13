import { StyleSheet, Text } from 'react-native';
import { INFO_STATUS, STATUS, TOM, rotuloStatus } from '../../../shared/src/index.js';
import { cores } from '../tema';

const PALETA = {
  [TOM.ANDAMENTO]: { fundo: cores.neutroFundo, texto: cores.texto },
  [TOM.DECISAO]: { fundo: cores.infoFundo, texto: cores.info },
  [TOM.FIM_NEGATIVO]: { fundo: cores.erroFundo, texto: cores.erro },
  [TOM.FIM_POSITIVO]: { fundo: cores.sucessoFundo, texto: cores.sucesso },
};

/** DEVOLVIDA pede ação do usuário: laranja forte (CPTM-61). */
const DESTAQUE = {
  [STATUS.DEVOLVIDA]: { fundo: cores.aviso, texto: '#FFFFFF' },
};

/** Selo com o status da SSL (cor + texto, nunca só cor). */
export default function SeloStatus({ status, estilo }) {
  const tom = INFO_STATUS[status]?.tom ?? TOM.ANDAMENTO;
  const c = DESTAQUE[status] ?? PALETA[tom];
  return (
    <Text
      style={[styles.selo, { backgroundColor: c.fundo, color: c.texto }, estilo]}
      accessibilityLabel={`Status: ${rotuloStatus(status)}`}
    >
      {rotuloStatus(status).toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  selo: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
