import { pedir } from "@/lib/http";
import type { PedidoPeca, StatusPedido } from "./types";

export function listarPedidosPecas(
  status: StatusPedido | null,
  signal?: AbortSignal,
): Promise<PedidoPeca[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return pedir(`/api/pecas${query}`, { signal });
}
