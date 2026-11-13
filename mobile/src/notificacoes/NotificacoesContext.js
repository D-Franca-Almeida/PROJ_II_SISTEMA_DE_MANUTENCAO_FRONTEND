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
  /** primeira carga da sessão (a tela não mostra "sem notificações" enquanto isso) */
  const [carregando, setCarregando] = useState(false);
  /** só quando a pessoa puxa a lista para atualizar (spinner do RefreshControl) */
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(null);
  /**
   * Muda a cada troca de sessão (sair/entrar) e ao desmontar. Uma resposta que chega
   * depois disso pertence a outro usuário e é descartada.
   */
  const geracao = useRef(0);

  /**
   * Busca as notificações. Sem `puxou`, roda em segundo plano (timer, foco, app ativo)
   * e não liga o spinner.
   * @param {{ puxou?: boolean }} [opcoes]
   */
  const atualizar = useCallback(
    async ({ puxou = false } = {}) => {
      if (!sessao) return;
      const minhaGeracao = geracao.current;
      const atual = () => geracao.current === minhaGeracao;
      if (puxou) setAtualizando(true);
      try {
        const dados = await api.listarNotificacoes();
        if (atual()) {
          setLista(dados);
          setErro(null);
        }
      } catch (e) {
        if (atual()) setErro(mensagemDeErro(e));
      } finally {
        if (atual()) {
          setCarregando(false);
          if (puxou) setAtualizando(false);
        }
      }
    },
    [sessao],
  );

  // carrega ao entrar, a cada minuto e quando o app volta ao primeiro plano
  useEffect(() => {
    setLista([]);
    setErro(null);
    setAtualizando(false);
    if (!sessao) {
      setCarregando(false);
      return undefined;
    }
    setCarregando(true);
    atualizar();
    const timer = setInterval(atualizar, INTERVALO_MS);
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') atualizar();
    });
    return () => {
      geracao.current += 1; // invalida respostas em andamento desta sessão
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
      atualizando,
      erro,
      atualizar,
      marcarLida,
    }),
    [lista, carregando, atualizando, erro, atualizar, marcarLida],
  );

  return <NotificacoesContext.Provider value={valor}>{children}</NotificacoesContext.Provider>;
}

export function useNotificacoes() {
  const valor = useContext(NotificacoesContext);
  if (!valor) throw new Error('useNotificacoes precisa estar dentro de <NotificacoesProvider>.');
  return valor;
}
