import { pedir } from "@/lib/http";
import type { Atribuicao, Tecnico } from "./types";

export function listarTecnicos(signal?: AbortSignal): Promise<Tecnico[]> {
  return pedir("/api/tecnicos", { signal });
}

export function listarAtribuicoes(
  tecnico: string | null,
  signal?: AbortSignal,
): Promise<Atribuicao[]> {
  const query = tecnico ? `?tecnico=${encodeURIComponent(tecnico)}` : "";
  return pedir(`/api/atribuicoes${query}`, { signal });
}
