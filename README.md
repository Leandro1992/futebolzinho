# Sistema de Controle de Jogos de Futebol entre Amigos

Este é um sistema simples para controlar gols e assistências em jogos de futebol entre amigos. Ele foi construído usando Node.js, Firebase Firestore e Express.

## Funcionalidades

### Jogadores

#### 1. Buscar todos os jogadores

Endpoint: `GET /jogadores`

Retorna uma lista de todos os jogadores cadastrados.

#### 2. Criar jogador

Endpoint: `POST /jogadores`

Cria um novo jogador com base nos dados fornecidos no corpo da requisição.

Exemplo de corpo da requisição (JSON):
```json
{
  "nome": "Nome do Jogador",
  "mensalista": true
}
```

#### 3. Atualizar jogador

Endpoint: `PUT /jogadores`

Atualiza os dados de um jogador existente com base no ID fornecido na URL e nos dados no corpo da requisição.

Exemplo de corpo da requisição (JSON):
```json
{
"id": "2VWAsjK17JQxy9r2Fzl9",
"nome": "Novo Nome",
"mensalista": false
}
```
### Partidas

#### 4. Buscar todas as partidas

Endpoint: `GET /partidas`

Retorna uma lista de todas as partidas registradas, incluindo dados dos jogadores.

#### 5. Criar partida

Endpoint: `POST /partidas`

Cria uma nova partida com base nos dados fornecidos no corpo da requisição.

Exemplo de corpo da requisição (JSON):

```json
{
"data": "2024-01-10",
"local": "Estádio XYZ",
"timeA": [
{ "id": "Id do jogador retonado na busca de jogadores", "gol": 0, "assistencia": 0 },
// ... outros jogadores do timeA
],
"timeB": [
{ "id": "Id do jogador retonado na busca de jogadores", "gol": 0, "assistencia": 0 },
// ... outros jogadores do timeB
]
}
```

#### 6. Atualizar dados da partida

Endpoint: `PUT /partidas/`

Atualiza os dados de uma partida existente com base no ID fornecido na URL e nos dados no corpo da requisição.

Exemplo de corpo da requisição (JSON):

```json
{
"id": "2VWAsjK17JQxy9r2Fzl9",
"data": "2024-01-10",
"local": "Estádio XYZ",
"timeA": [
{ "id": "Id do jogador retonado na busca de jogadores", "gol": 3, "assistencia": 2 },
// ... outros jogadores do timeA
],
"timeB": [
{ "id": "Id do jogador retonado na busca de jogadores", "gol": 4, "assistencia": 1 },
// ... outros jogadores do timeB
]
}
```

#### 7. Buscar estatisticas dos jogos

Endpoint: `GET /estatisticas`

Retorna um resumo dos jogadores, como jogos, vitorias, empates, derrotas, gols, assistencias e melhor da partida.

## Como Executar o Projeto

1. Clone este repositório.
2. Instale as dependências: `npm install`.
3. Configure as credenciais do Firebase no arquivo `firebaseConfig.js`.
4. Execute o servidor: `npm start`.
5. O sistema estará disponível em `http://localhost:3000`.

Lembre-se de substituir as informações específicas, como IDs e chaves, pelos valores reais correspondentes ao seu ambiente.