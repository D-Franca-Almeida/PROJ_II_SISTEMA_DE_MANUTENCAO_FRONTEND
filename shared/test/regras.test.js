import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STATUS,
  LISTA_STATUS,
  INFO_STATUS,
  TRANSICOES,
  podeTransicionar,
  ehFinal,
  validarNovaSolicitacao,
  criarMockServidor,
  criarApi,
  mensagemDeErro,
} from '../src/index.js';

test('todo status tem info e entrada no mapa de transições', () => {
  assert.equal(LISTA_STATUS.length, 16);
  for (const s of LISTA_STATUS) {
    assert.ok(INFO_STATUS[s], `sem INFO_STATUS: ${s}`);
    assert.ok(Array.isArray(TRANSICOES[s]), `sem TRANSICOES: ${s}`);
    for (const destino of TRANSICOES[s]) assert.ok(LISTA_STATUS.includes(destino));
  }
});

test('status finais não têm saída', () => {
  for (const s of LISTA_STATUS) {
    assert.equal(ehFinal(s), TRANSICOES[s].length === 0, s);
  }
});

test('caminho principal do fluxograma é válido', () => {
  const caminho = [
    STATUS.SOLICITADA, STATUS.APROVADA, STATUS.RECEBIDA, STATUS.SSM_GERADA,
    STATUS.MANUTENCAO, STATUS.CONCLUIDA, STATUS.AGUARDANDO_RETIRADA, STATUS.RETIRADO,
  ];
  for (let i = 1; i < caminho.length; i++) {
    assert.ok(podeTransicionar(caminho[i - 1], caminho[i]), `${caminho[i - 1]} -> ${caminho[i]}`);
  }
  assert.equal(podeTransicionar(STATUS.SOLICITADA, STATUS.RETIRADO), false);
});

test('validação da nova solicitação', () => {
  const vazio = validarNovaSolicitacao({ descricao: '' });
  assert.deepEqual(Object.keys(vazio).sort(), ['avariaId', 'descricao', 'equipamentoId', 'foto', 'localidadeId']);

  const ok = validarNovaSolicitacao({
    equipamentoId: 1, avariaId: 1, localidadeId: 1,
    descricao: 'Motor não liga ao acionar.', foto: { uri: 'file:///x.jpg', name: 'x.jpg', type: 'image/jpeg' },
  });
  assert.deepEqual(ok, {});
});

test('mock: cria, aprova e recusa transição inválida', async () => {
  const api = criarApi({ usarMock: true, mock: criarMockServidor({ atrasoMs: 0, usuario: 'teste' }) });
  const nova = await api.criarSolicitacao({
    equipamentoId: 1, avariaId: 2, localidadeId: 3,
    descricao: 'Superaquecendo após uso contínuo.', foto: { uri: 'file:///f.jpg', name: 'f.jpg', type: 'image/jpeg' },
  });
  assert.equal(nova.status, STATUS.SOLICITADA);
  assert.equal(nova.equipamento.codigo, 'QFJ0214');

  await assert.rejects(api.alterarStatus(nova.id, STATUS.DEVOLVIDA, ''), (e) => e.response.status === 400);
  const aprovada = await api.alterarStatus(nova.id, STATUS.APROVADA);
  assert.equal(aprovada.historico.length, 2);

  await assert.rejects(api.alterarStatus(nova.id, STATUS.RETIRADO), (e) => {
    assert.match(mensagemDeErro(e), /Não é possível/);
    return true;
  });
});
