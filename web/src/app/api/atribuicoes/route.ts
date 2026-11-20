import { autenticar } from "@/lib/auth";
import { existeTecnico, listarAtribuicoes } from "@/lib/tecnicos/mock-store";
import { consultaAtribuicoes } from "@/lib/tecnicos/schemas";
import { SEM_TECNICO } from "@/lib/tecnicos/types";
import { lerQuery } from "@/lib/validacao";

/**
 * GET /api/atribuicoes?tecnico= — Admin only. Every SSL with its OSM and
 * technician. `tecnico` is a matrícula, or "sem-tecnico" for unassigned SSLs.
 */
export function GET(request: Request) {
  const { negado } = autenticar(request, ["ADMIN"]);
  if (negado) return negado;

  const consulta = lerQuery(request, consultaAtribuicoes);
  if (consulta.negado) return consulta.negado;

  const { tecnico } = consulta.dados;
  if (!tecnico) return Response.json(listarAtribuicoes());
  if (tecnico !== SEM_TECNICO && !existeTecnico(tecnico)) {
    return Response.json(
      { erro: `Técnico desconhecido: "${tecnico}".` },
      { status: 400 },
    );
  }
  return Response.json(listarAtribuicoes(tecnico));
}
