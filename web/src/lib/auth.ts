/**
 * MOCK of the real RBAC login (US-03 / CPTM-11), which is not wired into this
 * app yet. Accounts are fixed (there is no sign-up: they are created
 * beforehand in the database) and each one has a fixed bearer token, so the
 * access rules of the API (no token → 401, wrong profile → 403) can be
 * exercised.
 *
 * When real auth lands, replace `entrar` and `usuarioDoToken` with calls to
 * it; the route handlers do not need to change.
 */

export type Perfil = "ADMIN" | "LOGISTICA" | "TECNICO" | "COMUM";

export type Usuario = {
  matricula: string;
  nome: string;
  email: string;
  perfil: Perfil;
};

/** What a successful login returns, and what the browser keeps. */
export type Sessao = { token: string; usuario: Usuario };

/** Profiles that use this web panel. Técnico and Comum use the mobile app. */
export const PERFIS_WEB: readonly Perfil[] = ["ADMIN", "LOGISTICA"];

/** Every fictitious account shares this password. */
const SENHA_FICTICIA = "senha";

const CONTAS: Record<string, Usuario> = {
  "mock-admin": {
    matricula: "admin123",
    nome: "Administrador Fictício",
    email: "admin@cptm.example",
    perfil: "ADMIN",
  },
  "mock-logistica": {
    matricula: "log123",
    nome: "Logística Fictícia",
    email: "logistica@cptm.example",
    perfil: "LOGISTICA",
  },
  "mock-tecnico": {
    matricula: "tec123",
    nome: "Técnico de Oficina Fictício",
    email: "tecnico@cptm.example",
    perfil: "TECNICO",
  },
  "mock-tecnico-2": {
    matricula: "tec456",
    nome: "Técnico de Oficina Fictício B",
    email: "tecnico2@cptm.example",
    perfil: "TECNICO",
  },
  "mock-comum": {
    matricula: "comum123",
    nome: "Solicitante Fictício A",
    email: "comum@cptm.example",
    perfil: "COMUM",
  },
};

/** Checks e-mail and password. Null when they do not match an account. */
export function entrar(email: string, senha: string): Sessao | null {
  const procurado = email.trim().toLowerCase();
  const conta = Object.entries(CONTAS).find(
    ([, usuario]) => usuario.email === procurado,
  );
  if (!conta || senha !== SENHA_FICTICIA) return null;
  const [token, usuario] = conta;
  return { token, usuario };
}

function usuarioDoToken(request: Request): Usuario | null {
  const cabecalho = request.headers.get("authorization") ?? "";
  const token = cabecalho.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  return token ? (CONTAS[token] ?? null) : null;
}

function erro(mensagem: string, status: number): Response {
  return Response.json({ erro: mensagem }, { status });
}

/**
 * Resolves the caller or the response to send back instead:
 * 401 without a valid token, 403 when the profile is not allowed.
 */
export function autenticar(
  request: Request,
  perfis: readonly Perfil[],
):
  | { usuario: Usuario; negado?: never }
  | { negado: Response; usuario?: never } {
  const usuario = usuarioDoToken(request);
  if (!usuario) {
    return {
      negado: erro("Sessão ausente ou expirada. Entre novamente.", 401),
    };
  }
  if (!perfis.includes(usuario.perfil)) {
    return { negado: erro("Seu perfil não tem acesso a esta ação.", 403) };
  }
  return { usuario };
}
