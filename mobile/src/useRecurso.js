import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { mensagemDeErro, statusDoErro } from '../../shared/src/index.js';

/**
 * Carrega um recurso da API e recarrega toda vez que a tela volta ao foco
 * (ex.: depois de reenviar/cancelar, a lista já aparece atualizada).
 *
 * @template T
 * @param {() => Promise<T>} carregar  função estável (useCallback)
 */
export function useRecurso(carregar) {
  const [dados, setDados] = useState(/** @type {T | null} */ (null));
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(/** @type {{ mensagem: string, status: number | null } | null} */ (null));
  const temDados = useRef(false);

  const executar = useCallback(
    async (puxou = false) => {
      if (puxou) setAtualizando(true);
      else if (!temDados.current) setCarregando(true);
      try {
        const resultado = await carregar();
        temDados.current = true;
        setDados(resultado);
        setErro(null);
      } catch (e) {
        setErro({ mensagem: mensagemDeErro(e), status: statusDoErro(e) });
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [carregar],
  );

  useFocusEffect(
    useCallback(() => {
      executar();
    }, [executar]),
  );

  return {
    dados,
    setDados,
    carregando,
    atualizando,
    erro,
    recarregar: () => executar(false),
    puxarParaAtualizar: () => executar(true),
  };
}
