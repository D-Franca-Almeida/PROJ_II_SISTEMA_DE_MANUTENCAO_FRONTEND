import { autenticar } from "@/lib/auth";
import { cancelar } from "@/lib/solicitacoes/mock-store";
import { responder } from "@/lib/solicitacoes/responder";

/** PUT /api/solicitacoes/:id/cancelar — Admin cancels any; Comum only their own. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { usuario, negado } = autenticar(request, ["ADMIN", "COMUM"]);
  if (negado) return negado;

  const { id } = await params;
  return responder(cancelar(id, usuario));
}
