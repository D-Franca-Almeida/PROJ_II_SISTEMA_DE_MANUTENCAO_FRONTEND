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

export const LIMITES_PEDIDO = Object.freeze({ ITEM_MAX: 120, JUSTIFICATIVA_MIN: 5, JUSTIFICATIVA_MAX: 500, QUANTIDADE_MAX: 999 });

/**
 * Formulário de pedido de peça (CPTM-73). Quantidade chega como texto do input.
 * @param {{ item: string, quantidade: string | number, justificativa: string }} dados
 * @returns {Record<string, string>} erros por campo (vazio = válido)
 */
export function validarPedidoPeca(dados) {
  const erros = {};
  const item = (dados.item ?? '').trim();
  if (!item) erros.item = 'Informe a peça ou item.';
  else if (item.length > LIMITES_PEDIDO.ITEM_MAX) erros.item = `Máximo de ${LIMITES_PEDIDO.ITEM_MAX} caracteres.`;

  const texto = String(dados.quantidade ?? '').trim();
  const qtd = Number(texto);
  if (!texto || !/^\d+$/.test(texto) || !Number.isInteger(qtd) || qtd <= 0) {
    erros.quantidade = 'A quantidade deve ser um número inteiro maior que zero.';
  } else if (qtd > LIMITES_PEDIDO.QUANTIDADE_MAX) {
    erros.quantidade = `Máximo de ${LIMITES_PEDIDO.QUANTIDADE_MAX} unidades por pedido.`;
  }

  const just = (dados.justificativa ?? '').trim();
  if (just.length < LIMITES_PEDIDO.JUSTIFICATIVA_MIN) {
    erros.justificativa = `Explique por que a peça é necessária (mínimo ${LIMITES_PEDIDO.JUSTIFICATIVA_MIN} caracteres).`;
  } else if (just.length > LIMITES_PEDIDO.JUSTIFICATIVA_MAX) {
    erros.justificativa = `Máximo de ${LIMITES_PEDIDO.JUSTIFICATIVA_MAX} caracteres.`;
  }
  return erros;
}
