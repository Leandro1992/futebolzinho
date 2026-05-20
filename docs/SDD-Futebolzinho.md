# SDD - Sistema Futebolzinho

Data: 2026-04-15
Versao: 1.0 (engenharia reversa)

## 1. Objetivo do Documento
Este documento descreve o design de software atual do projeto Futebolzinho a partir de engenharia reversa do codigo existente.

Objetivos:
- Documentar arquitetura backend e frontend.
- Registrar contratos de API e modelo de dados.
- Explicitar regras de negocio implementadas.
- Identificar riscos tecnicos e lacunas.
- Servir como base para evolucao futura da aplicacao.

## 2. Escopo do Sistema
Sistema web para gestao de futebol entre amigos, com foco em:
- Cadastro e manutencao de jogadores.
- Criacao e acompanhamento de partidas regulares.
- Registro de gols, assistencias, gols contra, destaque e bola murcha.
- Calculo de estatisticas agregadas por jogador em periodo.
- Gestao de partidas avulsas.
- Cadastro e administracao de desculpas de ausencia.
- Autenticacao simples para acesso a funcionalidades administrativas na UI.
- Rotinas operacionais de backup e limpeza de cache.

## 3. Visao Geral da Arquitetura
Arquitetura em 3 camadas principais:
- Frontend SPA: Angular 17 standalone, servido pelo proprio backend.
- Backend API: Node.js + Express, com rotas REST sob /api.
- Persistencia: Firebase Firestore (colecoes de dominio).

