import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { mensagemDeErro } from '../../../shared/src/index.js';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';

/** Intervalo de atualização do contador do sino (só in-app; push está fora do escopo). */
const INTERVALO_MS = 60_000;

const NotificacoesContext = createContext(null);

/** CPTM-86 — estado das notificações compartilhado entre o sino e a tela. */
export function NotificacoesProvider({ children }) {
  const { sessao } = useAuth();
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const montado = useRef(true);

  const atualizar = useCallback(async () => {
    if (!sessao) return;
    setCarregando(true);
    try {
      const dados = await api.listarNotificacoes();
      if (montado.current) {
        setLista(dados);
        setErro(null);
      }
    } catch (e) {
      if (montado.current) setErro(mensagemDeErro(e));
    } finally {
      if (montado.current) setCarregando(false);
    }
  }, [sessao]);

  // carrega ao entrar, a cada minuto e quando o app volta ao primeiro plano
  useEffect(() => {
    montado.current = true;
    if (!sessao) {
      setLista([]);
      return undefined;
    }
    atualizar();
    const timer = setInterval(atualizar, INTERVALO_MS);
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') atualizar();
    });
    return () => {
      montado.current = false;
      clearInterval(timer);
      assinatura.remove();
    };
  }, [sessao, atualizar]);

  const marcarLida = useCallback(async (id) => {
    setLista((atual) => atual.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    try {
      await api.marcarNotificacaoLida(id);
    } catch {
      // se falhar, a próxima atualização traz o estado real
    }
  }, []);

  const valor = useMemo(
    () => ({
      lista,
      naoLidas: lista.filter((n) => !n.lida).length,
      carregando,
      erro,
      atualizar,
      marcarLida,
    }),
    [lista, carregando, erro, atualizar, marcarLida],
  );

  return <NotificacoesContext.Provider value={valor}>{children}</NotificacoesContext.Provider>;
}

export function useNotificacoes() {
  const valor = useContext(NotificacoesContext);
  if (!valor) throw new Error('useNotificacoes precisa estar dentro de <NotificacoesProvider>.');
  return valor;
}
