import { pedir, USANDO_API_REAL } from "@/lib/http";
import type { PedidoPeca, StatusPedido } from "./types";

type BackendPedidoPeca = {
  id: number;
  ordemServicoId: number;
  item: string;
  quantidade: number;
  justificativa: string;
  status: string;
  matriculaSolicitante: string;
  dataPedido: string;
};

export async function listarPedidosPecas(
  status: StatusPedido | null,
  signal?: AbortSignal,
): Promise<PedidoPeca[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  if (!USANDO_API_REAL) {
    return pedir(`/api/pecas${query}`, { signal });
  }
  const lista = await pedir<BackendPedidoPeca[]>(`/api/pedidos-peca${query}`, {
    signal,
  });
  return lista.map((p) => ({
    id: `PP-${p.id}`,
    ordemServicoId: `OSM-${p.ordemServicoId}`,
    equipamento: {
      codigo: `OSM-${p.ordemServicoId}`,
      descricao: "Ordem de Serviço de Manutenção",
    },
    item: p.item,
    quantidade: p.quantidade,
    justificativa: p.justificativa,
    status: (p.status as StatusPedido) ?? "SOLICITADO",
    solicitante: {
      matricula: p.matriculaSolicitante,
      nome: p.matriculaSolicitante,
    },
    solicitadoEm: p.dataPedido,
  }));
}
