import axios from 'axios';
import { criarApi, criarMockServidor } from '../../shared/src/index.js';
import { API_URL, USAR_MOCK } from './config';

const http = axios.create({ baseURL: API_URL, timeout: 20000 });

// TODO(CPTM-27/JWT): anexar "Authorization: Bearer <token>" quando o login existir.

export const api = criarApi({
  http,
  usarMock: USAR_MOCK,
  mock: USAR_MOCK ? criarMockServidor({ usuario: 'andre.franca' }) : undefined,
});
