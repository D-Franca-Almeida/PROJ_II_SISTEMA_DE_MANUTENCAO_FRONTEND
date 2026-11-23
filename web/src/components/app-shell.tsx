"use client";

import { LogOut, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import logoCptm from "@/assets/Cptm_icon.svg.webp";
import { inicioDe, podeAbrir } from "@/lib/navegacao";
import { USANDO_API_REAL } from "@/lib/http";
import { encerrarSessao, useSessao } from "@/lib/session";
import { SidebarNav } from "./sidebar-nav";

/**
 * Frame of every signed-in page. It is also the gate: without a session it
 * sends the user to /login, and a profile that may not open the current page
 * is sent to its own start page. Nothing is rendered until that is settled.
 *
 * This is a convenience, not security: the API checks the token and profile
 * on every request.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const sessao = useSessao();
  const router = useRouter();
  const pathname = usePathname();

  const perfil = sessao?.usuario.perfil;
  const inicio = perfil ? inicioDe(perfil) : null;
  const permitido = perfil ? podeAbrir(pathname, perfil) : false;

  useEffect(() => {
    if (sessao === undefined) return;
    if (sessao === null || !inicio) {
      if (sessao) encerrarSessao();
      router.replace("/login");
    } else if (!permitido) {
      router.replace(inicio);
    }
  }, [sessao, inicio, permitido, router]);

  if (!sessao || !perfil || !inicio || !permitido) return null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="on-red sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 bg-cptm-red px-4 text-white md:px-6">
        <Link href={inicio} className="flex items-center gap-3 rounded-sm">
          {/* The mark is red, so it sits on a white disc to stay visible on the red bar. */}
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white">
            <Image
              src={logoCptm}
              alt=""
              sizes="22px"
              priority
              className="h-auto w-[22px]"
            />
          </span>
          <span className="flex items-baseline gap-2">
            <span className="text-[1.375rem] font-extrabold leading-none tracking-[-0.01em]">
              CPTM
            </span>
            <span className="hidden text-[0.9375rem] leading-none sm:inline">
              SSL · Manutenção
            </span>
          </span>
        </Link>

        <span className="badge badge-environment ml-auto">
          {USANDO_API_REAL ? (
            <>
              Nuvem Azure
              <span className="hidden md:inline">&nbsp;— API em produção</span>
            </>
          ) : (
            <>
              Modo mock
              <span className="hidden md:inline">&nbsp;— dados fictícios</span>
            </>
          )}
        </span>
        <span className="flex items-center gap-2 text-[0.9375rem] font-semibold">
          <User size={20} aria-hidden="true" className="shrink-0" />
          <span className="hidden max-w-[220px] truncate sm:inline">
            {sessao.usuario.nome}
          </span>
        </span>
        <button
          type="button"
          className="btn btn-on-red"
          onClick={() => {
            encerrarSessao();
            router.replace("/login");
          }}
        >
          <LogOut size={18} aria-hidden="true" className="shrink-0" />
          <span className="hidden sm:inline">Sair</span>
          <span className="sr-only sm:hidden">Sair</span>
        </button>
      </header>

      <div className="border-b border-line bg-surface px-4 py-2 md:px-6 lg:hidden">
        <SidebarNav perfil={perfil} horizontal />
      </div>

      <div className="flex flex-1">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 border-r border-line bg-surface p-3 lg:block">
          <SidebarNav perfil={perfil} />
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
