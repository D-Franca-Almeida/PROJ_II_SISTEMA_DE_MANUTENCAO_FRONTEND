import { STATUS } from '../status.js';
import { podeTransicionar, exigeMotivo } from '../transicoes.js';
import { validarNovaSolicitacao } from '../validacao.js';
import { PERFIL, gerarJwtFalso } from '../perfil.js';
import { calcularDiasParaExpirar, podeVerSolicitacao } from '../regras.js';
import {
  EQUIPAMENTOS,
  AVARIAS,
  LOCALIDADES,
  criarSolicitacoesIniciais,
} from '../mocks/dados.js';

/** Erro no mesmo formato que o Axios devolve, para as telas tratarem igual. */
function erroHttp(status, mensagem) {
  const erro = new Error(mensagem);
  erro.response = { status, data: mensagem ? { erro: mensagem } : '' };
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

  /** Mudança de status + linha no histórico. */
  const registrar = (s, status, observacao = null) => {
    const agora = new Date().toISOString();
    s.status = status;
    s.dataStatus = agora;
    s.historico.push({ status, data: agora, usuario: sessao().matricula, observacao });
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
