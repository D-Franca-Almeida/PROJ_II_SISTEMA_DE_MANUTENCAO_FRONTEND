import { criarMockServidor } from './mockServidor.js';

/**
 * Rotas da API .NET. Pendências de alinhamento:
 * - status: diagramas usam PUT /solicitacoes/{id}/status; o Jira (CPTM-34)
 *   fala em PUT /aprovar e /devolver — confirmar com o Daniel.
 * - catálogos (equipamentos, avarias, localidades): rotas ainda não
 *   definidas no Jira — confirmar com o Diego.
 */
export const ROTAS = Object.freeze({
  login: '/auth/login',
  solicitacoes: '/solicitacoes',
  solicitacao: (id) => `/solicitacoes/${id}`,
  status: (id) => `/solicitacoes/${id}/status`,
  equipamentos: '/equipamentos',
  avarias: '/avarias',
  localidades: '/localidades',
});

/**
 * Monta o multipart do POST /solicitacoes (o backend lê a foto via IFormFile).
 * @param {import('../tipos.js').NovaSolicitacao} dados
 */
export function montarFormData(dados) {
  const form = new FormData();
  form.append('equipamentoId', String(dados.equipamentoId));
  form.append('avariaId', String(dados.avariaId));
  form.append('localidadeId', String(dados.localidadeId));
  form.append('descricao', dados.descricao.trim());
  if (dados.foto) form.append('foto', /** @type {any} */ (dados.foto));
  return form;
}

/**
 * Cria o cliente da API com interruptor mock/real. Cada app passa a sua
 * instância do Axios (shared/ não tem dependências).
 *
 * @param {{ http?: import('axios').AxiosInstance, usarMock?: boolean, mock?: ReturnType<typeof criarMockServidor> }} opcoes
 */
export function criarApi({ http, usarMock = false, mock } = {}) {
  if (usarMock) return mock ?? criarMockServidor();
  if (!http) throw new Error('criarApi: informe "http" (instância do Axios) ou usarMock: true.');

  const dados = (resposta) => resposta.data;

  return {
    /** POST /api/auth/login { matricula, senha } -> { token } (AuthController.cs) */
    login: (matricula, senha) =>
      http.post(ROTAS.login, { matricula: String(matricula).trim(), senha }).then((r) => r.data.token),

    listarEquipamentos: () => http.get(ROTAS.equipamentos).then(dados),
    listarAvarias: () => http.get(ROTAS.avarias).then(dados),
    listarLocalidades: () => http.get(ROTAS.localidades).then(dados),

    listarSolicitacoes: ({ status } = {}) =>
      http.get(ROTAS.solicitacoes, { params: status ? { status } : undefined }).then(dados),

    obterSolicitacao: (id) => http.get(ROTAS.solicitacao(id)).then(dados),

    criarSolicitacao: (nova) =>
      http
        .post(ROTAS.solicitacoes, montarFormData(nova), {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then(dados),

    alterarStatus: (id, status, motivo = null) =>
      http.put(ROTAS.status(id), { status, motivo }).then(dados),
  };
}

const MENSAGEM_PADRAO = {
  401: 'Sessão expirada. Entre novamente.',
  403: 'Acesso negado: você não tem permissão para esta ação.',
  404: 'Registro não encontrado.',
};

/**
 * Extrai uma mensagem legível de um erro do Axios ou do mock.
 * A API devolve { erro }, { message } ou { mensagem }; o Forbid() do .NET vem sem corpo.
 */
export function mensagemDeErro(erro) {
  const resposta = erro?.response;
  if (!resposta) return 'Sem conexão com o servidor. Verifique a rede e tente novamente.';
  const corpo = resposta.data;
  if (typeof corpo === 'string' && corpo.trim()) return corpo;
  return (
    corpo?.erro ??
    corpo?.mensagem ??
    corpo?.message ??
    MENSAGEM_PADRAO[resposta.status] ??
    corpo?.title ??
    `Erro ${resposta.status} ao falar com o servidor.`
  );
}

/** @param {any} erro @returns {number | null} status HTTP do erro, se houver */
export function statusDoErro(erro) {
  return erro?.response?.status ?? null;
}
