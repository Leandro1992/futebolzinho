// models/times.js
const FirebaseConnection = require('../db');
const cache = require('./cache');

class Time {
    constructor({ nome, cor, escudo }) {
        this.nome = nome;
        this.cor = cor || '#000000';
        this.escudo = escudo || null;
    }

    async salvar() {
        try {
            const db = FirebaseConnection.getInstance().db;
            const timeRef = await db.collection('times').add({
                nome: this.nome,
                cor: this.cor,
                escudo: this.escudo,
                criadoEm: new Date().toISOString()
            });
            
            const timeDoc = await timeRef.get();
            if (timeDoc.exists) {
                const timeData = timeDoc.data();
                timeData.id = timeRef.id;

                // Atualizar cache
                const times = cache.get('times') || [];
                times.push(timeData);
                cache.set('times', times);

                return timeData;
            } else {
                throw new Error('Documento não encontrado após criação.');
            }
        } catch (error) {
            throw new Error('Erro ao salvar time: ' + error.message);
        }
    }

    async atualizarDados({ id, nome, cor, escudo }) {
        try {
            const db = FirebaseConnection.getInstance().db;
            const updateData = {
                nome: nome,
                cor: cor,
                atualizadoEm: new Date().toISOString()
            };
            
            if (escudo !== undefined) {
                updateData.escudo = escudo;
            }

            await db.collection('times').doc(id).update(updateData);

            const timeDoc = await db.collection('times').doc(id).get();

            if (timeDoc.exists) {
                const timeData = { id, ...timeDoc.data() };
                
                // Atualizar cache
                const times = cache.get('times') || [];
                const index = times.findIndex(t => t.id === id);
                if (index !== -1) {
                    times[index] = timeData;
                }
                cache.set('times', times);

                return timeData;
            } else {
                throw new Error('Time não encontrado.');
            }
        } catch (error) {
            throw new Error('Erro ao atualizar dados do time: ' + error.message);
        }
    }

    static async obterTodos() {
        const cachedTimes = cache.get('times');
        if (cachedTimes) {
            return cachedTimes;
        }

        try {
            const db = FirebaseConnection.getInstance().db;
            const timesSnapshot = await db.collection('times').get();
            const times = timesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            cache.set('times', times);
            return times;
        } catch (error) {
            throw new Error('Erro ao obter times: ' + error.message);
        }
    }

    static async buscarPorId(id) {
        try {
            const db = FirebaseConnection.getInstance().db;
            const timeDoc = await db.collection('times').doc(id).get();

            if (timeDoc.exists) {
                return { id: timeDoc.id, ...timeDoc.data() };
            } else {
                throw new Error('Time não encontrado.');
            }
        } catch (error) {
            throw new Error('Erro ao buscar time: ' + error.message);
        }
    }

    static async excluir(id) {
        try {
            const db = FirebaseConnection.getInstance().db;
            
            // Verificar se há jogadores vinculados ao time
            const jogadoresSnapshot = await db.collection('jogadores')
                .where('timeRef', '==', db.doc(`times/${id}`))
                .get();

            if (!jogadoresSnapshot.empty) {
                throw new Error('Não é possível excluir um time com jogadores vinculados.');
            }

            await db.collection('times').doc(id).delete();

            // Atualizar cache
            const times = cache.get('times') || [];
            const updatedTimes = times.filter(t => t.id !== id);
            cache.set('times', updatedTimes);

            return { message: 'Time excluído com sucesso.' };
        } catch (error) {
            throw new Error('Erro ao excluir time: ' + error.message);
        }
    }
}

module.exports = Time;
