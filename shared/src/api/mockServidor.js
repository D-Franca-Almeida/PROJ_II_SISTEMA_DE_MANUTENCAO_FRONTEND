import { STATUS } from '../status.js';
import { podeTransicionar, exigeMotivo } from '../transicoes.js';
import { validarNovaSolicitacao, validarLaudo, validarMotivo, MSG_SEM_CORRECAO } from '../validacao.js';
import { STATUS_PEDIDO, pedidoPendente, podeCancelarPedido, validarPedidoPeca } from '../pecas.js';
import { PERFIL, gerarJwtFalso } from '../perfil.js';
import {
  calcularDiasParaExpirar,
  podeVerSolicitacao,
  podeCancelar,
  podeAssumir,
  podeVerHistorico,
  ehMinhaOsmAberta,
  STATUS_FILA_TECNICO,
} from '../regras.js';
import {
  EQUIPAMENTOS,
  AVARIAS,
  LOCALIDADES,
  criarSolicitacoesIniciais,
  criarPedidosIniciais,
  criarNotificacoesIniciais,
} from '../mocks/dados.js';

/** Erro no mesmo formato que o Axios devolve, para as telas tratarem igual. */
function erroHttp(status, mensagem, extra = {}) {
  const erro = new Error(mensagem);
  erro.response = { status, data: mensagem ? { erro: mensagem, ...extra } : '' };
  return erro;
}

const copia = (valor) => JSON.parse(JSON.stringify(valor));

/** Mesmos usuários do AuthService.cs da API (mock da Sprint 1), mais um 2º Comum e um 2º Técnico para testar 403. */
export const USUARIOS_MOCK = Object.freeze([
  { matricula: 'comum123', senha: 'senha', perfil: PERFIL.COMUM },
  { matricula: 'outro456', senha: 'senha', perfil: PERFIL.COMUM },
  { matricula: 'tec123', senha: 'senha', perfil: PERFIL.TECNICO },
  { matricula: 'tec456', senha: 'senha', perfil: PERFIL.TECNICO },
  { matricula: 'admin123', senha: 'senha', perfil: PERFIL.ADMINISTRATIVO },
]);

/**
 * Backend falso em memória: mesmas operações da API real, com atraso
 * de rede, perfis e regras de transição. Os dados somem ao recarregar o app.
 *
 * `obterSessao` devolve a sessão logada ({ matricula, perfil }) — faz o papel
 * do JWT que a API real lê das claims. Sem ela, usa `usuario` como Comum.
 *
 * @param {{
 *   atrasoMs?: number,
 *   usuario?: string,
 *   obterSessao?: () => ({ matricula: string, perfil: string } | null),
 * }} [opcoes]
 */
