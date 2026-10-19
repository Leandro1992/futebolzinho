const FirebaseConnection = require('../db');
const cache = require('./cache');

function nomeExibicao(nome) {
  return String(nome ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
}

function nomeChave(nome) {
  return nomeExibicao(nome).toLocaleLowerCase('pt-BR').replace(/\//g, '-');
}

class NomeDuplicadoError extends Error {
  constructor() {
    super('Já existe um jogador com esse nome');
    this.statusCode = 409;
  }
}

class Jogador {
  constructor({ nome, mensalista }) {
    this.nome = nome;
    this.mensalista = mensalista;
  }

  async salvar() {
    const nome = nomeExibicao(this.nome);
    const chave = nomeChave(nome);
    if (!chave) {
      const error = new Error('Nome do jogador é obrigatório');
      error.statusCode = 400;
      throw error;
    }

    try {
      const db = FirebaseConnection.getInstance().db;
      const jogadorRef = db.collection('jogadores').doc();
      const lockRef = db.collection('jogadores_nomes').doc(chave);
      const mensalista = Boolean(this.mensalista);

      await db.runTransaction(async (transaction) => {
        const lock = await transaction.get(lockRef);
        if (lock.exists) {
          throw new NomeDuplicadoError();
        }

        transaction.set(jogadorRef, { nome, nomeChave: chave, mensalista });
        transaction.set(lockRef, { jogadorId: jogadorRef.id, nome });
      });

      cache.delete('jogadores');
      cache.delete('partidas');
      cache.deletePrefix('estatisticasPartidas:');
      return { id: jogadorRef.id, nome, nomeChave: chave, mensalista };
    } catch (error) {
      if (error.statusCode) throw error;
      throw new Error('Erro ao salvar jogador: ' + error.message);
    }
  }

  async atualizarDados({ id, nome, mensalista }) {
    const nomeLimpo = nomeExibicao(nome);
    const chave = nomeChave(nomeLimpo);
    if (!id || !chave) {
      const error = new Error('Nome do jogador é obrigatório');
      error.statusCode = 400;
      throw error;
    }

    try {
      const db = FirebaseConnection.getInstance().db;
      const jogadorRef = db.collection('jogadores').doc(id);
      const lockRef = db.collection('jogadores_nomes').doc(chave);
      const mensalistaAtual = Boolean(mensalista);

      await db.runTransaction(async (transaction) => {
        const atual = await transaction.get(jogadorRef);
        if (!atual.exists) {
          const error = new Error('Jogador não encontrado');
          error.statusCode = 404;
          throw error;
        }

        const dadosAtuais = atual.data();
        const chaveAntiga = dadosAtuais.nomeChave || nomeChave(dadosAtuais.nome);
        const lock = await transaction.get(lockRef);
        if (lock.exists && lock.data().jogadorId !== id) {
          throw new NomeDuplicadoError();
        }

        if (chaveAntiga && chaveAntiga !== chave) {
          transaction.delete(db.collection('jogadores_nomes').doc(chaveAntiga));
        }

        transaction.set(lockRef, { jogadorId: id, nome: nomeLimpo });
        transaction.update(jogadorRef, {
          nome: nomeLimpo,
          nomeChave: chave,
          mensalista: mensalistaAtual,
        });
      });

      cache.delete('jogadores');
      cache.delete('partidas');
      cache.deletePrefix('estatisticasPartidas:');
      return { id, nome: nomeLimpo, nomeChave: chave, mensalista: mensalistaAtual };
    } catch (error) {
      if (error.statusCode) throw error;
      throw new Error('Erro ao atualizar dados do jogador: ' + error.message);
    }
  }

  static async obterTodos() {
    const cachedJogadores = cache.get('jogadores');
    if (cachedJogadores) {
      return cachedJogadores;
    }

    try {
      const db = FirebaseConnection.getInstance().db;
      const jogadoresSnapshot = await db.collection('jogadores').get();
      const jogadores = jogadoresSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      cache.set('jogadores', jogadores);
      return jogadores;
    } catch (error) {
      throw new Error('Erro ao obter jogadores: ' + error.message);
    }
  }
}

module.exports = Jogador;
