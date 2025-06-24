const express = require('express');
const router = express.Router();
const Partidas = require('../models/partidas');
const { authenticate } = require('../middlewares/auth');

router.get('/', async (req, res) => {
    try {
        let todos = await Partidas.obterTodas()
        res.status(200).json({ data: todos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar partidas' });
    }
});

router.get('/estatisticas', async (req, res) => {
    try {
        const { dataInicial, dataFim } = req.query;
        let todos = await Partidas.obterEstatisticasPartidas(dataInicial, dataFim);
        res.status(200).json({ data: todos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

router.post('/', authenticate, async (req, res) => {
    try {
        let partida = new Partidas(req.body);
        const data = await partida.salvar();
        res.status(201).json({ data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar partida ' + error.message });
    }
});

router.put('/', authenticate, async (req, res) => {
    try {
        let partida = await Partidas.atualizarPartida(req.body);
        res.status(201).json({ data: partida });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar partida ' + error.message });
    }
});

module.exports = router; 