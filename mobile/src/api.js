import axios from 'axios';
import { criarApi, criarMockServidor } from '../../shared/src/index.js';
import { API_URL, USAR_MOCK } from './config';
import { obterSessao } from './sessao';

const http = axios.create({ baseURL: API_URL, timeout: 20000 });

// CPTM-57: toda requisição leva o JWT da sessão.
http.interceptors.request.use((config) => {
  const sessao = obterSessao();
  if (sessao?.token) config.headers.Authorization = `Bearer ${sessao.token}`;
  return config;
});

let aoExpirar = () => {};

/** O AuthContext registra aqui o logout automático (401 = token inválido/expirado). */
export function definirAoExpirarSessao(callback) {
  aoExpirar = callback;
}

http.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const ehLogin = erro?.config?.url?.includes('/auth/login');
    if (erro?.response?.status === 401 && !ehLogin) aoExpirar();
    return Promise.reject(erro);
  },
);

export const api = criarApi({
  http,
  usarMock: USAR_MOCK,
  mock: USAR_MOCK ? criarMockServidor({ obterSessao }) : undefined,
});
