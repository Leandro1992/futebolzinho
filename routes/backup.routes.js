const express = require('express');
const router = express.Router();
const Backup = require('../models/backup');
const { authenticate } = require('../middlewares/auth');
const logger = require('../utils/logger');

router.get('/', async (req, res) => {
    try {
        const backup = new Backup();
        await backup.fazerBackup();
        logger.info('Backup realizado com sucesso');
        res.status(200).json({ message: "Backup realizado com sucesso" });
    } catch (error) {
        logger.error('Erro ao realizar backup:', error);
        res.status(500).json({ error: 'Erro ao realizar backup' });
    }
});

router.get('/restore', authenticate, async (req, res) => {
    try {
        const { data } = req.query;
        if (!data) {
            return res.status(400).json({ error: 'O parâmetro "data" é obrigatório' });
        }

        const backup = new Backup();
        logger.info('Iniciando restauração de backup:', { data });
        await backup.restaurarBackup(data);
        logger.info('Backup restaurado com sucesso');
        res.status(200).json({ message: 'Backup restaurado com sucesso' });
    } catch (error) {
        logger.error('Erro ao restaurar backup:', error);
        res.status(500).json({ error: 'Erro ao restaurar backup' });
    }
});

router.get('/list', async (req, res) => {
    try {
        const backup = new Backup();
        const backups = await backup.listarBackups();
        logger.info('Lista de backups obtida com sucesso');
        res.status(200).json(backups);
    } catch (error) {
        logger.error('Erro ao listar backups:', error);
        res.status(500).json({ error: 'Erro ao listar backups' });
    }
});

module.exports = router; 