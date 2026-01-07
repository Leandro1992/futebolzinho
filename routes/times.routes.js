const express = require('express');
const router = express.Router();
const Times = require('../models/times');
const { authenticate } = require('../middlewares/auth');

router.get('/', async (req, res) => {
    try {
        const todos = await Times.obterTodos();
        res.status(200).json({ data: todos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar times: ' + error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const time = await Times.buscarPorId(req.params.id);
        res.status(200).json({ data: time });
    } catch (error) {
        console.error(error);
        res.status(404).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const time = new Times(req.body);
        const data = await time.salvar();
        res.status(201).json({ data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar time: ' + error.message });
    }
});

router.put('/', async (req, res) => {
    try {
        const time = new Times(req.body);
        const mensagem = await time.atualizarDados(req.body);
        res.status(200).json({ data: mensagem });
    } catch (error) {
        console.error('Erro ao atualizar dados do time:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const resultado = await Times.excluir(req.params.id);
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Erro ao excluir time:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
