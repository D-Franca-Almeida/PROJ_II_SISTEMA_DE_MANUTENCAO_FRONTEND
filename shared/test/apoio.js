// Utilitário dos testes (sem testes próprios).
import { criarMockServidor } from '../src/index.js';

/** Mock com sessão trocável, como no app. */
export function mockComSessao(matricula, perfil) {
  const ref = { sessao: { matricula, perfil } };
  const api = criarMockServidor({ atrasoMs: 0, obterSessao: () => ref.sessao });
  return { api, entrarComo: (m, p) => (ref.sessao = { matricula: m, perfil: p }) };
}
