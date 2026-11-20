import type { Resultado } from "./mock-store";

/** 200 + the request with its histórico, or the error status from the rule that failed. */
export function responder(resultado: Resultado): Response {
  return resultado.ok
    ? Response.json(resultado.solicitacao)
    : Response.json({ erro: resultado.erro }, { status: resultado.status });
}
