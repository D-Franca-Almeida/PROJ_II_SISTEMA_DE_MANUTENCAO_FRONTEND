/**
 * Status do SSL (Solicitação de Serviço em Laboratório) — fluxograma da CPTM.
 * O valor é exatamente o texto que a API grava/devolve (StatusSolicitacao.cs,
 * sem acentos). Para exibir, use ROTULO_STATUS.
 */
export const STATUS = Object.freeze({
  SOLICITADA: 'SOLICITADA',
  APROVADA: 'APROVADA',
  DEVOLVIDA: 'DEVOLVIDA',
  REENVIADA: 'REENVIADA',
  CANCELADA: 'CANCELADA',
  EXPIRADA: 'EXPIRADA',
  RECEBIDA: 'RECEBIDA',
  SSM_GERADA: 'SSM GERADA',
  MANUTENCAO: 'EM MANUTENCAO',
  NAO_EXECUTADA: 'NAO EXECUTADA',
  CONCLUIDA: 'CONCLUIDA',
  SEM_REPARO: 'SEM REPARO',
  AGUARDANDO_RETIRADA: 'AGUARDANDO RETIRADA',
  RETIRADA_AUTORIZADA: 'RETIRADA AUTORIZADA',
  RETIRADO: 'RETIRADO',
  INUTILIZADO: 'INUTILIZADO',
});

export const LISTA_STATUS = Object.freeze(Object.values(STATUS));

/** Texto para a tela (com acentos). */
export const ROTULO_STATUS = Object.freeze({
  [STATUS.SOLICITADA]: 'Solicitada',
  [STATUS.APROVADA]: 'Aprovada',
  [STATUS.DEVOLVIDA]: 'Devolvida',
  [STATUS.REENVIADA]: 'Reenviada',
  [STATUS.CANCELADA]: 'Cancelada',
  [STATUS.EXPIRADA]: 'Expirada',
  [STATUS.RECEBIDA]: 'Recebida',
  [STATUS.SSM_GERADA]: 'SSM gerada',
  [STATUS.MANUTENCAO]: 'Em manutenção',
  [STATUS.NAO_EXECUTADA]: 'Não executada',
  [STATUS.CONCLUIDA]: 'Concluída',
  [STATUS.SEM_REPARO]: 'Sem reparo',
  [STATUS.AGUARDANDO_RETIRADA]: 'Aguardando retirada',
  [STATUS.RETIRADA_AUTORIZADA]: 'Retirada autorizada',
  [STATUS.RETIRADO]: 'Retirado',
  [STATUS.INUTILIZADO]: 'Inutilizado',
});

/** @param {string} status */
export function rotuloStatus(status) {
  return ROTULO_STATUS[status] ?? status;
}

/** As 7 fases do processo. */
export const FASE = Object.freeze({
  ABERTURA: 'Abertura',
  TRIAGEM: 'Triagem',
  RECEPCAO: 'Recepção',
  LOGISTICA: 'Logística',
  EXECUCAO: 'Execução',
  DESTINO: 'Destino',
  RETIRADA: 'Retirada',
});

/**
 * Tom visual de cada status (mesma legenda do fluxograma):
 * - decisao: decisões da triagem (azul)
 * - fim-negativo: fim sem reparo ou desistência (vermelho)
 * - fim-positivo: fim do ciclo (verde)
 * - andamento: demais etapas (neutro)
 */
export const TOM = Object.freeze({
  ANDAMENTO: 'andamento',
  DECISAO: 'decisao',
  FIM_NEGATIVO: 'fim-negativo',
  FIM_POSITIVO: 'fim-positivo',
});

/** @type {Readonly<Record<string, { fase: string, tom: string, final: boolean }>>} */
export const INFO_STATUS = Object.freeze({
  [STATUS.SOLICITADA]: { fase: FASE.ABERTURA, tom: TOM.ANDAMENTO, final: false },
  [STATUS.REENVIADA]: { fase: FASE.ABERTURA, tom: TOM.ANDAMENTO, final: false },
  [STATUS.APROVADA]: { fase: FASE.TRIAGEM, tom: TOM.DECISAO, final: false },
  [STATUS.DEVOLVIDA]: { fase: FASE.TRIAGEM, tom: TOM.DECISAO, final: false },
  [STATUS.CANCELADA]: { fase: FASE.TRIAGEM, tom: TOM.FIM_NEGATIVO, final: true },
  [STATUS.EXPIRADA]: { fase: FASE.TRIAGEM, tom: TOM.FIM_NEGATIVO, final: true },
  [STATUS.RECEBIDA]: { fase: FASE.RECEPCAO, tom: TOM.ANDAMENTO, final: false },
  [STATUS.SSM_GERADA]: { fase: FASE.RECEPCAO, tom: TOM.ANDAMENTO, final: false },
  [STATUS.MANUTENCAO]: { fase: FASE.EXECUCAO, tom: TOM.ANDAMENTO, final: false },
  [STATUS.NAO_EXECUTADA]: { fase: FASE.EXECUCAO, tom: TOM.ANDAMENTO, final: false },
  [STATUS.CONCLUIDA]: { fase: FASE.EXECUCAO, tom: TOM.ANDAMENTO, final: false },
  [STATUS.SEM_REPARO]: { fase: FASE.DESTINO, tom: TOM.ANDAMENTO, final: false },
  [STATUS.INUTILIZADO]: { fase: FASE.DESTINO, tom: TOM.FIM_NEGATIVO, final: true },
  [STATUS.AGUARDANDO_RETIRADA]: { fase: FASE.RETIRADA, tom: TOM.ANDAMENTO, final: false },
  [STATUS.RETIRADA_AUTORIZADA]: { fase: FASE.RETIRADA, tom: TOM.ANDAMENTO, final: false },
  [STATUS.RETIRADO]: { fase: FASE.RETIRADA, tom: TOM.FIM_POSITIVO, final: true },
});

/** Prazo (dias) para reenviar uma SSL devolvida ou entregar uma aprovada antes de expirar. */
export const DIAS_PARA_EXPIRAR = 10;
