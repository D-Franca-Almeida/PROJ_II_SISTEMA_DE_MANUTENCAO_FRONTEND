import { Image, StyleSheet, Text, View } from 'react-native';
import { STATUS, mascararCpf } from '../../../shared/src/index.js';
import { API_URL } from '../config';
import { cores, medidas } from '../tema';
import { formatarDataHora, textoEquipamento, textoLocalidade } from '../formato';
import SeloStatus from './SeloStatus';
import IndicadorPrazo from './IndicadorPrazo';

/** A API pode devolver a foto com caminho relativo (/uploads/x.jpg). */
export function resolverFoto(url) {
  if (!url) return null;
  if (/^(https?|file|content|data):/i.test(url)) return url;
  return API_URL.replace(/\/api\/?$/, '') + (url.startsWith('/') ? url : `/${url}`);
}

/** Caixa laranja com o motivo da devolução (CPTM-61 e CPTM-35). */
export function MotivoDevolucao({ motivo }) {
  if (!motivo) return null;
  return (
    <View style={styles.motivo} accessibilityRole="alert">
      <Text style={styles.motivoTitulo}>Motivo da devolução</Text>
      <Text style={styles.motivoTexto}>{motivo}</Text>
    </View>
  );
}

function Linha({ rotulo, valor }) {
  return (
    <View style={styles.linha} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

/** Cabeçalho + foto + dados da SSL (usado pelo Comum e pelo Técnico). */
export default function InfoSolicitacao({ solicitacao: s }) {
  const foto = resolverFoto(s.fotoUrl);
  return (
    <View>
      <View style={styles.topo}>
        <Text style={styles.numero} accessibilityRole="header">{s.numero}</Text>
        <SeloStatus status={s.status} />
      </View>
      <IndicadorPrazo solicitacao={s} />

      {s.status === STATUS.DEVOLVIDA ? <MotivoDevolucao motivo={s.motivoDevolucao} /> : null}

      {foto ? (
        <Image
          source={{ uri: foto }}
          style={styles.foto}
          resizeMode="cover"
          accessible
          accessibilityLabel="Foto do equipamento"
        />
      ) : (
        <View style={[styles.foto, styles.semFoto]}>
          <Text style={styles.textoSemFoto}>Sem foto</Text>
        </View>
      )}

      <View style={styles.cartao}>
        <Linha rotulo="Equipamento" valor={textoEquipamento(s.equipamento)} />
        {s.avaria ? <Linha rotulo="Avaria" valor={s.avaria.descricao} /> : null}
        <Linha rotulo="Estação / local" valor={textoLocalidade(s.localidade)} />
        <Linha rotulo="Descrição" valor={s.descricao || '—'} />
        <Linha rotulo="Aberta em" valor={formatarDataHora(s.dataAbertura)} />
        <Linha rotulo="Solicitante" valor={s.matriculaSolicitante ?? '—'} />
        {s.ordemServico ? (
          <Linha rotulo="Técnico responsável" valor={s.ordemServico.matriculaTecnico} />
        ) : null}
        {s.ordemServico?.laudo ? <Linha rotulo="Laudo" valor={s.ordemServico.laudo} /> : null}
        {s.ordemServico?.motivoNaoExecucao ? (
          <Linha rotulo="Motivo da não execução" valor={s.ordemServico.motivoNaoExecucao} />
        ) : null}
        {s.autorizacaoRetirada ? (
          <Linha
            rotulo="Autorizado a retirar"
            valor={`${s.autorizacaoRetirada.nome} (${
              s.autorizacaoRetirada.tipoDocumento === 'MATRICULA' ? 'matrícula' : 'CPF'
            } ${
              s.autorizacaoRetirada.tipoDocumento === 'MATRICULA'
                ? s.autorizacaoRetirada.documento
                : mascararCpf(s.autorizacaoRetirada.documento)
            })`}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 },
  numero: { fontSize: 22, fontWeight: '800', color: cores.texto, flexShrink: 1 },
  motivo: {
    marginTop: 8,
    backgroundColor: cores.avisoFundo,
    borderLeftWidth: 6,
    borderLeftColor: cores.aviso,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  motivoTitulo: { fontSize: 15, fontWeight: '800', color: cores.aviso, marginBottom: 4 },
  motivoTexto: { fontSize: 16, color: cores.texto },
  foto: {
    marginTop: 6,
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: medidas.raio,
    backgroundColor: cores.desabilitado,
    marginBottom: 12,
  },
  semFoto: { alignItems: 'center', justifyContent: 'center', aspectRatio: 3 },
  textoSemFoto: { color: cores.textoSecundario, fontSize: 15 },
  cartao: { backgroundColor: cores.superficie, borderRadius: medidas.raio, padding: 14, gap: 10 },
  linha: { gap: 2 },
  rotulo: { fontSize: 13, fontWeight: '700', color: cores.textoSecundario, textTransform: 'uppercase' },
  valor: { fontSize: 16, color: cores.texto },
});
