import type { Usuario } from "@/lib/auth";
import {
  type EventoHistorico,
  type Pessoa,
  type Solicitacao,
  STATUSES_CANCELAVEIS,
  STATUSES_EM_TRIAGEM,
  type StatusSolicitacao,
} from "./types";

/**
 * In-memory stand-in for the real backend. Fictitious data only.
 * State lives on globalThis so every route handler shares one copy and it
 * survives dev hot reloads; it resets when the server restarts.
 */

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;
/** ASSUMPTION until US-20 (CPTM-47) defines expiration. */
const PRAZO_DIAS = 7;
const FOTO = "/mock/foto-ficticia.svg";

const EQUIPAMENTOS = {
  motores: { codigo: "QFJ0214", descricao: "MOTORES ELÉTRICOS" },
  compressor: { codigo: "QFJ0388", descricao: "COMPRESSOR DE AR" },
  multimetro: { codigo: "QFL0057", descricao: "MULTÍMETRO DIGITAL" },
  fonte: { codigo: "QFM0731", descricao: "FONTE DE ALIMENTAÇÃO 110 V" },
  bancada: { codigo: "QFN0420", descricao: "BANCADA DE TESTE DE RELÉS" },
} as const;

const LOCALIDADES = {
  prs: { codigo: "OF-PRS", nome: "Oficina Presidente Altino" },
  mec: { codigo: "LAB-MEC", nome: "Laboratório Mecânico" },
  elt: { codigo: "LAB-ELT", nome: "Laboratório Eletrônico" },
  lap: { codigo: "OF-LAP", nome: "Oficina Lapa" },
  bfu: { codigo: "PAT-BFU", nome: "Pátio Barra Funda" },
} as const;

const SOLICITANTES = {
  a: { matricula: "comum123", nome: "Solicitante Fictício A" },
  b: { matricula: "comum456", nome: "Solicitante Fictício B" },
  c: { matricula: "comum789", nome: "Solicitante Fictício C" },
} as const;

const ADMIN: Pessoa = {
  matricula: "admin123",
  nome: "Administrador Fictício",
};
const OFICINA: Pessoa = {
  matricula: "tec123",
  nome: "Técnico de Oficina Fictício",
};

/** The steps a request went through to reach each status, for seeding. */
const CAMINHO: Record<StatusSolicitacao, StatusSolicitacao[]> = {
  SOLICITADA: ["SOLICITADA"],
  DEVOLVIDA: ["SOLICITADA", "DEVOLVIDA"],
  REENVIADA: ["SOLICITADA", "DEVOLVIDA", "REENVIADA"],
  APROVADA: ["SOLICITADA", "APROVADA"],
  RECEBIDA: ["SOLICITADA", "APROVADA", "RECEBIDA"],
  EM_MANUTENCAO: ["SOLICITADA", "APROVADA", "RECEBIDA", "EM_MANUTENCAO"],
  AGUARDANDO_RETIRADA: [
    "SOLICITADA",
    "APROVADA",
    "RECEBIDA",
    "EM_MANUTENCAO",
    "AGUARDANDO_RETIRADA",
  ],
  RETIRADO: [
    "SOLICITADA",
    "APROVADA",
    "RECEBIDA",
    "EM_MANUTENCAO",
    "AGUARDANDO_RETIRADA",
    "RETIRADO",
  ],
  CANCELADA: ["SOLICITADA", "CANCELADA"],
};

type Semente = {
  n: number;
  status: StatusSolicitacao;
  equipamento: keyof typeof EQUIPAMENTOS;
  localidade: keyof typeof LOCALIDADES;
  solicitante: keyof typeof SOLICITANTES;
  avaria: string;
  descricao: string;
  /** How long ago it was opened, in hours. */
  abertaHa: number;
  /** How long ago it reached its current status, in hours. */
  ultimaHa?: number;
  motivoDevolucao?: string;
};

