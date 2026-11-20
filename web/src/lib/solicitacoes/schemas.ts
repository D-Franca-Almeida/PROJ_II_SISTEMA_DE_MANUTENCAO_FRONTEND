import { z } from "zod";
import { objeto } from "@/lib/validacao";
import { MOTIVO_MAX, STATUSES } from "./types";

/** Query of GET /api/solicitacoes. */
export const consultaSolicitacoes = objeto({
  status: z
    .enum(STATUSES, {
      error: (problema) => `Status desconhecido: "${String(problema.input)}".`,
    })
    .optional(),
});

const MOTIVO_VAZIO = "Informe o motivo da devolução.";

/** Body of PUT /api/solicitacoes/:id/devolver. */
export const devolucao = objeto({
  motivo: z
    .string({ error: MOTIVO_VAZIO })
    .trim()
    .min(1, MOTIVO_VAZIO)
    .max(MOTIVO_MAX, `O motivo deve ter no máximo ${MOTIVO_MAX} caracteres.`),
});
