/**
 * Adapta o JSON da API .NET (camelCase) ao formato usado pelas telas.
 * É AQUI que se ajusta quando os DTOs do backend forem fechados: as telas
 * não leem o JSON cru.
 *
 * Hoje a entidade Solicitacao.cs tem: id, descricao, status, motivoDevolucao,
 * matriculaSolicitante, matriculaTecnico, dataInicioManutencao. O resto
 * (equipamento, localidade, foto, DiasParaExpirar, OSM...) segue o contrato do Jira.
 */

const ou = (...valores) => valores.find((v) => v !== undefined && v !== null) ?? null;

/** @returns {import('../tipos.js').Solicitacao} */
export function normalizarSolicitacao(dto) {
  if (!dto || typeof dto !== 'object') return dto;
  const tecnico = ou(dto.ordemServico?.matriculaTecnico, dto.matriculaTecnico);
  return {
    id: dto.id,
    numero: ou(dto.numero, `SSL ${dto.id}`),
    equipamento: ou(dto.equipamento),
    avaria: ou(dto.avaria),
    localidade: ou(dto.localidade, dto.estacao),
    descricao: ou(dto.descricao, ''),
    fotoUrl: ou(dto.fotoUrl, dto.urlFoto),
    status: dto.status,
    motivoDevolucao: ou(dto.motivoDevolucao),
    matriculaSolicitante: ou(dto.matriculaSolicitante, dto.solicitante),
    dataAbertura: ou(dto.dataAbertura, dto.dataCriacao),
    diasParaExpirar: ou(dto.diasParaExpirar, dto.DiasParaExpirar),
    ordemServico: tecnico
      ? {
          id: ou(dto.ordemServico?.id, dto.ordemServicoId),
          matriculaTecnico: tecnico,
          dataInicio: ou(dto.ordemServico?.dataInicio, dto.dataInicioManutencao),
          dataFim: ou(dto.ordemServico?.dataFim),
          laudo: ou(dto.ordemServico?.laudo, dto.laudo),
          motivoNaoExecucao: ou(dto.ordemServico?.motivoNaoExecucao),
        }
      : null,
    autorizacaoRetirada: ou(
      dto.autorizacaoRetirada,
      dto.nomeAutorizado ? { nome: dto.nomeAutorizado, tipoDocumento: ou(dto.tipoDocumentoAutorizado), documento: ou(dto.documentoAutorizado) } : null,
    ),
    historico: Array.isArray(dto.historico) ? dto.historico : [],
  };
}

/** @param {any} dados */
export const normalizarLista = (dados) => (Array.isArray(dados) ? dados.map(normalizarSolicitacao) : []);

/**
 * Item do GET /solicitacoes/{id}/historico. Aceita nomes alternativos até o DTO fechar.
 * @returns {import('../tipos.js').Historico}
 */
export function normalizarHistorico(dto) {
  return {
    status: dto.status ?? dto.statusNovo ?? '',
    data: ou(dto.data, dto.dataHora, dto.dataAlteracao),
    usuario: ou(dto.usuario, dto.matricula, dto.matriculaUsuario, dto.quem),
    observacao: ou(dto.observacao, dto.motivo, dto.comentario),
  };
}

/** Ordem cronológica (mais antigo primeiro). */
export const normalizarListaHistorico = (dados) =>
  (Array.isArray(dados) ? dados.map(normalizarHistorico) : []).sort((a, b) =>
    String(a.data ?? '').localeCompare(String(b.data ?? '')),
  );

/** Item do GET /notificacoes (CPTM-84). */
export function normalizarNotificacao(dto) {
  return {
    id: dto.id,
    mensagem: ou(dto.mensagem, dto.texto, dto.titulo, ''),
    solicitacaoId: ou(dto.solicitacaoId, dto.idSolicitacao),
    lida: Boolean(dto.lida),
    data: ou(dto.data, dto.dataCriacao, dto.dataHora),
  };
}
