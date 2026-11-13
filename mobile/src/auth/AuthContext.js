import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PERFIL, PERFIS_MOBILE, sessaoDoToken } from '../../../shared/src/index.js';
import { api, definirAoExpirarSessao } from '../api';
import { limparSessao, restaurarSessao, salvarSessao } from '../sessao';

/**
 * @typedef {Object} ValorAuth
 * @property {boolean} iniciando  lendo o token salvo
 * @property {import('../../../shared/src/perfil.js').Sessao | null} sessao
 * @property {string | null} aviso  mensagem para a tela de login (ex.: sessão expirada)
 * @property {(matricula: string, senha: string) => Promise<void>} entrar
 * @property {() => Promise<void>} sair
 */

const AuthContext = createContext(/** @type {ValorAuth | null} */ (null));

/** Erro de login com mensagem pronta para exibir. */
export class ErroLogin extends Error {}

export function AuthProvider({ children }) {
  const [iniciando, setIniciando] = useState(true);
  const [sessao, setSessao] = useState(null);
  const [aviso, setAviso] = useState(null);

  const sair = useCallback(async () => {
    await limparSessao();
    setSessao(null);
  }, []);

  useEffect(() => {
    restaurarSessao()
      .then(setSessao)
      .finally(() => setIniciando(false));

    definirAoExpirarSessao(() => {
      setAviso('Sua sessão expirou. Entre novamente.');
      sair();
    });
  }, [sair]);

  const entrar = useCallback(async (matricula, senha) => {
    const token = await api.login(matricula, senha);
    const nova = sessaoDoToken(token);
    if (!nova) throw new ErroLogin('Resposta de login inválida. Tente novamente.');
    if (!PERFIS_MOBILE.includes(nova.perfil)) {
      throw new ErroLogin(
        nova.perfil === PERFIL.ADMINISTRATIVO
          ? 'O perfil Administrativo usa o sistema web. Acesse pelo computador.'
          : `Perfil "${nova.perfil}" sem acesso ao app.`,
      );
    }
    await salvarSessao(nova);
    setAviso(null);
    setSessao(nova);
  }, []);

  const valor = useMemo(
    () => ({ iniciando, sessao, aviso, entrar, sair }),
    [iniciando, sessao, aviso, entrar, sair],
  );
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

/** @returns {ValorAuth} */
export function useAuth() {
  const valor = useContext(AuthContext);
  if (!valor) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return valor;
}
