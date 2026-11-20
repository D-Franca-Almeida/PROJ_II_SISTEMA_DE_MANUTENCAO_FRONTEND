"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { LinhasEsqueleto, ListaErro, ListaVazia } from "@/components/lista";
import { listaTecnicos } from "@/lib/tecnicos/queries";

const COLUNAS = [
  { rotulo: "Técnico" },
  { rotulo: "Matrícula" },
  { rotulo: "Aguardando início", classe: "cell-num" },
  { rotulo: "Em manutenção", classe: "cell-num" },
  { rotulo: "Encerradas", classe: "cell-num" },
  { rotulo: "Total de ordens", classe: "cell-num" },
  { rotulo: "" },
];

export function Tecnicos() {
  const consulta = useQuery(listaTecnicos());
  const itens = consulta.data ?? [];
  const pronto = consulta.data !== undefined;
  // An error only replaces the list when there is nothing to show; a failed
  // background refresh keeps the last good data on screen.
  const falhou = consulta.isError && !pronto;

  return (
    <>
      <h1 className="text-[1.75rem] font-extrabold leading-[1.15] tracking-[-0.01em]">
        Técnicos
      </h1>
      <p className="mt-1 text-ink-muted" aria-live="polite">
        {pronto
          ? `${itens.length === 1 ? "1 técnico" : `${itens.length} técnicos`}, com as ordens de serviço de cada um.`
          : consulta.isPending
            ? "Carregando os técnicos…"
            : " "}
      </p>

      <div className="relative mt-6 overflow-x-auto rounded-lg border border-line bg-surface">
        {falhou ? (
          <ListaErro
            titulo="Não foi possível carregar os técnicos."
            mensagem={consulta.error?.message ?? "Erro desconhecido."}
            onTentarNovamente={() => consulta.refetch()}
          />
        ) : pronto && itens.length === 0 ? (
          <ListaVazia
            titulo="Nenhum técnico cadastrado."
            texto="Usuários com perfil Técnico aparecem aqui assim que forem cadastrados."
          />
        ) : (
          <table className="queue min-w-[820px]">
            <thead>
              <tr>
                {COLUNAS.map((coluna) => (
                  <th
                    key={coluna.rotulo || "acao"}
                    scope="col"
                    className={coluna.classe}
                  >
                    {coluna.rotulo || <span className="sr-only">Ações</span>}
                  </th>
                ))}
              </tr>
            </thead>
            {consulta.isPending ? (
              <LinhasEsqueleto larguras={[220, 72, 24, 24, 24, 24, 96]} />
            ) : (
              <tbody>
                {itens.map((t) => (
                  <tr key={t.matricula}>
                    <td className="w-full font-semibold">{t.nome}</td>
                    <td className="tnum">{t.matricula}</td>
                    <td className="cell-num">{t.ordens.aguardando}</td>
                    <td className="cell-num">{t.ordens.emManutencao}</td>
                    <td className="cell-num">{t.ordens.encerradas}</td>
                    <td className="cell-num font-semibold">{t.ordens.total}</td>
                    <td className="cell-num">
                      {t.ordens.total > 0 ? (
                        <Link
                          href={`/atribuicoes?tecnico=${encodeURIComponent(t.matricula)}`}
                          className="rounded-sm font-semibold underline decoration-line-strong underline-offset-4 hover:decoration-ink"
                          aria-label={`Ver as SSL de ${t.nome}`}
                        >
                          Ver SSL
                        </Link>
                      ) : (
                        <span className="text-ink-muted">Sem ordens</span>
                      )}
                    </td>
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
