import { autenticar } from "@/lib/auth";
import { aprovar } from "@/lib/solicitacoes/mock-store";
import { responder } from "@/lib/solicitacoes/responder";

/** PUT /api/solicitacoes/:id/aprovar — Admin only, from SOLICITADA or REENVIADA. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { usuario, negado } = autenticar(request, ["ADMIN"]);
  if (negado) return negado;

  const { id } = await params;
  return responder(aprovar(id, usuario));
}
