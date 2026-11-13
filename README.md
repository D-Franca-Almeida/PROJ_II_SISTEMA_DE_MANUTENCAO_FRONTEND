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

- `EXPO_PUBLIC_USAR_MOCK=true` usa o backend falso em memória (`shared/src/api/mockServidor.js`),
  com as mesmas regras de perfil/dono/status da API. Os dados voltam ao inicial quando o app recarrega.
- Para a API real, `EXPO_PUBLIC_USAR_MOCK=false` e `EXPO_PUBLIC_API_URL=http://<IP-da-máquina>:5203/api`
  (no celular, `localhost` não funciona). Suba a API escutando na rede: `dotnet run --urls http://0.0.0.0:5203`.

**Usuários de teste** (senha `senha` em todos; os três primeiros existem também no `AuthService.cs` da API):

| Matrícula  | Perfil         | Para testar |
|------------|----------------|-------------|
| `comum123` | Comum          | lista, detalhe, reenviar, cancelar, prazo, retirada, notificações |
| `tec123`   | Técnico        | fila, assumir, encerrar OSM, peças |
| `admin123` | Administrativo | bloqueado no app (usa o web) |
| `outro456` | Comum (só mock)   | 403 em SSL de outro dono |
| `tec456`   | Técnico (só mock) | 403 em OSM de outro técnico |

**Telas do app** (`mobile/src/telas`):

| Perfil  | Tela | Tarefa |
|---------|------|--------|
| Todos   | `Login`, sino de notificações (`Notificacoes`) | CPTM-57, CPTM-86 |
| Comum   | `MinhasSolicitacoes` (com prazo), `DetalheSolicitacao` (cancelar, linha do tempo) | CPTM-61, 67, 64, 89 |
| Comum   | `NovaSolicitacao`, `CorrigirSolicitacao`, `AutorizarRetirada` | CPTM-30, 35, 80 |
| Técnico | `HomeTecnico` (fila RECEBIDA / minhas), `DetalheOsm` (assumir, pedidos, linha do tempo) | CPTM-37, 76, 89 |
| Técnico | `EncerrarOsm` (concluir / não executada), `PedirPeca` | CPTM-72, 73 |

### shared

```bash
cd shared
npm test   # node --test, sem instalar nada
```

Os testes cobrem as regras do mock por tarefa (perfil, dono, status, 400/403), o JWT e os adaptadores da API.

## Fluxo de status

```
SOLICITADA → APROVADA → RECEBIDA → EM MANUTENCAO → CONCLUIDA → AGUARDANDO RETIRADA → RETIRADO

Triagem:   SOLICITADA/REENVIADA → APROVADA | DEVOLVIDA | CANCELADA
           DEVOLVIDA → REENVIADA (volta à triagem) | CANCELADA | EXPIRADA (10 dias)
           APROVADA  → CANCELADA | EXPIRADA (10 dias sem entrega)
Recepção:  RECEBIDA → EM MANUTENCAO (técnico assume — refinamento 10/11) | SSM GERADA
Execução:  EM MANUTENCAO → NAO EXECUTADA → AGUARDANDO RETIRADA
Destino:   CONCLUIDA → SEM REPARO → AGUARDANDO RETIRADA | INUTILIZADO
Retirada:  AGUARDANDO RETIRADA → RETIRADA AUTORIZADA → RETIRADO
```

Os valores são exatamente os da API (`StatusSolicitacao.cs`, sem acento); para exibir, use `rotuloStatus()`.

O mapa completo está em [`shared/src/transicoes.js`](shared/src/transicoes.js). Quem valida de verdade é o backend;
o front usa o mapa para mostrar só as ações possíveis.

## Git

- Uma branch por tarefa do Jira: `feature/CPTM-<n>-<descricao-curta>`.
- Commits com a chave da tarefa (ex.: `feat(mobile): CPTM-30 ...`).
- Pull Request para a `main`.

## Integração com o backend

Todas as rotas ficam em `shared/src/api/criarApi.js` (`ROTAS`) e todo JSON passa por
`shared/src/api/normalizar.js` antes de chegar às telas. Para ligar uma rota nova, normalmente
basta ajustar esses dois arquivos.

### Já existe no backend (`SolicitacoesController` / `AuthController`)

| Front | Rota | Observação |
|-------|------|------------|
| login | `POST /api/auth/login` `{ matricula, senha }` → `{ token }` | claims `Matricula` e `Perfil` (`Comum`, `Tecnico`, `Administrativo`) |
| cancelar | `PUT /api/solicitacoes/{id}/cancelar` | back ainda não aceita **APROVADA** (refinamento CPTM-63) |
| assumir | `PUT /api/solicitacoes/{id}/iniciar-manutencao` | back ainda exige **APROVADA**; refinamento 10/11 pede **RECEBIDA** |

Erros: o front lê `{ erro }`, `{ message }` ou `{ mensagem }`; o `Forbid()` (403 sem corpo) vira "Acesso negado".

### Contrato usado pelo app e ainda não implementado no backend

| Tarefa | Rota esperada | Corpo / resposta |
|--------|---------------|------------------|
| CPTM-61 | `GET /solicitacoes/minhas`, `GET /solicitacoes/{id}` | SSL com `equipamento`, `localidade`, `fotoUrl`, `motivoDevolucao`, `matriculaSolicitante`, `dataAbertura`, `diasParaExpirar`, `ordemServico` |
| CPTM-35 | `PUT /solicitacoes/{id}/reenviar` | multipart com `descricao` e/ou `foto` (só o que mudou); 400 se nada mudou |
| CPTM-37 | `GET /solicitacoes?status=RECEBIDA`, `GET /ordens-servico/minhas` | **rotas a definir**: fila do técnico e SSLs com OSM dele |
| CPTM-72 | `PUT /solicitacoes/{id}/concluir` `{ laudo }`, `PUT /solicitacoes/{id}/nao-executar` `{ motivo }` | 400 com `pecasPendentes: [...]` se houver peça pendente; prefixo a confirmar |
| CPTM-73 | `POST /ordens-servico/{osmId}/pecas` `{ item, quantidade, justificativa }` | 201 com o pedido em `SOLICITADO`; o app precisa do `ordemServico.id` na SSL |
| CPTM-76 | `GET /ordens-servico/{osmId}/pecas`, `PUT /ordens-servico/{osmId}/pecas/{pedidoId}/cancelar` | rota de cancelamento a confirmar |
| CPTM-89 | `GET /solicitacoes/{id}/historico` | `[{ status, data, usuario, observacao }]` |
| CPTM-86 | `GET /notificacoes`, `PUT /notificacoes/{id}/lida` | `[{ id, mensagem, solicitacaoId, lida, data }]` |
| CPTM-80 | `PUT /solicitacoes/{id}/autorizar-retirada` | `{ nome, tipoDocumento: 'CPF' \| 'MATRICULA', documento }` (CPF só dígitos) |

### Outros pontos em aberto

- **Triagem (web):** diagramas usam `PUT /solicitacoes/{id}/status`; o backend implementou `PUT /aprovar` e `/devolver`.
- **POST /solicitacoes:** multipart com `equipamentoId`, `avariaId`, `localidadeId`, `descricao` e `foto`; confirmar os nomes com o DTO.
- **Catálogos:** rotas de equipamentos, avarias e localidades ainda não definidas.
- **Foto:** se a API devolver caminho relativo em `fotoUrl`, o app prefixa com a origem da `EXPO_PUBLIC_API_URL`.
