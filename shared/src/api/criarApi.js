import { criarMockServidor } from './mockServidor.js';

/**
 * Rotas da API .NET. Pendências de alinhamento:
 * - status: diagramas usam PUT /solicitacoes/{id}/status; o Jira (CPTM-34)
 *   fala em PUT /aprovar e /devolver — confirmar com o Daniel.
 * - catálogos (equipamentos, avarias, localidades): rotas ainda não
 *   definidas no Jira — confirmar com o Diego.
 */
export const ROTAS = Object.freeze({
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

/** Extrai uma mensagem legível de um erro do Axios ou do mock. */
export function mensagemDeErro(erro) {
  const resposta = erro?.response;
  if (!resposta) return 'Sem conexão com o servidor. Verifique a rede e tente novamente.';
  const corpo = resposta.data;
  if (typeof corpo === 'string' && corpo) return corpo;
  return corpo?.mensagem ?? corpo?.title ?? `Erro ${resposta.status} ao falar com o servidor.`;
}
