"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DeadlineChip } from "@/components/deadline-chip";
import { StatusBadge } from "@/components/status-badge";
import { formatarData } from "@/lib/format";
import { listaSolicitacoes } from "@/lib/solicitacoes/queries";
import {
  isStatus,
  STATUS_LABEL,
  STATUSES,
  type StatusSolicitacao,
} from "@/lib/solicitacoes/types";
import { PainelDetalhe } from "./painel-detalhe";

function href(status: StatusSolicitacao | null, id: string | null): string {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (id) query.set("id", id);
  const texto = query.toString();
  return texto ? `/solicitacoes?${texto}` : "/solicitacoes";
}

const COLUNAS = [
  "Solicitação",
  "Status",
  "Equipamento",
  "Estação / localidade",
  "Aberta em",
  "Prazo",
];
const LARGURAS_ESQUELETO = [112, 84, 220, 160, 72, 96];
const LINHAS_ESQUELETO = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function Fila() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const status = isStatus(statusParam) ? statusParam : null;
  const idSelecionado = searchParams.get("id");

  const consulta = useQuery(listaSolicitacoes(status));
  const itens = consulta.data ?? [];
  const pronto = consulta.data !== undefined;
  // An error only replaces the list when there is nothing to show; a failed
  // background refresh keeps the last good data on screen.
  const falhou = consulta.isError && !pronto;

  return (
    <>
      <h1 className="text-[1.75rem] font-extrabold leading-[1.15] tracking-[-0.01em]">
        Solicitações
      </h1>
      <p className="mt-1 text-ink-muted" aria-live="polite">
        {pronto
          ? resumo(itens.length, status)
          : consulta.isPending
            ? "Carregando a fila…"
            : " "}
      </p>

      <nav
        aria-label="Filtrar por status"
        className="mt-6 flex flex-wrap gap-2"
      >
        <Link
          href={href(null, null)}
          scroll={false}
          aria-current={status === null ? "true" : undefined}
          className="filter-chip"
        >
          Todas
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={href(s, null)}
            scroll={false}
            aria-current={status === s ? "true" : undefined}
            className="filter-chip"
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </nav>

      <div className="relative mt-4 overflow-x-auto rounded-lg border border-line bg-surface">
        {falhou ? (
          <div role="alert" className="px-6 py-12">
            <h2 className="text-[1.25rem] font-bold leading-tight">
              Não foi possível carregar a fila.
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
                ? `Nenhuma solicitação com status “${STATUS_LABEL[status]}”.`
                : "A fila está vazia."}
            </h2>
            <p className="mt-1 text-ink-muted">
              {status
                ? "Escolha outro status ou veja a fila completa."
                : "Solicitações abertas pelo aplicativo aparecem aqui, da mais recente para a mais antiga."}
            </p>
            {status && (
              <Link
                href={href(null, null)}
                scroll={false}
                className="btn btn-secondary mt-4"
              >
                Ver todas
              </Link>
            )}
          </div>
        ) : (
          <table className="queue min-w-[960px]">
            <thead>
              <tr>
                {COLUNAS.map((coluna) => (
                  <th key={coluna} scope="col">
                    {coluna}
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
                {itens.map((s) => (
                  <tr
                    key={s.id}
                    data-clickable
                    data-attention={s.status === "DEVOLVIDA"}
                    data-selected={s.id === idSelecionado}
                    onClick={() =>
                      router.push(href(status, s.id), { scroll: false })
                    }
                  >
                    <td>
                      {/* The link is the keyboard and screen-reader path; the row click is a pointer shortcut to it. */}
                      <Link
                        href={href(status, s.id)}
                        scroll={false}
                        onClick={(evento) => evento.stopPropagation()}
                        className="tnum rounded-sm font-bold"
                      >
                        {s.id}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="w-full max-w-0">
                      <span
                        className="block truncate"
                        title={`${s.equipamento.codigo} - ${s.equipamento.descricao}`}
                      >
                        <span className="tnum">{s.equipamento.codigo}</span>
                        {" - "}
                        {s.equipamento.descricao}
                      </span>
                    </td>
                    <td>
                      <span
                        title={`${s.localidade.codigo} - ${s.localidade.nome}`}
                      >
                        {s.localidade.nome}
                      </span>
                    </td>
                    <td className="tnum">{formatarData(s.abertaEm)}</td>
                    <td>
                      {s.expiraEm ? (
                        <DeadlineChip expiraEm={s.expiraEm} />
                      ) : (
                        <span className="text-ink-muted">
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Sem prazo</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        )}
      </div>

      <PainelDetalhe
        id={idSelecionado}
        onClose={() => router.replace(href(status, null), { scroll: false })}
      />
    </>
  );
}

function resumo(total: number, status: StatusSolicitacao | null): string {
  const quantidade = total === 1 ? "1 solicitação" : `${total} solicitações`;
  return status
    ? `${quantidade} com status “${STATUS_LABEL[status]}”, da mais recente para a mais antiga.`
    : `${quantidade}, da mais recente para a mais antiga.`;
}
