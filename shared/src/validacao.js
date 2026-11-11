export const LIMITES = Object.freeze({
  DESCRICAO_MIN: 10,
  DESCRICAO_MAX: 500,
});

/**
 * Valida o formulário de Nova Solicitação (CPTM-30).
 * @param {import('./tipos.js').NovaSolicitacao} dados
 * @returns {Record<string, string>} erros por campo (vazio = válido)
 */
export function validarNovaSolicitacao(dados) {
  const erros = {};
  if (!dados.equipamentoId) erros.equipamentoId = 'Selecione o equipamento.';
  if (!dados.avariaId) erros.avariaId = 'Selecione a avaria.';
  if (!dados.localidadeId) erros.localidadeId = 'Selecione a localidade.';

  const descricao = (dados.descricao ?? '').trim();
  if (descricao.length < LIMITES.DESCRICAO_MIN) {
    erros.descricao = `Descreva o problema (mínimo ${LIMITES.DESCRICAO_MIN} caracteres).`;
  } else if (descricao.length > LIMITES.DESCRICAO_MAX) {
    erros.descricao = `Máximo de ${LIMITES.DESCRICAO_MAX} caracteres.`;
  }

  if (!dados.foto) erros.foto = 'Tire uma foto do equipamento.';
  return erros;
}

/**
 * Motivo obrigatório para devolver/cancelar (CPTM-34).
 * @param {string} motivo
 */
export function validarMotivo(motivo) {
  const texto = (motivo ?? '').trim();
  if (texto.length < 5) return 'Informe o motivo (mínimo 5 caracteres).';
  if (texto.length > LIMITES.DESCRICAO_MAX) return `Máximo de ${LIMITES.DESCRICAO_MAX} caracteres.`;
  return null;
}
