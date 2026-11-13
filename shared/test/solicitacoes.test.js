import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STATUS,
  PERFIL,
  normalizarSolicitacao,
  calcularDiasParaExpirar,
  mensagemDeErro,
} from '../src/index.js';
import { mockComSessao } from './apoio.js';

test('CPTM-61: minhas solicitações só traz as do dono, mais recente primeiro', async () => {
  const { api } = mockComSessao('comum123', PERFIL.COMUM);
  const lista = await api.listarMinhasSolicitacoes();
  assert.ok(lista.length > 0);
  assert.ok(lista.every((s) => s.matriculaSolicitante === 'comum123'));
  for (let i = 1; i < lista.length; i++) {
    assert.ok(lista[i - 1].dataAbertura >= lista[i].dataAbertura);
  }
});

test('CPTM-61: SSL de outro dono devolve 403', async () => {
  const { api } = mockComSessao('comum123', PERFIL.COMUM);
  const deOutro = (await api.listarSolicitacoes()).find((s) => s.matriculaSolicitante !== 'comum123');
  await assert.rejects(api.obterSolicitacao(deOutro.id), (e) => {
    assert.equal(e.response.status, 403);
    assert.match(mensagemDeErro(e), /Acesso negado/);
    return true;
  });
});

test('CPTM-61: detalhe da devolvida traz o motivo da devolução', async () => {
  const { api } = mockComSessao('comum123', PERFIL.COMUM);
  const devolvida = (await api.listarMinhasSolicitacoes()).find((s) => s.status === STATUS.DEVOLVIDA);
  const detalhe = await api.obterSolicitacao(devolvida.id);
  assert.ok(detalhe.motivoDevolucao.length > 0);
  assert.equal(detalhe.equipamento.codigo.length > 0, true);
});

test('DiasParaExpirar só em DEVOLVIDA e APROVADA', () => {
  const agora = Date.parse('2026-11-13T12:00:00Z');
  const dataStatus = '2026-11-05T12:00:00Z'; // 8 dias atrás
  assert.equal(calcularDiasParaExpirar({ status: STATUS.DEVOLVIDA, dataStatus }, agora), 2);
  assert.equal(calcularDiasParaExpirar({ status: STATUS.APROVADA, dataStatus }, agora), 2);
  assert.equal(calcularDiasParaExpirar({ status: STATUS.SOLICITADA, dataStatus }, agora), null);
});

test('normaliza a entidade Solicitacao.cs atual da API', () => {
  const s = normalizarSolicitacao({
    id: 10,
    descricao: 'Bebedouro sem pressão',
    status: 'EM MANUTENCAO',
    motivoDevolucao: null,
    matriculaSolicitante: 'comum123',
    matriculaTecnico: 'tec123',
    dataInicioManutencao: '2026-11-10T10:00:00Z',
  });
  assert.equal(s.status, STATUS.MANUTENCAO);
  assert.equal(s.numero, 'SSL 10');
  assert.equal(s.ordemServico.matriculaTecnico, 'tec123');
  assert.equal(s.ordemServico.dataInicio, '2026-11-10T10:00:00Z');
  assert.deepEqual(s.historico, []);
});
