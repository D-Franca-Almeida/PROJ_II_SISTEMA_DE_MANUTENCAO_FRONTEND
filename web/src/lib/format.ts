const FUSO = "America/Sao_Paulo";

const data = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** dd/mm/aaaa */
export function formatarData(iso: string): string {
  return data.format(new Date(iso));
}

/** dd/mm/aaaa hh:mm */
export function formatarDataHora(iso: string): string {
  return dataHora.format(new Date(iso)).replace(",", "");
}

export type Prazo = { texto: string; urgente: boolean };

/** Deadline wording shared with the mobile app ("Expira em N dias"). */
export function descreverPrazo(expiraEm: string, agora = Date.now()): Prazo {
  const restante = new Date(expiraEm).getTime() - agora;
  if (restante <= 0) return { texto: "Prazo expirado", urgente: true };
  const dias = Math.ceil(restante / (24 * 60 * 60 * 1000));
  if (dias === 1) return { texto: "Expira em 1 dia", urgente: true };
  return { texto: `Expira em ${dias} dias`, urgente: dias <= 2 };
}
