import { queryOptions } from "@tanstack/react-query";
import { listarAtribuicoes, listarTecnicos } from "./api";

/** Query keys and options for the technicians and the SSL-per-technician list. */

export const tecnicoKeys = {
  all: ["tecnicos"] as const,
  lista: () => [...tecnicoKeys.all, "lista"] as const,
};

export const atribuicaoKeys = {
  all: ["atribuicoes"] as const,
  lista: (tecnico: string | null) =>
    [...atribuicaoKeys.all, "lista", tecnico ?? "todas"] as const,
};

export const listaTecnicos = () =>
  queryOptions({
    queryKey: tecnicoKeys.lista(),
    queryFn: ({ signal }) => listarTecnicos(signal),
  });

export const listaAtribuicoes = (tecnico: string | null) =>
  queryOptions({
    queryKey: atribuicaoKeys.lista(tecnico),
    queryFn: ({ signal }) => listarAtribuicoes(tecnico, signal),
  });
