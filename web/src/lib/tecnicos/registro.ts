import type { Pessoa } from "@/lib/solicitacoes/types";

/** Fictitious technicians. Matrículas match the mock tokens in `auth.ts`. */
export const TEC_A: Pessoa = {
  matricula: "tec123",
  nome: "Técnico de Oficina Fictício",
};
export const TEC_B: Pessoa = {
  matricula: "tec456",
  nome: "Técnico de Oficina Fictício B",
};
/** Has no work order yet, so the "no orders" case is visible. */
export const TEC_C: Pessoa = {
  matricula: "tec789",
  nome: "Técnico de Oficina Fictício C",
};

export const TECNICOS: readonly Pessoa[] = [TEC_A, TEC_B, TEC_C];
