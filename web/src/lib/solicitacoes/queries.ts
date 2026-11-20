import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { atribuicaoKeys } from "@/lib/tecnicos/queries";
import {
  aprovarSolicitacao,
  buscarSolicitacao,
  cancelarSolicitacao,
  devolverSolicitacao,
  listarSolicitacoes,
} from "./api";
import type { Solicitacao, StatusSolicitacao } from "./types";

/** Query keys, query options and mutations for the solicitações (SSL). */

export const solicitacaoKeys = {
  all: ["solicitacoes"] as const,
  listas: () => [...solicitacaoKeys.all, "lista"] as const,
  lista: (status: StatusSolicitacao | null) =>
    [...solicitacaoKeys.listas(), status ?? "todas"] as const,
  detalhe: (id: string) => [...solicitacaoKeys.all, "detalhe", id] as const,
};

export const listaSolicitacoes = (status: StatusSolicitacao | null) =>
  queryOptions({
    queryKey: solicitacaoKeys.lista(status),
    queryFn: ({ signal }) => listarSolicitacoes(status, signal),
  });

export const detalheSolicitacao = (id: string) =>
  queryOptions({
    queryKey: solicitacaoKeys.detalhe(id),
    queryFn: ({ signal }) => buscarSolicitacao(id, signal),
  });

/**
 * Shared shape of approve / return / cancel. Each answers with the updated
 * request, so on success:
 *  - that answer goes straight into the detail cache (the panel shows the new
 *    status and histórico without a second request);
 *  - every list that can show the request is refetched, because its row, its
 *    filter and its position may have changed. This also runs after a failure,
 *    since a refusal (for example "already triaged") usually means the list on
 *    screen is out of date.
 *
 * The update is not optimistic on purpose: the server can refuse by status,
 * and a card that flips to "Aprovada" and then flips back is worse than a
 * button that says "Aprovando…" for a moment.
 */
function useMutacaoSolicitacao<Variaveis>(
  mutationFn: (variaveis: Variaveis) => Promise<Solicitacao>,
  /** Which request the variables are about, to refresh it when the server refuses. */
  idDe: (variaveis: Variaveis) => string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (atualizada) => {
      queryClient.setQueryData(
        solicitacaoKeys.detalhe(atualizada.id),
        atualizada,
      );
    },
    // A refusal means the panel is showing an out-of-date request.
    onError: (_erro, variaveis) =>
      queryClient.invalidateQueries({
        queryKey: solicitacaoKeys.detalhe(idDe(variaveis)),
      }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: solicitacaoKeys.listas() }),
        // "SSL por técnico" shows each request's status too.
        queryClient.invalidateQueries({ queryKey: atribuicaoKeys.all }),
      ]),
  });
}

export const useAprovar = () =>
  useMutacaoSolicitacao(
    (id: string) => aprovarSolicitacao(id),
    (id) => id,
  );

export const useDevolver = () =>
  useMutacaoSolicitacao(
    ({ id, motivo }: { id: string; motivo: string }) =>
      devolverSolicitacao(id, motivo),
    ({ id }) => id,
  );

export const useCancelar = () =>
  useMutacaoSolicitacao(
    (id: string) => cancelarSolicitacao(id),
    (id) => id,
  );
