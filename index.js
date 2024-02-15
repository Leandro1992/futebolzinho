
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const Jogadores = require("./models/jogadores");
const Partidas = require("./models/partidas");
const cors = require('cors');

app.listen(PORT, () => {
    console.log(`Servidor está ouvindo na porta ${PORT}`);
});

app.use(express.json());
app.use(cors());

app.use('/', express.static(path.resolve(__dirname + '/public/browser')));

//CRUD jogadores
app.get('/jogadores', async (req, res) => {
    try {
        let todos = await Jogadores.obterTodos()
        res.status(200).json({ data: todos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar jogadores' });
    }
});

app.post('/jogadores', async (req, res) => {
    try {
        let jogador = new Jogadores(req.body);
        const data = await jogador.salvar();
        res.status(201).json({ data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar jogador ' + error.message });
    }
});


app.put('/jogadores', async (req, res) => {
    const jogador = new Jogadores(req.body); // ou obtenha a instância de outra forma
    jogador.atualizarDados(req.body)
        .then((mensagem) => {
            res.status(201).json({ data: mensagem });
        })
        .catch((error) => {
            console.error('Erro ao atualizar dados do jogador:', error.message);
            res.status(500).json({ error: error.message });
        });
});


//CRUD partidas
app.get('/partidas', async (req, res) => {
    try {
        let todos = await Partidas.obterTodas()
        res.status(200).json({ data: todos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar jogadores' });
    }
});

//CRUD partidas
app.get('/estatisticas', async (req, res) => {
    try {
        let todos = await Partidas.obterEstatisticasPartidas()
        res.status(200).json({ data: todos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar jogadores' });
    }
});

app.post('/partidas', async (req, res) => {
    try {
        let partida = new Partidas(req.body);
        partida.salvar();
        res.status(201).json({ data: partida });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar partida ' + error.message });
    }
});

app.put('/partidas', async (req, res) => {
    try {
        let partida = Partidas.atualizarPartida(req.body);
        res.status(201).json({ data: partida });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar partida ' + error.message });
    }
});