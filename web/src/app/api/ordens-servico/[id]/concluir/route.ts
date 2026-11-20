import { autenticar } from "@/lib/auth";
import { concluir } from "@/lib/ordens-servico/mock-store";
import { conclusao } from "@/lib/ordens-servico/schemas";
import { lerCorpo } from "@/lib/validacao";

/**
 * PUT /api/ordens-servico/:id/concluir { laudo } → CONCLUIDA.
 * Only the technician who owns the OSM, and only from EM_MANUTENCAO.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { usuario, negado } = autenticar(request, ["TECNICO"]);
  if (negado) return negado;

  const corpo = await lerCorpo(request, conclusao);
  if (corpo.negado) return corpo.negado;

  const { id } = await params;
  const resultado = concluir(id, corpo.dados.laudo, usuario);
  return resultado.ok
    ? Response.json(resultado.ordem)
    : Response.json({ erro: resultado.erro }, { status: resultado.status });
}
