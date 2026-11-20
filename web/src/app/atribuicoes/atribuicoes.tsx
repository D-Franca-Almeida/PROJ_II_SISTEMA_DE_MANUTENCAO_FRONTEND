"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LinhasEsqueleto, ListaErro, ListaVazia } from "@/components/lista";
import { StatusBadge, StatusOrdemBadge } from "@/components/status-badge";
import { formatarData } from "@/lib/format";
import { listaAtribuicoes, listaTecnicos } from "@/lib/tecnicos/queries";
import { SEM_TECNICO } from "@/lib/tecnicos/types";

const href = (tecnico: string | null) =>
  tecnico
    ? `/atribuicoes?tecnico=${encodeURIComponent(tecnico)}`
    : "/atribuicoes";

const COLUNAS = [
  "Solicitação",
  "Status da SSL",
  "Equipamento",
  "Técnico",
  "Ordem de serviço",
  "Status da ordem",
  "Aberta em",
];

export function Atribuicoes() {
  const tecnico = useSearchParams().get("tecnico");

  const consulta = useQuery(listaAtribuicoes(tecnico));
  const itens = consulta.data ?? [];
  const pronto = consulta.data !== undefined;
  // An error only replaces the list when there is nothing to show; a failed
  // background refresh keeps the last good data on screen.
  const falhou = consulta.isError && !pronto;
  // Only feeds the filter chips (and shares its cache with the Técnicos page);
  // if it fails the page still works with "Todas".
  const tecnicos = useQuery(listaTecnicos());

  const nomeDoFiltro =
    tecnico === SEM_TECNICO
      ? "sem técnico"
      : tecnicos.data?.find((t) => t.matricula === tecnico)?.nome;

  return (
    <>
      <h1 className="text-[1.75rem] font-extrabold leading-[1.15] tracking-[-0.01em]">
        Solicitações por técnico
      </h1>
      <p className="mt-1 text-ink-muted" aria-live="polite">
        {pronto
          ? resumo(itens.length, tecnico, nomeDoFiltro)
          : consulta.isPending
            ? "Carregando as solicitações…"
            : " "}
      </p>

      <nav
        aria-label="Filtrar por técnico"
        className="mt-6 flex flex-wrap gap-2"
      >
        <Link
          href={href(null)}
          scroll={false}
          aria-current={tecnico === null ? "true" : undefined}
          className="filter-chip"
        >
          Todas
        </Link>
        {tecnicos.data?.map((t) => (
          <Link
            key={t.matricula}
            href={href(t.matricula)}
            scroll={false}
            aria-current={tecnico === t.matricula ? "true" : undefined}
            className="filter-chip"
          >
            {t.nome}
          </Link>
        ))}
        <Link
          href={href(SEM_TECNICO)}
          scroll={false}
          aria-current={tecnico === SEM_TECNICO ? "true" : undefined}
          className="filter-chip"
        >
          Sem técnico
        </Link>
      </nav>

      <div className="relative mt-4 overflow-x-auto rounded-lg border border-line bg-surface">
        {falhou ? (
          <ListaErro
            titulo="Não foi possível carregar as solicitações."
            mensagem={consulta.error?.message ?? "Erro desconhecido."}
            onTentarNovamente={() => consulta.refetch()}
          />
        ) : pronto && itens.length === 0 ? (
          <ListaVazia
            titulo={
              tecnico === SEM_TECNICO
                ? "Toda solicitação tem um técnico."
                : tecnico
                  ? "Este técnico não tem solicitações."
                  : "Nenhuma solicitação ainda."
            }
            texto={
              tecnico
                ? "Escolha outro técnico ou veja todas as solicitações."
                : "Uma solicitação ganha um técnico quando a ordem de serviço dela é aberta na oficina."
            }
            acao={
              tecnico && (
                <Link
                  href={href(null)}
                  scroll={false}
                  className="btn btn-secondary"
                >
                  Ver todas
                </Link>
              )
            }
          />
        ) : (
          <table className="queue min-w-[1040px]">
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
              <LinhasEsqueleto larguras={[112, 84, 220, 180, 112, 84, 72]} />
            ) : (
              <tbody>
                {itens.map(({ solicitacao: s, ordem, tecnico: t }) => (
                  <tr key={s.id}>
                    <td>
                      <Link
                        href={`/solicitacoes?id=${encodeURIComponent(s.id)}`}
                        className="tnum rounded-sm font-bold underline decoration-line-strong underline-offset-4 hover:decoration-ink"
                        aria-label={`Abrir o detalhe de ${s.id}`}
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
                      {t ? (
                        <span className="font-semibold">{t.nome}</span>
                      ) : (
                        <span className="text-ink-muted">Sem técnico</span>
                      )}
                    </td>
                    <td className="tnum">
                      {ordem ? (
                        ordem.id
                      ) : (
                        <span className="text-ink-muted">
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Sem ordem de serviço</span>
                        </span>
                      )}
                    </td>
                    <td>
                      {ordem ? (
                        <StatusOrdemBadge status={ordem.status} />
                      ) : (
                        <span className="text-ink-muted" aria-hidden="true">
                          —
                        </span>
                      )}
                    </td>
                    <td className="tnum">{formatarData(s.abertaEm)}</td>
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

function resumo(
  total: number,
  tecnico: string | null,
  nome: string | undefined,
): string {
  const quantidade = total === 1 ? "1 solicitação" : `${total} solicitações`;
  if (!tecnico) return `${quantidade}, da mais recente para a mais antiga.`;
  if (tecnico === SEM_TECNICO) return `${quantidade} sem técnico.`;
  return nome ? `${quantidade} com ${nome}.` : `${quantidade}.`;
}