Fluxo principal:
1. Usuario acessa SPA.
2. SPA consome endpoints /api/* no mesmo host.
3. API processa regras, consulta Firestore e retorna JSON.
4. Em producao, backend serve build estatico Angular em public/browser.

## 4. Stack Tecnologica
Backend:
- Node.js
- Express 4
- Firebase Admin SDK (Firestore)
- bcrypt
- helmet
- cors
- express-rate-limit
- winston
- jest (testes)

Frontend:
- Angular 17 (standalone components)
- RxJS
- Bootstrap 5 + Bootstrap Icons

## 5. Estrutura de Modulos
### 5.1 Backend (raiz)
- index.js: bootstrap do Express, middlewares globais, rotas e fallback para SPA.
- db/index.js: singleton de conexao Firebase.
- routes/*.routes.js: controladores HTTP por contexto de negocio.
- models/*.js: acesso a dados + regras de negocio.
- middlewares/auth.js: validacao simples de token por header Authorization.
- middlewares/error.js: ApiError e handler global.
- utils/logger.js: logger estruturado com winston.

### 5.2 Frontend (front/futebolzinho-de-quinta)
- src/main.ts: bootstrap da aplicacao Angular.
- src/app/app.config.ts: providers globais (router, HttpClient, HashLocationStrategy).
- src/app/app.routes.ts: mapa de rotas da SPA.
- src/app/*: componentes e services por dominio (partidas, jogadores, estatisticas, desculpas, auth).

## 6. Design Backend
### 6.1 Inicializacao e middlewares
Em index.js:
- helmet com contentSecurityPolicy/crossOriginEmbedderPolicy desabilitados.
- cors habilitado globalmente.
- express.json para payload JSON.
- rate limit global: 100 requests por IP a cada 15 minutos.
- static files em public/browser.
- fallback app.get('*') para index.html (SPA routing).

### 6.2 Rotas HTTP
Prefixo geral: /api

Autenticacao:
- POST /api/auth/login
- POST /api/auth/register

Jogadores:
- GET /api/jogadores
- POST /api/jogadores
- PUT /api/jogadores

Partidas:
- GET /api/partidas
- GET /api/partidas/estatisticas?dataInicial&dataFim
- POST /api/partidas
- PUT /api/partidas

Partidas avulsas:
- GET /api/partidas-avulsas
- POST /api/partidas-avulsas
- PUT /api/partidas-avulsas

Desculpas:
- GET /api/desculpas
- GET /api/desculpas/:id
- POST /api/desculpas
- PUT /api/desculpas/:id
- DELETE /api/desculpas/:id

Operacional:
- GET /api/backup
- GET /api/backup/restore?data=...
- GET /api/backup/list
- GET /api/cache/clear

### 6.3 Modelos e responsabilidades
Jogador (models/jogadores.js):
- salvar, atualizarDados, obterTodos.
- cache em memoria para lista de jogadores.

Partida (models/partidas.js):
- salvar partida com referencias para jogadores no Firestore.
- obterTodas com enriquecimento de referencias para dados do jogador.
- calcular totais por time (gols, assistencias, gols contra).
- obterEstatisticasPartidas com agregacao por jogador e periodo.
- atualizarPartida com persistencia de eventos e flags (destaque/bolaMurcha).

PartidaAvulsa (models/partida-avulsa.js):
- salvar, obterTodas, atualizarPartida.

Desculpa (models/desculpas.js):
- CRUD completo com filtros por jogador e periodo.

User (models/user.js):
- login por email + comparacao bcrypt.
- registro com hash bcrypt.

Backup (models/backup.js):
- snapshot das colecoes jogadores e partidas.
- restauracao por data via batch write.
- listagem de backups.

Cache (models/cache.js):
- cache em memoria de processo Node (nao distribuido, sem TTL).

### 6.4 Modelo de dados (Firestore)
Colecao jogadores:
- nome: string
- mensalista: boolean
- (campos estatisticos podem existir em documentos historicos)

Colecao partidas:
- data: string (YYYY-MM-DD)
- local: string
- status: number (0 em andamento, 1 encerrada observado na UI)
- timeA: array de objetos
- timeB: array de objetos

Formato de item em timeA/timeB:
- jogadorRef: DocumentReference jogadores/{id}
- gol: number
- assistencia: number
- golContra: number
- destaque: boolean (opcional)
- bolaMurcha: boolean (opcional)

Colecao partidas-avulsas:
- data: string
- local: string
- nome: string
- encerrada: boolean
- jogadores: array (estrutura livre)

Colecao desculpas:
- jogadorId: string
- jogadorNome: string
- data: string
- descricao: string
- dataCriacao: string ISO
- dataAtualizacao: string ISO (quando alterada)

Colecao user:
- data: string ISO
- email: string
- password: string (hash bcrypt)
- admin: boolean
- status: boolean

Colecao backup:
- data: string ISO
- jogadores: array de snapshots
- partidas: array de snapshots

## 7. Design Frontend
### 7.1 Roteamento
Rotas principais:
- / -> PartidasComponent
- /jogador -> JogadoresComponent
- /estatistica -> EstatisticasComponent
- /partida-form -> PartidaFormComponent
- /desculpas -> DesculpasComponent

Observacao:
- Rotas de partida-stats estao comentadas e nao expostas atualmente.

### 7.2 App shell e autenticacao
AppComponent:
- Navbar com links e controle de login.
- Modal de login usando Bootstrap.
- Estado de autenticacao em AuthService (BehaviorSubject).

AuthService:
- POST api/auth/login.
- Persiste localmente apenas email em localStorage como token.
- Login habilita itens condicionais da UI.

### 7.3 Componentes por dominio
PartidasComponent:
- Lista partidas e jogadores.
- Incrementa/decrementa gols, assistencias e gols contra em tempo real.
- Encerra partida definindo destaque e bola murcha.
- Cada alteracao persiste via PUT /api/partidas.

PartidaFormComponent:
- Monta times A/B a partir de jogadores disponiveis.
- Suporta fixacao de jogador e balanceamento de times por heuristica.
- Heuristica usa metricas historicas (gols/jogo, assist/jogo, destaque/jogo, vitoria/jogo) com pesos.

EstatisticasComponent:
- Filtra estatisticas por intervalo de datas.
- Ordena colunas no cliente.

JogadoresComponent:
- Lista, filtra e ordena jogadores.
- Cria e edita jogador por modal.

DesculpasComponent:
- CRUD completo de desculpas.
- Filtros por jogador e periodo.
- Edicao inline no estado do componente.

### 7.4 Services HTTP
- JogadorService -> /api/jogadores
- PartidaService -> /api/partidas
- EstatisticaService -> /api/partidas/estatisticas
- DesculpasService -> /api/desculpas
- PartidaStatsService -> usa /api/partida-avulsa (endpoint legado, divergente da API atual)

## 8. Regras de Negocio Implementadas
- Partida nova exige montagem de dois times na UI; validacao minima de 5 jogadores por time no form.
- Estatisticas agregam por jogador:
  - jogos, gols, assistencia, golContra, destaque, bolaMurcha, vitorias, derrotas, empates.
- Resultado da partida:
  - vencedor A se golsA > golsB.
  - vencedor B se golsB > golsA.
  - empate caso contrario.
- Gol contra impacta placar do adversario.
- Balanceamento de times:
  - distribuicao gulosa por pontuacao historica ponderada.
  - jogadores fixos nao participam da redistribuicao.

## 9. Requisitos Nao Funcionais (estado atual)
Seguranca:
- Helmet e rate-limit ativos.
- CORS aberto globalmente.
- Estrategia de autenticacao simplificada e fraca (comparacao com private_key_id).

Observabilidade:
- Logger winston com arquivos logs/error.log e logs/combined.log.

Performance:
- Cache in-memory reduz consultas repetidas.
- Sem TTL e sem invalidacao total consistente entre todos os fluxos.

Confiabilidade:
- Tratamento de erros heterogeneo entre rotas (padroes de resposta diferentes).
- Handler global existe, mas muitas rotas respondem erro diretamente.

## 10. Fluxos Principais
### 10.1 Fluxo Criar Partida
1. Usuario monta times no PartidaForm.
2. Front envia POST /api/partidas.
3. Backend converte IDs para DocumentReference.
4. Firestore persiste partida.
5. Backend invalida cache de partidas/estatisticas.

### 10.2 Fluxo Atualizar Eventos da Partida
1. Usuario ajusta gols/assistencias/golContra no PartidasComponent.
2. Front envia PUT /api/partidas com estado completo da partida.
3. Backend reconstrui arrays com referencias e atualiza documento.
4. Backend invalida cache.

### 10.3 Fluxo Estatisticas por Periodo
1. Front define dataInicial e dataFim.
2. GET /api/partidas/estatisticas com query params.
3. Backend filtra partidas por data e agrega indicadores por jogador.
4. Front ordena e apresenta ranking.

### 10.4 Fluxo Desculpas
1. Front consulta jogadores e desculpas.
2. Usuario cria/edita/exclui desculpa.
3. Backend aplica operacao na colecao desculpas.
4. Front recarrega lista com filtros.

## 11. Contratos e Convencoes de Resposta
Padrao predominante:
- sucesso: { data: ... } ou { success: true, ... }
- erro: { error: "mensagem" } ou { success: false, error: "mensagem" }

Conclusao:
- Nao existe envelope de resposta unico em toda API.
- Frontend lida caso a caso por endpoint.

## 12. Testes
Estado atual:
- Testes backend limitados em tests/partida.test.js.
- Teste atual valida construtor e premissas basicas, sem mock de Firestore.
- Testes frontend existem como scaffolding de componentes/services, sem cobertura funcional robusta evidenciada nesta analise.

## 13. Riscos e Dividas Tecnicas
1. Autenticacao fraca:
- Middleware auth compara Authorization com private_key_id.
- Nao usa JWT, expiracao, refresh, claims, nem segregacao forte por papel.

2. Divergencia de endpoints para partidas avulsas:
- Backend expoe /api/partidas-avulsas.
- Service legado usa /api/partida-avulsa.

3. Inconsistencia de tratamento de erro:
- Multiplos formatos de retorno e status codes nao uniformes.

4. Cache local em memoria:
- Sem TTL, sem distribuicao, reset em restart.

5. Campos potencialmente inconsistentes:
- Em estatisticas usa propriedade vendedor (provavel typo de vencedor).

6. Acoplamento UI + regra de negocio:
- Parte da logica de balanceamento e validacao permanece no componente.

## 14. Recomendacoes de Evolucao
Prioridade alta:
- Migrar autenticacao para JWT (access/refresh) e middleware por papeis.
- Padronizar resposta de erro/sucesso da API.
- Corrigir e consolidar endpoints de partidas avulsas (pluralizacao e compatibilidade).

Prioridade media:
- Introduzir camada de service no backend separando controller/model.
- Criar DTOs/schema validation (ex: Zod/Joi) para payloads.
- Revisar cache com TTL e politicas de invalidacao.

Prioridade baixa:
- Melhorar testabilidade de modelos com mocks de Firestore.
- Criar suite E2E para fluxos criticos (criar partida, encerrar, estatisticas, desculpas).

## 15. Mapa Rapido de Arquivos Relevantes
Backend:
- index.js
- db/index.js
- routes/*.routes.js
- models/*.js
- middlewares/auth.js
- middlewares/error.js

Frontend:
- front/futebolzinho-de-quinta/src/app/app.routes.ts
- front/futebolzinho-de-quinta/src/app/app.component.ts
- front/futebolzinho-de-quinta/src/app/auth.service.ts
- front/futebolzinho-de-quinta/src/app/partidas/*
- front/futebolzinho-de-quinta/src/app/partida-form/*
- front/futebolzinho-de-quinta/src/app/estatisticas/*
- front/futebolzinho-de-quinta/src/app/jogadores/*
- front/futebolzinho-de-quinta/src/app/desculpas/*

## 16. Decisoes e Assuncoes desta Engenharia Reversa
- O documento reflete o comportamento implementado no codigo atual.
- Nao foram inferidos requisitos externos nao representados no repositorio.
- Nao houve alteracao de codigo de negocio nesta entrega, apenas documentacao tecnica.
