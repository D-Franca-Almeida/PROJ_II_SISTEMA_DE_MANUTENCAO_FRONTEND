import { STATUS } from '../status.js';
import { STATUS_PEDIDO } from '../pecas.js';

/** Dados fictícios no formato do SSL da CPTM, só para desenvolvimento. */

export const EQUIPAMENTOS = [
  { id: 1, codigo: 'QFJ0214', descricao: 'MOTORES ELÉTRICOS' },
  { id: 2, codigo: 'QFJ0388', descricao: 'COMPRESSOR DE AR' },
  { id: 3, codigo: 'QFK1102', descricao: 'INVERSOR DE FREQUÊNCIA' },
  { id: 4, codigo: 'QFL0057', descricao: 'MULTÍMETRO DIGITAL' },
  { id: 5, codigo: 'QFM0731', descricao: 'FONTE DE ALIMENTAÇÃO 110VCC' },
  { id: 6, codigo: 'QFN0420', descricao: 'BANCADA DE TESTE DE RELÉS' },
];

export const AVARIAS = [
  { id: 1, descricao: 'NÃO LIGA' },
  { id: 2, descricao: 'SUPERAQUECIMENTO' },
  { id: 3, descricao: 'RUÍDO ANORMAL' },
  { id: 4, descricao: 'VAZAMENTO' },
  { id: 5, descricao: 'LEITURA INCORRETA' },
  { id: 6, descricao: 'DANO FÍSICO' },
  { id: 7, descricao: 'OUTROS' },
];

export const LOCALIDADES = [
  { id: 1, sigla: 'LAB-ELT', nome: 'Laboratório Eletrônico' },
  { id: 2, sigla: 'LAB-MEC', nome: 'Laboratório Mecânico' },
  { id: 3, sigla: 'OF-PRS', nome: 'Oficina Presidente Altino' },
  { id: 4, sigla: 'OF-LAP', nome: 'Oficina Lapa' },
  { id: 5, sigla: 'PAT-BFU', nome: 'Pátio Barra Funda' },
];

const DIA = 86_400_000;
const porId = (lista, id) => lista.find((item) => item.id === id);
const diasAtras = (dias, agora) => new Date(agora - dias * DIA).toISOString();

/**
 * @param {number} id
 * @param {{
 *   equip: number, avaria: number, local: number, descricao: string, dono: string,
 *   passos: { status: string, dias: number, usuario?: string, observacao?: string }[],
 *   tecnico?: string, osmId?: number, laudo?: string,
 * }} d
 * @param {number} agora
 */
function solicitacao(id, d, agora) {
  const historico = d.passos.map((p) => ({
    status: p.status,
    data: diasAtras(p.dias, agora),
    usuario: p.usuario ?? d.dono,
    observacao: p.observacao ?? null,
  }));
  const ultimo = historico[historico.length - 1];
  const devolucao = [...historico].reverse().find((h) => h.status === STATUS.DEVOLVIDA);
  const inicioOsm = historico.find((h) => h.status === STATUS.MANUTENCAO);
  const fimOsm = historico.find((h) => h.status === STATUS.CONCLUIDA);

  return {
    id,
    numero: `SSL-2026-${String(id).padStart(5, '0')}`,
    equipamento: porId(EQUIPAMENTOS, d.equip),
    avaria: porId(AVARIAS, d.avaria),
    localidade: porId(LOCALIDADES, d.local),
    descricao: d.descricao,
    fotoUrl: null,
    status: ultimo.status,
    motivoDevolucao: ultimo.status === STATUS.DEVOLVIDA ? devolucao.observacao : null,
    matriculaSolicitante: d.dono,
    dataAbertura: historico[0].data,
    dataStatus: ultimo.data,
    ordemServico: d.tecnico
      ? {
          id: d.osmId,
          matriculaTecnico: d.tecnico,
          dataInicio: inicioOsm?.data ?? null,
          dataFim: fimOsm?.data ?? null,
          laudo: d.laudo ?? null,
          motivoNaoExecucao: null,
        }
      : null,
    autorizacaoRetirada: null,
    historico,
  };
}

const S = STATUS;
const ADM = 'admin123';

