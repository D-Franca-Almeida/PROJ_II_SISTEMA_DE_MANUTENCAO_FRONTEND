import { autenticar } from "@/lib/auth";
import { listarTecnicos } from "@/lib/tecnicos/mock-store";

/** GET /api/tecnicos — Admin only. Technicians with their work-order counts. */
export function GET(request: Request) {
  const { negado } = autenticar(request, ["ADMIN"]);
  if (negado) return negado;
  return Response.json(listarTecnicos());
}
