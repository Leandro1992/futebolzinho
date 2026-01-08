const express = require('express');
const router = express.Router();
const Desculpa = require('../models/desculpas');
const { authenticate } = require('../middlewares/auth');

// Obter todas as desculpas com filtros opcionais
router.get('/', async (req, res) => {
    try {
        const filtros = {};
        
        if (req.query.jogadorId) {
            filtros.jogadorId = req.query.jogadorId;
        }
        
        if (req.query.dataInicial) {
            filtros.dataInicial = req.query.dataInicial;
        }
        
        if (req.query.dataFinal) {
            filtros.dataFinal = req.query.dataFinal;
        }

        const desculpas = await Desculpa.obterTodas(filtros);
        res.status(200).json({ data: desculpas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar desculpas: ' + error.message });
    }
});

// Obter uma desculpa por ID
router.get('/:id', async (req, res) => {
    try {
        const desculpa = await Desculpa.obterPorId(req.params.id);
        res.status(200).json({ data: desculpa });
    } catch (error) {
        console.error(error);
        res.status(404).json({ error: 'Desculpa não encontrada: ' + error.message });
    }
});

// Criar nova desculpa
router.post('/', async (req, res) => {
    try {
        const desculpa = new Desculpa(req.body);
        const data = await desculpa.salvar();
        res.status(201).json({ data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar desculpa: ' + error.message });
    }
});

// Atualizar desculpa
router.put('/:id', async (req, res) => {
    try {
        const desculpa = await Desculpa.atualizar(req.params.id, req.body);
        res.status(200).json({ data: desculpa });
    } catch (error) {
        console.error('Erro ao atualizar desculpa:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Excluir desculpa
router.delete('/:id', async (req, res) => {
    try {
        const resultado = await Desculpa.excluir(req.params.id);
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Erro ao excluir desculpa:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
