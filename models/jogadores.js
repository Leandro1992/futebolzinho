// models/Jogador.js
const FirebaseConnection = require('../db');

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
                return jogadorData
            } else {
                console.log('Documento não encontrado.');
            }
        } catch (error) {
            throw new Error('Erro ao atualizar dados do jogador: ' + error.message);
        }
    }


    static async obterTodos() {
        try {
            const db = FirebaseConnection.getInstance().db;
            const jogadoresSnapshot = await db.collection('jogadores').get();
            return jogadoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            throw new Error('Erro ao obter jogadores: ' + error.message);
        }
    }

    // Adicione métodos de atualização e exclusão conforme necessário
}

module.exports = Jogador;