const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { authenticate } = require('../middlewares/auth');
const logger = require('../utils/logger');

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