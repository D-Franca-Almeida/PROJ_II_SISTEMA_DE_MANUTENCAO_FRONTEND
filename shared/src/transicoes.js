import { STATUS, INFO_STATUS } from './status.js';

const S = STATUS;

/**
 * Mapa de transições permitidas (fluxograma + diagramas de sequência).
 * O backend (Daniel) é quem valida de verdade; aqui serve para o front
 * mostrar só as ações possíveis e para o mock se comportar igual.
 */
export const TRANSICOES = Object.freeze({
  [S.SOLICITADA]: [S.APROVADA, S.DEVOLVIDA, S.CANCELADA],
  // "corrigida, volta à triagem": a reenviada passa pelas mesmas decisões
  [S.REENVIADA]: [S.APROVADA, S.DEVOLVIDA, S.CANCELADA],
  // diagrama de sequência: o solicitante pode desistir após a devolução
  [S.DEVOLVIDA]: [S.REENVIADA, S.CANCELADA, S.EXPIRADA],
  [S.APROVADA]: [S.RECEBIDA, S.CANCELADA, S.EXPIRADA],
  [S.RECEBIDA]: [S.SSM_GERADA],
  [S.SSM_GERADA]: [S.MANUTENCAO],
  [S.MANUTENCAO]: [S.CONCLUIDA, S.NAO_EXECUTADA],
  [S.NAO_EXECUTADA]: [S.AGUARDANDO_RETIRADA],
  [S.CONCLUIDA]: [S.AGUARDANDO_RETIRADA, S.SEM_REPARO],
  [S.SEM_REPARO]: [S.AGUARDANDO_RETIRADA, S.INUTILIZADO],
  [S.AGUARDANDO_RETIRADA]: [S.RETIRADO, S.RETIRADA_AUTORIZADA],
  [S.RETIRADA_AUTORIZADA]: [S.RETIRADO],
  [S.CANCELADA]: [],
  [S.EXPIRADA]: [],
  [S.INUTILIZADO]: [],
  [S.RETIRADO]: [],
});

/** Transições que exigem motivo (gravado no histórico). */
export const EXIGE_MOTIVO = Object.freeze([S.DEVOLVIDA, S.CANCELADA]);

/** Ações da triagem (CPTM-34). */
export const ACOES_TRIAGEM = Object.freeze([S.APROVADA, S.DEVOLVIDA, S.CANCELADA]);

/** @param {string} status */
export function proximosStatus(status) {
  return TRANSICOES[status] ?? [];
}

/** @param {string} de @param {string} para */
export function podeTransicionar(de, para) {
  return proximosStatus(de).includes(para);
}

/** @param {string} para */
export function exigeMotivo(para) {
  return EXIGE_MOTIVO.includes(para);
}

/** @param {string} status */
export function emTriagem(status) {
  return status === S.SOLICITADA || status === S.REENVIADA;
}

/** @param {string} status */
export function ehFinal(status) {
  return INFO_STATUS[status]?.final ?? false;
}
