import type { Sessao } from "@/lib/auth";
import { postJson } from "@/lib/http";

/** `publico`: a 401 here means wrong credentials, not an expired session. */
export function entrarNaApi(email: string, senha: string): Promise<Sessao> {
  return postJson<Sessao>(
    "/api/auth/login",
    { email, senha },
    { publico: true },
  );
}
