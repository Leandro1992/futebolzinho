const express = require('express');
const router = express.Router();
const PartidasAvulsas = require('../models/partida-avulsa');
const { authenticate } = require('../middlewares/auth');

router.get('/', async (req, res) => {
    try {
        let todos = await PartidasAvulsas.obterTodas()
        res.status(200).json({ data: todos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar partidas avulsas' });
    }
});

router.post('/', authenticate, async (req, res) => {
    try {
        let partida = new PartidasAvulsas(req.body);
        await partida.salvar();
        res.status(201).json({ data: partida });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar partida avulsa ' + error.message });
    }
});

router.put('/', authenticate, async (req, res) => {
    try {
        let partida = await PartidasAvulsas.atualizarPartida(req.body);
        res.status(200).json({ data: partida });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar partida avulsa ' + error.message });
    }
});

module.exports = router; 