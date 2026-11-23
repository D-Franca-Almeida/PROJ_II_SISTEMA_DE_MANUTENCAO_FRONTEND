import { API_BASE, pedir, USANDO_API_REAL } from "@/lib/http";
import type {
  EventoHistorico,
  Solicitacao,
  StatusSolicitacao,
} from "./types";

export { ApiError } from "@/lib/http";

type BackendSolicitacao = {
  id: number;
  status: string;
  descricao: string;
  fotoUrl: string | null;
  dataAbertura: string;
  matriculaSolicitante: string;
  equipamento?: {
    id: number;
    estacaoId: number;
    descricao: string;
    patrimonio: string;
  } | null;
  estacao?: { id: number; nome: string; linha: string } | null;
  motivoDevolucao?: string | null;
  diasParaExpirar?: number | null;
  numeroSsm?: string | null;
  dataRecebimento?: string | null;
  matriculaTecnico?: string | null;
  historico?: Array<{
    statusAnterior: string | null;
    statusNovo: string;
    matricula: string;
    data: string;
    observacao: string | null;
  }>;
};

function normalizarStatus(status: string): StatusSolicitacao {
  const s = status.trim().toUpperCase().replace(/\s+/g, "_");
  const validos: StatusSolicitacao[] = [
    "SOLICITADA",
    "DEVOLVIDA",
    "REENVIADA",
    "APROVADA",
    "RECEBIDA",
    "EM_MANUTENCAO",
    "AGUARDANDO_RETIRADA",
    "RETIRADO",
    "CANCELADA",
  ];
  if (validos.includes(s as StatusSolicitacao)) return s as StatusSolicitacao;
  if (s === "CONCLUIDA" || s === "RETIRADA_AUTORIZADA")
    return "AGUARDANDO_RETIRADA";
  if (s === "EXPIRADA" || s === "SEM_REPARO" || s === "INUTILIZADO" || s === "NAO_EXECUTADA")
    return "CANCELADA";
  return "SOLICITADA";
}

function adaptarFoto(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

function adaptarSolicitacao(raw: BackendSolicitacao): Solicitacao {
  const expiraEm =
    raw.diasParaExpirar != null
      ? new Date(Date.now() + raw.diasParaExpirar * 86_400_000).toISOString()
      : null;

  const historico: EventoHistorico[] = (raw.historico ?? []).map((h) => ({
    status: normalizarStatus(h.statusNovo),
    data: h.data,
    autor: { matricula: h.matricula, nome: h.matricula },
    motivo: h.observacao,
  }));

  return {
    id: String(raw.id),
    status: normalizarStatus(raw.status),
    equipamento: {
      codigo: raw.equipamento?.patrimonio ?? `EQ-${raw.id}`,
      descricao: raw.equipamento?.descricao ?? "Equipamento CPTM",
    },
    avaria: raw.numeroSsm ? `SSM ${raw.numeroSsm}` : "Manutenção corretiva",
    localidade: {
      codigo: raw.estacao?.linha ?? "CPTM",
      nome: raw.estacao?.nome ?? "Estação CPTM",
    },
    descricao: raw.descricao,
    fotoUrl: adaptarFoto(raw.fotoUrl),
    solicitante: {
      matricula: raw.matriculaSolicitante,
      nome: raw.matriculaSolicitante,
    },
    abertaEm: raw.dataAbertura,
    dataAprovacao: null,
    dataDevolucao: null,
    motivoDevolucao: raw.motivoDevolucao ?? null,
    expiraEm,
    historico,
  };
}

const caminhoDe = (id: string, acao = "") =>
  `/api/Solicitacoes/${encodeURIComponent(id)}${acao}`;

export async function listarSolicitacoes(
  status: StatusSolicitacao | null,
  signal?: AbortSignal,
): Promise<Solicitacao[]> {
  if (!USANDO_API_REAL) {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return pedir(`/api/solicitacoes${query}`, { signal });
  }
  const statusApi = status ? status.replace(/_/g, " ") : null;
  const query = statusApi ? `?status=${encodeURIComponent(statusApi)}` : "";
  const lista = await pedir<BackendSolicitacao[]>(`/api/Solicitacoes${query}`, {
    signal,
  });
  return lista.map(adaptarSolicitacao);
}

export async function buscarSolicitacao(
  id: string,
  signal?: AbortSignal,
): Promise<Solicitacao> {
  if (!USANDO_API_REAL) {
    return pedir(`/api/solicitacoes/${encodeURIComponent(id)}`, { signal });
  }
  const item = await pedir<BackendSolicitacao>(caminhoDe(id), { signal });
  return adaptarSolicitacao(item);
}

export async function aprovarSolicitacao(id: string): Promise<Solicitacao> {
  if (!USANDO_API_REAL) {
    return pedir(`/api/solicitacoes/${encodeURIComponent(id)}/aprovar`, {
      method: "PUT",
    });
  }
  await pedir(caminhoDe(id, "/aprovar"), { method: "PUT" });
  return buscarSolicitacao(id);
}

export async function devolverSolicitacao(
  id: string,
  motivo: string,
): Promise<Solicitacao> {
  if (!USANDO_API_REAL) {
    return pedir(`/api/solicitacoes/${encodeURIComponent(id)}/devolver`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
  }
  await pedir(caminhoDe(id, "/devolver"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivo }),
  });
  return buscarSolicitacao(id);
}

export async function cancelarSolicitacao(id: string): Promise<Solicitacao> {
  if (!USANDO_API_REAL) {
    return pedir(`/api/solicitacoes/${encodeURIComponent(id)}/cancelar`, {
      method: "PUT",
    });
  }
  await pedir(caminhoDe(id, "/cancelar"), { method: "PUT" });
  return buscarSolicitacao(id);
}
