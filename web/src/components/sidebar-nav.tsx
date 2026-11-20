"use client";

import { List, type LucideIcon, Package, UserCheck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Perfil } from "@/lib/auth";
import { type Pagina, paginasDe } from "@/lib/navegacao";

const ICONE: Record<Pagina["href"], LucideIcon> = {
  "/solicitacoes": List,
  "/atribuicoes": UserCheck,
  "/tecnicos": Users,
  "/logistica": Package,
};

/**
 * Only the pages the profile may open. Vertical in the desktop sidebar; a
 * horizontal strip under the app bar on small screens.
 */
export function SidebarNav({
  perfil,
  horizontal,
}: {
  perfil: Perfil;
  horizontal?: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className={horizontal ? "flex gap-1 overflow-x-auto" : "grid gap-1"}
    >
      {paginasDe(perfil).map(({ href, rotulo }) => {
        const ativo = pathname === href || pathname.startsWith(`${href}/`);
        const Icone = ICONE[href];
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={`flex h-9 shrink-0 items-center gap-3 rounded-md px-3 text-[0.9375rem] font-semibold transition-colors duration-[120ms] ${
              ativo
                ? "bg-cptm-red-tint text-cptm-red"
                : "text-ink-muted hover:bg-surface-hover hover:text-ink"
            }`}
          >
            <Icone size={20} aria-hidden="true" className="shrink-0" />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
