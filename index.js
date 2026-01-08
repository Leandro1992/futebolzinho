const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { errorHandler } = require('./middlewares/error');
const Jogadores = require("./models/jogadores");
const Partidas = require("./models/partidas");
const PartidasAvulsas = require("./models/partida-avulsa");
const User = require("./models/user");
const cache = require('./models/cache');
const Backup = require('./models/backup');
const { Console } = require('console');
let serviceAccount;
try {
    serviceAccount = require('./credenciais.json');
} catch (error) {
    console.log("Rodando em ambiente produtivo")
}

// Rotas
const jogadoresRoutes = require('./routes/jogadores.routes');
const partidasRoutes = require('./routes/partidas.routes');
const partidasAvulsasRoutes = require('./routes/partidas-avulsas.routes');
const authRoutes = require('./routes/auth.routes');
const backupRoutes = require('./routes/backup.routes');
const cacheRoutes = require('./routes/cache.routes');
const desculpasRoutes = require('./routes/desculpas.routes');

const app = express();
app.set('trust proxy', 1); // Corrige erro do express-rate-limit no Heroku
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet({
    contentSecurityPolicy: false, // Desabilita temporariamente para desenvolvimento
    crossOriginEmbedderPolicy: false // Permite carregamento de recursos cross-origin
}));
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // limite de 100 requisições por IP
});
app.use(limiter);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public/browser')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/jogadores', jogadoresRoutes);
app.use('/api/partidas', partidasRoutes);
app.use('/api/partidas-avulsas', partidasAvulsasRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/desculpas', desculpasRoutes);

// Rota para servir o app Angular em qualquer URL não encontrada
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/browser/index.html'));
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Inicialização do servidor
app.listen(PORT, () => {
    logger.info(`Servidor iniciado na porta ${PORT}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
    logger.error('Erro não tratado:', err);
    // Em produção, você pode querer fazer algo mais gracioso
    process.exit(1);
});

module.exports = app;