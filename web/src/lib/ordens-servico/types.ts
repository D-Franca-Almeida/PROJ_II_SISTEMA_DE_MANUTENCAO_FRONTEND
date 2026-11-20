import type { Pessoa } from "@/lib/solicitacoes/types";

/**
 * Maintenance work order (OSM).
 *
 * PLACEHOLDER: the OSM itself is US-07 (CPTM-14), which has not been seen.
 * This holds what the parts-request and closing rules need; replace it when
 * US-07 is implemented. ABERTA is our name for "exists but not yet in
 * maintenance".
 */
export const STATUSES_ORDEM = [
  "ABERTA",
  "EM_MANUTENCAO",
  "CONCLUIDA",
  "NAO_EXECUTADA",
] as const;

export type StatusOrdem = (typeof STATUSES_ORDEM)[number];

export const LAUDO_MAX = 2000;
export const MOTIVO_NAO_EXECUCAO_MAX = 500;

export type OrdemServico = {
  /** Ex.: "OSM-2026-00001". */
  id: string;
  /** The solicitação that originated it. */
  solicitacaoId: string;
  equipamento: { codigo: string; descricao: string };
  /** The technician who owns the order. */
  tecnico: Pessoa;
  status: StatusOrdem;
  /** ISO 8601. Set when the order is closed, either way. */
  dataConclusao: string | null;
  /** Technical report; set by "concluir". */
  laudo: string | null;
  /** Set by "não executar". */
  motivoNaoExecucao: string | null;
};
