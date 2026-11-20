import { queryOptions } from "@tanstack/react-query";
import { listarPedidosPecas } from "./api";
import type { StatusPedido } from "./types";

/** Query keys and options for the parts requests (pedidos de peças). */

export const pedidoKeys = {
  all: ["pedidos-pecas"] as const,
  listas: () => [...pedidoKeys.all, "lista"] as const,
  lista: (status: StatusPedido | null) =>
    [...pedidoKeys.listas(), status ?? "todos"] as const,
};

export const listaPedidos = (status: StatusPedido | null) =>
  queryOptions({
    queryKey: pedidoKeys.lista(status),
    queryFn: ({ signal }) => listarPedidosPecas(status, signal),
  });
