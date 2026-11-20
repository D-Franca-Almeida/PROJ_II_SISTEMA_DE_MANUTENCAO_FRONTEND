import type { OrdemServico, StatusOrdem } from "@/lib/ordens-servico/types";
import type {
  Pessoa,
  Solicitacao,
  StatusSolicitacao,
} from "@/lib/solicitacoes/types";

/**
 * Shapes for the "Técnicos" and "SSL por técnico" pages. Both endpoints are
 * ours: no Jira card defines them yet.
 */

/** A technician with a count of their work orders (OSM). */
export type Tecnico = Pessoa & {
  ordens: {
    /** ABERTA: assigned, not yet in maintenance. */
    aguardando: number;
    emManutencao: number;
    /** CONCLUIDA + NAO_EXECUTADA. */
    encerradas: number;
    total: number;
  };
};

/** One solicitação (SSL) with the work order and technician handling it, if any. */
export type Atribuicao = {
  solicitacao: Pick<Solicitacao, "id" | "equipamento" | "abertaEm"> & {
    status: StatusSolicitacao;
  };
  ordem: (Pick<OrdemServico, "id"> & { status: StatusOrdem }) | null;
  tecnico: Pessoa | null;
};

/** Value of ?tecnico= that selects SSLs nobody is assigned to. */
export const SEM_TECNICO = "sem-tecnico";
