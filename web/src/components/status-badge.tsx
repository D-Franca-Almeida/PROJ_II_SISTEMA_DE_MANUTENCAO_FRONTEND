import type { StatusOrdem } from "@/lib/ordens-servico/types";
import { STATUS_PEDIDO_LABEL, type StatusPedido } from "@/lib/pecas/types";
import { STATUS_LABEL, type StatusSolicitacao } from "@/lib/solicitacoes/types";

/** Status vocabulary from DESIGN.md: grey means fine, color means look here. */
const VARIANTE: Partial<Record<StatusSolicitacao, string>> = {
  DEVOLVIDA: "badge-attention",
  APROVADA: "badge-info",
  RETIRADO: "badge-success",
};

export function StatusBadge({ status }: { status: StatusSolicitacao }) {
  return (
    <span className={`badge ${VARIANTE[status] ?? "badge-neutral"}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Same five treatments, mapped for parts requests: moving is blue, arrived is green. */
const VARIANTE_PEDIDO: Partial<Record<StatusPedido, string>> = {
  ENCAMINHADO: "badge-info",
  RECEBIDO: "badge-success",
};

export function StatusPedidoBadge({ status }: { status: StatusPedido }) {
  return (
    <span className={`badge ${VARIANTE_PEDIDO[status] ?? "badge-neutral"}`}>
      {STATUS_PEDIDO_LABEL[status]}
    </span>
  );
}

const ORDEM: Record<StatusOrdem, { rotulo: string; variante: string }> = {
  ABERTA: { rotulo: "Aberta", variante: "badge-neutral" },
  EM_MANUTENCAO: { rotulo: "Em manutenção", variante: "badge-neutral" },
  CONCLUIDA: { rotulo: "Concluída", variante: "badge-success" },
  // The repair could not be done: the administration has to decide what happens next.
  NAO_EXECUTADA: { rotulo: "Não executada", variante: "badge-attention" },
};

export function StatusOrdemBadge({ status }: { status: StatusOrdem }) {
  return (
    <span className={`badge ${ORDEM[status].variante}`}>
      {ORDEM[status].rotulo}
    </span>
  );
}
