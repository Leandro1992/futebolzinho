const express = require('express');
const router = express.Router();
const Jogadores = require('../models/jogadores');
const { authenticate } = require('../middlewares/auth');

router.get('/', async (req, res) => {
    try {
        let todos = await Jogadores.obterTodos()
        res.status(200).json({ data: todos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar jogadores' });
    }
});

router.post('/', async (req, res) => {
    try {
        let jogador = new Jogadores(req.body);
        const data = await jogador.salvar();
        res.status(201).json({ data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar jogador ' + error.message });
    }
});

router.put('/', async (req, res) => {
    try {
        const jogador = new Jogadores(req.body);
        const mensagem = await jogador.atualizarDados(req.body);
        res.status(200).json({ data: mensagem });
    } catch (error) {
        console.error('Erro ao atualizar dados do jogador:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 