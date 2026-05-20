const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
let serviceAccount = null;

function readEnv(key) {
  return process.env[key] ?? process.env[key.toUpperCase()];
}

function normalizePrivateKey(value) {
  if (!value) return undefined;

  // Netlify/environment vars often store PEM with escaped newlines.
  if (value.includes('\\n')) {
    return value.replace(/\\n/g, '\n');
  }

  // Accept JSON-stringified keys as well, but fallback to raw text.
  if (value.startsWith('"') || value.startsWith("'")) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }

  return value;
}

try {
  // Tenta ler o arquivo de configuração
  serviceAccount = require('../credenciais.json');
} catch (error) {
  // Se o arquivo de configuração não estiver disponível, use variáveis de ambiente
  console.log('Arquivo de configuração não encontrado. Usando variáveis de ambiente.');
  serviceAccount = {
    "type": readEnv('type'),
    "project_id": readEnv('project_id'),
    "private_key_id": readEnv('private_key_id'),
    "private_key": normalizePrivateKey(readEnv('private_key')),
    "client_email": readEnv('client_email'),
    "client_id": readEnv('client_id'),
    "auth_uri": readEnv('auth_uri'),
    "token_uri": readEnv('token_uri'),
    "auth_provider_x509_cert_url": readEnv('auth_provider_x509_cert_url'),
    "client_x509_cert_url": readEnv('client_x509_cert_url'),
    "universe_domain": readEnv('universe_domain')
  }
}

class FirebaseConnection {
  constructor() {
    const firebaseConfig = {
        credential: cert(serviceAccount)
    };

    if (!getApps().length) {
      initializeApp(firebaseConfig);
    }

    this.db = getFirestore();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new FirebaseConnection();
    }
    return this.instance;
  }
}

module.exports = FirebaseConnection;