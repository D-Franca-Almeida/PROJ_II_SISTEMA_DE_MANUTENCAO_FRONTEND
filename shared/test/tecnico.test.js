import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATUS, STATUS_PEDIDO, PERFIL, mensagemDeErro, pecasPendentesDoErro } from '../src/index.js';
import { mockComSessao } from './apoio.js';

test('CPTM-37: técnico assume da fila (RECEBIDA) e o item vai para "Minhas manutenções"', async () => {
  const { api } = mockComSessao('tec123', PERFIL.TECNICO);
  const fila = await api.listarFilaTecnico();
  assert.ok(fila.length > 0);
  assert.ok(fila.every((s) => s.status === STATUS.RECEBIDA));

  const alvo = fila[0];
  const r = await api.iniciarManutencao(alvo.id);
  assert.equal(r.novoStatus, STATUS.MANUTENCAO);

  assert.ok(!(await api.listarFilaTecnico()).some((s) => s.id === alvo.id));
  const minhas = await api.listarMinhasManutencoes();
  const assumida = minhas.find((s) => s.id === alvo.id);
  assert.equal(assumida.status, STATUS.MANUTENCAO);
  assert.equal(assumida.ordemServico.matriculaTecnico, 'tec123');
  assert.ok(assumida.ordemServico.id > 0);
});

test('CPTM-37: não assume fora de RECEBIDA (400) e Comum não assume (403)', async () => {
  const { api, entrarComo } = mockComSessao('tec123', PERFIL.TECNICO);
  const emManutencao = (await api.listarMinhasManutencoes()).find((s) => s.status === STATUS.MANUTENCAO);
  await assert.rejects(api.iniciarManutencao(emManutencao.id), (e) => {
    assert.equal(e.response.status, 400);
    assert.match(mensagemDeErro(e), /RECEBIDA/);
    return true;
  });
  const recebida = (await api.listarFilaTecnico())[0];
  entrarComo('comum123', PERFIL.COMUM);
  await assert.rejects(api.iniciarManutencao(recebida.id), (e) => e.response.status === 403);
});

test('técnico só vê SSL da fila ou das próprias OSMs', async () => {
  const { api } = mockComSessao('tec123', PERFIL.TECNICO);
  const todas = await mockComSessao('admin123', PERFIL.ADMINISTRATIVO).api.listarSolicitacoes();
  const deOutroTecnico = todas.find((s) => s.ordemServico && s.ordemServico.matriculaTecnico !== 'tec123');
  await assert.rejects(api.obterSolicitacao(deOutroTecnico.id), (e) => e.response.status === 403);
});

test('CPTM-72: concluir exige laudo, dono e sem peça pendente (400 com a lista)', async () => {
  const { api, entrarComo } = mockComSessao('tec123', PERFIL.TECNICO);
  const osm = (await api.listarMinhasManutencoes()).find((s) => s.status === STATUS.MANUTENCAO);

  await assert.rejects(api.concluirManutencao(osm.id, '  '), (e) => e.response.status === 400);
  await assert.rejects(api.concluirManutencao(osm.id, 'Troca de rolamentos e escovas.'), (e) => {
    assert.equal(e.response.status, 400);
    const pendentes = pecasPendentesDoErro(e);
    assert.equal(pendentes.length, 1);
    assert.equal(pendentes[0].status, STATUS_PEDIDO.SOLICITADO);
    return true;
  });

  entrarComo('tec456', PERFIL.TECNICO);
  await assert.rejects(api.concluirManutencao(osm.id, 'Laudo de outro técnico.'), (e) => e.response.status === 403);
});

test('CPTM-72: "Não executada" exige motivo e cancela pedidos pendentes', async () => {
  const { api } = mockComSessao('tec123', PERFIL.TECNICO);
  const osm = (await api.listarMinhasManutencoes()).find((s) => s.status === STATUS.MANUTENCAO);
  await assert.rejects(api.naoExecutarManutencao(osm.id, ''), (e) => e.response.status === 400);
  await api.naoExecutarManutencao(osm.id, 'Peça descontinuada pelo fabricante.');
  const depois = await api.obterSolicitacao(osm.id);
  assert.equal(depois.status, STATUS.NAO_EXECUTADA);
  assert.equal(depois.ordemServico.motivoNaoExecucao, 'Peça descontinuada pelo fabricante.');
  // já encerrada -> 400
  await assert.rejects(api.concluirManutencao(osm.id, 'Tentativa após encerrar.'), (e) => e.response.status === 400);
});

test('CPTM-72: concluir com sucesso quando não há pendência', async () => {
  const { api } = mockComSessao('tec123', PERFIL.TECNICO);
  const recebida = (await api.listarFilaTecnico())[0];
  await api.iniciarManutencao(recebida.id);
  await api.concluirManutencao(recebida.id, 'Capacitor de filtro substituído, sem ruído.');
  const depois = await api.obterSolicitacao(recebida.id);
  assert.equal(depois.status, STATUS.CONCLUIDA);
  assert.equal(depois.ordemServico.laudo, 'Capacitor de filtro substituído, sem ruído.');
});
