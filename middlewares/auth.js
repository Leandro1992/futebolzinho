const crypto = require('crypto');

const SESSAO_MS = 30 * 24 * 60 * 60 * 1000;

function segredo() {
    try {
        return require('../credenciais.json').private_key_id;
    } catch (error) {
        return process.env.private_key_id;
    }
}

function assinatura(conteudo) {
    return crypto.createHmac('sha256', segredo()).update(conteudo).digest('base64url');
}

function emitirTokenUsuario(email) {
    const corpo = Buffer.from(JSON.stringify({
        email,
        exp: Date.now() + SESSAO_MS,
    })).toString('base64url');
    return `${corpo}.${assinatura(corpo)}`;
}

function lerTokenUsuario(header) {
    if (!header || !header.startsWith('Bearer ')) return null;
    const token = header.slice('Bearer '.length);
    const ponto = token.lastIndexOf('.');
    if (ponto <= 0) return null;
    const corpo = token.slice(0, ponto);
    const sig = token.slice(ponto + 1);
    const esperada = assinatura(corpo);
    const recebida = Buffer.from(sig);
    const calculada = Buffer.from(esperada);
    if (recebida.length !== calculada.length || !crypto.timingSafeEqual(recebida, calculada)) return null;
    try {
        const payload = JSON.parse(Buffer.from(corpo, 'base64url').toString());
        if (!payload.email || payload.exp < Date.now()) return null;
        return payload;
    } catch (error) {
        return null;
    }
}

function requireUser(req, res, next) {
    const payload = lerTokenUsuario(req.headers.authorization || req.headers.Authorization);
    if (!payload) {
        return res.status(401).json({ error: 'Faça login para continuar.' });
    }
    req.userEmail = payload.email;
    next();
}

const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    let serviceAccount;
    
    try {
        serviceAccount = require('../credenciais.json');
    } catch (error) {
        console.log("Usando variáveis de ambiente");
        serviceAccount = {
            private_key_id: process.env.private_key_id
        };
    }

    const key = serviceAccount.private_key_id;

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Token não fornecido'
        });
    }
    
    if (token !== `Bearer ${key}`) {
        return res.status(403).json({
            status: 'error',
            message: 'Token inválido'
        });
    }
  
    next();
};

module.exports = {
    authenticate,
    requireUser,
    emitirTokenUsuario,
}; 