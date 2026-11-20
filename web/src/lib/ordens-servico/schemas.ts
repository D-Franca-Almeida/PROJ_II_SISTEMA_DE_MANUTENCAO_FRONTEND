import { z } from "zod";
import { objeto } from "@/lib/validacao";
import { LAUDO_MAX, MOTIVO_NAO_EXECUCAO_MAX } from "./types";

const LAUDO_VAZIO = "Informe o laudo.";
const MOTIVO_VAZIO = "Informe o motivo da não execução.";

/** Body of PUT /api/ordens-servico/:id/concluir. */
export const conclusao = objeto({
  laudo: z
    .string({ error: LAUDO_VAZIO })
    .trim()
    .min(1, LAUDO_VAZIO)
    .max(LAUDO_MAX, `O laudo deve ter no máximo ${LAUDO_MAX} caracteres.`),
});

/** Body of PUT /api/ordens-servico/:id/nao-executar. */
export const naoExecucao = objeto({
  motivo: z
    .string({ error: MOTIVO_VAZIO })
    .trim()
    .min(1, MOTIVO_VAZIO)
    .max(
      MOTIVO_NAO_EXECUCAO_MAX,
      `O motivo deve ter no máximo ${MOTIVO_NAO_EXECUCAO_MAX} caracteres.`,
    ),
});
