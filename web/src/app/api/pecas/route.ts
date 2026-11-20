import { autenticar } from "@/lib/auth";
import { listarPedidos } from "@/lib/pecas/mock-store";
import { consultaPedidos } from "@/lib/pecas/schemas";
import { lerQuery } from "@/lib/validacao";

/**
 * GET /api/pecas?status= — Admin and Logística, newest first.
 * ASSUMPTION: the card only defines the POST; this listing path is ours.
 */
export function GET(request: Request) {
  const { negado } = autenticar(request, ["ADMIN", "LOGISTICA"]);
  if (negado) return negado;

  const consulta = lerQuery(request, consultaPedidos);
  if (consulta.negado) return consulta.negado;

  return Response.json(listarPedidos(consulta.dados.status));
}
