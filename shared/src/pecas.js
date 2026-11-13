/**
 * Pedido de peça da OSM (US-08 / US-23).
 * Ciclo: SOLICITADO → ENCAMINHADO → RECEBIDO; CANCELADO a partir dos dois primeiros.
 */
export const STATUS_PEDIDO = Object.freeze({
  SOLICITADO: 'SOLICITADO',
  ENCAMINHADO: 'ENCAMINHADO',
  RECEBIDO: 'RECEBIDO',
  CANCELADO: 'CANCELADO',
});

export const ROTULO_STATUS_PEDIDO = Object.freeze({
  [STATUS_PEDIDO.SOLICITADO]: 'Solicitado',
  [STATUS_PEDIDO.ENCAMINHADO]: 'Encaminhado',
  [STATUS_PEDIDO.RECEBIDO]: 'Recebido',
  [STATUS_PEDIDO.CANCELADO]: 'Cancelado',
});

/** Pedido ainda em aberto: bloqueia a conclusão da OSM e pode ser cancelado. */
export const pedidoPendente = (status) =>
  status === STATUS_PEDIDO.SOLICITADO || status === STATUS_PEDIDO.ENCAMINHADO;

/** CPTM-76: cancelar só em SOLICITADO ou ENCAMINHADO. */
export const podeCancelarPedido = pedidoPendente;

/**
 * @typedef {Object} PedidoPeca
 * @property {number} id
 * @property {number} ordemServicoId
 * @property {string} item
 * @property {number} quantidade
 * @property {string} justificativa
 * @property {string} status
 * @property {string} dataPedido  ISO 8601
 */

/**
 * O 400 do "concluir" traz a lista das peças pendentes (CPTM-71).
 * Aceita { pecasPendentes: [...] } ou { pendentes: [...] }.
 * @returns {PedidoPeca[]}
 */
export function pecasPendentesDoErro(erro) {
  const corpo = erro?.response?.data;
  const lista = corpo?.pecasPendentes ?? corpo?.pendentes;
  return Array.isArray(lista) ? lista : [];
}