const SEMENTES: Semente[] = [
  {
    n: 15,
    status: "SOLICITADA",
    equipamento: "fonte",
    localidade: "lap",
    solicitante: "b",
    avaria: "Não liga",
    descricao:
      "A fonte não dá sinal ao ser ligada na bancada. Fusível já foi trocado e o problema continua.",
    abertaHa: 3,
  },
  {
    n: 14,
    status: "SOLICITADA",
    equipamento: "motores",
    localidade: "prs",
    solicitante: "a",
    avaria: "Superaquecimento",
    descricao:
      "Motor esquenta após 20 minutos de uso e desarma o relé térmico.",
    abertaHa: 9,
  },
  {
    n: 13,
    status: "REENVIADA",
    equipamento: "compressor",
    localidade: "mec",
    solicitante: "a",
    avaria: "Vazamento de ar",
    descricao:
      "Vazamento na conexão do reservatório. Foto refeita mostrando a etiqueta do equipamento.",
    abertaHa: 30,
    ultimaHa: 4,
    motivoDevolucao: "A foto não mostra a etiqueta do equipamento.",
  },
  {
    n: 12,
    status: "DEVOLVIDA",
    equipamento: "bancada",
    localidade: "bfu",
    solicitante: "c",
    avaria: "Leitura instável",
    descricao: "Os valores de teste oscilam sem carga conectada.",
    abertaHa: 2 * 24,
    ultimaHa: 20,
    motivoDevolucao:
      "A descrição não informa em qual canal da bancada a oscilação aparece.",
  },
  {
    n: 11,
    status: "SOLICITADA",
    equipamento: "multimetro",
    localidade: "elt",
    solicitante: "c",
    avaria: "Leitura instável",
    descricao:
      "Leitura de tensão varia mais de 5% entre medições seguidas no mesmo ponto.",
    abertaHa: 2 * 24 + 5,
  },
  {
    n: 10,
    status: "CANCELADA",
    equipamento: "fonte",
    localidade: "lap",
    solicitante: "b",
    avaria: "Não liga",
    descricao: "Aberta em duplicidade com a solicitação anterior.",
    abertaHa: 3 * 24,
    ultimaHa: 2 * 24 + 20,
  },
  {
    n: 9,
    status: "APROVADA",
    equipamento: "multimetro",
    localidade: "elt",
    solicitante: "b",
    avaria: "Visor apagado",
    descricao: "O visor apaga sozinho mesmo com bateria nova.",
    abertaHa: 4 * 24,
    ultimaHa: 2 * 24 + 6,
  },
  {
    n: 8,
    status: "DEVOLVIDA",
    equipamento: "compressor",
    localidade: "mec",
    solicitante: "a",
    avaria: "Ruído anormal",
    descricao: "Ruído metálico ao atingir a pressão de trabalho.",
    abertaHa: 6 * 24,
    ultimaHa: 5 * 24 + 6,
    motivoDevolucao: "A foto não mostra a etiqueta do equipamento.",
  },
  {
    n: 7,
    status: "RECEBIDA",
    equipamento: "fonte",
    localidade: "lap",
    solicitante: "b",
    avaria: "Tensão de saída baixa",
    descricao: "Saída medindo 96 V com a rede em 110 V.",
    abertaHa: 9 * 24,
  },
  {
    n: 6,
    status: "EM_MANUTENCAO",
    equipamento: "motores",
    localidade: "prs",
    solicitante: "a",
    avaria: "Ruído anormal",
    descricao: "Rolamento com ruído e vibração acima do normal.",
    abertaHa: 13 * 24,
  },
  {
    n: 5,
    status: "EM_MANUTENCAO",
    equipamento: "bancada",
    localidade: "bfu",
    solicitante: "c",
    avaria: "Não liga",
    descricao: "Bancada não energiza; disjuntor do painel está armado.",
    abertaHa: 15 * 24,
  },
  {
    n: 4,
    status: "AGUARDANDO_RETIRADA",
    equipamento: "multimetro",
    localidade: "elt",
    solicitante: "b",
    avaria: "Ponteiras danificadas",
    descricao: "Ponteiras com mau contato; leitura cai ao mover o cabo.",
    abertaHa: 19 * 24,
  },
  {
    n: 3,
    status: "AGUARDANDO_RETIRADA",
    equipamento: "compressor",
    localidade: "mec",
    solicitante: "a",
    avaria: "Vazamento de ar",
    descricao: "Perda de pressão com o compressor desligado.",
    abertaHa: 24 * 24,
  },
  {
    n: 2,
    status: "RETIRADO",
    equipamento: "bancada",
    localidade: "bfu",
    solicitante: "c",
    avaria: "Relé de teste colado",
    descricao: "Relé interno da bancada não desarma após o ensaio.",
    abertaHa: 38 * 24,
  },
  {
    n: 1,
    status: "RETIRADO",
    equipamento: "motores",
    localidade: "prs",
    solicitante: "a",
    avaria: "Superaquecimento",
    descricao: "Carcaça acima de 90 °C em regime normal.",
    abertaHa: 45 * 24,
  },
];

function autorDe(status: StatusSolicitacao, solicitante: Pessoa): Pessoa {
  switch (status) {
    case "SOLICITADA":
    case "REENVIADA":
    case "RETIRADO":
      return solicitante;
    case "RECEBIDA":
    case "EM_MANUTENCAO":
    case "AGUARDANDO_RETIRADA":
      return OFICINA;
    default:
      return ADMIN;
  }
}

function prazoDe(s: Solicitacao): string | null {
  const base =
    s.status === "APROVADA"
      ? s.dataAprovacao
      : s.status === "DEVOLVIDA"
        ? s.dataDevolucao
        : null;
  return base
    ? new Date(new Date(base).getTime() + PRAZO_DIAS * DIA).toISOString()
    : null;
}

