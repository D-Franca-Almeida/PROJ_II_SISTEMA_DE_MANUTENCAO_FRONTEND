import type { Usuario } from "@/lib/auth";
import { TEC_A, TEC_B } from "@/lib/tecnicos/registro";
import type { OrdemServico } from "./types";

/**
 * In-memory stand-in for the real backend. Fictitious data only; resets when
 * the server restarts. State lives on globalThis so all route handlers share it.
 */

const DIA = 24 * 60 * 60 * 1000;

function semear(): OrdemServico[] {
  const agora = Date.now();
  const ano = new Date(agora).getFullYear();
  const osm = (n: number) => `OSM-${ano}-${String(n).padStart(5, "0")}`;
  const ssl = (n: number) => `SSL-${ano}-${String(n).padStart(5, "0")}`;
  const aberta = { dataConclusao: null, laudo: null, motivoNaoExecucao: null };

  // Linked to mock solicitações that are in a matching stage.
  return [
    {
      id: osm(1),
      solicitacaoId: ssl(6),
      equipamento: { codigo: "QFJ0214", descricao: "MOTORES ELÉTRICOS" },
      tecnico: TEC_A,
      status: "EM_MANUTENCAO",
      ...aberta,
    },
    {
      id: osm(2),
      solicitacaoId: ssl(5),
      equipamento: {
        codigo: "QFN0420",
        descricao: "BANCADA DE TESTE DE RELÉS",
      },
      tecnico: TEC_B,
      status: "EM_MANUTENCAO",
      ...aberta,
    },
    {
      id: osm(3),
      solicitacaoId: ssl(7),
      equipamento: {
        codigo: "QFM0731",
        descricao: "FONTE DE ALIMENTAÇÃO 110 V",
      },
      tecnico: TEC_A,
      status: "ABERTA",
      ...aberta,
    },
    {
      id: osm(4),
      solicitacaoId: ssl(4),
      equipamento: { codigo: "QFL0057", descricao: "MULTÍMETRO DIGITAL" },
      tecnico: TEC_B,
      status: "CONCLUIDA",
      dataConclusao: new Date(agora - 3 * DIA).toISOString(),
      laudo:
        "Ponteiras substituídas e contatos internos limpos. Leituras conferidas contra o padrão da bancada.",
      motivoNaoExecucao: null,
    },
    {
      id: osm(5),
      solicitacaoId: ssl(3),
      equipamento: { codigo: "QFJ0388", descricao: "COMPRESSOR DE AR" },
      tecnico: TEC_A,
      status: "CONCLUIDA",
      dataConclusao: new Date(agora - 6 * DIA).toISOString(),
      laudo:
        "Válvula de retenção substituída; reservatório mantém a pressão por 24 h.",
      motivoNaoExecucao: null,
    },
    {
      id: osm(6),
      solicitacaoId: ssl(2),
      equipamento: {
        codigo: "QFN0420",
        descricao: "BANCADA DE TESTE DE RELÉS",
      },
      tecnico: TEC_B,
      status: "CONCLUIDA",
      dataConclusao: new Date(agora - 20 * DIA).toISOString(),
      laudo: "Relé interno trocado e bancada recalibrada.",
      motivoNaoExecucao: null,
    },
    {
      id: osm(7),
      solicitacaoId: ssl(1),
      equipamento: { codigo: "QFJ0214", descricao: "MOTORES ELÉTRICOS" },
      tecnico: TEC_A,
      status: "CONCLUIDA",
      dataConclusao: new Date(agora - 30 * DIA).toISOString(),
      laudo:
        "Rolamentos e ventoinha substituídos; temperatura em regime dentro do limite.",
      motivoNaoExecucao: null,
    },
  ];
}

const global = globalThis as typeof globalThis & {
  __cptmOrdens?: OrdemServico[];
};

export function todasAsOrdens(): OrdemServico[] {
  global.__cptmOrdens ??= semear();
  return global.__cptmOrdens;
}

export function buscarOrdem(id: string): OrdemServico | undefined {
  return todasAsOrdens().find((o) => o.id === id);
}

export type ResultadoOrdem =
  | { ok: true; ordem: OrdemServico }
  | { ok: false; status: 400 | 403 | 404; erro: string };

const falha = (status: 400 | 403 | 404, erro: string): ResultadoOrdem => ({
  ok: false,
  status,
  erro,
});

/** Shared gate: the order exists, the caller owns it, and it is em manutenção. */
function ordemDoTecnico(id: string, autor: Usuario): ResultadoOrdem {
  const ordem = buscarOrdem(id);
  if (!ordem) return falha(404, "Ordem de serviço não encontrada.");
  if (ordem.tecnico.matricula !== autor.matricula) {
    return falha(
      403,
      "Só o técnico responsável pela ordem de serviço pode encerrá-la.",
    );
  }
  if (ordem.status !== "EM_MANUTENCAO") {
    return falha(
      400,
      "Só é possível encerrar uma ordem de serviço que está em manutenção.",
    );
  }
  return { ok: true, ordem };
}

/** → CONCLUIDA. The report (laudo) is mandatory. */
export function concluir(
  id: string,
  laudo: string,
  autor: Usuario,
): ResultadoOrdem {
  const resultado = ordemDoTecnico(id, autor);
  if (!resultado.ok) return resultado;
  Object.assign(resultado.ordem, {
    status: "CONCLUIDA",
    dataConclusao: new Date().toISOString(),
    laudo,
    motivoNaoExecucao: null,
  } satisfies Partial<OrdemServico>);
  return resultado;
}

/** → NAO_EXECUTADA. The reason is mandatory. */
export function naoExecutar(
  id: string,
  motivo: string,
  autor: Usuario,
): ResultadoOrdem {
  const resultado = ordemDoTecnico(id, autor);
  if (!resultado.ok) return resultado;
  Object.assign(resultado.ordem, {
    status: "NAO_EXECUTADA",
    dataConclusao: new Date().toISOString(),
    laudo: null,
    motivoNaoExecucao: motivo,
  } satisfies Partial<OrdemServico>);
  return resultado;
}
