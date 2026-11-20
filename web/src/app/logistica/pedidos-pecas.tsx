"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StatusPedidoBadge } from "@/components/status-badge";
import { formatarData } from "@/lib/format";
import { listaPedidos } from "@/lib/pecas/queries";
import {
  isStatusPedido,
  STATUS_PEDIDO_LABEL,
  STATUSES_PEDIDO,
  type StatusPedido,
} from "@/lib/pecas/types";

const href = (status: StatusPedido | null) =>
  status ? `/logistica?status=${status}` : "/logistica";

const COLUNAS = [
  { rotulo: "Pedido" },
  { rotulo: "Status" },
  { rotulo: "Item e justificativa" },
  { rotulo: "Qtd.", classe: "cell-num" },
  { rotulo: "Ordem de serviço" },
  { rotulo: "Técnico" },
  { rotulo: "Solicitado em" },
];
const LARGURAS_ESQUELETO = [104, 84, 280, 24, 200, 160, 72];
const LINHAS_ESQUELETO = ["a", "b", "c", "d", "e", "f"];

export function PedidosPecas() {
  const statusParam = useSearchParams().get("status");
  const status = isStatusPedido(statusParam) ? statusParam : null;

  const consulta = useQuery(listaPedidos(status));
  const itens = consulta.data ?? [];
  const pronto = consulta.data !== undefined;
  // An error only replaces the list when there is nothing to show; a failed
  // background refresh keeps the last good data on screen.
  const falhou = consulta.isError && !pronto;

  return (
    <>
      <h1 className="text-[1.75rem] font-extrabold leading-[1.15] tracking-[-0.01em]">
        Pedidos de peças
      </h1>
      <p className="mt-1 text-ink-muted" aria-live="polite">
        {pronto
          ? resumo(itens.length, status)
          : consulta.isPending
            ? "Carregando os pedidos…"
            : " "}
      </p>

      <nav
        aria-label="Filtrar por status"
        className="mt-6 flex flex-wrap gap-2"
      >
        <Link
          href={href(null)}
          scroll={false}
          aria-current={status === null ? "true" : undefined}
          className="filter-chip"
        >
          Todos
        </Link>
        {STATUSES_PEDIDO.map((s) => (
          <Link
            key={s}
            href={href(s)}
            scroll={false}
            aria-current={status === s ? "true" : undefined}
            className="filter-chip"
          >
            {STATUS_PEDIDO_LABEL[s]}
          </Link>
        ))}
      </nav>

      <div className="relative mt-4 overflow-x-auto rounded-lg border border-line bg-surface">
        {falhou ? (
          <div role="alert" className="px-6 py-12">
            <h2 className="text-[1.25rem] font-bold leading-tight">
              Não foi possível carregar os pedidos.
            </h2>
            <p className="mt-1 text-ink-muted">
              {consulta.error?.message ?? "Erro desconhecido."}
            </p>
            <button
              type="button"
              className="btn btn-secondary mt-4"
              onClick={() => consulta.refetch()}
            >
              Tentar novamente
            </button>
          </div>
        ) : pronto && itens.length === 0 ? (
          <div className="px-6 py-12">
            <h2 className="text-[1.25rem] font-bold leading-tight">
              {status
                ? `Nenhum pedido com status “${STATUS_PEDIDO_LABEL[status]}”.`
                : "Nenhum pedido de peças ainda."}
            </h2>
            <p className="mt-1 text-ink-muted">
              {status
                ? "Escolha outro status ou veja todos os pedidos."
                : "Os técnicos pedem peças pelo aplicativo, na tela da ordem de serviço em manutenção. Os pedidos aparecem aqui."}
            </p>
            {status && (
              <Link
                href={href(null)}
                scroll={false}
                className="btn btn-secondary mt-4"
              >
                Ver todos
              </Link>
            )}
          </div>
        ) : (
          <table className="queue min-w-[1040px]">
            <thead>
              <tr>
                {COLUNAS.map((coluna) => (
                  <th key={coluna.rotulo} scope="col" className={coluna.classe}>
                    {coluna.rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            {consulta.isPending ? (
              <tbody aria-hidden="true">
                {LINHAS_ESQUELETO.map((linha) => (
                  <tr key={linha}>
                    {LARGURAS_ESQUELETO.map((largura) => (
                      <td key={largura}>
                        <span className="skeleton" style={{ width: largura }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                {itens.map((p) => (
                  <tr key={p.id}>
                    <td className="tnum font-bold">{p.id}</td>
                    <td>
                      <StatusPedidoBadge status={p.status} />
                    </td>
                    <td className="cell-wrap w-full min-w-[280px]">
                      <span className="block font-semibold">{p.item}</span>
                      <span className="block max-w-[70ch] text-ink-muted">
                        {p.justificativa}
                      </span>
                    </td>
                    <td className="cell-num">{p.quantidade}</td>
                    <td>
                      <span className="tnum block">{p.ordemServicoId}</span>
                      <span className="block text-[0.8125rem] text-ink-muted">
                        {p.equipamento.codigo} - {p.equipamento.descricao}
                      </span>
                    </td>
                    <td>{p.solicitante.nome}</td>
                    <td className="tnum">{formatarData(p.solicitadoEm)}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        )}
      </div>
    </>
  );
}

function resumo(total: number, status: StatusPedido | null): string {
  const quantidade = total === 1 ? "1 pedido" : `${total} pedidos`;
  return status
    ? `${quantidade} com status “${STATUS_PEDIDO_LABEL[status]}”, do mais recente para o mais antigo.`
    : `${quantidade}, do mais recente para o mais antigo.`;
}
