/**
 * Tipos do domínio (JSDoc). Nomes de campo provisórios: alinhar com o
 * contrato da API do Diego (CPTM-29/CPTM-31) quando os DTOs saírem.
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
 * @property {string} usuario
 * @property {string} data        ISO 8601
 * @property {string | null} motivo
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
 * @property {string} solicitante
 * @property {string} dataAbertura ISO 8601
 * @property {Historico[]} historico
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
