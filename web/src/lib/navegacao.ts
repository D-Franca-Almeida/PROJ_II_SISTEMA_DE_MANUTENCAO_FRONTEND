import type { Perfil } from "@/lib/auth";

/** The pages of the panel and which profiles may open each one. */
export const PAGINAS = [
  { href: "/solicitacoes", rotulo: "Solicitações", perfis: ["ADMIN"] },
  { href: "/atribuicoes", rotulo: "SSL por técnico", perfis: ["ADMIN"] },
  { href: "/tecnicos", rotulo: "Técnicos", perfis: ["ADMIN"] },
  { href: "/logistica", rotulo: "Logística", perfis: ["ADMIN", "LOGISTICA"] },
] as const satisfies readonly {
  href: string;
  rotulo: string;
  perfis: readonly Perfil[];
}[];

export type Pagina = (typeof PAGINAS)[number];

const pode = (pagina: Pagina, perfil: Perfil) =>
  (pagina.perfis as readonly Perfil[]).includes(perfil);

export function paginasDe(perfil: Perfil): Pagina[] {
  return PAGINAS.filter((pagina) => pode(pagina, perfil));
}

/** Where a profile lands after login. Null when it has no page here. */
export function inicioDe(perfil: Perfil): string | null {
  return paginasDe(perfil)[0]?.href ?? null;
}

export function podeAbrir(pathname: string, perfil: Perfil): boolean {
  const pagina = PAGINAS.find(
    (p) => pathname === p.href || pathname.startsWith(`${p.href}/`),
  );
  return pagina ? pode(pagina, perfil) : true;
}