export function criarMockServidor({
  atrasoMs = 600,
  usuario = 'usuario.mock',
  obterSessao = () => ({ matricula: usuario, perfil: PERFIL.COMUM }),
} = {}) {
  const solicitacoes = criarSolicitacoesIniciais();
  let proximoId = solicitacoes.length + 1;
  let proximaOsm = Math.max(0, ...solicitacoes.map((s) => s.ordemServico?.id ?? 0)) + 1;
  const pedidos = criarPedidosIniciais();
  let proximoPedido = pedidos.length + 1;
  const notificacoes = criarNotificacoesIniciais();
  let proximaNotificacao = notificacoes.length + 1;

  const esperar = () => new Promise((resolve) => setTimeout(resolve, atrasoMs));

  /** Sessão obrigatória, como o [Authorize] da API: sem ela, 401. */
  const sessao = () => {
    const atual = obterSessao();
    if (!atual) throw erroHttp(401, 'Sessão expirada. Entre novamente.');
    return atual;
  };

  /** [Authorize(Policy = ...)]: perfil errado = 403 sem corpo (Forbid). */
  const exigirPerfil = (...perfis) => {
    const atual = sessao();
    if (!perfis.includes(atual.perfil)) throw erroHttp(403, '');
    return atual;
  };

  const buscar = (id) => {
    const s = solicitacoes.find((item) => item.id === Number(id));
    if (!s) throw erroHttp(404, `Solicitação ${id} não encontrada.`);
    return s;
  };

  /** Busca e aplica a regra de acesso (dono, Admin, técnico da OSM). */
  const buscarVisivel = (id) => {
    const s = buscar(id);
    if (!podeVerSolicitacao(s, sessao())) {
      throw erroHttp(403, 'Acesso negado: esta solicitação não é sua.');
    }
    return s;
  };

  /** Ações do solicitante: só o próprio Comum (outro dono = 403, como o CancelarTriagem da API). */
  const buscarDoDono = (id) => {
    const { matricula } = exigirPerfil(PERFIL.COMUM);
    const s = buscar(id);
    if (s.matriculaSolicitante !== matricula) throw erroHttp(403, '');
    return s;
  };

  /** Operações da OSM: só o técnico dono (outro técnico = 403) e só EM MANUTENCAO (400). */
  const buscarMinhaOsmAberta = (id) => {
    const { matricula } = exigirPerfil(PERFIL.TECNICO);
    const s = buscar(id);
    if (s.ordemServico?.matriculaTecnico !== matricula) {
      throw erroHttp(403, 'Esta OSM pertence a outro técnico.');
    }
    if (!ehMinhaOsmAberta(s, matricula)) {
      throw erroHttp(400, `A OSM não está EM MANUTENCAO (status atual: ${s.status}).`);
    }
    return s;
  };

  const pedidosDaOsm = (osmId) => pedidos.filter((p) => p.ordemServicoId === osmId);

  /** Rotas /ordens-servico/{osmId}/...: acha a SSL dona da OSM. */
  const idDaSolicitacaoPorOsm = (osmId) => {
    const s = solicitacoes.find((x) => x.ordemServico?.id === Number(osmId));
    if (!s) throw erroHttp(404, `Ordem de serviço ${osmId} não encontrada.`);
    return s.id;
  };

  /** Mudança de status + linha no histórico; avisa o dono quando outra pessoa mexeu (CPTM-86). */
  const registrar = (s, status, observacao = null) => {
    const agora = new Date().toISOString();
    const autor = sessao().matricula;
    s.status = status;
    s.dataStatus = agora;
    s.historico.push({ status, data: agora, usuario: autor, observacao });
    if (autor !== s.matriculaSolicitante) {
      notificacoes.push({
        id: proximaNotificacao++,
        matricula: s.matriculaSolicitante,
        solicitacaoId: s.id,
        lida: false,
        data: agora,
        mensagem: `${s.numero} mudou para ${status}.${observacao ? ` ${observacao}` : ''}`,
      });
    }
  };

  /** Saída no formato da API (com DiasParaExpirar calculado). */
  const saida = (s) => ({ ...copia(s), diasParaExpirar: calcularDiasParaExpirar(s) });
  const maisRecentes = (a, b) => b.dataAbertura.localeCompare(a.dataAbertura);

  return {
    async login(matricula, senha) {
      await esperar();
      const u = USUARIOS_MOCK.find(
        (x) => x.matricula === String(matricula).trim() && x.senha === senha,
      );
      if (!u) throw erroHttp(401, 'Matrícula ou senha inválidos.');
      return gerarJwtFalso({ Matricula: u.matricula, Perfil: u.perfil });
    },

    async listarEquipamentos() {
      await esperar();
      return copia(EQUIPAMENTOS);
    },
    async listarAvarias() {
      await esperar();
      return copia(AVARIAS);
    },
    async listarLocalidades() {
      await esperar();
      return copia(LOCALIDADES);
    },

    /** Visão administrativa (web). */
    async listarSolicitacoes({ status } = {}) {
      await esperar();
      const lista = status ? solicitacoes.filter((s) => s.status === status) : solicitacoes;
      return lista.map(saida).sort(maisRecentes);
    },

    /** CPTM-60/61: GET /solicitacoes/minhas — só as do usuário logado, mais recente primeiro. */
    async listarMinhasSolicitacoes() {
      await esperar();
      const { matricula } = sessao();
      return solicitacoes
        .filter((s) => s.matriculaSolicitante === matricula)
        .map(saida)
        .sort(maisRecentes);
    },

    /** CPTM-60/61: GET /solicitacoes/{id} — outro dono = 403. */
    async obterSolicitacao(id) {
      await esperar();
      return saida(buscarVisivel(id));
    },

    /** @param {import('../tipos.js').NovaSolicitacao} dados */
    async criarSolicitacao(dados) {
      await esperar();
      const { matricula } = exigirPerfil(PERFIL.COMUM, PERFIL.ADMINISTRATIVO);
      const erros = validarNovaSolicitacao(dados);
      if (Object.keys(erros).length) throw erroHttp(400, Object.values(erros)[0]);

      const agora = new Date().toISOString();
      const id = proximoId++;
      const nova = {
        id,
        numero: `SSL-2026-${String(id).padStart(5, '0')}`,
        equipamento: EQUIPAMENTOS.find((e) => e.id === dados.equipamentoId),
        avaria: AVARIAS.find((a) => a.id === dados.avariaId),
        localidade: LOCALIDADES.find((l) => l.id === dados.localidadeId),
        descricao: dados.descricao.trim(),
        fotoUrl: dados.foto?.uri ?? null,
        status: STATUS.SOLICITADA,
        motivoDevolucao: null,
        matriculaSolicitante: matricula,
        dataAbertura: agora,
        dataStatus: agora,
        ordemServico: null,
        autorizacaoRetirada: null,
        historico: [{ status: STATUS.SOLICITADA, data: agora, usuario: matricula, observacao: null }],
      };
      solicitacoes.push(nova);
      return saida(nova);
    },

    /**
     * CPTM-62/35: PUT /solicitacoes/{id}/reenviar — só DEVOLVIDA, só o dono,
     * precisa ter mudado a descrição e/ou a foto.
     * @param {{ descricao?: string | null, foto?: { uri: string } | null }} correcao
     */
    async reenviarSolicitacao(id, { descricao = null, foto = null } = {}) {
      await esperar();
      const s = buscarDoDono(id);
      if (s.status !== STATUS.DEVOLVIDA) {
        throw erroHttp(400, `Só é possível reenviar uma solicitação DEVOLVIDA (status atual: ${s.status}).`);
      }
      const novaDescricao = descricao?.trim();
      const mudouDescricao = !!novaDescricao && novaDescricao !== s.descricao;
      if (!mudouDescricao && !foto) throw erroHttp(400, MSG_SEM_CORRECAO);

      if (mudouDescricao) s.descricao = novaDescricao;
      if (foto) s.fotoUrl = foto.uri ?? s.fotoUrl;
      registrar(s, STATUS.REENVIADA, 'Corrigida pelo solicitante.');
      return { message: 'Solicitação reenviada para a triagem.' };
    },

    /**
     * CPTM-63/64: PUT /solicitacoes/{id}/cancelar — Comum só a própria (403),
     * Técnico proibido (403), RECEBIDA ou posterior = 400.
     */
    async cancelarSolicitacao(id) {
      await esperar();
      const { matricula, perfil } = exigirPerfil(PERFIL.COMUM, PERFIL.ADMINISTRATIVO);
      const s = buscar(id);
      if (perfil === PERFIL.COMUM && s.matriculaSolicitante !== matricula) throw erroHttp(403, '');
      if (!podeCancelar(s.status)) {
        throw erroHttp(400, `Não é possível cancelar uma solicitação com status ${s.status}.`);
      }
      registrar(s, STATUS.CANCELADA, 'Cancelada pelo solicitante.');
      return { message: 'Solicitação cancelada.' };
    },

    /** CPTM-37: fila do técnico (RECEBIDAS), mais antiga primeiro. */
    async listarFilaTecnico() {
      await esperar();
      exigirPerfil(PERFIL.TECNICO);
      return solicitacoes
        .filter((s) => s.status === STATUS_FILA_TECNICO)
        .map(saida)
        .sort((a, b) => a.dataStatus.localeCompare(b.dataStatus));
    },

    /** CPTM-37: "Minhas manutenções" — SSLs com OSM do técnico; abertas primeiro. */
    async listarMinhasManutencoes() {
      await esperar();
      const { matricula } = exigirPerfil(PERFIL.TECNICO);
      const aberta = (s) => (s.status === STATUS.MANUTENCAO ? 0 : 1);
      return solicitacoes
        .filter((s) => s.ordemServico?.matriculaTecnico === matricula)
        .map(saida)
        .sort((a, b) => aberta(a) - aberta(b) || b.dataStatus.localeCompare(a.dataStatus));
    },

    /** CPTM-70/36/37: PUT /solicitacoes/{id}/iniciar-manutencao — só Técnico, só RECEBIDA. */
    async iniciarManutencao(id) {
      await esperar();
      const { matricula } = exigirPerfil(PERFIL.TECNICO);
      const s = buscar(id);
      if (!podeAssumir(s)) {
        throw erroHttp(
          400,
          `Transição inválida: só é possível iniciar a manutenção de uma solicitação ${STATUS_FILA_TECNICO} (status atual: ${s.status}).`,
        );
      }
      const agora = new Date().toISOString();
      s.ordemServico = {
        id: proximaOsm++,
        matriculaTecnico: matricula,
        dataInicio: agora,
        dataFim: null,
        laudo: null,
        motivoNaoExecucao: null,
      };
      registrar(s, STATUS.MANUTENCAO, 'Manutenção iniciada (OSM aberta).');
      return {
        mensagem: 'Manutenção iniciada com sucesso. Ordem de Serviço (OSM) aberta.',
        solicitacaoId: s.id,
        tecnicoResponsavel: matricula,
        novoStatus: STATUS.MANUTENCAO,
      };
    },

    /** CPTM-71/72: PUT /{id}/concluir { laudo } — bloqueia se houver peça pendente. */
    async concluirManutencao(id, laudo) {
      await esperar();
      const s = buscarMinhaOsmAberta(id);
      const erroLaudo = validarLaudo(laudo);
      if (erroLaudo) throw erroHttp(400, erroLaudo);

      const pendentes = pedidosDaOsm(s.ordemServico.id).filter((p) => pedidoPendente(p.status));
      if (pendentes.length) {
        throw erroHttp(
          400,
          'Não é possível concluir: há pedidos de peça pendentes. Aguarde o recebimento ou cancele-os.',
          { pecasPendentes: copia(pendentes) },
        );
      }
      s.ordemServico.laudo = laudo.trim();
      s.ordemServico.dataFim = new Date().toISOString();
      registrar(s, STATUS.CONCLUIDA, laudo.trim());
      return { message: 'Manutenção concluída.' };
    },

    /** CPTM-71/72: PUT /{id}/nao-executar { motivo } — cancela os pedidos pendentes (CPTM-76). */
    async naoExecutarManutencao(id, motivo) {
      await esperar();
      const s = buscarMinhaOsmAberta(id);
      const erroMotivo = validarMotivo(motivo);
      if (erroMotivo) throw erroHttp(400, erroMotivo);

      for (const p of pedidosDaOsm(s.ordemServico.id)) {
        if (pedidoPendente(p.status)) p.status = STATUS_PEDIDO.CANCELADO;
      }
      s.ordemServico.motivoNaoExecucao = motivo.trim();
      s.ordemServico.dataFim = new Date().toISOString();
      registrar(s, STATUS.NAO_EXECUTADA, motivo.trim());
      return { message: 'Manutenção registrada como não executada.' };
    },

    /** CPTM-38/73: POST /ordens-servico/{osmId}/pecas — só o técnico dono, OSM EM MANUTENCAO. */
    async pedirPeca(osmId, dados) {
      await esperar();
      const s = buscarMinhaOsmAberta(idDaSolicitacaoPorOsm(osmId));
      const erros = validarPedidoPeca(dados);
      if (Object.keys(erros).length) throw erroHttp(400, Object.values(erros)[0]);

      const pedido = {
        id: proximoPedido++,
        ordemServicoId: s.ordemServico.id,
        item: dados.item.trim(),
        quantidade: Number(dados.quantidade),
        justificativa: dados.justificativa.trim(),
        status: STATUS_PEDIDO.SOLICITADO,
        dataPedido: new Date().toISOString(),
      };
      pedidos.push(pedido);
      return copia(pedido); // 201 Created
    },

    /** CPTM-74/76: GET /ordens-servico/{osmId}/pecas — técnico dono (ou Admin), mais recente primeiro. */
    async listarPedidosPeca(osmId) {
      await esperar();
      const atual = exigirPerfil(PERFIL.TECNICO, PERFIL.ADMINISTRATIVO);
      const s = buscar(idDaSolicitacaoPorOsm(osmId));
      if (atual.perfil === PERFIL.TECNICO && s.ordemServico.matriculaTecnico !== atual.matricula) {
        throw erroHttp(403, 'Esta OSM pertence a outro técnico.');
      }
      return copia(pedidosDaOsm(s.ordemServico.id)).sort((a, b) => b.dataPedido.localeCompare(a.dataPedido));
    },

    /** CPTM-74/76: cancelar pedido — só o técnico dono, só SOLICITADO ou ENCAMINHADO. */
    async cancelarPedidoPeca(osmId, pedidoId) {
      await esperar();
      const s = buscarMinhaOsmAberta(idDaSolicitacaoPorOsm(osmId));
      const pedido = pedidosDaOsm(s.ordemServico.id).find((p) => p.id === Number(pedidoId));
      if (!pedido) throw erroHttp(404, `Pedido ${pedidoId} não encontrado.`);
      if (!podeCancelarPedido(pedido.status)) {
        throw erroHttp(400, `Só é possível cancelar pedidos SOLICITADO ou ENCAMINHADO (status atual: ${pedido.status}).`);
      }
      pedido.status = STATUS_PEDIDO.CANCELADO;
      return copia(pedido);
    },

    /**
     * Só para testes/demonstração: avança o pedido como faria o Administrativo no web
     * (SOLICITADO -> ENCAMINHADO -> RECEBIDO).
     */
    async _avancarPedidoPeca(pedidoId) {
      const pedido = pedidos.find((p) => p.id === Number(pedidoId));
      const proximo = {
        [STATUS_PEDIDO.SOLICITADO]: STATUS_PEDIDO.ENCAMINHADO,
        [STATUS_PEDIDO.ENCAMINHADO]: STATUS_PEDIDO.RECEBIDO,
      }[pedido?.status];
      if (!proximo) throw erroHttp(400, 'Pedido não pode avançar.');
      pedido.status = proximo;
      return copia(pedido);
    },

    /** CPTM-87/89: GET /solicitacoes/{id}/historico — dono, Admin e técnico da OSM. */
    async listarHistorico(id) {
      await esperar();
      const s = buscar(id);
      if (!podeVerHistorico(s, sessao())) throw erroHttp(403, 'Acesso negado ao histórico desta solicitação.');
      return copia(s.historico).sort((a, b) => a.data.localeCompare(b.data));
    },

    /** CPTM-84/86: GET /notificacoes — só as do usuário logado. */
    async listarNotificacoes() {
      await esperar();
      const { matricula } = sessao();
      return notificacoes
        .filter((n) => n.matricula === matricula)
        .map(({ matricula: _m, ...n }) => copia(n))
        .sort((a, b) => b.data.localeCompare(a.data));
    },

    /** CPTM-84/86: PUT /notificacoes/{id}/lida — só a própria (403). */
    async marcarNotificacaoLida(id) {
      await esperar();
      const { matricula } = sessao();
      const n = notificacoes.find((x) => x.id === Number(id));
      if (!n) throw erroHttp(404, 'Notificação não encontrada.');
      if (n.matricula !== matricula) throw erroHttp(403, '');
      n.lida = true;
      return { message: 'Notificação marcada como lida.' };
    },

    /** Triagem genérica (web/admin). */
    async alterarStatus(id, novoStatus, motivo = null) {
      await esperar();
      const s = buscar(id);
      if (!podeTransicionar(s.status, novoStatus)) {
        throw erroHttp(400, `Não é possível passar de ${s.status} para ${novoStatus}.`);
      }
      if (exigeMotivo(novoStatus) && !motivo?.trim()) {
        throw erroHttp(400, 'Motivo obrigatório.');
      }
      registrar(s, novoStatus, motivo?.trim() || null);
      if (novoStatus === STATUS.DEVOLVIDA) s.motivoDevolucao = motivo.trim();
      return saida(s);
    },
  };
}
