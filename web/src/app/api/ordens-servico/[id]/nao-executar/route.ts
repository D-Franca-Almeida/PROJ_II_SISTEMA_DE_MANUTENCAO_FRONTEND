import { autenticar } from "@/lib/auth";
import { naoExecutar } from "@/lib/ordens-servico/mock-store";
import { naoExecucao } from "@/lib/ordens-servico/schemas";
import { lerCorpo } from "@/lib/validacao";

/**
 * PUT /api/ordens-servico/:id/nao-executar { motivo } → NAO_EXECUTADA.
 * Only the technician who owns the OSM, and only from EM_MANUTENCAO.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { usuario, negado } = autenticar(request, ["TECNICO"]);
  if (negado) return negado;

  const corpo = await lerCorpo(request, naoExecucao);
  if (corpo.negado) return corpo.negado;

  const { id } = await params;
  const resultado = naoExecutar(id, corpo.dados.motivo, usuario);
  return resultado.ok
    ? Response.json(resultado.ordem)
    : Response.json({ erro: resultado.erro }, { status: resultado.status });
}
