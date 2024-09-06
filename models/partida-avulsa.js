const FirebaseConnection = require('../db');
const cache = require('./cache');

class PartidaAvulsa {
    constructor({ data, local, nome, jogadores, encerrada }) {
        this.data = data;
        this.local = local;
        this.nome = nome;
        this.encerrada = encerrada;
        this.jogadores = jogadores;
    }

    async salvar() {
        try {
            const db = FirebaseConnection.getInstance().db;

            const partidaRef = await db.collection('partidas-avulsas').add({
                data: this.data,
                local: this.local,
                nome: this.nome,
                encerrada: this.encerrada,
                jogadores: this.jogadores
            });

            return partidaRef.id;
        } catch (error) {
            throw new Error('Erro ao salvar partida: ' + error.message);
        }
    }

    static async obterTodas() {
        try {
            const db = FirebaseConnection.getInstance().db;
            const partidasAvulsaSnapshot = await db.collection('partidas-avulsas').get();
            const partidas = await Promise.all(partidasAvulsaSnapshot.docs.map(async doc => {
                const partidaData = {id: doc.id, ...doc.data()};
                return partidaData;
            }));
            return partidas;
        } catch (error) {
            throw new Error('Erro ao obter partidas avulsas ' + error.message);
        }
    }

    static async atualizarPartida({ id, data, local, nome, jogadores, encerrada  }) {
        try {
            const db = FirebaseConnection.getInstance().db;
            await db.collection('partidas-avulsas').doc(id).update({
                data,
                local,
                nome,
                jogadores,
                encerrada
            });

            return 'Dados atualizados com sucesso';
        } catch (error) {
            throw new Error('Erro ao atualizar dados do jogador: ' + error.message);
        }
    }
}

module.exports = PartidaAvulsa;
