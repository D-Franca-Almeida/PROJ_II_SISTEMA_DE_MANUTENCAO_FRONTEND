import { STATUS } from '../status.js';
import { podeTransicionar, exigeMotivo } from '../transicoes.js';
import { validarNovaSolicitacao } from '../validacao.js';
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

/**
 * Backend falso em memória: mesmas operações da API real, com atraso
 * de rede e regras de transição. Os dados somem ao recarregar o app.
 *
 * @param {{ atrasoMs?: number, usuario?: string }} [opcoes]
 */
export function criarMockServidor({ atrasoMs = 600, usuario = 'usuario.mock' } = {}) {
  const solicitacoes = criarSolicitacoesIniciais();
  let proximoId = solicitacoes.length + 1;

  const esperar = () => new Promise((resolve) => setTimeout(resolve, atrasoMs));
  const buscar = (id) => {
    const s = solicitacoes.find((item) => item.id === Number(id));
    if (!s) throw erroHttp(404, 'Solicitação não encontrada.');
    return s;
  };

  return {
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
        solicitante: usuario,
        dataAbertura: agora,
        historico: [{ status: STATUS.SOLICITADA, usuario, data: agora, motivo: null }],
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
        usuario,
        data: new Date().toISOString(),
        motivo: motivo?.trim() || null,
      });
      return copia(s);
    },
  };
}
