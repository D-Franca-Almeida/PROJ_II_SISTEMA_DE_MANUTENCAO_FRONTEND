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
  indicadorPrazo,
  normalizarHistorico,
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

test('CPTM-67: indicador de prazo', () => {
  assert.deepEqual(indicadorPrazo({ status: STATUS.DEVOLVIDA, diasParaExpirar: 7 }), { texto: 'Expira em 7 dias', critico: false });
  assert.deepEqual(indicadorPrazo({ status: STATUS.APROVADA, diasParaExpirar: 2 }), { texto: 'Expira em 2 dias', critico: true });
  assert.equal(indicadorPrazo({ status: STATUS.APROVADA, diasParaExpirar: 1 }).texto, 'Expira em 1 dia');
  assert.equal(indicadorPrazo({ status: STATUS.DEVOLVIDA, diasParaExpirar: 0 }).texto, 'Expira hoje');
  assert.equal(indicadorPrazo({ status: STATUS.SOLICITADA, diasParaExpirar: 3 }), null);
  assert.equal(indicadorPrazo({ status: STATUS.APROVADA, diasParaExpirar: null }), null);
});

test('CPTM-89: histórico cronológico; dono, Admin e técnico da OSM; outros 403', async () => {
  const { api, entrarComo } = mockComSessao('comum123', PERFIL.COMUM);
  const comOsm = (await api.listarMinhasSolicitacoes()).find((s) => s.ordemServico?.matriculaTecnico === 'tec123');

  const historico = await api.listarHistorico(comOsm.id);
  assert.ok(historico.length >= 4);
  for (let i = 1; i < historico.length; i++) assert.ok(historico[i - 1].data <= historico[i].data);
  assert.equal(historico[0].status, STATUS.SOLICITADA);

  entrarComo('tec123', PERFIL.TECNICO);
  assert.equal((await api.listarHistorico(comOsm.id)).length, historico.length);
  entrarComo('admin123', PERFIL.ADMINISTRATIVO);
  await api.listarHistorico(comOsm.id);

  for (const [m, p] of [['outro456', PERFIL.COMUM], ['tec456', PERFIL.TECNICO]]) {
    entrarComo(m, p);
    await assert.rejects(api.listarHistorico(comOsm.id), (e) => e.response.status === 403);
  }
});

test('CPTM-89: normaliza nomes alternativos do histórico', () => {
  const h = normalizarHistorico({ statusNovo: 'APROVADA', dataHora: '2026-11-01T10:00:00Z', matricula: 'admin123', motivo: 'ok' });
  assert.deepEqual(h, { status: 'APROVADA', data: '2026-11-01T10:00:00Z', usuario: 'admin123', observacao: 'ok' });
});

test('CPTM-86: notificações do usuário, marcar como lida e aviso ao dono', async () => {
  const { api, entrarComo } = mockComSessao('comum123', PERFIL.COMUM);
  const antes = await api.listarNotificacoes();
  const naoLida = antes.find((n) => !n.lida);
  assert.ok(naoLida.solicitacaoId);
  await api.marcarNotificacaoLida(naoLida.id);
  assert.equal((await api.listarNotificacoes()).find((n) => n.id === naoLida.id).lida, true);

  entrarComo('outro456', PERFIL.COMUM);
  await assert.rejects(api.marcarNotificacaoLida(naoLida.id), (e) => e.response.status === 403);

  // técnico assume uma SSL do comum123 -> comum123 recebe notificação nova
  entrarComo('tec123', PERFIL.TECNICO);
  const daFila = (await api.listarFilaTecnico()).find((s) => s.matriculaSolicitante === 'comum123');
  await api.iniciarManutencao(daFila.id);
  entrarComo('comum123', PERFIL.COMUM);
  const depois = await api.listarNotificacoes();
  assert.equal(depois[0].solicitacaoId, daFila.id);
  assert.equal(depois[0].lida, false);
});
