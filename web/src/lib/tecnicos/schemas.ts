import { z } from "zod";
import { objeto } from "@/lib/validacao";

/**
 * Query of GET /api/atribuicoes. Whether the matrícula exists is a rule of
 * the data, so the route checks it, not this schema.
 */
export const consultaAtribuicoes = objeto({
  tecnico: z.string().optional(),
});
