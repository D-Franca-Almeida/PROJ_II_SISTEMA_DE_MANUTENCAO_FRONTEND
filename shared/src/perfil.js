/**
 * Perfis do sistema — mesmo texto da claim "Perfil" do JWT emitido pela API
 * (AuthService.cs: "Comum", "Tecnico", "Administrativo").
 */
export const PERFIL = Object.freeze({
  COMUM: 'Comum',
  TECNICO: 'Tecnico',
  ADMINISTRATIVO: 'Administrativo',
});

/** Perfis que usam o app mobile. O Administrativo usa só o web. */
export const PERFIS_MOBILE = Object.freeze([PERFIL.COMUM, PERFIL.TECNICO]);

function base64UrlParaTexto(trecho) {
  let base64 = trecho.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binario = atob(base64);
  // bytes UTF-8 -> string (acentos na matrícula/nome, se houver)
  let codificado = '';
  for (let i = 0; i < binario.length; i++) {
    codificado += '%' + binario.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return decodeURIComponent(codificado);
}

function textoParaBase64Url(texto) {
  const bytes = encodeURIComponent(texto).replace(/%([0-9A-F]{2})/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16)),
  );
  return btoa(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Lê o payload do JWT SEM validar a assinatura (quem valida é a API).
 * @param {string} token
 * @returns {Record<string, any> | null}
 */
export function decodificarJwt(token) {
  if (typeof token !== 'string') return null;
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  try {
    return JSON.parse(base64UrlParaTexto(partes[1]));
  } catch {
    return null;
  }
}

/**
 * @typedef {Object} Sessao
 * @property {string} token
 * @property {string} matricula
 * @property {string} perfil
 * @property {number | null} expiraEm  epoch em ms (claim "exp")
 */

/**
 * Monta a sessão a partir do token. Devolve null se o token for inválido,
 * estiver sem as claims Matricula/Perfil ou já tiver expirado.
 * @param {string} token
 * @param {number} [agora]
 * @returns {Sessao | null}
 */
export function sessaoDoToken(token, agora = Date.now()) {
  const payload = decodificarJwt(token);
  if (!payload) return null;
  const matricula = payload.Matricula;
  const perfil = payload.Perfil;
  if (!matricula || !perfil) return null;
  const expiraEm = typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  if (expiraEm !== null && expiraEm <= agora) return null;
  return { token, matricula, perfil, expiraEm };
}

/**
 * Gera um JWT falso (sem assinatura válida) para o mock. Nunca use contra a API real.
 * @param {{ Matricula: string, Perfil: string }} claims
 * @param {number} [horas]
 */
export function gerarJwtFalso(claims, horas = 8) {
  const header = textoParaBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + horas * 3600;
  const payload = textoParaBase64Url(JSON.stringify({ ...claims, exp }));
  return `${header}.${payload}.mock`;
}
