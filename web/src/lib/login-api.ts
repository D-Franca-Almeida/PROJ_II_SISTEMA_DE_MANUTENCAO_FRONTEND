import { PERFIS_WEB, type Perfil, type Sessao } from "@/lib/auth";
import { ApiError, postJson, USANDO_API_REAL } from "@/lib/http";

type LoginBackendResp = {
  token: string;
  matricula?: string;
  nome?: string;
  perfil?: string;
};

function mapearPerfil(perfil?: string): Perfil {
  const p = (perfil ?? "").trim().toLowerCase();
  if (p === "administrativo" || p === "admin") return "ADMIN";
  if (p === "logistica") return "LOGISTICA";
  if (p === "tecnico") return "TECNICO";
  return "COMUM";
}

function extrairClaimsJwt(token: string): Record<string, string> {
  try {
    const parte = token.split(".")[1];
    if (!parte) return {};
    const base64 = parte.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as Record<string, string>;
  } catch {
    return {};
  }
}

/** `publico`: a 401 here means wrong credentials, not an expired session. */
export async function entrarNaApi(
  identificador: string,
  senha: string,
): Promise<Sessao> {
  if (!USANDO_API_REAL) {
    return postJson<Sessao>(
      "/api/auth/login",
      { email: identificador, senha },
      { publico: true },
    );
  }

  // Aceita matrícula direta ("admin123") ou e-mail do mock ("admin@cptm.example" -> "admin123")
  let matricula = identificador.trim();
  if (matricula.toLowerCase() === "admin@cptm.example") matricula = "admin123";
  else if (matricula.toLowerCase() === "logistica@cptm.example")
    matricula = "admin123";

  const resp = await postJson<LoginBackendResp>(
    "/api/Auth/login",
    { matricula, senha },
    { publico: true },
  );

  const claims = extrairClaimsJwt(resp.token);
  const perfil = mapearPerfil(resp.perfil ?? claims.Perfil);
  if (!PERFIS_WEB.includes(perfil)) {
    throw new ApiError(
      "Este painel é para a administração e a logística. Técnicos e solicitantes usam o aplicativo.",
      403,
    );
  }

  const mat = resp.matricula ?? claims.Matricula ?? matricula;
  const nome = resp.nome ?? claims.Nome ?? `Administrador (${mat})`;
  return {
    token: resp.token,
    usuario: {
      matricula: mat,
      nome,
      email: `${mat}@cptm.sp.gov.br`,
      perfil,
    },
  };
}
