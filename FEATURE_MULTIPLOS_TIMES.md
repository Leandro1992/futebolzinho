# Feature: Múltiplos Times e Autenticação de Jogadores

Branch: `feature/multiplos-times-auth`

## Resumo das Implementações

Esta branch adiciona funcionalidades importantes ao sistema Futebolzinho, incluindo:

### 1. Sistema de Times
- **Model**: `models/times.js` - CRUD completo de times
- **Routes**: `routes/times.routes.js` - API endpoints para gerenciamento de times
- **Frontend**: Componente `TimesComponent` para cadastro e gerenciamento
- **Campos**: Nome, cor, escudo (URL)
- **Validação**: Impede exclusão de times com jogadores vinculados

### 2. Autenticação de Jogadores
- **Backend**: 
  - Modelo `Jogadores` atualizado com campos `email`, `senhaHash`, `timeRef`
  - Endpoint `/api/auth/jogador/login` para autenticação
  - Uso de bcrypt para hash de senhas
  - Método `Jogadores.autenticar(email, senha)`
  
- **Frontend**:
  - Componente `LoginJogadorComponent` em `/login-jogador`
  - Armazenamento de sessão no localStorage
  - Diferenciação entre login de admin e login de jogador no menu

### 3. Vinculação Jogador-Time
- Jogadores agora podem ser vinculados a times específicos
- Campo `timeId` no formulário de cadastro/edição de jogadores
- Exibição do time na lista de jogadores
- Firestore armazena como referência (`timeRef`)

### 4. Funcionalidade "Bola Murcha"
- Novo campo `bolaMurcha` no modelo de Partidas
- Seleção do pior jogador ao encerrar uma partida (similar ao "melhor da partida")
- Exibição visual diferenciada:
  - Melhor da partida: fundo verde com ⭐
  - Bola murcha: fundo vermelho com 😢
- Backend atualizado para aceitar `bolaMurcha` no método `atualizarPartida`

## Estrutura de Arquivos Criados/Modificados

### Backend
```
models/
  ├── times.js (NOVO)
  ├── jogadores.js (MODIFICADO - auth, timeRef)
  └── partidas.js (MODIFICADO - bolaMurcha)

routes/
  ├── times.routes.js (NOVO)
  └── auth.routes.js (MODIFICADO - /jogador/login)

index.js (MODIFICADO - rota /api/times)
```

### Frontend
```
src/app/
├── times/
│   ├── times.component.ts (NOVO)
│   ├── times.component.html (NOVO)
│   ├── times.component.css (NOVO)
│   └── times.service.ts (NOVO)
│
├── login-jogador/
│   ├── login-jogador.component.ts (NOVO)
│   ├── login-jogador.component.html (NOVO)
│   └── login-jogador.component.css (NOVO)
│
├── jogadores/
│   ├── jogadores.component.ts (MODIFICADO - campos time/email/senha)
│   ├── jogadores.component.html (MODIFICADO - formulários)
│   └── jogadores.service.ts (sem alteração)
│
├── partidas/
│   ├── partidas.component.ts (MODIFICADO - bolaMurcha)
│   ├── partidas.component.html (MODIFICADO - seleção e exibição)
│   └── partidas.component.css (MODIFICADO - estilo bola murcha)
│
├── app.routes.ts (MODIFICADO - novas rotas)
└── app.component.html (MODIFICADO - menu navegação)
```

## Endpoints da API

### Times
- `GET /api/times` - Listar todos os times
- `GET /api/times/:id` - Buscar time por ID
- `POST /api/times` - Criar time (requer auth)
- `PUT /api/times` - Atualizar time (requer auth)
- `DELETE /api/times/:id` - Excluir time (requer auth)

### Autenticação de Jogadores
- `POST /api/auth/jogador/login` - Login de jogador
  ```json
  {
    "email": "jogador@email.com",
    "senha": "senha123"
  }
  ```

### Jogadores (campos atualizados)
- `POST /api/jogadores` - Criar jogador
  ```json
  {
    "nome": "Nome",
    "mensalista": true,
    "email": "email@exemplo.com",
    "senha": "senha123",
    "timeId": "id_do_time"
  }
  ```

### Partidas (campo adicional)
- `PUT /api/partidas` - Atualizar partida
  ```json
  {
    "id": "partida_id",
    "bolaMurcha": "jogador_id",
    ...
  }
  ```

## Migrations Necessárias (Firestore)

Esta implementação é retrocompatível. Documentos existentes continuam funcionando:
- Jogadores sem `email`, `senha` ou `timeRef` são válidos
- Partidas sem `bolaMurcha` são válidas
- Times são uma nova coleção

## Como Testar

1. **Backend**:
   ```bash
   npm install  # Garante bcrypt instalado
   npm run dev
   ```

2. **Frontend**:
   ```bash
   cd front/futebolzinho-de-quinta
   npm install
   npm start
   ```

3. **Criar um time**:
   - Fazer login como admin
   - Navegar para "Times"
   - Cadastrar novo time

4. **Criar jogador com autenticação**:
   - Em "Jogadores", preencher email e senha
   - Vincular ao time criado

5. **Login como jogador**:
   - Clicar em "Login Jogador"
   - Usar email/senha cadastrados

6. **Testar bola murcha**:
   - Criar uma partida
   - Adicionar gols/assistências
   - Encerrar partida selecionando melhor E bola murcha

## Próximos Passos (Sugestões)

- [ ] Estatísticas por time
- [ ] Ranking de "bolas murchas"
- [ ] Recuperação de senha
- [ ] Upload de imagem para escudo do time
- [ ] Proteção de rotas no frontend (guards)
- [ ] Validação de email único
- [ ] Dashboard do jogador logado

## Observações

- Senhas são armazenadas com bcrypt (10 salt rounds)
- A autenticação de jogador é separada da autenticação de admin
- Times não podem ser excluídos se tiverem jogadores vinculados
- O campo `bolaMurcha` é opcional ao encerrar partida
- Compatibilidade total com dados existentes
