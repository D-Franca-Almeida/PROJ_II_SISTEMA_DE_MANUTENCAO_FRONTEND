import { autenticar } from "@/lib/auth";
import { listar } from "@/lib/solicitacoes/mock-store";
import { consultaSolicitacoes } from "@/lib/solicitacoes/schemas";
import { lerQuery } from "@/lib/validacao";

/** GET /api/solicitacoes?status= — Admin only, newest first. */
export function GET(request: Request) {
  const { negado } = autenticar(request, ["ADMIN"]);
  if (negado) return negado;

  const consulta = lerQuery(request, consultaSolicitacoes);
  if (consulta.negado) return consulta.negado;

  return Response.json(listar(consulta.dados.status));
}
