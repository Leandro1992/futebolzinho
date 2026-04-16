# Futebolzinho Next

Nova interface web em Next.js + React para o projeto Futebolzinho, mantendo compatibilidade com os mesmos endpoints da API atual e persistencia no Firestore.

## Funcionalidades cobertas
- Login (mesma rota `/api/auth/login`).
- Partidas: listagem, atualizacao de gols/assistencias/gol contra e encerramento com destaque/bola murcha.
- Jogadores: listagem, criacao e edicao.
- Nova Partida: montagem de times, fixacao, preenchimento de mensalistas e balanceamento.
- Estatisticas: filtro por periodo e ordenacao.
- Desculpas: CRUD completo com filtros.
- Partidas avulsas: listagem, criacao e alternancia de encerrada.

## Compatibilidade de API
Por padrao, a app chama:
- `http://localhost:3000/api/...`

Voce pode alterar via variavel:
- `NEXT_PUBLIC_API_BASE_URL`

Exemplo em `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

## Como rodar
1. Instalar dependencias:

```
npm install
```

2. Rodar ambiente de desenvolvimento (porta 3001):

```
npm run dev
```

3. Build de producao:

```
npm run build
npm run start
```

## Observacoes
- O backend existente continua sendo a fonte de verdade dos dados.
- A autenticacao segue o comportamento atual do projeto legado para manter compatibilidade funcional.

## Publicar no Netlify
1. No Netlify, crie um novo site a partir do repositorio.
2. O projeto ja possui configuracao em `netlify.toml` na raiz do repositorio.
3. Configure (se precisar sobrescrever no painel):
- Base directory: `front/futebolzinho-next`
- Build command: `npm run build`
- Publish directory: `.next`
4. Em Environment variables, configure:
- `NEXT_PUBLIC_API_BASE_URL` com a URL publica da API backend (exemplo: `https://seu-backend.com`).
5. Faça o primeiro deploy.

Opcional (via CLI):

```bash
npm install
npm run build
npm run deploy:netlify:preview
npm run deploy:netlify:prod
```

Nota:
- Se o backend nao estiver publico com HTTPS, o frontend no Netlify nao conseguira consumir a API corretamente no navegador.
