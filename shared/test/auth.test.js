import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PERFIL,
  decodificarJwt,
  sessaoDoToken,
  gerarJwtFalso,
  criarMockServidor,
  mensagemDeErro,
} from '../src/index.js';

// Token real emitido pela API (.NET JwtSecurityTokenHandler), payload: Matricula, Perfil, nbf, exp, iat.
const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const payloadApi = Buffer.from(
  JSON.stringify({ Matricula: 'comum123', Perfil: 'Comum', nbf: 1, exp: 4102444800, iat: 1 }),
).toString('base64url');
const TOKEN_API = `${header}.${payloadApi}.assinatura`;

test('lê as claims Matricula e Perfil do JWT da API', () => {
  const sessao = sessaoDoToken(TOKEN_API);
  assert.equal(sessao.matricula, 'comum123');
  assert.equal(sessao.perfil, PERFIL.COMUM);
  assert.equal(sessao.expiraEm, 4102444800 * 1000);
});

test('token inválido, sem claims ou expirado não vira sessão', () => {
  assert.equal(sessaoDoToken('lixo'), null);
  assert.equal(decodificarJwt('a.b'), null);
  const semPerfil = `${header}.${Buffer.from('{"Matricula":"x"}').toString('base64url')}.s`;
  assert.equal(sessaoDoToken(semPerfil), null);
  const expirado = `${header}.${Buffer.from('{"Matricula":"x","Perfil":"Comum","exp":10}').toString('base64url')}.s`;
  assert.equal(sessaoDoToken(expirado), null);
});

test('JWT falso do mock preserva acentos', () => {
  const sessao = sessaoDoToken(gerarJwtFalso({ Matricula: 'joão', Perfil: PERFIL.TECNICO }));
  assert.equal(sessao.matricula, 'joão');
  assert.equal(sessao.perfil, 'Tecnico');
});

test('mock: login com os usuários da API e 401 com senha errada', async () => {
  const mock = criarMockServidor({ atrasoMs: 0, obterSessao: () => null });
  const token = await mock.login('tec123', 'senha');
  assert.equal(sessaoDoToken(token).perfil, PERFIL.TECNICO);

  await assert.rejects(mock.login('tec123', 'errada'), (e) => {
    assert.equal(e.response.status, 401);
    assert.equal(mensagemDeErro(e), 'Matrícula ou senha inválidos.');
    return true;
  });
});

test('mensagemDeErro entende os formatos da API', () => {
  const erro = (status, data) => ({ response: { status, data } });
  assert.equal(mensagemDeErro(erro(400, { erro: 'Transição inválida' })), 'Transição inválida');
  assert.equal(mensagemDeErro(erro(401, { message: 'Matrícula ou senha inválidos.' })), 'Matrícula ou senha inválidos.');
  assert.match(mensagemDeErro(erro(403, '')), /Acesso negado/);
  assert.match(mensagemDeErro({}), /Sem conexão/);
});
