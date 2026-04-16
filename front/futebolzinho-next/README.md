# Futebolzinho Next

Nova interface web em Next.js + React para o projeto Futebolzinho, com API integrada no proprio Next e persistencia no Firestore.

## Funcionalidades cobertas
- Login (mesma rota `/api/auth/login`).
- Partidas: listagem, atualizacao de gols/assistencias/gol contra e encerramento com destaque/bola murcha.
- Jogadores: listagem, criacao e edicao.
- Nova Partida: montagem de times, fixacao, preenchimento de mensalistas e balanceamento.
- Estatisticas: filtro por periodo e ordenacao.
- Desculpas: CRUD completo com filtros.
- Partidas avulsas: listagem, criacao e alternancia de encerrada.

## Compatibilidade de API
Por padrao, a app chama os endpoints locais do proprio Next:
- `/api/...`

Opcionalmente, voce ainda pode apontar para uma API externa via variavel:
- `NEXT_PUBLIC_API_BASE_URL`

Exemplo em `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=https://seu-backend.com
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
- A pasta `app/api` replica os contratos do backend legado para permitir rodar tudo no Next sem Express externo.
- A autenticacao segue o comportamento atual do projeto legado para manter compatibilidade funcional.

## Publicar no Netlify
1. No Netlify, crie um novo site a partir do repositorio.
2. O projeto ja possui configuracao em `netlify.toml` na raiz do repositorio.
3. Configure (se precisar sobrescrever no painel):
- Base directory: `front/futebolzinho-next`
- Build command: `npm run build`
- Publish directory: `.next`
4. Em Environment variables, configure:
- `NEXT_PUBLIC_API_BASE_URL` somente se quiser usar backend externo.
5. Faça o primeiro deploy.

Opcional (via CLI):

```bash
npm install
npm run build
npm run deploy:netlify:preview
npm run deploy:netlify:prod
```

Nota:
- Com a API integrada, nao ha necessidade de subir um backend separado para os endpoints usados pela aplicacao.
