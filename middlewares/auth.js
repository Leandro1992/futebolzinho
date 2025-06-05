const FirebaseConnection = require('../db');

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
    authenticate
}; 