const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { authenticate } = require('../middlewares/auth');

// Listar todos os usuários (requer autenticação)
router.get('/', authenticate, async (req, res) => {
    try {
        const users = await User.obterTodos();
        res.status(200).json({ data: users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar usuários: ' + error.message });
    }
});

// Buscar usuário por ID (requer autenticação)
router.get('/:id', authenticate, async (req, res) => {
    try {
        const user = await User.buscarPorId(req.params.id);
        res.status(200).json({ data: user });
    } catch (error) {
        console.error(error);
        res.status(404).json({ error: error.message });
    }
});

// Criar usuário (já existe em auth.routes - register)
// Não vou duplicar aqui

// Atualizar usuário (requer autenticação)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const userData = {
            id: req.params.id,
            ...req.body
        };
        const user = await User.atualizarDados(userData);
        res.status(200).json({ data: user });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Atualizar perfil (não requer autenticação de admin, mas precisa senha atual)
router.put('/perfil/atualizar', async (req, res) => {
    try {
        const user = await User.atualizarPerfil(req.body);
        res.status(200).json({ 
            success: true, 
            data: user,
            message: 'Perfil atualizado com sucesso' 
        });
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error.message);
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Excluir usuário (requer autenticação)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const resultado = await User.excluir(req.params.id);
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Erro ao excluir usuário:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
