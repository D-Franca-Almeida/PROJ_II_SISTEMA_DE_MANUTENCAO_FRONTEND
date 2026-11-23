import { pedir, USANDO_API_REAL } from "@/lib/http";
import { listarSolicitacoes } from "@/lib/solicitacoes/api";
import { type Atribuicao, SEM_TECNICO, type Tecnico } from "./types";

export async function listarTecnicos(
  signal?: AbortSignal,
): Promise<Tecnico[]> {
  if (!USANDO_API_REAL) {
    return pedir("/api/tecnicos", { signal });
  }
  const ssls = await listarSolicitacoes(null, signal);
  const emManutencao = ssls.filter((s) => s.status === "EM_MANUTENCAO").length;
  const aguardando = ssls.filter((s) => s.status === "RECEBIDA").length;
  const encerradas = ssls.filter(
    (s) => s.status === "AGUARDANDO_RETIRADA" || s.status === "RETIRADO",
  ).length;
  return [
    {
      matricula: "tec123",
      nome: "Técnico CPTM (tec123)",
      ordens: {
        aguardando,
        emManutencao,
        encerradas,
        total: aguardando + emManutencao + encerradas,
      },
    },
  ];
}

export async function listarAtribuicoes(
  tecnico: string | null,
  signal?: AbortSignal,
): Promise<Atribuicao[]> {
  if (!USANDO_API_REAL) {
    const query = tecnico ? `?tecnico=${encodeURIComponent(tecnico)}` : "";
    return pedir(`/api/atribuicoes${query}`, { signal });
  }
  const ssls = await listarSolicitacoes(null, signal);
  const atribuicoes: Atribuicao[] = ssls.map((s) => {
    const temTecnico =
      s.status === "EM_MANUTENCAO" ||
      s.status === "AGUARDANDO_RETIRADA" ||
      s.status === "RETIRADO";
    return {
      solicitacao: {
        id: s.id,
        equipamento: s.equipamento,
        abertaEm: s.abertaEm,
        status: s.status,
      },
      ordem: temTecnico
        ? {
            id: `OSM-${s.id}`,
            status:
              s.status === "EM_MANUTENCAO" ? "EM_MANUTENCAO" : "CONCLUIDA",
          }
        : null,
      tecnico: temTecnico
        ? { matricula: "tec123", nome: "Técnico CPTM (tec123)" }
        : null,
    };
  });
  if (!tecnico) return atribuicoes;
  if (tecnico === SEM_TECNICO)
    return atribuicoes.filter((a) => a.tecnico === null);
  return atribuicoes.filter((a) => a.tecnico?.matricula === tecnico);
}
