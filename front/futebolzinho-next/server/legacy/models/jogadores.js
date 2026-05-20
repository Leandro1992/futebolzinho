const FirebaseConnection = require('../db');
const cache = require('./cache');

class Jogador {
  constructor({ nome, mensalista }) {
    this.nome = nome;
    this.mensalista = mensalista;
  }

  async salvar() {
    try {
      const db = FirebaseConnection.getInstance().db;
      const jogadorRef = await db.collection('jogadores').add({
        nome: this.nome,
        mensalista: this.mensalista,
      });
      const jogadorDoc = await jogadorRef.get();
      if (jogadorDoc.exists) {
        const jogadorData = jogadorDoc.data();
        jogadorData.id = jogadorRef.id;

        const jogadores = cache.get('jogadores') || [];
        jogadores.push(jogadorData);
        cache.set('jogadores', jogadores);

        return jogadorData;
      }

      throw new Error('Documento nao encontrado.');
    } catch (error) {
      throw new Error('Erro ao salvar jogador: ' + error.message);
    }
  }

  async atualizarDados({ id, nome, mensalista }) {
    try {
      const db = FirebaseConnection.getInstance().db;
      await db.collection('jogadores').doc(id).update({ nome, mensalista });

      const jogadorDoc = await db.collection('jogadores').doc(id).get();

      if (jogadorDoc.exists) {
        const jogadorData = jogadorDoc.data();
        const jogadores = cache.get('jogadores') || [];
        const index = jogadores.findIndex((j) => j.id === id);
        if (index !== -1) {
          jogadores[index] = { id, nome, mensalista };
        }
        cache.set('jogadores', jogadores);

        return jogadorData;
      }

      throw new Error('Documento nao encontrado.');
    } catch (error) {
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
