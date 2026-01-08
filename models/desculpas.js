const FirebaseConnection = require('../db');
const cache = require('./cache');

class Desculpa {
    constructor({ jogadorId, jogadorNome, data, descricao }) {
        this.jogadorId = jogadorId;
        this.jogadorNome = jogadorNome;
        this.data = data;
        this.descricao = descricao;
    }

    async salvar() {
        try {
            const db = FirebaseConnection.getInstance().db;
            
            const desculpaRef = await db.collection('desculpas').add({
                jogadorId: this.jogadorId,
                jogadorNome: this.jogadorNome,
                data: this.data,
                descricao: this.descricao,
                dataCriacao: new Date().toISOString()
            });

            const desculpaDoc = await desculpaRef.get();
            if (desculpaDoc.exists) {
                const desculpaData = desculpaDoc.data();
                desculpaData.id = desculpaRef.id;

                // Invalidar cache
                cache.set('desculpas', null);

                return desculpaData;
            } else {
                console.log('Documento não encontrado.');
            }

        } catch (error) {
            throw new Error('Erro ao salvar desculpa: ' + error.message);
        }
    }

    static async obterTodas(filtros = {}) {
        try {
            const db = FirebaseConnection.getInstance().db;
            let query = db.collection('desculpas');

            // Aplicar filtros se fornecidos
            if (filtros.jogadorId) {
                query = query.where('jogadorId', '==', filtros.jogadorId);
            }

            if (filtros.dataInicial && filtros.dataFinal) {
                query = query.where('data', '>=', filtros.dataInicial)
                             .where('data', '<=', filtros.dataFinal);
            } else if (filtros.dataInicial) {
                query = query.where('data', '>=', filtros.dataInicial);
            } else if (filtros.dataFinal) {
                query = query.where('data', '<=', filtros.dataFinal);
            }

            const desculpasSnapshot = await query.orderBy('data', 'desc').get();

            const desculpas = desculpasSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return desculpas;
        } catch (error) {
            throw new Error('Erro ao obter desculpas: ' + error.message);
        }
    }

    static async obterPorId(id) {
        try {
            const db = FirebaseConnection.getInstance().db;
            const desculpaDoc = await db.collection('desculpas').doc(id).get();

            if (desculpaDoc.exists) {
                return {
                    id: desculpaDoc.id,
                    ...desculpaDoc.data()
                };
            } else {
                throw new Error('Desculpa não encontrada');
            }
        } catch (error) {
            throw new Error('Erro ao obter desculpa: ' + error.message);
        }
    }

    static async atualizar(id, dados) {
        try {
            const db = FirebaseConnection.getInstance().db;
            
            await db.collection('desculpas').doc(id).update({
                jogadorId: dados.jogadorId,
                jogadorNome: dados.jogadorNome,
                data: dados.data,
                descricao: dados.descricao,
                dataAtualizacao: new Date().toISOString()
            });

            // Invalidar cache
            cache.set('desculpas', null);

            const desculpaDoc = await db.collection('desculpas').doc(id).get();
            return {
                id: desculpaDoc.id,
                ...desculpaDoc.data()
            };
        } catch (error) {
            throw new Error('Erro ao atualizar desculpa: ' + error.message);
        }
    }

    static async excluir(id) {
        try {
            const db = FirebaseConnection.getInstance().db;
            await db.collection('desculpas').doc(id).delete();

            // Invalidar cache
            cache.set('desculpas', null);

            return { message: 'Desculpa excluída com sucesso' };
        } catch (error) {
            throw new Error('Erro ao excluir desculpa: ' + error.message);
        }
    }
}

module.exports = Desculpa;
