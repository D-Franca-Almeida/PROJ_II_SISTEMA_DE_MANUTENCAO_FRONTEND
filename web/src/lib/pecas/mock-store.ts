import type { Usuario } from "@/lib/auth";
import { buscarOrdem, todasAsOrdens } from "@/lib/ordens-servico/mock-store";
import type { OrdemServico } from "@/lib/ordens-servico/types";
import type { NovoPedidoPeca } from "./schemas";
import type { PedidoPeca, StatusPedido } from "./types";

/**
 * In-memory stand-in for the real backend. Fictitious data only; resets when
 * the server restarts. State lives on globalThis so all route handlers share it.
 */

const HORA = 60 * 60 * 1000;

type Banco = { pedidos: PedidoPeca[] };

function semear(): Banco {
  const agora = Date.now();
  const ano = new Date(agora).getFullYear();

  const ordens = todasAsOrdens();

  const sementes: {
    ordem: OrdemServico;
    item: string;
    quantidade: number;
    justificativa: string;
    status: StatusPedido;
    ha: number;
  }[] = [
    {
      ordem: ordens[0],
      item: "Rolamento 6204 ZZ",
      quantidade: 2,
      justificativa:
        "Os dois rolamentos do eixo estão com folga e ruído; sem a troca o motor não passa no ensaio.",
      status: "SOLICITADO",
      ha: 2,
    },
    {
      ordem: ordens[1],
      item: "Relé auxiliar 24 Vcc",
      quantidade: 4,
      justificativa: "Relés internos da bancada colados após o ensaio.",
      status: "SOLICITADO",
      ha: 7,
    },
    {
      ordem: ordens[0],
      item: "Graxa para rolamento, bisnaga 500 g",
      quantidade: 1,
      justificativa: "Estoque da oficina acabou.",
      status: "SOLICITADO",
      ha: 26,
    },
    {
      ordem: ordens[1],
      item: "Disjuntor bipolar 10 A",
      quantidade: 1,
      justificativa: "Disjuntor do painel desarma sem carga.",
      status: "ENCAMINHADO",
      ha: 2 * 24,
    },
    {
      ordem: ordens[0],
      item: "Capacitor de partida 40 µF",
      quantidade: 1,
      justificativa: "Capacitor estufado, motor não parte.",
      status: "ENCAMINHADO",
      ha: 3 * 24,
    },
    {
      ordem: ordens[3],
      item: "Par de ponteiras de prova",
      quantidade: 1,
      justificativa: "Ponteiras originais com mau contato.",
      status: "RECEBIDO",
      ha: 8 * 24,
    },
    {
      ordem: ordens[1],
      item: "Fonte chaveada 24 V 5 A",
      quantidade: 1,
      justificativa: "Pedido em duplicidade; a fonte atual foi recuperada.",
      status: "CANCELADO",
      ha: 5 * 24,
    },
  ];

  const pedidos = sementes
    .sort((a, b) => b.ha - a.ha)
    .map((s, i) => ({
      id: `PP-${ano}-${String(i + 1).padStart(5, "0")}`,
      ordemServicoId: s.ordem.id,
      equipamento: s.ordem.equipamento,
      item: s.item,
      quantidade: s.quantidade,
      justificativa: s.justificativa,
      status: s.status,
      solicitante: s.ordem.tecnico,
      solicitadoEm: new Date(agora - s.ha * HORA).toISOString(),
    }));

  return { pedidos };
}

const global = globalThis as typeof globalThis & { __cptmPecas?: Banco };

function banco(): Banco {
  global.__cptmPecas ??= semear();
  return global.__cptmPecas;
}

/** Newest first. Without a status, returns everything. */
export function listarPedidos(status?: StatusPedido): PedidoPeca[] {
  return banco()
    .pedidos.filter((p) => !status || p.status === status)
    .sort((a, b) => b.solicitadoEm.localeCompare(a.solicitadoEm));
}

export type ResultadoPedido =
  | { ok: true; pedido: PedidoPeca }
  | { ok: false; status: 400 | 403 | 404; erro: string };

const falha = (status: 400 | 403 | 404, erro: string): ResultadoPedido => ({
  ok: false,
  status,
  erro,
});

/** Only the technician who owns the OSM, and only while it is EM_MANUTENCAO. */
export function criarPedido(
  ordemServicoId: string,
  dados: NovoPedidoPeca,
  autor: Usuario,
): ResultadoPedido {
  const { pedidos } = banco();
  const ordem = buscarOrdem(ordemServicoId);
  if (!ordem) return falha(404, "Ordem de serviço não encontrada.");
  if (ordem.tecnico.matricula !== autor.matricula) {
    return falha(
      403,
      "Só o técnico responsável pela ordem de serviço pode pedir peças.",
    );
  }
  if (ordem.status !== "EM_MANUTENCAO") {
    return falha(
      400,
      "Só é possível pedir peças com a ordem de serviço em manutenção.",
    );
  }

  const ano = new Date().getFullYear();
  const pedido: PedidoPeca = {
    id: `PP-${ano}-${String(pedidos.length + 1).padStart(5, "0")}`,
    ordemServicoId: ordem.id,
    equipamento: ordem.equipamento,
    item: dados.item,
    quantidade: dados.quantidade,
    justificativa: dados.justificativa,
    status: "SOLICITADO",
    solicitante: { matricula: autor.matricula, nome: autor.nome },
    solicitadoEm: new Date().toISOString(),
  };
  pedidos.push(pedido);
  return { ok: true, pedido };
}