/** Massa inicial. Dono padrão: comum123 (mesmo usuário Comum do mock da API). */
export function criarSolicitacoesIniciais(agora = Date.now()) {
  const dados = [
    {
      equip: 1, avaria: 2, local: 3, dono: 'comum123',
      descricao: 'Motor do exaustor esquentando após 20 minutos de uso.',
      passos: [{ status: S.SOLICITADA, dias: 1 }],
    },
    {
      equip: 3, avaria: 1, local: 1, dono: 'comum123',
      descricao: 'Inversor não energiza; display apagado.',
      passos: [
        { status: S.SOLICITADA, dias: 9 },
        { status: S.DEVOLVIDA, dias: 8, usuario: ADM, observacao: 'A foto não mostra a etiqueta do equipamento. Fotografe a plaqueta com o código.' },
      ],
    },
    {
      equip: 2, avaria: 3, local: 2, dono: 'comum123',
      descricao: 'Compressor fazendo barulho.',
      passos: [
        { status: S.SOLICITADA, dias: 4 },
        { status: S.DEVOLVIDA, dias: 3, usuario: ADM, observacao: 'Descreva em que situação o ruído aparece (partida, carga, desligamento).' },
      ],
    },
    {
      equip: 4, avaria: 5, local: 1, dono: 'comum123',
      descricao: 'Multímetro marcando 10% acima na escala de tensão.',
      passos: [
        { status: S.SOLICITADA, dias: 6 },
        { status: S.APROVADA, dias: 5, usuario: ADM },
      ],
    },
    {
      equip: 2, avaria: 4, local: 2, dono: 'comum123',
      descricao: 'Vazamento de óleo na base do compressor, visível após 1 hora ligado.',
      passos: [
        { status: S.SOLICITADA, dias: 5 },
        { status: S.DEVOLVIDA, dias: 4, usuario: ADM, observacao: 'Foto não mostra o vazamento.' },
        { status: S.REENVIADA, dias: 3 },
      ],
    },
    {
      equip: 5, avaria: 3, local: 4, dono: 'comum123',
      descricao: 'Ruído de chiado na fonte ao ligar carga.',
      passos: [
        { status: S.SOLICITADA, dias: 10 },
        { status: S.APROVADA, dias: 9, usuario: ADM },
        { status: S.RECEBIDA, dias: 2, usuario: ADM, observacao: 'Recebido no Laboratório Eletrônico.' },
      ],
    },
    {
      equip: 6, avaria: 6, local: 5, dono: 'outro456',
      descricao: 'Tampa frontal quebrada e conector solto.',
      passos: [
        { status: S.SOLICITADA, dias: 7 },
        { status: S.APROVADA, dias: 6, usuario: ADM },
        { status: S.RECEBIDA, dias: 1, usuario: ADM },
      ],
    },
    {
      equip: 1, avaria: 3, local: 3, dono: 'comum123', tecnico: 'tec123', osmId: 1,
      descricao: 'Motor com vibração forte e ruído no rolamento.',
      passos: [
        { status: S.SOLICITADA, dias: 15 },
        { status: S.APROVADA, dias: 14, usuario: ADM },
        { status: S.RECEBIDA, dias: 10, usuario: ADM },
        { status: S.MANUTENCAO, dias: 8, usuario: 'tec123' },
      ],
    },
    {
      equip: 3, avaria: 2, local: 1, dono: 'outro456', tecnico: 'tec456', osmId: 2,
      descricao: 'Inversor desarmando por sobretemperatura.',
      passos: [
        { status: S.SOLICITADA, dias: 12 },
        { status: S.APROVADA, dias: 11, usuario: ADM },
        { status: S.RECEBIDA, dias: 9, usuario: ADM },
        { status: S.MANUTENCAO, dias: 7, usuario: 'tec456' },
      ],
    },
    {
      equip: 4, avaria: 1, local: 1, dono: 'comum123', tecnico: 'tec123', osmId: 3,
      laudo: 'Fusível interno substituído; aferição conforme padrão.',
      descricao: 'Multímetro não liga mesmo com bateria nova.',
      passos: [
        { status: S.SOLICITADA, dias: 20 },
        { status: S.APROVADA, dias: 19, usuario: ADM },
        { status: S.RECEBIDA, dias: 17, usuario: ADM },
        { status: S.MANUTENCAO, dias: 15, usuario: 'tec123' },
        { status: S.CONCLUIDA, dias: 6, usuario: 'tec123', observacao: 'Fusível interno substituído; aferição conforme padrão.' },
        { status: S.AGUARDANDO_RETIRADA, dias: 5, usuario: ADM },
      ],
    },
    {
      equip: 6, avaria: 7, local: 5, dono: 'comum123', tecnico: 'tec123', osmId: 4,
      laudo: 'Relé de teste recalibrado.',
      descricao: 'Bancada de relés com leitura instável.',
      passos: [
        { status: S.SOLICITADA, dias: 40 },
        { status: S.APROVADA, dias: 39, usuario: ADM },
        { status: S.RECEBIDA, dias: 37, usuario: ADM },
        { status: S.MANUTENCAO, dias: 35, usuario: 'tec123' },
        { status: S.CONCLUIDA, dias: 30, usuario: 'tec123', observacao: 'Relé de teste recalibrado.' },
        { status: S.AGUARDANDO_RETIRADA, dias: 29, usuario: ADM },
        { status: S.RETIRADO, dias: 25, usuario: ADM },
      ],
    },
    {
      equip: 5, avaria: 1, local: 4, dono: 'outro456',
      descricao: 'Fonte não liga após queda de energia.',
      passos: [{ status: S.SOLICITADA, dias: 2 }],
    },
  ];
  return dados.map((d, i) => solicitacao(i + 1, d, agora));
}

/** Pedidos de peça da OSM 1 (tec123): um já recebido e um pendente. */
export function criarPedidosIniciais(agora = Date.now()) {
  return [
    {
      id: 1, ordemServicoId: 1, item: 'Rolamento 6204-2RS', quantidade: 2,
      justificativa: 'Rolamentos com folga e ruído.', status: STATUS_PEDIDO.RECEBIDO,
      dataPedido: diasAtras(7, agora),
    },
    {
      id: 2, ordemServicoId: 1, item: 'Escova de carvão 6x10mm', quantidade: 4,
      justificativa: 'Escovas gastas abaixo do limite.', status: STATUS_PEDIDO.SOLICITADO,
      dataPedido: diasAtras(2, agora),
    },
  ];
}
