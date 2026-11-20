import { autenticar } from "@/lib/auth";
import { buscar } from "@/lib/solicitacoes/mock-store";

/** GET /api/solicitacoes/:id — Admin only. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { negado } = autenticar(request, ["ADMIN"]);
  if (negado) return negado;

  const { id } = await params;
  const solicitacao = buscar(id);
  if (!solicitacao) {
    return Response.json(
      { erro: "Solicitação não encontrada." },
      { status: 404 },
    );
  }
  return Response.json(solicitacao);
}
