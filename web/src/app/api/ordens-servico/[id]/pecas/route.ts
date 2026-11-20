import { autenticar } from "@/lib/auth";
import { criarPedido } from "@/lib/pecas/mock-store";
import { novoPedidoPeca } from "@/lib/pecas/schemas";
import { lerCorpo } from "@/lib/validacao";

/**
 * POST /api/ordens-servico/:id/pecas { item, quantidade, justificativa }
 * Only the technician who owns the OSM, with the OSM em manutenção.
 * 201 with the new request in status SOLICITADO.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { usuario, negado } = autenticar(request, ["TECNICO"]);
  if (negado) return negado;

  const corpo = await lerCorpo(request, novoPedidoPeca);
  if (corpo.negado) return corpo.negado;

  const { id } = await params;
  const resultado = criarPedido(id, corpo.dados, usuario);
  return resultado.ok
    ? Response.json(resultado.pedido, { status: 201 })
    : Response.json({ erro: resultado.erro }, { status: resultado.status });
}
