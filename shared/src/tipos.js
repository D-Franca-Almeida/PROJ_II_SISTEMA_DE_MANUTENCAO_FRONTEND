/**
 * Tipos do domínio (JSDoc), no formato que as telas usam. O JSON da API
 * passa por api/normalizar.js — ajuste lá quando os DTOs saírem.
 *
 * @typedef {Object} Equipamento
 * @property {number} id
 * @property {string} codigo      Ex.: "QFJ0214"
 * @property {string} descricao   Ex.: "MOTORES ELÉTRICOS"
 *
 * @typedef {Object} Avaria
 * @property {number} id
 * @property {string} descricao   Ex.: "NÃO LIGA"
 *
 * @typedef {Object} Localidade
 * @property {number} id
 * @property {string} sigla       Ex.: "LAB-ELT"
 * @property {string} nome
 *
 * @typedef {Object} Historico
 * @property {string} status
 * @property {string} usuario     matrícula de quem fez a ação
 * @property {string} data        ISO 8601
 * @property {string | null} observacao  motivo/laudo/observação
 *
 * @typedef {Object} OrdemServico  OSM aberta quando o técnico assume a máquina
 * @property {number} id
 * @property {string} matriculaTecnico
 * @property {string | null} dataInicio
 * @property {string | null} dataFim
 * @property {string | null} laudo
 * @property {string | null} motivoNaoExecucao
 *
 * @typedef {Object} Solicitacao
 * @property {number} id
 * @property {string} numero      Número da SSL exibido ao usuário
 * @property {Equipamento} equipamento
 * @property {Avaria} avaria
 * @property {Localidade} localidade
 * @property {string} descricao
 * @property {string | null} fotoUrl
 * @property {string} status
 * @property {string | null} motivoDevolucao
 * @property {string} matriculaSolicitante
 * @property {string} dataAbertura ISO 8601
 * @property {number | null} diasParaExpirar  só em DEVOLVIDA/APROVADA (vem da API)
 * @property {OrdemServico | null} ordemServico
 * @property {{ nome: string, tipoDocumento: 'CPF' | 'MATRICULA', documento: string } | null} autorizacaoRetirada
 * @property {Historico[]} historico
 *
 * @typedef {Object} Notificacao  CPTM-86 (só in-app)
 * @property {number} id
 * @property {string} mensagem
 * @property {number | null} solicitacaoId  SSL para abrir ao tocar
 * @property {boolean} lida
 * @property {string} data  ISO 8601
 *
 * Arquivo de foto: no mobile é { uri, name, type } (React Native FormData);
 * no web é um File.
 * @typedef {{ uri: string, name: string, type: string } | Blob} ArquivoFoto
 *
 * @typedef {Object} NovaSolicitacao
 * @property {number | null} equipamentoId
 * @property {number | null} avariaId
 * @property {number | null} localidadeId
 * @property {string} descricao
 * @property {ArquivoFoto | null} foto
 */

export {};
