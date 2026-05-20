const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('node:fs');
const path = require('node:path');

let localServiceAccount = null;

const CREDENTIAL_FILE_NAMES = ['credenciais.json', 'credenciais-dev.json', 'credenciais-gat.json'];

function readEnv(key) {
  return process.env[key] ?? process.env[key.toUpperCase()];
}

function normalizePrivateKey(value) {
  if (!value) return undefined;
  if (value.includes('\\n')) return value.replace(/\\n/g, '\n');

  if (value.startsWith('"') || value.startsWith("'")) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

function findCredentialFile() {
  let currentDir = process.cwd();

  while (true) {
    for (const fileName of CREDENTIAL_FILE_NAMES) {
      const candidatePath = path.join(currentDir, fileName);
      if (fs.existsSync(candidatePath)) {
        return candidatePath;
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

function loadServiceAccount() {
  if (localServiceAccount) {
    return localServiceAccount;
  }

  const localCredentialsPath = findCredentialFile();
  if (localCredentialsPath) {
    try {
      const raw = fs.readFileSync(localCredentialsPath, 'utf8');
      localServiceAccount = JSON.parse(raw);
      return localServiceAccount;
    } catch {
      // Continua para fallback em variaveis de ambiente.
    }
  }

  return {
    type: readEnv('type'),
    project_id: readEnv('project_id'),
    private_key_id: readEnv('private_key_id'),
    private_key: normalizePrivateKey(readEnv('private_key')),
    client_email: readEnv('client_email'),
    client_id: readEnv('client_id'),
    auth_uri: readEnv('auth_uri'),
    token_uri: readEnv('token_uri'),
    auth_provider_x509_cert_url: readEnv('auth_provider_x509_cert_url'),
    client_x509_cert_url: readEnv('client_x509_cert_url'),
    universe_domain: readEnv('universe_domain'),
  };
}

class FirebaseConnection {
  constructor() {
    const serviceAccount = loadServiceAccount();
    const firebaseConfig = { credential: cert(serviceAccount) };

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
