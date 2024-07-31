const admin = require('firebase-admin');
let serviceAccount = null;

try {
  // Tenta ler o arquivo de configuração
  serviceAccount = require('../credenciais.json');
} catch (error) {
  // Se o arquivo de configuração não estiver disponível, use variáveis de ambiente
  console.log('Arquivo de configuração não encontrado. Usando variáveis de ambiente.');
  serviceAccount = {
    "type": process.env.type,
    "project_id": process.env.project_id,
    "private_key_id": process.env.private_key_id,
    "private_key": process.env.private_key ? JSON.parse(process.env.private_key) : undefined,
    "client_email": process.env.client_email,
    "client_id": process.env.client_id,
    "auth_uri": process.env.auth_uri,
    "token_uri": process.env.token_uri,
    "auth_provider_x509_cert_url": process.env.auth_provider_x509_cert_url,
    "client_x509_cert_url": process.env.client_x509_cert_url,
    "universe_domain": process.env.universe_domain
  }
}

class FirebaseConnection {
  constructor() {
    const firebaseConfig = {
        credential: admin.credential.cert(serviceAccount)
    };

    admin.initializeApp(firebaseConfig);
    this.db = admin.firestore();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new FirebaseConnection();
    }
    return this.instance;
  }
}

module.exports = FirebaseConnection;