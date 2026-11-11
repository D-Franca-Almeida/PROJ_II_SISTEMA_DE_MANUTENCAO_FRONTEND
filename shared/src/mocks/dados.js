import { STATUS } from '../status.js';

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

const porId = (lista, id) => lista.find((item) => item.id === id);

function solicitacao(id, { equip, avaria, local, descricao, solicitante, dias, historico }) {
  const abertura = new Date(Date.now() - dias * 86_400_000).toISOString();
  return {
    id,
    numero: `SSL-2026-${String(id).padStart(5, '0')}`,
    equipamento: porId(EQUIPAMENTOS, equip),
    avaria: porId(AVARIAS, avaria),
    localidade: porId(LOCALIDADES, local),
    descricao,
    fotoUrl: null,
    status: historico[historico.length - 1].status,
    solicitante,
    dataAbertura: abertura,
    historico: historico.map((h, i) => ({
      usuario: solicitante,
      motivo: null,
      ...h,
      data: new Date(Date.parse(abertura) + i * 3_600_000).toISOString(),
    })),
  };
}

export function criarSolicitacoesIniciais() {
  return [
    solicitacao(1, {
      equip: 1, avaria: 2, local: 3, dias: 1, solicitante: 'carlos.souza',
      descricao: 'Motor do exaustor esquentando após 20 minutos de uso.',
      historico: [{ status: STATUS.SOLICITADA }],
    }),
    solicitacao(2, {
      equip: 3, avaria: 1, local: 1, dias: 2, solicitante: 'mariana.lima',
      descricao: 'Inversor não energiza; display apagado.',
      historico: [{ status: STATUS.SOLICITADA }],
    }),
    solicitacao(3, {
      equip: 2, avaria: 4, local: 2, dias: 4, solicitante: 'joao.pereira',
      descricao: 'Vazamento de óleo na base do compressor.',
      historico: [
        { status: STATUS.SOLICITADA },
        { status: STATUS.DEVOLVIDA, usuario: 'eber.adm', motivo: 'Foto não mostra o vazamento.' },
        { status: STATUS.REENVIADA },
      ],
    }),
    solicitacao(4, {
      equip: 4, avaria: 5, local: 1, dias: 6, solicitante: 'carlos.souza',
      descricao: 'Multímetro marcando 10% acima na escala de tensão.',
      historico: [
        { status: STATUS.SOLICITADA },
        { status: STATUS.APROVADA, usuario: 'eber.adm' },
      ],
    }),
    solicitacao(5, {
      equip: 5, avaria: 3, local: 4, dias: 9, solicitante: 'ana.rocha',
      descricao: 'Ruído de chiado na fonte ao ligar carga.',
      historico: [
        { status: STATUS.SOLICITADA },
        { status: STATUS.APROVADA, usuario: 'eber.adm' },
        { status: STATUS.RECEBIDA, usuario: 'eber.adm' },
        { status: STATUS.SSM_GERADA, usuario: 'eber.adm' },
        { status: STATUS.MANUTENCAO, usuario: 'tecnico.rafael' },
      ],
    }),
    solicitacao(6, {
      equip: 6, avaria: 6, local: 5, dias: 15, solicitante: 'mariana.lima',
      descricao: 'Tampa frontal quebrada e conector solto.',
      historico: [
        { status: STATUS.SOLICITADA },
        { status: STATUS.APROVADA, usuario: 'eber.adm' },
        { status: STATUS.RECEBIDA, usuario: 'eber.adm' },
        { status: STATUS.SSM_GERADA, usuario: 'eber.adm' },
        { status: STATUS.MANUTENCAO, usuario: 'tecnico.rafael' },
        { status: STATUS.CONCLUIDA, usuario: 'tecnico.rafael' },
        { status: STATUS.AGUARDANDO_RETIRADA, usuario: 'eber.adm' },
      ],
    }),
  ];
}
