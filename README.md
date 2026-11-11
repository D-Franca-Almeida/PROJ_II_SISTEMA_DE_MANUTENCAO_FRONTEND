# PROJ_II_SISTEMA_DE_MANUTENCAO_FRONTEND

Frontend do novo **SSL (Solicitação de Serviço em Laboratório)** da CPTM — Projeto Integrador DSM5 2026.
Fluxo de manutenção de equipamentos, da abertura com foto até a retirada após o reparo.

## Estrutura (monorepo)

| Pasta     | O quê | Stack |
|-----------|-------|-------|
| `mobile/` | App do Usuário Comum e do Técnico (abertura de SSL, OSM, retirada) | React Native + Expo SDK 58, Axios |
| `web/`    | Painel do Usuário Administrativo (triagem, recepção, logística, destino) — *a criar na CPTM-34* | ReactJS + Vite + Tailwind CSS, Axios |
| `shared/` | Regras comuns, **sem dependências**: 16 status, mapa de transições, tipos (JSDoc), validações, mocks e cliente da API com interruptor mock/real | JavaScript puro |

Cada app tem seu próprio `node_modules` e importa o `shared/` por caminho relativo
(`../../shared/src/index.js`). No mobile, o `metro.config.js` já inclui a pasta.

## Rodando

### mobile

```bash
cd mobile
npm install
cp .env.example .env   # opcional; sem .env usa o mock
npx expo start          # leia o QR code com o Expo Go (SDK 58)
```

- `EXPO_PUBLIC_USAR_MOCK=true` usa o backend falso em memória (`shared/src/api/mockServidor.js`).
- Para a API real, `EXPO_PUBLIC_USAR_MOCK=false` e `EXPO_PUBLIC_API_URL=http://<IP-da-máquina>:<porta>/api`
  (no celular, `localhost` não funciona).

### shared

```bash
cd shared
npm test   # node --test, sem instalar nada
```

## Fluxo de status

```
SOLICITADA → APROVADA → RECEBIDA → SSM GERADA → MANUTENÇÃO → CONCLUÍDA → AGUARDANDO RETIRADA → RETIRADO

Triagem:   SOLICITADA/REENVIADA → APROVADA | DEVOLVIDA | CANCELADA
           DEVOLVIDA → REENVIADA (volta à triagem) | CANCELADA | EXPIRADA (10 dias)
           APROVADA  → CANCELADA | EXPIRADA (10 dias sem entrega)
Execução:  MANUTENÇÃO → NÃO EXECUTADA → AGUARDANDO RETIRADA
Destino:   CONCLUÍDA → SEM REPARO → AGUARDANDO RETIRADA | INUTILIZADO
Retirada:  AGUARDANDO RETIRADA → RETIRADA AUTORIZADA → RETIRADO
```

O mapa completo está em [`shared/src/transicoes.js`](shared/src/transicoes.js). Quem valida de verdade é o backend;
o front usa o mapa para mostrar só as ações possíveis.

## Git

- Uma branch por tarefa do Jira: `feature/CPTM-<n>-<descricao-curta>`.
- Commits com a chave da tarefa (ex.: `feat(mobile): CPTM-30 ...`).
- Pull Request para a `main`.

## Pontos em aberto com o backend

- **Status:** diagramas usam `PUT /solicitacoes/{id}/status`; o Jira (CPTM-34) cita `PUT /aprovar` e `/devolver`.
  O front segue o diagrama (`shared/src/api/criarApi.js` → `ROTAS`).
- **POST /solicitacoes:** multipart com `equipamentoId`, `avariaId`, `localidadeId`, `descricao` e `foto` — confirmar nomes com o DTO.
- **Catálogos:** rotas de equipamentos, avarias e localidades ainda não definidas.
- **Peças:** `POST /pecas` (Jira) vs `POST /solicitacoes/{id}/pecas` (diagrama).
- **Autenticação JWT:** o token ainda não é enviado (ver `TODO` em `mobile/src/api.js`).
