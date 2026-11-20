import { todasAsOrdens } from "@/lib/ordens-servico/mock-store";
import { listar } from "@/lib/solicitacoes/mock-store";
import { TECNICOS } from "./registro";
import { type Atribuicao, SEM_TECNICO, type Tecnico } from "./types";

/** Everything here is derived from the solicitações and OSM mock stores. */

export function listarTecnicos(): Tecnico[] {
  const ordens = todasAsOrdens();
  return TECNICOS.map((tecnico) => {
    const dele = ordens.filter(
      (o) => o.tecnico.matricula === tecnico.matricula,
    );
    const com = (...status: string[]) =>
      dele.filter((o) => status.includes(o.status)).length;
    return {
      ...tecnico,
      ordens: {
        aguardando: com("ABERTA"),
        emManutencao: com("EM_MANUTENCAO"),
        encerradas: com("CONCLUIDA", "NAO_EXECUTADA"),
        total: dele.length,
      },
    };
  }).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function existeTecnico(matricula: string): boolean {
  return TECNICOS.some((t) => t.matricula === matricula);
}

/**
 * Every SSL, newest first, with its OSM and technician when there is one.
 * `tecnico` narrows to one matrícula, or to unassigned SSLs with SEM_TECNICO.
 */
export function listarAtribuicoes(tecnico?: string): Atribuicao[] {
  const ordens = todasAsOrdens();
  return listar()
    .map((s): Atribuicao => {
      const ordem = ordens.find((o) => o.solicitacaoId === s.id) ?? null;
      return {
        solicitacao: {
          id: s.id,
          status: s.status,
          equipamento: s.equipamento,
          abertaEm: s.abertaEm,
        },
        ordem: ordem && { id: ordem.id, status: ordem.status },
        tecnico: ordem?.tecnico ?? null,
      };
    })
    .filter((a) =>
      !tecnico
        ? true
        : tecnico === SEM_TECNICO
          ? a.tecnico === null
          : a.tecnico?.matricula === tecnico,
    );
}