function semear(): Solicitacao[] {
  const agora = Date.now();
  const ano = new Date(agora).getFullYear();
  return SEMENTES.map((s) => {
    const solicitante = SOLICITANTES[s.solicitante];
    const passos = CAMINHO[s.status];
    const inicio = agora - s.abertaHa * HORA;
    const fim = agora - (s.ultimaHa ?? s.abertaHa / 2) * HORA;

    const historico: EventoHistorico[] = passos.map((status, i) => ({
      status,
      data: new Date(
        passos.length === 1
          ? inicio
          : inicio + ((fim - inicio) * i) / (passos.length - 1),
      ).toISOString(),
      autor: autorDe(status, solicitante),
      motivo: status === "DEVOLVIDA" ? (s.motivoDevolucao ?? null) : null,
    }));
    const dataDe = (status: StatusSolicitacao) =>
      historico.find((e) => e.status === status)?.data ?? null;

    const solicitacao: Solicitacao = {
      id: `SSL-${ano}-${String(s.n).padStart(5, "0")}`,
      status: s.status,
      equipamento: EQUIPAMENTOS[s.equipamento],
      avaria: s.avaria,
      localidade: LOCALIDADES[s.localidade],
      descricao: s.descricao,
      fotoUrl: FOTO,
      solicitante,
      abertaEm: historico[0].data,
      dataAprovacao: dataDe("APROVADA"),
      dataDevolucao: dataDe("DEVOLVIDA"),
      motivoDevolucao:
        s.status === "DEVOLVIDA" ? (s.motivoDevolucao ?? null) : null,
      expiraEm: null,
      historico,
    };
    solicitacao.expiraEm = prazoDe(solicitacao);
    return solicitacao;
  });
}

const global = globalThis as typeof globalThis & {
  __cptmSolicitacoesV2?: Solicitacao[];
};

function store(): Solicitacao[] {
  global.__cptmSolicitacoesV2 ??= semear();
  return global.__cptmSolicitacoesV2;
}

/** Newest first. Without a status, returns everything. */
export function listar(status?: StatusSolicitacao): Solicitacao[] {
  return store()
    .filter((s) => !status || s.status === status)
    .sort((a, b) => b.abertaEm.localeCompare(a.abertaEm));
}

export function buscar(id: string): Solicitacao | undefined {
  return store().find((s) => s.id === id);
}

export type Resultado =
  | { ok: true; solicitacao: Solicitacao }
  | { ok: false; status: 400 | 403 | 404; erro: string };

const falha = (status: 400 | 403 | 404, erro: string): Resultado => ({
  ok: false,
  status,
  erro,
});

function transicionar(
  s: Solicitacao,
  status: StatusSolicitacao,
  autor: Usuario,
  motivo: string | null = null,
): Resultado {
  const data = new Date().toISOString();
  s.status = status;
  s.historico.push({
    status,
    data,
    autor: { matricula: autor.matricula, nome: autor.nome },
    motivo,
  });
  if (status === "APROVADA") s.dataAprovacao = data;
  if (status === "DEVOLVIDA") s.dataDevolucao = data;
  s.motivoDevolucao = status === "DEVOLVIDA" ? motivo : null;
  s.expiraEm = prazoDe(s);
  return { ok: true, solicitacao: s };
}

const FORA_DA_TRIAGEM =
  "Só é possível aprovar ou devolver solicitações com status Solicitada ou Reenviada.";

export function aprovar(id: string, autor: Usuario): Resultado {
  const s = buscar(id);
  if (!s) return falha(404, "Solicitação não encontrada.");
  if (!STATUSES_EM_TRIAGEM.includes(s.status)) {
    return falha(400, FORA_DA_TRIAGEM);
  }
  return transicionar(s, "APROVADA", autor);
}

export function devolver(
  id: string,
  motivo: string,
  autor: Usuario,
): Resultado {
  const s = buscar(id);
  if (!s) return falha(404, "Solicitação não encontrada.");
  if (!STATUSES_EM_TRIAGEM.includes(s.status)) {
    return falha(400, FORA_DA_TRIAGEM);
  }
  return transicionar(s, "DEVOLVIDA", autor, motivo);
}

/** Admin cancels any request; Comum only their own. */
export function cancelar(id: string, autor: Usuario): Resultado {
  const s = buscar(id);
  if (!s) return falha(404, "Solicitação não encontrada.");
  if (autor.perfil !== "ADMIN" && s.solicitante.matricula !== autor.matricula) {
    return falha(403, "Você só pode cancelar as suas próprias solicitações.");
  }
  if (!STATUSES_CANCELAVEIS.includes(s.status)) {
    return falha(
      400,
      "Esta solicitação não pode mais ser cancelada no status atual.",
    );
  }
  return transicionar(s, "CANCELADA", autor);
}
