import * as SecureStore from 'expo-secure-store';
import { sessaoDoToken } from '../../shared/src/index.js';

/**
 * Sessão atual (token JWT + claims). Fica em memória para o Axios/mock lerem
 * a cada requisição e é persistida no SecureStore (Keychain/Keystore).
 */
const CHAVE_TOKEN = 'cptm.ssl.token';

/** @type {import('../../shared/src/perfil.js').Sessao | null} */
let atual = null;

export const obterSessao = () => atual;

/** Lê o token salvo; devolve null se não houver ou se já expirou. */
export async function restaurarSessao() {
  let token = null;
  try {
    token = await SecureStore.getItemAsync(CHAVE_TOKEN);
  } catch {
    // SecureStore indisponível (ex.: web): segue sem sessão
  }
  atual = token ? sessaoDoToken(token) : null;
  if (token && !atual) await limparSessao();
  return atual;
}

/** @param {import('../../shared/src/perfil.js').Sessao} sessao */
export async function salvarSessao(sessao) {
  atual = sessao;
  try {
    await SecureStore.setItemAsync(CHAVE_TOKEN, sessao.token);
  } catch {
    // sem persistência: a sessão vale até fechar o app
  }
}

export async function limparSessao() {
  atual = null;
  try {
    await SecureStore.deleteItemAsync(CHAVE_TOKEN);
  } catch {
    // nada a apagar
  }
}
