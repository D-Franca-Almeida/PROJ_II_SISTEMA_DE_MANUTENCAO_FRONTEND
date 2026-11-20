import { z } from "zod";
import { objeto } from "@/lib/validacao";
import { ITEM_MAX, JUSTIFICATIVA_MAX, STATUSES_PEDIDO } from "./types";

/** Query of GET /api/pecas. */
export const consultaPedidos = objeto({
  status: z
    .enum(STATUSES_PEDIDO, {
      error: (problema) => `Status desconhecido: "${String(problema.input)}".`,
    })
    .optional(),
});

const ITEM_VAZIO = "Informe o item.";
const QUANTIDADE_INVALIDA =
  "A quantidade deve ser um número inteiro maior que zero.";
const JUSTIFICATIVA_VAZIA = "Informe a justificativa.";

/** Body of POST /api/ordens-servico/:id/pecas. Fields are checked in this order. */
export const novoPedidoPeca = objeto({
  item: z
    .string({ error: ITEM_VAZIO })
    .trim()
    .min(1, ITEM_VAZIO)
    .max(ITEM_MAX, `O item deve ter no máximo ${ITEM_MAX} caracteres.`),
  quantidade: z
    .number({ error: QUANTIDADE_INVALIDA })
    .int(QUANTIDADE_INVALIDA)
    .positive(QUANTIDADE_INVALIDA),
  justificativa: z
    .string({ error: JUSTIFICATIVA_VAZIA })
    .trim()
    .min(1, JUSTIFICATIVA_VAZIA)
    .max(
      JUSTIFICATIVA_MAX,
      `A justificativa deve ter no máximo ${JUSTIFICATIVA_MAX} caracteres.`,
    ),
});

export type NovoPedidoPeca = z.output<typeof novoPedidoPeca>;
