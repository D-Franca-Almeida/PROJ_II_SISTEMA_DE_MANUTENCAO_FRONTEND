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

export const MSG_SEM_CORRECAO = 'Faça a correção antes de reenviar.';

/**
 * Reenvio da SSL devolvida (CPTM-35): só descrição e/ou foto mudam.
 * @param {{ descricao: string }} original
 * @param {{ descricao: string, foto: object | null }} correcao  foto = nova foto (null = mantém)
 * @returns {{ erros: Record<string, string>, semAlteracao: boolean }}
 */
export function validarReenvio(original, correcao) {
  const descricao = (correcao.descricao ?? '').trim();
  const mudouDescricao = descricao !== (original.descricao ?? '').trim();
  const semAlteracao = !mudouDescricao && !correcao.foto;

  const erros = {};
  if (descricao.length < LIMITES.DESCRICAO_MIN) {
    erros.descricao = `Descreva o problema (mínimo ${LIMITES.DESCRICAO_MIN} caracteres).`;
  } else if (descricao.length > LIMITES.DESCRICAO_MAX) {
    erros.descricao = `Máximo de ${LIMITES.DESCRICAO_MAX} caracteres.`;
  }
  return { erros, semAlteracao };
}

/**
 * Laudo obrigatório para concluir a OSM (CPTM-72).
 * @param {string} laudo
 */
export function validarLaudo(laudo) {
  const texto = (laudo ?? '').trim();
  if (texto.length < LIMITES.DESCRICAO_MIN) {
    return `Descreva o serviço realizado (mínimo ${LIMITES.DESCRICAO_MIN} caracteres).`;
  }
  if (texto.length > LIMITES.DESCRICAO_MAX) return `Máximo de ${LIMITES.DESCRICAO_MAX} caracteres.`;
  return null;
}

/** CPTM-80: documento do autorizado a retirar. */
export const TIPO_DOCUMENTO = Object.freeze({ CPF: 'CPF', MATRICULA: 'MATRICULA' });

/** Só dígitos. */
export const somenteDigitos = (texto) => String(texto ?? '').replace(/\D/g, '');

/** CPF com dígitos verificadores válidos (aceita com ou sem máscara). */
export function cpfValido(cpf) {
  const d = somenteDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (ate) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(d[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

/** "12345678909" -> "123.456.789-09" (formata enquanto digita). */
export function mascararCpf(texto) {
  const d = somenteDigitos(texto).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

/**
 * Autorização de retirada por terceiro (CPTM-80): os dois campos são obrigatórios.
 * @param {{ nome: string, tipoDocumento: string, documento: string }} dados
 */
export function validarAutorizacaoRetirada(dados) {
  const erros = {};
  const nome = (dados.nome ?? '').trim();
  if (nome.length < 3) erros.nome = 'Informe o nome completo de quem vai retirar.';
  else if (nome.length > 120) erros.nome = 'Máximo de 120 caracteres.';

  const doc = (dados.documento ?? '').trim();
  if (dados.tipoDocumento === TIPO_DOCUMENTO.CPF) {
    if (!doc) erros.documento = 'Informe o CPF.';
    else if (!cpfValido(doc)) erros.documento = 'CPF inválido.';
  } else if (dados.tipoDocumento === TIPO_DOCUMENTO.MATRICULA) {
    if (!doc) erros.documento = 'Informe a matrícula.';
    else if (!/^[A-Za-z0-9.-]{3,20}$/.test(doc)) erros.documento = 'Matrícula inválida.';
  } else {
    erros.documento = 'Escolha CPF ou matrícula.';
  }
  return erros;
}
