import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STATUS,
  PERFIL,
  normalizarSolicitacao,
  calcularDiasParaExpirar,
  mensagemDeErro,
  validarReenvio,
  podeCancelar,
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

test('CPTM-35: reenvio exige correção, só DEVOLVIDA e só o dono', async () => {
  const { api, entrarComo } = mockComSessao('comum123', PERFIL.COMUM);
  const minhas = await api.listarMinhasSolicitacoes();
  const devolvida = minhas.find((s) => s.status === STATUS.DEVOLVIDA);
  const solicitada = minhas.find((s) => s.status === STATUS.SOLICITADA);

  // sem alteração -> 400 com a mensagem do critério de aceite
  await assert.rejects(
    api.reenviarSolicitacao(devolvida.id, { descricao: devolvida.descricao, foto: null }),
    (e) => e.response.status === 400 && mensagemDeErro(e) === 'Faça a correção antes de reenviar.',
  );
  // status errado -> 400
  await assert.rejects(
    api.reenviarSolicitacao(solicitada.id, { descricao: 'Descrição corrigida e detalhada.' }),
    (e) => e.response.status === 400,
  );
  // outro dono -> 403
  entrarComo('outro456', PERFIL.COMUM);
  await assert.rejects(
    api.reenviarSolicitacao(devolvida.id, { descricao: 'Tentativa de outro usuário.' }),
    (e) => e.response.status === 403,
  );

  entrarComo('comum123', PERFIL.COMUM);
  await api.reenviarSolicitacao(devolvida.id, { foto: { uri: 'file:///nova.jpg', name: 'n.jpg', type: 'image/jpeg' } });
  const depois = await api.obterSolicitacao(devolvida.id);
  assert.equal(depois.status, STATUS.REENVIADA);
  assert.equal(depois.fotoUrl, 'file:///nova.jpg');
});

test('CPTM-35: validarReenvio detecta "sem alteração"', () => {
  const original = { descricao: 'Inversor não energiza; display apagado.' };
  assert.equal(validarReenvio(original, { descricao: original.descricao, foto: null }).semAlteracao, true);
  assert.equal(validarReenvio(original, { descricao: original.descricao + ' Fusível ok.', foto: null }).semAlteracao, false);
  assert.equal(validarReenvio(original, { descricao: original.descricao, foto: { uri: 'x' } }).semAlteracao, false);
  assert.ok(validarReenvio(original, { descricao: 'curta', foto: null }).erros.descricao);
});

test('CPTM-64: cancelar só até APROVADA, só o dono, técnico proibido', async () => {
  const { api, entrarComo } = mockComSessao('comum123', PERFIL.COMUM);
  const minhas = await api.listarMinhasSolicitacoes();
  const aprovada = minhas.find((s) => s.status === STATUS.APROVADA);
  const recebida = minhas.find((s) => s.status === STATUS.RECEBIDA);

  assert.equal(podeCancelar(STATUS.APROVADA), true);
  assert.equal(podeCancelar(STATUS.RECEBIDA), false);

  await assert.rejects(api.cancelarSolicitacao(recebida.id), (e) => e.response.status === 400);

  entrarComo('outro456', PERFIL.COMUM);
  await assert.rejects(api.cancelarSolicitacao(aprovada.id), (e) => e.response.status === 403);
  entrarComo('tec123', PERFIL.TECNICO);
  await assert.rejects(api.cancelarSolicitacao(aprovada.id), (e) => e.response.status === 403);

  entrarComo('comum123', PERFIL.COMUM);
  await api.cancelarSolicitacao(aprovada.id);
  assert.equal((await api.obterSolicitacao(aprovada.id)).status, STATUS.CANCELADA);
});
