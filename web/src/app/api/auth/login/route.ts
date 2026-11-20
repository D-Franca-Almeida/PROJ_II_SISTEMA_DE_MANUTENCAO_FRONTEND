import { entrar, PERFIS_WEB } from "@/lib/auth";
import { login } from "@/lib/auth-schemas";
import { lerCorpo } from "@/lib/validacao";

/**
 * POST /api/auth/login { email, senha } → 200 { token, usuario }.
 * 400 when a field is missing or the e-mail is malformed, 401 when they do
 * not match an account, 403 when the account's profile does not use the web
 * panel.
 * ASSUMPTION: path and shape are ours until the real login is wired in.
 */
export async function POST(request: Request) {
  const corpo = await lerCorpo(request, login);
  if (corpo.negado) return corpo.negado;

  const sessao = entrar(corpo.dados.email, corpo.dados.senha);
  if (!sessao) {
    return Response.json(
      { erro: "E-mail ou senha incorretos." },
      { status: 401 },
    );
  }
  if (!PERFIS_WEB.includes(sessao.usuario.perfil)) {
    return Response.json(
      {
        erro: "Este painel é para a administração e a logística. Técnicos e solicitantes usam o aplicativo.",
      },
      { status: 403 },
    );
  }
  return Response.json(sessao);
}
