import type { Pessoa } from "@/lib/solicitacoes/types";

/**
 * Parts requests (pedidos de peças), epic E6 · Logística de peças.
 * Like the rest of the mock, the JSON shape was defined here because the real
 * backend has not published one.
 */

/** SOLICITADO is set on creation; the rest is US-23 (CPTM-50). */
export const STATUSES_PEDIDO = [
  "SOLICITADO",
  "ENCAMINHADO",
  "RECEBIDO",
  "CANCELADO",
] as const;

export type StatusPedido = (typeof STATUSES_PEDIDO)[number];

export const STATUS_PEDIDO_LABEL: Record<StatusPedido, string> = {
  SOLICITADO: "Solicitado",
  ENCAMINHADO: "Encaminhado",
  RECEBIDO: "Recebido",
  CANCELADO: "Cancelado",
};

export function isStatusPedido(value: unknown): value is StatusPedido {
  return (
    typeof value === "string" &&
    (STATUSES_PEDIDO as readonly string[]).includes(value)
  );
}

export const ITEM_MAX = 120;
export const JUSTIFICATIVA_MAX = 500;

export type PedidoPeca = {
  /** Ex.: "PP-2026-00001". */
  id: string;
  ordemServicoId: string;
  /** Copied from the OSM so the list does not need a second lookup. */
  equipamento: { codigo: string; descricao: string };
  /** Free text typed by the technician. */
  item: string;
  /** Integer greater than zero. */
  quantidade: number;
  justificativa: string;
  status: StatusPedido;
  /** The technician who asked. */
  solicitante: Pessoa;
  /** ISO 8601. */
  solicitadoEm: string;
};
