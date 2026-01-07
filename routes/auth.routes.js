const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Jogadores = require('../models/jogadores');
const { authenticate } = require('../middlewares/auth');
const logger = require('../utils/logger');

// Login de administrador
router.post('/login', async (req, res) => {
    try {
        const token = await User.login(req.body);
        logger.info('Login bem-sucedido');
        res.status(200).json({ success: true, token });
    } catch (error) {
        logger.error('Erro no login:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// Login de jogador
router.post('/jogador/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        if (!email || !senha) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email e senha são obrigatórios' 
            });
        }

        const jogador = await Jogadores.autenticar(email, senha);
        
        if (!jogador) {
            return res.status(401).json({ 
                success: false, 
                error: 'Email ou senha inválidos' 
            });
        }

        logger.info(`Login de jogador bem-sucedido: ${jogador.email}`);
        res.status(200).json({ 
            success: true, 
            jogador,
            message: 'Login realizado com sucesso' 
        });
    } catch (error) {
        logger.error('Erro no login de jogador:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/register', authenticate, async (req, res) => {
    try {
        const user = await User.register(req.body);
        logger.info('Novo usuário registrado');
        res.status(201).json({ success: true, user });
    } catch (error) {
        logger.error('Erro no registro:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = router; 