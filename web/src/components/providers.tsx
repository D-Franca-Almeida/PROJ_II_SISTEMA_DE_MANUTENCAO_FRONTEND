"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { ApiError } from "@/lib/http";
import { useSessao } from "@/lib/session";

function criarQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Lists are shown from cache at once and refreshed behind the scenes
        // after this long, or whenever the window regains focus.
        staleTime: 15_000,
        // An answer from the server (400, 403, 404…) will not change by asking
        // again. Only a network failure (status 0) is worth one more try.
        retry: (tentativas, erro) =>
          erro instanceof ApiError && erro.status === 0 && tentativas < 1,
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  // One client per browser tab, created once (never at module level, so it is
  // never shared between server renders).
  const [queryClient] = useState(criarQueryClient);

  // The cache holds the signed-in user's data; drop it as soon as the session
  // ends so the next person to sign in on this tab never sees it.
  const sessao = useSessao();
  useEffect(() => {
    if (sessao === null) queryClient.clear();
  }, [sessao, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
