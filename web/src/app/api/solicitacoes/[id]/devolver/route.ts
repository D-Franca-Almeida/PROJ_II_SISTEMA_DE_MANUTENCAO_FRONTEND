import { autenticar } from "@/lib/auth";
import { devolver } from "@/lib/solicitacoes/mock-store";
import { responder } from "@/lib/solicitacoes/responder";
import { devolucao } from "@/lib/solicitacoes/schemas";
import { lerCorpo } from "@/lib/validacao";

/** PUT /api/solicitacoes/:id/devolver { motivo } — Admin only, from SOLICITADA or REENVIADA. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { usuario, negado } = autenticar(request, ["ADMIN"]);
  if (negado) return negado;

  const corpo = await lerCorpo(request, devolucao);
  if (corpo.negado) return corpo.negado;

  const { id } = await params;
  return responder(devolver(id, corpo.dados.motivo, usuario));
}
