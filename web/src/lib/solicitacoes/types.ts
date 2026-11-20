/**
 * Contract for the /api/solicitacoes endpoints.
 *
 * The real backend has no published JSON shape yet, so this one was defined
 * here for the mock. When the real contract arrives, adapt it in `api.ts`
 * (one place) rather than throughout the UI.
 */

export const STATUSES = [
  "SOLICITADA",
  "DEVOLVIDA",
  "REENVIADA",
  "APROVADA",
  "RECEBIDA",
  "EM_MANUTENCAO",
  "AGUARDANDO_RETIRADA",
  "RETIRADO",
  "CANCELADA",
] as const;

export type StatusSolicitacao = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<StatusSolicitacao, string> = {
  SOLICITADA: "Solicitada",
  DEVOLVIDA: "Devolvida",
  REENVIADA: "Reenviada",
  APROVADA: "Aprovada",
  RECEBIDA: "Recebida",
  EM_MANUTENCAO: "Em manutenção",
  AGUARDANDO_RETIRADA: "Aguardando retirada",
  RETIRADO: "Retirado",
  CANCELADA: "Cancelada",
};

/** Approve and return are accepted only from these (CPTM-12). */
export const STATUSES_EM_TRIAGEM: readonly StatusSolicitacao[] = [
  "SOLICITADA",
  "REENVIADA",
];

/**
 * Cancel is accepted from these. ASSUMPTION: the card says the extension to
 * APROVADA belongs to US-19 (CPTM-46), so here it stops before approval.
 */
export const STATUSES_CANCELAVEIS: readonly StatusSolicitacao[] = [
  "SOLICITADA",
  "DEVOLVIDA",
  "REENVIADA",
];

export const MOTIVO_MAX = 500;

export function isStatus(value: unknown): value is StatusSolicitacao {
  return (
    typeof value === "string" && (STATUSES as readonly string[]).includes(value)
  );
}

export type Pessoa = { matricula: string; nome: string };

/** One status change. The list of these is the "histórico". */
export type EventoHistorico = {
  status: StatusSolicitacao;
  /** ISO 8601. */
  data: string;
  autor: Pessoa;
  /** Only on DEVOLVIDA. */
  motivo: string | null;
};

export type Solicitacao = {
  /** Human-readable number, also the identifier. Ex.: "SSL-2026-00001". */
  id: string;
  status: StatusSolicitacao;
  equipamento: { codigo: string; descricao: string };
  avaria: string;
  /** Station, workshop or lab where the equipment is. */
  localidade: { codigo: string; nome: string };
  descricao: string;
  fotoUrl: string | null;
  solicitante: Pessoa;
  /** ISO 8601. */
  abertaEm: string;
  /** ISO 8601. Set by the last approval; feeds expiration (US-20). */
  dataAprovacao: string | null;
  /** ISO 8601. Set by the last return; feeds expiration (US-20). */
  dataDevolucao: string | null;
  /** Reason of the last return, while it is still the current state of affairs. */
  motivoDevolucao: string | null;
  /**
   * ISO 8601 deadline while APROVADA or DEVOLVIDA, otherwise null.
   * ASSUMPTION: derived as 7 days after dataAprovacao / dataDevolucao until
   * US-20 defines the real rule.
   */
  expiraEm: string | null;
  /** Oldest first. */
  historico: EventoHistorico[];
};

export type ErroApi = { erro: string };
