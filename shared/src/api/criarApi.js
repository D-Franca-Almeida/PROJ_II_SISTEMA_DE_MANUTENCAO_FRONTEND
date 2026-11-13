import { criarMockServidor } from './mockServidor.js';
import {
  normalizarSolicitacao,
  normalizarLista,
  normalizarListaHistorico,
  normalizarNotificacao,
} from './normalizar.js';

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
  minhas: '/solicitacoes/minhas',
  solicitacao: (id) => `/solicitacoes/${id}`,
  status: (id) => `/solicitacoes/${id}/status`,
  reenviar: (id) => `/solicitacoes/${id}/reenviar`,
  cancelar: (id) => `/solicitacoes/${id}/cancelar`,
  // CPTM-87 (a fazer no backend)
  historico: (id) => `/solicitacoes/${id}/historico`,
  // CPTM-70/36: existe no SolicitacoesController (hoje exige APROVADA; refinamento pede RECEBIDA)
  iniciarManutencao: (id) => `/solicitacoes/${id}/iniciar-manutencao`,
  // CPTM-71 (em andamento): prefixo a confirmar no controller
  concluir: (id) => `/solicitacoes/${id}/concluir`,
  naoExecutar: (id) => `/solicitacoes/${id}/nao-executar`,
  // CPTM-38 (a fazer no backend)
  pecas: (osmId) => `/ordens-servico/${osmId}/pecas`,
  // CPTM-74 (em andamento no backend): rota de cancelamento a confirmar
  cancelarPedido: (osmId, pedidoId) => `/ordens-servico/${osmId}/pecas/${pedidoId}/cancelar`,
  // CPTM-84 (a fazer no backend)
  notificacoes: '/notificacoes',
  notificacaoLida: (id) => `/notificacoes/${id}/lida`,
  // A CONFIRMAR: rotas das listas do técnico ainda não existem no backend
  minhasManutencoes: '/ordens-servico/minhas',
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
 * Multipart do PUT /solicitacoes/{id}/reenviar (CPTM-62): manda só o que mudou.
 * @param {{ descricao?: string | null, foto?: object | null }} correcao
 */
export function montarFormDataReenvio({ descricao, foto }) {
  const form = new FormData();
  if (descricao != null) form.append('descricao', descricao.trim());
  if (foto) form.append('foto', /** @type {any} */ (foto));
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
      http.get(ROTAS.solicitacoes, { params: status ? { status } : undefined }).then(dados).then(normalizarLista),

    /** CPTM-60: GET /solicitacoes/minhas (mais recente primeiro) */
    listarMinhasSolicitacoes: () => http.get(ROTAS.minhas).then(dados).then(normalizarLista),

    /** CPTM-60: GET /solicitacoes/{id} (403 se for de outro dono) */
    obterSolicitacao: (id) => http.get(ROTAS.solicitacao(id)).then(dados).then(normalizarSolicitacao),

    criarSolicitacao: (nova) =>
      http
        .post(ROTAS.solicitacoes, montarFormData(nova), {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then(dados)
        .then(normalizarSolicitacao),

    /** CPTM-62: PUT /solicitacoes/{id}/reenviar (multipart: descricao e/ou foto) -> REENVIADA */
    reenviarSolicitacao: (id, correcao) =>
      http
        .put(ROTAS.reenviar(id), montarFormDataReenvio(correcao), {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then(dados),

    /** CPTM-63: PUT /solicitacoes/{id}/cancelar (já existe no SolicitacoesController) */
    cancelarSolicitacao: (id) => http.put(ROTAS.cancelar(id)).then(dados),

    /** CPTM-37: fila para assumir = SSLs RECEBIDAS. A CONFIRMAR: rota/filtro no backend. */
    listarFilaTecnico: () =>
      http.get(ROTAS.solicitacoes, { params: { status: 'RECEBIDA' } }).then(dados).then(normalizarLista),

    /** CPTM-37: SSLs com OSM do técnico logado. A CONFIRMAR: rota no backend. */
    listarMinhasManutencoes: () => http.get(ROTAS.minhasManutencoes).then(dados).then(normalizarLista),

    /** CPTM-70/36: PUT /solicitacoes/{id}/iniciar-manutencao (só Técnico) -> EM MANUTENCAO + OSM */
    iniciarManutencao: (id) => http.put(ROTAS.iniciarManutencao(id)).then(dados),

    /** CPTM-71/72: PUT /{id}/concluir { laudo } -> CONCLUIDA (400 com pecasPendentes se houver) */
    concluirManutencao: (id, laudo) => http.put(ROTAS.concluir(id), { laudo: laudo.trim() }).then(dados),

    /** CPTM-71/72: PUT /{id}/nao-executar { motivo } -> NAO EXECUTADA (cancela pedidos pendentes) */
    naoExecutarManutencao: (id, motivo) =>
      http.put(ROTAS.naoExecutar(id), { motivo: motivo.trim() }).then(dados),

    /** CPTM-38/73: POST /ordens-servico/{id}/pecas { item, quantidade, justificativa } -> 201 SOLICITADO */
    pedirPeca: (osmId, { item, quantidade, justificativa }) =>
      http
        .post(ROTAS.pecas(osmId), {
          item: item.trim(),
          quantidade: Number(quantidade),
          justificativa: justificativa.trim(),
        })
        .then(dados),

    /** CPTM-74/76: GET /ordens-servico/{id}/pecas — pedidos da OSM com status */
    listarPedidosPeca: (osmId) => http.get(ROTAS.pecas(osmId)).then(dados),

    /** CPTM-74/76: PUT /ordens-servico/{id}/pecas/{pedidoId}/cancelar — só SOLICITADO/ENCAMINHADO */
    cancelarPedidoPeca: (osmId, pedidoId) => http.put(ROTAS.cancelarPedido(osmId, pedidoId)).then(dados),

    /** CPTM-87/89: GET /solicitacoes/{id}/historico — ordem cronológica */
    listarHistorico: (id) => http.get(ROTAS.historico(id)).then(dados).then(normalizarListaHistorico),

    /** CPTM-84/86: GET /notificacoes — do usuário logado, mais recente primeiro */
    listarNotificacoes: () =>
      http
        .get(ROTAS.notificacoes)
        .then(dados)
        .then((lista) =>
          (Array.isArray(lista) ? lista.map(normalizarNotificacao) : []).sort((a, b) =>
            String(b.data ?? '').localeCompare(String(a.data ?? '')),
          ),
        ),

    /** CPTM-84/86: PUT /notificacoes/{id}/lida */
    marcarNotificacaoLida: (id) => http.put(ROTAS.notificacaoLida(id)).then(dados),

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
