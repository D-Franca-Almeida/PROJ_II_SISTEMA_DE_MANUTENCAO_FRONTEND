import { STATUS, DIAS_PARA_EXPIRAR } from './status.js';
import { PERFIL } from './perfil.js';

/**
 * Regras de negócio que o front precisa conhecer para mostrar/esconder ações.
 * Quem valida de verdade é a API; aqui é só para a UI e para o mock.
 */

const DIA = 86_400_000;

/**
 * Dias até a SSL expirar (DEVOLVIDA sem reenvio / APROVADA sem entrega).
 * A API real manda isso pronto em DiasParaExpirar; o mock calcula aqui.
 * @param {{ status: string, dataStatus?: string }} s
 * @returns {number | null}
 */
export function calcularDiasParaExpirar(s, agora = Date.now()) {
  if (s.status !== STATUS.DEVOLVIDA && s.status !== STATUS.APROVADA) return null;
  if (!s.dataStatus) return null;
  const passados = Math.floor((agora - Date.parse(s.dataStatus)) / DIA);
  return Math.max(0, DIAS_PARA_EXPIRAR - passados);
}

/**
 * Quem pode ver uma SSL (mesma regra da API: dono, Admin e técnico da OSM).
 * O técnico também vê as RECEBIDAS, que formam a fila para assumir.
 * @param {{ status: string, matriculaSolicitante: string, ordemServico?: { matriculaTecnico: string } | null }} s
 * @param {{ matricula: string, perfil: string }} sessao
 */
export function podeVerSolicitacao(s, sessao) {
  if (sessao.perfil === PERFIL.ADMINISTRATIVO) return true;
  if (sessao.perfil === PERFIL.COMUM) return s.matriculaSolicitante === sessao.matricula;
  if (sessao.perfil === PERFIL.TECNICO) {
    return s.status === STATUS.RECEBIDA || s.ordemServico?.matriculaTecnico === sessao.matricula;
  }
  return false;
}

/** CPTM-64: o solicitante pode cancelar até a entrega física (RECEBIDA em diante = 400). */
export const STATUS_CANCELAVEIS = Object.freeze([
  STATUS.SOLICITADA,
  STATUS.DEVOLVIDA,
  STATUS.REENVIADA,
  STATUS.APROVADA,
]);

/** @param {string} status */
export const podeCancelar = (status) => STATUS_CANCELAVEIS.includes(status);

/** CPTM-67: com N ≤ 2 dias o indicador fica vermelho. */
export const DIAS_PRAZO_CRITICO = 2;

/**
 * Indicador "Expira em N dias" (só DEVOLVIDA e APROVADA com DiasParaExpirar).
 * @param {{ status: string, diasParaExpirar?: number | null }} s
 * @returns {{ texto: string, critico: boolean } | null}
 */
export function indicadorPrazo(s) {
  if (s.status !== STATUS.DEVOLVIDA && s.status !== STATUS.APROVADA) return null;
  const n = s.diasParaExpirar;
  if (typeof n !== 'number' || Number.isNaN(n)) return null;
  const texto = n <= 0 ? 'Expira hoje' : n === 1 ? 'Expira em 1 dia' : `Expira em ${n} dias`;
  return { texto, critico: n <= DIAS_PRAZO_CRITICO };
}

/** CPTM-37 (refinamento 10/11): a fila do técnico é RECEBIDA, não APROVADA. */
export const STATUS_FILA_TECNICO = STATUS.RECEBIDA;

/** @param {{ status: string }} s */
export const podeAssumir = (s) => s.status === STATUS_FILA_TECNICO;

/**
 * A OSM está nas mãos deste técnico e ainda aberta (pode concluir, pedir peças...).
 * @param {{ status: string, ordemServico?: { matriculaTecnico: string } | null }} s
 * @param {string} matricula
 */
export const ehMinhaOsmAberta = (s, matricula) =>
  s.status === STATUS.MANUTENCAO && s.ordemServico?.matriculaTecnico === matricula;
