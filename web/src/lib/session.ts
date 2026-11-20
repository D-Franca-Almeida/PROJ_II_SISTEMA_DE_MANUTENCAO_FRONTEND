"use client";

import { useEffect, useState } from "react";
import type { Sessao } from "@/lib/auth";

/**
 * Browser session: the login answer kept in localStorage.
 *
 * This is the simplest thing that works for the mock. With the real login,
 * prefer an httpOnly cookie set by the server (a token in localStorage can be
 * read by any script on the page); `http.ts` and `useSessao` are the only
 * callers to adapt.
 */
const CHAVE = "cptm.sessao";
const EVENTO = "cptm:sessao";

export function lerSessao(): Sessao | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    const sessao = bruto ? (JSON.parse(bruto) as Partial<Sessao>) : null;
    return sessao?.token && sessao.usuario?.perfil ? (sessao as Sessao) : null;
  } catch {
    return null;
  }
}

export function salvarSessao(sessao: Sessao): void {
  window.localStorage.setItem(CHAVE, JSON.stringify(sessao));
  window.dispatchEvent(new Event(EVENTO));
}

export function encerrarSessao(): void {
  window.localStorage.removeItem(CHAVE);
  window.dispatchEvent(new Event(EVENTO));
}

export function getToken(): string | null {
  return lerSessao()?.token ?? null;
}

/**
 * The current session. `undefined` until the browser has been asked (first
 * render and server render), then the session or `null`. Follows login and
 * logout, including from another tab.
 */
export function useSessao(): Sessao | null | undefined {
  const [sessao, setSessao] = useState<Sessao | null | undefined>(undefined);

  useEffect(() => {
    const atualizar = () => setSessao(lerSessao());
    atualizar();
    window.addEventListener(EVENTO, atualizar);
    window.addEventListener("storage", atualizar);
    return () => {
      window.removeEventListener(EVENTO, atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, []);

  return sessao;
}
