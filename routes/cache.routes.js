const express = require('express');
const router = express.Router();
const cache = require('../models/cache');
const { authenticate } = require('../middlewares/auth');
const logger = require('../utils/logger');

router.get('/clear', authenticate, async (req, res) => {
    try {
        await cache.clear();
        logger.info('Cache limpo com sucesso');
        res.status(200).json({ message: "Cache limpo com sucesso" });
    } catch (error) {
        logger.error('Erro ao limpar cache:', error);
        res.status(500).json({ error: 'Erro ao limpar o cache' });
    }
});

module.exports = router; 