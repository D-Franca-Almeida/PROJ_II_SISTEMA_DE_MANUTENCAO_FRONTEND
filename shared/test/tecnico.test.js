import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STATUS,
  STATUS_PEDIDO,
  PERFIL,
  mensagemDeErro,
  pecasPendentesDoErro,
  validarPedidoPeca,
} from '../src/index.js';
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

test('CPTM-73: validação do pedido de peça (quantidade > 0)', () => {
  const ok = { item: 'Rolamento 6204', quantidade: '2', justificativa: 'Rolamento com folga.' };
  assert.deepEqual(validarPedidoPeca(ok), {});
  assert.ok(validarPedidoPeca({ ...ok, quantidade: '0' }).quantidade);
  assert.ok(validarPedidoPeca({ ...ok, quantidade: '-1' }).quantidade);
  assert.ok(validarPedidoPeca({ ...ok, quantidade: '1.5' }).quantidade);
  assert.ok(validarPedidoPeca({ ...ok, item: ' ' }).item);
  assert.ok(validarPedidoPeca({ ...ok, justificativa: '' }).justificativa);
});

test('CPTM-73: pedido criado como SOLICITADO; só o técnico dono com OSM aberta', async () => {
  const { api, entrarComo } = mockComSessao('tec123', PERFIL.TECNICO);
  const minhas = await api.listarMinhasManutencoes();
  const aberta = minhas.find((s) => s.status === STATUS.MANUTENCAO);
  const encerrada = minhas.find((s) => s.status !== STATUS.MANUTENCAO);
  const dados = { item: 'Capacitor 25uF', quantidade: '1', justificativa: 'Capacitor estufado.' };

  const pedido = await api.pedirPeca(aberta.ordemServico.id, dados);
  assert.equal(pedido.status, STATUS_PEDIDO.SOLICITADO);
  assert.equal(pedido.quantidade, 1);

  await assert.rejects(api.pedirPeca(aberta.ordemServico.id, { ...dados, quantidade: '0' }), (e) => e.response.status === 400);
  await assert.rejects(api.pedirPeca(encerrada.ordemServico.id, dados), (e) => e.response.status === 400);
  entrarComo('tec456', PERFIL.TECNICO);
  await assert.rejects(api.pedirPeca(aberta.ordemServico.id, dados), (e) => e.response.status === 403);
});

test('CPTM-76: ciclo SOLICITADO -> ENCAMINHADO -> RECEBIDO e cancelamento só nos pendentes', async () => {
  const { api, entrarComo } = mockComSessao('tec123', PERFIL.TECNICO);
  const osm = (await api.listarMinhasManutencoes()).find((s) => s.status === STATUS.MANUTENCAO);
  const osmId = osm.ordemServico.id;

  const pedidos = await api.listarPedidosPeca(osmId);
  assert.ok(pedidos.length >= 2);
  const recebido = pedidos.find((p) => p.status === STATUS_PEDIDO.RECEBIDO);
  await assert.rejects(api.cancelarPedidoPeca(osmId, recebido.id), (e) => e.response.status === 400);

  const novo = await api.pedirPeca(osmId, { item: 'Fusível 2A', quantidade: '3', justificativa: 'Reposição.' });
  assert.equal((await api._avancarPedidoPeca(novo.id)).status, STATUS_PEDIDO.ENCAMINHADO);
  const cancelado = await api.cancelarPedidoPeca(osmId, novo.id);
  assert.equal(cancelado.status, STATUS_PEDIDO.CANCELADO);

  entrarComo('tec456', PERFIL.TECNICO);
  await assert.rejects(api.listarPedidosPeca(osmId), (e) => e.response.status === 403);
});

test('CPTM-76: cancelar o pendente libera a conclusão da OSM', async () => {
  const { api } = mockComSessao('tec123', PERFIL.TECNICO);
  const osm = (await api.listarMinhasManutencoes()).find((s) => s.status === STATUS.MANUTENCAO);
  const osmId = osm.ordemServico.id;
  for (const p of await api.listarPedidosPeca(osmId)) {
    if (p.status === STATUS_PEDIDO.SOLICITADO || p.status === STATUS_PEDIDO.ENCAMINHADO) {
      await api.cancelarPedidoPeca(osmId, p.id);
    }
  }
  await api.concluirManutencao(osm.id, 'Escovas reaproveitadas após limpeza.');
  assert.equal((await api.obterSolicitacao(osm.id)).status, STATUS.CONCLUIDA);
});
