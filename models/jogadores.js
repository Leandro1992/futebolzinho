// models/Jogador.js
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
                mensalista: this.mensalista
            });
             const jogadorDoc = await jogadorRef.get();
             if (jogadorDoc.exists) {
                 const jogadorData = jogadorDoc.data();
                 jogadorData.id = jogadorRef.id;
                 console.log('Dados criados do jogador:', jogadorData);

                // Atualizar cache
                const jogadores = cache.get('jogadores') || [];
                jogadores.push(jogadorData);
                cache.set('jogadores', jogadores);

                return jogadorData
             } else {
                 console.log('Documento não encontrado.');
             }

        } catch (error) {
            throw new Error('Erro ao salvar jogador: ' + error.message);
        }
    }

    async atualizarDados({ id, nome, mensalista }) {
        try {
            const db = FirebaseConnection.getInstance().db;
            await db.collection('jogadores').doc(id).update({
                nome: nome,
                mensalista: mensalista
            });

            const jogadorDoc = await db.collection('jogadores').doc(id).get();

            if (jogadorDoc.exists) {
                const jogadorData = jogadorDoc.data();
                console.log('Dados atualizados do jogador:', jogadorData);
                // Atualizar cache
                const jogadores = cache.get('jogadores') || [];
                const index = jogadores.findIndex(j => j.id === id);
                if (index !== -1) {
                    jogadores[index] = { id, nome, mensalista };
                }
                cache.set('jogadores', jogadores);

                return jogadorData;
            } else {
                console.log('Documento não encontrado.');
            }
        } catch (error) {
            throw new Error('Erro ao atualizar dados do jogador: ' + error.message);
        }
    }
   
    async atualizarEstatiscasJogadores({ id, jogos, gols, assistencias, vitorias, derrotas, empate, destaque }) {
        try {
            const db = FirebaseConnection.getInstance().db;
            await db.collection('jogadores').doc(id).update({
                jogos: jogos,
                gols: gols,
                assistencias: assistencias,
                vitorias: vitorias,
                derrotas: derrotas,
                empate: empate,
                destaque: destaque,
            });

            const jogadorDoc = await db.collection('jogadores').doc(id).get();

            if (jogadorDoc.exists) {
                const jogadorData = jogadorDoc.data();
                console.log('Dados atualizados do jogador:', jogadorData);
                // Atualizar cache
                const jogadores = cache.get('jogadores') || [];
                const index = jogadores.findIndex(j => j.id === id);
                if (index !== -1) {
                    jogadores[index] = { id, nome, mensalista };
                }
                cache.set('jogadores', jogadores);

                return jogadorData;
            } else {
                console.log('Documento não encontrado.');
            }
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
            const jogadores = jogadoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            cache.set('jogadores', jogadores);
            return jogadores
        } catch (error) {
            throw new Error('Erro ao obter jogadores: ' + error.message);
        }
    }

    // Adicione métodos de atualização e exclusão conforme necessário
}
module.exports = Jogador;