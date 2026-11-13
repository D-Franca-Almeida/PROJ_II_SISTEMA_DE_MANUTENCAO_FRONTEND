import { STATUS } from '../status.js';
import { podeTransicionar, exigeMotivo } from '../transicoes.js';
import { validarNovaSolicitacao } from '../validacao.js';
import { PERFIL, gerarJwtFalso } from '../perfil.js';
import {
  EQUIPAMENTOS,
  AVARIAS,
  LOCALIDADES,
  criarSolicitacoesIniciais,
} from '../mocks/dados.js';

/** Erro no mesmo formato que o Axios devolve, para as telas tratarem igual. */
function erroHttp(status, mensagem) {
  const erro = new Error(mensagem);
  erro.response = { status, data: { mensagem } };
  return erro;
}

const copia = (valor) => JSON.parse(JSON.stringify(valor));

/** Mesmos usuários do AuthService.cs da API (mock da Sprint 1), mais um 2º Comum para testar 403. */
export const USUARIOS_MOCK = Object.freeze([
  { matricula: 'comum123', senha: 'senha', perfil: PERFIL.COMUM },
  { matricula: 'outro456', senha: 'senha', perfil: PERFIL.COMUM },
  { matricula: 'tec123', senha: 'senha', perfil: PERFIL.TECNICO },
  { matricula: 'tec456', senha: 'senha', perfil: PERFIL.TECNICO },
  { matricula: 'admin123', senha: 'senha', perfil: PERFIL.ADMINISTRATIVO },
]);

/**
 * Backend falso em memória: mesmas operações da API real, com atraso
 * de rede e regras de transição. Os dados somem ao recarregar o app.
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
  const buscar = (id) => {
    const s = solicitacoes.find((item) => item.id === Number(id));
    if (!s) throw erroHttp(404, 'Solicitação não encontrada.');
    return s;
  };

  /** Sessão obrigatória, como o [Authorize] da API: sem ela, 401. */
  const sessao = () => {
    const atual = obterSessao();
    if (!atual) throw erroHttp(401, 'Sessão expirada. Entre novamente.');
    return atual;
  };

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

    async listarSolicitacoes({ status } = {}) {
      await esperar();
      const lista = status ? solicitacoes.filter((s) => s.status === status) : solicitacoes;
      return copia(lista).sort((a, b) => b.dataAbertura.localeCompare(a.dataAbertura));
    },

    async obterSolicitacao(id) {
      await esperar();
      return copia(buscar(id));
    },

    /** @param {import('../tipos.js').NovaSolicitacao} dados */
    async criarSolicitacao(dados) {
      await esperar();
      const erros = validarNovaSolicitacao(dados);
      if (Object.keys(erros).length) throw erroHttp(400, Object.values(erros)[0]);

      const { matricula } = sessao();
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
        solicitante: matricula,
        dataAbertura: agora,
        historico: [{ status: STATUS.SOLICITADA, usuario: matricula, data: agora, motivo: null }],
      };
      solicitacoes.push(nova);
      return copia(nova);
    },

    async alterarStatus(id, novoStatus, motivo = null) {
      await esperar();
      const s = buscar(id);
      if (!podeTransicionar(s.status, novoStatus)) {
        throw erroHttp(409, `Não é possível passar de ${s.status} para ${novoStatus}.`);
      }
      if (exigeMotivo(novoStatus) && !motivo?.trim()) {
        throw erroHttp(400, 'Motivo obrigatório.');
      }
      s.status = novoStatus;
      s.historico.push({
        status: novoStatus,
        usuario: sessao().matricula,
        data: new Date().toISOString(),
        motivo: motivo?.trim() || null,
      });
      return copia(s);
    },
  };
}
