import { pedir } from "@/lib/http";
import type { Solicitacao, StatusSolicitacao } from "./types";

export { ApiError } from "@/lib/http";

const caminhoDe = (id: string, acao = "") =>
  `/api/solicitacoes/${encodeURIComponent(id)}${acao}`;

export function listarSolicitacoes(
  status: StatusSolicitacao | null,
  signal?: AbortSignal,
): Promise<Solicitacao[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return pedir(`/api/solicitacoes${query}`, { signal });
}

export function buscarSolicitacao(
  id: string,
  signal?: AbortSignal,
): Promise<Solicitacao> {
  return pedir(caminhoDe(id), { signal });
}

export function aprovarSolicitacao(id: string): Promise<Solicitacao> {
  return pedir(caminhoDe(id, "/aprovar"), { method: "PUT" });
}

export function devolverSolicitacao(
  id: string,
  motivo: string,
): Promise<Solicitacao> {
  return pedir(caminhoDe(id, "/devolver"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivo }),
  });
}

export function cancelarSolicitacao(id: string): Promise<Solicitacao> {
  return pedir(caminhoDe(id, "/cancelar"), { method: "PUT" });
}
